import { readFile } from "node:fs/promises";

import { IoError } from "./errors.js";

export interface BatchJob {
  prompt: string;
  model: string;
  sampler: string;
  index: number;
}

export async function loadPromptFile(filePath: string): Promise<string[]> {
  let content: string;
  try {
    content = await readFile(filePath, "utf8");
  } catch (error) {
    if (error instanceof Error) {
      throw new IoError(`Failed to read prompt file '${filePath}': ${error.message}`, {
        cause: error,
      });
    }
    throw new IoError(`Failed to read prompt file '${filePath}'.`);
  }

  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

export function buildBatchMatrix(
  prompts: string[],
  models: string[],
  samplers: string[],
): BatchJob[] {
  const jobs: BatchJob[] = [];
  let index = 0;

  for (const prompt of prompts) {
    for (const model of models) {
      for (const sampler of samplers) {
        jobs.push({ prompt, model, sampler, index: index++ });
      }
    }
  }

  return jobs;
}

export interface BatchResult {
  job: BatchJob;
  success: boolean;
  filePath?: string | undefined;
  error?: string | undefined;
  durationMs: number;
}

export function printBatchSummary(results: BatchResult[]): void {
  const succeeded = results.filter((r) => r.success).length;
  const failed = results.length - succeeded;

  console.log(`\nBatch complete: ${succeeded} succeeded, ${failed} failed out of ${results.length} total.`);

  if (failed > 0) {
    console.log("\nFailed jobs:");
    for (const result of results) {
      if (!result.success) {
        console.log(`  [${result.job.index}] ${result.job.prompt.slice(0, 60)} — ${result.error}`);
      }
    }
  }
}

export async function runWithConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  concurrency: number,
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < tasks.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      const task = tasks[currentIndex];
      if (task) {
        results[currentIndex] = await task();
      }
    }
  }

  if (concurrency < 1) {
    throw new Error("Concurrency must be at least 1.");
  }
  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}
