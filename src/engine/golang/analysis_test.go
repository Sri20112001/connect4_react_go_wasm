package main

import "testing"

func TestAnalyzePositionAllColumnsAnalyzed(t *testing.T) {
	var board Board

	analysis := AnalyzePosition(&board, Red, 20)

	if len(analysis) != Columns {
		t.Fatalf("expected %d columns, got %d", Columns, len(analysis))
	}

	for column := 0; column < Columns; column++ {
		found := false

		for _, a := range analysis {
			if a.Column == column {
				found = true
				break
			}
		}

		if !found {
			t.Fatalf("column %d missing from analysis", column)
		}
	}
}

func TestAnalyzePositionExcludesFullColumns(t *testing.T) {
	var board Board

	for row := 0; row < Rows; row++ {
		board[row][0] = Red
	}

	analysis := AnalyzePosition(&board, Red, 10)

	if len(analysis) != Columns-1 {
		t.Fatalf("expected %d columns, got %d", Columns-1, len(analysis))
	}

	for _, a := range analysis {
		if a.Column == 0 {
			t.Fatal("full column 0 must be excluded")
		}
	}
}

func TestAnalyzePositionSortedBestFirst(t *testing.T) {
	var board Board

	analysis := AnalyzePosition(&board, Red, 0)

	for i := 0; i < len(analysis)-1; i++ {
		if analysis[i].FinalScore < analysis[i+1].FinalScore {
			t.Fatalf(
				"analysis not sorted: index %d (%.2f) < index %d (%.2f)",
				i,
				analysis[i].FinalScore,
				i+1,
				analysis[i+1].FinalScore,
			)
		}
	}
}

// Empty board with zero simulations: pure heuristic, so the
// center column must win deterministically.
func TestAnalyzePositionEmptyBoardBestIsCenter(t *testing.T) {
	var board Board

	analysis := AnalyzePosition(&board, Red, 0)

	if analysis[0].Column != Columns/2 {
		t.Fatalf("expected center column %d, got %d", Columns/2, analysis[0].Column)
	}
}

// A strategic win must never lose to a better Monte Carlo
// percentage. Tier 3 (1000+ points) dwarfs any win rate.
func TestAnalyzePositionImmediateWinBeatsMC(t *testing.T) {
	var board Board

	board[Rows-1][0] = Red
	board[Rows-1][1] = Red
	board[Rows-1][2] = Red

	analysis := AnalyzePosition(&board, Red, 100)

	best := analysis[0]

	if !best.IsImmediateWin {
		t.Fatal("best move must be the immediate win")
	}

	if best.Column != 3 {
		t.Fatalf("expected winning column 3, got %d", best.Column)
	}

	if best.Simulations != 0 {
		t.Fatalf("forcing positions must skip simulations, got %d", best.Simulations)
	}

	if best.FinalScore < 3000 {
		t.Fatalf("tier-3 move must score >= 3000, got %.2f", best.FinalScore)
	}

	for _, a := range analysis[1:] {
		if a.FinalScore >= 3000 {
			t.Fatalf("non-winning move scored >= 3000: %.2f", a.FinalScore)
		}
	}
}

func TestAnalyzePositionBlockBeatsMC(t *testing.T) {
	var board Board

	board[Rows-1][0] = Yellow
	board[Rows-1][1] = Yellow
	board[Rows-1][2] = Yellow

	analysis := AnalyzePosition(&board, Red, 100)

	best := analysis[0]

	if !best.BlocksImmediateLoss {
		t.Fatal("best move must block the immediate loss")
	}

	if best.Column != 3 {
		t.Fatalf("expected blocking column 3, got %d", best.Column)
	}
}

func TestAnalyzePositionForkBeatsMC(t *testing.T) {
	var board Board

	board[Rows-1][0] = Red
	board[Rows-1][1] = Red
	board[Rows-2][2] = Red
	board[Rows-3][2] = Red

	analysis := AnalyzePosition(&board, Red, 100)

	best := analysis[0]

	if !best.CreatesFork {
		t.Fatal("best move must create the fork")
	}

	if best.Column != 2 {
		t.Fatalf("expected forking column 2, got %d", best.Column)
	}

	if best.Simulations != 0 {
		t.Fatalf("forking positions must skip simulations, got %d", best.Simulations)
	}
}

// The simulation budget is skipped for every move when the
// position is forcing, not just for the forcing move.
func TestAnalyzePositionForcingSkipsAllSimulations(t *testing.T) {
	var board Board

	board[Rows-1][0] = Red
	board[Rows-1][1] = Red
	board[Rows-2][2] = Red
	board[Rows-3][2] = Red

	analysis := AnalyzePosition(&board, Red, 50)

	for _, a := range analysis {
		if a.Simulations != 0 {
			t.Fatalf("column %d simulated %d times in a forcing position", a.Column, a.Simulations)
		}
	}
}

// Perspective regression test. Yellow has an immediate win
// elsewhere; Red analyzes a neutral move. Every simulation
// runs with Yellow as the AI and Yellow wins each one, which
// must be counted as LOSSES for Red. The old inverted-counting
// bug would have counted these as wins.
func TestAnalyzeMoveCountsLosses(t *testing.T) {
	var board Board

	board[Rows-1][0] = Yellow
	board[Rows-1][1] = Yellow
	board[Rows-1][2] = Yellow

	const sims = 60

	move := AnalyzeMove(&board, 4, Red, sims)

	if !move.Legal {
		t.Fatal("column 4 must be legal")
	}

	if move.Simulations != sims {
		t.Fatalf("expected %d simulations, got %d", sims, move.Simulations)
	}

	if move.Losses != sims {
		t.Fatalf("expected %d losses, got %d", sims, move.Losses)
	}

	if move.Wins != 0 || move.Draws != 0 {
		t.Fatalf("expected no wins or draws, got wins=%d draws=%d", move.Wins, move.Draws)
	}

	if move.WinRate != 0 {
		t.Fatalf("expected win rate 0, got %.2f", move.WinRate)
	}
}

