import Header from "./components/Header";
import runMonteCarlo from "./engine/javascript/monteCarlo";
import AIEngine from "./pages/ConnectPage/components/AIEnginePanel";
import ConnectBoard from "./pages/ConnectPage/components/ConnectBoard";
import type {Algorithm, Engine} from "./types/types";
import {useConnect4} from "./utilities/hooks/useConnect4";

export default function App() {
    const {board, currentPlayer, winner, isDraw, dropPiece, resetGame} = useConnect4();

    const handleRunSimulation = (engine: Engine, algorithm: Algorithm, simulations: number) => {
        console.log({
            engine,
            algorithm,
            simulations,
        });
    };

    return (
        <div className="min-h-screen bg-zinc-950">
            <Header wasmReady={false} />
            <button
                className="text-white"
                onClick={() => {
                    const start = performance.now();

                    const result = runMonteCarlo(board, {
                        simulationsPerMove: 1000,
                        player: "yellow",
                    });

                    const end = performance.now();

                    console.log("Monte Carlo Result:", result);

                    console.log(`Execution time: ${(end - start).toFixed(2)}ms`);

                    console.log(
                        `Simulations/sec: ${((10000 * result.results.length) / ((end - start) / 1000)).toFixed(2)}`
                    );

                    console.table(result.results);
                }}
            >
                Test Monte Carlo
            </button>
            <main className="mx-auto max-w-6xl p-6">
                <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                    <div>
                        <ConnectBoard
                            board={board}
                            currentPlayer={currentPlayer}
                            onColumnClick={(n) => {
                                console.log("n", n);
                                dropPiece(n);
                            }}
                        />

                        <div className="mt-4 flex justify-center">
                            <button
                                type="button"
                                onClick={resetGame}
                                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
                            >
                                New Game
                            </button>
                        </div>
                    </div>

                    <AIEngine onRunSimulation={handleRunSimulation} />
                </div>
                <div className="mt-4 text-center">
                    {winner && (
                        <p className="text-lg font-semibold text-green-400">
                            {winner === "red" ? "Player" : "AI"} wins!
                        </p>
                    )}

                    {!winner && isDraw && <p className="text-lg font-semibold text-yellow-400">It's a draw!</p>}

                    {!winner && !isDraw && (
                        <p className="text-sm text-zinc-400">
                            {currentPlayer === "red" ? "Player's turn" : "AI's turn"}
                        </p>
                    )}
                </div>
            </main>
        </div>
    );
}
