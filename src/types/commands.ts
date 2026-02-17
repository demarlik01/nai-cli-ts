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

export interface Img2ImgCommandOptions {
  image: string;
  prompt: string;
  strength: number;
  noise: number;
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

export interface InpaintCommandOptions {
  image: string;
  mask: string;
  prompt: string;
  strength: number;
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

export interface UpscaleCommandOptions {
  image: string;
  scale?: number;
  out?: string;
}

export interface SuggestTagsCommandOptions {
  prompt: string;
  model?: ModelId;
  lang?: "en" | "jp";
  format?: "json" | "table";
}
