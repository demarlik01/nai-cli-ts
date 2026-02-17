export type CliErrorCode =
  | "CONFIG_ERROR"
  | "VALIDATION_ERROR"
  | "API_ERROR"
  | "NETWORK_ERROR"
  | "IO_ERROR"
  | "COMMAND_ERROR";

export interface CliErrorOptions {
  cause?: unknown;
  details?: unknown;
  exitCode?: number;
}

export class CliError extends Error {
  readonly code: CliErrorCode;
  readonly exitCode: number;
  readonly details?: unknown;

  constructor(code: CliErrorCode, message: string, options: CliErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = "CliError";
    this.code = code;
    this.exitCode = options.exitCode ?? 1;
    this.details = options.details;
  }
}

export class ConfigError extends CliError {
  constructor(message: string, options: CliErrorOptions = {}) {
    super("CONFIG_ERROR", message, options);
    this.name = "ConfigError";
  }
}

export class ValidationError extends CliError {
  constructor(message: string, options: CliErrorOptions = {}) {
    super("VALIDATION_ERROR", message, options);
    this.name = "ValidationError";
  }
}

export interface ApiErrorOptions extends CliErrorOptions {
  status: number;
  endpoint: string;
}

export class ApiError extends CliError {
  readonly status: number;
  readonly endpoint: string;

  constructor(message: string, options: ApiErrorOptions) {
    super("API_ERROR", message, options);
    this.name = "ApiError";
    this.status = options.status;
    this.endpoint = options.endpoint;
  }
}

export class NetworkError extends CliError {
  constructor(message: string, options: CliErrorOptions = {}) {
    super("NETWORK_ERROR", message, options);
    this.name = "NetworkError";
  }
}

export class IoError extends CliError {
  constructor(message: string, options: CliErrorOptions = {}) {
    super("IO_ERROR", message, options);
    this.name = "IoError";
  }
}

export function toCliError(error: unknown): CliError {
  if (error instanceof CliError) {
    return error;
  }

  if (error instanceof Error) {
    return new CliError("COMMAND_ERROR", error.message, { cause: error });
  }

  return new CliError("COMMAND_ERROR", "An unexpected error occurred.", {
    details: error,
  });
}
