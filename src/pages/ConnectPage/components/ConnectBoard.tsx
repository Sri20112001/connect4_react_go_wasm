import type { ConnectBoardProps } from "../../../types/types";
import { useState } from "react";
import { PIECE_COLORS } from "../../../utilities/pieceColors";

export default function ConnectBoard({
  board,
  currentPlayer,
  isThinking = false,
  onColumnClick,
  winner = null,
  isDraw = false,
  redConnects = 0,
  yellowConnects = 0,
  onReset,
  isLarge = false,
  showPanels = true,
  onTogglePanels,
  player1Color = "red",
  player2Color = "yellow",
  onOpenColorModal,
  lastMove,
  lastAIMove,
}: ConnectBoardProps) {
  const [hoverCol, setHoverCol] = useState<number | null>(null);
  const isGameOver = Boolean(winner || isDraw);

  const p1 = PIECE_COLORS[player1Color] || PIECE_COLORS.red;
  const p2 = PIECE_COLORS[player2Color] || PIECE_COLORS.yellow;

  const landingRow = (col: number): number | null => {
    for (let r = board.length - 1; r >= 0; r--) {
      if (board[r][col] === null) return r;
    }
    return null;
  };

  return (
    <div
      className={`glass-panel rounded-xl p-4 sm:p-5 h-full flex flex-col justify-between relative overflow-hidden min-h-0 transition-all duration-500 ease-out ${
        isLarge ? "shadow-[0_24px_64px_rgba(0,0,0,0.65)] ring-1 ring-white/6 sm:p-6 lg:p-7" : "sm:p-5 lg:p-6"
      }`}
    >
      {/* Status Bar */}
      <div className="flex justify-between items-center z-10 shrink-0 mb-3">
        {/* Player 1 (User) */}
        <button
          type="button"
          onClick={onOpenColorModal}
          title="Click to customize piece colors"
          className={`flex items-center gap-2.5 transition-opacity hover:opacity-100 group text-left ${currentPlayer === "red" && !isGameOver ? "opacity-100" : "opacity-60"}`}
        >
          <div className={`w-3.5 h-3.5 rounded-full chip ${p1.chipClass} group-hover:scale-110 transition-transform`} />
          <span className="font-headline font-semibold text-xs sm:text-sm text-zinc-100 group-hover:text-white">
            Player 1 ({p1.name})
          </span>
          <span className="text-xs font-mono text-zinc-400">({redConnects})</span>
        </button>

        {/* Center Game State Pill */}
        <div className="px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-700/80 text-xs font-medium flex items-center gap-2 shadow-sm">
          {winner ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-emerald-400 font-semibold font-mono">
                {winner === "red" ? `Player 1 (${p1.name}) Wins 🎉` : `AI (${p2.name}) Wins`}
              </span>
            </>
          ) : isDraw ? (
            <>
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
              <span className="text-yellow-400 font-semibold font-mono">Draw Game</span>
            </>
          ) : isThinking ? (
            <>
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-zinc-300 font-mono">AI Thinking...</span>
            </>
          ) : (
            <>
              <span className={`w-2 h-2 rounded-full ${currentPlayer === "red" ? p1.dotBgClass : p2.dotBgClass} animate-pulse`} />
              <span className="text-zinc-300 font-mono">
                {currentPlayer === "red" ? "Your Turn" : "AI's Turn"}
              </span>
            </>
          )}
        </div>

        {/* Player 2 (Computer / AI) */}
        <button
          type="button"
          onClick={onOpenColorModal}
          title="Click to customize piece colors"
          className={`flex items-center gap-2.5 transition-opacity hover:opacity-100 group text-right ${currentPlayer === "yellow" && !isGameOver ? "opacity-100" : "opacity-60"}`}
        >
          <span className="text-xs font-mono text-zinc-400">({yellowConnects})</span>
          <span className="font-headline font-semibold text-xs sm:text-sm text-zinc-100 group-hover:text-white">
            Player 2 ({p2.name})
          </span>
          <div className={`w-3.5 h-3.5 rounded-full chip ${p2.chipClass} group-hover:scale-110 transition-transform`} />
        </button>
      </div>

      {/* Connect 4 Board — always bigger, extra in focus mode */}
      <div className="flex-1 flex flex-col items-center justify-center z-10 min-h-0 my-auto">
        {/* Board Wrapper — bigger by default, even bigger in focus mode */}
        <div
          className={`bg-[#18181b] p-2.5 sm:p-3 rounded-xl border-4 shadow-[0_20px_50px_rgba(0,0,0,0.6)] w-full aspect-7/6 flex flex-col justify-between transition-all duration-500 ease-out relative overflow-hidden ${
            isLarge ? "max-w-155 sm:max-w-170 lg:max-w-205 xl:max-w-215 border-zinc-600 shadow-[0_28px_80px_rgba(0,0,0,0.7)] scale-[1.015]" : "max-w-130 sm:max-w-140 lg:max-w-155 xl:max-w-160 border-zinc-700"
          }`}
        >
          {/* Non-modal loader — thin top bar, does not block interaction */}
          {isThinking && (
            <div className="absolute top-0 inset-x-0 h-1 bg-yellow-400/20 pointer-events-none">
              <div className="h-full bg-yellow-400 animate-pulse w-full" style={{ animationDuration: "1s" }} />
            </div>
          )}
          <div className={`grid grid-cols-7 bg-zinc-800 p-2 rounded-lg h-full w-full transition-all duration-500 ${isLarge ? "gap-2 sm:gap-3 p-2.5" : "gap-2 sm:gap-2.5 p-2"}`}>
            {board.map((row, rowIndex) =>
              row.map((player, columnIndex) => {
                const lr = hoverCol !== null ? landingRow(hoverCol) : null;
                const isPreview =
                  !isThinking &&
                  !isGameOver &&
                  !player &&
                  lr === rowIndex &&
                  hoverCol === columnIndex &&
                  board[0][columnIndex] === null;
                const isLastAI =
                  !!lastAIMove &&
                  lastAIMove.player === "yellow" &&
                  lastAIMove.row === rowIndex &&
                  lastAIMove.column === columnIndex;
                const isLastMove = !!lastMove && lastMove.row === rowIndex && lastMove.column === columnIndex;

                return (
                  <div
                    key={`${rowIndex}-${columnIndex}`}
                    className={`flex aspect-square items-center justify-center rounded-full bg-zinc-950 shadow-inner relative ${isLastAI ? "ring-2 ring-yellow-400 ring-offset-1 ring-offset-zinc-900" : ""} ${
                      isLastMove && !isLastAI ? "ring-1 ring-white/20" : ""
                    }`}
                  >
                    {isLastAI && <span className="absolute inset-0 rounded-full bg-yellow-400/15 animate-pulse pointer-events-none" />}
                    {player ? (
                      <div
                        className={`w-full h-full rounded-full chip ${player === "red" ? p1.chipClass : p2.chipClass} ${isLastAI ? "shadow-[0_0_10px_rgba(250,204,21,0.7)]" : ""}`}
                      />
                    ) : isPreview ? (
                      <div
                        className={`w-full h-full rounded-full chip opacity-35 ring-2 ring-white/20 ${
                          currentPlayer === "red" ? p1.chipClass : p2.chipClass
                        }`}
                      />
                    ) : null}
                  </div>
                );
              }),
            )}
          </div>
        </div>

        {/* Column Selection Indicators (Arrows) */}
        <div className={`grid grid-cols-7 gap-1.5 sm:gap-2 mt-3 w-full px-1 shrink-0 transition-all duration-500 ${isLarge ? "max-w-155 sm:max-w-170 lg:max-w-205 xl:max-w-215 gap-2 sm:gap-3" : "max-w-130 sm:max-w-140 lg:max-w-155 xl:max-w-160"}`}>
          {Array.from({ length: 7 }, (_, column) => {
            const active = hoverCol === column && !isThinking && !isGameOver;
            const isColumnFull = board[0][column] !== null;

            return (
              <button
                key={column}
                type="button"
                disabled={isThinking || isGameOver || isColumnFull}
                onMouseEnter={() => setHoverCol(column)}
                onMouseLeave={() => setHoverCol(null)}
                onFocus={() => setHoverCol(column)}
                onBlur={() => setHoverCol(null)}
                onClick={() => {
                  if (isThinking || isGameOver || isColumnFull) return;
                  onColumnClick(column);
                }}
                className={`h-7 flex flex-col items-center justify-center rounded transition-all disabled:opacity-20 disabled:cursor-not-allowed group ${
                  active
                    ? "text-emerald-400 bg-zinc-800/80"
                    : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/40"
                }`}
                aria-label={`Drop in column ${column + 1}`}
              >
                <span
                  className={`material-symbols-outlined text-[17px] transition-transform ${
                    active ? "animate-bounce" : "group-hover:-translate-y-0.5"
                  }`}
                >
                  arrow_downward
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Game Control Row — inline focus toggle, not floating */}
      <div className="flex items-center justify-between z-10 shrink-0 pt-3 border-t border-zinc-800/60 mt-2 gap-2">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <span>Lab Board</span>
          <span>•</span>
          <span className="text-zinc-500">7×6 Grid</span>
        </div>

        <div className="flex items-center gap-2">
          {/* {onOpenColorModal && (
            <button
              type="button"
              onClick={onOpenColorModal}
              aria-label="Customize piece colors"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-[15px] text-zinc-400">palette</span>
              Colors
            </button>
          )} */}
          {onTogglePanels && (
            <button
              type="button"
              onClick={onTogglePanels}
              aria-label={showPanels ? "Hide configuration — focus mode" : "Show configuration"}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">{showPanels ? "visibility_off" : "visibility"}</span>
              {showPanels ? "Focus" : "Show Config"}
            </button>
          )}
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-medium text-xs transition-colors border border-zinc-700 flex items-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-[15px]">refresh</span>
              {isGameOver ? "Play Again" : "Reset Board"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
