# Benchmark Methodology

## What is measured
- **Workload**: simulations per move (`simulationsPerMove`) for a fixed board + player + algorithm.
- **Engines**: JavaScript (Worker → main-thread fallback) vs Go/WASM (`connect4RunMonteCarlo` / `connect4RunMCTS`).
- **Boards**: Current game board or parity boards P1–P8.
- **Algorithms**: `monte-carlo` (flat + heuristic rollout) and `mcts` (UCT, `c=√2`).

## What is not measured
- WASM download / `instantiateStreaming` time (measured separately as **WASM init** in Boundary Overhead).
- React render time.
- Network / disk.

## Protocol (reproducible)

### Scaling protocol (Phase 21.1)
```
workloads: 1_000, 5_000, 10_000, 25_000, 50_000, 100_000
warmupRuns: 2  (discarded)
measuredRuns: 5
alternateOrder: true  (JS→WASM, WASM→JS, …)
algorithm: monte-carlo or mcts
```
`SCALING_WORKLOADS = [1K,5K,10K,25K,50K,100K]` in `benchmarkRunner.ts`.
`DEFAULT_SCALING_PROTOCOL` clones it. Use `Scaling 1K–100K` button in Benchmark Lab.

Each workload:
```
for warmupRuns:  run both engines (discarded)
for measuredRuns:
  if alternateOrder && i%2==1: WASM then JS else JS then WASM
  yield setTimeout(0) between runs (avoid starvation)
```
Collect per-run:
```
executionTime           // perf.now() inside engine
totalSimulations        // sum(results.simulations) or iterations
simulationsPerSecond    // totalSimulations / (executionTime/1000)
bestMove                // number | null
```

### Statistics
From `computeBenchmarkStats`:
```
medianExecutionTime, averageExecutionTime, min, max, standardDeviation
medianSimulationsPerSecond, averageSimulationsPerSecond
```
Headline = **median**. Avg ±σ shows noise.

Speedup:
```
medianSpeedup  = js median / wasm median
averageSpeedup = js avg / wasm avg
```

CSV export via `toScalingCsv(results)` with columns:
`simulationsPerMove, algorithm, js_median_ms, wasm_median_ms, js_avg_ms, wasm_avg_ms, js_median_sps, wasm_median_sps, median_speedup, average_speedup, parity`

### Parity definition (Phase 19 → 21)
- **Tactical parity** (deterministic, `0` sims for Monte Carlo, `200` for MCTS): `P1–P8` expected best move; proves engines share heuristics.
- **Stochastic parity** (measured runs): paired per run:
  ```
  parity_run_i = js.bestMove !== null && wasm.bestMove !== null && js.bestMove === wasm.bestMove
  parity       = every(parity_run_i) ? true : false   // null if no runs
  ```
  Labelled `matchingRuns / totalRuns` (now `parityMatched / parityTotal`, not hardcoded `8`).

Old bug fixed: `null === null` → `false` (parity requires valid moves).

### Randomness
- MCTS shuffles `untriedMoves` to avoid column bias.
- Rollout uses `Math.random` weighted by heuristic.
- Parity therefore must be defined over runs, not a single stochastic comparison. Browser RNG is not seeded; use tactical boards for deterministic parity.

### Environment
Captured in `BenchmarkEnvironment`:
```
userAgent, hardwareConcurrency, deviceMemory, timestamp (ISO), wasmStatus
```
Displayed under results table.

### Boundary overhead isolation (Phase 21.2)
Separate from engine cost:
```
A. WASM init:        time(loadWasm)                         // measureWasmInit
B. Invoke overhead:  wallTime(JS/WASM benchmark) - engine.executionTime  // measureJs/WasmInvokeOverhead
C. Engine time:      result.executionTime
```
"Measure Boundary Overhead" button in Benchmark Lab shows `wall - engine`.

### Allocation profiling (Phase 21.4)
`allocationProfiler.ts` compares 50k drops:
```
immutable: dropPiece(board) clones each time
mutable:   dropPieceMutable(board) in-place + undoDrop
```
Public API stays immutable; profiling quantifies clone cost ≈ `speedupMutableVsImmutable = immutableMs / mutableMs`.

### Simulation safety
`clampSimulations(n)` (`CONSTANTS.ts`):
```
NaN/Infinity → DEFAULT (10_000)
floor(n) clamped to [MIN=1, MAX=100_000]
```
UI input is clamped on change; `App.handleRunSimulation`, `runJs/WasmBenchmark`, Worker all clamp.

### Limitations of browser benchmarks
- Single main thread for JS; WASM runs synchronously; Worker offloads JS to avoid blocking UI.
- `performance.now()` resolution ~5µs, JIT warmup affects first runs (hence warmup).
- GC pauses appear as outliers (median resilient).
- Results are browser/device-specific; always report environment.

### How to reproduce
1. `npm ci && npm test && npm run build`
2. `npm run dev`, set Engine=WASM (or JS), Algorithm, Board
3. Benchmark Lab → `Scaling 1K–100K` → `Run Comparison` (or use `DEFAULT_SCALING_PROTOCOL` via code)
4. Export CSV for external plotting
5. For parity: `Verify Parity (P1–P8)` (tactical `0` sims for MC, `200` for MCTS)

### History
- Phase 19 fixed: hardcoded `1000` sims → `DEFAULT_SIMULATIONS` clamped; hardcoded `100_000` default → `10_000`; `sims=0` labelled tactical; hardcoded `parityMatched===8` → dynamic; `effectivePlayer` now `currentPlayer`.
- Phase 20 added 49 regression tests green.
- Phase 21 added scaling matrix, CSV, boundary and allocation profiling.
