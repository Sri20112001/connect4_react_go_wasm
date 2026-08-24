package main

import (
	"math"
	"sort"
)

// This file is a behavior-preserving port of the JavaScript
// analysis layer:
//
//   src/engine/javascript/analysis/types.ts
//   src/engine/javascript/analysis/analyzeMove.ts
//   src/engine/javascript/analysis/analyzePosition.ts
//
// MoveAnalysis holds the full decision data for one candidate
// column, mirroring the TypeScript MoveAnalysis type.
type MoveAnalysis struct {
	Column              int
	Legal               bool
	Simulations         int
	Wins                int
	Losses              int
	Draws               int
	WinRate             float64
	IsImmediateWin      bool
	BlocksImmediateLoss bool
	CreatesFork         bool
	AllowsOpponentFork  bool
	EvaluationScore     int
	FinalScore          float64
}

// AnalyzeMove analyzes a single candidate move for player.
//
// The win/loss counting is from player's perspective: after
// player drops a piece it is the opponent's turn, so a
// simulation where the opponent (aiPlayer) wins is a LOSS for
// player, and vice versa. This deliberately matches the
// corrected JavaScript semantics; the old inverted counting
// must not be reintroduced.
func AnalyzeMove(board *Board, column int, player Player, simulationsPerMove int) MoveAnalysis {
	opponent := opponentOf(player)

	legal := false

	for _, available := range GetAvailableColumns(board) {
		if available == column {
			legal = true
			break
		}
	}

	testBoard := CloneBoard(board)

	row := DropPiece(&testBoard, column, player)

	playable := legal && row >= 0

	isImmediateWin := playable && checkWinnerAt(&testBoard, row, column, player)

	blocksImmediateLoss := playable && FindImmediateWinningMove(board, opponent) == column

	createsFork := playable &&
		FindImmediateWinningMove(&testBoard, opponent) == -1 &&
		CountImmediateWinningMoves(&testBoard, player) >= 2

	allowsOpponentFork := playable && FindForkingMove(&testBoard, opponent) != -1

	evaluationScore := 0

	if playable {
		evaluationScore = EvaluateBoard(&testBoard, player)
	}

	simulations := 0
	wins := 0
	losses := 0
	draws := 0

	shouldSimulate := playable &&
		simulationsPerMove > 0 &&
		!isImmediateWin &&
		!blocksImmediateLoss &&
		!createsFork

	if shouldSimulate {
		for i := 0; i < simulationsPerMove; i++ {
			simulationBoard := CloneBoard(board)

			DropPiece(&simulationBoard, column, player)

			switch SimulateGame(&simulationBoard, opponent) {
			case SimulationWin:
				// The opponent (aiPlayer) won.
				losses++
			case SimulationLoss:
				// Our player won.
				wins++
			case SimulationDraw:
				draws++
			}
		}

		simulations = simulationsPerMove
	}

	winRate := 0.0

	if simulations > 0 {
		winRate = float64(wins) / float64(simulations) * 100
	}

	// Forcing moves are ranked in strict priority order so the
	// engine never skips a win or a block:
	//
	//   immediate win (3) > forced block (2) > fork (1) > Monte Carlo (0)
	tier := 0

	if isImmediateWin {
		tier = 3
	} else if blocksImmediateLoss {
		tier = 2
	} else if createsFork {
		tier = 1
	}

	var finalScore float64

	if playable {
		finalScore = float64(tier)*1000 + winRate + float64(evaluationScore)/10

		if allowsOpponentFork {
			finalScore -= 15
		}
	} else {
		finalScore = math.Inf(-1)
	}

	return MoveAnalysis{
		Column:              column,
		Legal:               legal,
		Simulations:         simulations,
		Wins:                wins,
		Losses:              losses,
		Draws:               draws,
		WinRate:             winRate,
		IsImmediateWin:      isImmediateWin,
		BlocksImmediateLoss: blocksImmediateLoss,
		CreatesFork:         createsFork,
		AllowsOpponentFork:  allowsOpponentFork,
		EvaluationScore:     evaluationScore,
		FinalScore:          finalScore,
	}
}

// AnalyzePosition analyzes every legal move for player and
// returns them sorted best to worst, so the caller can simply
// take analysis[0].
//
// When the position is forcing (an immediate win, a forced
// block, or a fork is available) the simulation budget is
// skipped entirely and the forcing move is ranked first by its
// priority tier.
//
// The sort is stable so that moves with equal final scores
// keep their ascending column order, matching the JavaScript
// stable sort behavior.
func AnalyzePosition(board *Board, player Player, simulationsPerMove int) []MoveAnalysis {
	opponent := opponentOf(player)

	immediateWinColumn := FindImmediateWinningMove(board, player)

	opponentWinColumn := FindImmediateWinningMove(board, opponent)

	forkingColumn := -1

	if opponentWinColumn == -1 {
		forkingColumn = FindForkingMove(board, player)
	}

	forcing := immediateWinColumn != -1 ||
		opponentWinColumn != -1 ||
		forkingColumn != -1

	simulations := simulationsPerMove

	if forcing {
		simulations = 0
	}

	availableColumns := GetAvailableColumns(board)

	analysis := make([]MoveAnalysis, 0, len(availableColumns))

	for _, column := range availableColumns {
		analysis = append(analysis, AnalyzeMove(board, column, player, simulations))
	}

	sort.SliceStable(analysis, func(i, j int) bool {
		return analysis[i].FinalScore > analysis[j].FinalScore
	})

	return analysis
}