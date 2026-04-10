import { useState } from "react";

const CODE_ASM = `; ============================================================
; Gas Leakage Detection System — 8051 Assembly
; MCU  : AT89C51 / AT89S52
; Clock: 11.0592 MHz Crystal
; Tool : Keil uVision / MIDE-51
; Sim  : Proteus Design Suite
; ============================================================
; PIN CONNECTIONS:
;   MQ2 D0  → P1.0  (Digital Input)
;   LED (+) → P2.0  → 330Ω → GND
;   BUZZER  → P2.1  (Active HIGH)
;   RELAY IN→ P2.2  (Active LOW — IN1 of relay module)
;   VCC     → +5V, GND → GND (all components)
; ============================================================

        ORG     0000H           ; Reset vector

; ─── System Initialization ────────────────────────────────
START:
        CLR     P2.0            ; LED      → OFF
        CLR     P2.1            ; BUZZER   → OFF
        SETB    P2.2            ; RELAY    → ON  (active LOW, so SETB = relay coil ON)
        SETB    P1.0            ; P1.0 configured as input (MQ2 sensor)
        MOV     A, #00H         ; Clear accumulator

; ─── Main Loop ────────────────────────────────────────────
MAIN:
        MOV     A, P1           ; Read entire Port 1
        ANL     A, #01H         ; Mask — check only bit 0 (P1.0 = MQ2)
        JNZ     GAS_ALERT       ; If A ≠ 0 → gas detected → jump
        SJMP    SAFE_MODE       ; Else → normal/safe mode

; ─── Safe Mode (No Gas) ───────────────────────────────────
SAFE_MODE:
        CLR     P2.0            ; LED OFF
        CLR     P2.1            ; BUZZER OFF
        SETB    P2.2            ; RELAY ON  (power maintained)
        SJMP    MAIN            ; Loop continuously

; ─── Alert Mode (Gas Detected) ────────────────────────────
GAS_ALERT:
        SETB    P2.0            ; LED ON   — visual warning
        SETB    P2.1            ; BUZZER ON — audio warning
        CLR     P2.2            ; RELAY OFF — disconnect main power!
        LCALL   DELAY_500MS     ; Debounce / hold time
        SJMP    MAIN            ; Re-check sensor

; ─── Delay ~500ms @ 11.0592 MHz ───────────────────────────
; Each inner loop ≈ 4 machine cycles
; 250 × 250 × 4 = 250,000 cycles ≈ 500ms
DELAY_500MS:
        MOV     R0, #250        ; Outer loop count
LOOP1:  MOV     R1, #250        ; Middle loop count
LOOP2:  MOV     R2, #4          ; Inner loop count
LOOP3:  DJNZ    R2, LOOP3       ; R2-- until zero (4 cycles each)
        DJNZ    R1, LOOP2       ; R1-- until zero
        DJNZ    R0, LOOP1       ; R0-- until zero
        RET                     ; Return to caller

        END                     ; End of program`;

