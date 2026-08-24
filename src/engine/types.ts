import type {Board, Player, Algorithm} from "../types/types";
import type { MoveAnalysis } from "./javascript/analysis/types";

export type { MoveAnalysis };

export interface SimulationResult {
    column: number;
    simulations: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
}

export interface MonteCarloResult {
    bestMove: number;
    results: SimulationResult[];
    executionTime: number;
    totalSimulations: number;
    simulationsPerSecond: number;
}

export interface MonteCarloOptions {
    simulationsPerMove: number;
    player: Player;
}

export type SimulationBoard = Board;

export type SimulationOutcome = {
    result: "win" | "loss" | "draw";
    finalBoard: Board;
};



/**
 * Any AI that can choose a Connect 4 move.
 *
 * Input:
 *   board  → current board
 *   player → player that needs to move
 *
 * Output:
 *   column index to play
 */
export type MoveFunction = (
  board: Board,
  player: Player,
) => number;

export type AIEngineOptions = {
    simulationsPerMove: number;
    algorithm?: Algorithm;
    explorationConstant?: number;
}

export interface AIEngine {
    chooseMove(
        board: Board,
        player: Player,
        options: AIEngineOptions,
    ): Promise<MoveAnalysis>;
}

export type BenchmarkResult = {
  engine: "javascript" | "wasm";
  algorithm: Algorithm;
  simulationsPerMove: number;
  totalSimulations: number;
  executionTime: number;
  simulationsPerSecond: number;
  bestMove: number | null;
};

export type BenchmarkComparison = {
  simulationsPerMove: number;
  javascript: BenchmarkResult | null;
  wasm: BenchmarkResult | null;
  speedup: number | null;
  parity: boolean | null;
};

export type BenchmarkOptions = {
  workloads: number[];
  warmupRuns: number;
  measuredRuns: number;
  alternateOrder: boolean;
  algorithm?: Algorithm;
};

export type BenchmarkStats = {
  averageExecutionTime: number;
  medianExecutionTime: number;
  minExecutionTime: number;
  maxExecutionTime: number;
  standardDeviation: number;
  averageSimulationsPerSecond: number;
  medianSimulationsPerSecond: number;
};

export type BenchmarkAggregate = {
  engine: "javascript" | "wasm";
  algorithm: Algorithm;
  simulationsPerMove: number;
  runs: BenchmarkResult[];
  stats: BenchmarkStats;
};

export type BenchmarkEnvironment = {
  userAgent: string;
  hardwareConcurrency: number | null;
  deviceMemory: number | null;
  timestamp: string;
  wasmStatus: string;
};

export type ReliableBenchmarkComparison = {
  simulationsPerMove: number;
  algorithm: Algorithm;
  javascript: BenchmarkAggregate | null;
  wasm: BenchmarkAggregate | null;
  medianSpeedup: number | null;
  averageSpeedup: number | null;
  parity: boolean | null;
  environment: BenchmarkEnvironment;
};