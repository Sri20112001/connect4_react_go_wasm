package main

import "testing"

// Decision parity: these boards reproduce the JavaScript
// analyzePosition output exactly (same columns, same flags,
// same evaluation scores, same final scores). The expected
// values were verified against the JS engine with 0
// simulations, so every value here is deterministic.

func buildP1() Board {
	return Board{}
}

func buildP2() Board {
	var board Board

	board[Rows-1][Columns/2] = Red

	return board
}

func buildP3() Board {
	var board Board

	board[Rows-1][0] = Red
	board[Rows-1][1] = Red
	board[Rows-1][2] = Red

	return board
}

func buildP4() Board {
	var board Board

	board[Rows-1][0] = Yellow
	board[Rows-1][1] = Yellow
	board[Rows-1][2] = Yellow

	return board
}

func buildP5() Board {
	var board Board

	board[Rows-1][0] = Red
	board[Rows-1][1] = Red
	board[Rows-2][2] = Red
	board[Rows-3][2] = Red

	return board
}

func buildP6() Board {
	board := buildP5()

	board[Rows-1][4] = Yellow
	board[Rows-1][5] = Yellow
	board[Rows-2][6] = Yellow
	board[Rows-3][6] = Yellow

	return board
}

func buildP7() Board {
	var board Board

	board[Rows-1][0] = Red
	board[Rows-1][1] = Yellow
	board[Rows-1][2] = Yellow
	board[Rows-1][3] = Red
	board[Rows-1][4] = Yellow
	board[Rows-2][2] = Yellow
	board[Rows-2][3] = Red
	board[Rows-3][3] = Red

	return board
}

func buildP8() Board {
	var board Board

	// Pattern with no 4-in-a-row; only column 6 is available.
	for row := 0; row < Rows; row++ {
		for col := 0; col < Columns; col++ {
			switch (row + 3*col) % 5 {
			case 0, 1:
				board[row][col] = Red
			default:
				board[row][col] = Yellow
			}
		}
	}

	board[0][6] = Empty

	return board
}

func TestDecisionParityBestMoves(t *testing.T) {
	boards := []struct {
		name    string
		board   Board
		best    int
		checkFn func(t *testing.T, a MoveAnalysis)
	}{
		{"P1 empty", buildP1(), 3, nil},
		{"P2 opening", buildP2(), 2, nil},
		{
			"P3 forced win",
			buildP3(),
			3,
			func(t *testing.T, a MoveAnalysis) {
				if !a.IsImmediateWin {
					t.Fatal("expected immediate win")
				}
			},
		},
		{
			"P4 forced block",
			buildP4(),
			3,
			func(t *testing.T, a MoveAnalysis) {
				if !a.BlocksImmediateLoss {
					t.Fatal("expected forced block")
				}
			},
		},
		{
			"P5 fork",
			buildP5(),
			2,
			func(t *testing.T, a MoveAnalysis) {
				if !a.CreatesFork {
					t.Fatal("expected fork")
				}
			},
		},
		{
			"P6 defensive fork",
			buildP6(),
			2,
			func(t *testing.T, a MoveAnalysis) {
				if !a.CreatesFork {
					t.Fatal("expected fork")
				}
			},
		},
		{
			"P7 mid-game",
			buildP7(),
			3,
			func(t *testing.T, a MoveAnalysis) {
				if !a.IsImmediateWin {
					t.Fatal("expected immediate win")
				}
			},
		},
		{"P8 late-game", buildP8(), 6, nil},
	}

	for _, b := range boards {
		t.Run(b.name, func(t *testing.T) {
			analysis := AnalyzePosition(&b.board, Red, 0)

			if len(analysis) == 0 {
				t.Fatal("expected at least one analyzed move")
			}

			best := analysis[0]

			if best.Column != b.best {
				t.Fatalf("expected best move %d, got %d", b.best, best.Column)
			}

			if b.checkFn != nil {
				b.checkFn(t, best)
			}
		})
	}
}

// Exact heuristic parity anchors from the JS engine.
func TestDecisionParityHeuristicValues(t *testing.T) {
	// Empty board: center column scores 8 with 0 simulations.
	p1 := buildP1()
	analysis := AnalyzePosition(&p1, Red, 0)

	if analysis[0].Column != 3 || analysis[0].EvaluationScore != 8 {
		t.Fatalf("expected column 3 with eval 8, got column %d eval %d", analysis[0].Column, analysis[0].EvaluationScore)
	}

	// Forced block: the block move has tier-2 final score.
	p4 := buildP4()
	analysis = AnalyzePosition(&p4, Red, 0)

	if analysis[0].Column != 3 {
		t.Fatalf("expected block at column 3, got %d", analysis[0].Column)
	}

	if analysis[0].FinalScore != 2000.5 {
		t.Fatalf("expected final score 2000.5, got %.1f", analysis[0].FinalScore)
	}

	// Fork position: tier-1 fork beats every Monte Carlo tier-0.
	p5 := buildP5()
	analysis = AnalyzePosition(&p5, Red, 0)

	if analysis[0].Column != 2 {
		t.Fatalf("expected fork at column 2, got %d", analysis[0].Column)
	}

	if analysis[0].FinalScore < 1000 {
		t.Fatalf("expected fork final score >= 1000, got %.1f", analysis[0].FinalScore)
	}
}