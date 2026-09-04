import type { Board, Player } from "../../types/types";
import { cloneBoard, getAvailableColumns, dropPiece } from "./board";
import { checkWinner, isBoardFull } from "../../utilities/checkWinner";
import { findImmediateWinningMove, countImmediateWinningMoves } from "./tactical";
import { findForkingMove } from "./threats";
import { evaluateBoard } from "./evaluateBoard";

const EXPLORATION_CONSTANT = Math.sqrt(2);

// --- Node ---

// MCTS reward invariant (root-player perspective):
//   win  = 1
//   draw = 0.5
//   loss = 0
// Stored separately as (wins: literal win count) vs (wins reward) is ambiguous;
// here `wins` is accumulated reward, `draws` is literal draw count, so:
//   pureWins = wins - 0.5*draws, losses = visits - pureWins - draws
class MCTSNode {
  board: Board;
  player: Player; // player to move at this node
  move: number | null; // column that led to this node
  parent: MCTSNode | null;
  children: Map<number, MCTSNode> = new Map();
  visits = 0;
  wins = 0; // accumulated reward for root player
  draws = 0; // literal draws
  untriedMoves: number[];
  isTerminal = false;
  winner: Player | null = null; // if terminal win, winner; null for draw

  constructor(board: Board, player: Player, move: number | null, parent: MCTSNode | null) {
    this.board = board;
    this.player = player;
    this.move = move;
    this.parent = parent;
    this.untriedMoves = getAvailableColumns(board);
    // Shuffle untried to avoid bias (deterministic order would bias first column)
    for (let i = this.untriedMoves.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.untriedMoves[i], this.untriedMoves[j]] = [this.untriedMoves[j], this.untriedMoves[i]];
    }
  }
}

const opponentOf = (p: Player): Player => (p === "red" ? "yellow" : "red");

// --- Rollout policy (reuses heuristic from simulateGame) ---

const chooseWeightedRandomColumn = (availableColumns: number[]): number => {
  const weights = availableColumns.map((c) => 4 - Math.abs(3 - c));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < availableColumns.length; i++) {
    r -= weights[i];
    if (r < 0) return availableColumns[i];
  }
  return availableColumns[availableColumns.length - 1];
};

const chooseHeuristicWeightedColumn = (board: Board, player: Player, availableColumns: number[]): number | null => {
  if (player === null || availableColumns.length === 0) return null;
  const opponent = opponentOf(player);
  const candidates = availableColumns
    .map((col) => {
      const { board: testBoard, row } = dropPiece(board, col, player);
      if (row === null) return null;
      if (findImmediateWinningMove(testBoard, opponent) !== null) return null;
      const winningMoves = countImmediateWinningMoves(testBoard, player);
      let score = evaluateBoard(testBoard, player);
      if (winningMoves >= 2) score += 500;
      if (findForkingMove(testBoard, opponent) !== null) score -= 150;
      return { column: col, score };
    })
    .filter((c): c is { column: number; score: number } => c !== null);
  if (candidates.length === 0) return chooseWeightedRandomColumn(availableColumns);
  const minScore = Math.min(...candidates.map((c) => c.score));
  const weighted = candidates.map((c) => ({ column: c.column, weight: c.score - minScore + 1 }));
  const total = weighted.reduce((s, c) => s + c.weight, 0);
  let r = Math.random() * total;
  for (const c of weighted) {
    r -= c.weight;
    if (r < 0) return c.column;
  }
  return weighted[weighted.length - 1].column;
};

const chooseRolloutMove = (board: Board, player: Player): number | null => {
  if (player === null) return null;
  const win = findImmediateWinningMove(board, player);
  if (win !== null) return win;
  const opp = opponentOf(player);
  const block = findImmediateWinningMove(board, opp);
  if (block !== null) return block;
  const fork = findForkingMove(board, player);
  if (fork !== null) {
    const { board: fb } = dropPiece(board, fork, player);
    if (findImmediateWinningMove(fb, opp) === null) return fork;
  }
  const avail = getAvailableColumns(board);
  if (avail.length === 0) return null;
  return chooseHeuristicWeightedColumn(board, player, avail);
};

const rollout = (board: Board, playerToMove: Player, rootPlayer: Player): "win" | "loss" | "draw" => {
  let b = cloneBoard(board);
  let current: Player = playerToMove;
  while (true) {
    const col = chooseRolloutMove(b, current);
    if (col === null) return "draw";
    const { board: nextB, row } = dropPiece(b, col, current);
    if (row === null) {
      const avail = getAvailableColumns(b);
      if (avail.length === 0) return "draw";
      continue;
    }
    b = nextB;
    if (checkWinner(b, row, col, current)) {
      return current === rootPlayer ? "win" : "loss";
    }
    if (isBoardFull(b)) return "draw";
    current = opponentOf(current);
  }
};

