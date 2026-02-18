import { z } from "zod";

import { modelIdSchema, samplerIdSchema } from "../novelai/models.js";

export const presetSchema = z.object({
  name: z.string().min(1),
  model: modelIdSchema.optional(),
  sampler: samplerIdSchema.optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  steps: z.number().int().positive().optional(),
  scale: z.number().positive().optional(),
  negative: z.string().optional(),
  outputDir: z.string().min(1).optional(),
  outputTemplate: z.string().min(1).optional(),
});

export type Preset = z.infer<typeof presetSchema>;
