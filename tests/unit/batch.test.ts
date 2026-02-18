import { describe, expect, it } from "vitest";

import { buildBatchMatrix, runWithConcurrency } from "../../src/core/batch.js";

describe("buildBatchMatrix", () => {
  it("creates cartesian product of prompts, models, and samplers", () => {
    const jobs = buildBatchMatrix(
      ["prompt1", "prompt2"],
      ["modelA", "modelB"],
      ["samplerX"],
    );
    expect(jobs).toHaveLength(4);
    expect(jobs[0]).toEqual({ prompt: "prompt1", model: "modelA", sampler: "samplerX", index: 0 });
    expect(jobs[1]).toEqual({ prompt: "prompt1", model: "modelB", sampler: "samplerX", index: 1 });
    expect(jobs[2]).toEqual({ prompt: "prompt2", model: "modelA", sampler: "samplerX", index: 2 });
    expect(jobs[3]).toEqual({ prompt: "prompt2", model: "modelB", sampler: "samplerX", index: 3 });
  });

  it("returns empty array for empty inputs", () => {
    expect(buildBatchMatrix([], ["m"], ["s"])).toEqual([]);
  });
});

describe("runWithConcurrency", () => {
  it("runs tasks sequentially with concurrency 1", async () => {
    const order: number[] = [];
    const tasks = [0, 1, 2].map(
      (i) => async () => {
        order.push(i);
        return i * 2;
      },
    );
    const results = await runWithConcurrency(tasks, 1);
    expect(results).toEqual([0, 2, 4]);
    expect(order).toEqual([0, 1, 2]);
  });

  it("runs tasks concurrently with concurrency > 1", async () => {
    const results = await runWithConcurrency(
      [() => Promise.resolve("a"), () => Promise.resolve("b"), () => Promise.resolve("c")],
      3,
    );
    expect(results).toEqual(["a", "b", "c"]);
  });

  it("handles empty task list", async () => {
    const results = await runWithConcurrency([], 5);
    expect(results).toEqual([]);
  });
});
