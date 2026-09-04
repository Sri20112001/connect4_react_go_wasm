import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ConnectPage from "../pages/ConnectPage/ConnectPage";
import BenchmarkPage from "../pages/BenchmarkPage/BenchmarkPage";
import App from "../App";
import fs from "fs";
import path from "path";

describe("22.6 / 22.9 — Game / Benchmark separation & routing", () => {
  it("game page does not import benchmark", async () => {
    const gameController = fs.readFileSync(path.join(process.cwd(), "src/game/useGameController.ts"), "utf8");
    const connectPage = fs.readFileSync(path.join(process.cwd(), "src/pages/ConnectPage/ConnectPage.tsx"), "utf8");
    expect(gameController).not.toMatch(/benchmark/i);
    expect(connectPage).not.toMatch(/BenchmarkLab/);
    expect(connectPage).not.toContain("benchmarkRunner");
  });

  it("benchmark page does not depend on React game state", async () => {
    const benchLab = fs.readFileSync(path.join(process.cwd(), "src/pages/BenchmarkPage/BenchmarkLab.tsx"), "utf8");
    const benchPage = fs.readFileSync(path.join(process.cwd(), "src/pages/BenchmarkPage/BenchmarkPage.tsx"), "utf8");
    expect(benchLab).not.toContain("useConnect4");
    expect(benchLab).not.toContain("useGameController");
    expect(benchPage).not.toContain("useConnect4");
    expect(benchLab).toContain("runReliableWorkloads");
    expect(benchLab).toContain("PARITY_BOARDS");
  });

  it("shared engine layer exists and both domains use it", async () => {
    const game = fs.readFileSync(path.join(process.cwd(), "src/game/useGameController.ts"), "utf8");
    const bench = fs.readFileSync(path.join(process.cwd(), "src/pages/BenchmarkPage/BenchmarkLab.tsx"), "utf8");
    // both use engine
    expect(game).toContain("engine/");
    expect(bench).toContain("engine/");
    // shared files exist
    expect(fs.existsSync(path.join(process.cwd(), "src/engine/javascript/board.ts"))).toBe(true);
    expect(fs.existsSync(path.join(process.cwd(), "src/engine/javascript/mcts.ts"))).toBe(true);
  });

  it("App.tsx defines /connect4 and /benchmark/connect4 routes", async () => {
    const app = fs.readFileSync(path.join(process.cwd(), "src/App.tsx"), "utf8");
    expect(app).toContain('path="/connect4"');
    expect(app).toContain('path="/benchmark/connect4"');
    expect(app).toContain("BrowserRouter");
    expect(app).toContain("useWasmStatus");
    // App no longer owns game state directly
    expect(app).not.toContain("useConnect4");
    expect(app).not.toContain("runMonteCarloInWorker");
  });

  it("ConnectPage renders without benchmark controls", async () => {
    render(
      <MemoryRouter initialEntries={["/connect4"]}>
        <Routes>
          <Route path="/connect4" element={<ConnectPage />} />
        </Routes>
      </MemoryRouter>,
    );
    // Game-specific controls should be present — focus toggle inside board (doesn't occupy layout)
    expect(screen.getByLabelText(/Hide configuration/i)).toBeInTheDocument();
    expect(screen.getByText(/Player 1/i)).toBeInTheDocument();
    // Benchmark-only strings should not appear in game page
    expect(screen.queryByText(/Benchmark Lab/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Warmup runs/i)).not.toBeInTheDocument();
  });

  it("BenchmarkPage renders benchmark dashboard", async () => {
    render(
      <MemoryRouter initialEntries={["/benchmark/connect4"]}>
        <Routes>
          <Route path="/benchmark/connect4" element={<BenchmarkPage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getAllByText(/Benchmark Lab/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Workloads/i).length).toBeGreaterThanOrEqual(1);
  });

  it("App header contains navigation to both experiences", async () => {
    render(<App />);
    expect(screen.getByRole("link", { name: /Game/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Benchmark/i })).toBeInTheDocument();
  });
});
