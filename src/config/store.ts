import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ZodError } from "zod";

import { ConfigError } from "../core/errors.js";
import { getConfigFilePath } from "./paths.js";
import { configSchema, defaultConfig, type NaiCliConfig } from "./schema.js";

export interface LoadConfigOptions {
  configPath?: string | undefined;
  env?: NodeJS.ProcessEnv | undefined;
}

export interface LoadedConfig {
  config: NaiCliConfig;
  configPath: string;
  source: "default" | "file";
}

function parseConfigObject(raw: unknown, configPath: string): NaiCliConfig {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new ConfigError(`Config at '${configPath}' must be a JSON object.`);
  }

  try {
    return configSchema.parse({
      ...defaultConfig,
      ...raw,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const messages = error.issues
        .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
        .join("; ");
      throw new ConfigError(`Invalid config at '${configPath}': ${messages}`, {
        cause: error,
      });
    }
    throw error;
  }
}

function applyEnvOverrides(config: NaiCliConfig, env: NodeJS.ProcessEnv): NaiCliConfig {
  const tokenFromEnv = env["NAI_API_TOKEN"]?.trim();
  if (!tokenFromEnv) {
    return config;
  }
  return {
    ...config,
    apiToken: tokenFromEnv,
  };
}

export async function loadConfig(options: LoadConfigOptions = {}): Promise<LoadedConfig> {
  const env = options.env ?? process.env;
  const configPath = getConfigFilePath(options.configPath, env);

  try {
    const raw = await readFile(configPath, "utf8");
    const parsedJson = JSON.parse(raw) as unknown;
    const config = parseConfigObject(parsedJson, configPath);
    return {
      config: applyEnvOverrides(config, env),
      configPath,
      source: "file",
    };
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error) {
      const fsError = error as NodeJS.ErrnoException;
      if (fsError.code === "ENOENT") {
        return {
          config: applyEnvOverrides(defaultConfig, env),
          configPath,
          source: "default",
        };
      }
    }

    if (error instanceof SyntaxError) {
      throw new ConfigError(`Config at '${configPath}' is not valid JSON.`, {
        cause: error,
      });
    }

    throw error;
  }
}

export async function saveConfig(
  config: NaiCliConfig,
  options: LoadConfigOptions = {},
): Promise<string> {
  const env = options.env ?? process.env;
  const configPath = getConfigFilePath(options.configPath, env);

  const parsed = configSchema.parse(config);
  await mkdir(path.dirname(configPath), { recursive: true });
  await writeFile(configPath, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
  return configPath;
}

export async function updateConfig(
  updater: (current: NaiCliConfig) => NaiCliConfig,
  options: LoadConfigOptions = {},
): Promise<LoadedConfig> {
  const loaded = await loadConfig(options);
  const nextConfig = updater(loaded.config);
  await saveConfig(nextConfig, options);
  return {
    ...loaded,
    config: nextConfig,
    source: "file",
  };
}
