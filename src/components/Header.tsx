import { NavLink } from "react-router-dom";
import type { HeaderProps } from "./../types/types";

export default function Header({ wasmReady = false, wasmStatus }: HeaderProps) {
  const status = wasmStatus ?? (wasmReady ? "ready" : "loading");

  const dotClass =
    status === "ready"
      ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse"
      : status === "error"
        ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
        : "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)] animate-pulse";

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3.5 py-1 text-xs font-label font-medium transition-all ${
      isActive
        ? "bg-zinc-100 text-zinc-950 font-semibold rounded-full shadow-sm"
        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 rounded-full"
    }`;

  return (
    <nav className="h-14 flex-shrink-0 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md px-5 flex items-center justify-between z-50">
      <div className="flex items-center gap-6 min-w-0">
        <h1 className="text-lg font-headline font-black text-zinc-100 uppercase tracking-wider whitespace-nowrap">
          Connect 4 <span className="text-zinc-400 font-semibold">AI Lab</span>
        </h1>

        <div className="hidden md:flex items-center gap-1.5" aria-label="Primary">
          <NavLink to="/connect4" className={linkClass}>
            Game
          </NavLink>
          <NavLink to="/benchmark/connect4" className={linkClass}>
            Benchmark
          </NavLink>
        </div>
      </div>

      <div className="flex items-center gap-3.5">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-800">
          <span className={`w-2 h-2 rounded-full ${dotClass}`} aria-hidden />
          <span className="text-xs font-mono text-zinc-300">
            {status === "ready"
              ? "WASM Active"
              : status === "error"
                ? "WASM Error"
                : "WASM Loading"}
          </span>
        </div>

        {/* <div className="hidden sm:flex items-center gap-1 text-zinc-500">
          <button
            type="button"
            title="Memory metrics"
            className="p-1.5 rounded-full hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">memory</span>
          </button>
          <button
            type="button"
            title="Telemetry"
            className="p-1.5 rounded-full hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">sensors</span>
          </button>
          <button
            type="button"
            title="Settings"
            className="p-1.5 rounded-full hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">settings</span>
          </button>
        </div> */}
      </div>
    </nav>
  );
}
