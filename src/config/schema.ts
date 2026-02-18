import { z } from "zod";

import {
  DEFAULT_MODEL,
  DEFAULT_SAMPLER,
  modelIdSchema,
  samplerIdSchema,
} from "../novelai/models.js";

export const CONFIG_VERSION = 1;

export const configSchema = z.object({
  version: z.literal(CONFIG_VERSION),
  apiToken: z.string().min(1).nullable(),
  defaultModel: modelIdSchema,
  defaultSampler: samplerIdSchema,
  defaultOutputDir: z.string().min(1),
  defaultOutputTemplate: z.string().min(1).optional(),
  requestTimeoutMs: z.number().int().positive(),
  maxRetries: z.number().int().min(0).max(10),
  manifestEnabled: z.boolean().optional(),
  debug: z.boolean(),
});

export type NaiCliConfig = z.infer<typeof configSchema>;

export const defaultConfig: NaiCliConfig = {
  version: CONFIG_VERSION,
  apiToken: null,
  defaultModel: DEFAULT_MODEL,
  defaultSampler: DEFAULT_SAMPLER,
  defaultOutputDir: "./outputs",
  requestTimeoutMs: 60_000,
  maxRetries: 3,
  debug: false,
};
