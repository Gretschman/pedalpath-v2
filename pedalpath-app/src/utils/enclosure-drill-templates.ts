/**
 * Enclosure drill template data — all measurements sourced from:
 *
 *  • Pedal Parts Plus 125B / 1590B templates (confirmed face and side dimensions)
 *  • AmplifyFun AF_TEMPLATE_125B_v01 (hole size legend: footswitch=1/2", jack=3/8", pot=5/16", LED=1/4")
 *  • General Guitar Gadgets 125B-0Knob (face height 118-122mm, north side 67×35mm, hole pattern)
 *  • Real 1590B photos with red measurement overlays (60.5mm wide north face, confirmed jack coords)
 *  • Rob's "DRill Templates.pdf" — 7-page in-INBOX PDF, 3-knob + 4-knob layouts on 125B and 1590B
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

// ─── Hole size constants (inches → mm, from AmplifyFun legend) ───────────────

export const HOLE_MM = {
  footswitch: 12.7,   // 1/2"  — 3PDT footswitch
  jack_14:     9.5,   // 3/8"  — standard 1/4" mono/stereo jack
  pot:         7.9,   // 5/16" — 16mm Alpha pot shaft
  led_5mm:     7.9,   // 5/16" — 5mm LED bezel
  led_3mm:     6.35,  // 1/4"  — 3mm LED (tight fit)
  dc_barrel:   8.0,   // ~5/16" — 5.5/2.1mm barrel connector (8mm common size)
  toggle:      6.35,  // 1/4"  — standard mini toggle switch
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
    case 'pot':        return HOLE_MM.pot;
    case 'footswitch': return HOLE_MM.footswitch;
    case 'led':        return HOLE_MM.led_5mm;
    case 'jack_in':
    case 'jack_out':   return HOLE_MM.jack_14;
    case 'dc_barrel':  return HOLE_MM.dc_barrel;
    case 'toggle':     return HOLE_MM.toggle;
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
  notes: '5mm LED bezel',
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
  enclosureKey: '125B' | '1590B',
  potCount: number,
  hasToggle: boolean,
): FaceLayout {
  const layouts = enclosureKey === '125B' ? FACE_LAYOUTS_125B : FACE_LAYOUTS_1590B;

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
};
