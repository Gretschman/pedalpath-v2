# Component Visual Specifications

**Purpose:** Define EXACTLY how each component type should look visually
**Audience:** Workers A (decoders) and C (component SVG library)

## Design Philosophy

Components must look EXACTLY like real electronic components, not schematic symbols. Users should be able to:
1. Identify components visually without reading labels
2. See polarity markings, color bands, and pin numbers
3. Match rendered components to real parts in their kit

## Resistors

### Physical Appearance
- Cylindrical body (tan/beige color)
- 4 or 5 color bands for value/tolerance
- Wire leads at each end (bent 90° when on breadboard)
- Proportions: ~10mm length, 3mm diameter (scale appropriately)

### Color Band System

**4-Band Resistors** (most common):
- Band 1: First digit
- Band 2: Second digit
- Band 3: Multiplier (zeros)
- Band 4: Tolerance (gold = ±5%, silver = ±10%)

**5-Band Resistors** (precision):
- Band 1: First digit
- Band 2: Second digit
- Band 3: Third digit
- Band 4: Multiplier
- Band 5: Tolerance

### Color Code Reference
| Color  | Digit | Multiplier | Hex Code |
|--------|-------|------------|----------|
| Black  | 0     | ×1         | #000000  |
| Brown  | 1     | ×10        | #8B4513  |
| Red    | 2     | ×100       | #CC0000  |
| Orange | 3     | ×1K        | #FF6600  |
| Yellow | 4     | ×10K       | #FFCC00  |
| Green  | 5     | ×100K      | #00AA00  |
| Blue   | 6     | ×1M        | #0066CC  |
| Violet | 7     | ×10M       | #9400D3  |
| Grey   | 8     | -          | #808080  |
| White  | 9     | -          | #FFFFFF  |
| Gold   | -     | ×0.1       | #FFD700  |
| Silver | -     | ×0.01      | #C0C0C0  |

### Examples
- **10kΩ**: Brown-Black-Orange-Gold [1][0][×1K][±5%]
- **4.7kΩ**: Yellow-Violet-Red-Gold [4][7][×100][±5%]
- **100Ω**: Brown-Black-Brown-Gold [1][0][×10][±5%]
- **1MΩ**: Brown-Black-Green-Gold [1][0][×100K][±5%]

## Capacitors

### Ceramic Capacitors (small values: 1pF - 1µF)
- **Shape**: Small disc or rectangular block
- **Color**: Yellow, orange, or tan
- **Markings**: Value code printed on body (e.g., "104" = 100nF)
- **Polarity**: None (non-polarized)
- **Size**: 3-5mm diameter

### Electrolytic Capacitors (larger values: 1µF - 1000µF+)
- **Shape**: Cylinder standing upright
- **Color**: Black or blue aluminum body
- **Markings**:
  - Polarity stripe down one side (negative terminal)
  - Value and voltage printed on body
  - Negative lead is shorter
- **Polarity**: YES - must be inserted correctly
- **Size**: 5-10mm diameter, 10-20mm height (varies with value/voltage)

### Film Capacitors (precision: 1nF - 10µF)
- **Shape**: Rectangular box
- **Color**: Blue, red, or yellow
- **Markings**: Value printed on body
- **Polarity**: None (non-polarized)
- **Size**: 5-15mm length

### Polarity CRITICAL
⚠️ Electrolytic capacitors will fail/explode if installed backwards!
- Stripe on body = NEGATIVE side
- Longer lead = POSITIVE (anode)
- Shorter lead = NEGATIVE (cathode)

## Integrated Circuits (ICs)

### DIP Package (Dual Inline Package)
- **Shape**: Black rectangular body with legs on both sides
- **Pin Count**: 8, 14, or 16 pins (most common)
- **Markings**:
  - Part number on top (e.g., "TL072", "LM358")
  - Notch or dot indicating Pin 1
  - Pin numbering: Counter-clockwise from Pin 1
