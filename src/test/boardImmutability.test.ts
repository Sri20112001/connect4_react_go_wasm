import { describe, it, expect } from "vitest";
import createEmptyBoard from "../utilities/createEmptyBoard";
import { cloneBoard, dropPiece, getAvailableColumns } from "../engine/javascript/board";

describe("20.2 Board immutability — contract: never mutates input", () => {
  it("dropPiece returns new board instance, original unchanged", () => {
    const original = createEmptyBoard();
    const snapshot = JSON.stringify(original);
    const result = dropPiece(original, 3, "red");
    expect(result.row).toBe(5);
    expect(result.board).not.toBe(original);
    expect(JSON.stringify(original)).toBe(snapshot);
    expect(original[5][3]).toBeNull();
    expect(result.board[5][3]).toBe("red");
  });

  it("original board deep equality preserved after multiple drops", () => {
    const original = createEmptyBoard();
    original[5][0] = "red";
    const snap = JSON.stringify(original);
    const { board: b1 } = dropPiece(original, 0, "yellow");
    const { board: b2 } = dropPiece(original, 1, "red");
    expect(JSON.stringify(original)).toBe(snap);
    expect(b1[4][0]).toBe("yellow"); // stacked above existing red in col 0
    expect(b2[5][1]).toBe("red");
    expect(b1).not.toBe(b2);
  });

  it("invalid column returns same board reference with null row", () => {
    const board = createEmptyBoard();
    const r1 = dropPiece(board, -1, "red");
    const r2 = dropPiece(board, 7, "red");
    const r3 = dropPiece(board, NaN, "red");
    const r4 = dropPiece(board, 1.5, "red");
    expect(r1.row).toBeNull();
    expect(r2.row).toBeNull();
    expect(r3.row).toBeNull();
    expect(r4.row).toBeNull();
    expect(r1.board).toBe(board);
    expect(r2.board).toBe(board);
  });

  it("null player returns same board with null row", () => {
    const board = createEmptyBoard();
    const res = dropPiece(board, 3, null);
    expect(res.row).toBeNull();
    expect(res.board).toBe(board);
  });

  it("full column returns same board with null row", () => {
    let board = createEmptyBoard();
    // fill col 2
    for (let i = 0; i < 6; i++) {
      const res = dropPiece(board, 2, i % 2 === 0 ? "red" : "yellow");
      board = res.board;
    }
    const full = board;
    const res = dropPiece(full, 2, "red");
    expect(res.row).toBeNull();
    expect(res.board).toBe(full);
  });

  it("cloneBoard is deep copy", () => {
    const a = createEmptyBoard();
    a[5][0] = "red";
    const b = cloneBoard(a);
    expect(b).not.toBe(a);
    expect(b[5]).not.toBe(a[5]);
    b[5][0] = "yellow";
    expect(a[5][0]).toBe("red");
  });

  it("getAvailableColumns reflects unfilled top row", () => {
    let board = createEmptyBoard();
    expect(getAvailableColumns(board)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    // fill col 0
    for (let i = 0; i < 6; i++) board = dropPiece(board, 0, "red").board;
    expect(getAvailableColumns(board)).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
