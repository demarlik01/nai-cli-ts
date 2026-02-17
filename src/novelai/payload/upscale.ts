import type { UpscaleRequestPayload } from "../../types/api.js";

export interface BuildUpscalePayloadInput {
  image: string;
  width: number;
  height: number;
  scale: number;
}

export function buildUpscalePayload(input: BuildUpscalePayloadInput): UpscaleRequestPayload {
  return {
    image: input.image,
    width: input.width,
    height: input.height,
    scale: input.scale,
  };
}
