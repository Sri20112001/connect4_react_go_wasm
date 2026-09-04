import { useState } from "react";
import type { Algorithm, Board } from "../../types/types";
import type { WasmStatus } from "../../types/types";
import type { ReliableBenchmarkComparison } from "../../engine/types";
import { PARITY_BOARDS } from "../../engine/benchmark/parityBoards";
import {
  runReliableWorkloads,
  runParityVerification,
  SCALING_WORKLOADS,
  toScalingCsv,
} from "../../engine/benchmark/benchmarkRunner";
import { measureBoundary } from "../../engine/benchmark/boundaryOverhead";
import { profileDropPieceAllocation } from "../../engine/benchmark/allocationProfiler";

const PRESETS = [1000, 10000, 50000, 100000];

type Props = {
  board: Board;
  currentPlayer: "red" | "yellow";
  wasmStatus: WasmStatus;
};

export default function BenchmarkLab({ board, currentPlayer, wasmStatus }: Props) {
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
  const [boundary, setBoundary] = useState<null | Awaited<ReturnType<typeof measureBoundary>>>(null);
  const [allocation, setAllocation] = useState<null | ReturnType<typeof profileDropPieceAllocation>>(null);
  const [boundaryRunning, setBoundaryRunning] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const togglePreset = (n: number) => {
    setSelected((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n].sort((a, b) => a - b)));
  };

  const effectiveBoard: Board =
    boardSource === "current"
      ? board
      : (PARITY_BOARDS.find((b) => b.id === boardSource)?.board ?? board);

  const effectivePlayer: "red" | "yellow" =
    boardSource === "current" ? currentPlayer : ((PARITY_BOARDS.find((b) => b.id === boardSource)?.player ?? "red") as "red" | "yellow");

  const handleRun = async () => {
    if (selected.length === 0) return;
    if (wasmStatus !== "ready") return;
    setRunning(true);
    setResults(null);
    setProgress({ done: 0, total: selected.length });
    try {
      const out = await runReliableWorkloads(
        effectiveBoard,
        effectivePlayer,
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
  const parityTotal = PARITY_BOARDS.length;
  const isBusy = running || parityRunning;

  // headline speedup — most representative (largest workload)
  const headline = results ? [...results].sort((a, b) => (b.medianSpeedup ?? 0) - (a.medianSpeedup ?? 0))[0] : null;

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-white">Benchmark Lab</h2>
            <p className="mt-1 max-w-2xl text-sm text-zinc-400">
              Compare <span className="text-zinc-200">JavaScript</span> and <span className="text-yellow-400">Go/WASM</span> under identical workloads.
              Same board · same player · same sims.
            </p>
          </div>
          {wasmStatus !== "ready" ? (
            <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-400">WASM {wasmStatus}</span>
          ) : (
            <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">WASM Ready</span>
          )}
        </div>
        {(running || parityRunning) && progress && (
          <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full bg-yellow-400 transition-all duration-300" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
          </div>
        )}
        {isBusy && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-2 text-xs text-zinc-300">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
            {running ? `Benchmarking ${progress ? `${progress.done}/${progress.total} workloads` : "…"}` : "Verifying parity…"}
          </div>
        )}
      </div>

      {/* 01 Configure */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">01 — Configure</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-2 block text-xs font-medium text-zinc-400">Board</label>
            <select
              value={boardSource}
              disabled={isBusy}
              onChange={(e) => setBoardSource(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500 disabled:opacity-50"
            >
              <option value="current">Current (empty) • red to move</option>
              {PARITY_BOARDS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label} — expected col {b.expectedBest + 1}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-zinc-400">Algorithm</label>
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
            <div className="mb-2 block text-xs font-medium text-zinc-400">Workloads — sims / move</div>
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
            <button
              type="button"
              onClick={() => setSelected([...SCALING_WORKLOADS])}
              disabled={isBusy}
              className="mt-2 text-xs text-zinc-500 underline-offset-4 hover:text-zinc-300 hover:underline disabled:opacity-50"
            >
              Use Scaling 1K–100K (6 workloads)
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500">Warmup (discarded)</span>
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
            <span className="text-xs text-zinc-500">Measured runs</span>
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
            <span className="text-xs text-zinc-400">Alternate JS ⇄ WASM order</span>
          </label>
        </div>
        <p className="mt-2 text-xs text-zinc-500">Median of measured runs is the headline. Min/max & σ show noise.</p>
      </section>

      {/* 02 Run */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">02 — Run</h3>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleRun}
            disabled={running || wasmStatus !== "ready" || selected.length === 0 || isBusy}
            className="flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-50"
          >
            {running && <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-950" />}
            {running ? `Running ${progress ? `${progress.done}/${progress.total}` : "…"}` : "Run Comparison"}
          </button>
          <button
            type="button"
            onClick={handleParity}
            disabled={parityRunning || wasmStatus !== "ready" || isBusy}
            className="flex items-center gap-2 rounded-full border border-zinc-700 px-5 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-white disabled:opacity-50"
          >
            {parityRunning && <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />}
            {parityRunning ? "Verifying…" : "Verify Parity (P1–P8)"}
          </button>
          {results && (
            <button
              type="button"
              onClick={() => {
                const csv = toScalingCsv(results);
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `scaling-${Date.now()}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              Export CSV
            </button>
          )}
          {(results || parityResults) && (
            <button
              type="button"
              onClick={() => {
                setResults(null);
                setParityResults(null);
              }}
              className="rounded-full border border-zinc-800 px-4 py-2 text-sm text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
            >
              Clear
            </button>
          )}
        </div>
        {wasmStatus !== "ready" && <p className="mt-3 text-xs text-yellow-400">Benchmark requires WASM Ready. Current: {wasmStatus}.</p>}
      </section>

      {/* 03 Verify */}
      {parityResults && (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">03 — Verify</h3>
          <div className="mt-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-white">Decision Parity</h4>
            <span className={`rounded-full px-2 py-1 text-xs font-medium ${parityMatched === parityTotal ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
              {parityMatched}/{parityTotal} matched
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
          <p className="mt-2 text-xs text-zinc-500">
            {algorithm === "mcts"
              ? "Stochastic parity (200 sims) — measures MCTS agreement."
              : "Tactical parity (0 sims) — deterministic heuristics only."}
          </p>
        </section>
      )}

      {/* 04 Results */}
      {results && (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">04 — Results</h3>

          {/* Headline */}
          {headline && headline.medianSpeedup && (
            <div className="mt-4 rounded-xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 via-zinc-900 to-zinc-900 p-6 text-center">
              <p className="text-xs font-medium uppercase tracking-widest text-yellow-400">WASM headline</p>
              <p className="mt-1 text-4xl font-bold tracking-tight text-white">{headline.medianSpeedup.toFixed(2)}×</p>
              <p className="mt-1 text-sm text-zinc-400">
                faster than JavaScript <span className="text-zinc-600">•</span> {headline.simulationsPerMove.toLocaleString()} sims/move • {headline.algorithm === "mcts" ? "MCTS" : "Monte Carlo"}
              </p>
              <div className="mt-3 flex justify-center gap-4 text-xs">
                <span className="text-zinc-300">
                  JS {headline.javascript ? `${headline.javascript.stats.medianExecutionTime.toFixed(1)} ms` : "–"}
                </span>
                <span className="text-zinc-600">•</span>
                <span className="text-yellow-400">
                  WASM {headline.wasm ? `${headline.wasm.stats.medianExecutionTime.toFixed(1)} ms` : "–"}
                </span>
                <span className="text-zinc-600">•</span>
                <span className={headline.parity ? "text-green-400" : "text-red-400"}>Parity {headline.parity ? "✓" : "✗"}</span>
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="rounded-full bg-zinc-800 px-2 py-1 text-zinc-400">Algorithm: {results[0].algorithm === "mcts" ? "MCTS (UCT)" : "Monte Carlo"}</span>
            <span className="text-zinc-500">
              · {results[0].javascript?.runs.length ?? 0} measured · {warmupRuns} warmup
            </span>
            {results[0]?.environment && (
              <span className="hidden text-zinc-600 sm:inline">
                • {results[0].environment.hardwareConcurrency ?? "?"} cores {results[0].environment.deviceMemory ? `· ${results[0].environment.deviceMemory}GB` : ""} •{" "}
                {new Date(results[0].environment.timestamp).toLocaleDateString()}
              </span>
            )}
          </div>

          <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-950 text-zinc-500">
                <tr>
                  <th className="px-3 py-3">Sims/move</th>
                  <th className="px-3 py-3">JS median</th>
                  <th className="px-3 py-3">WASM median</th>
                  <th className="px-3 py-3">JS avg ±σ</th>
                  <th className="px-3 py-3">WASM avg ±σ</th>
                  <th className="px-3 py-3">Speedup</th>
                  <th className="px-3 py-3">Best</th>
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
                    <td className={`px-3 py-3 ${r.medianSpeedup && r.medianSpeedup > 1 ? "text-green-400" : "text-zinc-300"}`}>
                      <div className="font-semibold">{r.medianSpeedup ? `${r.medianSpeedup.toFixed(2)}×` : "–"}</div>
                      <div className="text-xs font-normal text-zinc-500">avg {r.averageSpeedup ? `${r.averageSpeedup.toFixed(2)}×` : "–"}</div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-white">JS:{r.javascript?.runs[0]?.bestMove === null ? "–" : (r.javascript!.runs[0]!.bestMove as number) + 1}</span>
                      <span className="mx-1 text-zinc-600">·</span>
                      <span className={r.parity ? "text-green-400" : "text-red-400"}>
                        W:{r.wasm?.runs[0]?.bestMove === null ? "–" : (r.wasm!.runs[0]!.bestMove as number) + 1}
                        {r.parity === false ? " ✗" : ""}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Charts — speedup prominent */}
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
              <h4 className="text-xs font-medium text-zinc-500">Median time (ms) — lower wins</h4>
              <div className="mt-3 space-y-3">
                {results.map((r) => (
                  <div key={r.simulationsPerMove}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-zinc-400">{r.simulationsPerMove.toLocaleString()} sims</span>
                      <span className={`font-semibold ${r.medianSpeedup && r.medianSpeedup > 1 ? "text-green-400" : "text-zinc-500"}`}>
                        {r.medianSpeedup ? `${r.medianSpeedup.toFixed(2)}×` : ""}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-10 text-xs text-zinc-500">JS</span>
                        <div className="h-3 flex-1 overflow-hidden rounded-full bg-zinc-800">
                          <div className="h-full rounded-full bg-white" style={{ width: `${((r.javascript?.stats.medianExecutionTime ?? 0) / maxMedianTime) * 100}%` }} />
                        </div>
                        <span className="w-14 text-right text-xs tabular-nums text-zinc-300">{r.javascript?.stats.medianExecutionTime.toFixed(0)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-10 text-xs font-medium text-yellow-400">WASM</span>
                        <div className="h-3 flex-1 overflow-hidden rounded-full bg-zinc-800">
                          <div className="h-full rounded-full bg-yellow-400" style={{ width: `${((r.wasm?.stats.medianExecutionTime ?? 0) / maxMedianTime) * 100}%` }} />
                        </div>
                        <span className="w-14 text-right text-xs tabular-nums text-yellow-400">{r.wasm?.stats.medianExecutionTime.toFixed(0)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
              <h4 className="text-xs font-medium text-zinc-500">Throughput (sims/s) — higher wins</h4>
              <div className="mt-3 space-y-3">
                {results.map((r) => (
                  <div key={r.simulationsPerMove}>
                    <div className="mb-1 text-xs text-zinc-400">{r.simulationsPerMove.toLocaleString()} sims</div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-10 text-xs text-zinc-500">JS</span>
                        <div className="h-3 flex-1 overflow-hidden rounded-full bg-zinc-800">
                          <div
                            className="h-full rounded-full bg-white"
                            style={{ width: `${((r.javascript?.stats.medianSimulationsPerSecond ?? 0) / maxMedianSps) * 100}%` }}
                          />
                        </div>
                        <span className="w-14 text-right text-xs tabular-nums text-zinc-300">{r.javascript?.stats.medianSimulationsPerSecond.toFixed(0)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-10 text-xs font-medium text-yellow-400">WASM</span>
                        <div className="h-3 flex-1 overflow-hidden rounded-full bg-zinc-800">
                          <div
                            className="h-full rounded-full bg-yellow-400"
                            style={{ width: `${((r.wasm?.stats.medianSimulationsPerSecond ?? 0) / maxMedianSps) * 100}%` }}
                          />
                        </div>
                        <span className="w-14 text-right text-xs tabular-nums text-yellow-400">{r.wasm?.stats.medianSimulationsPerSecond.toFixed(0)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Advanced — collapsed by default */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Advanced Diagnostics</h3>
            <p className="mt-1 text-xs text-zinc-500">Boundary overhead & allocation — not the primary benchmark.</p>
          </div>
          <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-400">{showAdvanced ? "Hide" : "Show"}</span>
        </button>
        {showAdvanced && (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isBusy || boundaryRunning}
                onClick={async () => {
                  setBoundaryRunning(true);
                  try {
                    const b = await measureBoundary(effectiveBoard);
                    setBoundary(b);
                  } finally {
                    setBoundaryRunning(false);
                  }
                }}
                className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 disabled:opacity-50"
              >
                {boundaryRunning ? "Measuring…" : "Measure Boundary Overhead"}
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={() => setAllocation(profileDropPieceAllocation(50000))}
                className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 disabled:opacity-50"
              >
                Profile Allocations (50k drops)
              </button>
            </div>
            {boundary && (
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-400">
                <div className="font-medium text-zinc-300">Boundary Overhead (wall − engine)</div>
                <div>WASM init: {boundary.wasmInitMs?.toFixed(1) ?? "–"} ms · JS invoke: {boundary.jsInvokeOverheadMs?.toFixed(2) ?? "–"} ms · WASM invoke: {boundary.wasmInvokeOverheadMs?.toFixed(2) ?? "–"} ms</div>
                <div className="text-zinc-500">{boundary.note}</div>
              </div>
            )}
            {allocation && (
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-400">
                <div className="font-medium text-zinc-300">Allocation Profile (50k drops)</div>
                <div>Immutable: {allocation.immutableMs.toFixed(1)} ms · Mutable: {allocation.mutableMs.toFixed(1)} ms · Speedup mutable: {allocation.speedupMutableVsImmutable?.toFixed(2) ?? "–"}×</div>
                <div className="text-zinc-500">{allocation.note}</div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
