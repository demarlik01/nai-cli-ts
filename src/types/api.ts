export type NovelAiGenerateAction = "generate" | "img2img" | "infill";

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
}

export interface GenerateImageRequestEnvelope {
  model: string;
  action: NovelAiGenerateAction;
  parameters: GenerateRequestParameters & Record<string, unknown>;
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
