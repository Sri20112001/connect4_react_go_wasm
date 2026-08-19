import { countWinningLines } from "../../utilities/checkWinner";
import type { Board, Player } from "../../types/types";
import { cloneBoard, dropPiece, getAvailableColumns } from "./board";
import type { SimulationOutcome } from "../types";
import {
  countImmediateWinningMoves,
  findImmediateWinningMove,
} from "./tactical";
import { findForkingMove } from "./threats";
import { evaluateBoard } from "./evaluateBoard";

const chooseWeightedRandomColumn = (availableColumns: number[]): number => {
  const weights = availableColumns.map((column) => {
    return 4 - Math.abs(3 - column);
  });

  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

  let random = Math.random() * totalWeight;

  for (let i = 0; i < availableColumns.length; i++) {
    random -= weights[i];

    if (random < 0) {
      return availableColumns[i];
    }
  }

  return availableColumns[availableColumns.length - 1];
};

const chooseHeuristicWeightedColumn = (
  board: Board,
  player: Player,
  availableColumns: number[],
): number | null => {
  if (player === null || availableColumns.length === 0) {
    return null;
  }

  const opponent = player === "red" ? "yellow" : "red";

  const candidates = availableColumns
    .map((column) => {
      const testBoard = cloneBoard(board);

      const row = dropPiece(testBoard, column, player);

      if (row === null) {
        return null;
      }

      // Never choose a move that immediately allows
      // the opponent to win.
      const opponentWinningMove = findImmediateWinningMove(testBoard, opponent);

      if (opponentWinningMove !== null) {
        return null;
      }

      const winningMoves = countImmediateWinningMoves(testBoard, player);

      let score = evaluateBoard(testBoard, player);

      if (winningMoves >= 2) {
        score += 500;
      }

      // Strongly prefer moves that do not hand the
      // opponent a fork on their next move.
      if (findForkingMove(testBoard, opponent) !== null) {
        score -= 150;
      }

      return {
        column,
        score,
      };
    })
    .filter(
      (candidate): candidate is { column: number; score: number } =>
        candidate !== null,
    );

  // Every move loses immediately.
  // Keep the original available moves as a fallback.
  if (candidates.length === 0) {
    return chooseWeightedRandomColumn(availableColumns);
  }

  const minScore = Math.min(...candidates.map((candidate) => candidate.score));

  const weightedCandidates = candidates.map((candidate) => ({
    column: candidate.column,
    weight: candidate.score - minScore + 1,
  }));

  const totalWeight = weightedCandidates.reduce(
    (sum, candidate) => sum + candidate.weight,
    0,
  );

  let random = Math.random() * totalWeight;

  for (const candidate of weightedCandidates) {
    random -= candidate.weight;

    if (random < 0) {
      return candidate.column;
    }
  }

  return weightedCandidates[weightedCandidates.length - 1].column;
};

const chooseRolloutMove = (board: Board, player: Player): number | null => {
  if (player === null) {
    return null;
  }

  // 1. Can I win immediately?
  const winningMove = findImmediateWinningMove(board, player);

  if (winningMove !== null) {
    return winningMove;
  }

  // 2. Can my opponent win immediately?
  const opponent = player === "red" ? "yellow" : "red";

  const blockingMove = findImmediateWinningMove(board, opponent);

  if (blockingMove !== null) {
    return blockingMove;
  }

  // 2.5. Can I create a fork?
  const forkingMove = findForkingMove(board, player);

  if (forkingMove !== null) {
    const forkBoard = cloneBoard(board);

    dropPiece(forkBoard, forkingMove, player);

    // Only play the fork if it doesn't hand the opponent
    // an immediate winning move in the process.
    if (findImmediateWinningMove(forkBoard, opponent) === null) {
      return forkingMove;
    }
  }

  // 3. Otherwise use center-biased randomness
  const availableColumns = getAvailableColumns(board);

  if (availableColumns.length === 0) {
    return null;
  }

  return chooseHeuristicWeightedColumn(board, player, availableColumns);
};

export const simulateGame = (
  initialBoard: Board,
  aiPlayer: Player,
): SimulationOutcome => {
  if (aiPlayer === null) {
    throw new Error("AI player cannot be null");
  }

  const board = cloneBoard(initialBoard);

  let currentPlayer: Player = aiPlayer;

  while (true) {
    // const availableColumns = getAvailableColumns(board);

    const column = chooseRolloutMove(board, currentPlayer);

    if (column === null) {
      return {
        result: "draw",
        finalBoard: board,
      };
    }

    const row = dropPiece(board, column, currentPlayer);

    if (row === null) {
      continue;
    }

    const lines = countWinningLines(board, row, column, currentPlayer);

    if (lines > 0) {
      return {
        result: currentPlayer === aiPlayer ? "win" : "loss",
        finalBoard: board,
      };
    }

    currentPlayer = currentPlayer === "red" ? "yellow" : "red";
  }
};
