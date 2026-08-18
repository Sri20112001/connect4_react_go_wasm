import { useEffect, useState } from "react";
import Header from "./components/Header";
import runMonteCarlo from "./engine/javascript/monteCarlo";
import AIEngine from "./pages/ConnectPage/components/AIEnginePanel";
import ConnectBoard from "./pages/ConnectPage/components/ConnectBoard";
import type { Algorithm, Engine } from "./types/types";
import { useConnect4 } from "./utilities/hooks/useConnect4";
import type { MonteCarloResult } from "./engine/types";
import SimulationAnalysis from "./pages/ConnectPage/components/SimulationAnalysis";

export default function App() {
  const [simulationResult, setSimulationResult] =
    useState<MonteCarloResult | null>(null);

  const { board, currentPlayer, winner, isDraw, redConnects, yellowConnects, dropPiece, resetGame } =
    useConnect4();

  const isAiThinking = currentPlayer === "yellow" && winner === null && !isDraw;

  useEffect(() => {
    if (!isAiThinking) {
      return;
    }

    const timer = window.setTimeout(() => {
      const result = runMonteCarlo(board, {
        simulationsPerMove: 1000,
        player: "yellow",
      });

      setSimulationResult(result);

      if (result.bestMove !== -1) {
        dropPiece(result.bestMove);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isAiThinking, board, dropPiece]);

  const handleRunSimulation = (
    engine: Engine,
    algorithm: Algorithm,
    simulations: number,
  ) => {

    if (engine !== "javascript") {
      return;
    }

    if (algorithm !== "monte-carlo") {
      return;
    }

    const result = runMonteCarlo(board, {
      simulationsPerMove: simulations,
      player: "yellow",
    });
    
    setSimulationResult(result);
  };

  const handlePlayBestMove = () => {
    if (!simulationResult) {
      return;
    }

    if (simulationResult.bestMove === -1) {
      return;
    }

    dropPiece(simulationResult.bestMove);
  };
  

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header wasmReady={false} />
      <main className="mx-auto max-w-6xl p-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div>
            <ConnectBoard
              board={board}
              currentPlayer={currentPlayer}
              onColumnClick={(n) => {
                console.log("n", n);
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
                <p className="text-lg font-semibold text-yellow-400">
                  It's a draw!
                </p>
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

          <AIEngine onRunSimulation={handleRunSimulation} />
        </div>
        <SimulationAnalysis
          isLoading={isAiThinking}
          result={simulationResult}
          onPlayerBestMove={handlePlayBestMove}
        />
      </main>
    </div>
  );
}
