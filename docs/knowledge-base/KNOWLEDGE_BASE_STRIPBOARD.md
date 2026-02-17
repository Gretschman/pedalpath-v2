# Stripboard/Veroboard Knowledge Base for PedalPath

**Sources**: Tagboard Effects, Best Soldering, Greeny's Vero Build Guide, Hillman Curtis

---

## What is Stripboard?

### Overview
Stripboard (also called Veroboard, after the original brand) is a construction method using pre-made boards with parallel copper traces for building permanent circuits without custom PCBs. Standard 0.1-inch spacing has been used since ~1959.

### Physical Structure
```
Component Side (top):
- Grid of holes at 0.1" spacing
- Labels: Rows (numbered) and Columns (lettered)
- Components inserted from this side

Copper Side (bottom):
- Parallel copper strips running horizontally
- Each strip connects multiple holes
- Strips must be cut to isolate circuit sections
- Solder applied to this side
```

---

## Core Construction Concepts

### Track/Strip Management

**Continuous Copper Strips**:
- Run the full width of the board
- Provide pre-made electrical connections
- Must be strategically cut to create circuit

**Track Cuts**:
- Break copper strips where isolation needed
- Prevents shorts between components
- Most critical aspect of stripboard design
- Shown as red X or dot on layouts

**Track Usage**:
- Bottom strip often reserved for ground (GND)
- Second strip often for power (9V/Vref)
- Middle strips for signal routing
- Top strips for secondary power (Vref, etc.)

---

## Reading Stripboard Layouts

### Visual Conventions

**Component Side View**:
```
- Shows component placement from top
- Reference designators labeled (R1, C2, Q1, IC1)
- Component orientation indicated
- Wire links shown as black lines
- Hole positions marked
```

**Copper Side View**:
```
- Horizontal copper strips
- Red X or squares: Track cuts required
- Blue dots: Solder junctions (multiple connections)
- Shows actual electrical connectivity
```

**Color Coding**:
```
- Black/Gray strips: Ground rail
- Red strips: Positive power (9V)
- Pink/Orange strips: Voltage reference (Vref/4.5V)
- Blue dots: Multiple solder connections at one hole
- Red X/squares: Cut copper track here
```

### Layout Information
```
- Board size: Listed as "18x10" (18 columns × 10 rows)
- Track cuts: Specified by position (e.g., "Cut row 5, column 8")
- Links: Wire bridges between non-adjacent points
- External connections: Input, output, power labeled
```

---

## Key Building Principles

### 1. Component Orientation
**Flat Components Only**: "No standing axial components. EVER!"
- All resistors, capacitors lay flat
- Cleaner appearance
- Easier to work with
- Prevents mechanical stress

**Reasons**:
- Easier assembly
- Better heat dissipation
- Less prone to damage
- Professional appearance

### 2. Size Optimization
**Target Enclosure Fit**:
- 1590B: Keep under 21 columns wide
- 1590BB/125B: Can use up to 25+ columns
- Prioritize buildability over extreme compactness
- Leave space for comfortable soldering

### 3. Signal Path Direction
**Left-to-Right Flow**:
- Input on left edge
- Signal progresses rightward
- Output on right edge
- Matches schematic convention
- Intuitive when box opens

---

## Step-by-Step Construction

### Phase 1: Board Preparation

**1. Cut Board to Size**
```
- Measure layout requirements
- Cut with hacksaw or scoring tool
- File edges smooth
- Clean with isopropyl alcohol
```

**2. Mark Track Cuts**
```
- Use layout as reference
- Mark each cut position with fine marker
- Double-check against layout
- Mark on copper side
```

**3. Make Track Cuts**
```
Method 1: Specialized cutter tool
- Looks like screwdriver with cutting blade
- Press and rotate to score through copper
- Quick and clean

Method 2: Hand drill bit
- Use 3mm bit by hand
- Rotate to remove copper
- Don't damage holes

Method 3: Craft knife (RECOMMENDED)
- Use steel ruler and sharp X-Acto knife
- Make two parallel cuts on either side of hole
- Lift copper strip between cuts
- Cleanest method, preserves holes
```

