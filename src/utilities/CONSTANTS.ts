export const ROWS = 6;

export const COLUMNS = 7;

export const DIRECTIONS = [
  [0, 1], // horizontal
  [1, 0], // vertical
  [1, 1], // diagonal \
  [1, -1], // diagonal /
] as const;

export const MIN_SIMULATIONS = 1;
export const MAX_SIMULATIONS = 100_000;
export const DEFAULT_SIMULATIONS = 1;
export const DEFAULT_BENCHMARK_SIMULATIONS = 10_00;

export const clampSimulations = (n: number): number => {
  if (!Number.isFinite(n)) return DEFAULT_SIMULATIONS;
  return Math.max(MIN_SIMULATIONS, Math.min(MAX_SIMULATIONS, Math.floor(n)));
};