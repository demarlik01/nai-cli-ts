import { readFile } from "node:fs/promises";

import { IoError } from "../core/errors.js";

export type ImageMimeType =
  | "image/png"
  | "image/jpeg"
  | "image/webp"
  | "application/octet-stream";

export async function loadImageFile(filePath: string): Promise<Buffer> {
  try {
    return await readFile(filePath);
  } catch (error) {
    if (error instanceof Error) {
      throw new IoError(`Failed to read image file '${filePath}': ${error.message}`, {
        cause: error,
      });
    }
    throw new IoError(`Failed to read image file '${filePath}'.`);
  }
}

export function detectImageMime(buffer: Buffer): ImageMimeType {
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }

  return "application/octet-stream";
}

export function toBase64(buffer: Buffer): string {
  return buffer.toString("base64");
}

export async function loadImageAsBase64(filePath: string): Promise<{
  mime: ImageMimeType;
  base64: string;
}> {
  const buffer = await loadImageFile(filePath);
  return {
    mime: detectImageMime(buffer),
    base64: toBase64(buffer),
  };
}
