import { loadConfig, type LoadConfigOptions } from "../config/store.js";
import type { NaiCliConfig } from "../config/schema.js";

export interface Logger {
  info: (...messages: unknown[]) => void;
  error: (...messages: unknown[]) => void;
  debug: (...messages: unknown[]) => void;
}

export interface RuntimeContextOptions extends LoadConfigOptions {
  debug?: boolean | undefined;
  cwd?: string | undefined;
  now?: (() => Date) | undefined;
}

export interface RuntimeContext {
  config: NaiCliConfig;
  configPath: string;
  debug: boolean;
  cwd: string;
  now: () => Date;
  logger: Logger;
}

function createLogger(debugEnabled: boolean): Logger {
  return {
    info: (...messages) => {
      console.log(...messages);
    },
    error: (...messages) => {
      console.error(...messages);
    },
    debug: (...messages) => {
      if (debugEnabled) {
        console.error("[debug]", ...messages);
      }
    },
  };
}

export async function createRuntimeContext(
  options: RuntimeContextOptions = {},
): Promise<RuntimeContext> {
  const loaded = await loadConfig(options);
  const debug = options.debug ?? loaded.config.debug;

  return {
    config: loaded.config,
    configPath: loaded.configPath,
    debug,
    cwd: options.cwd ?? process.cwd(),
    now: options.now ?? (() => new Date()),
    logger: createLogger(debug),
  };
}
