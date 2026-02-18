#!/usr/bin/env node

import { Command, CommanderError } from "commander";
import { fileURLToPath } from "node:url";

import { registerConfigCommand } from "./commands/config.js";
import { registerGenerateCommand } from "./commands/generate.js";
import { registerImg2ImgCommand } from "./commands/img2img.js";
import { registerInpaintCommand } from "./commands/inpaint.js";
import { registerPresetCommand } from "./commands/preset.js";
import { registerSuggestTagsCommand } from "./commands/suggest-tags.js";
import { registerUpscaleCommand } from "./commands/upscale.js";
import { toCliError } from "./core/errors.js";

export function buildProgram(): Command {
  const program = new Command();

  program
    .name("nai")
    .description("NovelAI image generation CLI")
    .option("--debug", "Enable debug logging")
    .option("--config <path>", "Path to config.json")
    .showHelpAfterError()
    .exitOverride();

  registerGenerateCommand(program);
  registerImg2ImgCommand(program);
  registerInpaintCommand(program);
  registerUpscaleCommand(program);
  registerSuggestTagsCommand(program);
  registerPresetCommand(program);
  registerConfigCommand(program);

  return program;
}

function printCliError(error: unknown, debug: boolean): number {
  const cliError = toCliError(error);
  console.error(`[${cliError.code}] ${cliError.message}`);

  if (debug && error instanceof Error && error.stack) {
    console.error(error.stack);
  }

  return cliError.exitCode;
}

export async function main(argv: string[] = process.argv): Promise<number> {
  const program = buildProgram();

  try {
    await program.parseAsync(argv);
    return 0;
  } catch (error) {
    if (error instanceof CommanderError) {
      if (error.code === "commander.helpDisplayed") {
        return 0;
      }
      return error.exitCode;
    }

    const debug = (program.opts() as { debug?: boolean }).debug ?? false;
    return printCliError(error, debug);
  }
}

const runningAsScript =
  process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1];

if (runningAsScript) {
  void main().then((exitCode) => {
    process.exitCode = exitCode;
  });
}
