package main

import "time"

// This file is a behavior-preserving port of
// src/engine/javascript/monteCarlo.ts.
//
// It is the public engine wrapper: AI logic stays in
// analysis.go / simulate.go / evaluate.go, and the WASM
// boundary lives separately in main.go.

// SimulationResult is the per-move Monte Carlo accounting,
// mirroring the JavaScript SimulationResult type.
type SimulationResult struct {
	Column      int
	Simulations int
	Wins        int
	Losses      int
	Draws       int
	WinRate     float64
}

// MonteCarloOptions mirrors the JavaScript MonteCarloOptions.
type MonteCarloOptions struct {
	SimulationsPerMove int
	Player             Player
}

// MonteCarloResult mirrors the JavaScript MonteCarloResult,
// plus the full analysis of the chosen move so the WASM
// boundary can return an AIEngine-compatible MoveAnalysis.
type MonteCarloResult struct {
	BestMove             int
	BestAnalysis         *MoveAnalysis
	Results              []SimulationResult
	ExecutionTime        float64 // milliseconds
	TotalSimulations     int
	SimulationsPerSecond float64
}

// RunMonteCarlo analyzes the position and returns the best
// move plus the per-column simulation results.
//
// When the best move is forcing (an immediate win, a forced
// block, or a fork), the results list is empty because the
// simulation budget was skipped.
func RunMonteCarlo(board *Board, options MonteCarloOptions) MonteCarloResult {
	start := time.Now()

	if options.Player == Empty {
		panic("Player cannot be empty")
	}

	analysis := AnalyzePosition(board, options.Player, options.SimulationsPerMove)

	bestMove := -1

	var bestAnalysis *MoveAnalysis

	if len(analysis) > 0 {
		bestMove = analysis[0].Column
		bestAnalysis = &analysis[0]
	}

	forcing := false

	if len(analysis) > 0 {
		selected := analysis[0]

		forcing = selected.IsImmediateWin ||
			selected.BlocksImmediateLoss ||
			selected.CreatesFork
	}

	executionTime := float64(time.Since(start).Microseconds()) / 1000.0

	totalSimulations := 0

	for _, result := range analysis {
		totalSimulations += result.Simulations
	}

	simulationsPerSecond := 0.0

	if totalSimulations > 0 && executionTime > 0 {
		simulationsPerSecond = float64(totalSimulations) / (executionTime / 1000)
	}

	results := []SimulationResult{}

	if !forcing {
		for _, result := range analysis {
			results = append(results, SimulationResult{
				Column:      result.Column,
				Simulations: result.Simulations,
				Wins:        result.Wins,
				Losses:      result.Losses,
				Draws:       result.Draws,
				WinRate:     result.WinRate,
			})
		}
	}

	return MonteCarloResult{
		BestMove:             bestMove,
		BestAnalysis:         bestAnalysis,
		Results:              results,
		ExecutionTime:        executionTime,
		TotalSimulations:     totalSimulations,
		SimulationsPerSecond: simulationsPerSecond,
	}
}