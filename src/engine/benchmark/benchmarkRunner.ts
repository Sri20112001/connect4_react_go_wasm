import type { Board, Player, Algorithm } from "../../types/types";
import type {
  BenchmarkResult,
  BenchmarkComparison,
  BenchmarkOptions,
  BenchmarkStats,
  BenchmarkAggregate,
  BenchmarkEnvironment,
  ReliableBenchmarkComparison,
} from "../types";
import { runJsBenchmarkInWorker } from "../workers/jsWorkerClient";
import { loadWasm } from "../golang/wasmLoader";
import { getWasmStatus } from "../golang/wasmLoader";
import { clampSimulations } from "../../utilities/CONSTANTS";

const toBenchmarkResult = (
  engine: "javascript" | "wasm",
  algorithm: Algorithm,
  simulationsPerMove: number,
  bestMove: number | null,
  totalSimulations: number,
  executionTime: number,
  simulationsPerSecond: number,
): BenchmarkResult => ({
  engine,
  algorithm,
  simulationsPerMove,
  totalSimulations,
  executionTime,
  simulationsPerSecond,
  bestMove,
});

export const runJsBenchmark = async (
  board: Board,
  player: Player,
  simulationsPerMove: number,
  algorithm: Algorithm = "monte-carlo",
): Promise<BenchmarkResult> => {
  const safeSims = clampSimulations(simulationsPerMove);
  if (player === null) {
    return toBenchmarkResult("javascript", algorithm, safeSims, null, 0, 0, 0);
  }

  // Offload to Worker to keep main thread responsive
  return runJsBenchmarkInWorker(board, player, safeSims, algorithm);
};

export const runWasmBenchmark = async (
  board: Board,
  player: Player,
  simulationsPerMove: number,
  algorithm: Algorithm = "monte-carlo",
): Promise<BenchmarkResult> => {
  const safeSims = clampSimulations(simulationsPerMove);
  if (player === null) {
    return toBenchmarkResult("wasm", algorithm, safeSims, null, 0, 0, 0);
  }

  await loadWasm();

  if (algorithm === "mcts") {
    const wasmResult = (
      window as unknown as {
        connect4RunMCTS?: (opts: {
          board: Board;
          player: Player;
          simulationsPerMove: number;
        }) => {
          bestMove: number;
          totalSimulations: number;
          executionTime: number;
          simulationsPerSecond: number;
        };
      }
    ).connect4RunMCTS?.({ board, player, simulationsPerMove: safeSims });
    if (!wasmResult) throw new Error("WASM MCTS not ready");
    return toBenchmarkResult(
      "wasm",
      algorithm,
      safeSims,
      wasmResult.bestMove === -1 ? null : wasmResult.bestMove,
      wasmResult.totalSimulations,
      wasmResult.executionTime,
      wasmResult.simulationsPerSecond,
    );
  }

  const wasmResult = (
    window as unknown as {
      connect4RunMonteCarlo?: (opts: {
        board: Board;
        player: Player;
        simulationsPerMove: number;
      }) => {
        bestMove: number;
        totalSimulations: number;
        executionTime: number;
        simulationsPerSecond: number;
      };
    }
  ).connect4RunMonteCarlo?.({ board, player, simulationsPerMove: safeSims });

  if (!wasmResult) throw new Error("WASM engine not ready");

  return toBenchmarkResult(
    "wasm",
    algorithm,
    safeSims,
    wasmResult.bestMove === -1 ? null : wasmResult.bestMove,
    wasmResult.totalSimulations,
    wasmResult.executionTime,
    wasmResult.simulationsPerSecond,
  );
};

export const runComparison = async (
  board: Board,
  player: Player,
  simulationsPerMove: number,
  algorithm: Algorithm = "monte-carlo",
): Promise<BenchmarkComparison> => {
  const js = await runJsBenchmark(board, player, simulationsPerMove, algorithm);
  await new Promise<void>((r) => setTimeout(r, 0));
  const wasm = await runWasmBenchmark(board, player, simulationsPerMove, algorithm);

  const speedup = wasm.executionTime > 0 ? js.executionTime / wasm.executionTime : null;
  const parity = js.bestMove !== null && wasm.bestMove !== null ? js.bestMove === wasm.bestMove : null;

  return { simulationsPerMove, javascript: js, wasm, speedup, parity };
};

