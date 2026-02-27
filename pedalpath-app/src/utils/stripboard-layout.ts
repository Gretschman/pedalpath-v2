/**
 * Stripboard Layout Generator
 *
 * Produces component placement positions for StripboardView.
 * Layout rules (physical reality of how stripboard works):
 *   - Copper strips run HORIZONTALLY → all holes in a ROW are connected
 *   - Components connect two DIFFERENT rows by sharing a column (vertical placement)
 *   - Transistors: 3 consecutive rows, same column (E/B/C or C/B/E)
 *   - Resistors/caps/diodes: 2 rows apart, same column (body lies between the holes)
 *   - Power rails: row 1 = +V, row 2 = GND (reserved — not used for components)
 */

import type { BOMData } from '../types/bom.types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type StripboardComponentType =
  | 'resistor'
  | 'capacitor'
  | 'transistor'
  | 'diode'
  | 'ic'
  | 'other';

export interface LeadPos {
  row: number;  // 1-based, 1–25
  col: number;  // 0-based, 0=A … 23=X
}

export interface StripboardComponent {
  id: string;
  type: StripboardComponentType;
  value: string;
  ref: string;
  lead1: LeadPos;
  lead2?: LeadPos;   // 2-lead components, transistor B pin
  lead3?: LeadPos;   // transistor C pin
}

export interface StripboardLayout {
  components: StripboardComponent[];
  trackCuts: string[];  // e.g. ['D11', 'G10'] — column letter + row number
}

// ─── Resistor colour-band helper ─────────────────────────────────────────────

const BAND_COLORS: Record<number, string> = {
  0: '#1a1a1a',   // black
  1: '#7B3F00',   // brown
  2: '#CC0000',   // red
  3: '#FF6600',   // orange
  4: '#FFCC00',   // yellow
  5: '#006633',   // green
  6: '#0033CC',   // blue
  7: '#9933FF',   // violet
  8: '#999999',   // gray
  9: '#FFFFFF',   // white
};

/**
 * Return [d1, d2, multiplier] digit array from a resistance value string.
 * e.g. "10k", "4.7k", "220", "1M" → first two significant digits
 */
export function resistorDigits(value: string): [number, number, number] {
  const m = value.trim().replace(/Ω|ohm|ohms/i, '');
  const mult = /k/i.test(m) ? 3 : /M/i.test(m) ? 6 : 0;
  const num = parseFloat(m.replace(/[kKmMuU]/g, ''));
  if (isNaN(num)) return [0, 0, mult];
  const str = num.toString().replace('.', '');
  const d1 = parseInt(str[0]) || 0;
  const d2 = parseInt(str[1]) || 0;
  return [d1, d2, mult];
}

export function resistorBandColor(digit: number): string {
  return BAND_COLORS[digit] ?? '#999';
}

// ─── Layout Generator ────────────────────────────────────────────────────────

const COL_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWX';

function colLabel(colIdx: number): string {
  return COL_LABELS[colIdx] ?? '?';
}

export function generateStripboardLayout(bomData: BOMData): StripboardLayout {
  const placements: StripboardComponent[] = [];
  const cuts: string[] = [];

  // Reserve rows 1 (V+) and 2 (GND) as power rails
  // Component area: rows 4–22

  let nextId = 0;
  const mkId = () => `sbc-${nextId++}`;

  // ── Transistors ─ rows 4–6, columns starting at C (index 2) ──────────────
  let tCol = 2;
  for (const comp of bomData.components.filter(c => c.component_type === 'transistor')) {
    for (let i = 0; i < comp.quantity; i++) {
      const ref = comp.reference_designators[i] ?? comp.reference_designators[0] ?? 'Q';
      placements.push({
        id: mkId(),
        type: 'transistor',
        value: comp.value,
        ref,
        lead1: { row: 4, col: tCol },  // E
        lead2: { row: 5, col: tCol },  // B
        lead3: { row: 6, col: tCol },  // C
      });
      tCol += 4;  // 4-col gap between transistors
    }
  }

  // ── ICs ─ rows 4–5, straddle power strip, placed right of transistors ─────
  let icCol = tCol + 1;
  for (const comp of bomData.components.filter(c =>
    c.component_type === 'ic' || c.component_type === 'op-amp'
  )) {
    for (let i = 0; i < comp.quantity; i++) {
      const ref = comp.reference_designators[i] ?? comp.reference_designators[0] ?? 'IC';
      // IC straddles rows 4 and 8, 4 pins per side (DIP-8)
      const pinCols = [0, 1, 2, 3];
      pinCols.forEach(pc => {
        // top-side pins (row 4)
        placements.push({
          id: mkId(),
          type: 'ic',
          value: comp.value,
          ref: `${ref}p${pc + 1}`,
          lead1: { row: 4, col: icCol + pc },
        });
        // bottom-side pins (row 8)
        placements.push({
          id: mkId(),
          type: 'ic',
          value: comp.value,
          ref: `${ref}p${8 - pc}`,
          lead1: { row: 8, col: icCol + pc },
        });
      });
      icCol += 6;
    }
  }

  // ── Passives (R, C, D) ── rows 9 onward, columns 1 onward ────────────────
  const PASS_COL_STEP = 3;
  const PASS_ROW_STEP = 4;
  const PASS_ROW_SPAN = 2;   // leads are 2 rows apart
  const PASS_START_COL = 1;
  const PASS_MAX_COL = 21;
  const PASS_START_ROW = 9;

  let pRow = PASS_START_ROW;
  let pCol = PASS_START_COL;

  const placePassive = (
    type: StripboardComponentType,
    value: string,
    ref: string,
  ) => {
    if (pCol > PASS_MAX_COL) {
      pCol = PASS_START_COL;
      pRow += PASS_ROW_STEP;
    }
    // Clamp to board
    const r1 = Math.min(pRow, 24);
    const r2 = Math.min(pRow + PASS_ROW_SPAN, 25);
    placements.push({
      id: mkId(),
      type,
      value,
      ref,
      lead1: { row: r1, col: pCol },
      lead2: { row: r2, col: pCol },
    });
    pCol += PASS_COL_STEP;
  };

  const orderedTypes: StripboardComponentType[] = ['resistor', 'diode', 'capacitor', 'other'];
  for (const compType of orderedTypes) {
    for (const comp of bomData.components.filter(c => {
      if (compType === 'other') {
        return !['resistor', 'capacitor', 'transistor', 'diode', 'ic', 'op-amp'].includes(c.component_type);
      }
      return c.component_type === compType;
    })) {
      for (let i = 0; i < comp.quantity; i++) {
        const ref = comp.reference_designators[i] ?? comp.reference_designators[0] ?? comp.component_type.toUpperCase()[0];
        placePassive(compType === 'other' ? 'other' : compType, comp.value, ref);
      }
    }
  }

  // ── Track cuts: power rail separations ───────────────────────────────────
  // Cut row 3 at col 0 to separate the V+ rail (row 1) from the component area
  cuts.push(`A3`, `A2`);

  // Add cuts adjacent to each transistor B pin to isolate the strip
  for (const p of placements.filter(c => c.type === 'transistor')) {
    const label = colLabel(p.lead2!.col);
    cuts.push(`${label}3`, `${label}7`);
  }

  return { components: placements, trackCuts: cuts };
}
