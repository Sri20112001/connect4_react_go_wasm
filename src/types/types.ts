export interface HeaderProps {
    wasmReady?: boolean;
    wasmStatus?: WasmStatus;
}

export type Player = "red" | "yellow" | null;

export type Board = Player[][];

export interface ConnectBoardProps {
  board: Board;
  currentPlayer: Player;
  isThinking?: boolean;
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
export type Algorithm = "monte-carlo" | "mcts";

export type WasmStatus = "idle" | "loading" | "ready" | "error";

export interface AIEngineProps {
  selectedEngine: Engine;
  onEngineChange: (engine: Engine) => void;
  selectedAlgorithm: Algorithm;
  onAlgorithmChange: (algorithm: Algorithm) => void;
  wasmStatus: WasmStatus;
  isRunning?: boolean;
  isAiThinking?: boolean;
  onRunSimulation: (
    engine: Engine,
    algorithm: Algorithm,
    simulations: number,
  ) => void;
}