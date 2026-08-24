package main

const (
	Rows    = 6
	Columns = 7
)

type Cell uint8

const (
	Empty Cell = iota
	Red
	Yellow
)

type Board [Rows][Columns]Cell

// Player is the piece color used by the AI layers.
// It is the same type as Cell.
type Player = Cell

func GetAvailableColumns(board *Board) []int {
	columns := make([]int, 0, Columns)

	for col := 0; col < Columns; col++ {
		if board[0][col] == Empty {
			columns = append(columns, col)
		}
	}

	return columns
}

// DropPiece places player's piece in column and returns the
// row it landed on, or -1 if the move is impossible.
func DropPiece(board *Board, column int, player Cell) int {
	if column < 0 || column >= Columns {
		return -1
	}

	for row := Rows - 1; row >= 0; row-- {
		if board[row][column] == Empty {
			board[row][column] = player
			return row
		}
	}

	return -1
}

func CloneBoard(board *Board) Board {
	return *board
}
