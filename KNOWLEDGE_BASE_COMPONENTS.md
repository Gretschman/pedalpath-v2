# Component Knowledge Base for PedalPath

**Sources**: Beavis Audio, Coda Effects, SparkFun, Multiple References

---

## Reading Schematics

### Symbol Recognition

**Resistors**:
```
Symbol: Zigzag line (US) or rectangle (International)
Polarity: None (non-polarized)
Values: Expressed in ohms (Ω)
  - R, k (kilohm), M (megohm)
  - 10R = 10Ω, 10k = 10,000Ω, 1M = 1,000,000Ω
```

**Capacitors**:
```
Non-polarized: Two parallel lines
Polarized: One straight, one curved line
  - Curved = negative terminal
Values: Expressed in farads (F)
  - pF (picofarad), nF (nanofarad), µF (microfarad)
  - 100p = 100pF, 100n = 0.1µF, 10µ = 10µF
```

**Diodes**:
```
Symbol: Triangle pointing into line
Anode: Triangle side (positive)
Cathode: Line side (negative, marked with band)
Types:
  - 1N4148: Signal diode
  - 1N4001-1N4007: Rectifier
  - 1N5817: Schottky
  - LED: Light-emitting diode
```

**Transistors**:
```
BJT (NPN/PNP):
- Three terminals: Collector, Base, Emitter
- Arrow shows emitter, points out for NPN, in for PNP
- Common: 2N3904 (NPN), 2N3906 (PNP), 2N5088 (NPN)

MOSFET (N-channel/P-channel):
- Three terminals: Drain, Gate, Source
- Channel type shown by arrow direction
- Common: 2N7000 (N-channel), BS170 (N-channel)

JFET:
- Three terminals: Drain, Gate, Source
- Common: J201, 2N5457
```

**Integrated Circuits**:
```
Op-Amps: Triangle symbol
  - Common: TL071/TL072 (low noise), LM358, NE5532

Digital: Rectangle with labeled pins
  - Common: PT2399 (delay), MN3007 (BBD), CD4049

Power: Various symbols
  - Common: LM317 (voltage regulator), 7805
```

**Potentiometers**:
```
Symbol: Resistor with arrow (wiper)
Three terminals: Input, Wiper, Output
Values: Like resistors (1k - 1M typical)
Taper: A (audio/log), B (linear), C (reverse log)
```

### Connection Conventions

**Nets and Nodes**:
```
Lines: Represent electrical connections
Dots: Indicate intentional junction (wires connect)
No dot: Wires cross but don't connect
Named nets: Same name = connected (e.g., "VCC", "GND")
```

**Reference Designators**:
```
R = Resistor (R1, R2, R3...)
C = Capacitor (C1, C2, C3...)
D = Diode (D1, D2...)
Q = Transistor (Q1, Q2...)
U = Integrated Circuit (U1, U2...)
J = Jack/Connector (J1, J2...)
VR = Variable Resistor/Pot (VR1, VR2...)
LED = Light-Emitting Diode
SW = Switch
```

---

## Resistors

### Function in Circuits

**Voltage Divider**:
```
Two resistors in series from V+ to ground
Output taken from junction
Vout = Vin × (R2 / (R1 + R2))

Common use: Biasing transistors/op-amps
Example: 4.5V reference from 9V supply
```

**Current Limiting**:
```
Limits current to component
I = V / R (Ohm's law)

Common use: LED protection
Example: (9V - 2V) / 2.2kΩ = 3.2mA for LED
```

**Pull-down/Pull-up**:
```
Connects signal to ground (pull-down) or V+ (pull-up)
Prevents floating inputs
Typical values: 10k - 1M
```

**Gain Setting**:
```
In op-amp feedback loops
Gain = 1 + (Rf / Rin)
Higher ratio = more gain

Common in overdrives/distortions
```

### Color Code

