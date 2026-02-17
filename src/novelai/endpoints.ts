export const NOVELAI_BASE_URL = "https://image.novelai.net";

export const ENDPOINTS = {
  generateImage: "/ai/generate-image",
  suggestTags: "/ai/generate-image/suggest-tags",
  upscale: "/ai/upscale",
} as const;

export type EndpointKey = keyof typeof ENDPOINTS;
