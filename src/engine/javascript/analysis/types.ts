/**
 * Full reasoning behind a single candidate move.
 *
 * This is the "explainable" result the engine produces:
 * every column knows why it was (or wasn't) chosen.
 */
export type MoveAnalysis = {
  column: number;
  legal: boolean;

  // Monte Carlo
  simulations: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;

  // Tactical
  isImmediateWin: boolean;
  blocksImmediateLoss: boolean;
  createsFork: boolean;
  allowsOpponentFork: boolean;

  // Heuristic
  evaluationScore: number;

  // Final decision
  finalScore: number;
};