import { useState } from "react";
import CircuitApp from "./CircuitApp.jsx";
import InteractiveApp from "./InteractiveApp.jsx";

export default function App() {
  const [mode, setMode] = useState("interactive");

  return (
    <div style={{ minHeight: "100vh", background: "#010409", color: "#e6edf3", fontFamily: "'Courier New', monospace" }}>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid #21262d", display: "flex", gap: 12, flexWrap: "wrap" }}>
        {[
          ["interactive", "🧪 Interactive Simulation"],
          ["circuit", "🔌 Circuit Diagram"]
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            style={{
              cursor: "pointer",
              border: "1px solid #30363d",
              borderRadius: 8,
              background: mode === id ? "#161b22" : "#0d1117",
              color: mode === id ? "#58a6ff" : "#7d8590",
              padding: "10px 16px",
              fontSize: 12,
              fontFamily: "'Courier New', monospace",
              fontWeight: 700,
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {mode === "interactive" ? <InteractiveApp /> : <CircuitApp />}
    </div>
  );
}
