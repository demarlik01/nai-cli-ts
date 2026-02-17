import { ApiError, NetworkError } from "../core/errors.js";
import type { ApiErrorPayload } from "../types/api.js";
import { NOVELAI_BASE_URL } from "./endpoints.js";

export interface NovelAiClientOptions {
  token: string;
  baseUrl?: string;
  timeoutMs?: number;
  maxRetries?: number;
  debug?: boolean;
  onDebug?: (message: string) => void;
  fetchImpl?: typeof fetch;
}

export interface PostJsonOptions {
  signal?: AbortSignal;
}

export interface NovelAiClient {
  postJson(endpoint: string, body: unknown, options?: PostJsonOptions): Promise<Response>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function parseRetryAfterMs(response: Response): number | null {
  const retryAfter = response.headers.get("retry-after");
  if (!retryAfter) {
    return null;
  }

  const asSeconds = Number(retryAfter);
  if (!Number.isNaN(asSeconds) && asSeconds >= 0) {
    return asSeconds * 1_000;
  }

  const retryDate = Date.parse(retryAfter);
  if (Number.isNaN(retryDate)) {
    return null;
  }

  return Math.max(0, retryDate - Date.now());
}

function backoffMs(attempt: number, response?: Response): number {
  const retryAfterMs = response ? parseRetryAfterMs(response) : null;
  if (retryAfterMs !== null) {
    return Math.min(30_000, retryAfterMs);
  }
  return Math.min(5_000, 300 * 2 ** attempt);
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 503;
}

function resolveErrorMessage(status: number, payload: ApiErrorPayload | null): string {
  if (!payload) {
    return `NovelAI request failed with status ${status}.`;
  }
  const fromPayload =
    typeof payload.message === "string"
      ? payload.message
      : typeof payload.error === "string"
        ? payload.error
        : typeof payload.detail === "string"
          ? payload.detail
          : null;
  if (fromPayload) {
    return fromPayload;
  }
  return `NovelAI request failed with status ${status}.`;
}

async function readApiErrorPayload(response: Response): Promise<ApiErrorPayload | null> {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    const parsed = JSON.parse(text) as unknown;
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed as ApiErrorPayload;
    }
  } catch {
    // Some endpoints return text/plain on errors.
  }

  return { message: text };
}

function normalizeNetworkError(
  error: unknown,
  timeoutMs: number,
  endpoint: string,
): NetworkError {
  if (error instanceof Error && error.name === "AbortError") {
    return new NetworkError(
      `Request to '${endpoint}' timed out after ${timeoutMs}ms.`,
      { cause: error },
    );
  }

  if (error instanceof Error) {
    return new NetworkError(`Network request to '${endpoint}' failed: ${error.message}`, {
      cause: error,
    });
  }

  return new NetworkError(`Network request to '${endpoint}' failed.`);
}

export function createNovelAiClient(options: NovelAiClientOptions): NovelAiClient {
  const baseUrl = options.baseUrl ?? NOVELAI_BASE_URL;
  const timeoutMs = options.timeoutMs ?? 60_000;
  const maxRetries = options.maxRetries ?? 3;
  const fetchImpl = options.fetchImpl ?? fetch;
  const debugLog = options.onDebug ?? ((message: string) => {
    if (options.debug) {
      console.error("[debug]", message);
    }
  });

  async function postJson(
    endpoint: string,
    body: unknown,
    requestOptions: PostJsonOptions = {},
  ): Promise<Response> {
    const url = new URL(endpoint, baseUrl).toString();

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, timeoutMs);

      let abortListener: (() => void) | undefined;
      if (requestOptions.signal) {
        if (requestOptions.signal.aborted) {
          clearTimeout(timeoutId);
          throw new NetworkError(`Request to '${endpoint}' was aborted.`);
        }
        abortListener = () => {
          controller.abort();
        };
        requestOptions.signal.addEventListener("abort", abortListener, { once: true });
      }

      try {
        const response = await fetchImpl(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${options.token}`,
            "Content-Type": "application/json",
            Accept: "*/*",
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (response.ok) {
          return response;
        }

        if (isRetryableStatus(response.status) && attempt < maxRetries) {
          const delayMs = backoffMs(attempt, response);
          debugLog(
            `Retrying ${endpoint} after status ${response.status} (attempt ${attempt + 1}/${maxRetries}) in ${delayMs}ms.`,
          );
          await sleep(delayMs);
          continue;
        }

        const payload = await readApiErrorPayload(response);
        throw new ApiError(resolveErrorMessage(response.status, payload), {
          status: response.status,
          endpoint,
          details: payload,
        });
      } catch (error) {
        if (error instanceof ApiError) {
          throw error;
        }

        if (error instanceof NetworkError) {
          throw error;
        }

        if (attempt < maxRetries) {
          const delayMs = backoffMs(attempt);
          debugLog(
            `Retrying ${endpoint} after network error (attempt ${attempt + 1}/${maxRetries}) in ${delayMs}ms.`,
          );
          await sleep(delayMs);
          continue;
        }

        throw normalizeNetworkError(error, timeoutMs, endpoint);
      } finally {
        clearTimeout(timeoutId);
        if (requestOptions.signal && abortListener) {
          requestOptions.signal.removeEventListener("abort", abortListener);
        }
      }
    }

    throw new NetworkError(`Request to '${endpoint}' exhausted retries.`);
  }

  return {
    postJson,
  };
}
