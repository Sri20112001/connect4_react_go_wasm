import { useEffect } from "react";
import {
  COLOR_LIST,
  COLOR_PRESETS,
  PIECE_COLORS,
  type PieceColorId,
} from "../utilities/pieceColors";

interface PieceColorModalProps {
  isOpen: boolean;
  onClose: () => void;
  player1Color: PieceColorId;
  player2Color: PieceColorId;
  onSelectPlayer1Color: (color: PieceColorId) => void;
  onSelectPlayer2Color: (color: PieceColorId) => void;
  onApplyPreset: (p1: PieceColorId, p2: PieceColorId) => void;
  onResetDefault: () => void;
}

export default function PieceColorModal({
  isOpen,
  onClose,
  player1Color,
  player2Color,
  onSelectPlayer1Color,
  onSelectPlayer2Color,
  onApplyPreset,
  onResetDefault,
}: PieceColorModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const p1 = PIECE_COLORS[player1Color] || PIECE_COLORS.red;
  const p2 = PIECE_COLORS[player2Color] || PIECE_COLORS.yellow;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="color-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="glass-panel w-full max-w-lg rounded-2xl p-5 sm:p-6 border border-zinc-700/80 shadow-2xl relative space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-800/80 pb-3">
          <div>
            <h3
              id="color-modal-title"
              className="font-headline text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-zinc-400 text-xl">palette</span>
              Piece Color Scheme
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5 font-body">
              Customize disc colors for both the User and Computer AI.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close color scheme modal"
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800/80 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Quick Presets */}
        <div>
          <label className="block text-[11px] font-label font-medium uppercase tracking-wider text-zinc-400 mb-2">
            Quick Presets
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {COLOR_PRESETS.map((preset) => {
              const isActive =
                player1Color === preset.player1 && player2Color === preset.player2;
              const c1 = PIECE_COLORS[preset.player1];
              const c2 = PIECE_COLORS[preset.player2];

              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onApplyPreset(preset.player1, preset.player2)}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border text-xs font-medium transition-all ${
                    isActive
                      ? "bg-zinc-800/90 border-zinc-500 text-white shadow-md ring-1 ring-zinc-500"
                      : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`w-3 h-3 rounded-full chip ${c1.chipClass}`} />
                    <span className="text-[10px] text-zinc-500">vs</span>
                    <span className={`w-3 h-3 rounded-full chip ${c2.chipClass}`} />
                  </div>
                  <span className="text-[11px] font-label font-medium truncate w-full text-center">
                    {preset.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Player 1 (User) Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-3.5 h-3.5 rounded-full chip ${p1.chipClass}`} />
              <span className="text-xs font-headline font-semibold text-zinc-200">
                Player 1 (User)
              </span>
            </div>
            <span className="text-xs font-mono font-medium text-zinc-400">
              {p1.name}
            </span>
          </div>

          <div className="grid grid-cols-8 gap-2 bg-zinc-900/70 p-2.5 rounded-xl border border-zinc-800">
            {COLOR_LIST.map((color) => {
              const isSelected = player1Color === color.id;
              const isOtherPlayer = player2Color === color.id;

              return (
                <button
                  key={color.id}
                  type="button"
                  title={`${color.name}${isOtherPlayer ? " (used by AI)" : ""}`}
                  onClick={() => onSelectPlayer1Color(color.id)}
                  className={`relative flex items-center justify-center aspect-square rounded-full transition-transform hover:scale-110 focus:outline-none ${
                    isSelected
                      ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-950 scale-105"
                      : "opacity-85 hover:opacity-100"
                  }`}
                >
                  <div className={`w-full h-full rounded-full chip ${color.chipClass}`} />
                  {isSelected && (
                    <span className="material-symbols-outlined absolute text-white text-[14px] drop-shadow-md">
                      check
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Player 2 (Computer / AI) Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-3.5 h-3.5 rounded-full chip ${p2.chipClass}`} />
              <span className="text-xs font-headline font-semibold text-zinc-200">
                Player 2 (Computer AI)
              </span>
            </div>
            <span className="text-xs font-mono font-medium text-zinc-400">
              {p2.name}
            </span>
          </div>

          <div className="grid grid-cols-8 gap-2 bg-zinc-900/70 p-2.5 rounded-xl border border-zinc-800">
            {COLOR_LIST.map((color) => {
              const isSelected = player2Color === color.id;
              const isOtherPlayer = player1Color === color.id;

              return (
                <button
                  key={color.id}
                  type="button"
                  title={`${color.name}${isOtherPlayer ? " (used by Player 1)" : ""}`}
                  onClick={() => onSelectPlayer2Color(color.id)}
                  className={`relative flex items-center justify-center aspect-square rounded-full transition-transform hover:scale-110 focus:outline-none ${
                    isSelected
                      ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-950 scale-105"
                      : "opacity-85 hover:opacity-100"
                  }`}
                >
                  <div className={`w-full h-full rounded-full chip ${color.chipClass}`} />
                  {isSelected && (
                    <span className="material-symbols-outlined absolute text-white text-[14px] drop-shadow-md">
                      check
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Slot Preview */}
        <div className="bg-zinc-950/80 rounded-xl p-3 border border-zinc-800 flex items-center justify-between">
          <span className="text-xs font-label font-medium text-zinc-400">
            Live Preview
          </span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-zinc-900 p-0.5 shadow-inner border border-zinc-800 flex items-center justify-center">
                <div className={`w-full h-full rounded-full chip ${p1.chipClass}`} />
              </div>
              <span className="text-xs font-mono text-zinc-300">User</span>
            </div>

            <span className="text-zinc-600 text-xs">VS</span>

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-zinc-900 p-0.5 shadow-inner border border-zinc-800 flex items-center justify-center">
                <div className={`w-full h-full rounded-full chip ${p2.chipClass}`} />
              </div>
              <span className="text-xs font-mono text-zinc-300">AI</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
          <button
            type="button"
            onClick={onResetDefault}
            className="text-xs font-medium text-zinc-400 hover:text-zinc-200 py-1.5 px-3 rounded-lg hover:bg-zinc-800/60 transition-colors"
          >
            Reset to Default
          </button>

          <button
            type="button"
            onClick={onClose}
            className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-headline font-bold text-xs py-2 px-4 rounded-lg transition-colors shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
