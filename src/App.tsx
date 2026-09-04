import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import ConnectPage from "./pages/ConnectPage/ConnectPage";
import BenchmarkPage from "./pages/BenchmarkPage/BenchmarkPage";
import { useWasmStatus } from "./engine/golang/useWasmStatus";

export default function App() {
  const wasmStatus = useWasmStatus();

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <div className="h-screen bg-zinc-950 text-white flex flex-col overflow-hidden">
        <Header wasmStatus={wasmStatus} />
        <Routes>
          <Route path="/" element={<Navigate to="/connect4" replace />} />
          <Route path="/connect4" element={<ConnectPage />} />
          <Route
            path="/benchmark/connect4"
            element={
              <div className="flex-1 min-h-0 overflow-y-auto">
                <BenchmarkPage />
              </div>
            }
          />
          <Route path="*" element={<Navigate to="/connect4" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
