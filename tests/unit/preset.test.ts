import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";

import { savePreset, loadPreset, listPresets, deletePreset } from "../../src/preset/store.js";

describe("preset store", () => {
  let tempDir: string;
  let env: NodeJS.ProcessEnv;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), "nai-preset-test-"));
    env = { XDG_CONFIG_HOME: tempDir };
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("saves and loads a preset", async () => {
    await savePreset({ name: "test1", model: "nai-diffusion-3", width: 512 }, env);
    const loaded = await loadPreset("test1", env);
    expect(loaded.name).toBe("test1");
    expect(loaded.model).toBe("nai-diffusion-3");
    expect(loaded.width).toBe(512);
  });

  it("lists presets", async () => {
    await savePreset({ name: "alpha" }, env);
    await savePreset({ name: "beta" }, env);
    const names = await listPresets(env);
    expect(names).toEqual(["alpha", "beta"]);
  });

  it("deletes a preset", async () => {
    await savePreset({ name: "todelete" }, env);
    await deletePreset("todelete", env);
    const names = await listPresets(env);
    expect(names).toEqual([]);
  });

  it("throws on loading non-existent preset", async () => {
    await expect(loadPreset("nope", env)).rejects.toThrow("not found");
  });

  it("throws on deleting non-existent preset", async () => {
    await expect(deletePreset("nope", env)).rejects.toThrow("not found");
  });

  it("rejects invalid preset names", async () => {
    await expect(savePreset({ name: "../bad" }, env)).rejects.toThrow();
  });

  it("returns empty list when no presets dir", async () => {
    const names = await listPresets(env);
    expect(names).toEqual([]);
  });
});
