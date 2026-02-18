import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";

import { appendManifest, type ManifestEntry } from "../../src/core/manifest.js";

describe("appendManifest", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), "nai-manifest-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("creates manifest.jsonl and appends entries", async () => {
    const entry: ManifestEntry = {
      prompt: "test",
      model: "nai-diffusion-3",
      sampler: "k_euler",
      seed: 123,
      filename: "out.png",
      success: true,
      timestamp: "2026-02-18T00:00:00.000Z",
    };

    await appendManifest(tempDir, entry);
    await appendManifest(tempDir, { ...entry, success: false, error: "fail" });

    const content = await readFile(path.join(tempDir, "manifest.jsonl"), "utf8");
    const lines = content.trim().split("\n");
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0]!)).toMatchObject({ prompt: "test", success: true });
    expect(JSON.parse(lines[1]!)).toMatchObject({ success: false, error: "fail" });
  });
});