const CODE_C = `/* ============================================================
   Gas Leakage Detection System
   Language : Embedded C (C51)
   Compiler : Keil uVision MDK
   MCU      : AT89C51 / AT89S52 @ 11.0592 MHz
   Simulator: Proteus Design Suite 8
   ============================================================
   HARDWARE CONNECTIONS:
   ┌─────────────────┬──────────┬────────────────────────────┐
   │ Component       │ 8051 Pin │ Notes                      │
   ├─────────────────┼──────────┼────────────────────────────┤
   │ MQ2 DOUT        │ P1.0     │ Digital input, 5V logic    │
   │ LED Anode (+)   │ P2.0     │ 330Ω resistor to GND       │
   │ Buzzer (+)      │ P2.1     │ Active HIGH, 5V            │
   │ Relay IN1       │ P2.2     │ Active LOW trigger         │
   │ VCC (all)       │ +5V      │ Regulated DC               │
   │ GND (all)       │ GND      │ Common ground              │
   │ XTAL1/XTAL2     │ Pin18/19 │ 11.0592 MHz crystal        │
   │ RST             │ Pin9     │ 10µF cap + 10kΩ to VCC     │
   │ EA/VPP          │ Pin31    │ Tied to VCC (internal ROM) │
   └─────────────────┴──────────┴────────────────────────────┘
   ============================================================ */

#include <reg51.h>          /* SFR definitions for 8051 family  */

/* ── Pin Definitions ───────────────────────────────────── */
sbit MQ2    = P1^0;         /* MQ2 gas sensor digital output    */
sbit LED    = P2^0;         /* Red warning LED                  */
sbit BUZZER = P2^1;         /* Piezo buzzer (active HIGH)       */
sbit RELAY  = P2^2;         /* Relay IN1 (active LOW)           */

/* ── Function Prototypes ───────────────────────────────── */
void system_init(void);
void safe_mode(void);
void alert_mode(void);
void delay_ms(unsigned int ms);

/* ============================================================
   MAIN FUNCTION
   ============================================================ */
void main(void) {
    system_init();              /* Configure all I/O pins        */

    while (1) {                 /* Infinite polling loop         */
        if (MQ2 == 1) {         /* Sensor HIGH = gas detected    */
            alert_mode();
        } else {                /* Sensor LOW  = environment safe*/
            safe_mode();
        }
    }
}

/* ============================================================
   SYSTEM INITIALIZATION
   Set all outputs to safe default state on power-up
   ============================================================ */
void system_init(void) {
    LED    = 0;                 /* LED OFF (no warning)          */
    BUZZER = 0;                 /* Buzzer silent                 */
    RELAY  = 1;                 /* Relay ON → power maintained   */
                                /* Note: RELAY is active LOW     */
                                /* RELAY=1 → coil energized      */
                                /* RELAY=0 → coil de-energized   */
}

/* ============================================================
   SAFE MODE — No gas detected
   Normal operating condition
   ============================================================ */
void safe_mode(void) {
    LED    = 0;                 /* Visual: no warning            */
    BUZZER = 0;                 /* Audio:  silent                */
    RELAY  = 1;                 /* Power:  connected (ON)        */
}

/* ============================================================
   ALERT MODE — Gas detected
   Emergency response: visual + audio alarm + cut power
   ============================================================ */
void alert_mode(void) {
    LED    = 1;                 /* RED LED ON  — visual alarm    */
    BUZZER = 1;                 /* Buzzer ON   — audio alarm     */
    RELAY  = 0;                 /* RELAY OFF   — cuts main power */
                                /* Prevents fire/explosion risk  */
    delay_ms(100);              /* 100ms debounce hold           */
}

/* ============================================================
   DELAY FUNCTION
   Generates approximately N milliseconds delay
   Calibrated for 11.0592 MHz clock (12 osc cycles/machine cycle)
   Machine cycle = 12 / 11.0592MHz ≈ 1.085 µs
   Inner loop: ~123 iterations × ~8µs ≈ 1ms
   ============================================================ */
void delay_ms(unsigned int ms) {
    unsigned int i, j;
    for (i = 0; i < ms; i++) {
        for (j = 0; j < 123; j++) {
            /* NOP-equivalent busy wait */
        }
    }
}`;

// ─── Connection data ───────────────────────────────────────────
const CONNECTIONS = [
  { from: "MQ2 Sensor", fromPin: "VCC",  to: "Power Rail",      toPin: "+5V",   color: "#f85149", type: "power",  wire: "Red" },
  { from: "MQ2 Sensor", fromPin: "GND",  to: "Power Rail",      toPin: "GND",   color: "#484f58", type: "ground", wire: "Black" },
  { from: "MQ2 Sensor", fromPin: "DOUT", to: "AT89C51",         toPin: "P1.0 (Pin 1)", color: "#f0883e", type: "signal", wire: "Orange" },
  { from: "MQ2 Sensor", fromPin: "AOUT", to: "Not Connected",   toPin: "N/C",   color: "#333",    type: "nc",     wire: "—" },
  { from: "AT89C51",    fromPin: "P2.0 (Pin 21)", to: "Resistor 330Ω", toPin: "In",  color: "#ffd600", type: "signal", wire: "Yellow" },
  { from: "Resistor 330Ω", fromPin: "Out", to: "LED (+) Anode", toPin: "+",    color: "#ffd600", type: "signal", wire: "Yellow" },
  { from: "LED",        fromPin: "Cathode (−)", to: "Power Rail", toPin: "GND", color: "#484f58", type: "ground", wire: "Black" },
  { from: "AT89C51",    fromPin: "P2.1 (Pin 22)", to: "Buzzer",  toPin: "(+)",  color: "#f85149", type: "signal", wire: "Red" },
  { from: "Buzzer",     fromPin: "(−)",  to: "Power Rail",      toPin: "GND",   color: "#484f58", type: "ground", wire: "Black" },
  { from: "AT89C51",    fromPin: "P2.2 (Pin 23)", to: "Relay Module", toPin: "IN1", color: "#3fb950", type: "signal", wire: "Green" },
  { from: "Relay Module", fromPin: "VCC", to: "Power Rail",     toPin: "+5V",   color: "#f85149", type: "power",  wire: "Red" },
  { from: "Relay Module", fromPin: "GND", to: "Power Rail",     toPin: "GND",   color: "#484f58", type: "ground", wire: "Black" },
  { from: "AT89C51",    fromPin: "VCC (Pin 40)", to: "Power Rail", toPin: "+5V", color: "#f85149", type: "power", wire: "Red" },
  { from: "AT89C51",    fromPin: "GND (Pin 20)", to: "Power Rail", toPin: "GND", color: "#484f58", type: "ground", wire: "Black" },
  { from: "AT89C51",    fromPin: "EA/VPP (Pin 31)", to: "Power Rail", toPin: "+5V", color: "#f85149", type: "power", wire: "Red" },
  { from: "AT89C51",    fromPin: "XTAL1 (Pin 19)", to: "Crystal 11.0592MHz", toPin: "Pin 1", color: "#d2a8ff", type: "clock", wire: "Purple" },
  { from: "AT89C51",    fromPin: "XTAL2 (Pin 18)", to: "Crystal 11.0592MHz", toPin: "Pin 2", color: "#d2a8ff", type: "clock", wire: "Purple" },
  { from: "Crystal",    fromPin: "Both pins", to: "Capacitors 33pF", toPin: "→ GND", color: "#d2a8ff", type: "clock", wire: "Purple" },
  { from: "AT89C51",    fromPin: "RST (Pin 9)", to: "10µF Cap + 10kΩ", toPin: "→ VCC", color: "#58a6ff", type: "reset", wire: "Blue" },
];

