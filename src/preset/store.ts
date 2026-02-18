import { mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { ZodError } from "zod";

import { getConfigDirPath } from "../config/paths.js";
import { IoError, ValidationError } from "../core/errors.js";
import { presetSchema, type Preset } from "./schema.js";

function getPresetsDir(env: NodeJS.ProcessEnv = process.env): string {
  return path.join(getConfigDirPath(env), "presets");
}

function presetFilePath(name: string, env?: NodeJS.ProcessEnv): string {
  return path.join(getPresetsDir(env), `${name}.json`);
}

function validatePresetName(name: string): void {
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    throw new ValidationError(
      "Preset name must contain only alphanumeric characters, hyphens, and underscores.",
    );
  }
}

export async function savePreset(preset: Preset, env?: NodeJS.ProcessEnv): Promise<string> {
  validatePresetName(preset.name);
  const parsed = presetSchema.parse(preset);
  const dir = getPresetsDir(env);
  await mkdir(dir, { recursive: true });
  const filePath = presetFilePath(parsed.name, env);
  await writeFile(filePath, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
  return filePath;
}

export async function loadPreset(name: string, env?: NodeJS.ProcessEnv): Promise<Preset> {
  validatePresetName(name);
  const filePath = presetFilePath(name, env);

  let raw: string;
  try {
    raw = await readFile(filePath, "utf8");
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error) {
      const fsError = error as NodeJS.ErrnoException;
      if (fsError.code === "ENOENT") {
        throw new ValidationError(`Preset '${name}' not found.`);
      }
    }
    throw new IoError(`Failed to read preset '${name}'.`, { cause: error });
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return presetSchema.parse(parsed);
  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.issues
        .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
        .join("; ");
      throw new ValidationError(`Invalid preset '${name}': ${details}`, { cause: error });
    }
    if (error instanceof SyntaxError) {
      throw new ValidationError(`Preset '${name}' is not valid JSON.`, { cause: error });
    }
    throw error;
  }
}

export async function listPresets(env?: NodeJS.ProcessEnv): Promise<string[]> {
  const dir = getPresetsDir(env);
  try {
    const files = await readdir(dir);
    return files
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(/\.json$/, ""))
      .sort();
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error) {
      const fsError = error as NodeJS.ErrnoException;
      if (fsError.code === "ENOENT") {
        return [];
      }
    }
    throw new IoError("Failed to list presets.", { cause: error });
  }
}

export async function deletePreset(name: string, env?: NodeJS.ProcessEnv): Promise<void> {
  validatePresetName(name);
  const filePath = presetFilePath(name, env);
  try {
    await unlink(filePath);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error) {
      const fsError = error as NodeJS.ErrnoException;
      if (fsError.code === "ENOENT") {
        throw new ValidationError(`Preset '${name}' not found.`);
      }
    }
    throw new IoError(`Failed to delete preset '${name}'.`, { cause: error });
  }
}
