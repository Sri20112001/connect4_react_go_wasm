import type { HeaderProps } from './../types/types';

export default function Header({ wasmReady = false }: HeaderProps) {
  return (
    <header className="border-b border-zinc-800 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Connect 4 Lab</h1>

          <p className="mt-1 text-sm text-zinc-400">
            Monte Carlo Simulation Playground
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span
            className={`h-2 w-2 rounded-full ${
              wasmReady ? "bg-green-500" : "bg-yellow-500"
            }`}
          />

          <span className="text-zinc-300">WASM</span>

          <span className="text-zinc-500">•</span>

          <span className="text-zinc-400">Engine: Go</span>
        </div>
      </div>
    </header>
  );
}
