import type { ModelId, SamplerId } from "../novelai/models.js";

export interface GlobalCliOptions {
  debug?: boolean;
  config?: string;
}

export interface GenerateCommandOptions {
  prompt: string;
  negative?: string;
  model?: ModelId;
  sampler?: SamplerId;
  width?: number;
  height?: number;
  steps?: number;
  scale?: number;
  seed?: number;
  out?: string;
}
