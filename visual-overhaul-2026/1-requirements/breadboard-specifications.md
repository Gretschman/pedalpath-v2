# Breadboard Specifications

**Purpose:** Define exact specifications for realistic breadboard rendering
**Audience:** Worker B (breadboard base implementation)

## Critical Requirement

The breadboard MUST match the reference photos EXACTLY. This is not a "close approximation" - users need to see their breadboard on screen looking identical to the physical board in front of them.

## Reference Photos

**Location:** `1-requirements/breadboard-reference-images/`

- **breadboard-ref-1.png**: 830-point breadboard, blank
- **breadboard-ref-2.png**: Early build stage
- **breadboard-ref-3.png**: Mid-stage build
- **breadboard-ref-4.png**: Advanced build

## Standard Breadboard: 830 Tie Points

### Overall Dimensions
- **Total tie points**: 830
- **Power rails**: 2 rows × 2 sides (top/bottom)
- **Terminal strips**: 63 columns × 10 rows (2 sections)
- **Center gap**: Divides rows into upper (a-e) and lower (f-j)

### Physical Measurements (Scale)
- **Hole spacing**: 2.54mm (0.1 inch) - standard IC pitch
- **Hole diameter**: ~1mm
- **Overall size**: ~165mm × 55mm (approximate)
- **Base thickness**: ~8mm

### Layout Structure

```
Top View (830-point breadboard):

Power Rails (Top):
[+ + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + +] (Red stripe)
[- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -] (Blue stripe)

Terminal Strips:
     1  2  3  4  5  6  7  ... 60 61 62 63
   ┌─────────────────────────────────────┐
 a │ ●  ●  ●  ●  ●  ●  ●  ... ●  ●  ●  ● │
 b │ ●  ●  ●  ●  ●  ●  ●  ... ●  ●  ●  ● │
 c │ ●  ●  ●  ●  ●  ●  ●  ... ●  ●  ●  ● │
 d │ ●  ●  ●  ●  ●  ●  ●  ... ●  ●  ●  ● │
 e │ ●  ●  ●  ●  ●  ●  ●  ... ●  ●  ●  ● │
   ├─────────────────────────────────────┤ ← Center gap
 f │ ●  ●  ●  ●  ●  ●  ●  ... ●  ●  ●  ● │
 g │ ●  ●  ●  ●  ●  ●  ●  ... ●  ●  ●  ● │
 h │ ●  ●  ●  ●  ●  ●  ●  ... ●  ●  ●  ● │
 i │ ●  ●  ●  ●  ●  ●  ●  ... ●  ●  ●  ● │
 j │ ●  ●  ●  ●  ●  ●  ●  ... ●  ●  ●  ● │
   └─────────────────────────────────────┘

Power Rails (Bottom):
[+ + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + +] (Red stripe)
[- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -] (Blue stripe)
```

### Electrical Connections (Internal)

**Terminal Strips:**
- Rows a-e in same column: Connected together (5 holes)
- Rows f-j in same column: Connected together (5 holes)
- **Center gap (e/f)**: NOT connected - this is where ICs straddle

**Power Rails:**
- Each rail is one continuous connection (all + connected, all - connected)
- Top and bottom rails: NOT connected to each other (must wire together)
- Red rail: Positive voltage (+9V typical)
- Blue rail: Ground (0V)

## Visual Design Requirements

### Color Palette
```css
/* Base */
--breadboard-body: #F5F5F5;          /* White/light grey plastic */
--breadboard-edge: #CCCCCC;          /* Slightly darker edges */

/* Holes */
--breadboard-holes: #333333;         /* Dark holes */
--breadboard-hole-rim: #666666;      /* Metallic rim around hole */

/* Power Rails */
--power-rail-positive-red: #CC0000;  /* Red stripe for + */
--power-rail-ground-blue: #0066CC;   /* Blue stripe for - */

/* Labels */
--label-text-color: #666666;         /* Grey text */
--label-background: #FFFFFF;         /* White label background */
```

### Styling Details