export const runWorkloads = async (
  board: Board,
  player: Player,
  workloads: number[],
  onProgress?: (completed: number, total: number) => void,
  algorithm: Algorithm = "monte-carlo",
): Promise<BenchmarkComparison[]> => {
  const out: BenchmarkComparison[] = [];
  for (let i = 0; i < workloads.length; i++) {
    const comp = await runComparison(board, player, workloads[i], algorithm);
    out.push(comp);
    onProgress?.(i + 1, workloads.length);
    await new Promise<void>((r) => setTimeout(r, 0));
  }
  return out;
};

export const runParityVerification = async (
  boards: { board: Board; player: Player }[],
  simulationsPerMove: number,
  algorithm: Algorithm = "monte-carlo",
): Promise<{ index: number; jsBest: number | null; wasmBest: number | null; parity: boolean }[]> => {
  const results: { index: number; jsBest: number | null; wasmBest: number | null; parity: boolean }[] = [];
  for (let i = 0; i < boards.length; i++) {
    const { board, player } = boards[i];
    try {
      const js = await runJsBenchmark(board, player, simulationsPerMove, algorithm);
      await new Promise<void>((r) => setTimeout(r, 0));
      const wasm = await runWasmBenchmark(board, player, simulationsPerMove, algorithm);
      const parity = js.bestMove !== null && wasm.bestMove !== null && js.bestMove === wasm.bestMove;
      results.push({ index: i, jsBest: js.bestMove, wasmBest: wasm.bestMove, parity });
    } catch {
      results.push({ index: i, jsBest: null, wasmBest: null, parity: false });
    }
    await new Promise<void>((r) => setTimeout(r, 0));
  }
  return results;
};

// --- Phase 19: reliability ---

const median = (values: number[]): number => {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
};

const average = (values: number[]): number => {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
};

const stddev = (values: number[]): number => {
  if (values.length <= 1) return 0;
  const avg = average(values);
  const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
};

export const computeBenchmarkStats = (runs: BenchmarkResult[]): BenchmarkStats => {
  const times = runs.map((r) => r.executionTime);
  const sps = runs.map((r) => r.simulationsPerSecond);
  return {
    averageExecutionTime: average(times),
    medianExecutionTime: median(times),
    minExecutionTime: times.length ? Math.min(...times) : 0,
    maxExecutionTime: times.length ? Math.max(...times) : 0,
    standardDeviation: stddev(times),
    averageSimulationsPerSecond: average(sps),
    medianSimulationsPerSecond: median(sps),
  };
};

const captureEnvironment = (): BenchmarkEnvironment => ({
  userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
  hardwareConcurrency: typeof navigator !== "undefined" ? (navigator.hardwareConcurrency ?? null) : null,
  deviceMemory:
    typeof navigator !== "undefined" ? ((navigator as unknown as { deviceMemory?: number }).deviceMemory ?? null) : null,
  timestamp: new Date().toISOString(),
  wasmStatus: getWasmStatus(),
});

