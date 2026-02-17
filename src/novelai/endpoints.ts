export const IMAGE_BASE_URL = "https://image.novelai.net";
export const API_BASE_URL = "https://api.novelai.net";

// Backward compatibility alias.
export const NOVELAI_BASE_URL = IMAGE_BASE_URL;

interface EndpointDefinition {
  path: string;
  host: string;
}

export const ENDPOINTS = {
  generateImage: {
    path: "/ai/generate-image",
    host: IMAGE_BASE_URL,
  },
  generateImageStream: {
    path: "/ai/generate-image-stream",
    host: IMAGE_BASE_URL,
  },
  suggestTags: {
    path: "/ai/generate-image/suggest-tags",
    host: IMAGE_BASE_URL,
  },
  augmentImage: {
    path: "/ai/augment-image",
    host: IMAGE_BASE_URL,
  },
  encodeVibe: {
    path: "/ai/encode-vibe",
    host: IMAGE_BASE_URL,
  },
  upscale: {
    path: "/ai/upscale",
    host: API_BASE_URL,
  },
  classify: {
    path: "/ai/classify",
    host: API_BASE_URL,
  },
  annotate: {
    path: "/ai/annotate-image",
    host: API_BASE_URL,
  },
} as const satisfies Record<string, EndpointDefinition>;

export type EndpointKey = keyof typeof ENDPOINTS;
