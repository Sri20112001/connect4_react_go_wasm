export interface HeaderProps {
    wasmReady?: boolean;
    wasmStatus?: WasmStatus;
}

export type Player = "red" | "yellow" | null;

export type Board = Player[][];

export type LastMove = { row: number; column: number; player: Player } | null;

export interface ConnectBoardProps {
  board: Board;
  currentPlayer: "red" | "yellow";
  isThinking?: boolean;
  onColumnClick: (column: number) => void;
  winner?: Player;
  isDraw?: boolean;
  redConnects?: number;
  yellowConnects?: number;
  onReset?: () => void;
  isLarge?: boolean;
  showPanels?: boolean;
  onTogglePanels?: () => void;
  player1Color?: import("../utilities/pieceColors").PieceColorId;
  player2Color?: import("../utilities/pieceColors").PieceColorId;
  onOpenColorModal?: () => void;
  lastMove?: LastMove;
  lastAIMove?: LastMove;
}

export interface GameState {
  board: Board;
  currentPlayer: "red" | "yellow";
  winner: Player;
  isDraw: boolean;
  redConnects: number;
  yellowConnects: number;
  lastMove: LastMove;
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
  simulations?: number;
  onSimulationsChange?: (n: number) => void;
}