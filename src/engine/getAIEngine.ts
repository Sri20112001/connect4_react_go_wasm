import type { AIEngine } from "./types";
import type { Engine } from "../types/types";
import { javascriptEngine } from "./javascript/javascriptEngine";
import { wasmEngine } from "./golang/wasmEngine";

export const getAIEngine = (engine: Engine): AIEngine => {
  return engine === "wasm" ? wasmEngine : javascriptEngine;
};
