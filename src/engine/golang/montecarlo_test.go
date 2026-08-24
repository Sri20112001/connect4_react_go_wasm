package main

import "testing"

func TestRunMonteCarloBestMoveAndResults(t *testing.T) {
	var board Board

	const sims = 50

	result := RunMonteCarlo(&board, MonteCarloOptions{SimulationsPerMove: sims, Player: Red})

	if result.BestMove < 0 || result.BestMove >= Columns {
		t.Fatalf("invalid best move %d", result.BestMove)
	}

	if len(result.Results) != Columns {
		t.Fatalf("expected %d results, got %d", Columns, len(result.Results))
	}

	if result.TotalSimulations != Columns*sims {
		t.Fatalf("expected %d total simulations, got %d", Columns*sims, result.TotalSimulations)
	}

	for _, r := range result.Results {
		if r.Simulations != sims {
			t.Fatalf("column %d expected %d simulations, got %d", r.Column, sims, r.Simulations)
		}

		if r.Wins+r.Losses+r.Draws != sims {
			t.Fatalf("column %d accounting broken: %d+%d+%d != %d", r.Column, r.Wins, r.Losses, r.Draws, sims)
		}
	}
}

func TestRunMonteCarloForcingOmitsResults(t *testing.T) {
	var board Board

	board[Rows-1][0] = Red
	board[Rows-1][1] = Red
	board[Rows-1][2] = Red

	result := RunMonteCarlo(&board, MonteCarloOptions{SimulationsPerMove: 100, Player: Red})

	if result.BestMove != 3 {
		t.Fatalf("expected best move 3, got %d", result.BestMove)
	}

	if len(result.Results) != 0 {
		t.Fatalf("forcing moves must omit results, got %d", len(result.Results))
	}

	if result.TotalSimulations != 0 {
		t.Fatalf("forcing moves must not simulate, got %d", result.TotalSimulations)
	}
}

func TestRunMonteCarloFullBoard(t *testing.T) {
	var board Board

	for col := 0; col < Columns; col++ {
		for row := 0; row < Rows; row++ {
			board[row][col] = Red
		}
	}

	result := RunMonteCarlo(&board, MonteCarloOptions{SimulationsPerMove: 10, Player: Red})

	if result.BestMove != -1 {
		t.Fatalf("expected best move -1, got %d", result.BestMove)
	}

	if len(result.Results) != 0 {
		t.Fatalf("expected no results, got %d", len(result.Results))
	}
}

func TestRunMonteCarloPlayerCannotBeEmpty(t *testing.T) {
	defer func() {
		if recover() == nil {
			t.Fatal("expected panic for empty player")
		}
	}()

	var board Board

	RunMonteCarlo(&board, MonteCarloOptions{SimulationsPerMove: 10, Player: Empty})
}

func TestRunMonteCarloBestMoveMatchesAnalysis(t *testing.T) {
	var board Board

	board[Rows-1][3] = Red
	board[Rows-2][3] = Yellow
	board[Rows-1][4] = Red

	const sims = 40

	result := RunMonteCarlo(&board, MonteCarloOptions{SimulationsPerMove: sims, Player: Red})

	analysis := AnalyzePosition(&board, Red, sims)

	if result.BestMove != analysis[0].Column {
		t.Fatalf("best move %d does not match analysis %d", result.BestMove, analysis[0].Column)
	}
}