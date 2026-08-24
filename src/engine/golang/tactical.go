package main

// FindImmediateWinningMove returns the first column where player
// can win immediately. Returns -1 if no such move exists.
func FindImmediateWinningMove(board *Board, player Player) int {
	columns := GetAvailableColumns(board)

	for _, column := range columns {
		testBoard := *board

		row := DropPiece(&testBoard, column, player)

		if row < 0 {
			continue
		}

		if checkWinnerAt(&testBoard, row, column, player) {
			return column
		}
	}

	return -1
}

// FindBlockingMove returns the first column where the opponent
// has an immediate winning move. Returns -1 if no block is needed.
func FindBlockingMove(board *Board, player Player) int {
	opponent := Red

	if player == Red {
		opponent = Yellow
	}

	return FindImmediateWinningMove(board, opponent)
}

// CountImmediateWinningMoves returns how many columns give
// player an immediate winning move in the current position.
func CountImmediateWinningMoves(board *Board, player Player) int {
	count := 0

	for _, column := range GetAvailableColumns(board) {
		testBoard := *board

		row := DropPiece(&testBoard, column, player)

		if row < 0 {
			continue
		}

		if countWinningLines(&testBoard, row, column, player) > 0 {
			count++
		}
	}

	return count
}