**4-Band Resistors**:
```
Band 1: First digit
Band 2: Second digit
Band 3: Multiplier (number of zeros)
Band 4: Tolerance (gold = 5%, silver = 10%)

Example: Yellow-Violet-Red-Gold
4-7-×100 = 4700Ω = 4.7kΩ ± 5%
```

**5-Band Resistors** (precision):
```
Band 1: First digit
Band 2: Second digit
Band 3: Third digit
Band 4: Multiplier
Band 5: Tolerance (brown = 1%, red = 2%)
```

### Common Values

**E12 Series** (10% tolerance):
```
10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82
(Plus multipliers: ×10, ×100, ×1k, ×10k, etc.)
```

**Typical Guitar Pedal Uses**:
```
1k-10k: Signal paths, mixing
10k-100k: Biasing, filtering
100k-1M: Input impedance, high-Z applications
1M+: Ultra high impedance, leakage prevention
```

---

## Capacitors

### Types

**Film Capacitors** (box style, polyester, polypropylene):
```
Non-polarized
Typical range: 1nF - 1µF
Use: Audio coupling, filtering, tone shaping
Low loss, stable
```

**Ceramic Capacitors** (small disk or SMD):
```
Non-polarized
Typical range: 1pF - 100nF
Use: High-frequency filtering, bypass
Cheap, small, but can be microphonic
```

**Electrolytic Capacitors** (cylindrical):
```
POLARIZED (must observe +/-)
Typical range: 1µF - 1000µF+
Use: Power supply filtering, DC blocking (large values)
Negative side marked with stripe
Longer lead = positive
```

**Tantalum Capacitors**:
```
POLARIZED
Typical range: 1µF - 100µF
Use: Similar to electrolytic, smaller size
More expensive, better performance
```

### Function in Circuits

**Coupling Capacitor**:
```
Blocks DC, passes AC (audio signal)
Value determines low-frequency cutoff
Larger cap = more bass passes

Formula: fc = 1 / (2π × R × C)
Example: 100nF + 1MΩ input = 1.6Hz cutoff (full bass)
```

**Power Supply Filtering**:
```
Smooths DC power supply
Large electrolytic (100µF - 1000µF) near power entry
Small ceramic (100nF) near ICs
Reduces noise and ripple
```

**Tone Shaping**:
```
High-pass filter: Cap in series
- Passes highs, blocks lows
- Smaller cap = higher cutoff

Low-pass filter: Cap to ground
- Passes lows, blocks highs
- Larger cap = lower cutoff
```

**Timing (with resistor)**:
```
RC time constant: τ = R × C
Use: Delays, oscillators, LFOs
```

### Value Notation

**Multiple Systems**:
```
100pF = 100p = .0001µF
1nF = 1n = .001µF = 1000p
10nF = 10n = .01µF = 10000p
100nF = 100n = .1µF = 0.1µF
1µF = 1u = 1uF
10µF = 10u = 10uF
```

**Three-Digit Code** (ceramic):
```
First two digits = value
Third digit = number of zeros
In picofarads

Example: 104 = 10 + 0000 pF = 100,000pF = 100nF = 0.1µF
```

---

## Diodes

### Types and Uses

**Signal Diodes** (1N4148, 1N914):
```
Use: Clipping in overdrives/distortions
Fast switching
Creates distortion when signal exceeds ~0.7V
Symmetric clipping: Back-to-back or series opposing
```

**Power Diodes** (1N4001-1N4007):
```
Use: Reverse polarity protection
Higher current handling
Slower than signal diodes
Number indicates voltage rating (4001 = 50V, 4007 = 1000V)
```

**Schottky Diodes** (1N5817, 1N5819):
```
Use: Low-voltage drop clipping, power protection
Lower forward voltage (~0.3V vs 0.7V)
Creates softer, "germanium-like" clipping
```

**Zener Diodes** (1N4733-1N4764):
```
Use: Voltage regulation, hard clipping
Reverse breakdown at specific voltage
Example: 1N4733 = 5.1V zener
```

