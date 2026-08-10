import createEmptyBoard from "../../utilities/createEmptyBoard";
import runMonteCarlo from "./monteCarlo";

const board = createEmptyBoard();

const result = runMonteCarlo(board, {
  simulationsPerMove: 1000,
  player: "yellow",
});

console.log("Monte Carlo Result:");
console.log(result);

console.table(result.results);