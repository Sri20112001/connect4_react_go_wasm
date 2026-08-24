package main

import "testing"

// Genuine fork: playing column 2 creates a horizontal
// 3-in-a-row threat (column 3) and a vertical 3-in-a-row
// threat (column 2).
func TestFindForkingMoveDetectsFork(t *testing.T) {
	var board Board

	board[Rows-1][0] = Red
	board[Rows-1][1] = Red
	board[Rows-2][2] = Red
	board[Rows-3][2] = Red

	move := FindForkingMove(&board, Red)

	if move != 2 {
		t.Fatalf("expected forking move 2, got %d", move)
	}
}

func TestFindForkingMoveNone(t *testing.T) {
	var board Board

	move := FindForkingMove(&board, Red)

	if move != -1 {
		t.Fatalf("expected no fork, got %d", move)
	}
}

// A move that creates a single winning threat must not be
// mistaken for a fork.
func TestFindForkingMoveSingleThreatIsNotFork(t *testing.T) {
	var board Board

	board[Rows-1][0] = Red
	board[Rows-1][1] = Red
	board[Rows-2][2] = Red

	move := FindForkingMove(&board, Red)

	if move != -1 {
		t.Fatalf("single threat must not be treated as a fork, got %d", move)
	}
}

// Full columns must be skipped entirely.
func TestFindForkingMoveIgnoresFullColumns(t *testing.T) {
	var board Board

	// Fill column 0 completely.
	for row := 0; row < Rows; row++ {
		board[row][0] = Yellow
	}

	board[Rows-1][1] = Red
	board[Rows-1][2] = Red
	board[Rows-2][3] = Red
	board[Rows-3][3] = Red

	move := FindForkingMove(&board, Red)

	if move == 0 {
		t.Fatal("full column must not be chosen")
	}

	if move != 3 {
		t.Fatalf("expected forking move 3, got %d", move)
	}
}

// Fork against the left edge: playing column 0 creates a
// vertical threat in column 0 (rows 2-5) and a horizontal
// threat in row 5 (columns 3-4).
func TestFindForkingMoveNearEdge(t *testing.T) {
	var board Board

	board[Rows-1][1] = Red
	board[Rows-1][2] = Red
	board[Rows-2][0] = Red
	board[Rows-3][0] = Red

	move := FindForkingMove(&board, Red)

	if move != 0 {
		t.Fatalf("expected forking move 0, got %d", move)
	}
}

// Fork detection must work for Yellow as well.
func TestFindForkingMoveYellow(t *testing.T) {
	var board Board

	board[Rows-1][0] = Yellow
	board[Rows-1][1] = Yellow
	board[Rows-2][2] = Yellow
	board[Rows-3][2] = Yellow

	move := FindForkingMove(&board, Yellow)

	if move != 2 {
		t.Fatalf("expected forking move 2 for yellow, got %d", move)
	}
}