- **Orientation**: Straddles center gap of breadboard
- **Color**: Black plastic (#1A1A1A)

### Pin Numbering
```
     Top View
   ┌─────┐
 1 │●    │ 8
 2 │     │ 7
 3 │     │ 6
 4 │     │ 5
   └─────┘
```
- Notch/dot at Pin 1 end
- Count counter-clockwise
- Pin 1: often ground or input
- Highest pin: often V+ or output

### Common ICs
- **TL072**: Dual op-amp, 8 pins
- **LM358**: Dual op-amp, 8 pins
- **4558**: Dual op-amp, 8 pins
- **LM386**: Audio amp, 8 pins
- **CD4049**: Hex inverter, 16 pins

## Diodes

### Standard Diodes (1N4148, 1N4001)
- **Shape**: Small glass cylinder
- **Color**: Black or orange glass body
- **Markings**: Black or silver band at cathode end
- **Polarity**: YES - band = cathode (negative)
- **Size**: 3mm diameter, 7mm length

### Polarity
- **Anode**: Positive side, no marking
- **Cathode**: Negative side, marked with band
- Current flows anode → cathode only

## LEDs (Light Emitting Diodes)

### Physical Appearance
- **Shape**: Round or rectangular head
- **Colors**: Red, green, yellow, blue, white
- **Markings**:
  - Flat edge on cathode side
  - Longer lead = anode (+)
  - Shorter lead = cathode (-)
- **Size**: 3mm or 5mm diameter

### Polarity
- **Anode (+)**: Longer lead, connects to +voltage
- **Cathode (-)**: Shorter lead, flat side, connects to ground
- Always use current-limiting resistor!

## Transistors

### TO-92 Package (most common)
- **Shape**: Half-circle black plastic body
- **Pins**: 3 legs (Emitter, Base, Collector)
- **Markings**: Part number on flat side
- **Orientation**: Pin order varies by type
- **Size**: 5mm diameter half-circle

### Common Types
- **2N5457**: N-channel JFET (Gate-Drain-Source)
- **2N3904**: NPN transistor (EBC)
- **2N3906**: PNP transistor (EBC)
- **J201**: N-channel JFET (GDS)

### Pin Configuration (from flat side, left to right)
- Varies by part - check datasheet!
- Example 2N5457: [Gate] [Drain] [Source]

## Wires & Jumpers

### Solid Core Wire
- **Gauge**: 22 AWG typical for breadboards
- **Colors**: Follow standard coding
  - **Red**: +voltage, power
  - **Black**: Ground, 0V
  - **Yellow**: Signal
  - **Green**: Signal
  - **Blue**: Signal
  - **Orange**: Signal
  - **White**: Signal
- **Appearance**: Straight or arced over components
- **Ends**: Stripped ~5mm, inserted in holes

### Visual Representation
- Draw as solid line with color
- Show gentle arcs, not sharp angles
- Both ends clearly in specific holes
- Wire runs should be neat and organized

## Measurement Units

### Resistors
- Ω (ohms): 1Ω to 999Ω
- kΩ (kilo-ohms): 1kΩ to 999kΩ
- MΩ (mega-ohms): 1MΩ to 10MΩ

### Capacitors
- pF (picofarads): 1pF to 999pF
- nF (nanofarads): 1nF to 999nF
- µF (microfarads): 1µF to 1000µF

### Voltage
- Capacitors rated: 16V, 25V, 50V typical
- LEDs forward voltage: 1.8-3.3V

## Decoder Requirements

The decoder system must parse component values and return:

**For Resistors:**
```typescript
{
  value: string;           // "10kΩ"
  bands: string[];         // ["brown", "black", "orange", "gold"]
  tolerance: string;       // "±5%"
  powerRating: string;     // "0.25W"
}
```

**For Capacitors:**
```typescript
{
  value: string;           // "100nF"
  type: 'ceramic' | 'electrolytic' | 'film';
  polarized: boolean;      // true for electrolytic
  voltage: string;         // "25V"
  physicalSize: 'small' | 'medium' | 'large';
}
```

**For ICs:**
```typescript
{
  partNumber: string;      // "TL072"
  pinCount: number;        // 8
  pinout: string[];        // ["OUT1", "IN1-", "IN1+", "V-", ...]
  description: string;     // "Dual Op-Amp"
}
```

## Reference Images

See `breadboard-reference-images/` folder for real component examples:
- breadboard-ref-2.png: Shows resistors with visible color bands
- breadboard-ref-3.png: Shows capacitors and ICs placed
- breadboard-ref-4.png: Shows complete wiring

## Visual Realism Checklist

For each component type, ensure:
- [ ] Matches real component dimensions proportionally
- [ ] Shows correct colors and markings
- [ ] Polarity clearly indicated (if applicable)
- [ ] Leads/pins visible and positioned correctly
- [ ] Component sits on board realistically (not floating)
- [ ] Shadows/depth subtle but present
- [ ] Labels readable but not overwhelming

---

**Next:** See `2-technical-design/decoder-system-design.md` for implementation details