**LEDs** (Light-Emitting Diodes):
```
Use: Status indicator, clipping (specialized pedals)
Forward voltage: ~2V (red), ~3V (blue/white)
MUST use current-limiting resistor
Long lead = anode (+), short = cathode (-)
Flat side = cathode
```

### Clipping Configurations

**Series Opposing** (most common):
```
    ┌──┐>├──┐
───┤      ├───
    └──├<┐──┘
Clips positive and negative equally
Clean symmetric clipping
```

**Back-to-Back (shunt to ground)**:
```
         ┌─┐>├──GND
Signal──┤
         └─├<┐──GND
More aggressive clipping
Common in Tube Screamer
```

**Asymmetric**:
```
Different diodes or configurations for + and -
Creates "tube-like" asymmetric distortion
Example: LED on one side, silicon on other
```

---

## Transistors

### BJT (Bipolar Junction Transistor)

**NPN Common Types**:
```
2N3904: General purpose, low noise
2N5088/2N5089: High gain, used in fuzzes/boosters
BC547/BC548: European equivalent
MPSA18: Very high gain
```

**PNP Common Types**:
```
2N3906: General purpose, complement of 2N3904
2N5087: High gain, complement of 2N5088/89
BC557: European equivalent
```

**Pinout Identification**:
```
2N3904/3906/5088/5089 (TO-92 package):
- Flat side facing you: E-B-C (left to right)
- Round side: C-B-E

Check datasheet for confirmation
Use multimeter diode mode if unsure
```

**Functions**:
```
Amplification:
- Small base current controls large collector current
- Used in gain stages, buffers

Switching:
- On/off control
- Used in switching circuits, LFOs

Common configurations:
- Common emitter: Gain stage (most common)
- Common collector (emitter follower): Buffer, impedance matching
- Common base: Less common, high-frequency applications
```

### FET (Field-Effect Transistor)

**JFET Common Types**:
```
J201: Low noise, high gain (hard to find)
2N5457: General purpose
2N5458: Similar to 2N5457
J113: Lower gain
```

**MOSFET Common Types**:
```
2N7000: N-channel, general purpose
BS170: N-channel, similar to 2N7000
IRF510: Power MOSFET, high current
```

**Pinout** (TO-92):
```
2N7000/BS170: S-G-D (left to right, flat side toward you)
Check datasheet - varies by type
```

**Uses**:
```
- Input buffers (high input impedance)
- Gain stages (cleaner than BJT)
- Switching
- FETs sound different from BJTs (smoother, more "vintage")
```

---

## Potentiometers

### Taper Types

**Linear (B-taper)**:
```
Resistance changes uniformly with rotation
Use: Tone controls, blend controls, filters
Example: B100k = 100kΩ linear
```

**Logarithmic/Audio (A-taper)**:
```
Resistance changes logarithmically
Matches human hearing perception
Use: Volume controls, gain controls
Example: A100k = 100kΩ audio taper
```

**Reverse Logarithmic (C-taper)**:
```
Opposite curve from audio taper
Less common
Some applications need precise control at high end
```

### Wiring Configurations

**Variable Resistor** (2 terminals used):
```
Lugs 2 and 3 connected
Acts as simple variable resistor
Use: Gain control, simple applications
```

**Voltage Divider** (3 terminals):
```
Lug 3: Input
Lug 2: Output (wiper)
Lug 1: Ground
Use: Volume control, mixing
```

**Common Values**:
```
1k-10k: Low impedance, some tone controls
10k-50k: Moderate applications, some vintage designs
100k: Most common (gain, volume, tone)
250k-500k: Guitar/bass tone/volume controls (on instrument)
1M: High impedance applications
```

---

## Integrated Circuits

### Op-Amps

