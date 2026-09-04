import type { AIEngineProps } from "../../../types/types";
import { clampSimulations, DEFAULT_SIMULATIONS, MAX_SIMULATIONS, MIN_SIMULATIONS } from "../../../utilities/CONSTANTS";

export default function AIEnginePanel({
  selectedEngine,
  onEngineChange,
  selectedAlgorithm,
  onAlgorithmChange,
  wasmStatus,
  isRunning = false,
  isAiThinking = false,
  onRunSimulation,
  simulations: simulationsProp,
  onSimulationsChange,
}: AIEngineProps) {
  const simulations = simulationsProp ?? DEFAULT_SIMULATIONS;
  const setSimulations = (n: number) => {
    const v = clampSimulations(n);
    onSimulationsChange?.(v);
  };

  const isBusy = isRunning || isAiThinking;

  const handleRunSimulation = () => {
    if (isBusy) return;
    onRunSimulation(selectedEngine, selectedAlgorithm, clampSimulations(simulations));
  };

  const isWasmReady = wasmStatus === "ready";
  const isWasmError = wasmStatus === "error";
  const usingFallback = isWasmError && selectedEngine === "wasm";

  return (
    <div className="glass-panel rounded-xl p-3.5 sm:p-4 flex flex-col justify-between">
      {/* Panel Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-headline font-semibold text-xs sm:text-sm flex items-center gap-1.5 text-zinc-100 uppercase tracking-wide">
          <span className="material-symbols-outlined text-zinc-400 text-[17px]">tune</span>
          Engine Configuration
        </h3>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
          {selectedEngine === "wasm" ? "WASM 64-bit" : "V8 JIT"}
        </span>
      </div>

      <div className="space-y-3">
        {/* Algorithm Selection */}
        <div>
          <label className="block text-[11px] font-label font-medium text-zinc-400 mb-1.5">
            Algorithm
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isBusy}
              onClick={() => onAlgorithmChange("monte-carlo")}
              className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                selectedAlgorithm === "monte-carlo"
                  ? "bg-zinc-700 border border-zinc-500 text-zinc-100 ring-1 ring-zinc-500 shadow-[0_0_12px_rgba(255,255,255,0.06)]"
                  : "bg-zinc-800/80 border border-zinc-700/80 hover:bg-zinc-700/70 text-zinc-400"
              } disabled:opacity-50`}
            >
              Monte Carlo
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => onAlgorithmChange("mcts")}
              className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                selectedAlgorithm === "mcts"
                  ? "bg-zinc-700 border border-zinc-500 text-zinc-100 ring-1 ring-zinc-500 shadow-[0_0_12px_rgba(255,255,255,0.06)]"
                  : "bg-zinc-800/80 border border-zinc-700/80 hover:bg-zinc-700/70 text-zinc-400"
              } disabled:opacity-50`}
            >
              MCTS (UCT)
            </button>
          </div>
        </div>

        {/* Execution Environment */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-[11px] font-label font-medium text-zinc-400">
              Execution Environment
            </label>
            <span
              className={`text-[10px] font-mono ${
                isWasmReady
                  ? "text-emerald-400"
                  : isWasmError
                    ? "text-red-400"
                    : "text-yellow-400"
              }`}
            >
              {isWasmReady
                ? "● Ready"
                : isWasmError
                  ? "● Error"
                  : "● Loading..."}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isBusy}
              onClick={() => onEngineChange("javascript")}
              className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                selectedEngine === "javascript"
                  ? "bg-zinc-700 border border-zinc-500 text-zinc-100 ring-1 ring-zinc-500 shadow-[0_0_12px_rgba(255,255,255,0.06)]"
                  : "bg-zinc-800/80 border border-zinc-700/80 hover:bg-zinc-700/70 text-zinc-400"
              } disabled:opacity-50`}
            >
              <span className="material-symbols-outlined text-[15px]">javascript</span>
              JS
            </button>

            <button
              type="button"
              disabled={isBusy}
              onClick={() => onEngineChange("wasm")}
              className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                selectedEngine === "wasm"
                  ? "bg-zinc-700 border border-zinc-500 text-zinc-100 ring-1 ring-zinc-500 shadow-[0_0_12px_rgba(255,255,255,0.06)]"
                  : "bg-zinc-800/80 border border-zinc-700/80 hover:bg-zinc-700/70 text-zinc-400"
              } disabled:opacity-50`}
            >
              <span className="material-symbols-outlined text-[15px]">integration_instructions</span>
              Go WASM
            </button>
          </div>

          {usingFallback && (
            <p className="mt-1 text-[10px] text-yellow-400 font-mono">
              Using JavaScript fallback.
            </p>
          )}
        </div>

        {/* Monte Carlo Simulations */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-[11px] font-label font-medium text-zinc-400">
              Simulations
            </label>
            <span className="text-[10px] font-mono text-zinc-500">
              Max: 100k
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="range"
              min={MIN_SIMULATIONS}
              max={MAX_SIMULATIONS}
              step={1000}
              value={simulations}
              disabled={isBusy}
              onChange={(e) => setSimulations(clampSimulations(Number(e.target.value)))}
              className="h-1 flex-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-300 disabled:opacity-50"
            />
            <input
              type="number"
              min={MIN_SIMULATIONS}
              max={MAX_SIMULATIONS}
              step={1000}
              value={simulations}
              disabled={isBusy}
              onChange={(e) => setSimulations(clampSimulations(Number(e.target.value)))}
              className="w-20 bg-zinc-900 border border-zinc-700/80 rounded py-1 px-2 text-zinc-100 font-mono text-xs text-right focus:border-zinc-500 outline-none"
            />
          </div>
        </div>

      </div>

      {/* Action Button */}
      <div className="mt-3.5 pt-2.5 border-t border-zinc-800/80">
        <button
          type="button"
          onClick={handleRunSimulation}
          disabled={isBusy}
          className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-headline font-bold py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.08)] hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] disabled:opacity-50 disabled:cursor-not-allowed text-xs"
        >
          {isRunning ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-800 border-t-zinc-400" />
              <span>Simulating...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[17px]">terminal</span>
              <span>Run Simulation</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
