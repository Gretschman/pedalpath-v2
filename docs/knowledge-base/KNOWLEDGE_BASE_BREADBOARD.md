# Breadboard Knowledge Base for PedalPath

**Sources**: Coda Effects, PedalPCB Forum, Small Bear Electronics

---

## How Breadboards Work

### Physical Structure

**Power Rails (vertical along sides)**:
- Marked with + and - symbols (red and blue/black lines)
- Connected along their entire length
- Used for power (9V) and ground (0V) distribution
- Provide easy access points throughout the board

**Component Rows (horizontal in center)**:
- Shorter strips connecting 5 holes horizontally
- Two separate sections (a-e and f-j) divided by center channel
- Each 5-hole strip is internally connected
- Numbered rows (typically 1-30 or 1-63)

**Central Channel**:
- Divides the board into left and right halves
- Allows ICs to straddle with pins on each side
- Prevents direct connection between IC pins on opposite sides

---

## Converting Schematics to Breadboard

### General Principles

1. **Left-to-Right Signal Flow**
   - Start signal path on left side
   - Progress through circuit stages left-to-right
   - Exit on right side
   - Matches schematic convention

2. **Component Grouping**
   - Group components by circuit blocks
   - Keep related components physically close
   - Maintain mental organization of circuit sections

3. **Minimize Jumper Wires**
   - Keep jumpers as short as possible
   - Use color-coded wire for different purposes:
     - Red: Positive power
     - Black: Ground
     - Other colors: Signal paths
   - Custom-length jumpers reduce clutter

4. **Layout Doesn't Match Schematic Exactly**
   - Physical layout differs from schematic representation
   - Circuit function remains the same
   - Focus on correct connections, not visual similarity

---

## Step-by-Step Build Process

### Example: LPB-1 Boost Circuit

**1. Power Distribution Setup**
```
- Connect 9V supply to positive rail (red +)
- Connect ground to negative rail (black -)
- Add filter capacitor (100µF) across power rails near supply
```

**2. Input Stage**
```
- Connect input jack tip to signal row
- Jack sleeve to ground rail
- First coupling capacitor (0.1µF) from input to bias network
```

**3. Bias Network**
```
- 430k resistor from signal to 9V rail
- 43k resistor from signal to ground rail
- Creates voltage divider for transistor base
```

**4. Transistor Placement**
```
- Straddle transistor across center channel or use three adjacent rows
- Note pinout: BCE (Base, Collector, Emitter)
- 2N5088: E-B-C from left to right when flat side faces you
- Bend leads slightly if needed to fit spacing
```

**5. Output Stage**
```
- Second coupling capacitor (0.1µF) from collector
- 10k resistor to power rail
- 390R resistor to ground (emitter)
```

**6. Volume Control**
```
- 100k log potentiometer
- Lug 3: Signal input
- Lug 2: Output to jack
- Lug 1: Ground
```

**7. Output Connection**
```
- Connect to output jack tip
- Jack sleeve to ground rail
```

---

## Component Placement Tips

### ICs (Integrated Circuits)
- Always straddle the center channel
- Pin 1 marked with dot or notch
- Provides maximum available connection holes
- If space limited, jumper pins to alternate rows

### Transistors
- Identify pinout before placing (use datasheet)
- Bend leads slightly to fit breadboard spacing
- Orient for easy connection to surrounding components
- Common pinouts:
  - 2N3904/2N5088 NPN: E-B-C
  - 2N3906/2N5087 PNP: E-B-C
  - 2N7000 MOSFET: S-G-D

### Capacitors
- Non-polarized (film, ceramic): Either direction
- Polarized (electrolytic):
  - Negative stripe goes to lower voltage
  - Positive lead (longer) to higher voltage
- Large filter caps: Place directly in power rails to save space

### Resistors
- Non-polarized: Either direction
- Color code identifies value
- Lay flat when possible for neatness

### Potentiometers
- Requires offboard connection via jumper wires
- Three wires from pot lugs to breadboard
- Allows real-time circuit tweaking
- Alternative: Use trimmer pot directly on breadboard (requires screwdriver)

---

## Testing & Debugging