// A full board generated with a pattern that guarantees no
// 4-in-a-row in any direction forces every simulation to end
// in a draw.
func TestAnalyzeMoveCountsDraws(t *testing.T) {
	var board Board

	// Color at (row, col) is Red when (row + 3*col) mod 5 is
	// 0 or 1, else Yellow. In any direction a 4-window covers
	// four distinct residues mod 5, and the Red/Yellow classes
	// have 2 and 3 residues, so no 4-window can be uniform.
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

	if CheckWinner(&board, Red) || CheckWinner(&board, Yellow) {
		t.Fatal("pattern board must not contain a winner")
	}

	// Leave the top of column 6 empty so it is the only
	// available column.
	board[0][6] = Empty

	const sims = 40

	move := AnalyzeMove(&board, 6, Red, sims)

	if move.Simulations != sims {
		t.Fatalf("expected %d simulations, got %d", sims, move.Simulations)
	}

	if move.Draws != sims {
		t.Fatalf("expected %d draws, got %d", sims, move.Draws)
	}

	if move.Wins != 0 || move.Losses != 0 {
		t.Fatalf("expected no wins or losses, got wins=%d losses=%d", move.Wins, move.Losses)
	}
}

// Wins, losses, and draws must add up to the simulation count
// and the win rate must equal wins / simulations.
func TestAnalyzeMoveAccountingIntegrity(t *testing.T) {
	var board Board

	board[Rows-1][3] = Red
	board[Rows-2][3] = Yellow
	board[Rows-1][4] = Red

	const sims = 50

	move := AnalyzeMove(&board, 0, Red, sims)

	if move.Simulations != sims {
		t.Fatalf("expected %d simulations, got %d", sims, move.Simulations)
	}

	if move.Wins+move.Losses+move.Draws != sims {
		t.Fatalf(
			"wins+losses+draws must equal simulations: %d+%d+%d != %d",
			move.Wins,
			move.Losses,
			move.Draws,
			sims,
		)
	}

	if want := float64(move.Wins) / float64(sims) * 100; move.WinRate != want {
		t.Fatalf("expected win rate %.2f, got %.2f", want, move.WinRate)
	}

	if move.WinRate < 0 || move.WinRate > 100 {
		t.Fatalf("win rate out of range: %.2f", move.WinRate)
	}
}

// finalScore must follow the exact decision formula.
func TestAnalyzeMoveFinalScoreFormula(t *testing.T) {
	// Neutral move: tier 0, no fork penalty.
	var neutral Board

	neutral[Rows-1][3] = Red
	neutral[Rows-2][3] = Yellow

	const sims = 30

	move := AnalyzeMove(&neutral, 0, Red, sims)

	testBoard := CloneBoard(&neutral)
	DropPiece(&testBoard, 0, Red)

	want := move.WinRate + float64(EvaluateBoard(&testBoard, Red))/10

	if move.FinalScore != want {
		t.Fatalf("expected final score %.2f, got %.2f", want, move.FinalScore)
	}

	// Forcing move: tier 3 dominates.
	var win Board

	win[Rows-1][0] = Red
	win[Rows-1][1] = Red
	win[Rows-1][2] = Red

	if winMove := AnalyzeMove(&win, 3, Red, sims); winMove.FinalScore < 3000 {
		t.Fatalf("expected tier-3 score >= 3000, got %.2f", winMove.FinalScore)
	}
}

// A move that leaves the opponent with a fork gets the -15
// penalty in finalScore.
func TestAnalyzeMoveOpponentForkPenalty(t *testing.T) {
	var board Board

	board[Rows-1][0] = Red
	board[Rows-1][4] = Yellow
	board[Rows-1][5] = Yellow
	board[Rows-2][6] = Yellow
	board[Rows-3][6] = Yellow

	const sims = 20

	move := AnalyzeMove(&board, 0, Red, sims)

	if !move.AllowsOpponentFork {
		t.Fatal("expected allowsOpponentFork to be true")
	}

	testBoard := CloneBoard(&board)
	DropPiece(&testBoard, 0, Red)

	want := move.WinRate + float64(EvaluateBoard(&testBoard, Red))/10 - 15

	if move.FinalScore != want {
		t.Fatalf("expected final score %.2f, got %.2f", want, move.FinalScore)
	}
}

// One legal move means exactly one analysis entry.
func TestAnalyzePositionOneLegalMove(t *testing.T) {
	var board Board

	for col := 0; col < Columns; col++ {
		if col != 3 {
			board[0][col] = Red
		}
	}

	analysis := AnalyzePosition(&board, Red, 10)

	if len(analysis) != 1 {
		t.Fatalf("expected 1 analysis entry, got %d", len(analysis))
	}

	if analysis[0].Column != 3 {
		t.Fatalf("expected column 3, got %d", analysis[0].Column)
	}
}

// A completely full board produces no analysis.
func TestAnalyzePositionFullBoard(t *testing.T) {
	var board Board

	for col := 0; col < Columns; col++ {
		for row := 0; row < Rows; row++ {
			board[row][col] = Red
		}
	}

	analysis := AnalyzePosition(&board, Red, 10)

	if len(analysis) != 0 {
		t.Fatalf("expected no analysis, got %d", len(analysis))
	}
}