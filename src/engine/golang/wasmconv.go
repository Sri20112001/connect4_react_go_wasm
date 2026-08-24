package main

import "fmt"

// This file holds the pure, testable conversions between the
// JavaScript boundary representation (a 6x7 matrix of
// "red"/"yellow"/"" strings) and the Go Board type. The
// syscall/js adapter in main.go is kept deliberately thin so
// all boundary logic can be exercised by go test.

// parseCells validates a 6x7 matrix of "red"/"yellow"/"" cells
// and converts it into a Board. "" represents an empty cell
// (null in JavaScript).
func parseCells(cells [][]string) (Board, error) {
	var board Board

	if len(cells) != Rows {
		return board, fmt.Errorf(
			"board must have %d rows, got %d",
			Rows, len(cells),
		)
	}

	for row := 0; row < Rows; row++ {
		if len(cells[row]) != Columns {
			return board, fmt.Errorf(
				"board row %d must have %d cells, got %d",
				row, Columns, len(cells[row]),
			)
		}

		for col := 0; col < Columns; col++ {
			switch cells[row][col] {
			case "":
				board[row][col] = Empty
			case "red":
				board[row][col] = Red
			case "yellow":
				board[row][col] = Yellow
			default:
				return board, fmt.Errorf(
					"board cell [%d][%d] must be null, \"red\", or \"yellow\", got %q",
					row, col, cells[row][col],
				)
			}
		}
	}

	return board, nil
}

// serializeCells converts a Board into the JS-friendly 6x7
// matrix of "red"/"yellow"/"" strings.
func serializeCells(board Board) [][]string {
	cells := make([][]string, Rows)

	for row := 0; row < Rows; row++ {
		cells[row] = make([]string, Columns)

		for col := 0; col < Columns; col++ {
			switch board[row][col] {
			case Red:
				cells[row][col] = "red"
			case Yellow:
				cells[row][col] = "yellow"
			default:
				cells[row][col] = ""
			}
		}
	}

	return cells
}

// parsePlayer converts the JS player string to a Player.
func parsePlayer(value string) (Player, error) {
	switch value {
	case "red":
		return Red, nil
	case "yellow":
		return Yellow, nil
	default:
		return Empty, fmt.Errorf(
			"player must be \"red\" or \"yellow\", got %q",
			value,
		)
	}
}

// serializePlayer converts a Player to its JS string form.
func serializePlayer(player Player) string {
	switch player {
	case Red:
		return "red"
	case Yellow:
		return "yellow"
	default:
		return ""
	}
}