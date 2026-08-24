import type { Board, Player } from "../../types/types";
import createEmptyBoard from "../../utilities/createEmptyBoard";

const ROWS = 6;
const COLUMNS = 7;

export type ParityBoard = {
  id: string;
  label: string;
  board: Board;
  expectedBest: number;
  player: Player;
};

const clone = (board: Board): Board => board.map((r) => [...r]) as Board;

const buildP1 = (): Board => createEmptyBoard();

const buildP2 = (): Board => {
  const b = createEmptyBoard();
  b[ROWS - 1][Math.floor(COLUMNS / 2)] = "red";
  return b;
};

const buildP3 = (): Board => {
  const b = createEmptyBoard();
  b[ROWS - 1][0] = "red";
  b[ROWS - 1][1] = "red";
  b[ROWS - 1][2] = "red";
  return b;
};

const buildP4 = (): Board => {
  const b = createEmptyBoard();
  b[ROWS - 1][0] = "yellow";
  b[ROWS - 1][1] = "yellow";
  b[ROWS - 1][2] = "yellow";
  return b;
};

const buildP5 = (): Board => {
  const b = createEmptyBoard();
  b[ROWS - 1][0] = "red";
  b[ROWS - 1][1] = "red";
  b[ROWS - 2][2] = "red";
  b[ROWS - 3][2] = "red";
  return b;
};

const buildP6 = (): Board => {
  const b = buildP5();
  b[ROWS - 1][4] = "yellow";
  b[ROWS - 1][5] = "yellow";
  b[ROWS - 2][6] = "yellow";
  b[ROWS - 3][6] = "yellow";
  return b;
};

const buildP7 = (): Board => {
  const b = createEmptyBoard();
  b[ROWS - 1][0] = "red";
  b[ROWS - 1][1] = "yellow";
  b[ROWS - 1][2] = "yellow";
  b[ROWS - 1][3] = "red";
  b[ROWS - 1][4] = "yellow";
  b[ROWS - 2][2] = "yellow";
  b[ROWS - 2][3] = "red";
  b[ROWS - 3][3] = "red";
  return b;
};

const buildP8 = (): Board => {
  const b = createEmptyBoard();
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLUMNS; c++) {
      const v = (r + 3 * c) % 5;
      b[r][c] = v === 0 || v === 1 ? "red" : "yellow";
    }
  }
  b[0][6] = null;
  return b;
};

export const PARITY_BOARDS: ParityBoard[] = [
  { id: "P1", label: "P1 empty — center", board: buildP1(), expectedBest: 3, player: "red" },
  { id: "P2", label: "P2 opening", board: buildP2(), expectedBest: 2, player: "red" },
  { id: "P3", label: "P3 forced win", board: buildP3(), expectedBest: 3, player: "red" },
  { id: "P4", label: "P4 forced block", board: buildP4(), expectedBest: 3, player: "red" },
  { id: "P5", label: "P5 fork", board: buildP5(), expectedBest: 2, player: "red" },
  { id: "P6", label: "P6 defensive fork", board: buildP6(), expectedBest: 2, player: "red" },
  { id: "P7", label: "P7 mid-game win", board: buildP7(), expectedBest: 3, player: "red" },
  { id: "P8", label: "P8 late-game (col 6 only)", board: buildP8(), expectedBest: 6, player: "red" },
];

export const getParityBoard = (id: string): ParityBoard | undefined =>
  PARITY_BOARDS.find((b) => b.id === id);

export const cloneBoard = clone;