### Build Incrementally
```
1. Build and test power section first
2. Add input stage and verify signal passes
3. Build main circuit block by block
4. Test each stage before adding next
5. Prevents widespread troubleshooting later
```

### Verification Methods
```
- Audio probe: Check signal at each stage
- Multimeter: Verify DC voltages at transistor/IC pins
- Continuity tester: Check for shorts and opens
- LED test: Verify power distribution
```

### Common Problems
```
- No sound: Check power connections, jack wiring
- Distorted/weak sound: Verify transistor orientation
- Hum/noise: Check grounding, move away from power supply
- Intermittent operation: Check component insertion, bad connections
```

---

## Wire Management

### Custom Jumper Wires
```
- Use solid-core 22 AWG hookup wire
- Pre-cut common lengths: 1/4", 1/2", 3/4", 1", 1.5", 2"
- Strip 1/4" from each end
- Store in organized container by length
```

### Color Coding System
```
- Red: Power (9V)
- Black: Ground
- Yellow: Signal input/output
- Green: Control signals
- Blue: AC signals
- White/Gray: General connections
```

### Layout Tips
```
- Route wires around components, not over
- Keep wires flat against board
- Avoid wire crossovers when possible
- Bundle related wires together
```

---

## Component Storage

### Organization System
```
- Resistors: Sort by value in labeled compartments
- Capacitors: Separate by type (film, ceramic, electrolytic)
- Semiconductors: Keep in antistatic tubes
- Hardware: Organize pots, jacks, switches separately
```

### Dedicated Breadboard Components
```
- Maintain separate stock for breadboarding
- Don't use nice soldering-quality components
- Acceptable to reuse breadboard components
- Replace if leads become damaged
```

---

## Tools Required

### Essential
```
- Breadboard (830 tie points standard)
- Solid-core jumper wire kit
- Wire strippers
- Needle-nose pliers
- Tweezers (for precise placement)
- Multimeter
```

### Helpful
```
- Audio probe (for signal tracing)
- Component lead bender
- Wire cutter
- Magnifying glass
- Helping hands/third hand tool
```

---

## Advantages vs Other Methods

### Breadboard Benefits
```
+ No soldering required
+ Completely reversible
+ Fast prototyping (minutes vs hours)
+ Easy component value experimentation
+ Reusable for multiple projects
+ Great for learning and testing
```

### Breadboard Limitations
```
- Not permanent (connections can loosen)
- Not suitable for high-frequency circuits
- Larger physical size than PCB
- Cannot handle high currents
- Component leads can break from repeated use
```

---

## Advanced Techniques

### Complex Circuits
```
- Use multiple breadboards for large circuits
- Distribute power across boards
- Keep signal paths short
- Consider modular approach (separate boards per stage)
```

### Modification Testing
```
- Socket multiple component values
- Use switches to change components
- Build comparison sections
- Document successful modifications
```

### Preparation for PCB/Stripboard
```
- Take photos of final working breadboard
- Document component positions
- Note any modifications from schematic
- Measure actual component values used
- Create layout diagram before disassembling
```

---

## PedalPath Implementation Notes

### Visual Representation Requirements
```
1. Show breadboard grid with:
   - Labeled rows (1-30) and columns (a-j)
   - Power rails clearly marked
   - Internal connection pattern visible

2. Component placement overlay:
   - Color-coded components matching BOM
   - Reference designators (R1, C2, Q1)
   - Lead placement in specific holes

3. Wire routing visualization:
   - Color-coded jumper wires
   - Start/end hole indicators
   - Wire length suggestions

4. Step-by-step assembly:
   - Progressive building stages
   - Which components to place in each step
   - Verification checkpoints

5. Interactive features:
   - Highlight connected holes on hover
   - Show signal flow path
   - Voltage indication at key points
```

### Algorithm for Auto-Generation
```
1. Parse BOM components
2. Identify circuit topology (boost, fuzz, delay, etc.)
3. Allocate breadboard rows based on signal flow
4. Place ICs straddling center channel
5. Position transistors with proper spacing
6. Route power and ground connections
7. Add coupling capacitors between stages
8. Generate jumper wire list with coordinates
9. Create assembly order (power → input → stages → output)
10. Add verification points between stages
```
