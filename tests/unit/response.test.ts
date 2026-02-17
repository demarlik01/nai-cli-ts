import { describe, expect, it } from "vitest";

import { parseNovelAiResponse } from "../../src/novelai/response.js";

interface ZipFixtureEntry {
  name: string;
  data: Buffer;
}

function createStoredZip(entries: ZipFixtureEntry[]): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let localOffset = 0;

  for (const entry of entries) {
    const nameBuffer = Buffer.from(entry.name, "utf8");
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(0, 14);
    localHeader.writeUInt32LE(entry.data.length, 18);
    localHeader.writeUInt32LE(entry.data.length, 22);
    localHeader.writeUInt16LE(nameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, nameBuffer, entry.data);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(0, 16);
    centralHeader.writeUInt32LE(entry.data.length, 20);
    centralHeader.writeUInt32LE(entry.data.length, 24);
    centralHeader.writeUInt16LE(nameBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(localOffset, 42);

    centralParts.push(centralHeader, nameBuffer);
    localOffset += localHeader.length + nameBuffer.length + entry.data.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const endOfCentralDir = Buffer.alloc(22);
  endOfCentralDir.writeUInt32LE(0x06054b50, 0);
  endOfCentralDir.writeUInt16LE(0, 4);
  endOfCentralDir.writeUInt16LE(0, 6);
  endOfCentralDir.writeUInt16LE(entries.length, 8);
  endOfCentralDir.writeUInt16LE(entries.length, 10);
  endOfCentralDir.writeUInt32LE(centralDirectory.length, 12);
  endOfCentralDir.writeUInt32LE(localOffset, 16);
  endOfCentralDir.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDirectory, endOfCentralDir]);
}

describe("parseNovelAiResponse", () => {
  it("normalizes zip responses into image and metadata file lists", async () => {
    const zipBuffer = createStoredZip([
      {
        name: "image_0.png",
        data: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
      },
      {
        name: "meta.json",
        data: Buffer.from('{"seed":123}', "utf8"),
      },
    ]);

    const response = new Response(zipBuffer, {
      headers: { "content-type": "application/zip" },
    });

    const parsed = await parseNovelAiResponse(response);
    expect(parsed.kind).toBe("zip");
    if (parsed.kind !== "zip") {
      return;
    }

    expect(parsed.images).toHaveLength(1);
    expect(parsed.images[0].name).toBe("image_0.png");
    expect(parsed.metadataFiles).toHaveLength(1);
    expect(parsed.metadataFiles[0].name).toBe("meta.json");
  });

  it("sniffs png responses even with generic content type", async () => {
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const response = new Response(pngBuffer, {
      headers: { "content-type": "application/octet-stream" },
    });

    const parsed = await parseNovelAiResponse(response);
    expect(parsed).toEqual({
      kind: "png",
      image: pngBuffer,
    });
  });

  it("sniffs json responses from body shape", async () => {
    const response = new Response('{"ok":true}', {
      headers: { "content-type": "text/plain" },
    });

    const parsed = await parseNovelAiResponse(response);
    expect(parsed).toEqual({
      kind: "json",
      data: { ok: true },
    });
  });
});
