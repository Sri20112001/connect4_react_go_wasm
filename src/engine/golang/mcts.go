package main

import (
	"math"
	"math/rand"
	"time"
)

// MCTSResult is the result of a Monte Carlo Tree Search.
type MCTSResult struct {
	BestMove         int
	Visits           map[int]int
	Wins             map[int]float64
	ExecutionTime    float64
	TotalSimulations int
}

// mctsNode is a node in the MCTS tree.
type mctsNode struct {
	board        Board
	player       Player
	move         int
	parent       *mctsNode
	children     map[int]*mctsNode
	visits       int
	wins         float64
	untriedMoves []int
	isTerminal   bool
	winner       Player
}

func newMCTSNode(board Board, player Player, move int, parent *mctsNode) *mctsNode {
	available := GetAvailableColumns(&board)
	// Shuffle to avoid bias
	for i := len(available) - 1; i > 0; i-- {
		j := rand.Intn(i + 1)
		available[i], available[j] = available[j], available[i]
	}
	return &mctsNode{
		board:        board,
		player:       player,
		move:         move,
		parent:       parent,
		children:     make(map[int]*mctsNode),
		untriedMoves: available,
		isTerminal:   false,
		winner:       Empty,
	}
}

func mctsOpponentOf(p Player) Player {
	if p == Red {
		return Yellow
	}
	return Red
}

func mctsIsBoardFull(board *Board) bool {
	return len(GetAvailableColumns(board)) == 0
}

func mctsRollout(board Board, playerToMove Player, rootPlayer Player) SimulationOutcome {
	b := CloneBoard(&board)
	current := playerToMove
	for {
		col := chooseRolloutMove(&b, current)
		if col == -1 {
			return SimulationDraw
		}
		row := DropPiece(&b, col, current)
		if row < 0 {
			if mctsIsBoardFull(&b) {
				return SimulationDraw
			}
			continue
		}
		if checkWinnerAt(&b, row, col, current) {
			if current == rootPlayer {
				return SimulationWin
			}
			return SimulationLoss
		}
		if mctsIsBoardFull(&b) {
			return SimulationDraw
		}
		current = mctsOpponentOf(current)
	}
}

func mctsUCT(child *mctsNode, parentVisits int, c float64) float64 {
	if child.visits == 0 {
		return math.Inf(1)
	}
	exploitation := child.wins / float64(child.visits)
	exploration := c * math.Sqrt(math.Log(float64(parentVisits))/float64(child.visits))
	return exploitation + exploration
}

func mctsSelectBestChild(node *mctsNode, c float64) *mctsNode {
	var best *mctsNode
	bestVal := math.Inf(-1)
	for _, child := range node.children {
		v := mctsUCT(child, node.visits, c)
		if v > bestVal {
			bestVal = v
			best = child
		}
	}
	return best
}

// RunMCTS runs Monte Carlo Tree Search from board with player to move.
// iterations is the number of MCTS iterations (simulations).
// explorationConstant controls UCT exploration (sqrt(2) ≈ 1.414 is typical).
func RunMCTS(board *Board, player Player, iterations int, explorationConstant float64) MCTSResult {
	start := time.Now()

	if player == Empty {
		return MCTSResult{BestMove: -1, Visits: make(map[int]int), Wins: make(map[int]float64)}
	}

	available := GetAvailableColumns(board)
	if len(available) == 0 {
		return MCTSResult{BestMove: -1, Visits: make(map[int]int), Wins: make(map[int]float64)}
	}

	if explorationConstant <= 0 {
		explorationConstant = math.Sqrt(2)
	}

	// Fast path: immediate win
	if immediateWin := FindImmediateWinningMove(board, player); immediateWin != -1 {
		execTime := float64(time.Since(start).Microseconds()) / 1000.0
		visits := map[int]int{immediateWin: iterations}
		wins := map[int]float64{immediateWin: float64(iterations)}
		return MCTSResult{BestMove: immediateWin, Visits: visits, Wins: wins, ExecutionTime: execTime, TotalSimulations: iterations}
	}

	rootBoard := CloneBoard(board)
	root := newMCTSNode(rootBoard, player, -1, nil)

	for i := 0; i < iterations; i++ {
		node := root

		// Selection
		for len(node.untriedMoves) == 0 && len(node.children) > 0 && !node.isTerminal {
			node = mctsSelectBestChild(node, explorationConstant)
		}

		// Expansion
		nodeToSimulate := node
		if !node.isTerminal && len(node.untriedMoves) > 0 {
			move := node.untriedMoves[len(node.untriedMoves)-1]
			node.untriedMoves = node.untriedMoves[:len(node.untriedMoves)-1]

			newBoard := CloneBoard(&node.board)
			row := DropPiece(&newBoard, move, node.player)

			isTerminal := false
			var winner Player = Empty
			if row >= 0 && checkWinnerAt(&newBoard, row, move, node.player) {
				isTerminal = true
				winner = node.player
			} else if mctsIsBoardFull(&newBoard) {
				isTerminal = true
				winner = Empty
			}

			child := newMCTSNode(newBoard, mctsOpponentOf(node.player), move, node)
			child.isTerminal = isTerminal
			child.winner = winner
			node.children[move] = child
			nodeToSimulate = child
		}

		// Simulation
		var result SimulationOutcome
		if nodeToSimulate.isTerminal {
			if nodeToSimulate.winner == player {
				result = SimulationWin
			} else if nodeToSimulate.winner == Empty {
				result = SimulationDraw
			} else {
				result = SimulationLoss
			}
		} else {
			result = mctsRollout(nodeToSimulate.board, nodeToSimulate.player, player)
		}

		// Backpropagation
		for cur := nodeToSimulate; cur != nil; cur = cur.parent {
			cur.visits++
			if result == SimulationWin {
				cur.wins += 1
			} else if result == SimulationDraw {
				cur.wins += 0.5
			}
		}
	}

	// Pick best child by visits, tie by win rate then column asc
	bestMove := -1
	bestVisits := -1
	bestWinRate := -1.0
	for move, child := range root.children {
		winRate := 0.0
		if child.visits > 0 {
			winRate = child.wins / float64(child.visits)
		}
		if child.visits > bestVisits || (child.visits == bestVisits && winRate > bestWinRate) || (child.visits == bestVisits && winRate == bestWinRate && (bestMove == -1 || move < bestMove)) {
			bestVisits = child.visits
			bestWinRate = winRate
			bestMove = move
		}
	}
	if bestMove == -1 && len(available) > 0 {
		bestMove = available[0]
	}

	visits := make(map[int]int)
	wins := make(map[int]float64)
	for m, child := range root.children {
		visits[m] = child.visits
		wins[m] = child.wins
	}

	execTime := float64(time.Since(start).Microseconds()) / 1000.0
	return MCTSResult{BestMove: bestMove, Visits: visits, Wins: wins, ExecutionTime: execTime, TotalSimulations: iterations}
}
