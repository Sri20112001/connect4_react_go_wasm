import type { MonteCarloResult } from "../../../engine/types";

interface SimulationAnalysisProps {
  isLoading: boolean;
  result: MonteCarloResult | null;
  onPlayerBestMove: () => void;
}

export default function SimulationAnalysis({
  isLoading,
  result,
  onPlayerBestMove
}: SimulationAnalysisProps) {
  if (!result) {
    return (
      <section className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-lg font-semibold text-white">
          Simulation Analysis
        </h2>

        <p className="mt-2 text-sm text-zinc-500">
          Run a Monte Carlo simulation to see the results.
        </p>
      </section>
    );
  }

  if (isLoading) {
    console.log("isLoading",isLoading)
    return (
      <section className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-lg font-semibold text-white">
          Simulation Analysis
        </h2>

        <p className="mt-2 text-sm text-zinc-500">Running simulation...</p>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Simulation Analysis
          </h2>

          <div className="mt-3 flex items-center gap-3">
  <p className="text-sm text-zinc-500">
    Best move: Column {result.bestMove + 1}
  </p>

  <button
    type="button"
    onClick={onPlayerBestMove}
    className="rounded-lg bg-yellow-500 px-3 py-2 text-sm font-medium text-zinc-950 transition hover:bg-yellow-400"
  >
    Play Best Move
  </button>
</div>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          <p className="text-xs text-zinc-500">Total Simulations</p>

          <p className="mt-1 text-xl font-semibold text-white">
            {result.totalSimulations.toLocaleString()}
          </p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          <p className="text-xs text-zinc-500">Execution Time</p>

          <p className="mt-1 text-xl font-semibold text-white">
            {result.executionTime.toFixed(2)} ms
          </p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          <p className="text-xs text-zinc-500">Simulations / sec</p>

          <p className="mt-1 text-xl font-semibold text-white">
            {result.simulationsPerSecond.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-800 text-zinc-500">
            <tr>
              <th className="px-3 py-3">Move</th>
              <th className="px-3 py-3">Simulations</th>
              <th className="px-3 py-3">Wins</th>
              <th className="px-3 py-3">Losses</th>
              <th className="px-3 py-3">Draws</th>
              <th className="px-3 py-3">Win Rate</th>
            </tr>
          </thead>

          <tbody>
            {result.results.map((simulation) => {
              const isBestMove = simulation.column === result.bestMove;

              return (
                <tr
                  key={simulation.column}
                  className={`border-b border-zinc-800 last:border-0 ${
                    isBestMove ? "bg-zinc-800/50" : ""
                  }`}
                >
                  <td className="px-3 py-3 font-medium text-white">
                    <div className="flex items-center gap-2">
                      <span>Column {simulation.column + 1}</span>

                      {isBestMove && (
                        <span className="text-xs text-yellow-400">Best</span>
                      )}
                    </div>
                  </td>

                  <td className="px-3 py-3 text-zinc-400">
                    {simulation.simulations.toLocaleString()}
                  </td>

                  <td className="px-3 py-3 text-zinc-400">
                    {simulation.wins.toLocaleString()}
                  </td>

                  <td className="px-3 py-3 text-zinc-400">
                    {simulation.losses.toLocaleString()}
                  </td>

                  <td className="px-3 py-3 text-zinc-400">
                    {simulation.draws.toLocaleString()}
                  </td>

                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-full max-w-32 overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{
                            width: `${simulation.winRate}%`,
                          }}
                        />
                      </div>

                      <span className="min-w-16 font-semibold text-white">
                        {simulation.winRate.toFixed(2)}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