**Base Appearance:**
- White or very light grey (#F5F5F5)
- Slightly textured (not glossy/shiny)
- Subtle shadow beneath board for depth
- Rounded corners (2-3mm radius)

**Holes:**
- Perfect circles
- Dark interior (#333333)
- Thin metallic rim (#666666)
- Evenly spaced (2.54mm grid)

**Power Rails:**
- Colored stripe (red or blue) running full length
- Stripe is ~3mm wide
- Located between holes, not over them
- Top section: Red (+) above, Blue (-) below
- Bottom section: Red (+) above, Blue (-) below

**Labels:**
- **Column numbers**: 1-63, centered above/below each column
  - Font: Sans-serif, 8-10pt
  - Color: #666666
  - Position: Just above row 'a', just below row 'j'

- **Row letters**: a-j, left side of board
  - Font: Sans-serif, 8-10pt
  - Color: #666666
  - Position: Centered vertically for each row

- **Power rail labels**: + and - symbols
  - Position: Left edge of each rail
  - Size: Slightly larger than row letters

### Depth & Shadows

For realistic 3D appearance:
- **Board shadow**: Subtle drop shadow beneath (2-3px blur, 20% opacity)
- **Hole depth**: Inner shadow in each hole (1px, 40% opacity)
- **Edge bevel**: Very subtle highlight on top edge
- **Component shadows**: Cast onto board surface (when components added)

## Small Breadboard: 400 Tie Points

For smaller circuits, also support 400-point breadboard:

### Dimensions
- **Terminal strips**: 30 columns × 10 rows
- **Power rails**: Same as 830-point but shorter
- **Layout**: Same structure, just fewer columns

## SVG Implementation Requirements

### Coordinate System
```
<svg viewBox="0 0 1650 550" xmlns="http://www.w3.org/2000/svg">
  <!-- 1 unit = 0.1mm, so 2.54mm = 25.4 units -->
  <!-- 63 columns × 25.4 = ~1600 units wide -->
</svg>
```

### Grid System
- Use consistent spacing: 25.4 units per hole (2.54mm scale)
- Origin (0,0) at top-left of terminal strip section
- Power rails above and below terminal strips
- Center gap: 5 units between row e and row f

### Hole Rendering
```svg
<!-- Example hole at column 1, row a -->
<g class="hole" data-position="a1">
  <circle cx="25.4" cy="25.4" r="4" fill="#333333" />
  <circle cx="25.4" cy="25.4" r="5" fill="none" stroke="#666666" stroke-width="0.5" />
</g>
```

### Power Rail Rendering
```svg
<!-- Top positive rail -->
<rect x="0" y="0" width="1600" height="30" fill="none" stroke="none" />
<line x1="10" y1="15" x2="1590" y2="15" stroke="#CC0000" stroke-width="8" />
<!-- Holes for power rail -->
<circle cx="25.4" cy="15" r="4" fill="#333333" />
<!-- Repeat for each column... -->
```

### Responsive Scaling
- Use `viewBox` for scalability
- Preserve aspect ratio
- Scale hole sizes proportionally
- Keep text readable at all zoom levels

## Component Hole Mapping

Each hole has unique identifier:
- **Format**: `{row}{column}` (e.g., "a15", "f32", "j63")
- **Power rails**: `"+top-15"`, `"-bottom-32"`, etc.

### Coordinate Lookup Function
```typescript
function getHoleCoordinates(position: string): { x: number, y: number } {
  const row = position[0]; // 'a' through 'j' or '+'/'-'
  const col = parseInt(position.substring(1)); // 1-63

  // Calculate x: column spacing
  const x = col * 25.4;

  // Calculate y: row spacing
  const rowMap = {
    'a': 25.4,
    'b': 50.8,
    'c': 76.2,
    'd': 101.6,
    'e': 127.0,
    'f': 152.4,  // Gap of 25.4 units
    'g': 177.8,
    'h': 203.2,
    'i': 228.6,
    'j': 254.0
  };

  const y = rowMap[row];
  return { x, y };
}
```

## Critical "Gotchas" From Reference Photos

### WRONG Orientation (Common Mistake):
❌ Power rails on LEFT and RIGHT sides
❌ Horizontal breadboard with vertical power rails

### CORRECT Orientation:
✅ Power rails on TOP and BOTTOM (horizontal stripes)
✅ Column numbers run left-to-right (1-63)
✅ Row letters run top-to-bottom (a-j)

### Color Coding:
✅ Red = Positive (+) voltage
✅ Blue/Black = Ground (-) or negative
✅ NOT "red on left, blue on right" - both at top AND bottom

## Testing & Verification

Before marking Phase 1 complete, verify:
- [ ] Breadboard orientation matches reference photos
- [ ] Power rails in correct position (top/bottom, not sides)
- [ ] Hole spacing is uniform (2.54mm grid)
- [ ] Labels are readable and correctly positioned
- [ ] Column numbers: 1-63
- [ ] Row letters: a-j
- [ ] Center gap clearly visible between e/f
- [ ] Colors match reference: white body, red +, blue -
- [ ] Holes have metallic rim appearance
- [ ] SVG scales properly without distortion

## Deliverables

**Phase 1 completion requires:**
1. `BreadboardBase.tsx` component
   - Props: `{ size: '830' | '400', highlightHoles?: string[] }`
   - Renders realistic breadboard matching specs above

2. Visual verification:
   - Side-by-side comparison with reference photos
   - All measurements proportionally correct

3. Documentation:
   - Update `3-implementation/phase1-decoders/STATUS.md`
   - Create `3-implementation/phase1-decoders/HANDOFF.md` for Phase 2

---

**Next:** See `2-technical-design/breadboard-base-architecture.md` for implementation approach