**4. Verify Cuts**
```
- Use multimeter continuity mode
- Check each cut has broken conductivity
- Use magnifying glass to inspect
- Remove any copper remnants
```

### Phase 2: Component Installation

**Installation Order (low to high profile)**:

**1. Wire Links/Jumpers**
```
- Install first (lowest profile)
- Use cut resistor/diode leads (free!)
- Or use solid 22 AWG wire
- Solder both ends on copper side
```

**2. Resistors**
```
- Bend leads 0.4" apart (spacing between holes)
- Insert from component side
- Bend leads slightly on copper side to hold
- Solder and trim excess
```

**3. Diodes**
```
- Note polarity marking (band = cathode)
- Orient according to layout
- Same bending/soldering as resistors
```

**4. IC Sockets**
```
- Note pin 1 orientation (notch/dot)
- Insert socket, not IC yet
- Solder all pins
- Insert IC after testing
```

**5. Film Capacitors**
```
- Non-polarized, either direction
- Same installation as resistors
- May need wider lead spacing for larger values
```

**6. Electrolytic Capacitors**
```
- POLARIZED: Mark negative stripe
- Negative side to lower voltage
- Longer lead = positive
- Stand upright or lay flat based on clearance
```

**7. Transistors**
```
- Identify pinout (E-B-C or other)
- Orient flat side per layout
- Bend leads to match 0.1" spacing
- Solder quickly to avoid heat damage
```

**8. Potentiometers (if board-mounted)**
```
- May require small daughter board (5x2)
- Reduces heat damage to pot
- Easier wire management
```

### Phase 3: Power & Ground Connections

**Ground Rail**:
```
- Typically bottom strip
- Available throughout board
- Connect all ground points here
- May need links for isolated ground sections
```

**Power Distribution**:
```
- 9V rail (positive power)
- Vref rail (4.5V bias voltage)
- Filter capacitors at entry point
- Multiple connection points available
```

**Voltage Divider for Vref**:
```
- Two equal resistors (10k-100k)
- From 9V to ground
- Center tap = 4.5V
- Large filter cap (10-100µF) to ground
- Used for op-amp biasing
```

---

## Advanced Techniques

### IC Placement
```
- Straddle IC across center gaps when possible
- Pin 8 to V+ (positive power)
- Pin 4 to ground (for dual op-amps like TL072)
- Bypass capacitor (100nF) close to power pins
```

### Minimizing Board Size
```
- Use both sides of IC for routing
- Strategic component placement
- Minimize empty rows
- Use links instead of long copper runs
```

### Component Value Substitution
```
- Socket components for experimentation
- Use IC sockets for transistors
- Leave access for modifications
- Document final values used
```

---

## Wiring to External Components

### Potentiometers
```
- Use stranded wire for off-board connections
- Color code: Red (hot), Black (ground), White (wiper)
- Typical lengths: 6-8 inches
- Heat shrink at solder joints
```

### Jacks
```
Input Jack:
- Tip: Signal to board input
- Sleeve: Ground

Output Jack:
- Tip: Signal from board output
- Sleeve: Ground
- Ring (if TRS): Not used in mono pedals
```

### Footswitch (3PDT)
```
- True bypass wiring standard
- Grounds board input when bypassed
- Prevents high-gain bleedthrough
- LED indicator controlled by switch
```

### LED
```
- Current limiting resistor required (2.2k-4.7k)
- Anode (long lead) to positive
- Cathode (short lead) to ground via resistor
- Mount in bezel on enclosure
```

---

## Soldering Best Practices

### Technique
```
1. Clean tip before each joint
2. Heat pad and component lead together (1-2 seconds)
3. Apply solder to joint, not iron
4. Remove solder, then iron
5. Let cool naturally
6. Inspect: Should be shiny and cone-shaped
```

### Common Problems
```
- Cold joint: Dull, grainy appearance → Reheat properly
- Solder bridge: Connects adjacent tracks → Remove with solder wick
- Lifted pad: Copper separated from board → Use jumper wire
- Too much solder: Obscures inspection → Remove excess
```

---

## Testing & Debugging

