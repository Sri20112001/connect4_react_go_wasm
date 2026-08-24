package main

// FindForkingMove returns the first column where player can
// create a fork: a move that produces two or more immediate
// winning moves in different columns.
//
// The opponent can block at most one of those winning moves,
// so the player is guaranteed to win on their next move.
//
// Returns -1 if no forking move exists.
func FindForkingMove(board *Board, player Player) int {
	for _, column := range GetAvailableColumns(board) {
		testBoard := *board

		if DropPiece(&testBoard, column, player) < 0 {
			continue
		}

		if CountImmediateWinningMoves(&testBoard, player) >= 2 {
			return column
		}
	}

	return -1
}