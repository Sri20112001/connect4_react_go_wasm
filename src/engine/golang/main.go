//go:build js && wasm

package main

import (
	"fmt"
	"syscall/js"
)

// main registers the WASM API and blocks forever.
//
// The AI stays a pure Go library (board.go ... montecarlo.go);
// this file is only the adapter between JavaScript values and
// Go values. On invalid input it panics with a js.Error so the
// JavaScript caller receives a thrown error with a useful
// message.
func main() {
	js.Global().Set(
		"connect4WasmReady",
		js.FuncOf(func(
			this js.Value,
			args []js.Value,
		) interface{} {
			return true
		}),
	)

	js.Global().Set(
		"connect4RunMonteCarlo",
		js.FuncOf(connect4RunMonteCarlo),
	)

	js.Global().Set(
		"connect4RunMCTS",
		js.FuncOf(connect4RunMCTS),
	)

	<-make(chan struct{})
}

// connect4RunMonteCarlo is the single public entry point:
//
//	window.connect4RunMonteCarlo({
//	  board: (null | "red" | "yellow")[6][7],
//	  player: "red" | "yellow",
//	  simulationsPerMove: number,
//	})
//
// It returns a MonteCarloResult-shaped object plus the full
// analysis of the chosen move.
func connect4RunMonteCarlo(this js.Value, args []js.Value) interface{} {
	options := readOptions(args)

	cells, err := jsToCells(options.board)
	if err != nil {
		throwError("%s", err)
	}

	board, err := parseCells(cells)
	if err != nil {
		throwError("%s", err)
	}

	player, err := parsePlayer(options.player)
	if err != nil {
		throwError("%s", err)
	}

	if options.simulationsPerMove < 0 {
		throwError(
			"simulationsPerMove must be >= 0, got %d",
			options.simulationsPerMove,
		)
	}

	result := RunMonteCarlo(&board, MonteCarloOptions{
		SimulationsPerMove: options.simulationsPerMove,
		Player:             player,
	})

	return resultToJS(result)
}

// wasmOptions is the subset of the JS options object that the
// engine needs, extracted without validation.
type wasmOptions struct {
	board              js.Value
	player             string
	simulationsPerMove int
}

// readOptions extracts the fields of the JS options object.
// Missing or malformed values are rejected by the conversion
// functions with a useful message.
func readOptions(args []js.Value) wasmOptions {
	if len(args) != 1 {
		throwError("connect4RunMonteCarlo expects one options object")
	}

	options := args[0]

	if options.Type() != js.TypeObject || options.IsNull() {
		throwError("options must be an object")
	}

	return wasmOptions{
		board:              options.Get("board"),
		player:             options.Get("player").String(),
		simulationsPerMove: options.Get("simulationsPerMove").Int(),
	}
}

// jsToCells reads a 6x7 JavaScript array of cells into the
// string matrix used by parseCells.
func jsToCells(value js.Value) ([][]string, error) {
	if value.IsUndefined() || value.IsNull() || value.Type() != js.TypeObject {
		return nil, fmt.Errorf("board must be a 6x7 array")
	}

	if value.Length() != Rows {
		return nil, fmt.Errorf(
			"board must have %d rows, got %d",
			Rows, value.Length(),
		)
	}

	cells := make([][]string, Rows)

	for row := 0; row < Rows; row++ {
		jsRow := value.Index(row)

		if jsRow.Type() != js.TypeObject || jsRow.IsNull() {
			return nil, fmt.Errorf("board row %d must be an array", row)
		}

		if jsRow.Length() != Columns {
			return nil, fmt.Errorf(
				"board row %d must have %d cells, got %d",
				row, Columns, jsRow.Length(),
			)
		}

		cells[row] = make([]string, Columns)

		for col := 0; col < Columns; col++ {
			cell := jsRow.Index(col)

			switch {
			case cell.IsNull() || cell.IsUndefined():
				cells[row][col] = ""
			case cell.Type() == js.TypeString:
				cells[row][col] = cell.String()
			default:
				return nil, fmt.Errorf(
					"board cell [%d][%d] must be null or a color string",
					row, col,
				)
			}
		}
	}

	return cells, nil
}

// resultToJS serializes a MonteCarloResult into a plain
// JavaScript object matching the TypeScript MonteCarloResult
// type, plus the full MoveAnalysis of the chosen move.
func resultToJS(result MonteCarloResult) js.Value {
	obj := js.Global().Get("Object").New()

	obj.Set("bestMove", result.BestMove)

	if result.BestAnalysis != nil {
		obj.Set("analysis", moveAnalysisToJS(*result.BestAnalysis))
	} else {
		obj.Set("analysis", js.Null())
	}

	results := js.Global().Get("Array").New(len(result.Results))

	for i, r := range result.Results {
		entry := js.Global().Get("Object").New()

		entry.Set("column", r.Column)
		entry.Set("simulations", r.Simulations)
		entry.Set("wins", r.Wins)
		entry.Set("losses", r.Losses)
		entry.Set("draws", r.Draws)
		entry.Set("winRate", r.WinRate)

		results.SetIndex(i, entry)
	}

	obj.Set("results", results)
	obj.Set("executionTime", result.ExecutionTime)
	obj.Set("totalSimulations", result.TotalSimulations)
	obj.Set("simulationsPerSecond", result.SimulationsPerSecond)

	return obj
}

