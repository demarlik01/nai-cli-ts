import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { constants as fsConstants } from "node:fs";
import { Command } from "commander";

import { createRuntimeContext } from "../core/context.js";
import { ConfigError, IoError, ValidationError } from "../core/errors.js";
import { loadImageAsBase64, loadImageDimensions } from "../io/image.js";
import { createNovelAiClient } from "../novelai/client.js";
import { ENDPOINTS } from "../novelai/endpoints.js";
import { buildUpscalePayload } from "../novelai/payload/upscale.js";
import { parseNovelAiResponse } from "../novelai/response.js";
import type { GlobalCliOptions, UpscaleCommandOptions } from "../types/commands.js";

function resolveGlobalOptions(command: Command): GlobalCliOptions {
  const commandWithGlobals = command as Command & {
    optsWithGlobals?: () => unknown;
  };
  const raw = commandWithGlobals.optsWithGlobals?.() ?? command.parent?.opts() ?? {};
  return raw as GlobalCliOptions;
}

function parseIntegerOption(value: string, label: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    throw new ValidationError(`${label} must be an integer.`);
  }
  return parsed;
}

function sanitizeToken(value: string): string {
  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned || "upscaled";
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await access(targetPath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function resolveAvailablePath(outputDir: string, baseName: string, extension: string): Promise<string> {
  const candidate = path.join(outputDir, `${baseName}${extension}`);
  if (!(await pathExists(candidate))) {
    return candidate;
  }

  let suffix = 1;
  while (true) {
    const withSuffix = path.join(outputDir, `${baseName}-${suffix}${extension}`);
    if (!(await pathExists(withSuffix))) {
      return withSuffix;
    }
    suffix += 1;
  }
}

export function registerUpscaleCommand(program: Command): void {
  program
    .command("upscale")
    .description("Upscale an input image")
    .requiredOption("--image <path>", "Input image path")
    .option("--scale <number>", "Upscale factor", (value: string) =>
      parseIntegerOption(value, "scale"),
    )
    .option("--out <dir>", "Output directory")
    .action(async (options: UpscaleCommandOptions, command: Command) => {
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

      const scale = options.scale ?? 4;
      if (!Number.isFinite(scale) || scale <= 0) {
        throw new ValidationError("scale must be a positive integer.");
      }

      const inputImage = await loadImageAsBase64(options.image);
      const dimensions = await loadImageDimensions(options.image);
      const payload = buildUpscalePayload({
        image: inputImage.base64,
        width: dimensions.width,
        height: dimensions.height,
        scale,
      });

      const client = createNovelAiClient({
        token: context.config.apiToken,
        timeoutMs: context.config.requestTimeoutMs,
        maxRetries: context.config.maxRetries,
        debug: context.debug,
        onDebug: (message) => context.logger.debug(message),
      });

      const response = await client.postJson(ENDPOINTS.upscale, payload);
      const parsed = await parseNovelAiResponse(response);

      if (parsed.kind === "json") {
        console.log(JSON.stringify(parsed.data, null, 2));
        return;
      }

      const outputDir = options.out ?? context.config.defaultOutputDir;
      await mkdir(outputDir, { recursive: true });

      const sourceName = sanitizeToken(path.parse(options.image).name);
      const items =
        parsed.kind === "png"
          ? [{ image: parsed.image, extension: ".png" }]
          : parsed.images.map((entry) => ({
              image: entry.data,
              extension: path.extname(entry.name) || ".png",
            }));

      if (items.length === 0) {
        throw new ValidationError("Upscale response did not contain any image files.");
      }

      for (const [index, item] of items.entries()) {
        const baseName = `${sourceName}-upscale-x${scale}-img-${String(index + 1).padStart(2, "0")}`;
        const imagePath = await resolveAvailablePath(outputDir, baseName, item.extension);
        try {
          await writeFile(imagePath, item.image);
        } catch (error) {
          if (error instanceof Error) {
            throw new IoError(`Failed to write upscale output to '${imagePath}': ${error.message}`, {
              cause: error,
            });
          }
          throw new IoError(`Failed to write upscale output to '${imagePath}'.`);
        }
        console.log(imagePath);
      }
    });
}
