import { describe, it, expect } from "vitest";
import { clampSimulations, DEFAULT_SIMULATIONS, MIN_SIMULATIONS, MAX_SIMULATIONS } from "../utilities/CONSTANTS";

describe("20.7 Input safety — clampSimulations", () => {
  it("clamps NaN/Infinity to DEFAULT", () => {
    expect(clampSimulations(NaN)).toBe(DEFAULT_SIMULATIONS);
    expect(clampSimulations(Infinity)).toBe(DEFAULT_SIMULATIONS);
    expect(clampSimulations(-Infinity)).toBe(DEFAULT_SIMULATIONS);
  });

  it("clamps negatives and 0 to MIN", () => {
    expect(clampSimulations(0)).toBe(MIN_SIMULATIONS);
    expect(clampSimulations(-100)).toBe(MIN_SIMULATIONS);
    expect(clampSimulations(-1)).toBe(MIN_SIMULATIONS);
  });

  it("floors floats and clamps to MAX", () => {
    expect(clampSimulations(1.9)).toBe(1);
    expect(clampSimulations(100.1)).toBe(100);
    expect(clampSimulations(1_000_000_000)).toBe(MAX_SIMULATIONS);
    expect(clampSimulations(100_000)).toBe(100_000);
    expect(clampSimulations(100_001)).toBe(100_000);
  });

  it("passes through valid values unchanged (except floor)", () => {
    expect(clampSimulations(1)).toBe(1);
    expect(clampSimulations(500)).toBe(500);
    expect(clampSimulations(10_000)).toBe(10_000);
  });
});

describe("20.7 WASM loading — BASE_URL resolution & retry", () => {
  it("loadWasm uses import.meta.env.BASE_URL for sub-path deployment", async () => {
    // Verify the wasmLoader constructs URL from BASE_URL — check by inspecting built file text
    // We can't fully instantiate WASM in test env, but we can assert the fallback string isn't hardcoded
    const fs = await import("fs");
    const path = await import("path");
    const file = fs.readFileSync(path.join(process.cwd(), "src/engine/golang/wasmLoader.ts"), "utf8");
    expect(file).toContain("import.meta.env.BASE_URL");
    expect(file).not.toMatch(/fetch\("\/main\.wasm"\)/);
    expect(file).toContain('new URL("main.wasm"');
  });

  it("retry after error clears wasmReadyPromise (allows reload)", async () => {
    const content = await import("fs").then((fs) =>
      fs.readFileSync("src/engine/golang/wasmLoader.ts", "utf8"),
    );
    // After error, wasmReadyPromise is set to null to allow retry
    expect(content).toContain("wasmReadyPromise = null");
    // Status reset from error to idle
    expect(content).toContain('if (status === "error")');
  });
});

describe("20.7 Engine fallback — JS used when WASM unavailable", () => {
  it("AIEnginePanel Run button is not disabled on WASM error (fallback enabled)", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("src/pages/ConnectPage/components/AIEnginePanel.tsx", "utf8");
    // Should have removed the disabled=(isWasmError && wasm) guard
    expect(content).not.toContain("(isWasmError && selectedEngine === \"wasm\")");
    expect(content).toContain("Using JavaScript fallback");
    expect(content).toContain("disabled={isBusy}");
  });

  it("App uses DEFAULT_SIMULATIONS clamped for auto-AI, not hardcoded 1000", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("src/game/useGameController.ts", "utf8");
    expect(content).toContain("DEFAULT_SIMULATIONS");
    expect(content).not.toMatch(/simulationsPerMove:\s*1000,/);
  });
});

describe("20.6 Benchmark resilience", () => {
  it("runBenchmark does not throw on illegal AI move (record and continue)", async () => {
    const { runBenchmark } = await import("../engine/javascript/benchmark/benchmark");
    const badAI = () => 99; // always invalid
    const goodAI = () => 3;
    const result = runBenchmark(badAI, goodAI, 4);
    // Should complete games, not throw; badAI games counted as losses but benchmark finishes
    expect(result.games).toBe(4);
    expect(result.wins + result.losses + result.draws).toBe(4);
  });

  it("BenchmarkLab shows dynamic totals not hardcoded 8", async () => {
    const content = await import("fs").then((fs) =>
      fs.readFileSync("src/pages/BenchmarkPage/BenchmarkLab.tsx", "utf8"),
    );
    expect(content).toContain("parityTotal");
    expect(content).not.toContain('parityMatched === 8');
    expect(content).toContain("{parityMatched}/{parityTotal}");
  });

  it("effectivePlayer uses currentPlayer not hardcoded yellow", async () => {
    const content = await import("fs").then((fs) =>
      fs.readFileSync("src/pages/BenchmarkPage/BenchmarkLab.tsx", "utf8"),
    );
    expect(content).toContain("currentPlayer");
    expect(content).not.toMatch(/effectivePlayer =.*\? "yellow" : "red"/);
  });
});
