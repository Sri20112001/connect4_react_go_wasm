package main

// directions lists the four line orientations that form a
// Connect 4 connection: horizontal, vertical, and the two
// diagonals.
var directions = [][2]int{
	{0, 1},
	{1, 0},
	{1, 1},
	{1, -1},
}

// CheckWinner reports whether player has any 4-in-a-row on
// the whole board.
func CheckWinner(board *Board, player Cell) bool {
	for row := 0; row < Rows; row++ {
		for col := 0; col < Columns; col++ {
			if board[row][col] != player {
				continue
			}

			for _, direction := range directions {
				if hasFour(
					board,
					row,
					col,
					direction[0],
					direction[1],
					player,
				) {
					return true
				}
			}
		}
	}

	return false
}

func hasFour(
	board *Board,
	row int,
	col int,
	rowStep int,
	colStep int,
	player Cell,
) bool {
	for i := 1; i < 4; i++ {
		nextRow := row + rowStep*i
		nextCol := col + colStep*i

		if nextRow < 0 ||
			nextRow >= Rows ||
			nextCol < 0 ||
			nextCol >= Columns {
			return false
		}

		if board[nextRow][nextCol] != player {
			return false
		}
	}

	return true
}

// countPieces counts how many of player's pieces extend from
// (row, col) in the given direction, not including (row, col).
func countPieces(
	board *Board,
	row int,
	col int,
	rowStep int,
	colStep int,
	player Cell,
) int {
	count := 0

	nextRow := row + rowStep
	nextCol := col + colStep

	for nextRow >= 0 &&
		nextRow < Rows &&
		nextCol >= 0 &&
		nextCol < Columns &&
		board[nextRow][nextCol] == player {
		count++

		nextRow += rowStep
		nextCol += colStep
	}

	return count
}

// checkWinnerAt reports whether the piece at (row, col)
// belongs to a 4-in-a-row through that cell. This mirrors the
// JavaScript checkWinner and only considers lines through the
// given cell, never pre-existing lines elsewhere on the board.
func checkWinnerAt(board *Board, row int, col int, player Cell) bool {
	for _, direction := range directions {
		count := 1 +
			countPieces(board, row, col, direction[0], direction[1], player) +
			countPieces(board, row, col, -direction[0], -direction[1], player)

		if count >= 4 {
			return true
		}
	}

	return false
}

// countWinningLines counts how many distinct 4-in-a-row
// orientations pass through the piece at (row, col).
func countWinningLines(board *Board, row int, col int, player Cell) int {
	lines := 0

	for _, direction := range directions {
		count := 1 +
			countPieces(board, row, col, direction[0], direction[1], player) +
			countPieces(board, row, col, -direction[0], -direction[1], player)

		if count >= 4 {
			lines++
		}
	}

	return lines
}