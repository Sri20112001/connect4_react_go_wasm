import type { Board, Player } from "../../types/types";
import { checkWinner, countWinningLines } from "../../utilities/checkWinner";
import { dropPiece, getAvailableColumns } from "./board";

export const countImmediateWinningMoves = (
  board: Board,
  player: Player,
): number => {
  if (player === null) {
    return 0;
  }

  const availableColumns = getAvailableColumns(board);

  let winningMoves = 0;

  for (const column of availableColumns) {
    const { board: testBoard, row } = dropPiece(board, column, player);

    if (row === null) {
      continue;
    }

    const wins = countWinningLines(testBoard, row, column, player);

    if (wins > 0) {
      winningMoves++;
    }
  }
  return winningMoves;
};

export const findImmediateWinningMove = (
  board: Board,
  player: Player,
): number | null => {
  const availableColumns = getAvailableColumns(board);

  for (const column of availableColumns) {
    const { board: simulatedBoard, row } = dropPiece(board, column, player);

    if (row !== null && checkWinner(simulatedBoard, row, column, player)) {
      return column;
    }
  }

  return null;
};
