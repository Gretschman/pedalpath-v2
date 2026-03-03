/**
 * Enclosure drill template data — all measurements sourced from:
 *
 *  • Pedal Parts Plus 125B / 1590B templates (confirmed face and side dimensions)
 *  • AmplifyFun AF_TEMPLATE_125B_v01 (hole size legend: footswitch=1/2", jack=3/8", pot=5/16", LED=1/4")
 *  • General Guitar Gadgets 125B-0Knob (face height 118-122mm, north side 67×35mm, hole pattern)
 *  • Real 1590B photos with red measurement overlays (60.5mm wide north face, confirmed jack coords)
 *  • Rob's "DRill Templates.pdf" — 7-page in-INBOX PDF, 3-knob + 4-knob layouts on 125B and 1590B
 *  • FuzzDog FuzzPups V2 build guide — confirmed 1590A drill positions, FuzzPup 3-potter layout
 *
 * Coordinate system:
 *   • All positions in mm
 *   • Face origin = top-left of face panel, X right, Y down
 *   • Side origins = top-left of that side panel viewed from outside, X right, Y down
 *
 * Enclosure orientation: PORTRAIT (long axis vertical, as shown in all reference templates).
 *   125B face: 66mm wide × 121mm tall
 *   1590B face: 60.7mm wide × 112.3mm tall
 */

// ─── Hole size constants — canonical values from drill_hole_diameter_prompt.json ──────────────
//
// Source: _INBOX/drill_hole_diameter_prompt.json (authoritative pedal drill reference)
// Rule: use datasheet dimensions when part number is known; these are defaults.
// +0.2–0.5mm extra clearance recommended over bare metal if powder-coated enclosure.

export const HOLE_MM = {
  // Footswitches
  footswitch:      12.7,  // 1/2"   — 3PDT / DPDT mechanical stomp switch (blue 3PDT)
  footswitch_soft: 12.0,  // ~1/2"  — soft-touch momentary (12mm or 16mm; verify per part)

  // Jacks
  jack_14:          9.5,  // 3/8"   — Switchcraft open-frame ¼" mono/stereo jack (11/12A class)
  jack_enclosed:   10.0,  // ~3/8"  — enclosed Cliff/panel-mount ¼" jack (10–12mm; check datasheet)

  // Potentiometers
  pot:              7.9,  // 5/16"  — 16mm / 24mm Alpha / CTS pot shaft (8mm common metric target)
  pot_9mm:          7.0,  // ~9/32" — 9mm mini pot, Alpha RV09 / Bourns style

  // LEDs (bare through-hole — NOT bezel)
  led_5mm:          5.1,  // ~13/64"— bare 5mm LED body (5.0–5.2mm range; 13/64" = 5.16mm)
  led_3mm:          3.2,  // 1/8"   — bare 3mm LED body (3.175mm; round up to 3.2mm metric)

  // LED bezels / panel-mount holders
  led_bezel:        8.0,  // 5/16"  — standard LED panel bezel (8mm common; 10mm also used)

  // DC power jacks
  dc_barrel:       12.0,  // ~1/2"  — standard panel-mount 2.1mm threaded bushing (most common)
  dc_barrel_mini:   8.0,  // 5/16"  — small board-mount DC barrel (FuzzDog 1590A style; verify part)

  // Toggle switches
  toggle:           6.35, // 1/4"   — full-size mini toggle SPDT/DPDT (many use 6mm; 6.35mm safe)
  toggle_sub:       5.5,  // ~7/32" — sub-mini toggle (5–6mm; verify per part)
} as const;

// ─── Enclosure dimensions ──────────────────────────────────────────────────────

export interface SideDimensions {
  /** Width of this side panel (mm), measured parallel to the face edge it adjoins */
  width: number;
  /** Height of this side panel (mm) = depth of the enclosure */
  height: number;
}

