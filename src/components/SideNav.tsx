import { NavLink } from "react-router-dom";

export default function SideNav() {
  return (
    <aside className="w-52 xl:w-56 flex-shrink-0 bg-zinc-950/90 border-r border-zinc-800 flex flex-col p-3.5 hidden lg:flex z-30">
      {/* Brand Profile */}
      <div className="mb-6 px-1.5 mt-1">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-zinc-800/90 flex items-center justify-center border border-zinc-700 shadow-inner">
            <span className="material-symbols-outlined text-zinc-300 text-lg">science</span>
          </div>
          <div>
            <h2 className="font-headline font-bold text-zinc-100 text-sm leading-tight">Lab-04</h2>
            <p className="text-[11px] text-emerald-400 font-mono flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Engine Active
            </p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 font-label text-xs">
        <NavLink
          to="/connect4"
          className={({ isActive }) =>
            `flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium transition-all ${
              isActive
                ? "bg-zinc-900 text-zinc-100 shadow-sm border border-zinc-700/50 font-semibold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
            }`
          }
        >
          <span className="material-symbols-outlined text-zinc-400 text-lg">rocket_launch</span>
          Engine
        </NavLink>

        <NavLink
          to="/benchmark/connect4"
          className={({ isActive }) =>
            `flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium transition-all ${
              isActive
                ? "bg-zinc-900 text-zinc-100 shadow-sm border border-zinc-700/50 font-semibold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
            }`
          }
        >
          <span className="material-symbols-outlined text-zinc-400 text-lg">account_tree</span>
          Algorithms
        </NavLink>

        <button
          type="button"
          disabled
          className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-zinc-500 opacity-60 cursor-not-allowed text-left"
        >
          <span className="material-symbols-outlined text-zinc-500 text-lg">database</span>
          Datasets
        </button>

        <button
          type="button"
          disabled
          className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-zinc-500 opacity-60 cursor-not-allowed text-left"
        >
          <span className="material-symbols-outlined text-zinc-500 text-lg">psychology</span>
          Neural Nets
        </button>

        <button
          type="button"
          disabled
          className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-zinc-500 opacity-60 cursor-not-allowed text-left"
        >
          <span className="material-symbols-outlined text-zinc-500 text-lg">terminal</span>
          Logs
        </button>
      </nav>

      {/* Footer Navigation */}
      <div className="mt-auto space-y-1 pt-3 border-t border-zinc-800/80 font-label text-xs">
        <button
          type="button"
          className="w-full flex items-center gap-2.5 rounded-lg px-3 py-1.5 font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 transition-colors text-left"
        >
          <span className="material-symbols-outlined text-zinc-400 text-lg">help</span>
          Docs
        </button>
        <button
          type="button"
          className="w-full flex items-center gap-2.5 rounded-lg px-3 py-1.5 font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 transition-colors text-left"
        >
          <span className="material-symbols-outlined text-zinc-400 text-lg">contact_support</span>
          Support
        </button>

        <button
          type="button"
          className="w-full mt-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-headline font-semibold py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm text-xs"
        >
          Deploy Model
          <span className="material-symbols-outlined text-sm">rocket</span>
        </button>
      </div>
    </aside>
  );
}
