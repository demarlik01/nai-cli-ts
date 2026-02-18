import { randomInt } from "node:crypto";
import { Command } from "commander";

import { createRuntimeContext } from "../core/context.js";
import { ConfigError, ValidationError } from "../core/errors.js";
import { writeGenerationOutput } from "../core/output.js";
import { validateGenerateParams } from "../core/validate.js";
import { createNovelAiClient } from "../novelai/client.js";
import { ENDPOINTS } from "../novelai/endpoints.js";
import { buildGeneratePayload } from "../novelai/payload/generate.js";
import { parseNovelAiResponse } from "../novelai/response.js";
import { loadPreset } from "../preset/store.js";
import { renderTemplate } from "../core/template.js";
import { appendManifest, type ManifestEntry } from "../core/manifest.js";
import {
  buildBatchMatrix,
  loadPromptFile,
  printBatchSummary,
  runWithConcurrency,
  type BatchJob,
  type BatchResult,
} from "../core/batch.js";
import type { GenerateCommandOptions, GlobalCliOptions } from "../types/commands.js";
import type { Preset } from "../preset/schema.js";

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

function parseCommaSeparated(value: string): string[] {
  return value.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
}

interface ResolvedGenerateOptions {
  prompt: string;
  negative?: string;
  model: string;
  sampler: string;
  width: number;
  height: number;
  steps: number;
  scale: number;
  seed: number;
  outputDir: string;
  outputTemplate?: string;
}

function applyPreset(
  options: GenerateCommandOptions,
  preset: Preset,
  _configDefaults: { defaultModel: string; defaultSampler: string; defaultOutputDir: string },
): void {
  // Preset values apply only when the CLI option was not explicitly set
  if (options.model === undefined && preset.model !== undefined) options.model = preset.model;
  if (options.sampler === undefined && preset.sampler !== undefined) options.sampler = preset.sampler;
  if (options.width === undefined && preset.width !== undefined) options.width = preset.width;
  if (options.height === undefined && preset.height !== undefined) options.height = preset.height;
  if (options.steps === undefined && preset.steps !== undefined) options.steps = preset.steps;
  if (options.scale === undefined && preset.scale !== undefined) options.scale = preset.scale;
  if (options.negative === undefined && preset.negative !== undefined) options.negative = preset.negative;
  if (options.out === undefined && preset.outputDir !== undefined) options.out = preset.outputDir;
  if (options.outputTemplate === undefined && preset.outputTemplate !== undefined) options.outputTemplate = preset.outputTemplate;
}

