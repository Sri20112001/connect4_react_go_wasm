package main

// This file is a behavior-preserving port of
// src/engine/javascript/evaluateBoard.ts.
//
// The scoring semantics must stay identical to the
// JavaScript evaluator: same window rules, same weights,
// same playable-cell logic. Do not tune the heuristic here.

type windowCell struct {
	value  Cell
	row    int
	column int
}

func opponentOf(player Player) Player {
	if player == Red {
		return Yellow
	}
	return Red
}

// isPlayableCell reports whether a piece can be placed at
// (row, column): it is empty, in bounds, and either on the
// bottom row or resting on an occupied cell below it.
func isPlayableCell(board *Board, row int, column int) bool {
	if row < 0 || row >= Rows || column < 0 || column >= Columns {
		return false
	}

	if board[row][column] != Empty {
		return false
	}

	if row == Rows-1 {
		return true
	}

	return board[row+1][column] != Empty
}

// evaluateWindow scores one group of four cells from the
// perspective of player.
func evaluateWindow(board *Board, window [4]windowCell, player Player) int {
	opponent := opponentOf(player)

	playerCount := 0
	opponentCount := 0
	emptyCount := 0
	hasPlayableEmptyCell := false

	for _, cell := range window {
		switch cell.value {
		case player:
			playerCount++
		case opponent:
			opponentCount++
		case Empty:
			emptyCount++
			if isPlayableCell(board, cell.row, cell.column) {
				hasPlayableEmptyCell = true
			}
		}
	}

	// Complete 4-in-a-row.
	if playerCount == 4 {
		return 100000
	}

	if opponentCount == 4 {
		return -100000
	}

	// Three of ours with one empty space.
	if playerCount == 3 && emptyCount == 1 {
		if hasPlayableEmptyCell {
			return 100
		}
		return 20
	}

	// Two of ours with two empty spaces.
	if playerCount == 2 && emptyCount == 2 {
		return 10
	}

	// One of ours with three empty spaces.
	if playerCount == 1 && emptyCount == 3 {
		return 1
	}

	// Three opponent pieces with one empty space.
	if opponentCount == 3 && emptyCount == 1 {
		if hasPlayableEmptyCell {
			return -120
		}
		return -20
	}

	// Two opponent pieces with two empty spaces.
	if opponentCount == 2 && emptyCount == 2 {
		return -10
	}

	return 0
}

func evaluateHorizontal(board *Board, player Player) int {
	score := 0

	for row := 0; row < Rows; row++ {
		for column := 0; column <= Columns-4; column++ {
			window := [4]windowCell{
				{board[row][column], row, column},
				{board[row][column+1], row, column + 1},
				{board[row][column+2], row, column + 2},
				{board[row][column+3], row, column + 3},
			}
			score += evaluateWindow(board, window, player)
		}
	}

	return score
}

func evaluateVertical(board *Board, player Player) int {
	score := 0

	for row := 0; row <= Rows-4; row++ {
		for column := 0; column < Columns; column++ {
			window := [4]windowCell{
				{board[row][column], row, column},
				{board[row+1][column], row + 1, column},
				{board[row+2][column], row + 2, column},
				{board[row+3][column], row + 3, column},
			}
			score += evaluateWindow(board, window, player)
		}
	}

	return score
}

// Down-right diagonals (row + 1, column + 1).
func evaluateDiagonalDown(board *Board, player Player) int {
	score := 0

	for row := 0; row <= Rows-4; row++ {
		for column := 0; column <= Columns-4; column++ {
			window := [4]windowCell{
				{board[row][column], row, column},
				{board[row+1][column+1], row + 1, column + 1},
				{board[row+2][column+2], row + 2, column + 2},
				{board[row+3][column+3], row + 3, column + 3},
			}
			score += evaluateWindow(board, window, player)
		}
	}

	return score
}

// Up-right diagonals (row - 1, column + 1).
func evaluateDiagonalUp(board *Board, player Player) int {
	score := 0

	for row := 3; row < Rows; row++ {
		for column := 0; column <= Columns-4; column++ {
			window := [4]windowCell{
				{board[row][column], row, column},
				{board[row-1][column+1], row - 1, column + 1},
				{board[row-2][column+2], row - 2, column + 2},
				{board[row-3][column+3], row - 3, column + 3},
			}
			score += evaluateWindow(board, window, player)
		}
	}

	return score
}

// One point per player piece in the center column.
func evaluateCenterControl(board *Board, player Player) int {
	score := 0

	centerColumn := Columns / 2

	for row := 0; row < Rows; row++ {
		if board[row][centerColumn] == player {
			score++
		}
	}

	return score
}

// EvaluateBoard returns the overall strategic value of the
// board from the perspective of player. Positive means
// favorable for player, negative means favorable for opponent.
func EvaluateBoard(board *Board, player Player) int {
	if player == Empty {
		return 0
	}

	return evaluateCenterControl(board, player) +
		evaluateHorizontal(board, player) +
		evaluateVertical(board, player) +
		evaluateDiagonalDown(board, player) +
		evaluateDiagonalUp(board, player)
}