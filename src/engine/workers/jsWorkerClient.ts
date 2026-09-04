import type { Board, Player, Algorithm } from "../../types/types";
import type { BenchmarkResult, MonteCarloResult } from "../types";
import type { MoveAnalysis } from "../javascript/analysis/types";

type Pending = {
  resolve: (v: unknown) => void;
  reject: (e: Error) => void;
};

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, Pending>();

const getWorker = (): Worker | null => {
  if (typeof Worker === "undefined") return null;
  if (worker) return worker;
  try {
    worker = new Worker(new URL("./jsEngineWorker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (e: MessageEvent<{ id: number; result?: unknown; error?: string }>) => {
      const { id, result, error } = e.data;
      const p = pending.get(id);
      if (!p) return;
      pending.delete(id);
      if (error) p.reject(new Error(error));
      else p.resolve(result);
    };
    worker.onerror = (e) => {
      console.error("JS Worker error:", e);
      for (const [, p] of pending) p.reject(new Error("JS Worker error"));
      pending.clear();
    };
    return worker;
  } catch (err) {
    console.warn("Failed to create JS Worker, falling back to main thread:", err);
    return null;
  }
};

const postToWorker = <T>(msg: Record<string, unknown>, timeoutMs = 15_000): Promise<T> => {
  const w = getWorker();
  if (!w) return Promise.reject(new Error("Worker not available"));

  const id = nextId++;
  let timeoutHandle: number | null = null;
  const promise = new Promise<T>((resolve, reject) => {
    const wrappedResolve = (v: unknown) => {
      if (timeoutHandle !== null) clearTimeout(timeoutHandle);
      (resolve as (v: unknown) => void)(v);
    };
    const wrappedReject = (e: Error) => {
      if (timeoutHandle !== null) clearTimeout(timeoutHandle);
      reject(e);
    };
    pending.set(id, { resolve: wrappedResolve, reject: wrappedReject });
    timeoutHandle = window.setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        reject(new Error("Worker timeout after " + timeoutMs + "ms"));
      }
    }, timeoutMs);
  });

  // Structured clone board to avoid transfer issues
  w.postMessage({ ...msg, id });
  return promise;
};

// Public API — falls back to main thread if Worker unavailable

import runMonteCarloJS from "../javascript/monteCarlo";
import { runMCTS } from "../javascript/mcts";
import { analyzePosition } from "../javascript/analysis/analyzePosition";
import { analyzeMove } from "../javascript/analysis/analyzeMove";
import { clampSimulations } from "../../utilities/CONSTANTS";
import { mctsResultToMonteCarloResult } from "../javascript/mctsToMonteCarlo";

export const runJsBenchmarkInWorker = async (
  board: Board,
  player: Player,
  simulationsPerMove: number,
  algorithm: Algorithm = "monte-carlo",
): Promise<BenchmarkResult> => {
  const safeSims = clampSimulations(simulationsPerMove);
  try {
    const result = await postToWorker<BenchmarkResult>({
      type: "benchmark",
      board,
      player,
      simulationsPerMove: safeSims,
      algorithm,
    });
    return result;
  } catch {
    // Fallback to main thread
    if (player === null) {
      return { engine: "javascript", algorithm, simulationsPerMove: safeSims, totalSimulations: 0, executionTime: 0, simulationsPerSecond: 0, bestMove: null };
    }
    if (algorithm === "mcts") {
      const r = runMCTS(board, player, safeSims);
      const sps = r.executionTime > 0 ? r.totalSimulations / (r.executionTime / 1000) : 0;
      return { engine: "javascript", algorithm, simulationsPerMove: safeSims, totalSimulations: r.totalSimulations, executionTime: r.executionTime, simulationsPerSecond: sps, bestMove: r.bestMove === -1 ? null : r.bestMove };
    }
    const r = runMonteCarloJS(board, { simulationsPerMove: safeSims, player });
    return { engine: "javascript", algorithm, simulationsPerMove: safeSims, totalSimulations: r.totalSimulations, executionTime: r.executionTime, simulationsPerSecond: r.simulationsPerSecond, bestMove: r.bestMove === -1 ? null : r.bestMove };
  }
};

export const chooseMoveInWorker = async (
  board: Board,
  player: Player,
  simulationsPerMove: number,
  algorithm: Algorithm = "monte-carlo",
  explorationConstant?: number,
): Promise<MoveAnalysis> => {
  const safeSims = clampSimulations(simulationsPerMove);
  try {
    const result = await postToWorker<MoveAnalysis>({
      type: "chooseMove",
      board,
      player,
      simulationsPerMove: safeSims,
      algorithm,
      explorationConstant,
    });
    return result;
  } catch {
    // Fallback to main thread
    if (algorithm === "mcts") {
      const mcts = runMCTS(board, player, safeSims, explorationConstant);
      if (mcts.bestMove === -1) throw new Error("No legal moves available");
      const base = analyzeMove(board, mcts.bestMove, player, 0);
      const visits = mcts.visits.get(mcts.bestMove) ?? 0;
      const winsF = mcts.wins.get(mcts.bestMove) ?? 0;
      const draws = mcts.draws.get(mcts.bestMove) ?? 0;
      const winRate = visits > 0 ? (winsF / visits) * 100 : 0;
      const pureWins = Math.max(0, Math.round(winsF - draws * 0.5));
      const losses = Math.max(0, visits - pureWins - draws);
      const tier = base.isImmediateWin ? 3 : base.blocksImmediateLoss ? 2 : base.createsFork ? 1 : 0;
      let finalScore = tier * 1000 + winRate + base.evaluationScore / 10;
      if (base.allowsOpponentFork) finalScore -= 15;
      if (!base.legal) finalScore = Number.NEGATIVE_INFINITY;
      return { ...base, simulations: visits, wins: pureWins, losses, draws, winRate, finalScore };
    }
    const analysis = analyzePosition(board, player, safeSims);
    if (analysis.length === 0) throw new Error("No legal moves available");
    return analysis[0];
  }
};

export const runMonteCarloInWorker = async (
  board: Board,
  player: Player,
  simulationsPerMove: number,
  algorithm: Algorithm = "monte-carlo",
): Promise<MonteCarloResult> => {
  const safeSims = clampSimulations(simulationsPerMove);
  try {
    const result = await postToWorker<MonteCarloResult>({
      type: "monteCarloResult",
      board,
      player,
      simulationsPerMove: safeSims,
      algorithm,
    });
    return result;
  } catch {
    // Fallback to main thread
    if (algorithm === "mcts") {
      const r = runMCTS(board, player, safeSims);
      return mctsResultToMonteCarloResult(r);
    }
    return runMonteCarloJS(board, { simulationsPerMove: safeSims, player: player as Player });
  }
};

export const isJsWorkerAvailable = (): boolean => typeof Worker !== "undefined";

export const terminateJsWorker = () => {
  if (worker) {
    worker.terminate();
    worker = null;
    pending.clear();
  }
};
