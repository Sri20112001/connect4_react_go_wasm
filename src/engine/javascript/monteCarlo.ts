import type { Board } from "../../types/types";
import type {
  MonteCarloOptions,
  MonteCarloResult,
} from "../types";
import { analyzePosition } from "./analysis/analyzePosition";

const runMonteCarlo = (
  board: Board,
  options: MonteCarloOptions,
): MonteCarloResult => {
  const start = performance.now();

  const { simulationsPerMove, player } = options;

  if (player === null) {
    throw new Error("Player cannot be null");
  }

  const analysis = analyzePosition(board, player, simulationsPerMove);

  const bestMove = analysis[0]?.column ?? -1;

  const selected = analysis[0];

  const forcing =
    selected !== undefined &&
    (selected.isImmediateWin ||
      selected.blocksImmediateLoss ||
      selected.createsFork);

  const end = performance.now();
  const executionTime = end - start;

  const totalSimulations = analysis.reduce((sum, result) => {
    return sum + result.simulations;
  }, 0);

  const simulationsPerSecond =
    totalSimulations > 0 && executionTime > 0
      ? totalSimulations / (executionTime / 1000)
      : 0;

  return {
    bestMove,
    results: forcing
      ? []
      : analysis.map((result) => ({
          column: result.column,
          simulations: result.simulations,
          wins: result.wins,
          losses: result.losses,
          draws: result.draws,
          winRate: result.winRate,
        })),
    executionTime,
    totalSimulations,
    simulationsPerSecond,
  };
};

export default runMonteCarlo;