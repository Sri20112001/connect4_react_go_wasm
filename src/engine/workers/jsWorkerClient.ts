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

const postToWorker = <T>(msg: Record<string, unknown>): Promise<T> => {
  const w = getWorker();
  if (!w) return Promise.reject(new Error("Worker not available"));

  const id = nextId++;
  const promise = new Promise<T>((resolve, reject) => {
    pending.set(id, { resolve: resolve as (v: unknown) => void, reject });
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

export const runJsBenchmarkInWorker = async (
  board: Board,
  player: Player,
  simulationsPerMove: number,
  algorithm: Algorithm = "monte-carlo",
): Promise<BenchmarkResult> => {
  try {
    const result = await postToWorker<BenchmarkResult>({
      type: "benchmark",
      board,
      player,
      simulationsPerMove,
      algorithm,
    });
    return result;
  } catch {
    // Fallback to main thread
    if (player === null) {
      return { engine: "javascript", algorithm, simulationsPerMove, totalSimulations: 0, executionTime: 0, simulationsPerSecond: 0, bestMove: null };
    }
    if (algorithm === "mcts") {
      const r = runMCTS(board, player, simulationsPerMove);
      const sps = r.executionTime > 0 ? r.totalSimulations / (r.executionTime / 1000) : 0;
      return { engine: "javascript", algorithm, simulationsPerMove, totalSimulations: r.totalSimulations, executionTime: r.executionTime, simulationsPerSecond: sps, bestMove: r.bestMove === -1 ? null : r.bestMove };
    }
    const r = runMonteCarloJS(board, { simulationsPerMove, player });
    return { engine: "javascript", algorithm, simulationsPerMove, totalSimulations: r.totalSimulations, executionTime: r.executionTime, simulationsPerSecond: r.simulationsPerSecond, bestMove: r.bestMove === -1 ? null : r.bestMove };
  }
};

export const chooseMoveInWorker = async (
  board: Board,
  player: Player,
  simulationsPerMove: number,
  algorithm: Algorithm = "monte-carlo",
  explorationConstant?: number,
): Promise<MoveAnalysis> => {
  try {
    const result = await postToWorker<MoveAnalysis>({
      type: "chooseMove",
      board,
      player,
      simulationsPerMove,
      algorithm,
      explorationConstant,
    });
    return result;
  } catch {
    // Fallback to main thread
    if (algorithm === "mcts") {
      const mcts = runMCTS(board, player, simulationsPerMove, explorationConstant);
      if (mcts.bestMove === -1) throw new Error("No legal moves available");
      const base = analyzeMove(board, mcts.bestMove, player, 0);
      const visits = mcts.visits.get(mcts.bestMove) ?? 0;
      const winsF = mcts.wins.get(mcts.bestMove) ?? 0;
      const winRate = visits > 0 ? (winsF / visits) * 100 : 0;
      const tier = base.isImmediateWin ? 3 : base.blocksImmediateLoss ? 2 : base.createsFork ? 1 : 0;
      let finalScore = tier * 1000 + winRate + base.evaluationScore / 10;
      if (base.allowsOpponentFork) finalScore -= 15;
      if (!base.legal) finalScore = Number.NEGATIVE_INFINITY;
      return { ...base, simulations: visits, wins: Math.round(winsF), losses: visits - Math.round(winsF), draws: 0, winRate, finalScore };
    }
    const analysis = analyzePosition(board, player, simulationsPerMove);
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
  try {
    const result = await postToWorker<MonteCarloResult>({
      type: "monteCarloResult",
      board,
      player,
      simulationsPerMove,
      algorithm,
    });
    return result;
  } catch {
    // Fallback to main thread
    if (algorithm === "mcts") {
      const r = runMCTS(board, player, simulationsPerMove);
      const results = Array.from(r.visits.entries()).map(([col, visits]) => {
        const winsF = r.wins.get(col) ?? 0;
        return {
          column: col,
          simulations: visits,
          wins: Math.round(winsF),
          losses: visits - Math.round(winsF),
          draws: 0,
          winRate: visits > 0 ? (winsF / visits) * 100 : 0,
        };
      });
      return {
        bestMove: r.bestMove,
        results,
        executionTime: r.executionTime,
        totalSimulations: r.totalSimulations,
        simulationsPerSecond: r.executionTime > 0 ? r.totalSimulations / (r.executionTime / 1000) : 0,
      };
    }
    return runMonteCarloJS(board, { simulationsPerMove, player: player as Player });
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
