/**
 * BOM → Breadboard Layout Generator
 *
 * Converts BOM component data into hole-based placements on an 830-point
 * breadboard. The layout is a simple sequential algorithm optimised for
 * visual clarity, not electrical correctness — it is used to show the user
 * what their real components look like positioned on a board.
 *
 * Placement strategy:
 *   ICs    → rows e / f (straddle center gap), left-to-right
 *   Resistors → rows a / b, horizontal, left-to-right (wraps to row b)
 *   Capacitors → row c, horizontal, left-to-right
 *   Diodes/LEDs → row d, horizontal, left-to-right
 *
 * Phase 4 — Work Stream I: End-to-End Integration
 */

import type { BOMData } from '../types/bom.types';

// ============================================================================
// Types
// ============================================================================

export type PlacementType = 'resistor' | 'capacitor' | 'ic' | 'diode' | 'led' | 'transistor' | 'jumper';

export type JumperWireColor =
  | 'red' | 'black' | 'green' | 'blue' | 'yellow' | 'orange' | 'white' | 'purple';

/** Placement for inline components (resistors, capacitors, diodes) */
export interface InlinePlacement {
  type: 'resistor' | 'capacitor' | 'diode' | 'led';
  value: string;
  label: string;
  startHole: string;
  endHole: string;
}

/** Placement for DIP ICs straddling the center gap */
export interface ICPlacement {
  type: 'ic';
  value: string;
  label: string;
  pin1Hole: string;
  bottomRowHole: string;
  pinCount: 8 | 14 | 16;
}

/**
 * Placement for TO-92 transistors — three consecutive holes in row d.
 * startHole = eHole and endHole = cHole for compatibility with inline code
 * that checks p.type !== 'ic'.
 */
export interface TransistorPlacement {
  type: 'transistor';
  value: string;
  label: string;
  /** Emitter hole (left lead) — same as startHole */
  eHole: string;
  /** Base hole (center lead) */
  bHole: string;
  /** Collector hole (right lead) — same as endHole */
  cHole: string;
  /** Alias for eHole — keeps existing TypeScript narrowing happy */
  startHole: string;
  /** Alias for cHole — keeps existing TypeScript narrowing happy */
  endHole: string;
  /** Pin order left→right when flat face is toward the builder, e.g. 'EBC', 'GSD' */
  pinout: string;
}

// ── Pinout lookup ──────────────────────────────────────────────────────────
// Maps part number (upper-case, no suffix) → left-to-right pin order
// when the flat face is facing the builder (standard TO-92 orientation).
const PINOUT_MAP: Record<string, string> = {
  // BJT NPN/PNP — EBC (most common TO-92 BJTs)
  '2N3904': 'EBC', '2N3906': 'EBC', 'BC547': 'EBC', 'BC548': 'EBC',
  'BC549': 'EBC', 'BC549C': 'EBC', 'BC550': 'EBC', 'BC550C': 'EBC',
  'BC337': 'EBC', '2N5088': 'EBC', '2N5089': 'EBC', '2N5087': 'EBC',
  'MPSA18': 'EBC', '2N2222': 'EBC', '2N3393': 'EBC', '2SC1815': 'EBC',
  // BJT CBE order
  '2N1308': 'CBE', 'AC128': 'CBE', 'OC71': 'CBE', 'OC76': 'CBE',
  'AC127': 'CBE', 'OC44': 'CBE', 'NKT275': 'CBE',
  // JFET — SGD
  'J201': 'SGD', '2N5457': 'SGD', 'MPF4393': 'SGD',
  // MOSFET — DSG (BS170, 2N7000 TO-92 flat face forward)
  'BS170': 'DSG', '2N7000': 'DSG',
};

/** Return pinout string for a transistor value/part number. */
function lookupPinout(value: string): string {
  const key = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (PINOUT_MAP[key]) return PINOUT_MAP[key];
  // Try prefix match for suffixed parts like BC549C, 2N5457JFET
  for (const [k, v] of Object.entries(PINOUT_MAP)) {
    if (key.startsWith(k)) return v;
  }
  return 'EBC'; // safe default for unknown BJTs
}

/** A jumper wire connecting two breadboard holes */
export interface JumperWirePlacement {
  type: 'jumper';
  startHole: string;
  endHole: string;
  color: JumperWireColor;
  label?: string;
}

export type ComponentPlacement = InlinePlacement | ICPlacement | TransistorPlacement | JumperWirePlacement;

// ============================================================================
// Main export
// ============================================================================

/**
 * Generate breadboard hole placements from BOM data.
 *
 * Returns an array of placements — one per component instance.
 * If a component has quantity > 1, multiple placements are generated.
 */
