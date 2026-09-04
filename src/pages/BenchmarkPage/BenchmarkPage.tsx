import BenchmarkLab from "./BenchmarkLab";
import createEmptyBoard from "../../utilities/createEmptyBoard";
import { useWasmStatus } from "../../engine/golang/useWasmStatus";

export default function BenchmarkPage() {
  const wasmStatus = useWasmStatus();
  // Standalone: uses empty board as "current" equivalent; parity boards cover controlled runs.
  const board = createEmptyBoard();

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h1 className="text-xl font-semibold text-white">Benchmark Lab</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Dedicated to controlled JS vs Go/WASM measurements — independent of game state. Uses parity boards P1–P8 and scaling workloads.
        </p>
      </div>
      <BenchmarkLab board={board} currentPlayer="red" wasmStatus={wasmStatus} />
    </main>
  );
}
