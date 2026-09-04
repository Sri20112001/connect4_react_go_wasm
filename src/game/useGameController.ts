import { useCallback, useEffect, useRef, useState } from "react";
import { useConnect4 } from "../utilities/hooks/useConnect4";
import { getAIEngine } from "../engine/getAIEngine";
import runMonteCarloJS from "../engine/javascript/monteCarlo";
import { runMCTS as runMCTSJS } from "../engine/javascript/mcts";
import { mctsResultToMonteCarloResult } from "../engine/javascript/mctsToMonteCarlo";
import { runMonteCarloInWorker } from "../engine/workers/jsWorkerClient";
import { clampSimulations, DEFAULT_SIMULATIONS } from "../utilities/CONSTANTS";
import type { Algorithm, Engine } from "../types/types";
import type { MonteCarloResult } from "../engine/types";
import { useWasmStatus } from "../engine/golang/useWasmStatus";
import { loadWasm } from "../engine/golang/wasmLoader";

export type UseGameControllerOptions = {
  engine: Engine;
  algorithm: Algorithm;
};

export type UseGameControllerReturn = {
  board: ReturnType<typeof useConnect4>["board"];
  currentPlayer: ReturnType<typeof useConnect4>["currentPlayer"];
  winner: ReturnType<typeof useConnect4>["winner"];
  isDraw: ReturnType<typeof useConnect4>["isDraw"];
  redConnects: number;
  yellowConnects: number;
  lastMove: ReturnType<typeof useConnect4>["lastMove"];
  lastAIMove: ReturnType<typeof useConnect4>["lastMove"];
  columns: number;
  wasmStatus: ReturnType<typeof useWasmStatus>;
  isAiThinking: boolean;
  isSimulationRunning: boolean;
  simulationResult: MonteCarloResult | null;
  playColumn: (col: number) => void;
  playBestMove: () => void;
  runSimulation: (engine: Engine, algorithm: Algorithm, sims: number) => Promise<void>;
  reset: () => void;
  selectedEngine: Engine;
  selectedAlgorithm: Algorithm;
  setEngine: (e: Engine) => void;
  setAlgorithm: (a: Algorithm) => void;
  simulations: number;
  setSimulations: (n: number) => void;
};

