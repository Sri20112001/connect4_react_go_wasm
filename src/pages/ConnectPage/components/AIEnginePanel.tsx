import { useState } from "react";
import type { AIEngineProps, Algorithm, Engine } from "../../../types/types";

export default function AIEngine({ onRunSimulation }: AIEngineProps) {
  const [engine, setEngine] = useState<Engine>("javascript");
  const [algorithm, setAlgorithm] = useState<Algorithm>("monte-carlo");
  const [simulations, setSimulations] = useState(100000);

  const handleRunSimulation = () => {
    onRunSimulation(engine, algorithm, simulations);
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">AI Engine</h2>

        <p className="mt-1 text-sm text-zinc-500">
          Configure the simulation engine.
        </p>
      </div>

      {/* Engine */}
      <div className="mb-5">
        <label className="mb-2 block text-sm text-zinc-400">Engine</label>

        <select
          value={engine}
          onChange={(event) => setEngine(event.target.value as Engine)}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
        >
          <option value="wasm">Go / WebAssembly</option>
          <option value="javascript">JavaScript</option>
        </select>
      </div>

      {/* Algorithm */}
      <div className="mb-5">
        <label className="mb-2 block text-sm text-zinc-400">Algorithm</label>

        <select
          value={algorithm}
          onChange={(event) => setAlgorithm(event.target.value as Algorithm)}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
        >
          <option value="monte-carlo">Monte Carlo</option>
        </select>
      </div>

      {/* Simulations */}
      <div className="mb-6">
        <label className="mb-2 block text-sm text-zinc-400">Simulations</label>

        <input
          type="number"
          min={1000}
          step={1000}
          value={simulations}
          onChange={(event) => setSimulations(Number(event.target.value))}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
        />
      </div>

      {/* Run */}
      <button
        type="button"
        onClick={handleRunSimulation}
        className="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
      >
        Run Simulation
      </button>
    </div>
  );
}
