import type { GenerateImageRequestEnvelope } from "../../types/api.js";
import type { ModelId, SamplerId } from "../models.js";
import { isV4Model } from "../models.js";

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

export interface BuildImg2ImgPayloadInput extends BuildGeneratePayloadInput {
  image: string;
  strength: number;
  noise: number;
}

export interface BuildInpaintPayloadInput extends BuildGeneratePayloadInput {
  image: string;
  mask: string;
  strength: number;
}

function buildBaseParameters(input: BuildGeneratePayloadInput): GenerateImageRequestEnvelope["parameters"] {
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

  if (isV4Model(input.model)) {
    parameters.v4_prompt = {
      caption: {
        base_caption: input.prompt,
        char_captions: [],
      },
      use_coords: false,
      use_order: true,
    };
    parameters.v4_negative_prompt = {
      caption: {
        base_caption: input.negativePrompt?.trim() ?? "",
        char_captions: [],
      },
    };
  }

  return parameters;
}

export function buildGeneratePayload(
  input: BuildGeneratePayloadInput,
): GenerateImageRequestEnvelope {
  return {
    input: input.prompt,
    model: input.model,
    action: "generate",
    parameters: buildBaseParameters(input),
  };
}

export function buildImg2ImgPayload(
  input: BuildImg2ImgPayloadInput,
): GenerateImageRequestEnvelope {
  return {
    input: input.prompt,
    model: input.model,
    action: "img2img",
    parameters: {
      ...buildBaseParameters(input),
      image: input.image,
      strength: input.strength,
      noise: input.noise,
    },
  };
}

export function buildInpaintPayload(
  input: BuildInpaintPayloadInput,
): GenerateImageRequestEnvelope {
  return {
    input: input.prompt,
    model: input.model,
    action: "infill",
    parameters: {
      ...buildBaseParameters(input),
      image: input.image,
      mask: input.mask,
      strength: input.strength,
    },
  };
}
