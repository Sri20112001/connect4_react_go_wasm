import { getAvailableColumns } from "../engine/javascript/board";
import runMonteCarlo from "../engine/javascript/monteCarlo";
import type { MoveFunction } from "../engine/types";
import type { Board, Player } from "../types/types";


export const createMonteCarloAI = (
  simulationsPerMove: number,
): MoveFunction => {
  return (
    board: Board,
    player: Player,
  ): number => {
    if (player === null) {
      throw new Error(
        "Monte Carlo AI received null player",
      );
    }

    const result = runMonteCarlo(board, {
      simulationsPerMove,
      player,
    });

    /**
     * Safety fallback.
     *
     * If Monte Carlo somehow doesn't find a move,
     * choose any available column.
     */
    if (result.bestMove >= 0) {
      return result.bestMove;
    }

    const availableColumns =
      getAvailableColumns(board);

    if (availableColumns.length === 0) {
      return -1;
    }

    return availableColumns[0];
  };
};