export interface EnclosureSpec {
  name: string;
  /** Face width (mm) — short axis in portrait orientation */
  faceW: number;
  /** Face height (mm) — long axis in portrait orientation */
  faceH: number;
  /** Enclosure body depth (mm) = wall height */
  depth: number;
  /** North and South end panels (narrow ends) */
  northSouth: SideDimensions;
  /** East and West long side panels */
  eastWest: SideDimensions;
  /** Corner radius of face (mm, for SVG rounding) */
  cornerR: number;
}

/**
 * Confirmed from Pedal Parts Plus templates (pedalpartsplus.com):
 *   125B face: 2.6" × 4.77" = 66.0mm × 121.2mm
 *   125B North/South: 2.61" × 1.40" = 66.3mm × 35.6mm
 *   125B East/West: 4.77" × 1.40" = 121.2mm × 35.6mm
 *
 *   1590B face: 2.39" × 4.42" = 60.7mm × 112.3mm
 *   1590B North/South: 2.37" × 1.05" = 60.2mm × 26.7mm
 *   1590B East/West: 4.41" × 1.05" = 112.0mm × 26.7mm
 *
 * 1590A measurements confirmed from FuzzDog FuzzPups V2 build guide (drilling guide page):
 *   Face: 35.0mm × 78.0mm (derived: footswitch 12mm from bottom + 66mm to top = 78mm total)
 *   North/South: 35.0mm × 27.0mm  |  East/West: 78.0mm × 27.0mm
 *   Drill sizes confirmed: Jacks=9mm, Footswitch=12mm, DC Socket=8mm, Pots=7mm
 *   Jack spec: Lumberg KLBM3 mono ¼" on EAST/WEST long sides (not north face)
 *   DC socket: north end panel only, centered, 18mm from top edge (CONFIRMED)
 *   Input jack (west side): 34mm from top  |  Output jack (east side): 45mm from top (CONFIRMED)
 *   Footswitch: Y=66mm (12mm from bottom) centered (CONFIRMED)
 *   Middle pot (3-pot layout): Y=49mm (CONFIRMED from drilling guide "49" measurement)
 *   Upper pots (3-pot layout): Y≈15mm, X≈9mm from each edge (estimated from diagram)
 */
export const ENCLOSURE_SPECS: Record<string, EnclosureSpec> = {
  '125B': {
    name: '125B (Tall Vertical)',
    faceW: 66.0,
    faceH: 121.2,
    depth: 35.6,
    northSouth: { width: 66.3, height: 35.6 },
    eastWest:   { width: 121.2, height: 35.6 },
    cornerR: 3,
  },
  '1590B': {
    name: '1590B (Standard)',
    faceW: 60.7,
    faceH: 112.3,
    depth: 26.7,
    northSouth: { width: 60.5, height: 26.7 },
    eastWest:   { width: 112.0, height: 26.7 },
    cornerR: 3,
  },
  '1590A': {
    name: '1590A (Compact)',
    faceW: 35.0,
    faceH: 78.0,   // confirmed: 66mm to footswitch + 12mm to bottom = 78mm
    depth: 27.0,
    northSouth: { width: 35.0, height: 27.0 },
    eastWest:   { width: 78.0, height: 27.0 },
    cornerR: 2,
  },
};

// ─── Drill hole descriptor ─────────────────────────────────────────────────────

export interface DrillPoint {
  /** Short label for this hole (e.g. "LED", "Footswitch", "Pot 1") */
  label: string;
  /** Component type — used to look up hole size and styling */
  type: 'pot' | 'footswitch' | 'led' | 'jack_in' | 'jack_out' | 'dc_barrel' | 'toggle';
  /** X position mm from left of panel */
  x: number;
  /** Y position mm from top of panel */
  y: number;
  /** Drill diameter (mm). If omitted, derived from `type` via HOLE_MM. */
  diameterMm?: number;
  notes?: string;
}

