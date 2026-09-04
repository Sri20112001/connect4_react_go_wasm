import { useEffect, useState } from "react";
import ConnectBoard from "./components/ConnectBoard";
import AIEnginePanel from "./components/AIEnginePanel";
import SimulationAnalysis from "./components/SimulationAnalysis";
import PieceColorModal from "../../components/PieceColorModal";
import { useGameController } from "../../game/useGameController";
import {
  getStoredPieceColors,
  saveStoredPieceColors,
  type PieceColorId,
} from "../../utilities/pieceColors";

export default function ConnectPage() {
  const game = useGameController({ engine: "javascript", algorithm: "monte-carlo" });
  const [showPanels, setShowPanels] = useState(true);
  const [pieceColors, setPieceColors] = useState(() => getStoredPieceColors());
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const [isAIModalDismissed, setIsAIModalDismissed] = useState(false);

  useEffect(() => {
    if (game.winner !== "yellow" && isAIModalDismissed) setIsAIModalDismissed(false);
  }, [game.winner, isAIModalDismissed]);

  const handleSelectPlayer1Color = (color: PieceColorId) => {
    setPieceColors((prev) => {
      const next = { ...prev, player1: color };
      saveStoredPieceColors(next.player1, next.player2);
      return next;
    });
  };

  const handleSelectPlayer2Color = (color: PieceColorId) => {
    setPieceColors((prev) => {
      const next = { ...prev, player2: color };
      saveStoredPieceColors(next.player1, next.player2);
      return next;
    });
  };

  const handleApplyPreset = (p1: PieceColorId, p2: PieceColorId) => {
    setPieceColors({ player1: p1, player2: p2 });
    saveStoredPieceColors(p1, p2);
  };

  const handleResetDefault = () => {
    setPieceColors({ player1: "red", player2: "yellow" });
    saveStoredPieceColors("red", "yellow");
  };

  return (
    <div className="flex-1 min-h-0 flex overflow-hidden">
      {/* Main Content Area */}
      <main className="flex-1 min-h-0 px-3 sm:px-5 py-3 flex flex-col overflow-y-auto lg:overflow-hidden">
        {/* Responsive Bento Grid — board smoothly grows when panels hidden (focus mode) */}
        <div className={`grid grid-cols-1 gap-3.5 flex-1 min-h-0 transition-all duration-500 ease-out ${showPanels ? "lg:grid-cols-12" : "lg:grid-cols-1"}`}>
          {/* Left Column: Connect 4 Board & Match Status */}
          <div className={`${showPanels ? "lg:col-span-7 xl:col-span-8" : ""} flex flex-col min-h-0 h-full order-1 transition-all duration-500 ease-out`}>
            <ConnectBoard
              board={game.board}
              currentPlayer={game.currentPlayer}
              isThinking={game.isAiThinking || game.isSimulationRunning}
              onColumnClick={game.playColumn}
              winner={game.winner}
              isDraw={game.isDraw}
              redConnects={game.redConnects}
              yellowConnects={game.yellowConnects}
              onReset={game.reset}
              isLarge={!showPanels}
              showPanels={showPanels}
              onTogglePanels={() => setShowPanels((v) => !v)}
              player1Color={pieceColors.player1}
              player2Color={pieceColors.player2}
              onOpenColorModal={() => setIsColorModalOpen(true)}
              lastMove={game.lastMove}
              lastAIMove={game.lastAIMove}
            />
          </div>

          {/* Right Column: Engine Config & Simulation Analysis — smooth collapse */}
          {
            showPanels && (
                        <div
            className={`flex flex-col gap-3 min-h-0 h-full order-2 transition-all duration-500 ease-out ${
              showPanels ? "lg:col-span-5 xl:col-span-4 opacity-100 translate-x-0 overflow-y-auto pr-1" : "lg:col-span-0 opacity-0 -translate-x-4 pointer-events-none max-h-0 lg:max-h-0 overflow-hidden"
            }`}
            aria-hidden={!showPanels}
          >
            <AIEnginePanel
              selectedEngine={game.selectedEngine}
              onEngineChange={game.setEngine}
              selectedAlgorithm={game.selectedAlgorithm}
              onAlgorithmChange={game.setAlgorithm}
              wasmStatus={game.wasmStatus}
              onRunSimulation={game.runSimulation}
              isRunning={game.isSimulationRunning}
              isAiThinking={game.isAiThinking}
              simulations={game.simulations}
              onSimulationsChange={game.setSimulations}
            />

            <SimulationAnalysis
              isLoading={game.isAiThinking || game.isSimulationRunning}
              result={game.simulationResult}
              onPlayerBestMove={game.playBestMove}
            />
          </div>
            )
          }

        </div>

        {/* Focus mode hint */}
        {!showPanels && (
          <p className="mt-3 text-center text-xs text-zinc-500 animate-in fade-in">Focus mode — board enlarged. Click the eye icon on the board to restore panels.</p>
        )}
      </main>

      {/* AI Won Modal — shown when AI (yellow) wins */}
      {game.winner === "yellow" && !isAIModalDismissed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm" onClick={() => setIsAIModalDismissed(true)} aria-hidden />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="AI won"
            className="relative w-full max-w-sm rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.6)] animate-in fade-in zoom-in-95"
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400/15 border border-yellow-400/30">
              <span className="material-symbols-outlined text-yellow-400 text-[28px]">smart_toy</span>
            </div>
            <h2 className="text-center text-lg font-bold tracking-tight text-white">AI Wins!</h2>
            <p className="mt-1 text-center text-sm text-zinc-400">
              The AI connected four. Better luck next time.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setIsAIModalDismissed(true)}
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAIModalDismissed(true);
                  game.reset();
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-200 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Piece Color Scheme Modal */}
      <PieceColorModal
        isOpen={isColorModalOpen}
        onClose={() => setIsColorModalOpen(false)}
        player1Color={pieceColors.player1}
        player2Color={pieceColors.player2}
        onSelectPlayer1Color={handleSelectPlayer1Color}
        onSelectPlayer2Color={handleSelectPlayer2Color}
        onApplyPreset={handleApplyPreset}
        onResetDefault={handleResetDefault}
      />
    </div>
  );
}
