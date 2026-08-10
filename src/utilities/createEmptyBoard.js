import { COLUMNS, ROWS } from "./CONSTANTS";
const createEmptyBoard = () => {
    return Array.from({ length: ROWS }, () => Array(COLUMNS).fill(null));
};
export default createEmptyBoard;
