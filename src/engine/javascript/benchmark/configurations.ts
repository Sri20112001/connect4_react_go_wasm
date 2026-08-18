
import type { MoveFunction } from "../../types";
import { createRandomAI } from "./benchmark";
import { createMonteCarloAI } from "./players";

export type AIConfiguration = {
  name: string;
  create: () => MoveFunction;
};

export const AI_CONFIGURATIONS: AIConfiguration[] = [
  {
    name: "Random",
    create: () => createRandomAI(),
  },

  {
    name: "Monte Carlo 100",
    create: () => createMonteCarloAI(100),
  },

  {
    name: "Monte Carlo 500",
    create: () => createMonteCarloAI(500),
  },

  {
    name: "Monte Carlo 1000",
    create: () => createMonteCarloAI(1000),
  },

  {
    name: "Monte Carlo 5000",
    create: () => createMonteCarloAI(5000),
  },
];