# 📐 Circuit Diagram & Connections

## Full Connection Diagram (Text Schematic)

```
                        +5V POWER RAIL
   ┌──────────────────────────────────────────────────────────┐
   │          │           │            │          │           │
[5V PSU]  [AT89C51]   [MQ2 VCC]   [Relay VCC] [EA/VPP]  [RST→10kΩ]
   │        Pin40         │            │        Pin31      Pin9
   │          │           │            │                      │
   │          │         [MQ2]        [Relay]              [10µF]
   │          │         Sensor       Module                   │
   │       [XTAL]      VCC GND      VCC GND IN1              GND
   │      11.0592MHz    │   │        │   │   ↑
   │      Pin18 Pin19   │   │        │   │   │
   │     [33pF][33pF]   │   │        │   │  P2.2(Pin23)
   │       │       │    │   │        │   │   │
   │      GND     GND   │  GND      GND GND  │  ← Active LOW
   │                    │                    │
   │                   DOUT → P1.0(Pin1)     │
   │                                         │
   │       P2.0(Pin21) → [330Ω] → LED(+) → LED(−) → GND
   │       P2.1(Pin22) → Buzzer(+)  Buzzer(−) → GND
   │       P2.2(Pin23) → Relay IN1
   │       GND(Pin20)  → GND RAIL
   │
   └──────────────────────────────────────────────────────────┐
                        GND RAIL                              │
```

---

## Complete Pin-by-Pin Connection Table

| # | From | From Pin | → | To | To Pin | Wire | Type |
|---|------|----------|---|----|--------|------|------|
| 01 | MQ2 Sensor | VCC | → | Power Rail | +5V | Red | Power |
| 02 | MQ2 Sensor | GND | → | Power Rail | GND | Black | Ground |
| 03 | MQ2 Sensor | DOUT | → | AT89C51 | P1.0 (Pin 1) | Orange | Signal |
| 04 | MQ2 Sensor | AOUT | → | — | N/C | — | Not Used |
| 05 | AT89C51 | P2.0 (Pin 21) | → | Resistor 330Ω | In | Yellow | Signal |
| 06 | Resistor 330Ω | Out | → | LED Anode (+) | + | Yellow | Signal |
| 07 | LED | Cathode (−) | → | Power Rail | GND | Black | Ground |
| 08 | AT89C51 | P2.1 (Pin 22) | → | Buzzer | (+) | Red | Signal |
| 09 | Buzzer | (−) | → | Power Rail | GND | Black | Ground |
| 10 | AT89C51 | P2.2 (Pin 23) | → | Relay Module | IN1 | Green | Signal |
| 11 | Relay Module | VCC | → | Power Rail | +5V | Red | Power |
| 12 | Relay Module | GND | → | Power Rail | GND | Black | Ground |
| 13 | AT89C51 | VCC (Pin 40) | → | Power Rail | +5V | Red | Power |
| 14 | AT89C51 | GND (Pin 20) | → | Power Rail | GND | Black | Ground |
| 15 | AT89C51 | EA/VPP (Pin 31) | → | Power Rail | +5V | Red | Power |
| 16 | AT89C51 | XTAL1 (Pin 19) | → | Crystal | Pin 1 | Purple | Clock |
| 17 | AT89C51 | XTAL2 (Pin 18) | → | Crystal | Pin 2 | Purple | Clock |
| 18 | Crystal | Both Pins | → | 33pF Caps | → GND | Purple | Clock |
| 19 | AT89C51 | RST (Pin 9) | → | 10µF + 10kΩ | → VCC | Blue | Reset |

---

## RST Reset Circuit

```
+5V ──┬──[10kΩ]──┬── RST (Pin 9)
      │           │
    [10µF]       (junction)
      │
     GND
```

- On power-up, capacitor charges slowly → RST held HIGH briefly → MCU resets
- After charging, RST goes LOW → MCU starts executing from address 0000H

---

## Crystal Oscillator Circuit

```
XTAL2 (Pin 18) ──┬── Crystal ──┬── XTAL1 (Pin 19)
                 │             │
               [33pF]        [33pF]
                 │             │
                GND           GND
```

- Use 11.0592 MHz for accurate UART baud rates (though not used here)
- 33pF ceramic capacitors on both sides to GND

---

## Relay Output Wiring

```
        [Relay Module]
        ┌────────────┐
        │ COM ───────┼──── Main supply line (Live wire)
        │ NC  ───────┼──── Load / Appliance
        │ NO  ───────┼──── (Not used)
        │ IN1 ←──────┼──── P2.2 (Pin 23) of 8051
        │ VCC ───────┼──── +5V
        │ GND ───────┼──── GND
        └────────────┘
```

> **Safety note:** Use **NC (Normally Closed)** terminal so that power is ON normally
> and cuts OFF when relay de-energizes (i.e., when gas is detected).
> Add a **1N4007 flyback diode** across the relay coil to protect the 8051 from back-EMF.

---

## Important Notes

1. **EA/VPP (Pin 31)** must always be connected to **+5V** to use the internal ROM of AT89C51
2. **MQ2 preheat time:** Allow 24–48 hours of burn-in for accurate gas readings in real hardware
3. **Flyback diode:** Place 1N4007 across relay coil (cathode to +5V, anode to GND side)
4. **Current limiting:** The 330Ω resistor limits LED current to ~9mA (safe for 8051 output pin)
5. **Power supply:** Use a regulated 5V DC adapter or 7805 regulator circuit
