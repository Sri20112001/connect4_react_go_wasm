export interface HeaderProps {
    wasmReady?: boolean;
}

export type Player = "red" | "yellow" | null;

export type Board = Player[][];

export interface ConnectBoardProps {
  board: Board;
  currentPlayer: Player;
  onColumnClick: (column: number) => void;
}

export interface GameState {
  board: Board;
  currentPlayer: Player;
  winner: Player;
  isDraw: boolean;
  redConnects: number;
  yellowConnects: number;
}

export type Engine = "javascript" | "wasm";
export type Algorithm = "monte-carlo";

export interface AIEngineProps {
  onRunSimulation: (
    engine: Engine,
    algorithm: Algorithm,
    simulations: number,
  ) => void;
}