import type { Board, Player } from "../../../types/types";
import { getAvailableColumns } from "../board";
import { findImmediateWinningMove } from "../tactical";
import { findForkingMove } from "../threats";
import { analyzeMove } from "./analyzeMove";
import type { MoveAnalysis } from "./types";

const opponentOf = (player: Player): Player => {
  return player === "red" ? "yellow" : "red";
};

/**
 * Analyzes every legal move for `player`.
 *
 * Returns the moves sorted from best to worst by final
 * score, so the caller can simply take `analysis[0]`.
 *
 * When the position is forcing (an immediate win, a
 * forced block, or a fork is available) the simulation
 * budget is skipped entirely and the forcing move is
 * ranked first by its priority tier.
 */
export const analyzePosition = (
  board: Board,
  player: Player,
  simulationsPerMove: number,
): MoveAnalysis[] => {
  const opponent = opponentOf(player);

  const immediateWinColumn = findImmediateWinningMove(board, player);

  const opponentWinColumn = findImmediateWinningMove(board, opponent);

  const forkingColumn =
    opponentWinColumn === null ? findForkingMove(board, player) : null;

  const forcing =
    immediateWinColumn !== null ||
    opponentWinColumn !== null ||
    forkingColumn !== null;

  const simulations = forcing ? 0 : simulationsPerMove;

  const availableColumns = getAvailableColumns(board);

  const analysis = availableColumns.map((column) => {
    return analyzeMove(board, column, player, simulations);
  });

  analysis.sort((a, b) => b.finalScore - a.finalScore);

  return analysis;
};