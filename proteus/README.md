# 🖥️ Proteus Simulation Setup Guide

## Components to Place in Proteus

| Proteus Search Term | Component | Library |
|---------------------|-----------|---------|
| AT89C51 | 8051 Microcontroller | MicroController |
| MQ-2 | Gas Sensor (use LOGICSTATE toggle) | — |
| LED-RED | Red LED | Active |
| BUZZER | Piezo Buzzer | Active |
| RELAY | 5V Relay | Electromechanical |
| RES | 330Ω Resistor | Device |
| CRYSTAL | 11.0592 MHz | Device |
| CAP | 33pF Capacitor × 2 | Device |
| CAP-ELEC | 10µF Electrolytic | Device |
| RES | 10kΩ Resistor | Device |
| LOGICSTATE | Toggle switch (simulate MQ2) | Simulator |
| LOGICANALYSER | View output waveforms | Simulator |
| POWER | +5V supply | Terminals |
| GROUND | GND | Terminals |

---

## Step-by-Step Setup

### Step 1: Build .hex in Keil
1. Open **Keil uVision** → New µVision Project
2. Select: `Atmel` → `AT89C51`
3. Add source file (`gas_detection.asm` or `gas_detection.c`)
4. In Project Options → Output → check **"Create HEX File"**
5. Build (F7) → `.hex` file generated in `Objects/` folder

### Step 2: Open Proteus
1. Open **Proteus Design Suite**
2. New Project → Schematic

### Step 3: Place Components
1. Press `P` to open component browser
2. Search and place all components from the table above
3. For MQ2 simulation: use **LOGICSTATE** component (acts as toggle switch)

### Step 4: Connect Wiring
```
LOGICSTATE output  → P1.0  (Pin 1)
P2.0 (Pin 21)      → 330Ω  → LED(+) → LED(−) → GND
P2.1 (Pin 22)      → BUZZER(+) → BUZZER(−) → GND
P2.2 (Pin 23)      → RELAY IN1
VCC  (Pin 40)      → +5V
GND  (Pin 20)      → GND
EA   (Pin 31)      → +5V
RST  (Pin  9)      → 10µF + 10kΩ → +5V
XTAL1 (Pin 19)     → CRYSTAL → XTAL2 (Pin 18)
CRYSTAL both pins  → 33pF → GND
```

### Step 5: Load HEX into AT89C51
1. Double-click the AT89C51 in Proteus
2. In **Program File** field → browse to your `.hex` file
3. Set **Crystal Frequency** to `11.0592MHz`
4. Click OK

### Step 6: Run Simulation
1. Press ▶ (Play) to start simulation
2. **LOGICSTATE = 0 (LOW):** Normal state → LED OFF, Buzzer OFF, Relay ON
3. **LOGICSTATE = 1 (HIGH):** Gas detected → LED ON, Buzzer ON, Relay OFF
4. Toggle the LOGICSTATE to simulate gas leakage event

### Step 7: Verify with Logic Analyser
1. Add **LOGICANALYSER** from simulator instruments
2. Connect probes to P1.0, P2.0, P2.1, P2.2
3. Observe waveforms — confirm correct output switching

---

## Expected Simulation Behaviour

| LOGICSTATE (MQ2) | P2.0 (LED) | P2.1 (BUZZER) | P2.2 (RELAY) |
|-----------------|-----------|--------------|-------------|
| 0 (No Gas) | 0 (OFF) | 0 (OFF) | 1 (ON) |
| 1 (Gas!) | 1 (ON) | 1 (ON) | 0 (OFF) |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| MCU not running | Check EA/VPP tied to +5V; check crystal connections |
| LED always ON/OFF | Check 330Ω resistor; verify P2.0 wiring |
| Relay not switching | Verify P2.2 connected to IN1; check relay VCC/GND |
| HEX not loading | Rebuild in Keil with "Create HEX File" option enabled |
| No response to input | Check LOGICSTATE connected to P1.0; check GND connections |
