import type { Board, Player } from "../types/types";
import { COLUMNS, DIRECTIONS, ROWS } from "./CONSTANTS";

export const isBoardFull = (board: Board): boolean => {
  return board[0].every((cell) => cell !== null);
}

export const checkWinner = (
  board: Board,
  row: number,
  column: number,
  player: Player,
): boolean => {
  if (player === null) {
    return false;
  }

  for (const [rowDirection, columnDirection] of DIRECTIONS) {
    const count =
      1 +
      countPieces(board, row, column, rowDirection, columnDirection, player) +
      countPieces(board, row, column, -rowDirection, -columnDirection, player);

    if (count >= 4) {
      return true;
    }
  }

  return false;
};

export const countPieces = (
  board: Board,
  row: number,
  column: number,
  rowDirection: number,
  columnDirection: number,
  player: Player,
): number => {
  let count = 0;

  let currentRow = row + rowDirection;
  let currentColumn = column + columnDirection;

  while (
    currentRow >= 0 &&
    currentRow < ROWS &&
    currentColumn >= 0 &&
    currentColumn < COLUMNS &&
    board[currentRow][currentColumn] === player
  ) {
    count++;

    currentRow += rowDirection;
    currentColumn += columnDirection;
  }

  return count;
}


