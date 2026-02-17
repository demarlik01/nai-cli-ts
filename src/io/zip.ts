import { inflateRawSync } from "node:zlib";

import { IoError } from "../core/errors.js";

export interface ZipEntry {
  name: string;
  data: Buffer;
}

const END_OF_CENTRAL_DIR_SIG = 0x06054b50;
const CENTRAL_DIR_FILE_HEADER_SIG = 0x02014b50;
const LOCAL_FILE_HEADER_SIG = 0x04034b50;

function ensureRange(buffer: Buffer, offset: number, length: number): void {
  if (offset < 0 || offset + length > buffer.length) {
    throw new IoError("ZIP parsing failed due to an out-of-range read.");
  }
}

function findEndOfCentralDirOffset(buffer: Buffer): number {
  const minOffset = Math.max(0, buffer.length - 65_535 - 22);
  for (let offset = buffer.length - 22; offset >= minOffset; offset -= 1) {
    if (buffer.readUInt32LE(offset) === END_OF_CENTRAL_DIR_SIG) {
      return offset;
    }
  }
  throw new IoError("Could not locate ZIP end-of-central-directory record.");
}

function decodeName(rawName: Buffer): string {
  return rawName.toString("utf8");
}

export function unzipBuffer(buffer: Buffer): ZipEntry[] {
  if (buffer.length < 22) {
    throw new IoError("ZIP payload is too small to be valid.");
  }

  const eocdOffset = findEndOfCentralDirOffset(buffer);
  ensureRange(buffer, eocdOffset + 10, 12);

  const centralDirectorySize = buffer.readUInt32LE(eocdOffset + 12);
  const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);

  ensureRange(buffer, centralDirectoryOffset, centralDirectorySize);

  const entries: ZipEntry[] = [];
  let cursor = centralDirectoryOffset;
  const centralDirectoryEnd = centralDirectoryOffset + centralDirectorySize;

  while (cursor < centralDirectoryEnd) {
    ensureRange(buffer, cursor, 46);
    const signature = buffer.readUInt32LE(cursor);
    if (signature !== CENTRAL_DIR_FILE_HEADER_SIG) {
      throw new IoError("Invalid central directory file header signature.");
    }

    const compressionMethod = buffer.readUInt16LE(cursor + 10);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const uncompressedSize = buffer.readUInt32LE(cursor + 24);
    const fileNameLength = buffer.readUInt16LE(cursor + 28);
    const extraFieldLength = buffer.readUInt16LE(cursor + 30);
    const fileCommentLength = buffer.readUInt16LE(cursor + 32);
    const localHeaderOffset = buffer.readUInt32LE(cursor + 42);

    ensureRange(buffer, cursor + 46, fileNameLength + extraFieldLength + fileCommentLength);
    const name = decodeName(buffer.subarray(cursor + 46, cursor + 46 + fileNameLength));

    ensureRange(buffer, localHeaderOffset, 30);
    const localSig = buffer.readUInt32LE(localHeaderOffset);
    if (localSig !== LOCAL_FILE_HEADER_SIG) {
      throw new IoError("Invalid local file header signature.");
    }

    const localNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
    const dataOffset = localHeaderOffset + 30 + localNameLength + localExtraLength;
    ensureRange(buffer, dataOffset, compressedSize);

    const compressedData = buffer.subarray(dataOffset, dataOffset + compressedSize);
    let fileData: Buffer;

    if (compressionMethod === 0) {
      fileData = Buffer.from(compressedData);
    } else if (compressionMethod === 8) {
      fileData = inflateRawSync(compressedData);
    } else {
      throw new IoError(`Unsupported ZIP compression method: ${compressionMethod}.`);
    }

    if (fileData.length !== uncompressedSize) {
      throw new IoError(`ZIP entry '${name}' has mismatched uncompressed size.`);
    }

    if (!name.endsWith("/")) {
      entries.push({
        name,
        data: fileData,
      });
    }

    cursor += 46 + fileNameLength + extraFieldLength + fileCommentLength;
  }

  return entries;
}
