import { z } from "zod";

export const MODEL_IDS = [
  "nai-diffusion-4-5-curated",
  "nai-diffusion-4-5-full",
  "nai-diffusion-4-full",
  "nai-diffusion-4-curated",
  "nai-diffusion-3",
  "nai-diffusion-3-inpainting",
  "nai-diffusion-furry-3",
  "nai-diffusion-2",
  "nai-diffusion",
  "safe-diffusion",
] as const;

export type ModelId = (typeof MODEL_IDS)[number];
export const modelIdSchema = z.enum(MODEL_IDS);

export const SAMPLER_IDS = [
  "k_euler",
  "k_euler_ancestral",
  "k_dpmpp_2s_ancestral",
  "k_dpmpp_2m",
  "k_dpmpp_sde",
  "ddim",
] as const;

export type SamplerId = (typeof SAMPLER_IDS)[number];
export const samplerIdSchema = z.enum(SAMPLER_IDS);

export const DEFAULT_MODEL: ModelId = "nai-diffusion-4-5-curated";
export const DEFAULT_SAMPLER: SamplerId = "k_euler_ancestral";

export interface GenerationConstraints {
  widthMultiple: number;
  heightMultiple: number;
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  minSteps: number;
  maxSteps: number;
}

const DEFAULT_CONSTRAINTS: GenerationConstraints = {
  widthMultiple: 64,
  heightMultiple: 64,
  minWidth: 64,
  maxWidth: 4096,
  minHeight: 64,
  maxHeight: 4096,
  minSteps: 1,
  maxSteps: 50,
};

const MODEL_CONSTRAINTS: Record<ModelId, GenerationConstraints> = {
  "nai-diffusion-4-5-curated": DEFAULT_CONSTRAINTS,
  "nai-diffusion-4-5-full": DEFAULT_CONSTRAINTS,
  "nai-diffusion-4-full": DEFAULT_CONSTRAINTS,
  "nai-diffusion-4-curated": DEFAULT_CONSTRAINTS,
  "nai-diffusion-3": DEFAULT_CONSTRAINTS,
  "nai-diffusion-3-inpainting": DEFAULT_CONSTRAINTS,
  "nai-diffusion-furry-3": DEFAULT_CONSTRAINTS,
  "nai-diffusion-2": DEFAULT_CONSTRAINTS,
  "nai-diffusion": DEFAULT_CONSTRAINTS,
  "safe-diffusion": DEFAULT_CONSTRAINTS,
};

export function isModelId(value: string): value is ModelId {
  return modelIdSchema.safeParse(value).success;
}

export function isSamplerId(value: string): value is SamplerId {
  return samplerIdSchema.safeParse(value).success;
}

export function getGenerationConstraints(model: ModelId): GenerationConstraints {
  return MODEL_CONSTRAINTS[model];
}

export function isV4Model(model: string): boolean {
  return model.startsWith("nai-diffusion-4");
}
