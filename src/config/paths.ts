import { homedir } from "node:os";
import path from "node:path";

const CONFIG_DIR_NAME = "nai-cli";
const CONFIG_FILE_NAME = "config.json";

export function getConfigDirPath(env: NodeJS.ProcessEnv = process.env): string {
  const xdgHome = env["XDG_CONFIG_HOME"];
  const base = xdgHome
    ? path.resolve(xdgHome)
    : path.join(homedir(), ".config");
  return path.join(base, CONFIG_DIR_NAME);
}

export function getConfigFilePath(
  inputPath?: string,
  env: NodeJS.ProcessEnv = process.env,
): string {
  if (inputPath) {
    return path.resolve(inputPath);
  }
  return path.join(getConfigDirPath(env), CONFIG_FILE_NAME);
}
