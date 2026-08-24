import { useState } from "react";
import type { AIEngineProps, Algorithm } from "../../../types/types";

export default function AIEngine({
  selectedEngine,
  onEngineChange,
  selectedAlgorithm,
  onAlgorithmChange,
  wasmStatus,
  isRunning = false,
  isAiThinking = false,
  onRunSimulation,
}: AIEngineProps) {
  const [simulations, setSimulations] = useState(100000);

  const handleRunSimulation = () => {
    if (isRunning || isAiThinking) return;
    onRunSimulation(selectedEngine, selectedAlgorithm, simulations);
  };

  const isBusy = isRunning || isAiThinking;

  const wasmLabel =
    wasmStatus === "ready"
      ? "✓ Ready"
      : wasmStatus === "loading" || wasmStatus === "idle"
        ? "⏳ Loading..."
        : "⚠ Failed to load";

  const isWasmError = wasmStatus === "error";
  const isWasmLoading = wasmStatus === "loading" || wasmStatus === "idle";

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-white">AI Engine</h2>

        <p className="mt-1 text-xs text-zinc-500">Configure the simulation engine.</p>
      </div>

      {/* Engine */}
      <div className="mb-4">
        <label className="mb-2 block text-sm text-zinc-400">Engine</label>

        <select
          value={selectedEngine}
          disabled={isBusy}
          onChange={(event) => onEngineChange(event.target.value as typeof selectedEngine)}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500 disabled:opacity-50"
        >
          <option value="wasm">Go / WebAssembly</option>
          <option value="javascript">JavaScript</option>
        </select>

        <div className="mt-2 space-y-1 text-xs">
          <div className="flex items-center justify-between text-zinc-500">
            <span>JavaScript Engine</span>
            <span className="text-green-400">✓ Ready</span>
          </div>

          <div className="flex items-center justify-between">
            <span className={isWasmError ? "text-red-400" : "text-zinc-500"}>Go WASM Engine</span>
            <span
              className={
                wasmStatus === "ready"
                  ? "text-green-400"
                  : isWasmError
                    ? "text-red-400"
                    : "text-yellow-400"
              }
            >
              {wasmLabel}
            </span>
          </div>
        </div>

        {isWasmError && selectedEngine === "wasm" && (
          <p className="mt-2 text-xs text-red-400">WASM failed to initialize — falling back may be required.</p>
        )}

        {isWasmLoading && selectedEngine === "wasm" && (
          <p className="mt-2 text-xs text-yellow-400">WASM is loading — first move may take a moment.</p>
        )}
      </div>

      {/* Algorithm */}
      <div className="mb-4">
        <label className="mb-2 block text-sm text-zinc-400">Algorithm</label>

        <select
          value={selectedAlgorithm}
          disabled={isBusy}
          onChange={(event) => onAlgorithmChange(event.target.value as Algorithm)}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500 disabled:opacity-50"
        >
          <option value="monte-carlo">Monte Carlo</option>
          <option value="mcts">MCTS (UCT)</option>
        </select>
        <p className="mt-1 text-xs text-zinc-500">
          {selectedAlgorithm === "mcts" ? "Tree search with UCT selection" : "Flat Monte Carlo with heuristic rollout"}
        </p>
      </div>

      {/* Simulations */}
      <div className="mb-4">
        <label className="mb-2 block text-sm text-zinc-400">Simulations</label>

        <input
          type="number"
          min={1000}
          step={1000}
          value={simulations}
          disabled={isBusy}
          onChange={(event) => setSimulations(Number(event.target.value))}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500 disabled:opacity-50"
        />
      </div>

      {/* Status */}
      {isBusy && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-2 text-xs text-zinc-300">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
          {isRunning ? "Running simulation…" : "AI is thinking…"}
        </div>
      )}

      {/* Run */}
      <button
        type="button"
        onClick={handleRunSimulation}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-50"
        disabled={(isWasmError && selectedEngine === "wasm") || isBusy}
      >
        {isRunning && <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-950" />}
        {isRunning ? "Running…" : isAiThinking ? "AI Thinking…" : "Run Simulation"}
      </button>
    </div>
  );
}
