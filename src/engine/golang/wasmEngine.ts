import type { Board, Player } from "../../types/types";
import type { AIEngine, AIEngineOptions, MoveAnalysis } from "../types";
import { loadWasm, wasmReadyCheck } from "./wasmLoader";

declare global {
  interface Window {
    connect4WasmReady: () => boolean;
    connect4RunMonteCarlo: (
      options: {
        board: Board;
        player: Player;
        simulationsPerMove: number;
      },
    ) => {
      bestMove: number;
      results: {
        column: number;
        simulations: number;
        wins: number;
        losses: number;
        draws: number;
        winRate: number;
      }[];
      totalSimulations: number;
      executionTime: number;
      simulationsPerSecond: number;
      analysis: MoveAnalysis | null;
    };
    connect4RunMCTS: (
      options: {
        board: Board;
        player: Player;
        simulationsPerMove: number;
      },
    ) => {
      bestMove: number;
      results: {
        column: number;
        simulations: number;
        wins: number;
        losses: number;
        draws: number;
        winRate: number;
      }[];
      totalSimulations: number;
      executionTime: number;
      simulationsPerSecond: number;
      analysis: MoveAnalysis | null;
    };
  }
}

export const wasmEngine: AIEngine = {
  async chooseMove(
    board: Board,
    player: Player,
    options: AIEngineOptions,
  ): Promise<MoveAnalysis> {
    if (player === null) throw new Error("No legal moves available");

    await loadWasm();

    if (!wasmReadyCheck()) throw new Error("WASM engine not ready");

    const algorithm = options.algorithm ?? "monte-carlo";

    const result =
      algorithm === "mcts"
        ? window.connect4RunMCTS!({
            board,
            player,
            simulationsPerMove: options.simulationsPerMove,
          })
        : window.connect4RunMonteCarlo!({
            board,
            player,
            simulationsPerMove: options.simulationsPerMove,
          });

    if (result.analysis === null || result.analysis === undefined) {
      throw new Error("No legal moves available");
    }

    return result.analysis;
  },
};
