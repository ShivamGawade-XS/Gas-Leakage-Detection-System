import { useState, useEffect, useRef } from "react";

const CODE_8051 = `; ============================================
; Gas Leakage Detection System - 8051 Assembly
; Hardware: AT89C51 / AT89S52
; MQ2 Sensor  → P1.0 (Input)
; LED          → P2.0 (Output)
; BUZZER       → P2.1 (Output)
; RELAY        → P2.2 (Output, Active LOW)
; ============================================

ORG 0000H          ; Reset vector - program starts here

; --- Initialization ---
INIT:
    CLR  P2.0      ; LED OFF
    CLR  P2.1      ; BUZZER OFF
    SETB P2.2      ; RELAY ON (normal state, active LOW)
    SETB P1.0      ; Set P1.0 as input (MQ2 sensor)

; --- Main Loop ---
MAIN:
    JB   P1.0, GAS_DETECTED   ; Jump if sensor HIGH (gas detected)

; --- No Gas: Normal Condition ---
NO_GAS:
    CLR  P2.0      ; LED OFF
    CLR  P2.1      ; BUZZER OFF
    SETB P2.2      ; RELAY ON (power supply maintained)
    SJMP MAIN      ; Loop back

; --- Gas Detected: Alert Condition ---
GAS_DETECTED:
    SETB P2.0      ; LED ON
    SETB P2.1      ; BUZZER ON
    CLR  P2.2      ; RELAY OFF (cut main power supply)
    LCALL DELAY    ; Optional: debounce delay
    SJMP MAIN      ; Loop back

; --- Delay Subroutine (~500ms @ 11.0592 MHz) ---
DELAY:
    MOV  R0, #250
D1: MOV  R1, #250
D2: MOV  R2, #4
D3: DJNZ R2, D3
    DJNZ R1, D2
    DJNZ R0, D1
    RET

END`;

const CODE_C = `/* ============================================
   Gas Leakage Detection System
   Embedded C for 8051 (Keil uVision)
   Target: AT89C51 / AT89S52 @ 11.0592 MHz
   ============================================
   Pin Mapping:
   MQ2 Sensor  → P1^0  (Input)
   LED          → P2^0  (Output)
   BUZZER       → P2^1  (Output)
   RELAY        → P2^2  (Output, Active LOW)
   ============================================ */

#include <reg51.h>   // SFR definitions for 8051

/* --- Pin Definitions --- */
sbit MQ2_SENSOR = P1^0;  // Gas sensor input
sbit LED        = P2^0;  // Warning LED
sbit BUZZER     = P2^1;  // Buzzer
sbit RELAY      = P2^2;  // Relay (active LOW = OFF)

/* --- Function Prototypes --- */
void delay_ms(unsigned int ms);
void init_system(void);
void normal_condition(void);
void alert_condition(void);

/* ============================================
   Main Function
   ============================================ */
void main(void) {
    init_system();       // Initialize all outputs

    while (1) {          // Infinite loop
        if (MQ2_SENSOR == 1) {
            alert_condition();   // Gas detected!
        } else {
            normal_condition();  // Safe - no gas
        }
    }
}

/* ============================================
   Initialize System to Safe State
   ============================================ */
void init_system(void) {
    LED    = 0;   // LED OFF
    BUZZER = 0;   // Buzzer OFF
    RELAY  = 1;   // Relay ON (power maintained)
}

/* ============================================
   Normal Condition Handler
   No gas detected - system idle
   ============================================ */
void normal_condition(void) {
    LED    = 0;   // LED OFF
    BUZZER = 0;   // Buzzer OFF
    RELAY  = 1;   // Relay ON (power maintained)
}

/* ============================================
   Alert Condition Handler
   Gas detected - trigger all safety responses
   ============================================ */
void alert_condition(void) {
    LED    = 1;   // LED ON  - visual alert
    BUZZER = 1;   // Buzzer ON - audio alert
    RELAY  = 0;   // Relay OFF - cut main power!
    delay_ms(100); // Debounce delay
}

/* ============================================
   Delay Function (~1ms per count @ 11.0592 MHz)
   ============================================ */
void delay_ms(unsigned int ms) {
    unsigned int i, j;
    for (i = 0; i < ms; i++) {
        for (j = 0; j < 123; j++); // ~1ms loop
    }
}`;

