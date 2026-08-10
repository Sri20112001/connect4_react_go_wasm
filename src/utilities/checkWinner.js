import { COLUMNS, DIRECTIONS, ROWS } from "./CONSTANTS";
export const isBoardFull = (board) => {
    return board[0].every((cell) => cell !== null);
};
export const checkWinner = (board, row, column, player) => {
    if (player === null) {
        return false;
    }
    for (const [rowDirection, columnDirection] of DIRECTIONS) {
        const count = 1 +
            countPieces(board, row, column, rowDirection, columnDirection, player) +
            countPieces(board, row, column, -rowDirection, -columnDirection, player);
        if (count >= 4) {
            return true;
        }
    }
    return false;
};
export const countPieces = (board, row, column, rowDirection, columnDirection, player) => {
    let count = 0;
    let currentRow = row + rowDirection;
    let currentColumn = column + columnDirection;
    while (currentRow >= 0 &&
        currentRow < ROWS &&
        currentColumn >= 0 &&
        currentColumn < COLUMNS &&
        board[currentRow][currentColumn] === player) {
        count++;
        currentRow += rowDirection;
        currentColumn += columnDirection;
    }
    return count;
};
