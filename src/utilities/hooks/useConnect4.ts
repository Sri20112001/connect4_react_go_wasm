import { useCallback, useState } from "react";
import { COLUMNS, ROWS } from "../CONSTANTS";
import type { GameState } from "../../types/types";
import createEmptyBoard from "../createEmptyBoard";
import { countWinningLines, isBoardFull } from "../checkWinner";

const createInitialState = (): GameState => ({
  board: createEmptyBoard(),
  currentPlayer: "red",
  winner: null,
  isDraw: false,
  redConnects: 0,
  yellowConnects: 0,
  lastMove: null,
});

export function useConnect4() {
  const [game, setGame] = useState<GameState>(createInitialState);

  const dropPiece = useCallback((column: number) => {
    if (!Number.isInteger(column) || column < 0 || column >= COLUMNS) return;

    setGame((current) => {
      if (current.winner !== null || current.isDraw) {
        return current;
      }

      const nextBoard = current.board.map((row) => [...row]);

      for (let row = ROWS - 1; row >= 0; row--) {
        if (nextBoard[row][column] === null) {
          nextBoard[row][column] = current.currentPlayer;

          const lines = countWinningLines(
            nextBoard,
            row,
            column,
            current.currentPlayer,
          );

          const redConnects =
            current.redConnects +
            (current.currentPlayer === "red" ? lines : 0);
          const yellowConnects =
            current.yellowConnects +
            (current.currentPlayer === "yellow" ? lines : 0);

          const lastMove = { row, column, player: current.currentPlayer } as const;

          if (lines > 0) {
            return {
              ...current,
              board: nextBoard,
              redConnects,
              yellowConnects,
              winner: current.currentPlayer,
              lastMove,
            };
          }

          if (isBoardFull(nextBoard)) {
            if (redConnects > yellowConnects) {
              return {
                ...current,
                board: nextBoard,
                redConnects,
                yellowConnects,
                winner: "red",
                lastMove,
              };
            }

            if (yellowConnects > redConnects) {
              return {
                ...current,
                board: nextBoard,
                redConnects,
                yellowConnects,
                winner: "yellow",
                lastMove,
              };
            }

            return {
              ...current,
              board: nextBoard,
              redConnects,
              yellowConnects,
              isDraw: true,
              lastMove,
            };
          }

          return {
            ...current,
            board: nextBoard,
            redConnects,
            yellowConnects,
            currentPlayer: current.currentPlayer === "red" ? "yellow" : "red",
            lastMove,
          };
        }
      }

      return current;
    });
  }, []);

const resetGame = useCallback(() => {
  setGame(createInitialState());
}, []);
  return {
    board: game.board,
    currentPlayer: game.currentPlayer,
    winner: game.winner,
    isDraw: game.isDraw,
    redConnects: game.redConnects,
    yellowConnects: game.yellowConnects,
    lastMove: game.lastMove,
    dropPiece,
    resetGame,
    columns: COLUMNS,
  };
}
