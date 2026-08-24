package main

import "testing"

func TestEvaluateEmptyBoard(t *testing.T) {
	var board Board

	if got := EvaluateBoard(&board, Red); got != 0 {
		t.Fatalf("empty board should score 0, got %d", got)
	}
}

func TestEvaluateCenterPreference(t *testing.T) {
	var center Board
	center[Rows-1][Columns/2] = Red

	if got := evaluateCenterControl(&center, Red); got != 1 {
		t.Fatalf("expected 1 for a center piece, got %d", got)
	}

	var edge Board
	edge[Rows-1][0] = Red

	if got := evaluateCenterControl(&edge, Red); got != 0 {
		t.Fatalf("expected 0 for an edge piece, got %d", got)
	}
}

// Two of ours: window (0,1,2,3) = +10, window (1,2,3,4) = +1.
func TestEvaluateOwnTwo(t *testing.T) {
	var board Board

	board[Rows-1][0] = Red
	board[Rows-1][1] = Red

	if got := evaluateHorizontal(&board, Red); got != 11 {
		t.Fatalf("expected 11, got %d", got)
	}
}

// Three of ours: window (0,1,2,3) = +100, (1,2,3,4) = +10, (2,3,4,5) = +1.
func TestEvaluateOwnThree(t *testing.T) {
	var board Board

	board[Rows-1][0] = Red
	board[Rows-1][1] = Red
	board[Rows-1][2] = Red

	if got := evaluateHorizontal(&board, Red); got != 111 {
		t.Fatalf("expected 111, got %d", got)
	}
}

// Two of the opponent: window (0,1,2,3) = -10.
func TestEvaluateOpponentTwo(t *testing.T) {
	var board Board

	board[Rows-1][0] = Yellow
	board[Rows-1][1] = Yellow

	if got := evaluateHorizontal(&board, Red); got != -10 {
		t.Fatalf("expected -10, got %d", got)
	}
}

// Three of the opponent: window (0,1,2,3) = -120, (1,2,3,4) = -10.
func TestEvaluateOpponentThree(t *testing.T) {
	var board Board

	board[Rows-1][0] = Yellow
	board[Rows-1][1] = Yellow
	board[Rows-1][2] = Yellow

	if got := evaluateHorizontal(&board, Red); got != -130 {
		t.Fatalf("expected -130, got %d", got)
	}
}

// Three vertical with a playable empty: +100, plus +10 and +1
// for the lower windows.
func TestEvaluateVerticalWindow(t *testing.T) {
	var board Board

	board[Rows-1][3] = Red
	board[Rows-2][3] = Red
	board[Rows-3][3] = Red

	if got := evaluateVertical(&board, Red); got != 111 {
		t.Fatalf("expected 111, got %d", got)
	}
}

// A "\" diagonal with a playable empty fourth cell scores +100.
func TestEvaluateDiagonalWindow(t *testing.T) {
	var board Board

	board[Rows-4][0] = Red
	board[Rows-3][1] = Red
	board[Rows-2][2] = Red

	if got := evaluateDiagonalDown(&board, Red); got != 100 {
		t.Fatalf("expected 100, got %d", got)
	}
}

func TestEvaluateWinningPosition(t *testing.T) {
	var board Board

	for col := 0; col < 4; col++ {
		board[Rows-1][col] = Red
	}

	if got := EvaluateBoard(&board, Red); got < 100000 {
		t.Fatalf("expected winning position to score >= 100000, got %d", got)
	}
}

// The evaluator is color-symmetric: swapping Red and Yellow
// and swapping the evaluation perspective must give the same
// score for identical piece placements.
func TestEvaluateSymmetry(t *testing.T) {
	var a Board
	var b Board

	a[Rows-1][0] = Red
	a[Rows-2][1] = Red
	a[Rows-1][3] = Red
	a[Rows-1][4] = Yellow
	a[Rows-2][4] = Yellow
	a[Rows-1][6] = Red

	for row := 0; row < Rows; row++ {
		for col := 0; col < Columns; col++ {
			switch a[row][col] {
			case Red:
				b[row][col] = Yellow
			case Yellow:
				b[row][col] = Red
			}
		}
	}

	scoreA := EvaluateBoard(&a, Red)
	scoreB := EvaluateBoard(&b, Yellow)

	if scoreA != scoreB {
		t.Fatalf("symmetry violated: Red eval %d != Yellow eval %d", scoreA, scoreB)
	}
}