export function useGameController(opts: UseGameControllerOptions): UseGameControllerReturn {
  const [simulationResult, setSimulationResult] = useState<MonteCarloResult | null>(null);
  const [selectedEngine, setSelectedEngine] = useState<Engine>(opts.engine);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<Algorithm>(opts.algorithm);
  const [simulations, setSimulations] = useState<number>(DEFAULT_SIMULATIONS);
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const wasmStatus = useWasmStatus();
  const { board, currentPlayer, winner, isDraw, redConnects, yellowConnects, lastMove, dropPiece, resetGame, columns } =
    useConnect4();
  const [lastAIMove, setLastAIMove] = useState<ReturnType<typeof useConnect4>["lastMove"]>(null);
  const requestIdRef = useRef(0);

  const isAiThinking = currentPlayer === "yellow" && winner === null && !isDraw;

  // AI move execution — separate from analysis
  useEffect(() => {
    if (!isAiThinking) return;
    let cancelled = false;
    const AI_TIMEOUT_MS = 15_000;
    const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T> =>
      Promise.race([p, new Promise<T>((_, reject) => setTimeout(() => reject(new Error("AI timeout after " + ms + "ms")), ms))]);

    const runAI = async () => {
      const effectiveEngine: Engine = selectedEngine === "wasm" && wasmStatus === "ready" ? "wasm" : "javascript";
      const tryEngine = async (eng: Engine) => {
        const engine = getAIEngine(eng);
        const analysis = await withTimeout(
          engine.chooseMove(board, "yellow", {
            simulationsPerMove: clampSimulations(simulations),
            algorithm: selectedAlgorithm,
          }),
          AI_TIMEOUT_MS,
        );
        if (cancelled) return;
        if (analysis.column !== -1) {
          let row: number | null = null;
          for (let r = board.length - 1; r >= 0; r--) if (board[r][analysis.column] === null) { row = r; break; }
          if (row !== null) setLastAIMove({ row, column: analysis.column, player: "yellow" });
          // Invalidate before applying so old analysis doesn't flash
          setSimulationResult(null);
          requestIdRef.current += 1;
          dropPiece(analysis.column);
        } else {
          console.warn("AI has no legal moves (board full or terminal)");
        }
      };

      try {
        await tryEngine(effectiveEngine);
      } catch (err) {
        if (cancelled) return;
        console.error("AI move failed:", err);
        if (effectiveEngine === "wasm") {
          try {
            console.warn("Retrying AI with javascript fallback");
            await tryEngine("javascript");
          } catch (err2) {
            if (!cancelled) console.error("AI fallback also failed:", err2);
          }
        }
      }
    };
    void runAI();
    return () => {
      cancelled = true;
    };
  }, [isAiThinking, board, dropPiece, selectedEngine, selectedAlgorithm, wasmStatus, simulations]);

  // Analysis belongs to the player whose turn it currently is — with board/version guard
  const runSimulation = useCallback(
    async (engine: Engine, algorithm: Algorithm, simulations: number) => {
      const safeSimulations = clampSimulations(simulations);
      const boardAtStart = board;
      const playerAtStart = currentPlayer;
      const versionAtStart = requestIdRef.current + 1;
      requestIdRef.current = versionAtStart;
      setIsSimulationRunning(true);
      await new Promise<void>((r) => setTimeout(r, 0));
      const effectiveEngine: Engine = engine === "wasm" && wasmStatus === "ready" ? "wasm" : "javascript";
      try {
        let result: MonteCarloResult | null = null;
        if (effectiveEngine === "javascript") {
          try {
            result = await runMonteCarloInWorker(boardAtStart, playerAtStart, safeSimulations, algorithm);
          } catch {
            if (algorithm === "mcts") {
              const r = runMCTSJS(boardAtStart, playerAtStart, safeSimulations);
              result = mctsResultToMonteCarloResult(r);
            } else {
              result = runMonteCarloJS(boardAtStart, { simulationsPerMove: safeSimulations, player: playerAtStart });
            }
          }
        } else {
          try {
            await loadWasm();
            const win = window as unknown as {
              connect4RunMonteCarlo?: (opts: { board: typeof boardAtStart; player: typeof playerAtStart; simulationsPerMove: number }) => MonteCarloResult & { analysis: unknown };
              connect4RunMCTS?: (opts: { board: typeof boardAtStart; player: typeof playerAtStart; simulationsPerMove: number }) => MonteCarloResult & { analysis: unknown };
            };
            const wasmResult =
              algorithm === "mcts"
                ? win.connect4RunMCTS?.({ board: boardAtStart, player: playerAtStart, simulationsPerMove: safeSimulations })
                : win.connect4RunMonteCarlo?.({ board: boardAtStart, player: playerAtStart, simulationsPerMove: safeSimulations });
            if (!wasmResult) throw new Error("WASM engine not ready");
            result = {
              bestMove: wasmResult.bestMove,
              results: wasmResult.results,
              executionTime: wasmResult.executionTime,
              totalSimulations: wasmResult.totalSimulations,
              simulationsPerSecond: wasmResult.simulationsPerSecond,
            };
          } catch (err) {
            console.error("WASM simulation failed:", err);
            if (algorithm === "mcts") {
              const r = runMCTSJS(boardAtStart, playerAtStart, safeSimulations);
              result = mctsResultToMonteCarloResult(r);
            } else {
              result = runMonteCarloJS(boardAtStart, { simulationsPerMove: safeSimulations, player: playerAtStart });
            }
          }
        }
        // Guard: discard if board/player/version changed while async
        if (versionAtStart !== requestIdRef.current) return;
        if (board !== boardAtStart || currentPlayer !== playerAtStart) return;
        if (result) setSimulationResult(result);
      } finally {
        // Only clear running if this request is still current
        if (versionAtStart === requestIdRef.current) setIsSimulationRunning(false);
      }
    },
    [board, currentPlayer, isSimulationRunning, wasmStatus],
  );

  // Manual analysis only — no auto-run (user requested)

  const playColumn = (col: number) => {
    if (winner || isDraw || isAiThinking) return;
    // Invalidate before mutation so old "Column 4 — Best" doesn't linger
    setSimulationResult(null);
    requestIdRef.current += 1;
    dropPiece(col);
  };

  const playBestMove = () => {
    if (winner || isDraw) return;
    if (!simulationResult) return;
    if (simulationResult.bestMove === -1) return;
    setSimulationResult(null);
    requestIdRef.current += 1;
    dropPiece(simulationResult.bestMove);
  };

  const reset = () => {
    // Stop every in-flight operation — AI chooseMove, simulation
    requestIdRef.current += 1;
    setIsSimulationRunning(false);
    setSimulationResult(null);
    setLastAIMove(null);
    resetGame();
  };

  const setSimulationsClamped = (n: number) => setSimulations(clampSimulations(n));

  return {
    board,
    currentPlayer,
    winner,
    isDraw,
    redConnects,
    yellowConnects,
    lastMove,
    lastAIMove,
    columns,
    wasmStatus,
    isAiThinking,
    isSimulationRunning,
    simulationResult,
    playColumn,
    playBestMove,
    runSimulation,
    reset,
    selectedEngine,
    selectedAlgorithm,
    setEngine: setSelectedEngine,
    setAlgorithm: setSelectedAlgorithm,
    simulations,
    setSimulations: setSimulationsClamped,
  };
}
