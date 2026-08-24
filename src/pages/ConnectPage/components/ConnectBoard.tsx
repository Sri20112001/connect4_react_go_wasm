import type { ConnectBoardProps } from "../../../types/types";

export default function ConnectBoard({
  board,
  currentPlayer,
  isThinking = false,
  onColumnClick,
}: ConnectBoardProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="mb-5 text-center">
        <h2 className="text-lg font-semibold text-white">Connect 4</h2>

        <p className="mt-1 text-sm text-zinc-500">Monte Carlo Playground</p>
      </div>

      {/* Column controls */}
      <div className="mb-2 grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }, (_, column) => {
          return (
            <button
              key={column}
              type="button"
              disabled={isThinking}
              onClick={() => {
                if (isThinking) return;
                onColumnClick(column);
              }}
              className="rounded-md py-1 text-sm text-zinc-500 transition hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              aria-label={`Drop in column ${column + 1}`}
            >
              {column + 1}
            </button>
          );
        })}
      </div>

      {/* Board */}
      <div className="relative rounded-lg bg-blue-700 p-2">
        <div className="grid grid-cols-7 gap-2">
          {board.map((row, rowIndex) =>
            row.map((player, columnIndex) => (
              <div
                key={`${rowIndex}-${columnIndex}`}
                className="flex aspect-square items-center justify-center rounded-full bg-zinc-950"
              >
                {player && (
                  <div
                    className={`h-[80%] w-[80%] rounded-full ${
                      player === "red" ? "bg-red-500" : "bg-yellow-400"
                    }`}
                  />
                )}
              </div>
            )),
          )}
        </div>

        {isThinking && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg bg-zinc-950/70 backdrop-blur-[1px]">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
            <span className="text-sm font-medium text-white">AI is thinking…</span>
            <span className="text-xs text-zinc-400">You’ll be able to play right after</span>
          </div>
        )}
      </div>

      {/* Current player */}
      <div className="mt-5 flex justify-center">
        <div className="flex items-center gap-2 text-sm text-zinc-300">
          <span
            className={`h-3 w-3 rounded-full ${currentPlayer === "red" ? "bg-red-500" : "bg-yellow-400"} ${isThinking ? "animate-pulse" : ""}`}
          />

          {isThinking ? "AI is thinking…" : currentPlayer === "red" ? "Player's Turn" : "AI's Turn"}
        </div>
      </div>
    </div>
  );
}
