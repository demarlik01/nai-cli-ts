import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { constants as fsConstants } from "node:fs";

import { IoError, ValidationError } from "./errors.js";
import type { NormalizedNovelAiResponse } from "../types/api.js";

export interface WriteGenerationOutputOptions {
  outputDir: string;
  model: string;
  seed: number;
  prompt: string;
  negativePrompt?: string | undefined;
  requestPayload: unknown;
  response: Extract<NormalizedNovelAiResponse, { kind: "zip" | "png" }>;
  now?: (() => Date) | undefined;
}

export interface OutputArtifact {
  imagePath: string;
  metadataPath: string;
}

export interface WriteGenerationOutputResult {
  outputDir: string;
  artifacts: OutputArtifact[];
}

function sanitizeFileToken(value: string): string {
  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned || "unknown";
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await access(targetPath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function resolveAvailableBasePath(
  basePath: string,
  imageExtension: string,
): Promise<string> {
  const hasBaseCollision =
    (await pathExists(`${basePath}${imageExtension}`)) || (await pathExists(`${basePath}.json`));
  if (!hasBaseCollision) {
    return basePath;
  }

  let suffix = 1;
  while (true) {
    const candidate = `${basePath}-${suffix}`;
    const hasCollision =
      (await pathExists(`${candidate}${imageExtension}`)) || (await pathExists(`${candidate}.json`));
    if (!hasCollision) {
      return candidate;
    }
    suffix += 1;
  }
}

function buildMetadata(options: WriteGenerationOutputOptions, index: number): Record<string, unknown> {
  return {
    generatedAt: (options.now ?? (() => new Date()))().toISOString(),
    model: options.model,
    seed: options.seed,
    imageIndex: index + 1,
    prompt: options.prompt,
    negativePrompt: options.negativePrompt ?? null,
    request: options.requestPayload,
    responseKind: options.response.kind,
  };
}

export async function writeGenerationOutput(
  options: WriteGenerationOutputOptions,
): Promise<WriteGenerationOutputResult> {
  await mkdir(options.outputDir, { recursive: true });

  const modelToken = sanitizeFileToken(options.model);
  const seedToken = String(options.seed);
  const artifacts: OutputArtifact[] = [];

  const items =
    options.response.kind === "zip"
      ? options.response.images.map((entry) => ({
          image: entry.data,
          extension: path.extname(entry.name) || ".png",
        }))
      : [{ image: options.response.image, extension: ".png" }];

  if (items.length === 0) {
    throw new ValidationError("NovelAI ZIP response did not contain any image files.");
  }

  for (const [index, item] of items.entries()) {
    const baseName = `${modelToken}-seed-${seedToken}-img-${String(index + 1).padStart(2, "0")}`;
    const initialBasePath = path.join(options.outputDir, baseName);
    const availableBasePath = await resolveAvailableBasePath(initialBasePath, item.extension);
    const imagePath = `${availableBasePath}${item.extension}`;
    const metadataPath = `${availableBasePath}.json`;

    try {
      await writeFile(imagePath, item.image);
      await writeFile(
        metadataPath,
        `${JSON.stringify(buildMetadata(options, index), null, 2)}\n`,
        "utf8",
      );
    } catch (error) {
      if (error instanceof Error) {
        throw new IoError(`Failed to write output files to '${options.outputDir}': ${error.message}`, {
          cause: error,
        });
      }
      throw new IoError(`Failed to write output files to '${options.outputDir}'.`);
    }

    artifacts.push({
      imagePath,
      metadataPath,
    });
  }

  return {
    outputDir: options.outputDir,
    artifacts,
  };
}
