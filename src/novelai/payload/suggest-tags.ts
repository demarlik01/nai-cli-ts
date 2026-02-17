import type { SuggestTagsRequestPayload } from "../../types/api.js";

export interface BuildSuggestTagsPayloadInput {
  model: string;
  prompt: string;
}

export function buildSuggestTagsPayload(
  input: BuildSuggestTagsPayloadInput,
): SuggestTagsRequestPayload {
  return {
    model: input.model,
    prompt: input.prompt,
  };
}
