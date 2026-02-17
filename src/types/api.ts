export type NovelAiGenerateAction = "generate" | "img2img" | "infill";

export interface V4CharCaption {
  char_caption: string;
  centers: Array<{ x: number; y: number }>;
}

export interface V4Caption {
  base_caption: string;
  char_captions: V4CharCaption[];
}

export interface V4Prompt {
  caption: V4Caption;
  use_coords: boolean;
  use_order: boolean;
}

export interface V4NegativePrompt {
  caption: V4Caption;
}

export interface GenerateRequestParameters {
  prompt: string;
  negative_prompt?: string;
  width: number;
  height: number;
  steps: number;
  scale: number;
  sampler: string;
  seed: number;
  n_samples: number;
  image?: string;
  mask?: string;
  strength?: number;
  noise?: number;
  v4_prompt?: V4Prompt;
  v4_negative_prompt?: V4NegativePrompt;
}

export interface GenerateImageRequestEnvelope {
  input: string;
  model: string;
  action: NovelAiGenerateAction;
  parameters: GenerateRequestParameters & Record<string, unknown>;
}

export interface UpscaleRequestPayload {
  image: string;
  width: number;
  height: number;
  scale: number;
}

export interface SuggestTagsRequestPayload {
  model: string;
  prompt: string;
}

export interface ApiErrorPayload {
  error?: string;
  message?: string;
  detail?: string;
  [key: string]: unknown;
}

export interface ParsedZipFile {
  name: string;
  data: Buffer;
}

export type NormalizedNovelAiResponse =
  | {
      kind: "zip";
      images: ParsedZipFile[];
      metadataFiles: ParsedZipFile[];
    }
  | {
      kind: "png";
      image: Buffer;
    }
  | {
      kind: "json";
      data: unknown;
    };
