package main

import "testing"

func TestParseCells_ValidBoard(t *testing.T) {
	cells := [][]string{
		{"", "", "", "", "", "", ""},
		{"", "", "", "", "", "", ""},
		{"", "", "", "", "", "", ""},
		{"", "", "", "", "", "", ""},
		{"", "", "", "", "", "", ""},
		{"", "", "", "", "", "", ""},
	}
	board, err := parseCells(cells)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if board[0][0] != Empty {
		t.Fatalf("expected Empty[0][0], got %v", board[0][0])
	}
}

func TestParseCells_RedPiece(t *testing.T) {
	cells := [][]string{
		{"red", "", "", "", "", "", ""},
		{"", "", "", "", "", "", ""},
		{"", "", "", "", "", "", ""},
		{"", "", "", "", "", "", ""},
		{"", "", "", "", "", "", ""},
		{"", "", "", "", "", "", ""},
	}
	board, err := parseCells(cells)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if board[0][0] != Red {
		t.Fatalf("expected Red, got %v", board[0][0])
	}
}

func TestParseCells_YellowPiece(t *testing.T) {
	cells := [][]string{
		{"yellow", "", "", "", "", "", ""},
		{"", "", "", "", "", "", ""},
		{"", "", "", "", "", "", ""},
		{"", "", "", "", "", "", ""},
		{"", "", "", "", "", "", ""},
		{"", "", "", "", "", "", ""},
	}
	board, err := parseCells(cells)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if board[0][0] != Yellow {
		t.Fatalf("expected Yellow, got %v", board[0][0])
	}
}

func TestParseCells_WrongRowCount(t *testing.T) {
	cells := [][]string{
		{"", "", "", "", "", "", ""},
		{"", "", "", "", "", "", ""},
		{"", "", "", "", "", "", ""},
	}
	_, err := parseCells(cells)
	if err == nil {
		t.Fatal("expected error for wrong row count")
	}
	if !contains(err.Error(), "must have 6 rows") {
		t.Fatalf("unexpected error message: %v", err)
	}
}

func TestParseCells_WrongColCount(t *testing.T) {
	cells := [][]string{
		{"", "", "", "", "", "", "", ""},
		{"", "", "", "", "", "", ""},
		{"", "", "", "", "", "", ""},
		{"", "", "", "", "", "", ""},
		{"", "", "", "", "", "", ""},
		{"", "", "", "", "", "", ""},
	}
	_, err := parseCells(cells)
	if err == nil {
		t.Fatal("expected error for wrong column count")
	}
	if !contains(err.Error(), "must have 7 cells") {
		t.Fatalf("unexpected error message: %v", err)
	}
}

func TestParseCells_InvalidCell(t *testing.T) {
	cells := [][]string{
		{"green", "", "", "", "", "", ""},
		{"", "", "", "", "", "", ""},
		{"", "", "", "", "", "", ""},
		{"", "", "", "", "", "", ""},
		{"", "", "", "", "", "", ""},
		{"", "", "", "", "", "", ""},
	}
	_, err := parseCells(cells)
	if err == nil {
		t.Fatal("expected error for invalid cell")
	}
	if !contains(err.Error(), "must be null") {
		t.Fatalf("unexpected error message: %v", err)
	}
}

func TestSerializeCells_Red(t *testing.T) {
	board := Board{}
	board[0][0] = Red
	cells := serializeCells(board)
	if cells[0][0] != "red" {
		t.Fatalf("expected 'red', got %v", cells[0][0])
	}
}

func TestSerializeCells_Yellow(t *testing.T) {
	board := Board{}
	board[0][0] = Yellow
	cells := serializeCells(board)
	if cells[0][0] != "yellow" {
		t.Fatalf("expected 'yellow', got %v", cells[0][0])
	}
}

func TestSerializeCells_Empty(t *testing.T) {
	board := Board{}
	cells := serializeCells(board)
	if cells[0][0] != "" {
		t.Fatalf("expected '', got %v", cells[0][0])
	}
}

func TestParsePlayer_Red(t *testing.T) {
	player, err := parsePlayer("red")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if player != Red {
		t.Fatalf("expected Red, got %v", player)
	}
}

func TestParsePlayer_Yellow(t *testing.T) {
	player, err := parsePlayer("yellow")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if player != Yellow {
		t.Fatalf("expected Yellow, got %v", player)
	}
}

func TestParsePlayer_Invalid(t *testing.T) {
	_, err := parsePlayer("blue")
	if err == nil {
		t.Fatal("expected error for invalid player")
	}
	if !contains(err.Error(), "must be") {
		t.Fatalf("unexpected error message: %v", err)
	}
}

func TestSerializePlayer_Red(t *testing.T) {
	result := serializePlayer(Red)
	if result != "red" {
		t.Fatalf("expected 'red', got %v", result)
	}
}

func TestSerializePlayer_Yellow(t *testing.T) {
	result := serializePlayer(Yellow)
	if result != "yellow" {
		t.Fatalf("expected 'yellow', got %v", result)
	}
}

func TestSerializePlayer_Empty(t *testing.T) {
	result := serializePlayer(Empty)
	if result != "" {
		t.Fatalf("expected '', got %v", result)
	}
}

func contains(s, substr string) bool {
	if len(s) < len(substr) {
		return false
	}
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}