### Initial Power-On Tests
```
1. Visual inspection before power
   - Check for solder bridges
   - Verify all cuts made
   - Check component orientation

2. Continuity testing
   - Verify ground connections
   - Check power doesn't short to ground
   - Confirm track cuts work

3. Power-on voltage checks
   - Measure supply voltage
   - Check IC power pins
   - Verify Vref voltage (should be ~4.5V)
   - Check transistor voltages
```

### Signal Tracing
```
1. Input signal (use audio probe or scope)
2. Trace through each stage
3. Identify where signal is lost/distorted
4. Check component values and orientation
```

### Common Faults
```
- No sound: Power issue, input/output wiring
- Weak/distorted: Wrong component values, biasing
- Oscillation: Improper ground, too much gain
- Hum: Ground loop, poor power filtering
- Intermittent: Cold solder joint, cracked track
```

---

## PedalPath Implementation

### Visual Requirements

**Dual-View System**:
```
1. Component Side View:
   - Grid with row/column labels
   - Component placement overlays
   - Reference designators
   - Wire links shown
   - Color-coded by component type

2. Copper Side View:
   - Horizontal copper strips
   - Track cuts marked clearly
   - Solder junction indicators
   - Power/ground rails highlighted
   - Can be toggled or side-by-side
```

**Interactive Features**:
```
- Click hole to see what it connects to
- Highlight component connections
- Show track continuity
- Verify cut breaks connection
- Toggle between views
- Zoom in on detailed areas
```

**Step-by-Step Assembly**:
```
1. Cut preparation phase
   - Show each cut location
   - Provide cut verification checklist

2. Component installation phases
   - Group by component type
   - Order by height
   - Show orientation
   - Solder point indicators

3. External wiring phase
   - Potentiometer connections
   - Jack wiring
   - Switch wiring
   - Power connections
```

### Auto-Generation Algorithm

```
1. Parse schematic or BOM

2. Identify circuit topology
   - Input stage
   - Gain stages
   - Tone controls
   - Output stage

3. Allocate board rows
   - Reserve bottom for ground
   - Reserve top rows for power
   - Middle rows for signal

4. Place components
   - ICs first (anchor points)
   - Surrounding support components
   - Connect via copper strips
   - Add links where gaps needed

5. Identify track cuts
   - Where strips must isolate
   - Between IC pins
   - Power/ground separation

6. Generate assembly instructions
   - Cut list with positions
   - Component list in install order
   - Wire link specifications
   - External connections

7. Create dual views
   - Component side PNG/SVG
   - Copper side PNG/SVG
   - Combined overlay view
```

---

## Comparison to Other Methods

### vs Breadboard
```
+ Permanent construction
+ Smaller footprint
+ More reliable connections
- Requires soldering
- Less flexibility for changes
```

### vs PCB
```
+ Faster than custom PCB
+ No etching/ordering needed
+ Cheaper for one-offs
+ Good for prototyping
- Larger than PCB
- Manual track cutting required
- Harder to duplicate exactly
```

### vs Perfboard
```
+ Pre-connected tracks speed assembly
+ Less point-to-point wiring
+ More structured layout
- Requires strategic track cuts
- Less flexible routing
```

---

## Tools Required

### Essential
```
- Stripboard (various sizes)
- Track cutting tool OR drill bit OR craft knife
- Soldering iron (30W+ temp controlled)
- Solder (60/40 or 63/37 tin/lead)
- Wire strippers
- Side cutters (flush cut)
- Multimeter
```

### Helpful
```
- IC extractor
- Solder sucker / solder wick
- Helping hands
- Magnifying glass
- Steel ruler
- Fine-tip marker
- Files
- Isopropyl alcohol (cleaning)
```

---

## Common Stripboard Sizes

### Standard Veroboard
```
- 24x5 strips: Small circuits (boosters, simple fuzzes)
- 36x12 strips: Medium circuits (overdrives, delays)
- 48x15 strips: Large circuits (complex effects)
- 64x25 strips: Very large (multi-stage, digital)
```

### Matching to Enclosures
```
1590B (small): Up to 21 columns × 15 rows
125B (medium): Up to 25 columns × 18 rows
1590BB (large): Up to 30 columns × 25 rows
```
