import type { Board, Player } from "../types/types";
import { COLUMNS, ROWS } from "./CONSTANTS";

const createEmptyBoard = (): Board => {
  return Array.from({ length: ROWS }, () => Array<Player>(COLUMNS).fill(null));
}

export default createEmptyBoard