/**
 * Phase 21.2 — Isolate WASM boundary cost from engine cost.
 *
 * Measures:
 *  A. WASM init time (loadWasm)
 *  B. JS ↔ WASM invocation overhead (empty call)
 *  C. Engine time (already captured as executionTime in BenchmarkResult)
 *
 * Boundary overhead per call ≈ (wall time - engine executionTime).
 */
import { loadWasm } from "../golang/wasmLoader";
import type { Board } from "../../types/types";

export type BoundaryMeasurement = {
  wasmInitMs: number | null;
  jsInvokeOverheadMs: number | null;
  wasmInvokeOverheadMs: number | null;
  note: string;
};

const time = () => performance.now();

export const measureWasmInit = async (): Promise<number> => {
  const start = time();
  await loadWasm();
  return time() - start;
};

export const measureJsInvokeOverhead = async (
  board: Board,
  _iterations = 1000,
): Promise<number> => {
  // Time a trivial Worker round-trip vs direct call overhead.
  // We measure the wall time for 1-simulation JS benchmark; engine time is captured inside result.
  const { runJsBenchmark } = await import("./benchmarkRunner");
  const wallStart = time();
  const result = await runJsBenchmark(board, "red", 1, "monte-carlo");
  const wall = time() - wallStart;
  // overhead = wall - engine executionTime (worker post + clone)
  return Math.max(0, wall - result.executionTime);
};

export const measureWasmInvokeOverhead = async (
  board: Board,
  _iterations = 1,
): Promise<number | null> => {
  const { runWasmBenchmark } = await import("./benchmarkRunner");
  try {
    const wallStart = time();
    const result = await runWasmBenchmark(board, "red", 1, "monte-carlo");
    const wall = time() - wallStart;
    return Math.max(0, wall - result.executionTime);
  } catch {
    return null; // WASM not ready
  }
};

export const measureBoundary = async (board: Board): Promise<BoundaryMeasurement> => {
  const wasmInitMs = await measureWasmInit().catch(() => null as unknown as number);
  const jsInvokeOverheadMs = await measureJsInvokeOverhead(board).catch(() => null as unknown as number);
  const wasmInvokeOverheadMs = await measureWasmInvokeOverhead(board);
  return {
    wasmInitMs,
    jsInvokeOverheadMs,
    wasmInvokeOverheadMs,
    note: "overhead = wallTime - engineExecutionTime; includes structured clone + postMessage/WASM bridge",
  };
};
