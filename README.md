# ⚡ Gas Leakage Detection System
### Using 8051 Microcontroller (AT89C51) + MQ2 Gas Sensor

![Status](https://img.shields.io/badge/Status-Complete-brightgreen)
![MCU](https://img.shields.io/badge/MCU-AT89C51%2FAT89S52-blue)
![Sensor](https://img.shields.io/badge/Sensor-MQ2-orange)
![Simulation](https://img.shields.io/badge/Simulation-Proteus-purple)
![License](https://img.shields.io/badge/License-MIT-yellow)

> A safety-critical embedded system that detects hazardous gas leakage (LPG, methane, smoke) using an MQ2 sensor and an 8051 microcontroller. On detection, it triggers a **buzzer**, **LED alert**, and **cuts the main power supply** via a relay.

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Features](#-features)
- [Hardware Components](#-hardware-components)
- [Pin Connections](#-pin-connections)
- [Circuit Diagram](#-circuit-diagram)
- [System Working](#-system-working)
- [Source Code](#-source-code)
- [Simulation](#-simulation)
- [How to Run](#-how-to-run)
- [Project Structure](#-project-structure)
- [Applications](#-applications)
- [Team](#-team)

---

## 🔍 Project Overview

This project implements a **Gas Leakage Detection System** designed and simulated using:

- **Microcontroller:** AT89C51 (8051 family)
- **Gas Sensor:** MQ2 (detects LPG, methane, smoke, hydrogen)
- **Simulation Tool:** Proteus Design Suite
- **Programming:** Assembly (8051) + Embedded C (Keil uVision)

The system continuously monitors the environment. When gas is detected:
- 🔴 **LED** turns ON (visual alert)
- 🔔 **Buzzer** sounds (audio alert)  
- ⚡ **Relay** switches OFF (cuts main power to prevent fire/explosion)

---

## ✨ Features

- Real-time gas monitoring using MQ2 sensor
- Dual alert system — visual (LED) + audio (buzzer)
- Automatic power cut-off via relay for fire prevention
- Simple, low-cost, reliable design
- Fully simulated in Proteus before hardware implementation
- Written in both Assembly and Embedded C

---

## 🔩 Hardware Components

| Component | Specification | Quantity |
|-----------|--------------|----------|
| Microcontroller | AT89C51 / AT89S52 (8051) | 1 |
| Gas Sensor | MQ2 (LPG/Methane/Smoke) | 1 |
| Relay Module | 5V Single Channel | 1 |
| LED | Red, 5mm | 1 |
| Buzzer | Piezo, 5V, Active HIGH | 1 |
| Resistor | 330Ω (for LED current limiting) | 1 |
| Resistor | 10kΩ (RST pull-up) | 1 |
| Capacitor | 10µF electrolytic (RST circuit) | 1 |
| Capacitor | 33pF ceramic × 2 (crystal) | 2 |
| Crystal | 11.0592 MHz | 1 |
| Power Supply | 5V DC regulated | 1 |
| Diode | 1N4007 (relay flyback protection) | 1 |
| Connecting Wires | Jumper wires | As needed |

---

## 🔌 Pin Connections

### 8051 Microcontroller ↔ Components

| 8051 Pin | Pin No. | Connected To | Notes |
|----------|---------|-------------|-------|
| P1.0 | 1 | MQ2 DOUT | Digital input — HIGH = gas detected |
| P2.0 | 21 | LED (+) via 330Ω | Output — HIGH = LED ON |
| P2.1 | 22 | Buzzer (+) | Output — HIGH = buzzer ON |
| P2.2 | 23 | Relay IN1 | Output — LOW = relay OFF (cuts power) |
| VCC | 40 | +5V rail | Power supply |
| GND | 20 | GND rail | Common ground |
| EA/VPP | 31 | +5V | Must be HIGH for internal ROM |
| RST | 9 | 10µF + 10kΩ → VCC | Power-on reset circuit |
| XTAL1 | 19 | Crystal Pin 1 | 11.0592 MHz + 33pF to GND |
| XTAL2 | 18 | Crystal Pin 2 | 11.0592 MHz + 33pF to GND |

### MQ2 Sensor ↔ 8051

| MQ2 Pin | Connected To | Notes |
|---------|-------------|-------|
| VCC | +5V | Sensor power |
| GND | GND | Common ground |
| DOUT | P1.0 (Pin 1) | Digital output — HIGH when gas detected |
| AOUT | Not Connected | Analog output (not used in this design) |

### Relay Module

| Relay Pin | Connected To | Notes |
|-----------|-------------|-------|
| VCC | +5V | Module power |
| GND | GND | Common ground |
| IN1 | P2.2 (Pin 23) | Active LOW signal from 8051 |
| COM | Main supply line | Common terminal of relay |
| NC | Load (appliance) | Normally Closed — use for safety cutoff |

---

## 📐 Circuit Diagram

```
         +5V ──────────────────────────────────────────────────
          │           │             │          │         │
        [MQ2]     [AT89C51]      [Relay]    [LED]   [Buzzer]
          │           │           Module    (+)Anode   (+)
         VCC        VCC(40)        VCC        │         │
          │           │             │       [330Ω]      │
         DOUT──────→P1.0(1)       IN1←────P2.2(23)     │
          │         P2.0(21)────→──┘       Cathode   P2.1(22)←─┐
         GND        P2.1(22)────────────────────→────Buzzer(+)  │
          │         P2.2(23)   EA/VPP(31)──→+5V        │       │
          │         GND(20)    RST(9)──[10µF+10kΩ]→VCC │       │
          │           │        XTAL1(19)──[CRYSTAL]     │       │
          │           │        XTAL2(18)──[33pF×2→GND]  │       │
         GND ──────────────────────────────────────────────────
```

---

## ⚙️ System Working

### State Machine

```
Power ON → Initialize Ports
              │
              ▼
         Read P1.0 (MQ2)
              │
       ┌──────┴──────┐
    LOW (0)       HIGH (1)
    No Gas        Gas Detected
       │               │
  SAFE MODE       ALERT MODE
  LED    = OFF    LED    = ON
  BUZZER = OFF    BUZZER = ON
  RELAY  = ON     RELAY  = OFF
       │               │
       └──────┬─────────┘
              │
          Loop back
```

### Logic Table

| MQ2 Output | LED | Buzzer | Relay | Condition |
|-----------|-----|--------|-------|-----------|
| LOW (0) | OFF | OFF | ON | Normal — no gas |
| HIGH (1) | ON | ON | OFF | Alert — gas detected! |

---

## 💻 Source Code

Two implementations are provided:

### 1. Assembly (`src/gas_detection.asm`)
Full 8051 assembly with detailed comments. Suitable for MIDE-51 or Keil uVision assembler.

### 2. Embedded C (`src/gas_detection.c`)
Clean C51 code for Keil uVision with modular functions:
- `system_init()` — configure all pins
- `safe_mode()` — handle normal condition
- `alert_mode()` — handle gas detection

See the [`src/`](./src/) folder for full source code.

---

## 🖥️ Simulation

The interactive web simulation is in [`simulation/`](./simulation/).

**To run the simulation locally:**
1. Go to [stackblitz.com/fork/react](https://stackblitz.com/fork/react)
2. Replace `App.jsx` with the contents of `simulation/App.jsx`
3. It runs instantly in the browser

**To simulate in Proteus:**
1. Open Keil uVision → build either `.asm` or `.c` → generates `.hex`
2. Open Proteus → place AT89C51, MQ2 (use logic toggle), LED, Buzzer, Relay
3. Load `.hex` into AT89C51 → set clock to 11.0592 MHz
4. Run simulation → toggle MQ2 input to test both states

---

## 🚀 How to Run

### Keil uVision (Assembly)
```
1. Open Keil uVision → Project → New Project
2. Select Device: Atmel → AT89C51
3. Add src/gas_detection.asm to Source Group
4. Build (F7) → generates .hex in output folder
5. Load .hex into Proteus
```

### Keil uVision (Embedded C)
```
1. Open Keil uVision → Project → New Project
2. Select Device: Atmel → AT89C51
3. Add src/gas_detection.c to Source Group
4. Build (F7) → generates .hex in output folder
5. Load .hex into Proteus
```

---

## 📁 Project Structure

```
gas-leakage-detection/
│
├── README.md                  ← You are here
├── LICENSE                    ← MIT License
├── .gitignore                 ← Git ignore rules
│
├── src/
│   ├── gas_detection.asm      ← 8051 Assembly source code
│   └── gas_detection.c        ← Embedded C (Keil C51) source
│
├── simulation/
│   └── App.jsx                ← Interactive React simulation
│
├── docs/
│   ├── circuit_diagram.md     ← Detailed circuit explanation
│   └── connections.md         ← Full pin connection table
│
└── proteus/
    └── README.md              ← Proteus simulation setup guide
```

---

## 📱 Applications

- Gas leakage detection in homes and kitchens
- Industrial safety systems in factories and plants
- LPG / CNG gas monitoring systems
- Fire detection and alarm systems
- Smart home safety automation
- Laboratories and chemical storage areas

---

## 👥 Team

| Name | Roll No | Institution |
|------|---------|-------------|
| Vanshika Malwankar | 24EC28 | AITD, Goa |
| Shivam Gawade | 24EC25 | AITD, Goa |

**Institution:** Agnel Institute of Technology and Design (AITD)  
**Agnel Technical Educational Complex, Assagao, Bardez-Goa 403 507**  
🌐 [www.aitdgoa.edu.in](http://www.aitdgoa.edu.in)

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

> ⭐ If this project helped you, consider giving it a star on GitHub!