export const runReliableComparison = async (
  board: Board,
  player: Player,
  simulationsPerMove: number,
  options: Pick<BenchmarkOptions, "warmupRuns" | "measuredRuns" | "alternateOrder" | "algorithm">,
): Promise<ReliableBenchmarkComparison> => {
  const algorithm = options.algorithm ?? "monte-carlo";
  const warmupRuns = Math.max(0, options.warmupRuns);
  const measuredRuns = Math.max(1, options.measuredRuns);

  // Warmup (discarded)
  for (let i = 0; i < warmupRuns; i++) {
    if (options.alternateOrder && i % 2 === 1) {
      await runWasmBenchmark(board, player, simulationsPerMove, algorithm);
      await new Promise<void>((r) => setTimeout(r, 0));
      await runJsBenchmark(board, player, simulationsPerMove, algorithm);
    } else {
      await runJsBenchmark(board, player, simulationsPerMove, algorithm);
      await new Promise<void>((r) => setTimeout(r, 0));
      await runWasmBenchmark(board, player, simulationsPerMove, algorithm);
    }
    await new Promise<void>((r) => setTimeout(r, 0));
  }

  const jsRuns: BenchmarkResult[] = [];
  const wasmRuns: BenchmarkResult[] = [];

  for (let i = 0; i < measuredRuns; i++) {
    if (options.alternateOrder && i % 2 === 1) {
      const wasm = await runWasmBenchmark(board, player, simulationsPerMove, algorithm);
      await new Promise<void>((r) => setTimeout(r, 0));
      const js = await runJsBenchmark(board, player, simulationsPerMove, algorithm);
      wasmRuns.push(wasm);
      jsRuns.push(js);
    } else {
      const js = await runJsBenchmark(board, player, simulationsPerMove, algorithm);
      await new Promise<void>((r) => setTimeout(r, 0));
      const wasm = await runWasmBenchmark(board, player, simulationsPerMove, algorithm);
      jsRuns.push(js);
      wasmRuns.push(wasm);
    }
    await new Promise<void>((r) => setTimeout(r, 0));
  }

  const jsStats = computeBenchmarkStats(jsRuns);
  const wasmStats = computeBenchmarkStats(wasmRuns);

  const jsAgg: BenchmarkAggregate = { engine: "javascript", algorithm, simulationsPerMove, runs: jsRuns, stats: jsStats };
  const wasmAgg: BenchmarkAggregate = { engine: "wasm", algorithm, simulationsPerMove, runs: wasmRuns, stats: wasmStats };

  const medianSpeedup = wasmStats.medianExecutionTime > 0 ? jsStats.medianExecutionTime / wasmStats.medianExecutionTime : null;
  const averageSpeedup = wasmStats.averageExecutionTime > 0 ? jsStats.averageExecutionTime / wasmStats.averageExecutionTime : null;

  const pairParities = jsRuns.map((js, i) => {
    const wasm = wasmRuns[i];
    if (!wasm) return false;
    return js.bestMove !== null && wasm.bestMove !== null && js.bestMove === wasm.bestMove;
  });
  const parity: boolean | null =
    pairParities.length === 0 ? null : pairParities.every(Boolean) ? true : false;

  return {
    simulationsPerMove,
    algorithm,
    javascript: jsAgg,
    wasm: wasmAgg,
    medianSpeedup,
    averageSpeedup,
    parity,
    environment: captureEnvironment(),
  };
};

export const runReliableWorkloads = async (
  board: Board,
  player: Player,
  options: BenchmarkOptions,
  onProgress?: (completed: number, total: number) => void,
): Promise<ReliableBenchmarkComparison[]> => {
  const out: ReliableBenchmarkComparison[] = [];
  for (let i = 0; i < options.workloads.length; i++) {
    const comp = await runReliableComparison(board, player, options.workloads[i], options);
    out.push(comp);
    onProgress?.(i + 1, options.workloads.length);
    await new Promise<void>((r) => setTimeout(r, 0));
  }
  return out;
};

// --- Phase 21: scaling protocol ---

export const SCALING_WORKLOADS = [1000, 5000, 10000, 25000, 50000, 100000] as const;

export const DEFAULT_SCALING_PROTOCOL: BenchmarkOptions = {
  workloads: [...SCALING_WORKLOADS],
  warmupRuns: 2,
  measuredRuns: 5,
  alternateOrder: true,
  algorithm: "monte-carlo",
};

export const toScalingCsv = (results: ReliableBenchmarkComparison[]): string => {
  const header = [
    "simulationsPerMove",
    "algorithm",
    "js_median_ms",
    "wasm_median_ms",
    "js_avg_ms",
    "wasm_avg_ms",
    "js_median_sps",
    "wasm_median_sps",
    "median_speedup",
    "average_speedup",
    "parity",
  ].join(",");
  const rows = results.map((r) =>
    [
      r.simulationsPerMove,
      r.algorithm,
      r.javascript?.stats.medianExecutionTime.toFixed(2) ?? "",
      r.wasm?.stats.medianExecutionTime.toFixed(2) ?? "",
      r.javascript?.stats.averageExecutionTime.toFixed(2) ?? "",
      r.wasm?.stats.averageExecutionTime.toFixed(2) ?? "",
      r.javascript?.stats.medianSimulationsPerSecond.toFixed(0) ?? "",
      r.wasm?.stats.medianSimulationsPerSecond.toFixed(0) ?? "",
      r.medianSpeedup?.toFixed(3) ?? "",
      r.averageSpeedup?.toFixed(3) ?? "",
      r.parity === null ? "" : String(r.parity),
    ].join(","),
  );
  return [header, ...rows].join("\n");
};
