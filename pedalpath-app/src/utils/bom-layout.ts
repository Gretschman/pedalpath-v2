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

export type PlacementType = 'resistor' | 'capacitor' | 'ic' | 'diode' | 'led' | 'transistor';

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
}

export type ComponentPlacement = InlinePlacement | ICPlacement | TransistorPlacement;

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

  // --- Resistors (rows a then b) ---
  let rCol = 5;
  let rRow: 'a' | 'b' = 'a';
  const resistors = bomData.components.filter(c => c.component_type === 'resistor');
  for (const r of resistors) {
    for (let q = 0; q < Math.min(r.quantity, 6); q++) {
      if (rCol > MAX_COL) {
        if (rRow === 'a') { rRow = 'b'; rCol = 5; }
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

  // --- Capacitors (row c) ---
  let cCol = 5;
  const caps = bomData.components.filter(c => c.component_type === 'capacitor');
  for (const cap of caps) {
    for (let q = 0; q < Math.min(cap.quantity, 5); q++) {
      if (cCol > MAX_COL) break;
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

  // --- Transistors (row d, 3 consecutive holes: E/B/C) ---
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
      });
      tCol += 5; // 3 holes used + 2-hole gap
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

  return placements;
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