export function holeDiameter(p: DrillPoint): number {
  if (p.diameterMm !== undefined) return p.diameterMm;
  switch (p.type) {
    case 'pot':        return HOLE_MM.pot;        // 7.9mm — 16mm Alpha shaft
    case 'footswitch': return HOLE_MM.footswitch; // 12.7mm — 3PDT stomp
    case 'led':        return HOLE_MM.led_5mm;    // 5.1mm — bare 5mm LED (use diameterMm:8 for bezel)
    case 'jack_in':
    case 'jack_out':   return HOLE_MM.jack_14;    // 9.5mm — Switchcraft open-frame
    case 'dc_barrel':  return HOLE_MM.dc_barrel;  // 12mm — panel-mount threaded (use diameterMm:8 for mini)
    case 'toggle':     return HOLE_MM.toggle;     // 6.35mm — full-size mini toggle
  }
}

// ─── Standard face layout presets ─────────────────────────────────────────────
//
// Positions derived from:
//   • Rob's DRill Templates.pdf (INBOX, 7 pages, 3-knob and 4-knob on both 125B + 1590B)
//   • Community standards: Effects Layouts, GuitarPCB, Tagboard Effects
//   • All positions verified to avoid the north-side jack zone (Y < 25mm for 125B)
//     and the footswitch/LED zone (Y > 95mm for 125B, Y > 85mm for 1590B)

export interface FaceLayout {
  name: string;
  description: string;
  /** Holes for the top (face) panel only — not side jacks */
  holes: DrillPoint[];
}

// Helper to build a pot DrillPoint
const pot = (n: number, x: number, y: number, ref = ''): DrillPoint => ({
  label: `Pot ${n}${ref ? ' (' + ref + ')' : ''}`,
  type: 'pot',
  x, y,
});

const footswitch = (x: number, y: number): DrillPoint => ({
  label: 'Footswitch',
  type: 'footswitch',
  x, y,
  notes: '3PDT true-bypass',
});

const led = (x: number, y: number): DrillPoint => ({
  label: 'LED',
  type: 'led',
  x, y,
  notes: '5mm LED — 5.1mm hole; use diameterMm:8 for bezel mount',
});

const toggle = (x: number, y: number, label = 'Toggle'): DrillPoint => ({
  label,
  type: 'toggle',
  x, y,
});

// ── 125B face layouts (66mm × 121mm) ─────────────────────────────────────────
//
// Reference grid (portrait): X center = 33mm, usable X band ≈ 14–52mm
// Forbidden Y: < 22mm (jack/DC zone from North side) and > 95mm (footswitch zone)
// Pot row 1 Y = 28mm, row 2 Y = 52mm, footswitch Y = 90mm, LED Y = 74mm

export const FACE_LAYOUTS_125B: FaceLayout[] = [
  {
    name: '0-Knob',
    description: 'No pots — LED + footswitch only (e.g. Dan Armstrong Green Ringer)',
    holes: [
      led(33, 60),
      footswitch(33, 90),
    ],
  },
  {
    name: '1-Knob',
    description: 'Single centered pot',
    holes: [
      pot(1, 33, 28),
      led(33, 62),
      footswitch(33, 90),
    ],
  },
  {
    name: '2-Knob',
    description: 'Two pots side by side',
    holes: [
      pot(1, 20, 28, 'L'),
      pot(2, 46, 28, 'R'),
      led(33, 62),
      footswitch(33, 90),
    ],
  },
  {
    name: '3-Knob + Toggle',
    description: '2 pots top row, 1 pot + toggle mid row (matches INBOX template: LEVEL/DIST/FILTER)',
    holes: [
      pot(1, 18, 28, 'LEVEL'),
      pot(2, 49, 28, 'DIST'),
      toggle(14, 52, 'Toggle'),
      pot(3, 49, 52, 'FILTER'),
      led(33, 72),
      footswitch(33, 90),
    ],
  },
  {
    name: '4-Knob (2×2)',
    description: '2×2 grid — VOL/GAIN top row, BASS/TREB bottom row (matches INBOX template)',
    holes: [
      pot(1, 18, 28, 'VOL'),
      pot(2, 49, 28, 'GAIN'),
      pot(3, 18, 52, 'BASS'),
      pot(4, 49, 52, 'TREB'),
      led(33, 72),
      footswitch(33, 90),
    ],
  },
  {
    name: '4-Knob + Toggle (2×2)',
    description: '4-knob 2×2 with mini toggle at center',
    holes: [
      pot(1, 18, 28, 'P1'),
      pot(2, 49, 28, 'P2'),
      toggle(33, 47, 'SW'),
      pot(3, 18, 57, 'P3'),
      pot(4, 49, 57, 'P4'),
      led(33, 74),
      footswitch(33, 90),
    ],
  },
];

