# Enclosure & Wiring Knowledge Base for PedalPath

**Sources**: Beavis Audio, Tagboard Effects, General Guitar Gadgets, Coda Effects

---

## Standard Guitar Pedal Enclosures

### Hammond 1590 Series

**1590B** (Small):
```
External: 4.39" L × 2.06" W × 1.22" H (111.5 × 52.3 × 31mm)
Internal: ~4.2" × 1.8" × 1.1"
Use case: Simple circuits (3-4 knobs max)
Examples: Boost, simple overdrive, compressor
```

**125B** (Medium - Most Common):
```
External: 4.77" L × 2.6" W × 1.39" H (121 × 66 × 35.3mm)
Internal: ~4.5" × 2.3" × 1.2"
Use case: Standard effects (3-5 knobs)
Examples: Tube Screamer, RAT, most overdrives
```

**1590BB** (Large):
```
External: 4.77" L × 3.70" W × 1.39" H (121 × 94 × 35.3mm)
Internal: ~4.5" × 3.4" × 1.2"
Use case: Complex circuits (6+ knobs)
Examples: Multi-stage delays, chorus, complex fuzzes
```

**1590DD** (Extra Large):
```
External: 7.38" L × 4.77" W × 1.97" H
Internal: ~7.0" × 4.5" × 1.7"
Use case: Digital effects, multi-effects
Examples: Digital delays, reverbs, multi-function
```

---

## Drilling Templates

### Essential Information

**Hole Sizes for Components**:
```
Potentiometers (16mm/24mm):
- 16mm pots: 5/16" or 8mm
- 24mm pots: 3/8" or 10mm

LED (with bezel):
- Standard 5mm LED: 8mm hole (with bezel)
- 3mm LED: 6mm hole (with bezel)

DC Power Jack:
- 2.1mm barrel jack: 1/2" or 13mm

Input/Output Jacks:
- 1/4" mono/stereo: 3/8" or 10mm
- Switchcraft-style: 15/32" or 12mm

Footswitch:
- 3PDT footswitch: 1/2" or 12mm
- Soft-touch momentary: 7mm
```

**Template Requirements**:
1. Exact enclosure dimensions printed
2. Hole positions measured from edges
3. Hole diameters specified
4. Component labels
5. 1:1 scale for direct printing
6. Calibration ruler for verification

### Drilling Template Anatomy

**Header Information**:
```
- Enclosure model (e.g., "125B")
- External dimensions
- Template scale (1:1)
- Creation date
- Circuit name/project
```

**Layout Views**:
```
- Top view (most common)
- Side views if needed
- All measurements from edges
- Center-to-center distances
- Border/margin indicators
```

**Hole Specifications Table**:
```
Component | Position | Diameter | Notes
Gain      | See layout | 3/8" | Potentiometer
Volume    | See layout | 3/8" | Potentiometer
Tone      | See layout | 3/8" | Potentiometer
LED       | See layout | 8mm  | With bezel
Footswitch| Center     | 1/2" | 3PDT
Input     | Left side  | 3/8" | 1/4" jack
Output    | Right side | 3/8" | 1/4" jack
DC Jack   | Top side   | 1/2" | 2.1mm barrel
```

### Typical Layouts

**Standard 3-Knob Layout (125B)**:
```
Top View:
┌─────────────────────────────────┐
│                                 │ ← DC Jack top
│    ○         ○         ○        │ ← Knobs evenly spaced
│  GAIN      TONE      VOL       │
│                                 │
│             ●                   │ ← LED below center
│                                 │
│             ○                   │ ← Footswitch center
└─────────────────────────────────┘
 ↑                               ↑
Input                           Output
(side)                          (side)
```

**Measurements (125B typical)**:
```
- Knob row: 0.75" from top edge
- Knob spacing: 1.25" center-to-center
- Left knob: 1.0" from left edge
- LED: 1.75" from top, centered horizontally
- Footswitch: 2.75" from top, centered horizontally
- Side jacks: 0.5" from bottom edge
```

---

## Drilling Process

### Preparation
```
1. Print template at 1:1 scale
2. Verify scale with ruler
3. Tape template to enclosure top
4. Center punch each hole location
5. Remove template
```

### Drilling Steps
```
1. Start with pilot hole (1/16" or 2mm)
2. Increase bit size gradually
3. Final size: Component-specific
4. Deburr holes with larger bit or file
5. Test fit components before wiring
```

### Step-Drill Method (Recommended)
```
- Single bit with multiple diameters
- Smoother holes than multiple bits
- Less chance of walking
- Cleaner finish
```

---

## Offboard Wiring

### True Bypass Wiring (3PDT Switch)

**3PDT Switch Lug Layout**:
```
     9  6  3      (Looking at solder side)
     8  5  2
     7  4  1
```

**Standard True Bypass Configuration**:
```
Lug 1: Board input
Lug 2: Ground
Lug 3: Input jack tip

Lug 4: Board output
Lug 5: Output jack tip
Lug 6: Board input (repeat of lug 1)

Lug 7: LED anode (via current-limiting resistor)
Lug 8: 9V power
Lug 9: LED cathode

Alternative LED (more common):
Lug 7: Ground
Lug 8: LED anode (via resistor from 9V)
Lug 9: LED cathode to ground when on
```

