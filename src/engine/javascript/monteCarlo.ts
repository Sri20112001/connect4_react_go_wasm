import type { Board } from "../../types/types";
import type {
  MonteCarloOptions,
  MonteCarloResult,
  SimulationResult,
} from "../types";
import { cloneBoard, dropPiece, getAvailableColumns } from "./board";
import { simulateGame } from "./simulateGame";
import { findImmediateWinningMove } from "./tactical";
import { findForkingMove } from "./threats";
import { evaluateBoard } from "./evaluateBoard";

const runMonteCarlo = (
  board: Board,
  options: MonteCarloOptions,
): MonteCarloResult => {
  const start = performance.now();

  const { simulationsPerMove, player } = options;

  if (player === null) {
    throw new Error("Player cannot be null");
  }

  const winningMove = findImmediateWinningMove(board, player);

  if (winningMove !== null) {
    const end = performance.now();
    const executionTime = end - start;

    return {
      bestMove: winningMove,
      results: [],
      executionTime,
      totalSimulations: 0,
      simulationsPerSecond: 0,
    };
  }

  const opponent = player === "red" ? "yellow" : "red";

  const blockingMove = findImmediateWinningMove(board, opponent);

  if (blockingMove !== null) {
    const end = performance.now();
    const executionTime = end - start;

    return {
      bestMove: blockingMove,
      results: [],
      executionTime,
      totalSimulations: 0,
      simulationsPerSecond: 0,
    };
  }

  /**
   * Play a forking move immediately.
   *
   * A fork creates two winning threats in different
   * columns, so the opponent can block at most one and
   * we win on the next move. Skip the simulation budget.
   */
  const forkingMove = findForkingMove(board, player);

  if (forkingMove !== null) {
    const forkBoard = cloneBoard(board);

    dropPiece(forkBoard, forkingMove, player);

    // Only play the fork if it doesn't hand the opponent
    // an immediate winning move in the process.
    if (findImmediateWinningMove(forkBoard, opponent) === null) {
      const end = performance.now();
      const executionTime = end - start;

      return {
        bestMove: forkingMove,
        results: [],
        executionTime,
        totalSimulations: 0,
        simulationsPerSecond: 0,
      };
    }
  }

  const availableColumns = getAvailableColumns(board);

  const results: SimulationResult[] = [];

  for (const column of availableColumns) {
    let wins = 0;
    let losses = 0;
    let draws = 0;

    for (let simulation = 0; simulation < simulationsPerMove; simulation++) {
      const simulationBoard = cloneBoard(board);

      dropPiece(simulationBoard, column, player);

      const result = simulateGame(
        simulationBoard,
        player === "red" ? "yellow" : "red",
      );

      if (result.result === "win") {
        wins++;
      } else if (result.result === "loss") {
        losses++;
      } else {
        draws++;
      }
    }

    const winRate = (wins / simulationsPerMove) * 100;

    results.push({
      column,
      simulations: simulationsPerMove,
      wins,
      losses,
      draws,
      winRate,
    });
  }
  results.sort((a, b) => b.winRate - a.winRate);

  const end = performance.now();
  const executionTime = end - start;
  const totalSimulations = simulationsPerMove * availableColumns.length;
  const simulationsPerSecond = totalSimulations / (executionTime / 1000);

  /**
   * Pick the best move.
   *
   * When Monte Carlo is confident (high win rate), the
   * column with the best win rate wins outright.
   *
   * When several columns have similar win rates, or the
   * best win rate is low, use a tactical evaluation as a
   * tie-breaker so the engine doesn't confidently pick a
   * strategically bad move:
   *
   *   + board evaluation after the move
   *   − penalty if the move lets the opponent fork
   */
  const bestRate = results[0]?.winRate ?? 0;

  const tieThreshold = bestRate < 55 ? 5 : 1.5;

  const candidates = results.filter((result) => {
    return bestRate - result.winRate <= tieThreshold;
  });

  let bestMove = -1;
  let bestTacticalScore = -Infinity;

  for (const candidate of candidates) {
    const testBoard = cloneBoard(board);

    dropPiece(testBoard, candidate.column, player);

    let tacticalScore = evaluateBoard(testBoard, player);

    if (findForkingMove(testBoard, opponent) !== null) {
      tacticalScore -= 300;
    }

    if (tacticalScore > bestTacticalScore) {
      bestTacticalScore = tacticalScore;
      bestMove = candidate.column;
    }
  }

  if (bestMove === -1) {
    bestMove = results[0]?.column ?? -1;
  }
  // console.log("RUNNING UPDATED MONTE CARLO");

  // console.log({
  //   bestMove,
  //   results,
  //   executionTime,
  //   totalSimulations,
  //   simulationsPerSecond,
  // });
  return {
    bestMove,
    results,
    executionTime,
    totalSimulations,
    simulationsPerSecond,
  };
};

export default runMonteCarlo;
