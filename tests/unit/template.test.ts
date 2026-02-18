import { describe, expect, it } from "vitest";

import { renderTemplate } from "../../src/core/template.js";

describe("renderTemplate", () => {
  it("replaces all variables", () => {
    const result = renderTemplate("{date}_{model}_{seed}_{index}.png", {
      date: "20260218",
      model: "nai-diffusion-4-5-curated",
      seed: "12345",
      index: "0",
      prompt: "1girl, blue hair",
      sampler: "k_euler",
    });
    expect(result).toBe("20260218_nai-diffusion-4-5-curated_12345_0.png");
  });

  it("sanitizes prompt tokens", () => {
    const result = renderTemplate("{prompt}", {
      date: "20260218",
      model: "m",
      seed: "1",
      index: "0",
      prompt: "Hello World! Special & chars",
    });
    expect(result).toBe("hello-world-special-chars");
  });

  it("handles missing sampler", () => {
    const result = renderTemplate("{sampler}", {
      date: "d",
      model: "m",
      seed: "1",
      index: "0",
      prompt: "p",
    });
    expect(result).toBe("unknown");
  });
});