// ─── Simulation Components ───

function Wires({ gasDetected }) {
  const active = gasDetected;
  return null; // handled via CSS/layout
}

function GlowDot({ on, color, size = 12 }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: "50%",
      background: on ? color : "#1a1a2e",
      boxShadow: on ? `0 0 ${size}px ${color}, 0 0 ${size * 2}px ${color}55` : "none",
      border: `2px solid ${on ? color : "#333"}`,
      transition: "all 0.3s ease",
    }} />
  );
}

function ComponentCard({ label, subtitle, status, statusLabel, icon, color, children }) {
  return (
    <div style={{
      background: "linear-gradient(135deg, #0d1117 0%, #161b22 100%)",
      border: `1px solid ${status ? color + "66" : "#30363d"}`,
      borderRadius: 12,
      padding: "14px 16px",
      boxShadow: status ? `0 0 20px ${color}22, inset 0 1px 0 ${color}33` : "0 2px 8px #00000066",
      transition: "all 0.4s ease",
      position: "relative",
      overflow: "hidden",
    }}>
      {status && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          animation: "scan 2s linear infinite",
        }} />
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <div>
          <div style={{ color: "#e6edf3", fontFamily: "'Courier New', monospace", fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>{label}</div>
          <div style={{ color: "#7d8590", fontSize: 11, fontFamily: "monospace" }}>{subtitle}</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          <GlowDot on={status} color={color} />
          <span style={{
            fontFamily: "monospace", fontSize: 11, fontWeight: 700,
            color: status ? color : "#484f58",
            transition: "color 0.3s",
          }}>{statusLabel}</span>
        </div>
      </div>
      {children}
    </div>
  );
}

function SignalBar({ value, color, label }) {
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ color: "#7d8590", fontSize: 10, fontFamily: "monospace" }}>{label}</span>
        <span style={{ color, fontSize: 10, fontFamily: "monospace", fontWeight: 700 }}>{value}%</span>
      </div>
      <div style={{ height: 4, background: "#21262d", borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${value}%`,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          borderRadius: 2,
          transition: "width 0.6s ease",
          boxShadow: `0 0 8px ${color}`,
        }} />
      </div>
    </div>
  );
}

function WaveformDisplay({ active, color, label }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let offset = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = active ? color : "#333";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const w = canvas.width, h = canvas.height;
      const mid = h / 2;
      const amp = active ? h * 0.38 : h * 0.05;
      for (let x = 0; x < w; x++) {
        const t = (x + offset) / w;
        const y = mid - Math.sin(t * Math.PI * 6) * amp * (active ? 1 : 0.3);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      if (active) {
        ctx.shadowBlur = 6;
        ctx.shadowColor = color;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      offset = (offset + (active ? 2 : 0.3)) % w;
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, [active, color]);

  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ color: "#7d8590", fontSize: 10, fontFamily: "monospace", marginBottom: 3 }}>{label}</div>
      <canvas ref={canvasRef} width={200} height={30}
        style={{ width: "100%", height: 30, borderRadius: 4, background: "#0d1117", display: "block" }} />
    </div>
  );
}

function LogLine({ time, msg, type }) {
  const colors = { info: "#58a6ff", alert: "#f85149", ok: "#3fb950", sys: "#d2a8ff" };
  const prefixes = { info: "INFO", alert: "ALRT", ok: "SAFE", sys: "SYS " };
  return (
    <div style={{ display: "flex", gap: 8, padding: "3px 0", borderBottom: "1px solid #21262d", fontSize: 11, fontFamily: "monospace" }}>
      <span style={{ color: "#484f58", minWidth: 50 }}>{time}</span>
      <span style={{ color: colors[type], minWidth: 36, fontWeight: 700 }}>[{prefixes[type]}]</span>
      <span style={{ color: "#c9d1d9" }}>{msg}</span>
    </div>
  );
}

function CodeBlock({ code, lang }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const keywords = ["ORG", "MOV", "CLR", "SETB", "JB", "SJMP", "LCALL", "DJNZ", "RET", "END",
    "void", "while", "if", "else", "return", "include", "sbit", "unsigned", "int", "for"];
  const comments = /;.*$|\/\/.*$|\/\*[\s\S]*?\*\//gm;

  return (
    <div style={{ position: "relative" }}>
      <button onClick={copy} style={{
        position: "absolute", top: 8, right: 8, zIndex: 10,
        background: copied ? "#238636" : "#21262d",
        border: `1px solid ${copied ? "#2ea043" : "#30363d"}`,
        color: copied ? "#3fb950" : "#8b949e",
        borderRadius: 6, padding: "4px 10px", fontSize: 11, fontFamily: "monospace",
        cursor: "pointer", transition: "all 0.2s",
      }}>{copied ? "✓ Copied!" : "Copy"}</button>
      <div style={{
        background: "#0d1117", border: "1px solid #30363d", borderRadius: 8,
        padding: "16px 14px", paddingTop: 40, overflowX: "auto",
        fontFamily: "'Courier New', monospace", fontSize: 12, lineHeight: 1.7,
        maxHeight: 420, overflowY: "auto",
      }}>
        <pre style={{ margin: 0, color: "#e6edf3" }}>
          {code.split("\n").map((line, i) => {
            const isComment = line.trim().startsWith(";") || line.trim().startsWith("//") || line.trim().startsWith("/*") || line.trim().startsWith("*");
            const isDirective = line.trim().startsWith("#");
            const kw = keywords.find(k => new RegExp(`\\b${k}\\b`).test(line));
            return (
              <div key={i} style={{ display: "flex", gap: 12 }}>
                <span style={{ color: "#484f58", minWidth: 28, textAlign: "right", userSelect: "none" }}>{i + 1}</span>
                <span style={{
                  color: isComment ? "#8b949e" : isDirective ? "#ff7b72" : "#e6edf3",
                  fontStyle: isComment ? "italic" : "normal",
                }}>{line}</span>
              </div>
            );
          })}
        </pre>
      </div>
    </div>
  );
}

// ─── Main App ───
export default function App() {
  const [gasDetected, setGasDetected] = useState(false);
  const [gasLevel, setGasLevel] = useState(12);
  const [logs, setLogs] = useState([
    { time: "00:00:00", msg: "System initialized. All pins configured.", type: "sys" },
    { time: "00:00:00", msg: "RELAY → ON | LED → OFF | BUZZER → OFF", type: "ok" },
    { time: "00:00:00", msg: "MQ2 sensor monitoring started...", type: "info" },
  ]);
  const [tick, setTick] = useState(0);
  const [activeTab, setActiveTab] = useState("sim");
  const [codeTab, setCodeTab] = useState("asm");
  const logRef = useRef(null);
  const timerRef = useRef(null);

  const getTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2,"0")} : ${String(now.getMinutes()).padStart(2,"0")} : ${String(now.getSeconds()).padStart(2,"0")}`.replace(/\s/g, "");
  };

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setGasLevel(prev => {
        if (gasDetected) {
          return Math.min(100, prev + (Math.random() * 8 - 1));
        } else {
          return Math.max(5, prev - (Math.random() * 4) + Math.random() * 2);
        }
      });
    }, 400);
    return () => clearInterval(id);
  }, [gasDetected]);

  const addLog = (msg, type) => {
    setLogs(prev => [...prev.slice(-49), { time: getTime(), msg, type }]);
    setTimeout(() => logRef.current?.scrollTo({ top: 9999, behavior: "smooth" }), 50);
  };

  const toggleGas = () => {
    const next = !gasDetected;
    setGasDetected(next);
    if (next) {
      addLog("⚠ MQ2 sensor HIGH — gas presence detected!", "alert");
      addLog("RELAY → OFF | LED → ON | BUZZER → ON", "alert");
      addLog("Power supply disconnected for safety.", "alert");
    } else {
      addLog("MQ2 sensor LOW — environment clear.", "ok");
      addLog("RELAY → ON | LED → OFF | BUZZER → OFF", "ok");
      addLog("Normal operation resumed.", "ok");
    }
  };

  const [ledBlink, setLedBlink] = useState(true);
  useEffect(() => {
    if (!gasDetected) { setLedBlink(true); return; }
    const id = setInterval(() => setLedBlink(b => !b), 500);
    return () => clearInterval(id);
  }, [gasDetected]);

  const ledOn = gasDetected && ledBlink;
  const buzzerOn = gasDetected;
  const relayOn = !gasDetected;
  const sensorActive = gasDetected;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#010409",
      color: "#e6edf3",
      fontFamily: "'Courier New', monospace",
      padding: 0,
    }}>
      <style>{`
        @keyframes scan { from { transform: translateX(-100%) } to { transform: translateX(100%) } }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        @keyframes blink { 0%,100% { opacity:1 } 50% { opacity:0.2 } }
        @keyframes flicker { 0%,100%{opacity:1} 92%{opacity:0.9} 93%{opacity:0.3} 95%{opacity:1} }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0d1117; }
        ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }
        .tab-btn { background: none; border: none; cursor: pointer; transition: all 0.2s; font-family: 'Courier New', monospace; }
        .tab-btn:hover { color: #e6edf3 !important; }
      `}</style>

      {/* Header */}
      <div style={{
        background: "linear-gradient(180deg, #0d1117 0%, #010409 100%)",
        borderBottom: "1px solid #30363d",
        padding: "16px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: gasDetected ? "#f85149" : "#3fb950",
              boxShadow: `0 0 8px ${gasDetected ? "#f85149" : "#3fb950"}`,
              animation: gasDetected ? "blink 0.6s infinite" : "none",
            }} />
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, color: "#58a6ff" }}>GAS LEAKAGE DETECTION SYSTEM</span>
          </div>
          <div style={{ color: "#484f58", fontSize: 11, marginTop: 2 }}>8051 Microcontroller (AT89C51) · MQ2 Sensor · Proteus Simulation</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#7d8590", fontSize: 11 }}>STATUS</div>
          <div style={{
            fontSize: 13, fontWeight: 700,
            color: gasDetected ? "#f85149" : "#3fb950",
            animation: gasDetected ? "pulse 0.6s infinite" : "none",
          }}>{gasDetected ? "⚠ GAS DETECTED" : "✓ NORMAL"}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid #21262d", padding: "0 24px", display: "flex", gap: 0 }}>
        {[ ["sim", "⚙ Simulation"], ["code", "</> Source Code"] ].map(([id, label]) => (
          <button key={id} className="tab-btn" onClick={() => setActiveTab(id)} style={{
            padding: "12px 20px", fontSize: 12, letterSpacing: 1,
            color: activeTab === id ? "#58a6ff" : "#7d8590",
            borderBottom: activeTab === id ? "2px solid #58a6ff" : "2px solid transparent",
            fontWeight: activeTab === id ? 700 : 400,
          }}>{label}</button>
        ))}
      </div>

      {activeTab === "sim" && (
        <div style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 900, margin: "0 auto" }}>

          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* MQ2 Sensor */}
            <ComponentCard label="MQ2 GAS SENSOR" subtitle="P1.0 → 8051 Input" status={sensorActive} statusLabel={sensorActive ? "HIGH (1)" : "LOW (0)"} icon="🔬" color="#f0883e">
              <SignalBar value={Math.round(gasLevel)} color={gasLevel > 60 ? "#f85149" : gasLevel > 30 ? "#f0883e" : "#3fb950"} label="GAS CONCENTRATION" />
              <WaveformDisplay active={sensorActive} color="#f0883e" label="SENSOR OUTPUT WAVEFORM" />
            </ComponentCard>

            {/* 8051 MCU */}
            <ComponentCard label="8051 MICROCONTROLLER" subtitle="AT89C51 @ 11.0592 MHz" status={true} statusLabel="RUNNING" icon="🖥" color="#58a6ff">
              <div style={{ marginTop: 6, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {[
                  ["P1.0", "MQ2 IN", gasDetected ? "1" : "0", gasDetected ? "#f0883e" : "#3fb950"],
                  ["P2.0", "LED OUT", gasDetected ? "1" : "0", gasDetected ? "#3fb950" : "#484f58"],
                  ["P2.1", "BUZZ OUT", gasDetected ? "1" : "0", gasDetected ? "#f85149" : "#484f58"],
                  ["P2.2", "RELAY OUT", gasDetected ? "0" : "1", gasDetected ? "#f85149" : "#3fb950"],
                ].map(([pin, fn, val, col]) => (
                  <div key={pin} style={{
                    background: "#0d1117", border: "1px solid #21262d",
                    borderRadius: 6, padding: "6px 8px",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <div>
                      <div style={{ fontSize: 10, color: "#58a6ff", fontWeight: 700 }}>{pin}</div>
                      <div style={{ fontSize: 9, color: "#484f58" }}>{fn}</div>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: col, fontFamily: "monospace",
                      textShadow: `0 0 8px ${col}`, transition: "all 0.3s" }}>{val}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 8, background: "#0d1117", borderRadius: 6, padding: "6px 10px",
                border: "1px solid #21262d", fontSize: 10, color: "#484f58" }}>
                <span style={{ color: "#58a6ff" }}>PC: </span>0x{(tick * 3).toString(16).toUpperCase().padStart(4,"0")} &nbsp;
                <span style={{ color: "#58a6ff" }}>CYCLE: </span>{tick * 12} &nbsp;
                <span style={{ color: "#58a6ff" }}>STATE: </span>
                <span style={{ color: gasDetected ? "#f85149" : "#3fb950" }}>
                  {gasDetected ? "GAS_DETECTED" : "MAIN_LOOP"}
                </span>
              </div>
            </ComponentCard>

            {/* Gas toggle button */}
            <button onClick={toggleGas} style={{
              background: gasDetected
                ? "linear-gradient(135deg, #3d0f0f, #5c1a1a)"
                : "linear-gradient(135deg, #0f3d1a, #1a5c2a)",
              border: `2px solid ${gasDetected ? "#f85149" : "#3fb950"}`,
              color: gasDetected ? "#f85149" : "#3fb950",
              borderRadius: 10, padding: "14px 20px",
              fontSize: 13, fontWeight: 700, letterSpacing: 2,
              cursor: "pointer", fontFamily: "monospace",
              boxShadow: `0 0 20px ${gasDetected ? "#f8514933" : "#3fb95033"}`,
              transition: "all 0.3s",
              animation: gasDetected ? "pulse 1s infinite" : "none",
            }}>
              {gasDetected ? "▶ INJECT GAS  [CLEAR GAS]" : "▶ SIMULATE GAS LEAK"}
            </button>
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* LED */}
            <ComponentCard label="WARNING LED" subtitle="P2.0 → Active HIGH" status={ledOn} statusLabel={gasDetected ? "ON ●" : "OFF ○"} icon="💡" color="#ffd600">
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 50 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: ledOn ? "radial-gradient(circle, #fff 0%, #ffd600 40%, #ff8c00 100%)" : "radial-gradient(circle, #333 0%, #222 100%)",
                  boxShadow: ledOn ? "0 0 30px #ffd600, 0 0 60px #ffd60066, 0 0 90px #ff8c0033" : "none",
                  transition: "all 0.15s",
                  border: `3px solid ${ledOn ? "#ffd600" : "#333"}`,
                }} />
                <div style={{ marginLeft: 16, fontSize: 11, color: "#7d8590" }}>
                  <div>Vf: 2.0V</div>
                  <div>If: 20mA</div>
                  <div style={{ color: ledOn ? "#ffd600" : "#484f58", fontWeight: 700, marginTop: 4 }}>
                    {gasDetected ? "BLINKING" : "OFF"}
                  </div>
                </div>
              </div>
            </ComponentCard>

            {/* Buzzer */}
            <ComponentCard label="PIEZO BUZZER" subtitle="P2.1 → Active HIGH" status={buzzerOn} statusLabel={buzzerOn ? "BEEPING" : "SILENT"} icon="🔔" color="#f85149">
              <WaveformDisplay active={buzzerOn} color="#f85149" label="AUDIO OUTPUT SIGNAL" />
              <div style={{ marginTop: 6, display: "flex", gap: 8 }}>
                {["2kHz", "5V", "85dB"].map(v => (
                  <div key={v} style={{
                    flex: 1, background: "#0d1117", border: `1px solid ${buzzerOn ? "#f8514944" : "#21262d"}`,
                    borderRadius: 4, padding: "4px 0", textAlign: "center", fontSize: 10,
                    color: buzzerOn ? "#f85149" : "#484f58",
                  }}>{v}</div>
                ))}
              </div>
            </ComponentCard>

            {/* Relay */}
            <ComponentCard label="RELAY MODULE" subtitle="P2.2 → Active LOW" status={relayOn} statusLabel={relayOn ? "ON (CLOSED)" : "OFF (OPEN)"} icon="⚡" color="#3fb950">
              <div style={{ marginTop: 6, display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: "#7d8590", marginBottom: 4 }}>POWER CIRCUIT</div>
                  <div style={{ height: 6, borderRadius: 3, overflow: "hidden",
                    background: "linear-gradient(90deg, #21262d 0%, #21262d 100%)" }}>
                    <div style={{
                      height: "100%", width: relayOn ? "100%" : "0%",
                      background: "linear-gradient(90deg, #3fb950, #56d364)",
                      transition: "width 0.5s ease",
                      boxShadow: "0 0 10px #3fb950",
                    }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 9, color: "#484f58" }}>
                    <span>MAIN SUPPLY</span>
                    <span style={{ color: relayOn ? "#3fb950" : "#f85149", fontWeight: 700 }}>
                      {relayOn ? "CONNECTED ✓" : "DISCONNECTED ✗"}
                    </span>
                  </div>
                </div>
              </div>
            </ComponentCard>

            {/* Log */}
            <div style={{
              background: "#0d1117", border: "1px solid #21262d", borderRadius: 8,
              padding: 12, flex: 1,
            }}>
              <div style={{ color: "#7d8590", fontSize: 10, letterSpacing: 1, marginBottom: 8 }}>► SERIAL MONITOR LOG</div>
              <div ref={logRef} style={{ maxHeight: 140, overflowY: "auto" }}>
                {logs.map((l, i) => <LogLine key={i} {...l} />)}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "code" && (
        <div style={{ padding: 20, maxWidth: 860, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: 0, marginBottom: 16, borderBottom: "1px solid #21262d" }}>
            {[ ["asm", "📄 Assembly (8051)"], ["c", "📄 Embedded C (Keil)"] ].map(([id, label]) => (
              <button key={id} className="tab-btn" onClick={() => setCodeTab(id)} style={{
                padding: "10px 18px", fontSize: 12, letterSpacing: 0.5,
                color: codeTab === id ? "#58a6ff" : "#7d8590",
                borderBottom: codeTab === id ? "2px solid #58a6ff" : "2px solid transparent",
                fontWeight: codeTab === id ? 700 : 400,
              }}>{label}</button>
            ))}
          </div>

          <div style={{ marginBottom: 12, padding: "10px 14px", background: "#0d1117",
            border: "1px solid #30363d", borderRadius: 8, fontSize: 11, color: "#7d8590",
            display: "flex", gap: 20, flexWrap: "wrap" }}>
            <span>🖥 Target: <span style={{ color: "#58a6ff" }}>AT89C51 / AT89S52</span></span>
            <span>⚡ Clock: <span style={{ color: "#58a6ff" }}>11.0592 MHz</span></span>
            <span>🔧 Tool: <span style={{ color: "#58a6ff" }}>{codeTab === "asm" ? "Keil uVision / MIDE-51" : "Keil uVision C51"}</span></span>
            <span>🔬 Sim: <span style={{ color: "#58a6ff" }}>Proteus Design Suite</span></span>
          </div>

          <CodeBlock code={codeTab === "asm" ? CODE_8051 : CODE_C} lang={codeTab} />

          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { pin: "P1.0", role: "MQ2 Sensor Input", logic: "HIGH = gas detected", color: "#f0883e" },
              { pin: "P2.0", role: "LED Output", logic: "HIGH = warning ON", color: "#ffd600" },
              { pin: "P2.1", role: "Buzzer Output", logic: "HIGH = beeping", color: "#f85149" },
              { pin: "P2.2", role: "Relay Output", logic: "LOW = relay OFF (safe)", color: "#3fb950" },
            ].map(({ pin, role, logic, color }) => (
              <div key={pin} style={{
                background: "#0d1117", border: `1px solid ${color}33`,
                borderLeft: `3px solid ${color}`, borderRadius: 6,
                padding: "8px 12px", fontSize: 11,
              }}>
                <span style={{ color, fontWeight: 700 }}>{pin}</span>
                <span style={{ color: "#8b949e" }}> → {role}</span>
                <div style={{ color: "#484f58", marginTop: 2 }}>{logic}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