**How It Works**:
```
Bypassed (pedal off):
- Input jack → Lug 3 → Lug 2 (ground) + Lug 9 (output)
- Signal goes directly from input to output
- Board input grounded (prevents bleedthrough)
- LED off

Engaged (pedal on):
- Input jack → Lug 3 → Lug 6 → Board input
- Board output → Lug 4 → Lug 5 → Output jack
- Signal passes through circuit
- LED on
```

### Input/Output Jack Wiring

**Mono Jack Anatomy**:
```
Tip: Signal connection
Sleeve: Ground connection
(Some also have ring for stereo - not used in mono)
```

**Input Jack**:
```
Tip: To 3PDT lug 3
Sleeve: To ground (star ground point)

Optional battery snap:
- Negative to ground
- Positive via jack switching contact
- Disconnects battery when no cable plugged in
```

**Output Jack**:
```
Tip: From 3PDT lug 5
Sleeve: To ground (star ground point)
```

### DC Power Jack

**2.1mm Barrel Jack**:
```
Tip (center pin): Positive (9V)
Sleeve (outer): Ground

Standard "Boss-style":
- Center negative for vintage pedals
- Center positive for most modern (reversed from audio)
```

**Wiring**:
```
Positive: To board 9V input + 3PDT if needed
Negative: To ground (star ground point)

Protection (recommended):
- Reverse polarity diode (1N4001)
- Prevents damage if wrong polarity used
```

### LED Wiring

**Current Limiting Resistor**:
```
Required: 2.2k - 4.7k resistor
Voltage drop: ~2V across LED
Current: (9V - 2V) / 2.2k = ~3mA (safe and bright)

Too low resistance: LED burns out
Too high resistance: LED too dim
```

**Wiring Methods**:
```
Method 1: Switched by 3PDT
- Anode to 9V via resistor
- Cathode to 3PDT lug 9
- Ground when pedal engaged

Method 2: Always on when powered
- Anode to 9V via resistor
- Cathode to ground
- No switch needed
- Uses slightly more power
```

---

## Grounding

### Star Ground Concept

**What It Is**:
```
All ground connections meet at ONE central point
Prevents ground loops
Reduces noise and hum
Most important for low-noise operation
```

**Star Ground Location**:
```
Common options:
1. Input jack sleeve (most common)
2. DC jack ground
3. Dedicated ground lug on enclosure
4. Output jack sleeve (less common)
```

**What Connects to Star Ground**:
```
- Input jack sleeve
- Output jack sleeve
- DC jack ground (negative)
- Circuit board ground
- Potentiometer bodies (if metal enclosure)
- Enclosure (if metal)
- 3PDT switch ground (lug 2)
```

### Enclosure Grounding

**Metal Enclosures**:
```
- Connect enclosure to star ground
- Use solder lug on jack or dedicated point
- Prevents hum and provides shielding
- Required for proper operation
```

**Painted/Powder Coated**:
```
- Paint prevents electrical contact
- Must scrape paint at mounting holes
- Or use tooth lockwasher to bite through
- Verify continuity with multimeter
```

---

## Wire Types and Selection

### Stranded vs Solid Core

**Stranded Wire**:
```
Use for: Off-board connections (pots, jacks, switch)
Advantages:
- Flexible
- Less prone to breaking from vibration
- Easier to route in tight spaces
Typical: 22 AWG or 24 AWG
```

**Solid Core Wire**:
```
Use for: Circuit board connections, jumpers
Advantages:
- Holds shape
- Easier to insert in breadboard/perfboard
- Provides structural support
Typical: 22 AWG or 24 AWG
```

### Wire Routing

**Best Practices**:
```
1. Keep wires as short as practical
2. Route along edges of enclosure
3. Avoid crossing over circuit board
4. Bundle related wires together
5. Use cable ties or heat shrink for organization
6. Label wires if complex wiring
7. Leave slight slack (not too tight)
```

**Heat Shrink Tubing**:
```
- Use at solder joints on pot lugs
- Prevents shorts
- Provides strain relief
- Looks professional
```

---

## Component Mounting

### Potentiometer Mounting

**Installation**:
```
1. Insert pot shaft through hole from inside
2. Add washer (flat side toward enclosure)
3. Thread nut onto pot from outside
4. Hand tighten, then use wrench
5. Don't overtighten (can crack enclosure)
```

**Wire Connections**:
```
Before or after mounting:
- Easier to solder before mounting
- Easier to align after mounting
- Personal preference

Typical wiring:
Lug 1: Ground
Lug 2: Output/wiper to board
Lug 3: Input from board

(Can reverse 1 and 3 to reverse pot direction)
```

### Jack Mounting

**Enclosed Jacks** (most common):
```
- Thread through hole
- Tighten retaining nut
- Check that jack is straight
- Ground sleeve connects via mounting
```

