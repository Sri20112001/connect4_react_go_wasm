import type {Board, Player} from "../types/types";

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