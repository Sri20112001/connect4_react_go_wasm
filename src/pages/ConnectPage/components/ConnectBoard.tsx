import type { ConnectBoardProps } from "../../../types/types";

export default function ConnectBoard({
  board,
  currentPlayer,
  onColumnClick,
}: ConnectBoardProps) {
  console.log("ConnectBoard board:", board);
  console.log("Current player:", currentPlayer);
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
              onClick={() => {
                console.log("BUTTON CLICKED:", column);
                onColumnClick(column);
              }}
              className="rounded-md py-1 text-sm text-zinc-500 transition hover:bg-zinc-800 hover:text-white"
            >
              {column + 1}
            </button>
          );
        })}
      </div>

      {/* Board */}
      <div className="rounded-lg bg-blue-700 p-2">
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
      </div>

      {/* Current player */}
      <div className="mt-5 flex justify-center">
        <div className="flex items-center gap-2 text-sm text-zinc-300">
          <span
            className={`h-3 w-3 rounded-full ${
              currentPlayer === "red" ? "bg-red-500" : "bg-yellow-400"
            }`}
          />

          {currentPlayer === "red" ? "Player's Turn" : "AI's Turn"}
        </div>
      </div>
    </div>
  );
}
