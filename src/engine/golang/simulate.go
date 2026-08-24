package main

import "math/rand"

// This file is a behavior-preserving port of
// src/engine/javascript/simulateGame.ts.
//
// The rollout policy priority is preserved exactly:
//
//  1. Immediate winning move
//  2. Block opponent's immediate winning move
//  3. Create a fork (if it does not hand the opponent a win)
//  4. Heuristic-weighted move selection
//  5. Center-biased random selection as a fallback
//
// Do not improve the policy here. Phase 14 is parity, not
// optimization.

type SimulationOutcome string

const (
	SimulationWin  SimulationOutcome = "win"
	SimulationLoss SimulationOutcome = "loss"
	SimulationDraw SimulationOutcome = "draw"
)

func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}

// chooseWeightedRandomColumn picks a column with a center bias:
// weight = 4 - |3 - column|, matching the JS Math.random() roll.
func chooseWeightedRandomColumn(availableColumns []int) int {
	totalWeight := 0

	for _, column := range availableColumns {
		totalWeight += 4 - abs(Columns/2-column)
	}

	random := rand.Float64() * float64(totalWeight)

	for _, column := range availableColumns {
		random -= float64(4 - abs(Columns/2-column))

		if random < 0 {
			return column
		}
	}

	return availableColumns[len(availableColumns)-1]
}

// scoreCandidateMove evaluates one heuristic candidate:
// the score after dropping `column` for `player`, plus the
// tactical bonuses and penalties. The second return value is
// false when the move immediately hands the opponent a win.
func scoreCandidateMove(board *Board, player Player, column int) (int, bool) {
	opponent := opponentOf(player)

	testBoard := CloneBoard(board)

	if DropPiece(&testBoard, column, player) < 0 {
		return 0, false
	}

	// Never choose a move that immediately allows the
	// opponent to win.
	if FindImmediateWinningMove(&testBoard, opponent) != -1 {
		return 0, false
	}

	winningMoves := CountImmediateWinningMoves(&testBoard, player)

	score := EvaluateBoard(&testBoard, player)

	if winningMoves >= 2 {
		score += 500
	}

	// Strongly prefer moves that do not hand the opponent
	// a fork on their next move.
	if FindForkingMove(&testBoard, opponent) != -1 {
		score -= 150
	}

	return score, true
}

// chooseHeuristicWeightedColumn scores every legal column and
// picks one with weight proportional to (score - minScore + 1).
func chooseHeuristicWeightedColumn(board *Board, player Player, availableColumns []int) int {
	if player == Empty || len(availableColumns) == 0 {
		return -1
	}

	type candidate struct {
		column int
		score  int
	}

	candidates := make([]candidate, 0, len(availableColumns))

	for _, column := range availableColumns {
		score, ok := scoreCandidateMove(board, player, column)

		if !ok {
			continue
		}

		candidates = append(candidates, candidate{column: column, score: score})
	}

	// Every move loses immediately. Keep the original
	// available moves as a fallback.
	if len(candidates) == 0 {
		return chooseWeightedRandomColumn(availableColumns)
	}

	minScore := candidates[0].score

	for _, c := range candidates {
		if c.score < minScore {
			minScore = c.score
		}
	}

	totalWeight := 0

	for _, c := range candidates {
		totalWeight += c.score - minScore + 1
	}

	random := rand.Float64() * float64(totalWeight)

	for _, c := range candidates {
		random -= float64(c.score - minScore + 1)

		if random < 0 {
			return c.column
		}
	}

	return candidates[len(candidates)-1].column
}

// chooseRolloutMove picks the move for one half-move of the
// rollout using the policy priority documented at the top of
// this file. Returns -1 when no column is available.
func chooseRolloutMove(board *Board, player Player) int {
	if player == Empty {
		return -1
	}

	// 1. Can I win immediately?
	if winningMove := FindImmediateWinningMove(board, player); winningMove != -1 {
		return winningMove
	}

	// 2. Can my opponent win immediately?
	opponent := opponentOf(player)

	if blockingMove := FindImmediateWinningMove(board, opponent); blockingMove != -1 {
		return blockingMove
	}

	// 2.5. Can I create a fork?
	if forkingMove := FindForkingMove(board, player); forkingMove != -1 {
		forkBoard := CloneBoard(board)

		DropPiece(&forkBoard, forkingMove, player)

		// Only play the fork if it doesn't hand the opponent
		// an immediate winning move in the process.
		if FindImmediateWinningMove(&forkBoard, opponent) == -1 {
			return forkingMove
		}
	}

	// 3. Otherwise use the heuristic with center bias.
	availableColumns := GetAvailableColumns(board)

	if len(availableColumns) == 0 {
		return -1
	}

	return chooseHeuristicWeightedColumn(board, player, availableColumns)
}

// SimulateGame plays a full game from initialBoard with
// aiPlayer moving first, returning the result from aiPlayer's
// perspective:
//
//	player wins  → SimulationWin
//	opponent wins → SimulationLoss
//	board fills  → SimulationDraw
//
// The initial board is never mutated.
func SimulateGame(initialBoard *Board, aiPlayer Player) SimulationOutcome {
	if aiPlayer == Empty {
		panic("AI player cannot be empty")
	}

	board := CloneBoard(initialBoard)

	currentPlayer := aiPlayer

	for {
		column := chooseRolloutMove(&board, currentPlayer)

		if column == -1 {
			return SimulationDraw
		}

		if DropPiece(&board, column, currentPlayer) < 0 {
			continue
		}

		if CheckWinner(&board, currentPlayer) {
			if currentPlayer == aiPlayer {
				return SimulationWin
			}

			return SimulationLoss
		}

		currentPlayer = opponentOf(currentPlayer)
	}
}