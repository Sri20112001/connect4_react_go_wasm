import { useState } from "react";
import { COLUMNS, ROWS } from "../CONSTANTS";
import type { GameState } from "../../types/types";
import createEmptyBoard from "../createEmptyBoard";
import { checkWinner, isBoardFull } from "../checkWinner";

const createInitialState = (): GameState => ({
  board: createEmptyBoard(),
  currentPlayer: "red",
  winner: null,
  isDraw: false,
});

export function useConnect4() {
  const [game, setGame] = useState<GameState>(createInitialState);

const dropPiece = (column: number) => {
  console.log("Column from dropPiece:", column);

  setGame((current) => {
    console.log("Current game:", current);

    if (current.winner !== null || current.isDraw) {
      return current;
    }

    const nextBoard = current.board.map((row) => [...row]);

    for (let row = ROWS - 1; row >= 0; row--) {
      if (nextBoard[row][column] === null) {
        nextBoard[row][column] = current.currentPlayer;

        console.log("Next board:", nextBoard);

        if (checkWinner(nextBoard, row, column, current.currentPlayer)) {
          return { ...current, board: nextBoard, winner: current.currentPlayer };
        }

        if (isBoardFull(nextBoard)) {
          return { ...current, board: nextBoard, isDraw: true };
        }

        return {
          ...current,
          board: nextBoard,
          currentPlayer:
            current.currentPlayer === "red" ? "yellow" : "red",
        };
      }
    }

    return current;
  });
};

  const resetGame = () => {
    setGame(createInitialState());
  };

  return {
    board: game.board,
    currentPlayer: game.currentPlayer,
    winner: game.winner,
    isDraw: game.isDraw,
    dropPiece,
    resetGame,
    columns: COLUMNS,
  };
}