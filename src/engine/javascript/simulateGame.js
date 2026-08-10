import { checkWinner } from "../../utilities/checkWinner";
import { cloneBoard, dropPiece, getAvailableColumns } from "./board";
export const simulateGame = (initialBoard, aiPlayer) => {
    if (aiPlayer === null) {
        throw new Error("AI player cannot be null");
    }
    const board = cloneBoard(initialBoard);
    let currentPlayer = aiPlayer;
    while (true) {
        const availableColumns = getAvailableColumns(board);
        if (availableColumns.length === 0) {
            return "draw";
        }
        const randomIndex = Math.floor(Math.random() * availableColumns.length);
        const column = availableColumns[randomIndex];
        const row = dropPiece(board, column, currentPlayer);
        if (row === null) {
            continue;
        }
        if (checkWinner(board, row, column, currentPlayer)) {
            return currentPlayer === aiPlayer ? "win" : "loss";
        }
        currentPlayer = currentPlayer === "red" ? "yellow" : "red";
    }
};
