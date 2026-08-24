import type { Board, Player } from "../../types/types";
import type { AIEngine, AIEngineOptions } from "../types";
import { chooseMoveInWorker, isJsWorkerAvailable } from "../workers/jsWorkerClient";

export const javascriptEngine: AIEngine = {
  async chooseMove(
    board: Board,
    player: Player,
    options: AIEngineOptions,
  ) {
    // Offload to Worker to keep UI responsive; fallback to main thread if Worker unavailable
    if (isJsWorkerAvailable()) {
      return chooseMoveInWorker(board, player, options.simulationsPerMove, options.algorithm ?? "monte-carlo", options.explorationConstant);
    }

    // Fallback (e.g., tests, no Worker)
    const { analyzePosition } = await import("./analysis/analyzePosition");
    const { runMCTS } = await import("./mcts");
    const { analyzeMove } = await import("./analysis/analyzeMove");

    const algorithm = options.algorithm ?? "monte-carlo";

    if (algorithm === "mcts") {
      const mcts = runMCTS(board, player, options.simulationsPerMove, options.explorationConstant);
      if (mcts.bestMove === -1) throw new Error("No legal moves available");
      const base = analyzeMove(board, mcts.bestMove, player, 0);
      const visits = mcts.visits.get(mcts.bestMove) ?? 0;
      const winsF = mcts.wins.get(mcts.bestMove) ?? 0;
      const winRate = visits > 0 ? (winsF / visits) * 100 : 0;
      const tier = base.isImmediateWin ? 3 : base.blocksImmediateLoss ? 2 : base.createsFork ? 1 : 0;
      let finalScore = tier * 1000 + winRate + base.evaluationScore / 10;
      if (base.allowsOpponentFork) finalScore -= 15;
      if (!base.legal) finalScore = Number.NEGATIVE_INFINITY;
      return { ...base, simulations: visits, wins: Math.round(winsF), losses: visits - Math.round(winsF), draws: 0, winRate, finalScore };
    }

    const analysis = analyzePosition(board, player, options.simulationsPerMove);
    if (analysis.length === 0) throw new Error("No legal moves available");
    return analysis[0];
  },
};
