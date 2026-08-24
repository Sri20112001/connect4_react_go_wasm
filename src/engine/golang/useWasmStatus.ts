import { useEffect, useSyncExternalStore } from "react";
import {
  getWasmStatus,
  loadWasm,
  subscribeWasmStatus,
  type WasmStatus,
} from "./wasmLoader";

export const useWasmStatus = (): WasmStatus => {
  const status = useSyncExternalStore(subscribeWasmStatus, getWasmStatus, getWasmStatus);

  useEffect(() => {
    if (status === "idle") void loadWasm();
  }, [status]);

  return status;
};

export type { WasmStatus };