export function registerGenerateCommand(program: Command): void {
  program
    .command("generate")
    .description("Generate image(s) from a text prompt")
    .option("--prompt <text>", "Prompt text")
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
    .option("--preset <name>", "Load options from a preset")
    .option("--prompts <file>", "Prompt file (one prompt per line)")
    .option("--models <ids>", "Comma-separated model IDs for matrix batch", parseCommaSeparated)
    .option("--samplers <ids>", "Comma-separated sampler IDs for matrix batch", parseCommaSeparated)
    .option("--concurrency <n>", "Number of concurrent requests", (v: string) =>
      parseIntegerOption(v, "concurrency"),
    )
    .option("--output-template <template>", "Output filename template")
    .option("--dry-run", "Validate and preview without calling the API")
    .action(async (options: GenerateCommandOptions, command: Command) => {
      const globals = resolveGlobalOptions(command);
      const context = await createRuntimeContext({
        debug: globals.debug,
        configPath: globals.config,
      });

      // Load preset if specified
      if (options.preset) {
        const preset = await loadPreset(options.preset);
        applyPreset(options, preset, context.config);
      }

      // Resolve prompts
      let prompts: string[];
      if (options.prompts) {
        prompts = await loadPromptFile(options.prompts);
        if (prompts.length === 0) {
          throw new ValidationError("Prompt file is empty or contains no valid prompts.");
        }
      } else if (options.prompt) {
        prompts = [options.prompt];
      } else {
        throw new ValidationError("Either --prompt or --prompts is required.");
      }

      // Resolve models and samplers for matrix
      const models = options.models ?? [options.model ?? context.config.defaultModel];
      const samplers = options.samplers ?? [options.sampler ?? context.config.defaultSampler];

      const jobs = buildBatchMatrix(prompts, models, samplers);
      if (jobs.length === 0) {
        throw new ValidationError("No jobs to run. Check --models and --samplers values.");
      }
      const isBatch = jobs.length > 1;
      const concurrency = options.concurrency ?? 1;
      const outputDir = options.out ?? context.config.defaultOutputDir;
      const outputTemplate = options.outputTemplate ?? context.config.defaultOutputTemplate;

      // Dry run
      if (options.dryRun) {
        console.log(`Dry run: ${jobs.length} job(s) would be generated.\n`);
        for (const job of jobs) {
          const seed = options.seed ?? randomInt(0, 4_294_967_296);
          const validated = validateGenerateParams({
            prompt: job.prompt,
            negativePrompt: options.negative,
            model: job.model,
            sampler: job.sampler,
            width: options.width ?? 1024,
            height: options.height ?? 1024,
            steps: options.steps ?? 28,
            scale: options.scale ?? 5,
            seed,
            outputDir,
          });
          const payload = buildGeneratePayload({
            model: validated.model,
            prompt: validated.prompt,
            negativePrompt: validated.negativePrompt,
            sampler: validated.sampler,
            width: validated.width,
            height: validated.height,
            steps: validated.steps,
            scale: validated.scale,
            seed: validated.seed,
          });

          console.log(`[${job.index + 1}/${jobs.length}] model=${job.model} sampler=${job.sampler} prompt="${job.prompt.slice(0, 60)}"`);
          if (context.debug) {
            console.log(JSON.stringify(payload, null, 2));
          }
        }
        console.log("\nDry run complete. No API calls were made.");
        return;
      }

      if (!context.config.apiToken) {
        throw new ConfigError(
          "API token is not configured. Set it with 'nai config set-token <TOKEN>'.",
        );
      }

      const client = createNovelAiClient({
        token: context.config.apiToken,
        timeoutMs: context.config.requestTimeoutMs,
        maxRetries: context.config.maxRetries,
        debug: context.debug,
        onDebug: (message) => context.logger.debug(message),
      });

      const tasks = jobs.map((job) => async (): Promise<BatchResult> => {
        const startTime = Date.now();
        const seed = options.seed ?? randomInt(0, 4_294_967_296);
        try {
          const validated = validateGenerateParams({
            prompt: job.prompt,
            negativePrompt: options.negative,
            model: job.model,
            sampler: job.sampler,
            width: options.width ?? 1024,
            height: options.height ?? 1024,
            steps: options.steps ?? 28,
            scale: options.scale ?? 5,
            seed,
            outputDir,
          });

          const payload = buildGeneratePayload({
            model: validated.model,
            prompt: validated.prompt,
            negativePrompt: validated.negativePrompt,
            sampler: validated.sampler,
            width: validated.width,
            height: validated.height,
            steps: validated.steps,
            scale: validated.scale,
            seed: validated.seed,
          });

          if (isBatch) {
            console.log(`[${job.index + 1}/${jobs.length}] Generating...`);
          }

          const response = await client.postJson(
            ENDPOINTS.generateImage.path,
            payload,
            undefined,
            ENDPOINTS.generateImage.host,
          );
          const parsed = await parseNovelAiResponse(response);

          if (parsed.kind === "json") {
            console.log(JSON.stringify(parsed.data, null, 2));
            return { job, success: true, durationMs: Date.now() - startTime };
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
            outputTemplate,
            sampler: validated.sampler,
            index: job.index,
          });

          let firstImagePath: string | undefined;
          for (const artifact of output.artifacts) {
            console.log(artifact.imagePath);
            console.log(artifact.metadataPath);
            if (!firstImagePath) firstImagePath = artifact.imagePath;
          }

          // Manifest
          if (isBatch || context.config.manifestEnabled) {
            const manifestEntry: ManifestEntry = {
              prompt: validated.prompt,
              model: validated.model,
              sampler: validated.sampler,
              seed: validated.seed,
              filename: firstImagePath ?? "",
              success: true,
              timestamp: context.now().toISOString(),
            };
            await appendManifest(validated.outputDir, manifestEntry);
          }

          return {
            job,
            success: true,
            filePath: firstImagePath,
            durationMs: Date.now() - startTime,
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);

          // Manifest for failures too
          if (isBatch || context.config.manifestEnabled) {
            const manifestEntry: ManifestEntry = {
              prompt: job.prompt,
              model: job.model,
              sampler: job.sampler,
              seed,
              filename: "",
              success: false,
              error: errorMessage,
              timestamp: context.now().toISOString(),
            };
            await appendManifest(outputDir, manifestEntry);
          }

          if (!isBatch) {
            throw error;
          }

          console.error(`[${job.index + 1}/${jobs.length}] Error: ${errorMessage}`);
          return {
            job,
            success: false,
            error: errorMessage,
            durationMs: Date.now() - startTime,
          };
        }
      });

      const results = await runWithConcurrency(tasks, concurrency);

      if (isBatch) {
        printBatchSummary(results);
      }
    });
}
