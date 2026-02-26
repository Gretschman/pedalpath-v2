/**
 * Breadboard utility functions
 *
 * Provides coordinate calculations, hole validation, and connection mapping
 * for breadboard visualization components.
 */

// Layout configurations for different breadboard sizes
export interface BreadboardLayout {
  columns: number;
  rowsPerSection: number;
  sections: number;
  holeSpacing: number;
  centerGap: number;
  /** Number of holes per power rail (Matrix-5 layout, not equal to columns) */
  powerRailHoles: number;
  powerRailY: {
    topPositive: number;
    topGround: number;
    bottomGround: number;
    bottomPositive: number;
  };
  terminalStripStart: {
    x: number;
    y: number;
  };
  totalWidth: number;
  totalHeight: number;
}

// MB102 830-point breadboard — exact mechanical specification
// Scale: 24px = 2.54mm → 9.449 px/mm
// Physical board: 165.1mm × 54.6mm
// Canvas: 1600 × 616px (board 1560×516 + 20px side margins + 80px top / 20px bottom)
//
// GROUND TRUTH (board_models.py):
//   A1 origin:  x=7.62mm (3 pitches), y=11.43mm (4.5 pitches) from board top-left
//   Trough:     7.62mm center-to-center from Row E to Row F
//               Extra gap = TROUGH − PITCH = 7.62 − 2.54 = 5.08mm (2 pitches) added for rows F-J
//   Top rail +: 3.81mm (1.5 pitches) from board top → canvas y = 80 + 36 = 116
//   Top rail −: 6.35mm (2.5 pitches) from board top → canvas y = 80 + 60 = 140
//   Bot rail −: 48.26mm (19 pitches)               → canvas y = 80 + 456 = 536
//   Bot rail +: 50.80mm (20 pitches)               → canvas y = 80 + 480 = 560
//
// POWER RAILS — Matrix-5 grouping:
//   50 holes per rail, in groups of 5 with 2.54mm gap between groups + 5.08mm center break
//   Rail start x: A1_x + 1.27mm (half-pitch offset) = 8.89mm → canvas x = 20 + 84 = 104
//   For hole i (0-based): x = 104 + i×24 + floor(i/5)×24 + (i≥25 ? 48 : 0)
//
// Physical MB102 rail ordering: outer (+) rail closer to board edge, inner (−) closer to strip.
export const LAYOUT_830: BreadboardLayout = {
  columns: 63,
  rowsPerSection: 5,
  sections: 2,
  holeSpacing: 24,      // 2.54mm × 9.449 = 24px (exact integer)
  centerGap: 48,        // 5.08mm = TROUGH(7.62) − PITCH(2.54) = extra gap for rows F-J
  powerRailHoles: 50,   // Matrix-5: 25 per half + 5.08mm center break
  powerRailY: {
    topPositive: 116,   // outer (+) rail — 3.81mm from board top edge
    topGround:   140,   // inner (−) rail — 6.35mm from board top edge
    bottomGround:   536, // inner (−) rail — 48.26mm from board top (19 pitches)
    bottomPositive: 560, // outer (+) rail — 50.80mm from board top (20 pitches)
  },
  terminalStripStart: {
    x: 92,   // col 1 center — 7.62mm (3 pitches) from board left + 20px canvas margin
    y: 188,  // row A center — 11.43mm (4.5 pitches) from board top + 80px canvas margin
  },
  totalWidth:  1600, // 165.1mm → 1560px + 40px canvas margin (20 each side)
  totalHeight: 616,  // 54.6mm  → 516px  + 100px canvas margin (80 top / 20 bottom)
};

export const LAYOUT_400: BreadboardLayout = {
  ...LAYOUT_830,
  columns: 30,
  totalWidth: 800,     // col 1 (92) → col 30 (92+29×24=788) + 12px right canvas margin
  powerRailHoles: 25,  // First half of Matrix-5 layout (no center break)
};

export const ROW_NAMES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'] as const;

export type RowName = typeof ROW_NAMES[number];

/**
 * Converts hole ID to SVG coordinates
 *
 * @param holeId - Hole identifier (e.g., "a15", "+10", "-32")
 * @param config - Breadboard layout configuration
 * @returns SVG coordinates { x, y }
 *
 * @example
 * holeToCoordinates('a15', LAYOUT_830) // → { x: 407.6, y: 100 }
 * holeToCoordinates('+10', LAYOUT_830) // → { x: 278.6, y: 30 }
 */
export function holeToCoordinates(
  holeId: string,
  config: BreadboardLayout
): { x: number; y: number } {
  // Power rail holes: "+1", "-15", "positive-10", "ground-32", etc.
  if (holeId.startsWith('+') || holeId.startsWith('-') ||
      holeId.startsWith('positive') || holeId.startsWith('ground')) {
    const isPositive = holeId.startsWith('+') || holeId.startsWith('positive');

    // Extract hole number (1-based)
    let col: number;
    if (holeId.startsWith('+') || holeId.startsWith('-')) {
      col = parseInt(holeId.substring(1));
    } else {
      col = parseInt(holeId.split('-')[1]);
    }

    // Matrix-5 x formula: groups of 5 + 2.54mm gap + 5.08mm center break at hole 26
    // Rail start = terminalStripStart.x + 1.27mm×scale = 92 + 12 = 104px
    const i = col - 1;  // 0-based
    const railStartX = config.terminalStripStart.x + Math.round(1.27 * (config.holeSpacing / 2.54));
    const groupGap = Math.floor(i / 5) * config.holeSpacing;
    const centerBreak = i >= 25 ? Math.round(5.08 * (config.holeSpacing / 2.54)) : 0;
    const x = railStartX + i * config.holeSpacing + groupGap + centerBreak;

    const y = isPositive
      ? config.powerRailY.topPositive
      : config.powerRailY.topGround;

    return { x, y };
  }

  // Terminal strip holes: "a15", "f32", etc.
  const row = holeId[0] as RowName;
  const col = parseInt(holeId.substring(1));

  const rowIdx = ROW_NAMES.indexOf(row);
  const x = config.terminalStripStart.x + (col - 1) * config.holeSpacing;
  let y = config.terminalStripStart.y + rowIdx * config.holeSpacing;

  // Add center gap for rows f-j
  if (rowIdx >= 5) {
    y += config.centerGap;
  }

  return { x, y };
}

