package main

import "testing"

// Rollout policy priority: immediate win first.
func TestChooseRolloutMoveImmediateWin(t *testing.T) {
	var board Board

	board[Rows-1][0] = Red
	board[Rows-1][1] = Red
	board[Rows-1][2] = Red

	if move := chooseRolloutMove(&board, Red); move != 3 {
		t.Fatalf("expected win at column 3, got %d", move)
	}
}

// Rollout policy priority: block the opponent's immediate win.
func TestChooseRolloutMoveBlocks(t *testing.T) {
	var board Board

	board[Rows-1][0] = Yellow
	board[Rows-1][1] = Yellow
	board[Rows-1][2] = Yellow

	if move := chooseRolloutMove(&board, Red); move != 3 {
		t.Fatalf("expected block at column 3, got %d", move)
	}
}

// Rollout policy priority: take a fork when no immediate win
// or block exists and the fork does not hand over a win.
func TestChooseRolloutMoveTakesFork(t *testing.T) {
	var board Board

	board[Rows-1][0] = Red
	board[Rows-1][1] = Red
	board[Rows-2][2] = Red
	board[Rows-3][2] = Red

	if move := chooseRolloutMove(&board, Red); move != 2 {
		t.Fatalf("expected fork at column 2, got %d", move)
	}
}

// A candidate move that leaves the opponent with an immediate
// winning move must be rejected outright.
func TestScoreCandidateMoveSkipsImmediateLoss(t *testing.T) {
	var board Board

	board[Rows-1][0] = Yellow
	board[Rows-1][1] = Yellow
	board[Rows-1][2] = Yellow

	if _, ok := scoreCandidateMove(&board, Red, 4); ok {
		t.Fatal("column 4 leaves Yellow's win open and must be rejected")
	}

	if _, ok := scoreCandidateMove(&board, Red, 3); !ok {
		t.Fatal("column 3 blocks Yellow's win and must be allowed")
	}
}

// Creating two immediate winning moves earns the +500 bonus.
func TestScoreCandidateMoveForkBonus(t *testing.T) {
	var board Board

	board[Rows-1][0] = Red
	board[Rows-1][1] = Red
	board[Rows-2][2] = Red
	board[Rows-3][2] = Red

	after := CloneBoard(&board)
	DropPiece(&after, 2, Red)

	score, ok := scoreCandidateMove(&board, Red, 2)

	if !ok {
		t.Fatal("column 2 should be a legal candidate")
	}

	if want := EvaluateBoard(&after, Red) + 500; score != want {
		t.Fatalf("expected %d (with +500 fork bonus), got %d", want, score)
	}
}

// Moves that leave the opponent with a fork are penalized by
// 150; moves that block the opponent's fork are not.
func TestScoreCandidateMovePenalizesOpponentFork(t *testing.T) {
	var board Board

	board[Rows-1][0] = Red
	board[Rows-1][4] = Yellow
	board[Rows-1][5] = Yellow
	board[Rows-2][6] = Yellow
	board[Rows-3][6] = Yellow

	// Column 6 blocks Yellow's fork: no penalty.
	afterBlock := CloneBoard(&board)
	DropPiece(&afterBlock, 6, Red)

	scoreBlock, ok := scoreCandidateMove(&board, Red, 6)

	if !ok {
		t.Fatal("column 6 should be a legal candidate")
	}

	if want := EvaluateBoard(&afterBlock, Red); scoreBlock != want {
		t.Fatalf("expected %d (no penalty), got %d", want, scoreBlock)
	}

	// Column 0 leaves Yellow's fork intact: -150 penalty.
	afterFork := CloneBoard(&board)
	DropPiece(&afterFork, 0, Red)

	scoreFork, ok := scoreCandidateMove(&board, Red, 0)

	if !ok {
		t.Fatal("column 0 should be a legal candidate")
	}

	if want := EvaluateBoard(&afterFork, Red) - 150; scoreFork != want {
		t.Fatalf("expected %d (with -150 penalty), got %d", want, scoreFork)
	}
}

// Terminal win from the requested player's perspective.
func TestSimulateGameWinPerspective(t *testing.T) {
	var board Board

	board[Rows-1][0] = Red
	board[Rows-1][1] = Red
	board[Rows-1][2] = Red

	if result := SimulateGame(&board, Red); result != SimulationWin {
		t.Fatalf("expected win, got %s", result)
	}
}

// Terminal loss from the requested player's perspective: Red
// must block Yellow's vertical three in column 2, after which
// Yellow completes its other vertical three in column 5 and
// wins.
func TestSimulateGameLossPerspective(t *testing.T) {
	var board Board

	// Yellow has two vertical threes.
	board[Rows-1][2] = Yellow
	board[Rows-2][2] = Yellow
	board[Rows-3][2] = Yellow

	board[Rows-1][5] = Yellow
	board[Rows-2][5] = Yellow
	board[Rows-3][5] = Yellow

	if result := SimulateGame(&board, Red); result != SimulationLoss {
		t.Fatalf("expected loss, got %s", result)
	}
}

// A full board produces a draw. SimulateGame has no entry
// winner check (matching the JS), so the draw path is reached
// as soon as no column is available.
func TestSimulateGameFullBoardDraw(t *testing.T) {
	var board Board

	for col := 0; col < Columns; col++ {
		for row := 0; row < Rows; row++ {
			board[row][col] = Red
		}
	}

	if result := SimulateGame(&board, Red); result != SimulationDraw {
		t.Fatalf("expected draw, got %s", result)
	}
}

// Every rollout must terminate with a valid result.
func TestSimulateGameRolloutTerminates(t *testing.T) {
	for i := 0; i < 200; i++ {
		var board Board

		result := SimulateGame(&board, Red)

		switch result {
		case SimulationWin, SimulationLoss, SimulationDraw:
		default:
			t.Fatalf("unexpected result %q", result)
		}
	}
}

// The initial board must never be mutated.
func TestSimulateGameDoesNotMutate(t *testing.T) {
	var board Board

	board[Rows-1][0] = Red
	board[Rows-1][1] = Yellow
	board[Rows-1][2] = Red
	board[Rows-2][3] = Yellow

	original := board

	SimulateGame(&board, Red)

	if board != original {
		t.Fatal("SimulateGame mutated the original board")
	}
}