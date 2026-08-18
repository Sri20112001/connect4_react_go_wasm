import type { Board } from "../../types/types";
import type {
  MonteCarloOptions,
  MonteCarloResult,
  SimulationResult,
} from "../types";
import { cloneBoard, dropPiece, getAvailableColumns } from "./board";
import { simulateGame } from "./simulateGame";
import { findImmediateWinningMove } from "./tactical";

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
  // const heuristicScore = evaluateBoard(result.finalBoard, player);
  const end = performance.now();
  const executionTime = end - start;
  const totalSimulations = simulationsPerMove * availableColumns.length;
  const simulationsPerSecond = totalSimulations / (executionTime / 1000);

  const bestMove = results[0]?.column ?? -1;
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
