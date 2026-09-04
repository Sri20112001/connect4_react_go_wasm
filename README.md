# Connect 4 Lab — JS & Go/WASM

Interactive **Connect 4** with two execution engines (JavaScript and Go compiled to WebAssembly) sharing the same board and AI.

## Routes
- `/connect4` — **Game**: human vs AI, board + AI analysis, winner/draw, no benchmark state.
- `/benchmark/connect4` — **Benchmark**: JS vs WASM side-by-side, scaling 1K–100K, parity P1–P8, boundary overhead, allocation profiling. Independent of game state.

## Architecture
```
src/engine/            # shared (JS + Go/WASM bridge, board, MCTS, tactical, evaluate)
  javascript/          # board.ts (immutable dropPiece), mcts.ts, monteCarlo.ts, etc.
  golang/              # wasmLoader.ts (BASE_URL, retry), wasmEngine.ts
  benchmark/           # runner, parityBoards, boundaryOverhead, allocationProfiler
src/game/              # GameController, useGameController (no benchmark deps)
src/pages/
  ConnectPage/         # game only: board + AIEnginePanel + SimulationAnalysis
  BenchmarkPage/       # standalone: BenchmarkLab + scaling + profiling
src/types/             # Board, Player, GameState
App.tsx                # BrowserRouter basename=BASE_URL, Header with nav
docs/
  architecture.md
  benchmark-methodology.md
  parity.md
```

Shared engine: `engine/` is used by both `game/` and `benchmark/` but neither depends on the other.

## Invariants (Phases 19–21)
- Immutable `dropPiece` at API boundary; terminal guard `winner||isDraw`; column validation.
- MCTS reward `win=1 draw=0.5 loss=0` (`wins` = reward, `draws` = literal).
- `clampSimulations` `[1,100_000]`; WASM `new URL("main.wasm", import.meta.env.BASE_URL)` + retry.

## Benchmark
See `docs/benchmark-methodology.md`. Headline = median of 5 measured runs after 2 warmup. Parity = paired `jsBest!==null && wasmBest!==null && js===wasm` → `matchingRuns/totalRuns`.

## Scripts
- `npm run dev` — `http://localhost:5173/connect4`
- `npm test` — 49+ tests (Vitest + jsdom, 20.1–20.9)
- `npm run build` — `tsc -b && vite build` (sub-path ready)
- `npm run lint`

## Docs
- `docs/architecture.md`
- `docs/benchmark-methodology.md`
- `docs/parity.md`
