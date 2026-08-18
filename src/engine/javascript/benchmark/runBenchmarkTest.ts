import {
  createRandomAI,
  runBenchmark,
} from "./benchmark";

import {
  createMonteCarloAI,
} from "./players";

const randomAI = createRandomAI();

const simulationCounts = [
  100,
  500,
  1000,
  5000,
];

for (const simulations of simulationCounts) {
  console.log("\n");
  console.log("==========================================");
  console.log(
    `🧠 MONTE CARLO: ${simulations} simulations/move`,
  );
  console.log("==========================================");

  console.log(
    `⏳ Creating Monte Carlo AI...`,
  );

  const monteCarloAI =
    createMonteCarloAI(simulations);

  console.log(
    `✅ Monte Carlo AI created`,
  );

  console.log(
    `🚀 Starting benchmark: 100 games`,
  );

  const benchmarkStart = performance.now();

  const result = runBenchmark(
    monteCarloAI,
    randomAI,
    100,
    (completed, total) => {
      const percentage =
        (completed / total) * 100;

      console.log(
        `📊 Progress: ${completed}/${total} ` +
        `(${percentage.toFixed(0)}%)`,
      );
    },
  );

  const benchmarkTime =
    performance.now() - benchmarkStart;

  console.log("\n");
  console.log(
    `🏁 Monte Carlo ${simulations} benchmark completed!`,
  );

  console.log(
    `⏱️ Total time: ${(
      benchmarkTime / 1000
    ).toFixed(2)} seconds`,
  );

  console.table({
    games: result.games,
    wins: result.wins,
    losses: result.losses,
    draws: result.draws,

    winRate:
      `${result.winRate.toFixed(2)}%`,

    lossRate:
      `${result.lossRate.toFixed(2)}%`,

    drawRate:
      `${result.drawRate.toFixed(2)}%`,

    averageMoves:
      result.averageMoves.toFixed(2),

    executionTime:
      `${result.executionTime.toFixed(0)} ms`,

    gamesPerSecond:
      result.gamesPerSecond.toFixed(2),
  });

  console.log(
    `✅ Finished ${simulations} simulations/move`,
  );
}