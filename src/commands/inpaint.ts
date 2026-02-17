import { randomInt } from "node:crypto";
import { Command } from "commander";

import { createRuntimeContext } from "../core/context.js";
import { ConfigError, ValidationError } from "../core/errors.js";
import { writeGenerationOutput } from "../core/output.js";
import { validateGenerateParams } from "../core/validate.js";
import { loadImageAsBase64 } from "../io/image.js";
import { createNovelAiClient } from "../novelai/client.js";
import { ENDPOINTS } from "../novelai/endpoints.js";
import { buildInpaintPayload } from "../novelai/payload/generate.js";
import { parseNovelAiResponse } from "../novelai/response.js";
import type { GlobalCliOptions, InpaintCommandOptions } from "../types/commands.js";

function resolveGlobalOptions(command: Command): GlobalCliOptions {
  const commandWithGlobals = command as Command & {
    optsWithGlobals?: () => unknown;
  };
  const raw = commandWithGlobals.optsWithGlobals?.() ?? command.parent?.opts() ?? {};
  return raw as GlobalCliOptions;
}

function parseIntegerOption(value: string, label: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    throw new ValidationError(`${label} must be an integer.`);
  }
  return parsed;
}

function parseFloatOption(value: string, label: string): number {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    throw new ValidationError(`${label} must be a number.`);
  }
  return parsed;
}

function validateUnitInterval(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new ValidationError(`${label} must be between 0 and 1.`);
  }
  return value;
}

export function registerInpaintCommand(program: Command): void {
  program
    .command("inpaint")
    .description("Generate image(s) by inpainting an input image with a mask")
    .requiredOption("--image <path>", "Input image path")
    .requiredOption("--mask <path>", "Mask image path")
    .requiredOption("--prompt <text>", "Prompt text")
    .requiredOption("--strength <number>", "Inpainting strength", (value: string) =>
      parseFloatOption(value, "strength"),
    )
    .option("--negative <text>", "Negative prompt text")
    .option("--model <id>", "Model ID from registry")
    .option("--sampler <id>", "Sampler ID from registry")
    .option("--width <number>", "Image width", (value: string) => parseIntegerOption(value, "width"))
    .option("--height <number>", "Image height", (value: string) =>
      parseIntegerOption(value, "height"),
    )
    .option("--steps <number>", "Sampling steps", (value: string) =>
      parseIntegerOption(value, "steps"),
    )
    .option("--scale <number>", "CFG scale", (value: string) => parseFloatOption(value, "scale"))
    .option("--seed <number>", "Seed", (value: string) => parseIntegerOption(value, "seed"))
    .option("--out <dir>", "Output directory")
    .action(async (options: InpaintCommandOptions, command: Command) => {
      const globals = resolveGlobalOptions(command);
      const context = await createRuntimeContext({
        debug: globals.debug,
        configPath: globals.config,
      });

      if (!context.config.apiToken) {
        throw new ConfigError(
          "API token is not configured. Set it with 'nai config set-token <TOKEN>'.",
        );
      }

      const sourceImage = await loadImageAsBase64(options.image);
      const maskImage = await loadImageAsBase64(options.mask);
      const validated = validateGenerateParams({
        prompt: options.prompt,
        negativePrompt: options.negative,
        model: options.model ?? context.config.defaultModel,
        sampler: options.sampler ?? context.config.defaultSampler,
        width: options.width ?? 1024,
        height: options.height ?? 1024,
        steps: options.steps ?? 28,
        scale: options.scale ?? 5,
        seed: options.seed ?? randomInt(0, 4_294_967_296),
        outputDir: options.out ?? context.config.defaultOutputDir,
      });
      const strength = validateUnitInterval(options.strength, "strength");

      const payload = buildInpaintPayload({
        model: validated.model,
        prompt: validated.prompt,
        negativePrompt: validated.negativePrompt,
        sampler: validated.sampler,
        width: validated.width,
        height: validated.height,
        steps: validated.steps,
        scale: validated.scale,
        seed: validated.seed,
        image: sourceImage.base64,
        mask: maskImage.base64,
        strength,
      });

      const client = createNovelAiClient({
        token: context.config.apiToken,
        timeoutMs: context.config.requestTimeoutMs,
        maxRetries: context.config.maxRetries,
        debug: context.debug,
        onDebug: (message) => context.logger.debug(message),
      });

      const response = await client.postJson(
        ENDPOINTS.generateImage.path,
        payload,
        undefined,
        ENDPOINTS.generateImage.host,
      );
      const parsed = await parseNovelAiResponse(response);

      if (parsed.kind === "json") {
        console.log(JSON.stringify(parsed.data, null, 2));
        return;
      }

      const output = await writeGenerationOutput({
        outputDir: validated.outputDir,
        model: validated.model,
        seed: validated.seed,
        prompt: validated.prompt,
        negativePrompt: validated.negativePrompt,
        requestPayload: payload,
        response: parsed,
        now: context.now,
      });

      for (const artifact of output.artifacts) {
        console.log(artifact.imagePath);
        console.log(artifact.metadataPath);
      }
    });
}