const typeColors = {
  power: "#f85149", ground: "#484f58", signal: "#58a6ff",
  clock: "#d2a8ff", reset: "#ffd600", nc: "#333"
};

// ─── SVG Circuit Diagram ───────────────────────────────────────
function CircuitDiagram() {
  const W = 820, H = 560;

  // Component boxes
  const components = {
    mq2:    { x: 30,  y: 200, w: 110, h: 130, label: "MQ2 SENSOR",     color: "#f0883e", bg: "#1a0f00" },
    mcu:    { x: 310, y: 80,  w: 200, h: 400, label: "AT89C51",         color: "#58a6ff", bg: "#00091a" },
    led:    { x: 630, y: 120, w: 100, h: 70,  label: "LED",             color: "#ffd600", bg: "#1a1500" },
    buzzer: { x: 630, y: 230, w: 100, h: 70,  label: "BUZZER",          color: "#f85149", bg: "#1a0000" },
    relay:  { x: 630, y: 340, w: 100, h: 90,  label: "RELAY MODULE",    color: "#3fb950", bg: "#001a09" },
    xtal:   { x: 310, y: 30,  w: 200, h: 34,  label: "11.0592 MHz XTAL", color: "#d2a8ff", bg: "#0d001a" },
    pwr:    { x: 30,  y: 30,  w: 110, h: 60,  label: "5V SUPPLY",       color: "#ff7b72", bg: "#1a0500" },
    res:    { x: 560, y: 132, w: 52,  h: 46,  label: "330Ω",            color: "#ffd600", bg: "#1a1500" },
  };

  const Box = ({ id, x, y, w, h, label, color, bg, pins }) => (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8}
        fill={bg} stroke={color} strokeWidth={1.5}
        style={{ filter: `drop-shadow(0 0 6px ${color}44)` }} />
      <text x={x + w / 2} y={y + 16} textAnchor="middle"
        fill={color} fontSize={10} fontWeight={700} fontFamily="monospace" letterSpacing={1}>{label}</text>
    </g>
  );

  // Wire helper
  const Wire = ({ x1, y1, x2, y2, color, dashed }) => (
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={1.8}
      strokeDasharray={dashed ? "4,3" : undefined}
      style={{ filter: `drop-shadow(0 0 3px ${color}88)` }} />
  );

  const WirePath = ({ d, color, dashed }) => (
    <path d={d} fill="none" stroke={color} strokeWidth={1.8}
      strokeDasharray={dashed ? "4,3" : undefined}
      style={{ filter: `drop-shadow(0 0 3px ${color}88)` }} />
  );

  const PinLabel = ({ x, y, text, color, anchor = "middle" }) => (
    <text x={x} y={y} textAnchor={anchor} fill={color || "#8b949e"}
      fontSize={8.5} fontFamily="monospace">{text}</text>
  );

  const Dot = ({ x, y, color }) => (
    <circle cx={x} cy={y} r={3} fill={color}
      style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
  );

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ background: "#010409", borderRadius: 12, display: "block" }}>
      {/* Grid */}
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#ffffff08" strokeWidth={0.5} />
        </pattern>
      </defs>
      <rect width={W} height={H} fill="url(#grid)" />

      {/* ── Power Rail labels ── */}
      <text x={170} y={25} fill="#f8514988" fontSize={9} fontFamily="monospace">+5V RAIL</text>
      <line x1={155} y1={28} x2={620} y2={28} stroke="#f8514944" strokeWidth={1} strokeDasharray="3,3" />
      <text x={170} y={H - 8} fill="#48485888" fontSize={9} fontFamily="monospace">GND RAIL</text>
      <line x1={155} y1={H - 12} x2={620} y2={H - 12} stroke="#48485844" strokeWidth={1} strokeDasharray="3,3" />

      {/* ── 5V Supply ── */}
      <Box {...components.pwr} />
      <PinLabel x={85} y={58} text="+5V" color="#f85149" />
      <PinLabel x={85} y={76} text="GND" color="#484f58" />
      <Wire x1={140} y1={50} x2={155} y2={50} color="#f85149" />
      <Wire x1={155} y1={28} x2={155} y2={50} color="#f85149" />
      <Wire x1={140} y1={68} x2={155} y2={68} color="#484f58" />
      <Wire x1={155} y1={H-12} x2={155} y2={68} color="#484f58" />

      {/* ── XTAL ── */}
      <Box {...components.xtal} />
      <Wire x1={350} y1={64} x2={350} y2={114} color="#d2a8ff" />
      <Wire x1={470} y1={64} x2={470} y2={114} color="#d2a8ff" />
      <PinLabel x={345} y={72} text="XTAL2→P18" color="#d2a8ff" anchor="end" />
      <PinLabel x={476} y={72} text="P19←XTAL1" color="#d2a8ff" anchor="start" />

      {/* ── MCU Box ── */}
      <Box {...components.mcu} />
      {/* MCU pin labels inside */}
      {[
        [355, 115, "Pin 1  · P1.0 ──→"],
        [355, 148, "Pin 18 · XTAL2"],
        [355, 165, "Pin 19 · XTAL1"],
        [355, 182, "Pin 9  · RST"],
        [355, 199, "Pin 20 · GND"],
        [355, 216, "Pin 31 · EA/VPP"],
        [355, 233, "Pin 40 · VCC"],
        [480, 248, "←── P2.0 · Pin 21"],
        [480, 282, "←── P2.1 · Pin 22"],
        [480, 316, "←── P2.2 · Pin 23"],
      ].map(([x, y, t], i) => (
        <text key={i} x={x} y={y} textAnchor={x < 410 ? "start" : "end"}
          fill="#7d8590" fontSize={8.5} fontFamily="monospace">{t}</text>
      ))}

      {/* ── MQ2 ── */}
      <Box {...components.mq2} />
      {[["VCC", 205], ["AOUT", 240], ["DOUT", 275], ["GND", 310]].map(([pin, y]) => (
        <PinLabel key={pin} x={58} y={y} text={pin} color="#f0883e" />
      ))}

      {/* MQ2 VCC → +5V rail */}
      <WirePath d="M 140 200 L 155 200 L 155 28" color="#f85149" />
      <Dot x={155} y={28} color="#f85149" />

      {/* MQ2 GND → GND rail */}
      <WirePath d="M 140 308 L 155 308 L 155 548" color="#484f58" />
      <Dot x={155} y={548} color="#484f58" />

      {/* MQ2 DOUT → P1.0 (Pin 1) */}
      <WirePath d="M 140 272 L 230 272 L 230 115 L 310 115" color="#f0883e" />
      <Dot x={140} y={272} color="#f0883e" />
      <Dot x={310} y={115} color="#f0883e" />
      <PinLabel x={225} y={268} text="DOUT→P1.0" color="#f0883e" anchor="end" />

      {/* MQ2 AOUT NC */}
      <line x1={140} y1={238} x2={168} y2={238} stroke="#333" strokeWidth={1} strokeDasharray="3,3" />
      <text x={172} y={241} fill="#333" fontSize={8} fontFamily="monospace">N/C</text>

      {/* ── RST circuit ── */}
      <WirePath d="M 310 182 L 270 182" color="#58a6ff" />
      <text x={200} y={178} fill="#58a6ff" fontSize={8} fontFamily="monospace">10µF + 10kΩ → VCC</text>
      <WirePath d="M 270 182 L 265 182 L 265 28" color="#58a6ff" dashed />
      <Dot x={265} y={28} color="#58a6ff" />

      {/* ── EA/VPP → VCC ── */}
      <WirePath d="M 310 216 L 280 216 L 280 28" color="#f85149" dashed />
      <Dot x={280} y={28} color="#f85149" />

      {/* ── MCU VCC ── */}
      <WirePath d="M 310 233 L 290 233 L 290 28" color="#f85149" dashed />
      <Dot x={290} y={28} color="#f85149" />

      {/* ── MCU GND ── */}
      <WirePath d="M 310 199 L 298 199 L 298 548" color="#484f58" dashed />
      <Dot x={298} y={548} color="#484f58" />

      {/* ── Resistor 330Ω ── */}
      <Box {...components.res} />
      <PinLabel x={586} y={152} text="330Ω" color="#ffd600" />

      {/* P2.0 → Resistor → LED */}
      <Wire x1={510} y1={248} x2={540} y2={248} color="#ffd600" />
      <WirePath d="M 540 248 L 540 155 L 560 155" color="#ffd600" />
      <Wire x1={612} y1={155} x2={630} y2={155} color="#ffd600" />
      <Dot x={510} y={248} color="#ffd600" />

      {/* ── LED ── */}
      <Box {...components.led} />
      <PinLabel x={680} y={148} text="(+) Anode" color="#ffd600" />
      <PinLabel x={680} y={162} text="(−) Cathode" color="#484f58" />
      {/* LED symbol */}
      <polygon points="665,170 665,182 674,176" fill="#ffd600" opacity={0.8} />
      <line x1={674} y1={170} x2={674} y2={182} stroke="#ffd600" strokeWidth={1.5} />
      <line x1={676} y1={168} x2={680} y2={165} stroke="#ffd600" strokeWidth={1} />
      <line x1={676} y1={172} x2={680} y2={169} stroke="#ffd600" strokeWidth={1} />
      {/* LED GND */}
      <WirePath d="M 680 178 L 680 548" color="#484f58" />
      <Dot x={680} y={548} color="#484f58" />

      {/* ── Buzzer ── */}
      <Box {...components.buzzer} />
      <PinLabel x={680} y={257} text="(+) VCC/SIG" color="#f85149" />
      <PinLabel x={680} y={272} text="(−) GND" color="#484f58" />
      {/* P2.1 → Buzzer */}
      <Wire x1={510} y1={282} x2={550} y2={282} color="#f85149" />
      <WirePath d="M 550 282 L 550 262 L 630 262" color="#f85149" />
      <Dot x={510} y={282} color="#f85149" />
      <Dot x={630} y={262} color="#f85149" />
      {/* Buzzer GND */}
      <WirePath d="M 700 278 L 700 548" color="#484f58" />
      <Dot x={700} y={548} color="#484f58" />
      {/* Buzzer symbol */}
      <path d="M 665 264 Q 680 256 665 276" fill="none" stroke="#f85149" strokeWidth={1.5} />
      <path d="M 662 261 Q 680 253 662 279" fill="none" stroke="#f85149" strokeWidth={1} opacity={0.5} />

      {/* ── Relay ── */}
      <Box {...components.relay} />
      <PinLabel x={680} y={367} text="VCC (+5V)" color="#f85149" />
      <PinLabel x={680} y={381} text="GND" color="#484f58" />
      <PinLabel x={680} y={395} text="IN1 (signal)" color="#3fb950" />
      <PinLabel x={680} y={409} text="COM / NC / NO" color="#7d8590" />
      {/* P2.2 → Relay IN1 */}
      <Wire x1={510} y1={316} x2={550} y2={316} color="#3fb950" />
      <WirePath d="M 550 316 L 550 398 L 630 398" color="#3fb950" />
      <Dot x={510} y={316} color="#3fb950" />
      <Dot x={630} y={398} color="#3fb950" />
      {/* Relay VCC */}
      <WirePath d="M 680 370 L 720 370 L 720 28" color="#f85149" dashed />
      <Dot x={720} y={28} color="#f85149" />
      {/* Relay GND */}
      <WirePath d="M 710 384 L 726 384 L 726 548" color="#484f58" dashed />
      <Dot x={726} y={548} color="#484f58" />
      {/* Relay coil symbol */}
      <rect x={648} y={420} width={40} height={20} rx={2} fill="none" stroke="#3fb950" strokeWidth={1} />
      <line x1={658} y1={420} x2={658} y2={440} stroke="#3fb950" strokeWidth={0.8} />
      <line x1={668} y1={420} x2={668} y2={440} stroke="#3fb950" strokeWidth={0.8} />
      <line x1={678} y1={420} x2={678} y2={440} stroke="#3fb950" strokeWidth={0.8} />

      {/* Title */}
      <text x={W/2} y={H - 6} textAnchor="middle" fill="#484f58" fontSize={9} fontFamily="monospace">
        Gas Leakage Detection System · AT89C51 · Proteus Design Suite
      </text>
    </svg>
  );
}

