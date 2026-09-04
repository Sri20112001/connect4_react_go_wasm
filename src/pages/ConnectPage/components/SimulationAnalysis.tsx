import type { MonteCarloResult } from "../../../engine/types";

interface SimulationAnalysisProps {
  isLoading: boolean;
  result: MonteCarloResult | null;
  onPlayerBestMove: () => void;
}

export default function SimulationAnalysis({
  isLoading,
  result,
  onPlayerBestMove,
}: SimulationAnalysisProps) {
  return (
    <div className="glass-panel rounded-xl overflow-hidden flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="px-3.5 sm:px-4 py-2.5 border-b border-zinc-800/80 flex justify-between items-center bg-zinc-900/40 flex-shrink-0">
        <h3 className="font-headline font-semibold text-xs sm:text-sm flex items-center gap-1.5 text-zinc-100">
          <span className="material-symbols-outlined text-zinc-400 text-[17px]">analytics</span>
          Simulation Analysis <span className="text-[10px] text-zinc-500 font-normal hidden sm:inline">(Current State)</span>
        </h3>

        <div className="flex items-center gap-2">
          {result && (
            <>
              <span className="text-[10px] font-mono text-zinc-400">
                {result.executionTime.toFixed(1)}ms
              </span>
              <button
                type="button"
                onClick={onPlayerBestMove}
                disabled={result.bestMove < 0}
                className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-md font-headline text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-xs">play_arrow</span>
                Play Best
              </button>
            </>
          )}
        </div>
      </div>

      {/* Body Content */}
      {isLoading ? (
        <div className="p-4 flex flex-col items-center justify-center gap-2 text-zinc-400 my-auto min-h-[120px]">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-emerald-400" />
          <p className="text-xs font-mono">Running candidate rollouts...</p>
        </div>
      ) : !result ? (
        <div className="p-4 flex flex-col items-center justify-center gap-1 text-center my-auto min-h-[120px]">
          <span className="material-symbols-outlined text-zinc-600 text-2xl">science</span>
          <p className="text-xs font-medium text-zinc-400">Awaiting Simulation</p>
          <p className="text-[11px] text-zinc-500">
            Click &ldquo;Run Simulation&rdquo; or make a move to evaluate candidate columns.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-zinc-950/90 backdrop-blur z-10">
              <tr className="text-[10px] uppercase tracking-wider text-zinc-400 font-label border-b border-zinc-800">
                <th className="py-2 px-3 font-medium">Col</th>
                <th className="py-2 px-3 font-medium">Evaluation</th>
                <th className="py-2 px-3 font-medium w-1/3">Win Rate</th>
                <th className="py-2 px-3 font-medium text-right">Sims</th>
                <th className="py-2 px-3 font-medium text-right">Sims/s</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40 font-mono text-[11px]">
              {result.results.map((simulation) => {
                const isBest = simulation.column === result.bestMove;
                const winRate = simulation.winRate;

                return (
                  <tr
                    key={simulation.column}
                    className={`transition-colors ${
                      isBest
                        ? "bg-emerald-950/20 text-zinc-100 font-medium"
                        : "hover:bg-zinc-800/20 text-zinc-300"
                    }`}
                  >
                    <td className="py-2 px-3">
                      <span className={`font-bold ${isBest ? "text-emerald-400" : "text-zinc-300"}`}>
                        {simulation.column + 1}
                      </span>
                    </td>

                    <td className="py-2 px-3">
                      {isBest ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <span className="material-symbols-outlined text-[12px]">start</span>
                          Best Move
                        </span>
                      ) : winRate >= 55 ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          Advantage
                        </span>
                      ) : winRate <= 30 ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                          Risk
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-800/60 text-zinc-400 border border-zinc-700/60">
                          Neutral
                        </span>
                      )}
                    </td>

                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isBest
                                ? "bg-emerald-500"
                                : winRate >= 50
                                  ? "bg-blue-500"
                                  : "bg-red-500"
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, winRate))}%` }}
                          />
                        </div>
                        <span
                          className={`min-w-10 text-right text-[10px] tabular-nums ${
                            isBest ? "text-emerald-400 font-bold" : "text-zinc-400"
                          }`}
                        >
                          {winRate.toFixed(1)}%
                        </span>
                      </div>
                    </td>

                    <td className="py-2 px-3 text-right tabular-nums text-zinc-400">
                      {simulation.simulations.toLocaleString()}
                    </td>

                    <td className="py-2 px-3 text-right tabular-nums text-zinc-500">
                      {result.simulationsPerSecond >= 1000
                        ? `${(result.simulationsPerSecond / 1000).toFixed(0)}k`
                        : result.simulationsPerSecond.toFixed(0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
