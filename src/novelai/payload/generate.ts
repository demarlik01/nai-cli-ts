import type { GenerateImageRequestEnvelope } from "../../types/api.js";
import type { ModelId, SamplerId } from "../models.js";

export interface BuildGeneratePayloadInput {
  model: ModelId;
  prompt: string;
  negativePrompt?: string | undefined;
  sampler: SamplerId;
  width: number;
  height: number;
  steps: number;
  scale: number;
  seed: number;
  nSamples?: number | undefined;
}

export function buildGeneratePayload(
  input: BuildGeneratePayloadInput,
): GenerateImageRequestEnvelope {
  const parameters: GenerateImageRequestEnvelope["parameters"] = {
    prompt: input.prompt,
    width: input.width,
    height: input.height,
    steps: input.steps,
    scale: input.scale,
    sampler: input.sampler,
    seed: input.seed,
    n_samples: input.nSamples ?? 1,
  };

  if (input.negativePrompt?.trim()) {
    parameters.negative_prompt = input.negativePrompt;
  }

  return {
    model: input.model,
    action: "generate",
    parameters,
  };
}
