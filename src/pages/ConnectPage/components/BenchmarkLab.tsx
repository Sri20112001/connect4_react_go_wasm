import { useState } from "react";
import type { Algorithm, Board } from "../../../types/types";
import type { WasmStatus } from "../../../types/types";
import type { ReliableBenchmarkComparison } from "../../../engine/types";
import { PARITY_BOARDS } from "../../../engine/benchmark/parityBoards";
import { runReliableWorkloads, runParityVerification } from "../../../engine/benchmark/benchmarkRunner";

const PRESETS = [1000, 10000, 50000, 100000];

type Props = {
  board: Board;
  wasmStatus: WasmStatus;
};

export default function BenchmarkLab({ board, wasmStatus }: Props) {
  const [selected, setSelected] = useState<number[]>([1000, 10000]);
  const [boardSource, setBoardSource] = useState<"current" | string>("current");
  const [algorithm, setAlgorithm] = useState<Algorithm>("monte-carlo");
  const [warmupRuns, setWarmupRuns] = useState(2);
  const [measuredRuns, setMeasuredRuns] = useState(5);
  const [alternateOrder, setAlternateOrder] = useState(true);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [results, setResults] = useState<ReliableBenchmarkComparison[] | null>(null);
  const [parityRunning, setParityRunning] = useState(false);
  const [parityResults, setParityResults] = useState<
    { index: number; jsBest: number | null; wasmBest: number | null; parity: boolean }[] | null
  >(null);

  const togglePreset = (n: number) => {
    setSelected((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n].sort((a, b) => a - b)));
  };

  const effectiveBoard: Board =
    boardSource === "current"
      ? board
      : (PARITY_BOARDS.find((b) => b.id === boardSource)?.board ?? board);

  const effectivePlayer = boardSource === "current" ? "yellow" : "red";

  const handleRun = async () => {
    if (selected.length === 0) return;
    if (wasmStatus !== "ready") return;
    setRunning(true);
    setResults(null);
    setProgress({ done: 0, total: selected.length });
    try {
      const out = await runReliableWorkloads(
        effectiveBoard,
        effectivePlayer as "red" | "yellow",
        { workloads: selected, warmupRuns, measuredRuns, alternateOrder, algorithm },
        (done, total) => setProgress({ done, total }),
      );
      setResults(out);
    } catch (e) {
      console.error(e);
    } finally {
      setRunning(false);
      setProgress(null);
    }
  };

  const handleParity = async () => {
    if (wasmStatus !== "ready") return;
    setParityRunning(true);
    setParityResults(null);
    try {
      const boards = PARITY_BOARDS.map((b) => ({ board: b.board, player: b.player }));
      const sims = algorithm === "mcts" ? 200 : 0;
      const out = await runParityVerification(boards, sims, algorithm);
      setParityResults(out);
    } catch (e) {
      console.error(e);
    } finally {
      setParityRunning(false);
    }
  };

  const maxMedianTime = results
    ? Math.max(...results.flatMap((r) => [r.javascript?.stats.medianExecutionTime ?? 0, r.wasm?.stats.medianExecutionTime ?? 0]), 1)
    : 1;
  const maxMedianSps = results
    ? Math.max(...results.flatMap((r) => [r.javascript?.stats.medianSimulationsPerSecond ?? 0, r.wasm?.stats.medianSimulationsPerSecond ?? 0]), 1)
    : 1;

  const parityMatched = parityResults ? parityResults.filter((r) => r.parity).length : 0;
  const isBusy = running || parityRunning;

  return (
    <section className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Benchmark Lab</h2>
          <p className="mt-1 text-sm text-zinc-500">Same board · same player · same sims · JS vs Go/WASM side-by-side.</p>
        </div>
        {wasmStatus !== "ready" && (
          <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-400">WASM {wasmStatus}</span>
        )}
      </div>

      {(running || parityRunning) && progress && (
        <div className="mb-4 h-1 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full bg-yellow-400 transition-all duration-300"
            style={{ width: `${(progress.done / progress.total) * 100}%` }}
          />
        </div>
      )}

      {isBusy && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-2 text-xs text-zinc-300">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
          {running ? `Benchmarking ${progress ? `${progress.done}/${progress.total} workloads` : "…"}` : "Verifying parity…"}
        </div>
      )}

      {/* Controls */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm text-zinc-400">Board</label>
          <select
            value={boardSource}
            disabled={isBusy}
            onChange={(e) => setBoardSource(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500 disabled:opacity-50"
          >
            <option value="current">Current game board (yellow to move)</option>
            {PARITY_BOARDS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label} — expected col {b.expectedBest + 1}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm text-zinc-400">Algorithm</label>
          <select
            value={algorithm}
            disabled={isBusy}
            onChange={(e) => setAlgorithm(e.target.value as Algorithm)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500 disabled:opacity-50"
          >
            <option value="monte-carlo">Monte Carlo</option>
            <option value="mcts">MCTS (UCT)</option>
          </select>
        </div>

        <div>
          <div className="mb-2 block text-sm text-zinc-400">Workloads (sims/move)</div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((n) => (
              <label
                key={n}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  isBusy ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                } ${selected.includes(n) ? "border-yellow-500 bg-yellow-500/10 text-yellow-400" : "border-zinc-700 bg-zinc-950 text-zinc-400"}`}
              >
                <input type="checkbox" checked={selected.includes(n)} disabled={isBusy} onChange={() => togglePreset(n)} className="sr-only" />
                {n.toLocaleString()}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Phase 19: reliability options */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-zinc-500">Warmup runs (per engine, discarded)</span>
          <select
            value={warmupRuns}
            disabled={isBusy}
            onChange={(e) => setWarmupRuns(Number(e.target.value))}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500 disabled:opacity-50"
          >
            <option value={0}>0 — no warmup</option>
            <option value={1}>1</option>
            <option value={2}>2 (recommended)</option>
            <option value={3}>3</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-zinc-500">Measured runs (per engine)</span>
          <select
            value={measuredRuns}
            disabled={isBusy}
            onChange={(e) => setMeasuredRuns(Number(e.target.value))}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500 disabled:opacity-50"
          >
            <option value={3}>3</option>
            <option value={5}>5 (recommended)</option>
            <option value={7}>7</option>
          </select>
        </label>

        <label className="flex items-center gap-2 pt-6">
          <input type="checkbox" checked={alternateOrder} disabled={isBusy} onChange={(e) => setAlternateOrder(e.target.checked)} className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 disabled:opacity-50" />
          <span className="text-xs text-zinc-400">Alternate JS⇄WASM order</span>
        </label>
      </div>
      <p className="mt-2 text-xs text-zinc-500">Median of measured runs is the headline. Min/max &amp; σ show noise.</p>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleRun}
          disabled={running || wasmStatus !== "ready" || selected.length === 0 || isBusy}
          className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-50"
        >
          {running && <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-950" />}
          {running ? `Running ${progress ? `${progress.done}/${progress.total}` : "…"}` : "Run Comparison"}
        </button>

        <button
          type="button"
          onClick={handleParity}
          disabled={parityRunning || wasmStatus !== "ready" || isBusy}
          className="flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-white disabled:opacity-50"
        >
          {parityRunning && <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />}
          {parityRunning ? "Verifying…" : "Verify Parity (P1–P8)"}
        </button>

        {(results || parityResults) && (
          <button
            type="button"
            onClick={() => {
              setResults(null);
              setParityResults(null);
            }}
            className="rounded-lg border border-zinc-800 px-4 py-2 text-sm text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300"
          >
            Clear
          </button>
        )}
      </div>

      {wasmStatus !== "ready" && (
        <p className="mt-3 text-xs text-yellow-400">Benchmark requires WASM Ready. Current: {wasmStatus}.</p>
      )}

      {/* Parity */}
      {parityResults && (
        <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Decision Parity</h3>
            <span className={`text-xs font-medium ${parityMatched === 8 ? "text-green-400" : "text-red-400"}`}>
              {parityMatched}/8 boards matched
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PARITY_BOARDS.map((b, i) => {
              const r = parityResults[i];
              const ok = r?.parity;
              return (
                <div key={b.id} className={`rounded-lg border px-3 py-2 text-xs ${ok ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"}`}>
                  <div className="flex items-center gap-1.5">
                    <span className={ok ? "text-green-400" : "text-red-400"}>{ok ? "✓" : "✗"}</span>
                    <span className="font-medium text-white">{b.id}</span>
                    <span className="text-zinc-500">{b.label.replace(/^P\d+\s*/, "")}</span>
                  </div>
                  <div className="mt-1 text-zinc-400">
                    JS:{r ? (r.jsBest === null ? "–" : r.jsBest + 1) : "–"} · WASM:{r ? (r.wasmBest === null ? "–" : r.wasmBest + 1) : "–"}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-zinc-500">Deterministic (0 sims) — proves the comparison is between equivalent decision engines.</p>
        </div>
      )}

      {/* Results table — Phase 19 reliable */}
      {results && (
        <div className="mt-6">
          <div className="mb-2 flex items-center gap-2 text-xs">
            <span className="rounded-full bg-zinc-800 px-2 py-1 text-zinc-400">Algorithm: {results[0].algorithm === "mcts" ? "MCTS (UCT)" : "Monte Carlo"}</span>
            <span className="text-zinc-500">· {results[0].javascript?.runs.length ?? 0} measured runs · {warmupRuns} warmup</span>
          </div>
          <div className="overflow-x-auto rounded-lg border border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-950 text-zinc-500">
                <tr>
                  <th className="px-3 py-3">Sims/move</th>
                  <th className="px-3 py-3">JS median</th>
                  <th className="px-3 py-3">WASM median</th>
                  <th className="px-3 py-3">JS avg ±σ</th>
                  <th className="px-3 py-3">WASM avg ±σ</th>
                  <th className="px-3 py-3">Median speedup</th>
                  <th className="px-3 py-3">Best move</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.simulationsPerMove} className="border-b border-zinc-800 last:border-0">
                    <td className="px-3 py-3 font-medium text-white">{r.simulationsPerMove.toLocaleString()}</td>
                    <td className="px-3 py-3 text-zinc-400">
                      <div>{r.javascript ? `${r.javascript.stats.medianExecutionTime.toFixed(1)} ms` : "–"}</div>
                      <div className="text-xs text-zinc-500">
                        [{r.javascript?.stats.minExecutionTime.toFixed(0)}–{r.javascript?.stats.maxExecutionTime.toFixed(0)}]
                      </div>
                    </td>
                    <td className="px-3 py-3 text-zinc-400">
                      <div>{r.wasm ? `${r.wasm.stats.medianExecutionTime.toFixed(1)} ms` : "–"}</div>
                      <div className="text-xs text-zinc-500">
                        [{r.wasm?.stats.minExecutionTime.toFixed(0)}–{r.wasm?.stats.maxExecutionTime.toFixed(0)}]
                      </div>
                    </td>
                    <td className="px-3 py-3 text-zinc-400">
                      {r.javascript ? `${r.javascript.stats.averageExecutionTime.toFixed(1)} ±${r.javascript.stats.standardDeviation.toFixed(1)}` : "–"}
                    </td>
                    <td className="px-3 py-3 text-zinc-400">
                      {r.wasm ? `${r.wasm.stats.averageExecutionTime.toFixed(1)} ±${r.wasm.stats.standardDeviation.toFixed(1)}` : "–"}
                    </td>
                    <td className={`px-3 py-3 font-medium ${r.medianSpeedup && r.medianSpeedup > 1 ? "text-green-400" : "text-zinc-300"}`}>
                      <div>{r.medianSpeedup ? `${r.medianSpeedup.toFixed(2)}×` : "–"}</div>
                      <div className="text-xs font-normal text-zinc-500">avg {r.averageSpeedup ? `${r.averageSpeedup.toFixed(2)}×` : "–"}</div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-white">
                        JS:{r.javascript?.runs[0]?.bestMove === null ? "–" : (r.javascript!.runs[0]!.bestMove as number) + 1}
                      </span>
                      <span className="mx-1 text-zinc-600">·</span>
                      <span className={r.parity ? "text-green-400" : "text-red-400"}>
                        WASM:{r.wasm?.runs[0]?.bestMove === null ? "–" : (r.wasm!.runs[0]!.bestMove as number) + 1}
                        {r.parity === false ? " ✗" : ""}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Environment */}
          {results[0]?.environment && (
            <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-500">
              <span className="font-medium text-zinc-400">Env:</span> {results[0].environment.hardwareConcurrency ?? "?"} cores
              {results[0].environment.deviceMemory ? ` · ${results[0].environment.deviceMemory}GB` : ""} · {new Date(results[0].environment.timestamp).toLocaleString()} ·{" "}
              {results[0].environment.userAgent.slice(0, 80)}
            </div>
          )}

          {/* Bar charts — median */}
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
              <h4 className="text-xs font-medium text-zinc-500">Median execution time (ms) — lower is better</h4>
              <div className="mt-3 space-y-3">
                {results.map((r) => (
                  <div key={r.simulationsPerMove}>
                    <div className="mb-1 flex justify-between text-xs text-zinc-400">
                      <span>
                        {r.simulationsPerMove.toLocaleString()} sims · {r.javascript?.runs.length ?? 0} runs
                      </span>
                      <span>{r.medianSpeedup ? `${r.medianSpeedup.toFixed(2)}× median` : ""}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-10 text-xs text-zinc-500">JS</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
                          <div className="h-full rounded-full bg-white" style={{ width: `${((r.javascript?.stats.medianExecutionTime ?? 0) / maxMedianTime) * 100}%` }} />
                        </div>
                        <span className="w-16 text-right text-xs text-zinc-300">{r.javascript?.stats.medianExecutionTime.toFixed(0)} ms</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-10 text-xs text-zinc-500">WASM</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
                          <div className="h-full rounded-full bg-yellow-400" style={{ width: `${((r.wasm?.stats.medianExecutionTime ?? 0) / maxMedianTime) * 100}%` }} />
                        </div>
                        <span className="w-16 text-right text-xs text-zinc-300">{r.wasm?.stats.medianExecutionTime.toFixed(0)} ms</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
              <h4 className="text-xs font-medium text-zinc-500">Median throughput (sims/sec) — higher is better</h4>
              <div className="mt-3 space-y-3">
                {results.map((r) => (
                  <div key={r.simulationsPerMove}>
                    <div className="mb-1 text-xs text-zinc-400">{r.simulationsPerMove.toLocaleString()} sims</div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-10 text-xs text-zinc-500">JS</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
                          <div
                            className="h-full rounded-full bg-white"
                            style={{ width: `${((r.javascript?.stats.medianSimulationsPerSecond ?? 0) / maxMedianSps) * 100}%` }}
                          />
                        </div>
                        <span className="w-16 text-right text-xs text-zinc-300">{r.javascript?.stats.medianSimulationsPerSecond.toFixed(0)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-10 text-xs text-zinc-500">WASM</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
                          <div
                            className="h-full rounded-full bg-yellow-400"
                            style={{ width: `${((r.wasm?.stats.medianSimulationsPerSecond ?? 0) / maxMedianSps) * 100}%` }}
                          />
                        </div>
                        <span className="w-16 text-right text-xs text-zinc-300">{r.wasm?.stats.medianSimulationsPerSecond.toFixed(0)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
