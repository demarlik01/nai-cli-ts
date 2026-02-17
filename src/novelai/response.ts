import { ValidationError } from "../core/errors.js";
import { unzipBuffer } from "../io/zip.js";
import type { NormalizedNovelAiResponse, ParsedZipFile } from "../types/api.js";

function looksLikeZip(buffer: Buffer): boolean {
  return (
    buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04
  );
}

function looksLikePng(buffer: Buffer): boolean {
  return (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  );
}

function isLikelyJson(buffer: Buffer): boolean {
  const text = buffer.toString("utf8").trimStart();
  return text.startsWith("{") || text.startsWith("[");
}

function parseJsonBuffer(buffer: Buffer): unknown {
  const text = buffer.toString("utf8");
  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    throw new ValidationError("Response body looked like JSON but could not be parsed.", {
      cause: error,
    });
  }
}

function splitZipFiles(entries: ParsedZipFile[]): {
  images: ParsedZipFile[];
  metadataFiles: ParsedZipFile[];
} {
  const images: ParsedZipFile[] = [];
  const metadataFiles: ParsedZipFile[] = [];

  for (const entry of entries) {
    if (entry.name.toLowerCase().endsWith(".png")) {
      images.push(entry);
    } else {
      metadataFiles.push(entry);
    }
  }

  images.sort((a, b) => a.name.localeCompare(b.name));
  metadataFiles.sort((a, b) => a.name.localeCompare(b.name));

  return { images, metadataFiles };
}

export async function parseNovelAiResponse(response: Response): Promise<NormalizedNovelAiResponse> {
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  const raw = Buffer.from(await response.arrayBuffer());

  if (contentType.includes("application/json") || isLikelyJson(raw)) {
    return {
      kind: "json",
      data: parseJsonBuffer(raw),
    };
  }

  if (contentType.includes("application/zip") || looksLikeZip(raw)) {
    const entries = unzipBuffer(raw).map((entry) => ({
      name: entry.name,
      data: Buffer.from(entry.data),
    }));
    const { images, metadataFiles } = splitZipFiles(entries);

    return {
      kind: "zip",
      images,
      metadataFiles,
    };
  }

  if (contentType.includes("image/png") || looksLikePng(raw)) {
    return {
      kind: "png",
      image: raw,
    };
  }

  throw new ValidationError(
    `Unsupported response type '${contentType || "unknown"}' from NovelAI.`,
  );
}