export function generateBreadboardLayout(bomData: BOMData): ComponentPlacement[] {
  const placements: ComponentPlacement[] = [];
  const MAX_COL = 55; // Stay within 63-column board with margin

  // --- ICs (rows e / f, straddling center gap) ---
  let icCol = 5;
  const ics = bomData.components.filter(c =>
    c.component_type === 'ic' || c.component_type === 'op-amp'
  );
  for (const ic of ics) {
    for (let q = 0; q < Math.min(ic.quantity, 4); q++) {
      if (icCol > MAX_COL) break;
      const pinCount = guessPinCount(ic.value);
      placements.push({
        type: 'ic',
        value: ic.value,
        label: ic.reference_designators[q] ?? ic.reference_designators[0] ?? ic.value,
        pin1Hole: `e${icCol}`,
        bottomRowHole: `f${icCol}`,
        pinCount,
      });
      icCol += (pinCount / 2) + 3; // width + 3-hole gap
    }
  }

  // --- Transistors (row d, 3 consecutive holes: E/B/C) ---
  // Placed first: the TransistorSVG body extends 82px above row d (covering rows a–b
  // at those columns). Resistors and capacitors must start in columns AFTER the
  // transistor zone so they are not obscured by the transistor body.
  let tCol = 4; // start col for emitter pin
  const transistors = bomData.components.filter(c => c.component_type === 'transistor');
  for (const t of transistors) {
    for (let q = 0; q < Math.min(t.quantity, 4); q++) {
      if (tCol + 2 > MAX_COL) break;
      placements.push({
        type: 'transistor',
        value: t.value,
        label: t.reference_designators[q] ?? t.reference_designators[0] ?? t.value,
        eHole: `d${tCol}`,
        bHole: `d${tCol + 1}`,
        cHole: `d${tCol + 2}`,
        startHole: `d${tCol}`,
        endHole: `d${tCol + 2}`,
        pinout: lookupPinout(t.value),
      });
      tCol += 5; // 3 holes used + 2-hole gap
    }
  }

  // After transistors, compute the first column safe for rows a–c components.
  // tCol > 4 means at least one transistor was placed; use tCol as the start.
  const firstFreeCol = tCol > 4 ? tCol : 5;

  // --- Resistors (rows a then b) ---
  let rCol = firstFreeCol;
  let rRow: 'a' | 'b' = 'a';
  const resistors = bomData.components.filter(c => c.component_type === 'resistor');
  for (const r of resistors) {
    for (let q = 0; q < Math.min(r.quantity, 6); q++) {
      if (rCol > MAX_COL) {
        if (rRow === 'a') { rRow = 'b'; rCol = firstFreeCol; }
        else break;
      }
      placements.push({
        type: 'resistor',
        value: r.value,
        label: r.reference_designators[q] ?? r.reference_designators[0] ?? r.value,
        startHole: `${rRow}${rCol}`,
        endHole: `${rRow}${rCol + 5}`,
      });
      rCol += 8; // 5-hole span + 3-hole gap
    }
  }

  // --- Capacitors ---
  // Electrolytic and film caps are radial components — they stand upright on the board.
  // Placement: same column, adjacent rows (b→c), so the SVG renders a top-down view.
  // Ceramic caps are small axial discs — placed horizontally in row c as before.
  let cCol = firstFreeCol;
  const caps = bomData.components.filter(c => c.component_type === 'capacitor');
  for (const cap of caps) {
    for (let q = 0; q < Math.min(cap.quantity, 5); q++) {
      if (cCol > MAX_COL) break;
      const subtype = guessCapSubtype(cap.value);
      const isUpright = subtype === 'electrolytic' || subtype === 'film';
      if (isUpright) {
        // Upright: startHole = positive lead (upper row b), endHole = negative (lower row c)
        placements.push({
          type: 'capacitor',
          value: cap.value,
          label: cap.reference_designators[q] ?? cap.reference_designators[0] ?? cap.value,
          startHole: `b${cCol}`,
          endHole: `c${cCol}`,
        });
        cCol += 3; // 1 column used + 2-hole gap
      } else {
        // Ceramic: horizontal disc in row c
        const span = guessCapSpan(cap.value);
        placements.push({
          type: 'capacitor',
          value: cap.value,
          label: cap.reference_designators[q] ?? cap.reference_designators[0] ?? cap.value,
          startHole: `c${cCol}`,
          endHole: `c${cCol + span}`,
        });
        cCol += span + 4;
      }
    }
  }

  // --- Diodes and LEDs (row d, after transistors) ---
  let dCol = transistors.length > 0 ? tCol + 2 : 5;
  const diodesAndLeds = bomData.components.filter(c =>
    c.component_type === 'diode' || c.component_type === 'led'
  );
  for (const d of diodesAndLeds) {
    for (let q = 0; q < Math.min(d.quantity, 4); q++) {
      if (dCol > MAX_COL) break;
      placements.push({
        type: d.component_type === 'led' ? 'led' : 'diode',
        value: d.value,
        label: d.reference_designators[q] ?? d.reference_designators[0] ?? d.value,
        startHole: `d${dCol}`,
        endHole: `d${dCol + 4}`,
      });
      dCol += 7;
    }
  }

  // Generate power/ground jumper wires based on component placements
  const jumpers = generateJumperWires(placements, bomData);
  return [...placements, ...jumpers];
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Guess the DIP pin count from the IC value string.
 * Defaults to 8-pin for unknown ICs.
 */
function guessPinCount(value: string): 8 | 14 | 16 {
  const v = value.toUpperCase();
  if (v.includes('TL074') || v.includes('LM324') || v.includes('TL064') ||
      v.includes('LM348') || v.includes('CD40') || v.includes('NE5514')) return 14;
  if (v.includes('PT2399') || v.includes('MN3005') || v.includes('MN3101') ||
      v.includes('MN3009') || v.includes('MN3207')) return 16;
  return 8;
}

/**
 * Generate power and ground jumper wires from component placements.
 *
 * Produces deterministic wires that are always correct regardless of circuit:
 *   - IC circuits: red VCC wire (top + rail → IC VCC pin) + black GND wire (top − rail → IC GND pin)
 *   - Transistor-only circuits: red VCC wire (top + rail → collector column) + black GND (top − rail → emitter)
 *   - Passive-only: no jumpers needed
 *
 * Standard DIP power pin convention:
 *   8-pin:  GND = pin 4 → e{col+3}, VCC = pin 8  → f{col}
 *   14-pin: GND = pin 7 → e{col+6}, VCC = pin 14 → f{col}
 *   16-pin: GND = pin 8 → e{col+7}, VCC = pin 16 → f{col}
 */
function generateJumperWires(
  placements: ComponentPlacement[],
  bomData: BOMData,
): JumperWirePlacement[] {
  // Passive circuits don't need power wires
  if (!bomData.power) return [];

  const icPlacement = placements.find((p): p is ICPlacement => p.type === 'ic');
  const transistorPlacement = placements.find((p): p is TransistorPlacement => p.type === 'transistor');

  if (icPlacement) {
    const icCol = parseInt(icPlacement.pin1Hole.substring(1));
    const pinCount = icPlacement.pinCount;
    // GND pin is pin N/2, on the upper-row (e) side; VCC pin is pin N, on f-row at icCol
    const gndCol = icCol + (pinCount / 2) - 1;
    return [
      {
        type: 'jumper',
        startHole: `+${icCol}`,
        endHole: `f${icCol}`,
        color: 'red',
        label: 'VCC',
      },
      {
        type: 'jumper',
        startHole: `-${gndCol}`,
        endHole: `e${gndCol}`,
        color: 'black',
        label: 'GND',
      },
    ];
  }

  if (transistorPlacement) {
    const eCol = parseInt(transistorPlacement.eHole.substring(1));
    const cCol = parseInt(transistorPlacement.cHole.substring(1));
    return [
      {
        type: 'jumper',
        startHole: `+${cCol}`,
        endHole: `a${cCol}`,
        color: 'red',
        label: 'VCC',
      },
      {
        type: 'jumper',
        startHole: `-${eCol}`,
        endHole: `d${eCol}`,
        color: 'black',
        label: 'GND',
      },
    ];
  }

  return [];
}

/**
 * Classify a capacitor as electrolytic, film, or ceramic based on its value string.
 * Electrolytics (≥1µF) and film caps (nF / sub-µF) are radial and stand upright.
 * Ceramics (pF) are small axial discs placed horizontally.
 */
function guessCapSubtype(value: string): 'electrolytic' | 'film' | 'ceramic' {
  const v = value.toLowerCase().replace(/\s/g, '');
  if (v.includes('uf') || v.includes('µf')) {
    const num = parseFloat(v);
    if (!isNaN(num) && num >= 1) return 'electrolytic';
    return 'film'; // sub-µF like 0.1µF, 0.22µF
  }
  if (v.includes('nf') || (v.includes('n') && !v.includes('pf'))) return 'film';
  return 'ceramic'; // pF range
}

/**
 * Guess a capacitor's breadboard span in holes based on its value string.
 * Larger capacitors occupy more holes.
 */
function guessCapSpan(value: string): 3 | 4 | 5 {
  const v = value.toLowerCase().replace(/\s/g, '');
  // Electrolytic (≥1µF): big body, 5-hole span
  if (v.includes('uf') || v.includes('µf')) {
    const num = parseFloat(v);
    if (!isNaN(num) && num >= 1) return 5;
    return 4;
  }
  // Film / nF range: medium body, 4-hole span
  if (v.includes('nf') || v.includes('n') || v.match(/\d{3}[a-z]\d{2,3}/)) return 4;
  // Ceramic (pF range): small body, 3-hole span
  return 3;
}
