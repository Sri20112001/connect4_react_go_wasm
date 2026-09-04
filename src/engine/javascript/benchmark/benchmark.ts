import { playGame } from "./playGame";
import type { MoveFunction } from "../../types";
export { createRandomAI } from "../createRandomAI";

export type BenchmarkResult = {
  games: number;

  wins: number;
  losses: number;
  draws: number;

  winRate: number;
  lossRate: number;
  drawRate: number;

  averageMoves: number;

  executionTime: number;
  gamesPerSecond: number;
};

/**
 * Runs multiple games between two AI players.
 *
 * ai1 = AI under test
 * ai2 = opponent
 *
 * Colors are alternated between games so that
 * first-player advantage does not bias the benchmark.
 */
export const runBenchmark = (
  ai1: MoveFunction,
  ai2: MoveFunction,
  games: number,
  onProgress?: (
    completed: number,
    total: number,
  ) => void,
): BenchmarkResult => {
  let wins = 0;
  let losses = 0;
  let draws = 0;
  let totalMoves = 0;

  const start = performance.now();

  for (let game = 0; game < games; game++) {
    const gameNumber = game + 1;

    /**
     * Alternate colors every game.
     *
     * Even game:
     *   ai1 = red
     *   ai2 = yellow
     *
     * Odd game:
     *   ai2 = red
     *   ai1 = yellow
     */
    const ai1IsRed = game % 2 === 0;

    const redAI = ai1IsRed
      ? ai1
      : ai2;

    const yellowAI = ai1IsRed
      ? ai2
      : ai1;

    console.log(
      `\n🎮 Game ${gameNumber}/${games} started...`,
    );

    console.log(
      `   🔴 Red: ${
        ai1IsRed ? "AI Under Test" : "Opponent"
      }`,
    );

    console.log(
      `   🟡 Yellow: ${
        ai1IsRed ? "Opponent" : "AI Under Test"
      }`,
    );

    let gameResult: ReturnType<typeof playGame>;
    try {
      gameResult = playGame(redAI, yellowAI);
    } catch (err) {
      console.warn(`Game ${gameNumber} failed:`, err);
      // Count as loss for ai1 to keep benchmark resilient, continue
      losses++;
      onProgress?.(gameNumber, games);
      continue;
    }

    /**
     * Determine whether the AI under test won.
     */
    if (gameResult.result === "draw") {
      draws++;
    } else if (
      (ai1IsRed && gameResult.result === "red") ||
      (!ai1IsRed && gameResult.result === "yellow")
    ) {
      wins++;
    } else {
      losses++;
    }

    totalMoves += gameResult.moves;

    const completed = gameNumber;

    const winRate =
      (wins / completed) * 100;

    // const lossRate =
    //   (losses / completed) * 100;

    // const drawRate =
    //   (draws / completed) * 100;

    console.log(
      `   🏁 Result: ${gameResult.result}`,
    );

    console.log(
      `   ♟️ Moves: ${gameResult.moves}`,
    );

    console.log(
      `   📊 Running score → ` +
        `W:${wins} L:${losses} D:${draws}`,
    );

    console.log(
      `   📈 Win rate: ${winRate.toFixed(1)}%`,
    );

    /**
     * Notify the benchmark runner.
     */
    onProgress?.(
      completed,
      games,
    );
  }

  const executionTime =
    performance.now() - start;

  const gamesPerSecond =
    executionTime > 0
      ? games / (executionTime / 1000)
      : 0;

  return {
    games,

    wins,
    losses,
    draws,

    winRate:
      (wins / games) * 100,

    lossRate:
      (losses / games) * 100,

    drawRate:
      (draws / games) * 100,

    averageMoves:
      totalMoves / games,

    executionTime,

    gamesPerSecond,
  };
};