import type { Board } from "../../types/types";
import type {
  MonteCarloOptions,
  MonteCarloResult,
  SimulationResult,
} from "../types";
import { cloneBoard, dropPiece, getAvailableColumns } from "./board";
import { simulateGame } from "./simulateGame";

const runMonteCarlo = (
  board: Board,
  options: MonteCarloOptions,
): MonteCarloResult => {
  const { simulationsPerMove, player } = options;

  if (player === null) {
    throw new Error("Player cannot be null");
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

      if (result === "win") {
        wins++;
      } else if (result === "loss") {
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

    results.sort((a, b) => b.winRate - a.winRate);
  }
  return {
    bestMove: results[0]?.column ?? -1,
    results,
  };
};



export default runMonteCarlo;
