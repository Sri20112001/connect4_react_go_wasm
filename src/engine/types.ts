import type { Board, Player } from "../types/types";

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
}

export interface MonteCarloOptions {
  simulationsPerMove: number;
  player: Player;
}

export type SimulationBoard = Board;

export type SimulationOutcome =
  | "win"
  | "loss"
  | "draw";