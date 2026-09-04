import type { MonteCarloResult, SimulationResult } from "../types";
import type { MCTSResult } from "./mcts";

export const mctsResultToMonteCarloResult = (r: MCTSResult): MonteCarloResult => {
  const results: SimulationResult[] = Array.from(r.visits.entries()).map(([col, visits]) => {
    const winsF = r.wins.get(col) ?? 0;
    const draws = r.draws.get(col) ?? 0;
    const pureWins = winsF - draws * 0.5;
    const wins = Math.max(0, Math.round(pureWins));
    const losses = Math.max(0, visits - wins - draws);
    const winRate = visits > 0 ? (winsF / visits) * 100 : 0;
    return {
      column: col,
      simulations: visits,
      wins,
      losses,
      draws,
      winRate,
    };
  });

  // Sort by winRate desc for consistency with Monte Carlo ordering
  results.sort((a, b) => b.winRate - a.winRate);

  return {
    bestMove: r.bestMove,
    results,
    executionTime: r.executionTime,
    totalSimulations: r.totalSimulations,
    simulationsPerSecond: r.executionTime > 0 ? r.totalSimulations / (r.executionTime / 1000) : 0,
  };
};

export const mctsResultToMoveAnalysis = (
  _board: import("../../types/types").Board,
  _player: import("../../types/types").Player,
  r: MCTSResult,
): import("./analysis/types").MoveAnalysis | null => {
  if (r.bestMove === -1) return null;
  // Defer to analyzeMove for tactical metadata but with MCTS statistics
  // This is caller responsibility; see javascriptEngine for usage
  return null;
};
