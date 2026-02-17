import { ZodError, z } from "zod";

import { ValidationError } from "./errors.js";
import { getGenerationConstraints, modelIdSchema, samplerIdSchema } from "../novelai/models.js";

export const generateParamsSchema = z
  .object({
    prompt: z.string().trim().min(1, "Prompt is required."),
    negativePrompt: z.string().trim().optional(),
    model: modelIdSchema,
    sampler: samplerIdSchema,
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    steps: z.number().int().positive(),
    scale: z.number().positive(),
    seed: z.number().int().nonnegative().max(4_294_967_295),
    outputDir: z.string().trim().min(1, "Output directory is required."),
  })
  .superRefine((value, refinementContext) => {
    const constraints = getGenerationConstraints(value.model);

    if (value.width % constraints.widthMultiple !== 0) {
      refinementContext.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["width"],
        message: `Width must be a multiple of ${constraints.widthMultiple}.`,
      });
    }

    if (value.height % constraints.heightMultiple !== 0) {
      refinementContext.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["height"],
        message: `Height must be a multiple of ${constraints.heightMultiple}.`,
      });
    }

    if (value.width < constraints.minWidth || value.width > constraints.maxWidth) {
      refinementContext.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["width"],
        message: `Width must be between ${constraints.minWidth} and ${constraints.maxWidth}.`,
      });
    }

    if (value.height < constraints.minHeight || value.height > constraints.maxHeight) {
      refinementContext.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["height"],
        message: `Height must be between ${constraints.minHeight} and ${constraints.maxHeight}.`,
      });
    }

    if (value.steps < constraints.minSteps || value.steps > constraints.maxSteps) {
      refinementContext.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["steps"],
        message: `Steps must be between ${constraints.minSteps} and ${constraints.maxSteps}.`,
      });
    }
  });

export type ValidGenerateParams = z.infer<typeof generateParamsSchema>;

export function validateGenerateParams(input: unknown): ValidGenerateParams {
  try {
    return generateParamsSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.issues
        .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
        .join("; ");
      throw new ValidationError(`Invalid generate parameters: ${details}`, {
        cause: error,
      });
    }
    throw error;
  }
}
