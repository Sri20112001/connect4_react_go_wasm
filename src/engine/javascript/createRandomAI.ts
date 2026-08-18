import type { MoveFunction } from "../types";
import { getAvailableColumns } from "./board";


export const createRandomAI = (): MoveFunction => {
  return (board, _player) => {
    const availableColumns =
      getAvailableColumns(board);

    if (availableColumns.length === 0) {
      return -1;
    }

    const index = Math.floor(
      Math.random() * availableColumns.length,
    );

    return availableColumns[index];
  };
};