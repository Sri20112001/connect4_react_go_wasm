import runMonteCarloJS from "../javascript/monteCarlo";
import { runMCTS } from "../javascript/mcts";
import { analyzePosition } from "../javascript/analysis/analyzePosition";
import { analyzeMove } from "../javascript/analysis/analyzeMove";
import type { Board, Player, Algorithm } from "../../types/types";

type BenchmarkRequest = {
  id: number;
  type: "benchmark";
  board: Board;
  player: Player;
  simulationsPerMove: number;
  algorithm: Algorithm;
};

type ChooseMoveRequest = {
  id: number;
  type: "chooseMove";
  board: Board;
  player: Player;
  simulationsPerMove: number;
  algorithm: Algorithm;
  explorationConstant?: number;
};

type MonteCarloResultRequest = {
  id: number;
  type: "monteCarloResult";
  board: Board;
  player: Player;
  simulationsPerMove: number;
  algorithm: Algorithm;
};

type WorkerRequest = BenchmarkRequest | ChooseMoveRequest | MonteCarloResultRequest;

type WorkerResponse = {
  id: number;
  result?: unknown;
  error?: string;
};

const toBenchmarkResult = (engine: "javascript", algorithm: Algorithm, simulationsPerMove: number, bestMove: number | null, totalSimulations: number, executionTime: number, simulationsPerSecond: number) => ({
  engine,
  algorithm,
  simulationsPerMove,
  totalSimulations,
  executionTime,
  simulationsPerSecond,
  bestMove,
});

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { id, type, board, player, simulationsPerMove, algorithm } = e.data;

  try {
    if (type === "benchmark") {
      let result: ReturnType<typeof toBenchmarkResult>;
      if (player === null) {
        result = toBenchmarkResult("javascript", algorithm, simulationsPerMove, null, 0, 0, 0);
      } else if (algorithm === "mcts") {
        const r = runMCTS(board, player, simulationsPerMove);
        const sps = r.executionTime > 0 ? r.totalSimulations / (r.executionTime / 1000) : 0;
        result = toBenchmarkResult("javascript", algorithm, simulationsPerMove, r.bestMove === -1 ? null : r.bestMove, r.totalSimulations, r.executionTime, sps);
      } else {
        const r = runMonteCarloJS(board, { simulationsPerMove, player });
        result = toBenchmarkResult("javascript", algorithm, simulationsPerMove, r.bestMove === -1 ? null : r.bestMove, r.totalSimulations, r.executionTime, r.simulationsPerSecond);
      }
      const response: WorkerResponse = { id, result };
      (self as unknown as { postMessage: (m: unknown) => void }).postMessage(response);
      return;
    }

    if (type === "chooseMove") {
      if (player === null) throw new Error("No legal moves available");

      if (algorithm === "mcts") {
        const mcts = runMCTS(board, player, simulationsPerMove, (e.data as ChooseMoveRequest).explorationConstant);
        if (mcts.bestMove === -1) throw new Error("No legal moves available");
        const base = analyzeMove(board, mcts.bestMove, player, 0);
        const visits = mcts.visits.get(mcts.bestMove) ?? 0;
        const winsF = mcts.wins.get(mcts.bestMove) ?? 0;
        const winRate = visits > 0 ? (winsF / visits) * 100 : 0;
        const tier = base.isImmediateWin ? 3 : base.blocksImmediateLoss ? 2 : base.createsFork ? 1 : 0;
        let finalScore = tier * 1000 + winRate + base.evaluationScore / 10;
        if (base.allowsOpponentFork) finalScore -= 15;
        if (!base.legal) finalScore = Number.NEGATIVE_INFINITY;
        const analysis = {
          ...base,
          simulations: visits,
          wins: Math.round(winsF),
          losses: visits - Math.round(winsF),
          draws: 0,
          winRate,
          finalScore,
        };
        const response: WorkerResponse = { id, result: analysis };
        (self as unknown as { postMessage: (m: unknown) => void }).postMessage(response);
        return;
      }

      const analysis = analyzePosition(board, player, simulationsPerMove);
      if (analysis.length === 0) throw new Error("No legal moves available");
      const response: WorkerResponse = { id, result: analysis[0] };
      (self as unknown as { postMessage: (m: unknown) => void }).postMessage(response);
      return;
    }

    if (type === "monteCarloResult") {
      if (player === null) throw new Error("Player cannot be null");
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
        const monteResult = {
          bestMove: r.bestMove,
          results,
          executionTime: r.executionTime,
          totalSimulations: r.totalSimulations,
          simulationsPerSecond: r.executionTime > 0 ? r.totalSimulations / (r.executionTime / 1000) : 0,
        };
        const response: WorkerResponse = { id, result: monteResult };
        (self as unknown as { postMessage: (m: unknown) => void }).postMessage(response);
        return;
      }
      const result = runMonteCarloJS(board, { simulationsPerMove, player });
      const response: WorkerResponse = { id, result };
      (self as unknown as { postMessage: (m: unknown) => void }).postMessage(response);
      return;
    }

    throw new Error(`Unknown request type: ${(e.data as { type: string }).type}`);
  } catch (err) {
    const response: WorkerResponse = { id, error: (err as Error).message ?? String(err) };
    (self as unknown as { postMessage: (m: unknown) => void }).postMessage(response);
  }
};

// Ensure this is treated as a module
export {};
