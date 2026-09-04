export type WasmStatus = "idle" | "loading" | "ready" | "error";

let status: WasmStatus = "idle";
let wasmReadyPromise: Promise<boolean> | null = null;
const listeners = new Set<(next: WasmStatus) => void>();

const setStatus = (next: WasmStatus): void => {
  status = next;
  for (const fn of listeners) fn(next);
};

export const getWasmStatus = (): WasmStatus => status;

export const subscribeWasmStatus = (
  fn: (next: WasmStatus) => void,
): (() => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

export const loadWasm = (): Promise<boolean> => {
  if (status === "ready") return Promise.resolve(true);
  if (wasmReadyPromise) return wasmReadyPromise;

  // Allow retry after error
  if (status === "error") {
    status = "idle";
    wasmReadyPromise = null;
  }

  setStatus("loading");

  wasmReadyPromise = new Promise((resolve) => {
    const GoCtor = (window as unknown as { Go?: new () => { importObject: WebAssembly.Imports; run: (instance: WebAssembly.Instance) => void } }).Go;

    if (!GoCtor) {
      console.error("WASM loader: window.Go not found — wasm_exec.js not loaded");
      setStatus("error");
      wasmReadyPromise = null;
      resolve(false);
      return;
    }

    const baseUrl =
      typeof window !== "undefined" && window.location
        ? new URL(import.meta.env.BASE_URL, window.location.href).toString()
        : import.meta.env.BASE_URL;
    const wasmUrl = new URL("main.wasm", baseUrl).toString();

    const go = new GoCtor();

    const instantiate = WebAssembly.instantiateStreaming
      ? WebAssembly.instantiateStreaming(fetch(wasmUrl), go.importObject)
      : fetch(wasmUrl)
          .then((r) => r.arrayBuffer())
          .then((bytes) => WebAssembly.instantiate(bytes, go.importObject));

    instantiate
      .then((result) => {
        // Go 1.21+ returns { instance } wrapper, older returns Instance directly
        const instance =
          (result as unknown as { instance: WebAssembly.Instance }).instance ??
          (result as unknown as WebAssembly.Instance);
        go.run(instance);
        queueMicrotask(() => {
          setStatus("ready");
          resolve(true);
        });
      })
      .catch((err) => {
        console.error("WASM load failed:", err);
        setStatus("error");
        wasmReadyPromise = null;
        resolve(false);
      });
  });

  return wasmReadyPromise;
};

export const wasmReadyCheck = (): boolean => {
  if (status !== "ready") return false;
  try {
    return typeof window.connect4WasmReady === "function" && window.connect4WasmReady() === true;
  } catch {
    return false;
  }
};