// moveAnalysisToJS serializes a MoveAnalysis into a plain
// JavaScript object matching the TypeScript MoveAnalysis type.
func moveAnalysisToJS(move MoveAnalysis) js.Value {
	obj := js.Global().Get("Object").New()

	obj.Set("column", move.Column)
	obj.Set("legal", move.Legal)
	obj.Set("simulations", move.Simulations)
	obj.Set("wins", move.Wins)
	obj.Set("losses", move.Losses)
	obj.Set("draws", move.Draws)
	obj.Set("winRate", move.WinRate)
	obj.Set("isImmediateWin", move.IsImmediateWin)
	obj.Set("blocksImmediateLoss", move.BlocksImmediateLoss)
	obj.Set("createsFork", move.CreatesFork)
	obj.Set("allowsOpponentFork", move.AllowsOpponentFork)
	obj.Set("evaluationScore", move.EvaluationScore)
	obj.Set("finalScore", move.FinalScore)

	return obj
}

// connect4RunMCTS is the MCTS entry point, mirroring
// connect4RunMonteCarlo but using RunMCTS.
func connect4RunMCTS(this js.Value, args []js.Value) interface{} {
	options := readOptions(args)

	cells, err := jsToCells(options.board)
	if err != nil {
		throwError("%s", err)
	}

	board, err := parseCells(cells)
	if err != nil {
		throwError("%s", err)
	}

	player, err := parsePlayer(options.player)
	if err != nil {
		throwError("%s", err)
	}

	if options.simulationsPerMove < 0 {
		throwError(
			"simulationsPerMove must be >= 0, got %d",
			options.simulationsPerMove,
		)
	}

	result := RunMCTS(&board, player, options.simulationsPerMove, 0)

	return mctsResultToJS(&board, player, result)
}

func mctsResultToJS(board *Board, player Player, result MCTSResult) js.Value {
	obj := js.Global().Get("Object").New()

	obj.Set("bestMove", result.BestMove)

	// Build per-column results from MCTS visits
	results := js.Global().Get("Array").New(len(result.Visits))
	i := 0
	for col, visits := range result.Visits {
		winsF := result.Wins[col]
		wins := int(winsF)
		losses := visits - wins
		winRate := 0.0
		if visits > 0 {
			winRate = winsF / float64(visits) * 100
		}
		entry := js.Global().Get("Object").New()
		entry.Set("column", col)
		entry.Set("simulations", visits)
		entry.Set("wins", wins)
		entry.Set("losses", losses)
		entry.Set("draws", 0)
		entry.Set("winRate", winRate)
		results.SetIndex(i, entry)
		i++
	}
	obj.Set("results", results)
	obj.Set("executionTime", result.ExecutionTime)
	obj.Set("totalSimulations", result.TotalSimulations)
	sps := 0.0
	if result.ExecutionTime > 0 {
		sps = float64(result.TotalSimulations) / (result.ExecutionTime / 1000)
	}
	obj.Set("simulationsPerSecond", sps)

	// Build analysis for best move via AnalyzeMove patched with MCTS stats
	if result.BestMove != -1 {
		base := AnalyzeMove(board, result.BestMove, player, 0)
		if visits, ok := result.Visits[result.BestMove]; ok {
			winsF := result.Wins[result.BestMove]
			base.Simulations = visits
			base.Wins = int(winsF)
			base.Losses = visits - int(winsF)
			base.Draws = 0
			if visits > 0 {
				base.WinRate = winsF / float64(visits) * 100
			}
			// Recompute finalScore with MCTS winRate
			tier := 0
			if base.IsImmediateWin {
				tier = 3
			} else if base.BlocksImmediateLoss {
				tier = 2
			} else if base.CreatesFork {
				tier = 1
			}
			finalScore := float64(tier)*1000 + base.WinRate + float64(base.EvaluationScore)/10
			if base.AllowsOpponentFork {
				finalScore -= 15
			}
			base.FinalScore = finalScore
		}
		obj.Set("analysis", moveAnalysisToJS(base))
	} else {
		obj.Set("analysis", js.Null())
	}

	return obj
}

// throwError panics with a js.Error so the JavaScript caller
// receives a thrown error with a useful message.
func throwError(format string, args ...interface{}) {
	panic(js.Global().Get("Error").New(fmt.Sprintf(format, args...)))
}