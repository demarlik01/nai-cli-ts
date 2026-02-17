import { Command } from "commander";

import { createRuntimeContext } from "../core/context.js";
import { ConfigError, ValidationError } from "../core/errors.js";
import { createNovelAiClient } from "../novelai/client.js";
import { ENDPOINTS } from "../novelai/endpoints.js";
import { parseNovelAiResponse } from "../novelai/response.js";
import type { GlobalCliOptions, SuggestTagsCommandOptions } from "../types/commands.js";

interface SuggestedTagRow {
  tag: string;
  confidence: string;
}

function resolveGlobalOptions(command: Command): GlobalCliOptions {
  const commandWithGlobals = command as Command & {
    optsWithGlobals?: () => unknown;
  };
  const raw = commandWithGlobals.optsWithGlobals?.() ?? command.parent?.opts() ?? {};
  return raw as GlobalCliOptions;
}

function parseFormatOption(value: string): "json" | "table" {
  if (value === "json" || value === "table") {
    return value;
  }
  throw new ValidationError("format must be either 'json' or 'table'.");
}

function parseLangOption(value: string): "en" | "jp" {
  if (value === "en" || value === "jp") {
    return value;
  }
  throw new ValidationError("lang must be either 'en' or 'jp'.");
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function findTagLabel(value: Record<string, unknown>): string | null {
  for (const key of ["tag", "text", "label", "name"]) {
    const candidate = value[key];
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }
  return null;
}

function findConfidence(value: Record<string, unknown>): string {
  for (const key of ["confidence", "score", "probability"]) {
    const candidate = value[key];
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return candidate.toFixed(4);
    }
  }
  return "-";
}

function extractRows(data: unknown): SuggestedTagRow[] {
  const tags = isObject(data) ? data["tags"] : undefined;
  const source =
    Array.isArray(data)
      ? data
      : Array.isArray(tags)
        ? tags
        : [];

  return source
    .map((entry) => {
      if (typeof entry === "string") {
        return { tag: entry, confidence: "-" };
      }
      if (isObject(entry)) {
        const label = findTagLabel(entry);
        if (label) {
          return { tag: label, confidence: findConfidence(entry) };
        }
      }
      return null;
    })
    .filter((row): row is SuggestedTagRow => row !== null);
}

function printTagTable(rows: SuggestedTagRow[]): void {
  if (rows.length === 0) {
    console.log("No tags returned.");
    return;
  }

  const indexHeader = "#";
  const tagHeader = "Tag";
  const confidenceHeader = "Confidence";

  const indexWidth = Math.max(indexHeader.length, String(rows.length).length);
  const tagWidth = Math.max(tagHeader.length, ...rows.map((row) => row.tag.length));
  const confidenceWidth = Math.max(
    confidenceHeader.length,
    ...rows.map((row) => row.confidence.length),
  );

  const header = `${indexHeader.padEnd(indexWidth)}  ${tagHeader.padEnd(tagWidth)}  ${confidenceHeader.padEnd(confidenceWidth)}`;
  const separator = `${"-".repeat(indexWidth)}  ${"-".repeat(tagWidth)}  ${"-".repeat(confidenceWidth)}`;
  console.log(header);
  console.log(separator);

  for (const [index, row] of rows.entries()) {
    const line = `${String(index + 1).padEnd(indexWidth)}  ${row.tag.padEnd(tagWidth)}  ${row.confidence.padEnd(confidenceWidth)}`;
    console.log(line);
  }
}

export function registerSuggestTagsCommand(program: Command): void {
  program
    .command("suggest-tags")
    .description("Suggest prompt tags for a model")
    .requiredOption("--prompt <text>", "Prompt text")
    .option("--model <id>", "Model ID from registry")
    .option("--lang <code>", "Tag language (en|jp)", parseLangOption)
    .option("--format <type>", "Output format (json|table)", parseFormatOption)
    .action(async (options: SuggestTagsCommandOptions, command: Command) => {
      const globals = resolveGlobalOptions(command);
      const context = await createRuntimeContext({
        debug: globals.debug,
        configPath: globals.config,
      });

      if (!context.config.apiToken) {
        throw new ConfigError(
          "API token is not configured. Set it with 'nai config set-token <TOKEN>'.",
        );
      }

      const params: Record<string, string> = {
        model: options.model ?? context.config.defaultModel,
        prompt: options.prompt,
      };
      if (options.lang) {
        params["lang"] = options.lang;
      }

      const client = createNovelAiClient({
        token: context.config.apiToken,
        timeoutMs: context.config.requestTimeoutMs,
        maxRetries: context.config.maxRetries,
        debug: context.debug,
        onDebug: (message) => context.logger.debug(message),
      });

      const response = await client.getJson(
        ENDPOINTS.suggestTags.path,
        params,
        undefined,
        ENDPOINTS.suggestTags.host,
      );
      const parsed = await parseNovelAiResponse(response);

      if (parsed.kind !== "json") {
        throw new ValidationError("Suggest-tags endpoint returned a non-JSON response.");
      }

      if (options.format === "json") {
        console.log(JSON.stringify(parsed.data, null, 2));
        return;
      }

      const rows = extractRows(parsed.data);
      if (rows.length === 0) {
        console.log(JSON.stringify(parsed.data, null, 2));
        return;
      }
      printTagTable(rows);
    });
}
