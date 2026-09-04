import type { Board, Player } from "../../types/types";
import { COLUMNS, ROWS } from "../../utilities/CONSTANTS";

export function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]) as Board;
}

export function getAvailableColumns(board: Board): number[] {
  const columns: number[] = [];

  for (let column = 0; column < COLUMNS; column++) {
    if (board[0][column] === null) {
      columns.push(column);
    }
  }

  return columns;
}

export type DropPieceResult = {
  board: Board;
  row: number | null;
};

export function dropPiece(
  board: Board,
  column: number,
  player: Player,
): DropPieceResult {
  if (player === null) {
    return { board, row: null };
  }

  if (!Number.isInteger(column) || column < 0 || column >= COLUMNS) {
    return { board, row: null };
  }

  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row][column] === null) {
      const nextBoard = cloneBoard(board);
      nextBoard[row][column] = player;
      return { board: nextBoard, row };
    }
  }

  return { board, row: null };
}