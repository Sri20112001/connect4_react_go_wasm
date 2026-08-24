package main

import "testing"

func TestDropPiece(t *testing.T) {
	var board Board

	row := DropPiece(&board, 3, Red)

	if row < 0 {
		t.Fatal("expected piece to be dropped")
	}

	if board[Rows-1][3] != Red {
		t.Fatal("expected red piece at bottom of column 3")
	}
}

func TestDropPieceStacks(t *testing.T) {
	var board Board

	DropPiece(&board, 3, Red)
	DropPiece(&board, 3, Yellow)

	if board[Rows-1][3] != Red {
		t.Fatal("expected red piece at bottom")
	}

	if board[Rows-2][3] != Yellow {
		t.Fatal("expected yellow piece above red")
	}
}

func TestGetAvailableColumns(t *testing.T) {
	var board Board

	for row := 0; row < Rows; row++ {
		board[row][0] = Red
	}

	columns := GetAvailableColumns(&board)

	for _, column := range columns {
		if column == 0 {
			t.Fatal("full column should not be available")
		}
	}
}