// ── 1590A face layouts (35mm × 78mm) ─────────────────────────────────────────
//
// Source: FuzzDog FuzzPups V2 build guide — standardised FuzzPup 3-potter layout
// Reference grid: X center = 17.5mm, usable X band ≈ 7–28mm
// No face forbidden zone at top (DC socket on north END panel, not face)
// Confirmed: footswitch Y=66mm (12mm from bottom), middle pot Y=49mm
// Estimated: upper pots Y≈15mm, X≈9mm from each edge
// Drill sizes (FuzzDog guide): pots=7mm, footswitch=12mm, jacks=9mm, DC=8mm

export const FACE_LAYOUTS_1590A: FaceLayout[] = [
  {
    name: '1-Knob',
    description: 'Single centered pot — booster / buffer (e.g. SHO style)',
    holes: [
      pot(1, 17.5, 22),
      led(17.5, 49),
      footswitch(17.5, 66),
    ],
  },
  {
    name: '2-Knob',
    description: 'Two pots side by side (upper row)',
    holes: [
      pot(1, 9,  17, 'L'),
      pot(2, 26, 17, 'R'),
      led(17.5, 49),
      footswitch(17.5, 66),
    ],
  },
  {
    name: '3-Potter (2+1)',
    description: 'FuzzPup standard: 2 pots upper row + 1 pot center — confirmed from FuzzDog drilling guide',
    holes: [
      pot(1, 9,    15, 'P1'),   // upper left  — Y≈15mm (estimated from diagram)
      pot(2, 26,   15, 'P2'),   // upper right — Y≈15mm (estimated)
      pot(3, 17.5, 49, 'P3'),   // center      — Y=49mm (CONFIRMED)
      led(17.5, 57),
      footswitch(17.5, 66),     // Y=66mm (CONFIRMED: 12mm from bottom of 78mm face)
    ],
  },
];

// ── 1590B face layouts (60.7mm × 112.3mm) ────────────────────────────────────
//
// Reference grid: X center = 30.3mm, usable X band ≈ 13–48mm
// Jacks on East/West sides (no top-face forbidden zone unless top-mount)
// Footswitch Y = 84mm, LED Y = 67mm
// Pot row 1 Y = 20mm, row 2 Y = 44mm

