import { describe, it, expect } from "vitest";
import { buildGeneratePayload, buildImg2ImgPayload, buildInpaintPayload } from "./generate.js";
import type { BuildGeneratePayloadInput, BuildImg2ImgPayloadInput, BuildInpaintPayloadInput } from "./generate.js";

const baseInput: BuildGeneratePayloadInput = {
  model: "nai-diffusion-3",
  prompt: "1girl, best quality",
  negativePrompt: "lowres",
  sampler: "k_euler_ancestral",
  width: 1024,
  height: 1024,
  steps: 28,
  scale: 5,
  seed: 42,
};

describe("V4 prompt structure", () => {
  it("does not add v4_prompt for V3 models", () => {
    const payload = buildGeneratePayload(baseInput);
    expect(payload.parameters.v4_prompt).toBeUndefined();
    expect(payload.parameters.v4_negative_prompt).toBeUndefined();
  });

  it("adds v4_prompt for nai-diffusion-4-curated", () => {
    const payload = buildGeneratePayload({ ...baseInput, model: "nai-diffusion-4-curated" });
    expect(payload.parameters.v4_prompt).toEqual({
      caption: { base_caption: "1girl, best quality", char_captions: [] },
      use_coords: false,
      use_order: true,
    });
    expect(payload.parameters.v4_negative_prompt).toEqual({
      caption: { base_caption: "lowres", char_captions: [] },
    });
    // backward compat
    expect(payload.parameters.prompt).toBe("1girl, best quality");
    expect(payload.parameters.negative_prompt).toBe("lowres");
  });

  it("adds v4_prompt for nai-diffusion-4-5-curated", () => {
    const payload = buildGeneratePayload({ ...baseInput, model: "nai-diffusion-4-5-curated" });
    expect(payload.parameters.v4_prompt).toBeDefined();
  });

  it("handles empty negative prompt for V4", () => {
    const payload = buildGeneratePayload({ ...baseInput, model: "nai-diffusion-4-full", negativePrompt: undefined });
    expect(payload.parameters.v4_negative_prompt?.caption.base_caption).toBe("");
  });

  it("adds v4_prompt for img2img with V4 model", () => {
    const input: BuildImg2ImgPayloadInput = {
      ...baseInput,
      model: "nai-diffusion-4-curated",
      image: "base64data",
      strength: 0.7,
      noise: 0,
    };
    const payload = buildImg2ImgPayload(input);
    expect(payload.parameters.v4_prompt).toBeDefined();
    expect(payload.action).toBe("img2img");
  });

  it("adds v4_prompt for inpaint with V4 model", () => {
    const input: BuildInpaintPayloadInput = {
      ...baseInput,
      model: "nai-diffusion-4-curated",
      image: "base64data",
      mask: "base64mask",
      strength: 0.7,
    };
    const payload = buildInpaintPayload(input);
    expect(payload.parameters.v4_prompt).toBeDefined();
    expect(payload.action).toBe("infill");
  });
});
