import { Command } from "commander";

import { loadConfig, saveConfig, updateConfig } from "../config/store.js";
import { ConfigError } from "../core/errors.js";
import type { GlobalCliOptions } from "../types/commands.js";

function resolveGlobalOptions(command: Command): GlobalCliOptions {
  const commandWithGlobals = command as Command & {
    optsWithGlobals?: () => unknown;
  };
  const raw = commandWithGlobals.optsWithGlobals?.() ?? command.parent?.opts() ?? {};
  return raw as GlobalCliOptions;
}

function redactToken(token: string | null): string | null {
  if (!token) {
    return null;
  }

  if (token.length <= 8) {
    return "****";
  }

  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

export function registerConfigCommand(program: Command): void {
  const config = program.command("config").description("Manage local nai-cli configuration");

  config
    .command("set-token")
    .argument("<token>", "NovelAI bearer token")
    .description("Set API token in local config store")
    .action(async (token: string, _options: unknown, command: Command) => {
      const globals = resolveGlobalOptions(command);
      const trimmed = token.trim();
      if (!trimmed) {
        throw new ConfigError("Token cannot be empty.");
      }

      const updated = await updateConfig(
        (current) => ({
          ...current,
          apiToken: trimmed,
        }),
        { configPath: globals.config },
      );

      console.log(`Token saved in '${updated.configPath}'.`);
    });

  config
    .command("show")
    .description("Show effective config (token is redacted)")
    .action(async (_options: unknown, command: Command) => {
      const globals = resolveGlobalOptions(command);
      const loaded = await loadConfig({ configPath: globals.config });

      const visible = {
        ...loaded.config,
        apiToken: redactToken(loaded.config.apiToken),
      };

      console.log(JSON.stringify(visible, null, 2));
      console.log(`configPath: ${loaded.configPath}`);
      console.log(`source: ${loaded.source}`);
    });

  config
    .command("validate")
    .description("Validate config file and required auth settings")
    .action(async (_options: unknown, command: Command) => {
      const globals = resolveGlobalOptions(command);
      const loaded = await loadConfig({ configPath: globals.config });

      if (!loaded.config.apiToken) {
        throw new ConfigError(
          `Config is valid but apiToken is missing. Set it with 'nai config set-token <TOKEN>'.`,
        );
      }

      await saveConfig(loaded.config, { configPath: globals.config });
      console.log(`Config is valid: ${loaded.configPath}`);
    });
}