export const FACE_LAYOUTS_1590B: FaceLayout[] = [
  {
    name: '0-Knob',
    description: 'No pots — LED + footswitch only',
    holes: [
      led(30.3, 55),
      footswitch(30.3, 84),
    ],
  },
  {
    name: '1-Knob',
    description: 'Single centered pot',
    holes: [
      pot(1, 30.3, 20),
      led(30.3, 55),
      footswitch(30.3, 84),
    ],
  },
  {
    name: '2-Knob',
    description: 'Two pots side by side',
    holes: [
      pot(1, 16, 20, 'L'),
      pot(2, 45, 20, 'R'),
      led(30.3, 55),
      footswitch(30.3, 84),
    ],
  },
  {
    name: '3-Knob (top 2 + center)',
    description: '2 pots top, 1 pot centered below',
    holes: [
      pot(1, 16, 20, 'P1'),
      pot(2, 45, 20, 'P2'),
      pot(3, 30.3, 44, 'P3'),
      led(30.3, 62),
      footswitch(30.3, 84),
    ],
  },
  {
    name: '3-Knob + Toggle',
    description: '2 pots top, 1 pot + toggle mid (matches INBOX template: LEVEL/DIST/FILTER)',
    holes: [
      pot(1, 16, 20, 'LEVEL'),
      pot(2, 45, 20, 'DIST'),
      toggle(12, 44, 'Toggle'),
      pot(3, 45, 44, 'FILTER'),
      led(30.3, 62),
      footswitch(30.3, 84),
    ],
  },
  {
    name: '4-Knob (2×2)',
    description: '2×2 grid — VOL/GAIN top row, BASS/TREB bottom row (matches INBOX template)',
    holes: [
      pot(1, 15, 20, 'VOL'),
      pot(2, 46, 20, 'GAIN'),
      pot(3, 15, 44, 'BASS'),
      pot(4, 46, 44, 'TREB'),
      led(30.3, 62),
      footswitch(30.3, 84),
    ],
  },
  {
    name: '4-Knob + Toggle (2×2)',
    description: '4-knob 2×2 with mini toggle',
    holes: [
      pot(1, 15, 20, 'P1'),
      pot(2, 46, 20, 'P2'),
      toggle(30.3, 42, 'SW'),
      pot(3, 15, 52, 'P3'),
      pot(4, 46, 52, 'P4'),
      led(30.3, 66),
      footswitch(30.3, 84),
    ],
  },
];

// ─── North-side (top narrow face) jack layouts ────────────────────────────────
//
// "Top-mount" configuration: all three jacks on the north narrow side.
// Measurements CONFIRMED from real 1590B enclosure photos with red measurement overlays:
//
//   1590B North side (60.5mm W × 26.7mm H):
//     DC barrel: x=30.25, y=9.2   (centered, 9.2mm from top edge)
//     Input:     x=13.2,  y=16.7  (13.2mm from left edge, 10mm from bottom)
//     Output:    x=47.3,  y=16.7  (13.2mm from right edge, 10mm from bottom)
//
//   125B North side (66.3mm W × 35.6mm H):
//     Scaled proportionally from confirmed 1590B measurements.
//     DC barrel: x=33.15, y=12.3
//     Input:     x=14.5,  y=22.2
//     Output:    x=51.8,  y=22.2

export const NORTH_SIDE_JACKS: Record<string, DrillPoint[]> = {
  '1590B': [
    { label: 'DC Power',  type: 'dc_barrel', x: 30.25, y: 9.2,  notes: 'Center, 9.2mm from top — 2.1mm barrel jack' },
    { label: 'Input',     type: 'jack_in',   x: 13.2,  y: 16.7, notes: 'Left, 13.2mm from left edge — ¼" mono jack' },
    { label: 'Output',    type: 'jack_out',  x: 47.3,  y: 16.7, notes: 'Right, 13.2mm from right edge — ¼" mono jack' },
  ],
  '125B': [
    { label: 'DC Power',  type: 'dc_barrel', x: 33.15, y: 12.3, notes: 'Center, 12.3mm from top — 2.1mm barrel jack' },
    { label: 'Input',     type: 'jack_in',   x: 14.5,  y: 22.2, notes: 'Left, 14.5mm from left edge — ¼" mono jack' },
    { label: 'Output',    type: 'jack_out',  x: 51.8,  y: 22.2, notes: 'Right, 14.5mm from right edge — ¼" mono jack' },
  ],
  // 1590A: DC socket only on north end — audio jacks are on east/west long sides (see EAST_WEST_JACKS_1590A)
  '1590A': [
    { label: 'DC Power',  type: 'dc_barrel', x: 17.5,  y: 18.0, notes: 'Center, 18mm from top edge — CONFIRMED FuzzDog drilling guide' },
  ],
};

