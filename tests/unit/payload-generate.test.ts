import { describe, expect, it } from "vitest";

import { buildGeneratePayload } from "../../src/novelai/payload/generate.js";

describe("buildGeneratePayload", () => {
  it("builds the expected NovelAI envelope for action=generate", () => {
    const payload = buildGeneratePayload({
      model: "nai-diffusion-4-5-curated",
      prompt: "1girl, cinematic lighting",
      negativePrompt: "lowres, blurry",
      sampler: "k_euler_ancestral",
      width: 1024,
      height: 1024,
      steps: 28,
      scale: 5,
      seed: 12345,
    });

    expect(payload).toEqual({
      model: "nai-diffusion-4-5-curated",
      action: "generate",
      parameters: {
        prompt: "1girl, cinematic lighting",
        negative_prompt: "lowres, blurry",
        width: 1024,
        height: 1024,
        steps: 28,
        scale: 5,
        sampler: "k_euler_ancestral",
        seed: 12345,
        n_samples: 1,
      },
    });
  });

  it("omits negative prompt when not provided", () => {
    const payload = buildGeneratePayload({
      model: "nai-diffusion-4-5-curated",
      prompt: "landscape",
      sampler: "k_euler",
      width: 1024,
      height: 1024,
      steps: 24,
      scale: 6,
      seed: 777,
    });

    expect(payload.parameters).not.toHaveProperty("negative_prompt");
  });
});