// --- UCT ---

const uctValue = (child: MCTSNode, parentVisits: number, c: number): number => {
  if (child.visits === 0) return Infinity;
  const exploitation = child.wins / child.visits;
  const exploration = c * Math.sqrt(Math.log(parentVisits) / child.visits);
  return exploitation + exploration;
};

const selectBestChild = (node: MCTSNode, c: number): MCTSNode => {
  let best: MCTSNode | null = null;
  let bestVal = -Infinity;
  for (const child of node.children.values()) {
    const v = uctValue(child, node.visits, c);
    if (v > bestVal) {
      bestVal = v;
      best = child;
    }
  }
  return best!;
};

// --- Public API ---

export type MCTSResult = {
  bestMove: number;
  visits: Map<number, number>;
  wins: Map<number, number>;
  draws: Map<number, number>;
  executionTime: number;
  totalSimulations: number;
};

export const runMCTS = (
  board: Board,
  player: Player,
  iterations: number,
  explorationConstant = EXPLORATION_CONSTANT,
): MCTSResult => {
  const start = performance.now();

  if (player === null) {
    return { bestMove: -1, visits: new Map(), wins: new Map(), draws: new Map(), executionTime: 0, totalSimulations: 0 };
  }

  const available = getAvailableColumns(board);
  if (available.length === 0) {
    return { bestMove: -1, visits: new Map(), wins: new Map(), draws: new Map(), executionTime: 0, totalSimulations: 0 };
  }

  // Fast path: immediate win — still prefer it, mirrors flat MC tier
  const immediateWin = findImmediateWinningMove(board, player);
  if (immediateWin !== null) {
    const end = performance.now();
    return {
      bestMove: immediateWin,
      visits: new Map([[immediateWin, iterations]]),
      wins: new Map([[immediateWin, iterations]]),
      draws: new Map(),
      executionTime: end - start,
      totalSimulations: iterations,
    };
  }

  const root = new MCTSNode(cloneBoard(board), player, null, null);

  for (let i = 0; i < iterations; i++) {
    let node: MCTSNode = root;

    // Selection
    while (node.untriedMoves.length === 0 && node.children.size > 0 && !node.isTerminal) {
      node = selectBestChild(node, explorationConstant);
    }

    // Expansion
    let nodeToSimulate: MCTSNode = node;
    if (!node.isTerminal && node.untriedMoves.length > 0) {
      const move = node.untriedMoves.pop()!;
      const { board: newBoard, row } = dropPiece(node.board, move, node.player);
      let isTerminal = false;
      let winner: Player | null = null;
      if (row !== null && checkWinner(newBoard, row, move, node.player)) {
        isTerminal = true;
        winner = node.player;
      } else if (isBoardFull(newBoard)) {
        isTerminal = true;
        winner = null;
      }
      const child = new MCTSNode(newBoard, opponentOf(node.player), move, node);
      child.isTerminal = isTerminal;
      child.winner = winner;
      node.children.set(move, child);
      nodeToSimulate = child;
    }

    // Simulation
    let result: "win" | "loss" | "draw";
    if (nodeToSimulate.isTerminal) {
      if (nodeToSimulate.winner === player) result = "win";
      else if (nodeToSimulate.winner === null) result = "draw";
      else result = "loss";
    } else {
      result = rollout(nodeToSimulate.board, nodeToSimulate.player, player);
    }

    // Backpropagation
    let cur: MCTSNode | null = nodeToSimulate;
    while (cur) {
      cur.visits += 1;
      if (result === "win") cur.wins += 1;
      else if (result === "draw") {
        cur.wins += 0.5;
        cur.draws += 1;
      }
      cur = cur.parent;
    }
  }

  // Pick best child by visits (most robust), tie-break by win rate then column asc
  let bestMove = -1;
  let bestVisits = -1;
  let bestWinRate = -1;
  for (const [move, child] of root.children) {
    const winRate = child.visits > 0 ? child.wins / child.visits : 0;
    if (child.visits > bestVisits || (child.visits === bestVisits && winRate > bestWinRate) || (child.visits === bestVisits && winRate === bestWinRate && move < bestMove)) {
      bestVisits = child.visits;
      bestWinRate = winRate;
      bestMove = move;
    }
  }

  // Fallback if no child (should not happen)
  if (bestMove === -1 && available.length > 0) bestMove = available[0];

  const visits = new Map<number, number>();
  const wins = new Map<number, number>();
  const draws = new Map<number, number>();
  for (const [m, child] of root.children) {
    visits.set(m, child.visits);
    wins.set(m, child.wins);
    draws.set(m, child.draws);
  }

  const end = performance.now();
  return {
    bestMove,
    visits,
    wins,
    draws,
    executionTime: end - start,
    totalSimulations: iterations,
  };
};
