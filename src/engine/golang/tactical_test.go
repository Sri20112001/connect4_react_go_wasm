package main

import "testing"

func TestFindImmediateWinningMove(t *testing.T) {
	var board Board

	board[Rows-1][0] = Red
	board[Rows-1][1] = Red
	board[Rows-1][2] = Red

	move := FindImmediateWinningMove(&board, Red)

	if move != 3 {
		t.Fatalf("expected winning move 3, got %d", move)
	}
}

func TestFindImmediateWinningMoveNone(t *testing.T) {
	var board Board

	board[Rows-1][0] = Red
	board[Rows-1][1] = Red

	move := FindImmediateWinningMove(&board, Red)

	if move != -1 {
		t.Fatalf("expected no winning move, got %d", move)
	}
}

func TestFindBlockingMove(t *testing.T) {
	var board Board

	board[Rows-1][0] = Yellow
	board[Rows-1][1] = Yellow
	board[Rows-1][2] = Yellow

	move := FindBlockingMove(&board, Red)

	if move != 3 {
		t.Fatalf("expected blocking move 3, got %d", move)
	}
}
