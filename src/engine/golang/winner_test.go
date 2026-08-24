package main

import "testing"

func TestCheckWinnerHorizontal(t *testing.T) {
	var board Board

	for col := 0; col < 4; col++ {
		board[Rows-1][col] = Red
	}

	if !CheckWinner(&board, Red) {
		t.Fatal("expected horizontal winner")
	}
}

func TestCheckWinnerHorizontalAtRightEdge(t *testing.T) {
	var board Board

	for col := Columns - 4; col < Columns; col++ {
		board[Rows-1][col] = Yellow
	}

	if !CheckWinner(&board, Yellow) {
		t.Fatal("expected horizontal winner at the right edge")
	}
}

func TestCheckWinnerVertical(t *testing.T) {
	var board Board

	for row := Rows - 4; row < Rows; row++ {
		board[row][3] = Yellow
	}

	if !CheckWinner(&board, Yellow) {
		t.Fatal("expected vertical winner")
	}
}

func TestCheckWinnerVerticalAtLeftEdge(t *testing.T) {
	var board Board

	for row := Rows - 4; row < Rows; row++ {
		board[row][0] = Red
	}

	if !CheckWinner(&board, Red) {
		t.Fatal("expected vertical winner at the left column")
	}
}

// Diagonal going down-right: \
func TestCheckWinnerDiagonalDownRight(t *testing.T) {
	var board Board

	board[Rows-4][0] = Yellow
	board[Rows-3][1] = Yellow
	board[Rows-2][2] = Yellow
	board[Rows-1][3] = Yellow

	if !CheckWinner(&board, Yellow) {
		t.Fatal("expected diagonal (\\) winner")
	}
}

// Diagonal going up-right: /
func TestCheckWinnerDiagonalUpRight(t *testing.T) {
	var board Board

	board[Rows-1][0] = Red
	board[Rows-2][1] = Red
	board[Rows-3][2] = Red
	board[Rows-4][3] = Red

	if !CheckWinner(&board, Red) {
		t.Fatal("expected diagonal (/) winner")
	}
}

func TestCheckWinnerEmptyBoard(t *testing.T) {
	var board Board

	if CheckWinner(&board, Red) {
		t.Fatal("empty board must not have a winner")
	}

	if CheckWinner(&board, Yellow) {
		t.Fatal("empty board must not have a winner")
	}
}

func TestCheckWinnerNoWinnerMixedPieces(t *testing.T) {
	var board Board

	board[Rows-1][0] = Red
	board[Rows-1][1] = Red
	board[Rows-1][2] = Yellow
	board[Rows-1][3] = Yellow

	if CheckWinner(&board, Red) {
		t.Fatal("expected no winner")
	}
}

func TestCheckWinnerThreeInARowIsNotAWinner(t *testing.T) {
	var board Board

	for col := 0; col < 3; col++ {
		board[Rows-1][col] = Red
	}

	if CheckWinner(&board, Red) {
		t.Fatal("three in a row is not a winner")
	}
}

func TestCheckWinnerOpponentPiecesDoNotCount(t *testing.T) {
	var board Board

	for col := 0; col < 4; col++ {
		board[Rows-1][col] = Red
	}

	if CheckWinner(&board, Yellow) {
		t.Fatal("red pieces must not count as a yellow win")
	}
}