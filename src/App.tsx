import { useEffect, useState } from "react";
import Header from "./components/Header";
import { getAIEngine } from "./engine/getAIEngine";
import runMonteCarloJS from "./engine/javascript/monteCarlo";
import { runMCTS as runMCTSJS } from "./engine/javascript/mcts";
import { runMonteCarloInWorker } from "./engine/workers/jsWorkerClient";
import AIEnginePanel from "./pages/ConnectPage/components/AIEnginePanel";
import ConnectBoard from "./pages/ConnectPage/components/ConnectBoard";
import type { Algorithm, Engine } from "./types/types";
import { useConnect4 } from "./utilities/hooks/useConnect4";
import type { MonteCarloResult } from "./engine/types";
import SimulationAnalysis from "./pages/ConnectPage/components/SimulationAnalysis";
import BenchmarkLab from "./pages/ConnectPage/components/BenchmarkLab";
import { useWasmStatus } from "./engine/golang/useWasmStatus";
import { loadWasm } from "./engine/golang/wasmLoader";

export default function App() {
  const [simulationResult, setSimulationResult] = useState<MonteCarloResult | null>(null);
  const [selectedEngine, setSelectedEngine] = useState<Engine>("javascript");
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<Algorithm>("monte-carlo");
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const wasmStatus = useWasmStatus();

  const { board, currentPlayer, winner, isDraw, redConnects, yellowConnects, dropPiece, resetGame } =
    useConnect4();

  const isAiThinking = currentPlayer === "yellow" && winner === null && !isDraw;

  useEffect(() => {
    if (!isAiThinking) return;

    let cancelled = false;

    const runAI = async () => {
      const effectiveEngine = selectedEngine === "wasm" && wasmStatus === "error" ? "javascript" : selectedEngine;
      const engine = getAIEngine(effectiveEngine);

      try {
        const analysis = await engine.chooseMove(board, "yellow", {
          simulationsPerMove: 1000,
          algorithm: selectedAlgorithm,
        });

        if (cancelled) return;
        if (analysis.column !== -1) dropPiece(analysis.column);
      } catch (err) {
        if (!cancelled) console.error("AI move failed:", err);
      }
    };

    void runAI();

    return () => {
      cancelled = true;
    };
  }, [isAiThinking, board, dropPiece, selectedEngine, selectedAlgorithm, wasmStatus]);

  const handleRunSimulation = async (
    engine: Engine,
    algorithm: Algorithm,
    simulations: number,
  ) => {
    if (isSimulationRunning) return;
    setIsSimulationRunning(true);
    // Yield to allow spinner to paint before blocking JS/WASM work
    await new Promise<void>((r) => setTimeout(r, 0));

    const effectiveEngine = engine === "wasm" && wasmStatus === "error" ? "javascript" : engine;

    try {
    if (effectiveEngine === "javascript") {
      try {
        const result = await runMonteCarloInWorker(board, "yellow", simulations, algorithm);
        setSimulationResult(result);
      } catch {
        // Fallback to main thread if Worker fails
        if (algorithm === "mcts") {
          const r = runMCTSJS(board, "yellow", simulations);
          const results = Array.from(r.visits.entries()).map(([col, visits]) => {
            const winsF = r.wins.get(col) ?? 0;
            return {
              column: col,
              simulations: visits,
              wins: Math.round(winsF),
              losses: visits - Math.round(winsF),
              draws: 0,
              winRate: visits > 0 ? (winsF / visits) * 100 : 0,
            };
          });
          setSimulationResult({
            bestMove: r.bestMove,
            results,
            executionTime: r.executionTime,
            totalSimulations: r.totalSimulations,
            simulationsPerSecond: r.executionTime > 0 ? r.totalSimulations / (r.executionTime / 1000) : 0,
          });
          return;
        }
        const result = runMonteCarloJS(board, {
          simulationsPerMove: simulations,
          player: "yellow",
        });
        setSimulationResult(result);
      }
      return;
    }

      // WASM path
      try {
        await loadWasm();
        const win = window as unknown as {
          connect4RunMonteCarlo?: (opts: { board: typeof board; player: "yellow" | "red"; simulationsPerMove: number }) => MonteCarloResult & { analysis: unknown };
          connect4RunMCTS?: (opts: { board: typeof board; player: "yellow" | "red"; simulationsPerMove: number }) => MonteCarloResult & { analysis: unknown };
        };
        const wasmResult =
          algorithm === "mcts"
            ? win.connect4RunMCTS?.({ board, player: "yellow", simulationsPerMove: simulations })
            : win.connect4RunMonteCarlo?.({ board, player: "yellow", simulationsPerMove: simulations });

        if (!wasmResult) throw new Error("WASM engine not ready");

        setSimulationResult({
          bestMove: wasmResult.bestMove,
          results: wasmResult.results,
          executionTime: wasmResult.executionTime,
          totalSimulations: wasmResult.totalSimulations,
          simulationsPerSecond: wasmResult.simulationsPerSecond,
        });
      } catch (err) {
        console.error("WASM simulation failed:", err);
        if (algorithm === "mcts") {
          const r = runMCTSJS(board, "yellow", simulations);
          const results = Array.from(r.visits.entries()).map(([col, visits]) => {
            const winsF = r.wins.get(col) ?? 0;
            return {
              column: col,
              simulations: visits,
              wins: Math.round(winsF),
              losses: visits - Math.round(winsF),
              draws: 0,
              winRate: visits > 0 ? (winsF / visits) * 100 : 0,
            };
          });
          setSimulationResult({
            bestMove: r.bestMove,
            results,
            executionTime: r.executionTime,
            totalSimulations: r.totalSimulations,
            simulationsPerSecond: r.executionTime > 0 ? r.totalSimulations / (r.executionTime / 1000) : 0,
          });
          return;
        }
        const fallback = runMonteCarloJS(board, {
          simulationsPerMove: simulations,
          player: "yellow",
        });
        setSimulationResult(fallback);
      }
    } finally {
      setIsSimulationRunning(false);
    }
  };

  const handlePlayBestMove = () => {
    if (!simulationResult) return;
    if (simulationResult.bestMove === -1) return;
    dropPiece(simulationResult.bestMove);
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header wasmStatus={wasmStatus} />
      <main className="mx-auto max-w-6xl p-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div>
            <ConnectBoard
              board={board}
              currentPlayer={currentPlayer}
              isThinking={isAiThinking || isSimulationRunning}
              onColumnClick={(n) => {
                if (isAiThinking || isSimulationRunning) return;
                dropPiece(n);
              }}
            />
            <div className="mt-4 text-center">
              <div className="mb-3 flex items-center justify-center gap-6 text-sm">
                <span className="text-zinc-300">
                  <span className="mr-1 inline-block h-3 w-3 rounded-full bg-red-500" />
                  Player: {redConnects}
                </span>

                <span className="text-zinc-300">
                  <span className="mr-1 inline-block h-3 w-3 rounded-full bg-yellow-400" />
                  AI: {yellowConnects}
                </span>
              </div>

              {winner && (
                <p className="text-lg font-semibold text-green-400">
                  {winner === "red" ? "Player" : "AI"} wins!
                </p>
              )}

              {!winner && isDraw && (
                <p className="text-lg font-semibold text-yellow-400">It's a draw!</p>
              )}

              {!winner && !isDraw && (
                <p className="text-sm text-zinc-400">
                  {currentPlayer === "red" ? "Player's turn" : "AI's turn"}
                </p>
              )}
            </div>

            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={resetGame}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
              >
                New Game
              </button>
            </div>
          </div>

          <AIEnginePanel
            selectedEngine={selectedEngine}
            onEngineChange={setSelectedEngine}
            selectedAlgorithm={selectedAlgorithm}
            onAlgorithmChange={setSelectedAlgorithm}
            wasmStatus={wasmStatus}
            onRunSimulation={handleRunSimulation}
            isRunning={isSimulationRunning}
            isAiThinking={isAiThinking}
          />
        </div>
        <SimulationAnalysis
          isLoading={isAiThinking || isSimulationRunning}
          result={simulationResult}
          onPlayerBestMove={handlePlayBestMove}
        />

        <BenchmarkLab board={board} wasmStatus={wasmStatus} />
      </main>
    </div>
  );
}