// ─── Code block ───────────────────────────────────────────────
function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
        style={{
          position: "absolute", top: 8, right: 8, zIndex: 10,
          background: copied ? "#238636" : "#21262d",
          border: `1px solid ${copied ? "#2ea043" : "#30363d"}`,
          color: copied ? "#3fb950" : "#8b949e",
          borderRadius: 6, padding: "4px 10px", fontSize: 11,
          cursor: "pointer", fontFamily: "monospace", transition: "all 0.2s",
        }}>{copied ? "✓ Copied" : "Copy"}</button>
      <div style={{
        background: "#0d1117", border: "1px solid #30363d", borderRadius: 8,
        padding: "42px 16px 16px", maxHeight: 500, overflowY: "auto", overflowX: "auto",
      }}>
        <pre style={{ margin: 0, fontFamily: "'Courier New', monospace", fontSize: 12, lineHeight: 1.75, color: "#e6edf3" }}>
          {code.split("\n").map((line, i) => {
            const isComment = line.trim().startsWith(";") || line.trim().startsWith("//")
              || line.trim().startsWith("/*") || line.trim().startsWith("*")
              || line.trim().startsWith("┌") || line.trim().startsWith("│") || line.trim().startsWith("└");
            const isPreproc = line.trim().startsWith("#");
            const kwC = ["void", "while", "if", "else", "return", "unsigned", "int", "for", "sbit"].some(k => new RegExp(`\\b${k}\\b`).test(line));
            const kwA = ["ORG","MOV","CLR","SETB","JB","JNZ","SJMP","LCALL","DJNZ","RET","END","ANL"].some(k => new RegExp(`\\b${k}\\b`).test(line));
            return (
              <div key={i} style={{ display: "flex", gap: 14 }}>
                <span style={{ color: "#30363d", minWidth: 28, textAlign: "right", userSelect: "none" }}>{i + 1}</span>
                <span style={{
                  color: isComment ? "#6e7681" : isPreproc ? "#ff7b72" : (kwC || kwA) ? "#79c0ff" : "#e6edf3",
                  fontStyle: isComment ? "italic" : "normal",
                }}>{line || " "}</span>
              </div>
            );
          })}
        </pre>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────
