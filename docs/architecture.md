# Architecture

## Stack
- React 19 + Vite + TypeScript (strict, `bundler` resolution)
- Tailwind + Zustand (UI state)
- Go / WASM optional engine (`public/main.wasm` via `wasm_exec.js`)

## Invariants (Phase 19 → 21)

### 1. Immutable board at the API boundary
```
React state
  ↓
dropPiece(board, col, player) => { board: newBoard, row }   // clones, validates
  ↓
new board
```
- Every board operation clones before mutating.
- Terminal guard: `if (winner || isDraw) return` in `useConnect4` and all play paths (`App` auto-AI, `handlePlayBestMove`, board click).
- Validation: `column ∈ [0, COLUMNS)` and `Number.isInteger`; otherwise `row=null, board unchanged`.

Inside hot loops (MCTS rollout) a **controlled mutable** path exists (`dropPieceMutable` + `undoDrop` in `allocationProfiler.ts`) for measurement. Public API stays immutable; inner loop may mutate+undo to avoid `O(ROWS·COLUMNS)` clone per ply. The tradeoff is explicitly profiled.

### 2. Terminal order
```
validate column → play → countWinningLines → lines>0 ? winner : isBoardFull ? draw/compareConnects : switch player
```
Winner is set immediately on 4-in-a-row, not only when board is full (bug fixed in Phase 19).

### 3. MCTS reward invariant
```
win  = 1
draw = 0.5
loss = 0
```
`MCTSNode.wins` is accumulated reward, `draws` is literal count. Conversion:
```
pureWins = wins - 0.5*draws
losses   = visits - pureWins - draws
winRate  = wins / visits * 100
```
Centralized in `mctsToMonteCarlo.ts`; all JS, Worker, and WASM fallbacks share it. Missing `;` in `evaluateBoard.ts` fixed; center weight remains `+1` (tie-breaker) vs `100/-120` for 3-in-a-row windows.

### 4. Unified flow
```
React Game State
  → immutable board
    → JS Engine (Monte Carlo / MCTS)  →  MonteCarloResult { wins/draws/losses, executionTime, simulationsPerSecond }
      → Gameplay (JS or WASM via getAIEngine)   vs   Benchmark (JS/WASM side-by-side, parity + perf)
```

## Modules
- `utilities/CONSTANTS.ts`: `ROWS=6, COLUMNS=7, DIRECTIONS`, `MIN/MAX/DEFAULT_SIMULATIONS`, `clampSimulations`.
- `engine/javascript/board.ts`: `cloneBoard`, `getAvailableColumns`, `dropPiece`.
- `engine/javascript/tactical.ts` / `threats.ts`: `findImmediateWinningMove`, `countImmediateWinningMoves`, `findForkingMove`.
- `engine/javascript/analysis/*`: `analyzeMove` / `analyzePosition` (tier 3 win > 2 block > 1 fork > MC).
- `engine/javascript/monteCarlo.ts`: now always returns `results` even for forcing moves (Phase 19 fix).
- `engine/javascript/mcts.ts`: UCT, separate `draws` map, fast path for immediate win.
- `engine/javascript/mctsToMonteCarlo.ts`: single conversion.
- `engine/benchmark/*`: `benchmarkRunner.ts` (reliable runs, `SCALING_WORKLOADS`, CSV), `boundaryOverhead.ts`, `allocationProfiler.ts`, `parityBoards.ts` (P1–P8).
- `engine/golang/wasmLoader.ts`: `new URL("main.wasm", import.meta.env.BASE_URL)` for `/` and `/portfolio/`; retry after `error` clears `wasmReadyPromise`.
- `pages/ConnectPage/components/BenchmarkLab.tsx`: scaling 1K–100K, CSV export, boundary/allocation profiling.

## Data flow for AI
```
board + player + simulationsPerMove (clamped)
  → analyzePosition or MCTS
    → MonteCarloResult → UI (SimulationAnalysis) + Benchmark (stats, speedup)
```

WASM path: `window.connect4RunMonteCarlo / connect4RunMCTS`; on failure falls back to JS Worker → main thread.
