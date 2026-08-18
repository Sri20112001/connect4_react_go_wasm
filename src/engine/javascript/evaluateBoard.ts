import type { Board, Player } from "../../types/types";
import { COLUMNS, ROWS } from "../../utilities/CONSTANTS";

/**
 * Evaluates one possible group of 4 cells.
 *
 * Connect 4 is ultimately about creating groups of 4:
 *
 *   Y Y Y .
 *
 *   Y
 *   Y
 *   Y
 *   .
 *
 *   Y . . .
 *   . Y . .
 *   . . Y .
 *   . . . .
 *
 * We assign a score to each group depending on how
 * favorable that group is for the given player.
 */

type WindowCell = {
  value: Player;
  row: number;
  column: number;
};

const evaluateWindow = (
  board: Board,
  window: WindowCell[],
  player: Player,
): number => {
  // There is no player to evaluate.
  if (player === null) {
    return 0;
  }

  // The other player is the opponent.
  const opponent = player === "red" ? "yellow" : "red";

  // Count how many cells belong to the player.
  const playerCount = window.filter((cell) => cell.value === player).length;

  // Count how many cells belong to the opponent.
  const opponentCount = window.filter((cell) => cell.value === opponent).length;

  // Count empty cells in this group of 4.
  const emptyCount = window.filter((cell) => cell.value === null).length;

  const hasPlayableEmptyCell = window.some(
    (cell) =>
      cell.value === null && isPlayableCell(board, cell.row, cell.column),
  );

  /*
   * A complete 4-in-a-row is extremely valuable.
   *
   * Example:
   *
   *   Y Y Y Y
   *
   * This receives +1000 when evaluating Yellow.
   */
  if (playerCount === 4) {
    return 100000;
  }

  /*
   * A complete 4-in-a-row belonging to the opponent
   * is extremely bad for us.
   *
   *   R R R R
   *
   * Therefore we give it a large negative score.
   */
  if (opponentCount === 4) {
    return -100000;
  }

  /*
   * Three of our pieces with one empty space is
   * a very strong position.
   *
   *   Y Y Y .
   *
   * There is a potential winning connection here.
   */
  if (playerCount === 3 && emptyCount === 1) {
    return hasPlayableEmptyCell ? 100 : 20;
  }

  /*
   * Two of our pieces with two empty spaces gives
   * us some potential, but it is weaker than three.
   *
   *   Y Y . .
   */
  if (playerCount === 2 && emptyCount === 2) {
    return 10;
  }

  /*
   * A single piece has only a small amount of
   * immediate strategic value.
   *
   *   Y . . .
   */
  if (playerCount === 1 && emptyCount === 3) {
    return 1;
  }

  /*
   * Three opponent pieces with one empty space is
   * dangerous.
   *
   *   R R R .
   *
   * We therefore penalize this position heavily.
   *
   * Notice that -60 is slightly stronger than our
   * +50 reward for our own three-in-a-row.
   *
   * This encourages the evaluator to respect threats.
   */
  if (opponentCount === 3 && emptyCount === 1) {
    return hasPlayableEmptyCell ? -120 : -20;
  }

  /*
   * Two opponent pieces with two empty spaces are
   * somewhat dangerous, but not immediately critical.
   */
  if (opponentCount === 2 && emptyCount === 2) {
    return -10;
  }

  /*
   * Any other combination isn't considered valuable
   * enough by our current heuristic.
   */
  return 0;
};

/**
 * Evaluates every possible horizontal group of 4.
 *
 * Example:
 *
 *   Y Y . R . . .
 *   └──────┘
 *
 * We slide a 4-cell window across every row.
 */
const evaluateHorizontal = (board: Board, player: Player): number => {
  let score = 0;

  // Visit every row.
  for (let row = 0; row < ROWS; row++) {
    /*
     * A 7-column board has 4 possible starting positions
     * for a group of 4:
     *
     *   0 1 2 3
     *     1 2 3 4
     *       2 3 4 5
     *         3 4 5 6
     *
     * Therefore column <= COLUMNS - 4.
     */
    for (let column = 0; column <= COLUMNS - 4; column++) {
      // Extract 4 consecutive horizontal cells.
      const window: WindowCell[] = [
        {
          value: board[row][column],
          row,
          column,
        },
        {
          value: board[row][column + 1],
          row,
          column: column + 1,
        },
        {
          value: board[row][column + 2],
          row,
          column: column + 2,
        },
        {
          value: board[row][column + 3],
          row,
          column: column + 3,
        },
      ];

      // Evaluate this particular group of 4.
      score += evaluateWindow(board, window, player)
    }
  }

  return score;
};

/**
 * Evaluates every possible vertical group of 4.
 *
 * Example:
 *
 *   Y
 *   Y
 *   Y
 *   .
 *
 * We slide a 4-cell window vertically through every column.
 */
