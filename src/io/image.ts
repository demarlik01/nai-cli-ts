import { readFile } from "node:fs/promises";

import { IoError, ValidationError } from "../core/errors.js";

export type ImageMimeType =
  | "image/png"
  | "image/jpeg"
  | "image/webp"
  | "application/octet-stream";

export interface ImageDimensions {
  width: number;
  height: number;
}

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

function parsePngDimensions(buffer: Buffer): ImageDimensions | null {
  if (
    buffer.length < 24 ||
    buffer[12] !== 0x49 ||
    buffer[13] !== 0x48 ||
    buffer[14] !== 0x44 ||
    buffer[15] !== 0x52
  ) {
    return null;
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function parseJpegDimensions(buffer: Buffer): ImageDimensions | null {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return null;
  }

  let offset = 2;
  while (offset + 3 < buffer.length) {
    while (offset < buffer.length && buffer[offset] === 0xff) {
      offset += 1;
    }

    if (offset >= buffer.length) {
      return null;
    }

    const marker = buffer[offset];
    offset += 1;

    if (marker === 0xd9 || marker === 0xda) {
      break;
    }

    if (offset + 1 >= buffer.length) {
      return null;
    }

    const segmentLength = buffer.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > buffer.length) {
      return null;
    }

    const isSofMarker =
      marker === 0xc0 ||
      marker === 0xc1 ||
      marker === 0xc2 ||
      marker === 0xc3 ||
      marker === 0xc5 ||
      marker === 0xc6 ||
      marker === 0xc7 ||
      marker === 0xc9 ||
      marker === 0xca ||
      marker === 0xcb ||
      marker === 0xcd ||
      marker === 0xce ||
      marker === 0xcf;

    if (isSofMarker) {
      if (segmentLength < 7) {
        return null;
      }
      const height = buffer.readUInt16BE(offset + 3);
      const width = buffer.readUInt16BE(offset + 5);
      return { width, height };
    }

    offset += segmentLength;
  }

  return null;
}

function parseWebpVp8Dimensions(buffer: Buffer, chunkStart: number): ImageDimensions | null {
  if (chunkStart + 10 > buffer.length) {
    return null;
  }

  if (
    buffer[chunkStart + 3] !== 0x9d ||
    buffer[chunkStart + 4] !== 0x01 ||
    buffer[chunkStart + 5] !== 0x2a
  ) {
    return null;
  }

  const width = buffer.readUInt16LE(chunkStart + 6) & 0x3fff;
  const height = buffer.readUInt16LE(chunkStart + 8) & 0x3fff;
  return { width, height };
}

function parseWebpVp8lDimensions(buffer: Buffer, chunkStart: number): ImageDimensions | null {
  if (chunkStart + 5 > buffer.length || buffer[chunkStart] !== 0x2f) {
    return null;
  }

  const bits = buffer.readUInt32LE(chunkStart + 1);
  const width = (bits & 0x3fff) + 1;
  const height = ((bits >>> 14) & 0x3fff) + 1;
  return { width, height };
}

function parseWebpVp8xDimensions(buffer: Buffer, chunkStart: number): ImageDimensions | null {
  if (chunkStart + 10 > buffer.length) {
    return null;
  }

  const widthMinusOne = buffer.readUIntLE(chunkStart + 4, 3);
  const heightMinusOne = buffer.readUIntLE(chunkStart + 7, 3);

  return {
    width: widthMinusOne + 1,
    height: heightMinusOne + 1,
  };
}

function parseWebpDimensions(buffer: Buffer): ImageDimensions | null {
  if (
    buffer.length < 16 ||
    buffer.subarray(0, 4).toString("ascii") !== "RIFF" ||
    buffer.subarray(8, 12).toString("ascii") !== "WEBP"
  ) {
    return null;
  }

  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const chunkType = buffer.subarray(offset, offset + 4).toString("ascii");
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const chunkStart = offset + 8;

    if (chunkStart + chunkSize > buffer.length) {
      return null;
    }

    if (chunkType === "VP8 ") {
      const dimensions = parseWebpVp8Dimensions(buffer, chunkStart);
      if (dimensions) {
        return dimensions;
      }
    } else if (chunkType === "VP8L") {
      const dimensions = parseWebpVp8lDimensions(buffer, chunkStart);
      if (dimensions) {
        return dimensions;
      }
    } else if (chunkType === "VP8X") {
      const dimensions = parseWebpVp8xDimensions(buffer, chunkStart);
      if (dimensions) {
        return dimensions;
      }
    }

    offset = chunkStart + chunkSize + (chunkSize % 2);
  }

  return null;
}

export function readImageDimensions(buffer: Buffer): ImageDimensions {
  const mime = detectImageMime(buffer);

  const dimensions =
    (mime === "image/png" ? parsePngDimensions(buffer) : null) ??
    (mime === "image/jpeg" ? parseJpegDimensions(buffer) : null) ??
    (mime === "image/webp" ? parseWebpDimensions(buffer) : null);

  if (!dimensions) {
    throw new ValidationError("Unsupported or invalid image format for dimension extraction.");
  }

  if (dimensions.width <= 0 || dimensions.height <= 0) {
    throw new ValidationError("Image dimensions must be positive.");
  }

  return dimensions;
}

export async function loadImageDimensions(filePath: string): Promise<ImageDimensions> {
  const buffer = await loadImageFile(filePath);
  return readImageDimensions(buffer);
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
