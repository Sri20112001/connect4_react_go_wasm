# Parity

## Goal
Prove JS and Go/WASM are **the same decision engine**, not just similar speed.

## Two parities

### 1. Tactical (deterministic)
- Boards: `P1–P8` in `parityBoards.ts`
- Sims: `0` for Monte Carlo (no simulation, only tiers: win > block > fork > eval), `200` for MCTS (stochastic, but boards are constructed to be deterministic despite 200 iterations for MCTS).
- Expected best: `expectedBest` per board (center, forced win, fork, etc.).
- Label in UI: `Tactical parity (0 sims)`; for MCTS `Stochastic parity (200 sims)`.

Why 0 sims? With `0` simulations `analyzePosition` still returns sorted tactical tiers, so comparison is pure heuristic — ideal to prove JS/Go share the same `evaluateBoard`, `tactical`, `threats`.

### 2. Stochastic (measured runs)
For scaling workloads (1K–100K sims):
```
for each paired run i:
  jsBest_i   = javascript.runs[i].bestMove
  wasmBest_i = wasm.runs[i].bestMove
  parity_i   = jsBest_i !== null && wasmBest_i !== null && jsBest_i === wasmBest_i

parity = every(parity_i) ? true : false
reported as: parityMatched / parityTotal  and  matchingRuns / totalRuns
```
Not `last run only`, not `null === null`.

## Parity boards

| id | label | player | expectedBest | tests |
|---|---|---|---|---|
| P1 | empty — center | red | 3 | JS/WASM center preference |
| P2 | opening | red | 2 |  |
| P3 | forced win | red | 3 | immediate win tier 3 |
| P4 | forced block | red | 3 | block tier 2 |
| P5 | fork | red | 2 | createsFork tier 1 |
| P6 | defensive fork | red | 2 |  |
| P7 | mid-game win | red | 3 |  |
| P8 | late-game (col 6 only) | red | 6 | only legal move |

`P8` board is near-full with `(r+3c)%5` pattern, `b[0][6]=null` ensures single legal move — tests full-board edge.

## Verification
- Benchmark Lab → `Verify Parity (P1–P8)` calls `runParityVerification(boards, sims, algorithm)`.
- Resilient: per-board `try/catch`; on error `parity=false` instead of aborting all 8.
- Dynamic total: `parityTotal = PARITY_BOARDS.length` (not hardcoded `8`).

## Tests
- `benchmarkParity.test.ts`: guards `null/null !== parity`, paired parity logic, `matchingRuns/totalRuns` invariant.
- `inputWasm.test.ts`: asserts Benchmark Lab uses `currentPlayer` not `? "yellow": "red"` and dynamic totals.
- MCTS invariant doc in `mcts.ts` clarifies `wins` reward vs literal draws.

## What parity does not prove
- It does not prove speed parity (that's throughput `sims/s`).
- It does not prove identical rollout sequences (RNG differs); it proves **decision agreement** on constructed positions.
- For truly random mid-game boards, expect occasional JS≠WASM due to stochasticity; use tactical boards for deterministic proof.
