/**
 * Game domain — no dependency on benchmark.
 * Phase 22: Game / Benchmark separation.
 */
import type { Board, Player } from "../types/types";

export type GameController = {
  board: Board;
  currentPlayer: Player;
  winner: Player;
  isDraw: boolean;
  redConnects: number;
  yellowConnects: number;
  columns: number;
  isAiThinking: boolean;
  playColumn(column: number): void;
  playBestMove(): void;
  reset(): void;
};

export type GameOptions = {
  aiPlayer?: Player;
};
