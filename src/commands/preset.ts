import { Command } from "commander";

import { ValidationError } from "../core/errors.js";
import { deletePreset, listPresets, loadPreset, savePreset } from "../preset/store.js";
import type { Preset } from "../preset/schema.js";

export function registerPresetCommand(program: Command): void {
  const preset = program.command("preset").description("Manage generation presets");

  preset
    .command("save")
    .argument("<name>", "Preset name")
    .option("--model <id>", "Model ID")
    .option("--sampler <id>", "Sampler ID")
    .option("--width <number>", "Image width")
    .option("--height <number>", "Image height")
    .option("--steps <number>", "Sampling steps")
    .option("--scale <number>", "CFG scale")
    .option("--negative <text>", "Negative prompt")
    .option("--out <dir>", "Output directory")
    .option("--output-template <template>", "Output filename template")
    .description("Save current options as a preset")
    .action(
      async (
        name: string,
        options: {
          model?: string;
          sampler?: string;
          width?: string;
          height?: string;
          steps?: string;
          scale?: string;
          negative?: string;
          out?: string;
          outputTemplate?: string;
        },
      ) => {
        const presetData: Preset = { name };

        if (options.model) presetData.model = options.model as Preset["model"];
        if (options.sampler) presetData.sampler = options.sampler as Preset["sampler"];
        if (options.width) presetData.width = Number.parseInt(options.width, 10);
        if (options.height) presetData.height = Number.parseInt(options.height, 10);
        if (options.steps) presetData.steps = Number.parseInt(options.steps, 10);
        if (options.scale) presetData.scale = Number.parseFloat(options.scale);
        if (options.negative) presetData.negative = options.negative;
        if (options.out) presetData.outputDir = options.out;
        if (options.outputTemplate) presetData.outputTemplate = options.outputTemplate;

        const filePath = await savePreset(presetData);
        console.log(`Preset '${name}' saved to ${filePath}`);
      },
    );

  preset
    .command("list")
    .description("List available presets")
    .action(async () => {
      const names = await listPresets();
      if (names.length === 0) {
        console.log("No presets found.");
        return;
      }
      for (const name of names) {
        console.log(name);
      }
    });

  preset
    .command("show")
    .argument("<name>", "Preset name")
    .description("Show preset contents")
    .action(async (name: string) => {
      const presetData = await loadPreset(name);
      console.log(JSON.stringify(presetData, null, 2));
    });

  preset
    .command("delete")
    .argument("<name>", "Preset name")
    .description("Delete a preset")
    .action(async (name: string) => {
      await deletePreset(name);
      console.log(`Preset '${name}' deleted.`);
    });
}