const evaluateVertical = (board: Board, player: Player): number => {
  let score = 0;

  /*
   * We only need rows 0 through ROWS - 4 as starting
   * positions because we need four consecutive rows.
   */
  for (let row = 0; row <= ROWS - 4; row++) {
    // Check every column.
    for (let column = 0; column < COLUMNS; column++) {
      // Extract 4 consecutive vertical cells.
      const window: WindowCell[] = [
        {
          value: board[row][column],
          row,
          column,
        },
        {
          value: board[row + 1][column],
          row: row + 1,
          column,
        },
        {
          value: board[row + 2][column],
          row: row + 2,
          column,
        },
        {
          value: board[row + 3][column],
          row: row + 3,
          column,
        },
      ];

      // Add this window's score to the total.
      score += evaluateWindow(board, window, player)
    }
  }

  return score;
};

/**
 * Evaluates diagonal groups that move down and right.
 *
 * Example:
 *
 *   Y . . .
 *   . Y . .
 *   . . Y .
 *   . . . Y
 *
 * Direction:
 *
 *   row + 1
 *   column + 1
 */
const evaluateDiagonalDown = (board: Board, player: Player): number => {
  let score = 0;

  /*
   * Both row and column need enough remaining space
   * for four cells.
   */
  for (let row = 0; row <= ROWS - 4; row++) {
    for (let column = 0; column <= COLUMNS - 4; column++) {
      // Extract the diagonal group.
      const window: WindowCell[] = [
        {
          value: board[row][column],
          row,
          column,
        },
        {
          value: board[row + 1][column + 1],
          row: row + 1,
          column: column + 1,
        },
        {
          value: board[row + 2][column + 2],
          row: row + 2,
          column: column + 2,
        },
        {
          value: board[row + 3][column + 3],
          row: row + 3,
          column: column + 3,
        },
      ];
      // Add its value to the overall score.
      score += evaluateWindow(board, window, player)
    }
  }

  return score;
};

/**
 * Evaluates diagonal groups that move up and right.
 *
 * Example:
 *
 *   . . . Y
 *   . . Y .
 *   . Y . .
 *   Y . . .
 *
 * Direction:
 *
 *   row - 1
 *   column + 1
 */
const evaluateDiagonalUp = (board: Board, player: Player): number => {
  let score = 0;

  /*
   * We start at row 3 because we need to be able to
   * move upward three times:
   *
   * row
   * row - 1
   * row - 2
   * row - 3
   */
  for (let row = 3; row < ROWS; row++) {
    for (let column = 0; column <= COLUMNS - 4; column++) {
      // Extract the diagonal group.
      const window: WindowCell[] = [
        {
          value: board[row][column],
          row,
          column,
        },
        {
          value: board[row - 1][column + 1],
          row: row - 1,
          column: column + 1,
        },
        {
          value: board[row - 2][column + 2],
          row: row - 2,
          column: column + 2,
        },
        {
          value: board[row - 3][column + 3],
          row: row - 3,
          column: column + 3,
        },
      ];

      // Add its value to the overall score.
      score += evaluateWindow(board, window, player)
    }
  }

  return score;
};

/**
 * Evaluates control of the center column.
 *
 * Connect 4 has 7 columns:
 *
 *   0 1 2 3 4 5 6
 *         ↑
 *       center
 *
 * The center column participates in more possible
 * connections, so controlling it is strategically useful.
 */
const evaluateCenterControl = (board: Board, player: Player): number => {
  if (player === null) {
    return 0;
  }

  let score = 0;

  // Column 3 is the center of a 7-column board.
  const centerColumn = Math.floor(COLUMNS / 2);

  // Check every row in the center column.
  for (let row = 0; row < ROWS; row++) {
    if (board[row][centerColumn] === player) {
      // Give one point for each of our pieces in the center.
      score++;
    }
  }

  return score;
};

const isPlayableCell = (
  board: Board,
  row: number,
  column: number,
): boolean => {
  if (
    row < 0 ||
    row >= ROWS ||
    column < 0 ||
    column >= COLUMNS
  ) {
    return false;
  }

  if (board[row][column] !== null) {
    return false;
  }

  if (row === ROWS - 1) {
    return true;
  }

  return board[row + 1][column] !== null;
};

/**
 * Calculates the overall strategic value of a board
 * from the perspective of `player`.
 *
 * Positive score  → favorable for player
 * Negative score  → favorable for opponent
 * Zero            → roughly neutral
 *
 * The final score combines several different signals:
 *
 *   Center control
 *        +
 *   Horizontal patterns
 *        +
 *   Vertical patterns
 *        +
 *   Downward diagonals
 *        +
 *   Upward diagonals
 */
export const evaluateBoard = (board: Board, player: Player): number => {
  if (player === null) {
    return 0;
  }

  return (
    evaluateCenterControl(board, player) +
    evaluateHorizontal(board, player) +
    evaluateVertical(board, player) +
    evaluateDiagonalDown(board, player) +
    evaluateDiagonalUp(board, player)
  );
};
