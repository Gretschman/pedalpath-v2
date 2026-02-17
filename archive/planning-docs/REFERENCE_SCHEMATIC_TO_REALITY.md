# Reference: Converting Schematics to Reality

**Source**: https://beavisaudio.com/techpages/schematictoreality/

This guide provides essential context for improving PedalPath's logic for breadboard, stripboard, and enclosure guides.

---

## Understanding Schematics Basics

Schematics follow a "left-to-right" convention where input signals enter from the left, pass through processing components in the middle, and exit as output on the right. Power connections typically appear at the top, while ground references occupy the bottom, mirroring the physical layout of a battery-powered circuit.

## Key Schematic Elements

**Component Identification**: Components use standardized reference designators (R for resistors, C for capacitors, Q for transistors, VR for variable resistors). Sequential numbering aids cross-referencing with parts lists.

**Connection Methods**: Lines represent conductors, with three common conventions for showing intersections: dots indicate connections, humped passes show non-connected crossings, or dots combined with standard crossing lines denote connectivity.

**Input/Output Shorthand**: Guitar cable plugs contain two connectors—tip carries signal, sleeve connects to ground. Schematics often simplify this relationship, assuming builders will properly wire jack connections.

---

## Building Methods

### Breadboarding
The easiest prototyping approach uses breadboards with pre-organized power and ground strips along edges and interconnected five-hole strips for component placement. This allows reversible construction and easy experimentation with different component values.

**Key Features**:
- Pre-connected power/ground rails along edges
- Five-hole strips connected internally
- Non-permanent, allows experimentation
- Visual representation should show internal connections

### Stripboard (Veroboard)
This specialized format uses connected bus traces with deliberate cuts creating isolated segments. Layouts specify exactly where to cut traces and place components, streamlining construction.

**Key Features**:
- Copper strips running continuously
- Deliberate cuts to isolate circuit sections
- Component placement aligned with strips
- Visual representation should show copper side and component side

### Perfboard Variations
**Pad-per-hole designs** offer grid-based layouts matching schematic arrangements, though they require careful soldering to prevent bridges.

### Printed Circuit Boards
PCBs provide professional results for multiple builds, requiring more advanced skills.

---

## Essential Components and Symbols

**Resistors and Potentiometers**: Non-polarized resistors display as wavy lines; potentiometers show three connections with standardized coding (letter indicating taper type + numeric value).

**Capacitors**: Parallel lines indicate unpolarized types; straight-curved combinations denote polarized capacitors with polarity marking.

**Diodes and LEDs**: Show polarity through colored bands or flat edges; proper orientation is critical for function.

**Transistors and ICs**: Require careful pinout verification—transistor misorientation frequently causes circuit failure. Integrated circuits use triangle symbols (op-amps) or rectangles (specialized chips) with pin designations.

---

## Stompbox-Specific Considerations

Most schematics omit true-bypass switching and power connections, assuming standard implementations. A "stompbox harness" provides the generic framework: true-bypass switching, dual power input (battery or AC adapter), and proper grounding architecture.

---

## Enclosure Planning

Enclosures require precise drilling templates with:
- Exact dimensions (e.g., 125B: 4.77" x 2.6" x 1.39")
- Hole positions measured from edges
- Hole diameter specifications
- Component labels
- Scale for 1:1 printing

Common enclosure sizes:
- 1590B: Small pedals (3-4 knobs)
- 125B: Standard pedals (3-5 knobs)
- 1590BB: Large pedals (6+ knobs)

---

## Application to PedalPath

### Breadboard Guide Improvements
- Show internal breadboard connections visually
- Indicate which holes are electrically connected
- Highlight power/ground rails
- Use color coding for signal flow

### Stripboard Guide Improvements
- Dual view: copper side + component side
- Show where to cut copper strips
- Indicate component placement with reference designators
- Show solder points and jumper wires

### Enclosure Guide Improvements
- Generate accurate drilling templates with dimensions
- Include hole diameter specifications
- Add measurement guides from edges
- Make templates printable at 1:1 scale
- Support multiple enclosure sizes (1590B, 125B, 1590BB)

---

## Practical Resources

- DIY Layout Creator: Software for designing custom layouts
- General Guitar Gadgets: Project designs and drilling templates
- RunoffGroove: Layouts and community projects
- TonePad: PCB layouts and discussions
