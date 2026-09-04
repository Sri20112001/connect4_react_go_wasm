import { dropPiece, getAvailableColumns } from "../board";
import type { Player } from "../../../types/types";
import { checkWinner } from "../../../utilities/checkWinner";
import type { MoveFunction } from "../../types";


export type GameResult = {
  result: "red" | "yellow" | "draw";
  moves: number;
};

import createEmptyBoard from "../../../utilities/createEmptyBoard";

/**
 * Plays one complete game between two AI players.
 *
 * redAI    → controls red
 * yellowAI → controls yellow
 */
export const playGame = (
  redAI: MoveFunction,
  yellowAI: MoveFunction,
): GameResult => {
  let board = createEmptyBoard();

  let currentPlayer: Player = "red";
  let moves = 0;

  while (true) {
    const availableColumns =
      getAvailableColumns(board);

    /**
     * No columns left means the board is full.
     */
    if (availableColumns.length === 0) {
      return {
        result: "draw",
        moves,
      };
    }

    /**
     * Select the AI belonging to the current player.
     */
    const moveFunction =
      currentPlayer === "red"
        ? redAI
        : yellowAI;

    /**
     * Ask the AI which column to play.
     */
    const column = moveFunction(
      board,
      currentPlayer,
    );

    if (!availableColumns.includes(column)) {
      throw new Error(
        `AI selected invalid column ${column}. ` +
          `Available columns: ${availableColumns.join(", ")}`,
      );
    }

    const { board: nextBoard, row } = dropPiece(board, column, currentPlayer);

    if (row === null) {
      throw new Error(`Failed to drop piece into column ${column}`);
    }

    board = nextBoard;
    moves++;

    if (checkWinner(board, row, column, currentPlayer)) {
      return {
        result: currentPlayer,
        moves,
      };
    }

    /**
     * Switch players.
     */
    currentPlayer =
      currentPlayer === "red"
        ? "yellow"
        : "red";
  }
};