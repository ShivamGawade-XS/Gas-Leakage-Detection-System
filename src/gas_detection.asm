; ============================================================
; Gas Leakage Detection System — 8051 Assembly
; ============================================================
; Institution : Agnel Institute of Technology and Design
; Project     : Gas Leakage Detection Using 8051
; Team        : Vanshika Malwankar (24EC28)
;               Shivam Gawade     (24EC25)
; MCU         : AT89C51 / AT89S52
; Clock       : 11.0592 MHz Crystal
; Tool        : Keil uVision / MIDE-51
; Simulator   : Proteus Design Suite
; ============================================================
; PIN MAPPING:
;   MQ2 DOUT  → P1.0  (Pin  1) — Digital Input
;   LED (+)   → P2.0  (Pin 21) — Output via 330Ω resistor
;   BUZZER    → P2.1  (Pin 22) — Active HIGH output
;   RELAY IN1 → P2.2  (Pin 23) — Active LOW output
;   VCC       → Pin 40         — +5V power
;   GND       → Pin 20         — Ground
;   EA/VPP    → Pin 31         — Tied HIGH (+5V)
;   RST       → Pin  9         — 10µF + 10kΩ to VCC
;   XTAL1     → Pin 19         — 11.0592 MHz crystal
;   XTAL2     → Pin 18         — 11.0592 MHz crystal
; ============================================================

        ORG     0000H           ; Reset vector — program entry point

; ─── System Initialization ────────────────────────────────────
START:
        CLR     P2.0            ; LED      → OFF (safe state)
        CLR     P2.1            ; BUZZER   → OFF (silent)
        SETB    P2.2            ; RELAY    → ON  (active LOW, SETB = coil ON)
        SETB    P1.0            ; P1.0     → Input mode (MQ2 sensor)
        MOV     A,  #00H        ; Clear accumulator

; ─── Main Polling Loop ────────────────────────────────────────
MAIN:
        MOV     A,  P1          ; Read entire Port 1
        ANL     A,  #01H        ; Mask — isolate bit 0 (P1.0 = MQ2 DOUT)
        JNZ     GAS_ALERT       ; If bit0 = 1 → gas detected → jump to alert
        SJMP    SAFE_MODE       ; If bit0 = 0 → safe → continue normal mode

; ─── Safe Mode: No Gas Detected ───────────────────────────────
SAFE_MODE:
        CLR     P2.0            ; LED    OFF — no visual warning
        CLR     P2.1            ; BUZZER OFF — silent
        SETB    P2.2            ; RELAY  ON  — power supply maintained
        SJMP    MAIN            ; Loop back to check sensor again

; ─── Alert Mode: Gas Detected! ────────────────────────────────
GAS_ALERT:
        SETB    P2.0            ; LED    ON  — red visual warning
        SETB    P2.1            ; BUZZER ON  — audio alarm
        CLR     P2.2            ; RELAY  OFF — disconnect main power supply!
        LCALL   DELAY_500MS     ; Debounce delay before re-checking
        SJMP    MAIN            ; Loop back to verify sensor state

; ─── Delay Subroutine: ~500ms @ 11.0592 MHz ───────────────────
; Machine cycle = 12 oscillations / 11.0592 MHz = 1.085 µs
; DJNZ = 2 machine cycles = ~2.17 µs
; Inner (R2): 4 × 2.17µs  ≈ 8.7µs
; Middle (R1): 250 × 8.7µs ≈ 2.17ms
; Outer  (R0): 250 × 2.17ms ≈ 542ms ≈ 500ms
DELAY_500MS:
        MOV     R0, #250        ; Outer loop  — 250 iterations
LOOP1:  MOV     R1, #250        ; Middle loop — 250 iterations
LOOP2:  MOV     R2, #4          ; Inner loop  — 4 iterations
LOOP3:  DJNZ    R2, LOOP3       ; Decrement R2 until zero (2 cycles each)
        DJNZ    R1, LOOP2       ; Decrement R1 until zero
        DJNZ    R0, LOOP1       ; Decrement R0 until zero
        RET                     ; Return to caller

        END                     ; End of program