export default function CircuitApp() {
  const [tab, setTab] = useState("diagram");
  const [codeTab, setCodeTab] = useState("asm");

  const typeTag = (type) => {
    const cfg = {
      power:  { bg: "#3d0f0f", color: "#f85149", label: "PWR" },
      ground: { bg: "#1a1a1a", color: "#8b949e", label: "GND" },
      signal: { bg: "#0c1a2e", color: "#58a6ff", label: "SIG" },
      clock:  { bg: "#1a0d2e", color: "#d2a8ff", label: "CLK" },
      reset:  { bg: "#1a1500", color: "#ffd600", label: "RST" },
      nc:     { bg: "#111",    color: "#484f58", label: "N/C" },
    }[type] || {};
    return (
      <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}44`,
        borderRadius: 4, padding: "1px 6px", fontSize: 9, fontWeight: 700, fontFamily: "monospace" }}>
        {cfg.label}
      </span>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "#010409", color: "#e6edf3", fontFamily: "'Courier New', monospace" }}>
      <style>{`
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0d1117; }
        ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }
        .tb { background: none; border: none; cursor: pointer; font-family: 'Courier New', monospace; transition: all 0.2s; }
        .tb:hover { color: #e6edf3 !important; }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #21262d", padding: "14px 24px",
        background: "linear-gradient(180deg,#0d1117,#010409)" }}>
        <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 2, color: "#58a6ff" }}>
          ⚡ GAS LEAKAGE DETECTION SYSTEM
        </div>
        <div style={{ fontSize: 11, color: "#484f58", marginTop: 3 }}>
          AT89C51 · MQ2 Sensor · Full Circuit Connections + Source Code
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid #21262d", padding: "0 24px", display: "flex", gap: 0 }}>
        {[["diagram","🔌 Circuit Diagram"],["table","📋 Connection Table"],["code","</> Source Code"]].map(([id, label]) => (
          <button key={id} className="tb" onClick={() => setTab(id)} style={{
            padding: "11px 18px", fontSize: 12, letterSpacing: 0.5,
            color: tab === id ? "#58a6ff" : "#7d8590",
            borderBottom: tab === id ? "2px solid #58a6ff" : "2px solid transparent",
            fontWeight: tab === id ? 700 : 400,
          }}>{label}</button>
        ))}
      </div>

      {/* ── Circuit Diagram ── */}
      {tab === "diagram" && (
        <div style={{ padding: 20 }}>
          <div style={{ marginBottom: 14, padding: "10px 16px", background: "#0d1117",
            border: "1px solid #30363d", borderRadius: 8, fontSize: 11, color: "#7d8590",
            display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
            {[["─── Orange","MQ2 Signal (DOUT→P1.0)","#f0883e"],
              ["─── Yellow","LED Signal (P2.0→330Ω→LED)","#ffd600"],
              ["─── Red","Power (+5V)","#f85149"],
              ["─── Green","Relay Signal (P2.2→IN1)","#3fb950"],
              ["─── Blue (dashed)","RST/EA/VCC lines","#58a6ff"],
              ["─── Purple","Crystal clock","#d2a8ff"],
              ["─── Dark","GND lines","#484f58"],
            ].map(([sym, desc, col]) => (
              <span key={sym} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: col, fontWeight: 700 }}>{sym}</span>
                <span style={{ color: "#484f58" }}>{desc}</span>
              </span>
            ))}
          </div>
          <CircuitDiagram />

          {/* Quick ref below diagram */}
          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
            {[
              { label: "MQ2 DOUT", pin: "→ P1.0", color: "#f0883e", note: "Digital gas signal" },
              { label: "P2.0 → 330Ω", pin: "→ LED (+)", color: "#ffd600", note: "330Ω limits current" },
              { label: "P2.1", pin: "→ Buzzer (+)", color: "#f85149", note: "Active HIGH buzzer" },
              { label: "P2.2", pin: "→ Relay IN1", color: "#3fb950", note: "Active LOW relay" },
            ].map(({ label, pin, color, note }) => (
              <div key={label} style={{ background: "#0d1117", border: `1px solid ${color}44`,
                borderLeft: `3px solid ${color}`, borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ color, fontWeight: 700, fontSize: 12 }}>{label}</div>
                <div style={{ color: "#c9d1d9", fontSize: 11, marginTop: 2 }}>{pin}</div>
                <div style={{ color: "#484f58", fontSize: 10, marginTop: 2 }}>{note}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Connection Table ── */}
      {tab === "table" && (
        <div style={{ padding: 20 }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "monospace" }}>
              <thead>
                <tr style={{ background: "#0d1117", borderBottom: "2px solid #21262d" }}>
                  {["#", "From Component", "From Pin", "To Component", "To Pin", "Wire Color", "Type", "Notes"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#58a6ff",
                      fontWeight: 700, fontSize: 11, letterSpacing: 1, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CONNECTIONS.map((c, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #21262d",
                    background: i % 2 === 0 ? "#0a0e13" : "#010409",
                    transition: "background 0.15s" }}>
                    <td style={{ padding: "8px 14px", color: "#484f58" }}>{String(i+1).padStart(2,"0")}</td>
                    <td style={{ padding: "8px 14px", color: "#e6edf3", fontWeight: 600 }}>{c.from}</td>
                    <td style={{ padding: "8px 14px" }}>
                      <code style={{ background: "#161b22", border: "1px solid #30363d",
                        borderRadius: 4, padding: "1px 6px", color: typeColors[c.type], fontSize: 11 }}>
                        {c.fromPin}
                      </code>
                    </td>
                    <td style={{ padding: "8px 14px", color: "#e6edf3", fontWeight: 600 }}>{c.to}</td>
                    <td style={{ padding: "8px 14px" }}>
                      <code style={{ background: "#161b22", border: "1px solid #30363d",
                        borderRadius: 4, padding: "1px 6px", color: typeColors[c.type], fontSize: 11 }}>
                        {c.toPin}
                      </code>
                    </td>
                    <td style={{ padding: "8px 14px" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 10, height: 10, borderRadius: "50%",
                          background: c.color, display: "inline-block",
                          boxShadow: `0 0 4px ${c.color}` }} />
                        <span style={{ color: "#8b949e" }}>{c.wire}</span>
                      </span>
                    </td>
                    <td style={{ padding: "8px 14px" }}>{typeTag(c.type)}</td>
                    <td style={{ padding: "8px 14px", color: "#484f58", fontSize: 11 }}>
                      {c.type === "power" && "Regulated 5V DC"}
                      {c.type === "ground" && "Common ground"}
                      {c.type === "signal" && "Logic-level signal"}
                      {c.type === "clock" && "33pF caps to GND each side"}
                      {c.type === "reset" && "Power-on reset circuit"}
                      {c.type === "nc" && "Leave unconnected"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Notes */}
          <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {[
              { title: "⚠ Important Notes", color: "#f0883e", items: [
                "Always connect EA/VPP (Pin 31) to VCC for internal ROM",
                "Crystal capacitors: 33pF ceramic on both XTAL1 and XTAL2 to GND",
                "RST circuit: 10µF electrolytic (+ to VCC) and 10kΩ resistor in parallel",
                "MQ2 needs 24–48hr preheat for accurate readings in real hardware",
                "Use a flyback diode (1N4007) across relay coil to protect MCU",
              ]},
              { title: "🔌 Relay Output Connections", color: "#3fb950", items: [
                "COM → Main appliance supply line",
                "NC (Normally Closed) → use this for safety: power OFF when relay de-energizes",
                "NO (Normally Open) → remains open in normal condition",
                "Relay cuts power when P2.2 = LOW (gas detected)",
                "5V relay module with optocoupler recommended for isolation",
              ]},
            ].map(({ title, color, items }) => (
              <div key={title} style={{ background: "#0d1117", border: `1px solid ${color}33`,
                borderRadius: 8, padding: "14px 16px" }}>
                <div style={{ color, fontWeight: 700, fontSize: 12, marginBottom: 10 }}>{title}</div>
                {items.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 11 }}>
                    <span style={{ color, marginTop: 1 }}>›</span>
                    <span style={{ color: "#8b949e", lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Source Code ── */}
      {tab === "code" && (
        <div style={{ padding: 20, maxWidth: 860 }}>
          <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #21262d", marginBottom: 16 }}>
            {[["asm","📄 Assembly (8051)"],["c","📄 Embedded C (Keil C51)"]].map(([id, label]) => (
              <button key={id} className="tb" onClick={() => setCodeTab(id)} style={{
                padding: "10px 18px", fontSize: 12,
                color: codeTab === id ? "#58a6ff" : "#7d8590",
                borderBottom: codeTab === id ? "2px solid #58a6ff" : "2px solid transparent",
                fontWeight: codeTab === id ? 700 : 400,
              }}>{label}</button>
            ))}
          </div>

          <div style={{ marginBottom: 14, padding: "10px 16px", background: "#0d1117",
            border: "1px solid #30363d", borderRadius: 8, display: "flex", gap: 24,
            flexWrap: "wrap", fontSize: 11, color: "#7d8590" }}>
            <span>🎯 MCU: <span style={{ color: "#58a6ff" }}>AT89C51</span></span>
            <span>⚡ Clock: <span style={{ color: "#58a6ff" }}>11.0592 MHz</span></span>
            <span>🔧 IDE: <span style={{ color: "#58a6ff" }}>{codeTab === "asm" ? "Keil / MIDE-51" : "Keil uVision C51"}</span></span>
            <span>📦 Hex: <span style={{ color: "#58a6ff" }}>Burn to chip via ISP / Proteus</span></span>
          </div>

          <CodeBlock code={codeTab === "asm" ? CODE_ASM : CODE_C} />

          <div style={{ marginTop: 16, padding: "12px 16px", background: "#0d1117",
            border: "1px solid #30363d", borderRadius: 8, fontSize: 11, color: "#7d8590" }}>
            <div style={{ color: "#58a6ff", fontWeight: 700, marginBottom: 8 }}>📋 How to Run</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {[
                ["1.", "Open Keil uVision → New Project → Select AT89C51"],
                ["2.", `Add ${codeTab === "asm" ? ".asm" : ".c"} source file → Build (F7)`],
                ["3.", "Open Proteus → Place AT89C51, MQ2 (logic switch), LED, Buzzer, Relay"],
                ["4.", "Load generated .hex file into AT89C51 in Proteus"],
                ["5.", "Set clock to 11.0592 MHz in Proteus MCU properties"],
                ["6.", "Run simulation → toggle MQ2 logic input to test"],
              ].map(([n, step]) => (
                <div key={n} style={{ display: "flex", gap: 8 }}>
                  <span style={{ color: "#58a6ff", fontWeight: 700 }}>{n}</span>
                  <span style={{ color: "#8b949e" }}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
