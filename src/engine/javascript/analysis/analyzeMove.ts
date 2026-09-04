import type { Board, Player } from "../../../types/types";
import { checkWinner } from "../../../utilities/checkWinner";
import { dropPiece, getAvailableColumns } from "../board";
import { simulateGame } from "../simulateGame";
import {
  countImmediateWinningMoves,
  findImmediateWinningMove,
} from "../tactical";
import { findForkingMove } from "../threats";
import { evaluateBoard } from "../evaluateBoard";
import type { MoveAnalysis } from "./types";

const opponentOf = (player: Player): Player => {
  return player === "red" ? "yellow" : "red";
};

/**
 * Analyzes a single candidate move for `player`.
 *
 * Answers, for one column:
 *   ✓ Is it legal?
 *   ✓ Does it win immediately?
 *   ✓ Does it block an immediate loss?
 *   ✓ Does it create a fork?
 *   ✓ Does it hand the opponent a fork?
 *   ✓ How good is the resulting position?
 *   ✓ What is the Monte Carlo win rate?
 *
 * The win/loss counting is from `player`'s perspective:
 * after `player` drops a piece it is the opponent's turn,
 * so a simulation where the opponent (aiPlayer) wins is a
 * LOSS for `player`, and vice versa.
 */
export const analyzeMove = (
  board: Board,
  column: number,
  player: Player,
  simulationsPerMove: number,
): MoveAnalysis => {
  const opponent = opponentOf(player);

  const availableColumns = getAvailableColumns(board);

  const legal = availableColumns.includes(column);

  const { board: testBoard, row } = dropPiece(board, column, player);

  const playable = legal && row !== null;

  const isImmediateWin =
    playable && checkWinner(testBoard, row, column, player);

  const blocksImmediateLoss =
    playable && findImmediateWinningMove(board, opponent) === column;

  const createsFork =
    playable &&
    findImmediateWinningMove(testBoard, opponent) === null &&
    countImmediateWinningMoves(testBoard, player) >= 2;

  const allowsOpponentFork =
    playable && findForkingMove(testBoard, opponent) !== null;

  const evaluationScore = playable ? evaluateBoard(testBoard, player) : 0;

  let simulations = 0;
  let wins = 0;
  let losses = 0;
  let draws = 0;

  const shouldSimulate =
    playable &&
    simulationsPerMove > 0 &&
    !isImmediateWin &&
    !blocksImmediateLoss &&
    !createsFork;

  if (shouldSimulate) {
    for (let i = 0; i < simulationsPerMove; i++) {
      const { board: simulationBoard } = dropPiece(board, column, player);

      const outcome = simulateGame(simulationBoard, opponent);

      if (outcome.result === "win") {
        // The opponent (aiPlayer) won.
        losses++;
      } else if (outcome.result === "loss") {
        // Our player won.
        wins++;
      } else {
        draws++;
      }
    }

    simulations = simulationsPerMove;
  }

  const winRate = simulations > 0 ? (wins / simulations) * 100 : 0;

  /**
   * Final decision score.
   *
   * Forcing moves are ranked in strict priority order so
   * the engine never skips a win or a block:
   *
   *   immediate win  >  forced block  >  fork  >  Monte Carlo
   *
   * Otherwise the score blends the Monte Carlo win rate
   * with a small amount of heuristic guidance:
   *
   *   winRate + evaluation/10 − (allowsOpponentFork ? 15 : 0)
   */
  const tier = isImmediateWin ? 3 : blocksImmediateLoss ? 2 : createsFork ? 1 : 0;

  const finalScore = playable
    ? tier * 1000 + winRate + evaluationScore / 10 + (allowsOpponentFork ? -15 : 0)
    : -Infinity;

  return {
    column,
    legal,
    simulations,
    wins,
    losses,
    draws,
    winRate,
    isImmediateWin,
    blocksImmediateLoss,
    createsFork,
    allowsOpponentFork,
    evaluationScore,
    finalScore,
  };
};