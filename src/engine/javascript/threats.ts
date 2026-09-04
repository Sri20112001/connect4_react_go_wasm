import type { Board, Player } from "../../types/types";
import { dropPiece, getAvailableColumns } from "./board";
import { countImmediateWinningMoves } from "./tactical";

/**
 * Finds a move that creates two or more independent
 * winning threats.
 *
 * A "winning threat" is a cell the player could play
 * next move to win immediately. If a move creates two
 * threats in different columns, the opponent can only
 * block one of them, so the player is guaranteed to win
 * on their following move.
 *
 * Returns the column that creates the fork, or null
 * if no forking move exists.
 */
export const findForkingMove = (
  board: Board,
  player: Player,
): number | null => {
  if (player === null) {
    return null;
  }

  const availableColumns = getAvailableColumns(board);

  for (const column of availableColumns) {
    const { board: testBoard, row } = dropPiece(board, column, player);

    if (row === null) {
      continue;
    }

    if (countImmediateWinningMoves(testBoard, player) >= 2) {
      return column;
    }
  }

  return null;
};