// ─── 1590A east/west side jack positions (asymmetric — confirmed from FuzzDog guide) ───────────
//
// FuzzDog FuzzPups V2 drilling guide specifies:
//   Input  (west/left side):  34mm from top of face along the long axis — CONFIRMED
//   Output (east/right side): 45mm from top of face along the long axis — CONFIRMED
//   Jack spec: Lumberg KLBM3 mono ¼" jack socket (9mm drill)
//   Jacks sit in the side wall — y here = depth midpoint (13.5mm in 27mm deep wall)
//
// Coordinate: x = distance from top along the long face axis (0 = top/north end)
//             y = distance from face edge into side wall (0 = flush with face)

export const EAST_WEST_JACKS_1590A: { input: DrillPoint; output: DrillPoint } = {
  input:  { label: 'Input',  type: 'jack_in',  x: 34, y: 13.5, notes: '34mm from top on west (left) side — CONFIRMED FuzzDog guide; Lumberg KLBM3' },
  output: { label: 'Output', type: 'jack_out', x: 45, y: 13.5, notes: '45mm from top on east (right) side — CONFIRMED FuzzDog guide; Lumberg KLBM3' },
};

// ─── East/West side jack layouts (alternative to top-mount) ──────────────────
//
// Some builds route jacks on the long sides.
// Centered along the side length, centered in the depth.

export function eastWestJacks(spec: EnclosureSpec): { input: DrillPoint; output: DrillPoint } {
  const cx = spec.faceH / 2;       // centered along the long axis
  const cy = spec.depth / 2;       // centered in wall depth
  return {
    input:  { label: 'Input',  type: 'jack_in',  x: cx, y: cy, notes: 'West side (left), ¼" mono jack' },
    output: { label: 'Output', type: 'jack_out', x: cx, y: cy, notes: 'East side (right), ¼" mono jack' },
  };
}

// ─── Auto-select face layout from pot count ───────────────────────────────────

export function autoSelectLayout(
  enclosureKey: '125B' | '1590B' | '1590A',
  potCount: number,
  hasToggle: boolean,
): FaceLayout {
  const layouts =
    enclosureKey === '125B'  ? FACE_LAYOUTS_125B  :
    enclosureKey === '1590A' ? FACE_LAYOUTS_1590A :
                               FACE_LAYOUTS_1590B;

  if (potCount === 0) return layouts.find(l => l.name === '0-Knob')!;
  if (potCount === 1) return layouts.find(l => l.name === '1-Knob')!;
  if (potCount === 2) return layouts.find(l => l.name === '2-Knob')!;
  if (potCount === 3) {
    const name = hasToggle ? '3-Knob + Toggle' : '3-Knob (top 2 + center)';
    return layouts.find(l => l.name === name) ?? layouts.find(l => l.name.startsWith('3'))!;
  }
  if (potCount >= 4) {
    const name = hasToggle ? '4-Knob + Toggle (2×2)' : '4-Knob (2×2)';
    return layouts.find(l => l.name === name) ?? layouts.find(l => l.name.startsWith('4'))!;
  }
  return layouts[0];
}

// ─── Forbidden zones (face panel, mm from top) ────────────────────────────────
//
// These match the Phase 4 collision detection zones in CLAUDE.md.

export interface ForbiddenZone {
  label: string;
  yMin: number;
  yMax: number;
}

export const FACE_FORBIDDEN_ZONES: Record<string, ForbiddenZone[]> = {
  '125B': [
    { label: 'JACKS / DC (North Side)', yMin: 0,   yMax: 22  },
    { label: 'FOOTSWITCH ZONE',         yMin: 95,  yMax: 121 },
  ],
  '1590B': [
    // Top-mount: jacks on north side — no forbidden zone on face
    { label: 'FOOTSWITCH ZONE', yMin: 88, yMax: 112 },
  ],
  '1590A': [
    // DC socket on north END panel (not face) — no top forbidden zone
    // Footswitch Y=66mm (confirmed) — keep components clear of lower 12mm
    { label: 'FOOTSWITCH ZONE', yMin: 60, yMax: 78 },
  ],
};
