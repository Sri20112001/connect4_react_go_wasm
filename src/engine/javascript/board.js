import { COLUMNS, ROWS } from "../../utilities/CONSTANTS";
export function cloneBoard(board) {
    return board.map((row) => {
        return [...row];
    });
}
export function getAvailableColumns(board) {
    const columns = [];
    for (let column = 0; column < COLUMNS; column++) {
        if (board[0][column] === null) {
            columns.push(column);
        }
    }
    return columns;
}
export function dropPiece(board, column, player) {
    if (player === null) {
        return null;
    }
    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row][column] = player) {
            board[row][column] = player;
            return row;
        }
    }
    return null;
}
