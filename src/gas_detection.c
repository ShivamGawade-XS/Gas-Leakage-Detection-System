/* ============================================================
   Gas Leakage Detection System — Embedded C (C51)
   ============================================================
   Institution : Agnel Institute of Technology and Design
   Project     : Gas Leakage Detection Using 8051
   Team        : Vanshika Malwankar (24EC28)
                 Shivam Gawade     (24EC25)
   Language    : Embedded C (C51)
   Compiler    : Keil uVision MDK
   MCU         : AT89C51 / AT89S52 @ 11.0592 MHz
   Simulator   : Proteus Design Suite 8
   ============================================================
   PIN MAPPING:
   ┌─────────────────┬──────────┬──────────────────────────────┐
   │ Component       │ 8051 Pin │ Notes                        │
   ├─────────────────┼──────────┼──────────────────────────────┤
   │ MQ2 DOUT        │ P1.0 (1) │ Digital input, HIGH=gas      │
   │ LED Anode (+)   │ P2.0(21) │ 330Ω resistor to GND        │
   │ Buzzer (+)      │ P2.1(22) │ Active HIGH, 5V piezo        │
   │ Relay IN1       │ P2.2(23) │ Active LOW trigger           │
   │ VCC             │ Pin 40   │ +5V regulated DC             │
   │ GND             │ Pin 20   │ Common ground                │
   │ EA/VPP          │ Pin 31   │ Must be tied to +5V          │
   │ RST             │ Pin  9   │ 10µF cap + 10kΩ to VCC      │
   │ XTAL1           │ Pin 19   │ 11.0592 MHz + 33pF to GND   │
   │ XTAL2           │ Pin 18   │ 11.0592 MHz + 33pF to GND   │
   └─────────────────┴──────────┴──────────────────────────────┘
   ============================================================ */

#include <reg51.h>          /* Standard 8051 SFR definitions    */

/* ── Pin Definitions ──────────────────────────────────────── */
sbit MQ2_SENSOR = P1^0;     /* MQ2 gas sensor digital output    */
sbit LED        = P2^0;     /* Red warning LED                  */
sbit BUZZER     = P2^1;     /* Piezo buzzer (active HIGH)       */
sbit RELAY      = P2^2;     /* Relay IN1 (active LOW)           */
                            /* RELAY = 1 → coil ON  → NC closed */
                            /* RELAY = 0 → coil OFF → NC open   */

/* ── Function Prototypes ──────────────────────────────────── */
void system_init(void);
void safe_mode(void);
void alert_mode(void);
void delay_ms(unsigned int ms);

/* ============================================================
   MAIN FUNCTION
   Entry point — runs after reset
   ============================================================ */
void main(void) {
    system_init();              /* Set safe default state        */

    while (1) {                 /* Infinite polling loop         */
        if (MQ2_SENSOR == 1) {  /* HIGH = gas detected           */
            alert_mode();
        } else {                /* LOW  = environment clear      */
            safe_mode();
        }
    }
}

/* ============================================================
   SYSTEM INITIALIZATION
   Configure all output pins to safe default state on power-up
   ============================================================ */
void system_init(void) {
    LED     = 0;                /* LED OFF    — no warning       */
    BUZZER  = 0;                /* Buzzer OFF — silent           */
    RELAY   = 1;                /* Relay ON   — power maintained */
}

/* ============================================================
   SAFE MODE — No gas detected
   Environment is clear, system in normal idle state
   ============================================================ */
void safe_mode(void) {
    LED     = 0;                /* No visual warning             */
    BUZZER  = 0;                /* No audio warning              */
    RELAY   = 1;                /* Power supply connected (ON)   */
}

/* ============================================================
   ALERT MODE — Gas detected!
   Trigger all safety responses immediately
   ============================================================ */
void alert_mode(void) {
    LED     = 1;                /* RED LED ON  — visual alert    */
    BUZZER  = 1;                /* Buzzer ON   — audio alert     */
    RELAY   = 0;                /* RELAY OFF   — cut main power! */
                                /* Prevents fire / explosion     */
    delay_ms(100);              /* 100ms debounce hold time      */
}

/* ============================================================
   DELAY FUNCTION
   Generates approximately N milliseconds of busy-wait delay.
   Calibrated for 11.0592 MHz oscillator clock.
   Machine cycle = 12 / 11.0592MHz ≈ 1.085 µs
   Inner loop ≈ 123 iterations × ~8µs ≈ 1ms per count
   ============================================================ */
void delay_ms(unsigned int ms) {
    unsigned int i, j;
    for (i = 0; i < ms; i++) {
        for (j = 0; j < 123; j++) {
            /* Busy-wait inner loop — do not optimize */
        }
    }
}