/**
 * Validates hole ID format
 *
 * @param holeId - Hole identifier to validate
 * @param size - Breadboard size ('830' or '400')
 * @returns true if valid, false otherwise
 *
 * @example
 * isValidHoleId('a15', '830')  // → true
 * isValidHoleId('k15', '830')  // → false (no 'k' row)
 * isValidHoleId('a64', '830')  // → false (max 63 columns)
 * isValidHoleId('+10', '830')  // → true
 */
export function isValidHoleId(holeId: string, size: '830' | '400'): boolean {
  const maxCol = size === '830' ? 63 : 30;
  const maxRailHoles = size === '830' ? 50 : 25;

  // Power rails: +N or -N format
  if (/^[+-]\d+$/.test(holeId)) {
    const col = parseInt(holeId.substring(1));
    return col >= 1 && col <= maxRailHoles;
  }

  // Power rails: positive-N or ground-N format
  if (/^(positive|ground)-\d+$/.test(holeId)) {
    const col = parseInt(holeId.split('-')[1]);
    return col >= 1 && col <= maxRailHoles;
  }

  // Terminal strip: {letter}{number} format
  const match = holeId.match(/^([a-j])(\d+)$/);
  if (!match) return false;

  const [, row, colStr] = match;
  const col = parseInt(colStr);

  return (
    ROW_NAMES.includes(row as RowName) &&
    col >= 1 &&
    col <= maxCol
  );
}

/**
 * Get all holes connected to a given hole
 *
 * Breadboards connect:
 * - Rows a-e in same column
 * - Rows f-j in same column
 * - All power rail holes in same rail
 *
 * @param holeId - Starting hole ID
 * @param size - Breadboard size
 * @returns Array of connected hole IDs (including the input hole)
 *
 * @example
 * getConnectedHoles('a15', '830')  // → ['a15', 'b15', 'c15', 'd15', 'e15']
 * getConnectedHoles('f15', '830')  // → ['f15', 'g15', 'h15', 'i15', 'j15']
 * getConnectedHoles('+10', '830')  // → ['+1', '+2', ..., '+63']
 */
export function getConnectedHoles(holeId: string, size: '830' | '400'): string[] {
  const maxRailHoles = size === '830' ? 50 : 25;

  // Power rails: all holes in same rail connected (Matrix-5, 50 holes for 830)
  if (holeId.startsWith('+') || holeId.startsWith('positive')) {
    return Array.from({ length: maxRailHoles }, (_, i) => `+${i + 1}`);
  }

  if (holeId.startsWith('-') || holeId.startsWith('ground')) {
    return Array.from({ length: maxRailHoles }, (_, i) => `-${i + 1}`);
  }

  // Terminal strip: 5 holes in same column connected
  const row = holeId[0] as RowName;
  const col = holeId.substring(1);

  // Rows a-e connected, rows f-j connected
  const leftGroup: readonly RowName[] = ['a', 'b', 'c', 'd', 'e'];
  const rightGroup: readonly RowName[] = ['f', 'g', 'h', 'i', 'j'];
  const rowGroup: readonly RowName[] = leftGroup.includes(row)
    ? leftGroup
    : rightGroup;

  return rowGroup.map(r => `${r}${col}`);
}

/**
 * Parse hole ID into components
 *
 * @param holeId - Hole identifier
 * @returns Parsed components or null if invalid
 *
 * @example
 * parseHoleId('a15')  // → { type: 'terminal', row: 'a', column: 15 }
 * parseHoleId('+10')  // → { type: 'power', rail: 'positive', column: 10 }
 */
export function parseHoleId(holeId: string):
  | { type: 'terminal'; row: RowName; column: number }
  | { type: 'power'; rail: 'positive' | 'ground'; column: number }
  | null {

  // Power rails
  if (holeId.startsWith('+')) {
    return { type: 'power', rail: 'positive', column: parseInt(holeId.substring(1)) };
  }
  if (holeId.startsWith('-')) {
    return { type: 'power', rail: 'ground', column: parseInt(holeId.substring(1)) };
  }
  if (holeId.startsWith('positive-')) {
    return { type: 'power', rail: 'positive', column: parseInt(holeId.split('-')[1]) };
  }
  if (holeId.startsWith('ground-')) {
    return { type: 'power', rail: 'ground', column: parseInt(holeId.split('-')[1]) };
  }

  // Terminal strip
  const match = holeId.match(/^([a-j])(\d+)$/);
  if (match) {
    const [, row, colStr] = match;
    return { type: 'terminal', row: row as RowName, column: parseInt(colStr) };
  }

  return null;
}

/**
 * Get the layout configuration for a breadboard size
 *
 * @param size - Breadboard size
 * @returns Layout configuration
 */
export function getLayout(size: '830' | '400'): BreadboardLayout {
  return size === '830' ? LAYOUT_830 : LAYOUT_400;
}
