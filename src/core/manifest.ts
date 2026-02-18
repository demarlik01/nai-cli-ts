import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

import { IoError } from "./errors.js";

export interface ManifestEntry {
  prompt: string;
  model: string;
  sampler: string;
  seed: number;
  filename: string;
  success: boolean;
  error?: string;
  timestamp: string;
}

export async function appendManifest(
  outputDir: string,
  entry: ManifestEntry,
): Promise<void> {
  await mkdir(outputDir, { recursive: true });
  const manifestPath = path.join(outputDir, "manifest.jsonl");
  const line = `${JSON.stringify(entry)}\n`;

  try {
    await appendFile(manifestPath, line, "utf8");
  } catch (error) {
    if (error instanceof Error) {
      throw new IoError(`Failed to write manifest: ${error.message}`, { cause: error });
    }
    throw new IoError("Failed to write manifest.");
  }
}