**Open-Frame Jacks**:
```
- Mount with screws
- Requires larger hole or slot
- Usually two mounting points
- More secure than enclosed
```

### Footswitch Mounting

**3PDT Installation**:
```
1. Remove nut from switch
2. Insert switch through hole from inside
3. Replace nut from outside
4. Hand tighten firmly
5. Verify switch operates smoothly
```

**LED Bezel**:
```
1. Snap bezel onto LED
2. Insert LED from inside
3. Push bezel into hole (friction fit)
4. Or use small dab of epoxy if loose
5. Align LED so it faces forward
```

---

## Wiring Order (Recommended)

### Step-by-Step Assembly

**1. Prepare Enclosure**:
```
- Drill and deburr all holes
- Clean with isopropyl alcohol
- Install rubber feet
```

**2. Install Hardware**:
```
- Potentiometers
- Jacks (input, output, DC)
- Footswitch
- LED bezel
```

**3. Ground Connections First**:
```
- Establish star ground point
- Connect all ground wires
- Input jack sleeve
- Output jack sleeve
- DC jack ground
- Circuit board ground wire
- Enclosure if metal
```

**4. Power Connections**:
```
- DC jack positive to board
- Board to 3PDT if needed
- LED power via resistor
```

**5. Switch Wiring**:
```
- Input jack to 3PDT
- 3PDT to board input
- Board output to 3PDT
- 3PDT to output jack
- LED connections
```

**6. Potentiometer Wiring**:
```
- Measure and cut wires
- Tin pot lugs
- Solder connections
- Apply heat shrink
- Connect to board
```

**7. Final Circuit Board Installation**:
```
- Test circuit before final mounting
- Secure board with standoffs or foam tape
- Verify no shorts to enclosure
- Dress wires neatly
```

---

## Testing & Troubleshooting

### Pre-Power Tests
```
1. Continuity testing:
   - All grounds connected
   - No shorts power to ground
   - Switch functions correctly

2. Resistance checks:
   - Measure power to ground (should be high)
   - Check pot values
```

### Power-On Tests
```
1. Visual inspection:
   - LED lights when engaged
   - No smoke or unusual heat

2. Voltage checks:
   - 9V at board input
   - Correct voltages at IC/transistor pins

3. Signal testing:
   - Bypassed: Signal passes
   - Engaged: Effect works
```

### Common Problems
```
No sound bypassed:
- Check input/output jack wiring
- Verify 3PDT switch wiring

No sound engaged:
- Check board input/output connections
- Verify board power and ground
- Test circuit on breadboard if possible

Hum/Noise:
- Check ground connections
- Verify star ground
- Shield signal wires if needed
- Move wires away from power

LED issues:
- Check polarity (long lead = anode)
- Verify current-limiting resistor
- Test LED separately
```

---

## PedalPath Implementation

### Visual Enclosure Template Generation

**Requirements**:
```
1. Accurate 1:1 scale PDF/PNG output
2. Multiple enclosure size support:
   - 1590B
   - 125B
   - 1590BB
   - Custom sizes

3. Hole specifications:
   - Diameter clearly marked
   - Component labels
   - Measurements from edges
   - Center-to-center distances

4. Calibration tools:
   - Ruler for scale verification
   - Alignment marks
   - Fold/cut lines

5. Professional appearance:
   - Clean layout
   - Easy to read
   - Grid lines if helpful
   - Company branding area
```

### Wiring Diagram Generation

**Interactive Wiring Diagrams**:
```
1. Component placement view
   - All components positioned
   - Realistic representations
   - Color-coded wires

2. Connection highlighting:
   - Click component to see connections
   - Trace signal path
   - Show ground connections
   - Identify power routing

3. Step-by-step wiring:
   - Phase 1: Ground wiring
   - Phase 2: Power wiring
   - Phase 3: Switch wiring
   - Phase 4: Control wiring
   - Phase 5: Board installation

4. 3D visualization:
   - Rotate enclosure view
   - See wire routing
   - Understand spatial relationships
```

### Algorithm for Auto-Generation

**Enclosure Template**:
```
1. Input:
   - Enclosure model selected by user
   - BOM with controls (pots, switches)

2. Layout algorithm:
   - Count potentiometers
   - Determine optimal spacing
   - Position on grid
   - Add LED near footswitch
   - Position footswitch center-bottom
   - Add side jacks (input left, output right)
   - Add top DC jack

3. Generate measurements:
   - Calculate positions from edges
   - Specify hole diameters
   - Create dimension lines

4. Output:
   - Printable PDF at 1:1 scale
   - With calibration ruler
   - Assembly instructions
```

**Wiring Diagram**:
```
1. Parse circuit:
   - Identify all connections
   - Map to physical components

2. Color code wires:
   - Red: Power
   - Black: Ground
   - Others: Signal paths

3. Show connections:
   - Star ground highlighted
   - 3PDT switch details
   - Pot connections
   - Jack wiring

4. Generate instructions:
   - Order of assembly
   - Testing checkpoints
   - Troubleshooting tips
```
