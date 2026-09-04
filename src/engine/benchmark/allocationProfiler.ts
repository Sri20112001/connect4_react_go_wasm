/**
 * Phase 21.4 — Profile allocation cost of immutable `dropPiece()`.
 *
 * Compares:
 *  - immutable API: `dropPiece(board, col, player) => { board: newBoard, row }` (clones each call)
 *  - mutable inner loop: mutates a single board array and reverts, no clone per drop
 *
 * The public API remains immutable. Internally, the hot path (MCTS rollout, simulateGame)
 * may optionally use mutation + undo to avoid O(ROWS*COLUMNS) cloning per ply.
 *
 * This profiler quantifies the tradeoff.
 */
import createEmptyBoard from "../../utilities/createEmptyBoard";
import { dropPiece } from "../javascript/board";
import { COLUMNS } from "../../utilities/CONSTANTS";
import type { Board, Player } from "../../types/types";

const time = () => performance.now();

/** Mutable drop that writes in place and returns row; caller must undo. */
export const dropPieceMutable = (board: Board, column: number, player: Player): number | null => {
  if (player === null) return null;
  if (column < 0 || column >= COLUMNS) return null;
  for (let row = board.length - 1; row >= 0; row--) {
    if (board[row][column] === null) {
      board[row][column] = player;
      return row;
    }
  }
  return null;
};

export const undoDrop = (board: Board, row: number, col: number): void => {
  board[row][col] = null;
};

export type AllocationProfile = {
  immutableMs: number;
  mutableMs: number;
  speedupMutableVsImmutable: number | null;
  ops: number;
  note: string;
};

export const profileDropPieceAllocation = (ops = 100_000): AllocationProfile => {
  const board = createEmptyBoard();

  // Warmup
  for (let i = 0; i < 1000; i++) dropPiece(board, i % COLUMNS, "red");

  const startImmutable = time();
  let b = board;
  for (let i = 0; i < ops; i++) {
    const col = i % COLUMNS;
    const res = dropPiece(b, col, i % 2 === 0 ? "red" : "yellow");
    // Keep board bounded: reset every 6 drops per column to avoid full board
    if (res.row !== null && i % 42 === 41) b = createEmptyBoard();
    else if (res.row !== null) b = res.board;
  }
  const immutableMs = time() - startImmutable;

  const mutableBoard = createEmptyBoard();
  const startMutable = time();
  const stack: Array<[number, number]> = [];
  for (let i = 0; i < ops; i++) {
    const col = i % COLUMNS;
    const row = dropPieceMutable(mutableBoard, col, i % 2 === 0 ? "red" : "yellow");
    if (row !== null) stack.push([row, col]);
    if (stack.length >= 42) {
      while (stack.length) {
        const [r, c] = stack.pop()!;
        undoDrop(mutableBoard, r, c);
      }
    }
  }
  const mutableMs = time() - startMutable;

  return {
    immutableMs,
    mutableMs,
    speedupMutableVsImmutable: mutableMs > 0 ? immutableMs / mutableMs : null,
    ops,
    note: "Immutable = clone per dropPiece; mutable = in-place + undo. Public API stays immutable; inner loop may use mutable.",
  };
};

/** Simulate MCTS-style rollout pressure: many clone+drop cycles. */
export const profileMctsLikeCloning = (iterations = 5000): AllocationProfile => {
  // Each iteration simulates a 20-ply rollout with cloning
  const ops = iterations * 20;
  return profileDropPieceAllocation(ops);
};