**Common Types**:
```
TL071 (single): Low noise, high impedance, common in pedals
TL072 (dual): Two op-amps in one chip, space-saving
TL074 (quad): Four op-amps
LM358 (dual): Lower cost, slightly more noise
NE5532 (dual): Low noise, high-end audio
JRC4558 (dual): Used in Tube Screamer, warm sound
```

**Pinout** (DIP-8 for dual op-amps like TL072):
```
Pin 1: Output A
Pin 2: Inverting input A
Pin 3: Non-inverting input A
Pin 4: V- (ground in single-supply)
Pin 5: Non-inverting input B
Pin 6: Inverting input B
Pin 7: Output B
Pin 8: V+ (9V in pedals)
```

**Functions**:
```
- Amplification (gain stages)
- Buffering (impedance matching)
- Filtering (active filters)
- Mixing (combining signals)
- Wave shaping

Always use bypass capacitor (100nF) close to power pins
```

### Specialized ICs

**PT2399** (Digital Delay):
```
Creates delays up to ~300-400ms
Low-fi digital delay sound
Very common in DIY delays
Requires support components
```

**MN3005/MN3007/MN3207** (Bucket Brigade Device):
```
Analog delay chips
Warm, vintage sound
Requires clock circuit
Expensive and hard to find
```

**CD4049** (CMOS Hex Inverter):
```
Used for distortion/fuzz
Unusual but effective
Six inverters in one chip
```

---

## Power Components

### Voltage Regulators

**7805** (5V regulator):
```
Input: 7-35V
Output: 5V
Use: Powering logic circuits, some pedals
```

**LM317** (Adjustable):
```
Input: 3-40V
Output: 1.25V to 37V (adjustable with resistors)
Use: Custom voltage requirements
```

**78L09/LM7809** (9V regulator):
```
Input: 11-35V
Output: 9V
Use: Clean 9V from higher voltage supply
```

---

## Component Quality & Selection

### When Quality Matters

**Critical**:
```
- Signal path capacitors (film preferred)
- Low-noise op-amps (audio grade)
- Matched transistors (for certain circuits)
- Input jacks (mechanical reliability)
```

**Less Critical**:
```
- Power supply filter caps (electrolytic OK)
- Resistors (1% metal film generally fine)
- Bypass capacitors (ceramic OK)
```

### Common Substitutions

**Op-amps**:
```
TL071 ↔ TL081 (similar)
TL072 ↔ TL082 (similar)
NE5532 ↔ LM833 (upgrade)
```

**Transistors**:
```
2N3904 ↔ BC547 (NPN general purpose)
2N3906 ↔ BC557 (PNP general purpose)
2N5088 ↔ 2N5089 (very similar, gain slightly different)
```

**Diodes**:
```
1N4148 ↔ 1N914 (identical function)
1N4001 through 1N4007 (higher number = higher voltage rating)
```

---

## PedalPath Implementation

### Component Database

**Essential Information Per Component**:
```
- Type (resistor, capacitor, etc.)
- Value (with all notation variants)
- Package type (through-hole, SMD)
- Common substitutes
- Typical applications
- Where to buy
- Approximate cost
```

### Schematic Analysis Engine

**Auto-Recognition**:
```
1. Identify component symbols
2. Extract values and reference designators
3. Trace circuit topology
4. Recognize common building blocks:
   - Input buffers
   - Gain stages
   - Tone controls
   - Output stages
   - Power supply sections
```

### BOM Generation

**From Schematic**:
```
1. Extract all components
2. Group by type
3. Consolidate duplicate values
4. Generate quantities
5. Add part numbers and suppliers
6. Calculate costs
7. Flag hard-to-find parts
```

### Educational Integration

**Component tooltips**:
```
- Hover over component to see:
  - What it does in this circuit
  - Why this value was chosen
  - What happens if you change it
  - Safe modification ranges
```

**Circuit block explanations**:
```
- Identify functional blocks
- Explain each block's purpose
- Show signal transformation
- Suggest modifications
```
