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

export const LAYOUT_830: BreadboardLayout = {
  columns: 63,
  rowsPerSection: 5,
  sections: 2,
  holeSpacing: 24,
  centerGap: 48,
  powerRailY: {
    topGround: 126,      // blue (−) rail, outer (closer to board edge)
    topPositive: 190,    // red (+) rail, inner (closer to terminal strip)
    bottomPositive: 552, // red (+) rail, inner (just below row j)
    bottomGround: 616,   // blue (−) rail, outer (outside photo crop, not visible)
  },
  terminalStripStart: {
    x: 103,
    y: 239,
  },
  totalWidth: 1700,
  totalHeight: 566,
};

export const LAYOUT_400: BreadboardLayout = {
  ...LAYOUT_830,
  columns: 30,
  totalWidth: 850,
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

    // Extract column number
    let col: number;
    if (holeId.startsWith('+') || holeId.startsWith('-')) {
      col = parseInt(holeId.substring(1));
    } else {
      col = parseInt(holeId.split('-')[1]);
    }

    const x = config.terminalStripStart.x + (col - 1) * config.holeSpacing;
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

  // Power rails: +N or -N format
  if (/^[+-]\d+$/.test(holeId)) {
    const col = parseInt(holeId.substring(1));
    return col >= 1 && col <= maxCol;
  }

  // Power rails: positive-N or ground-N format
  if (/^(positive|ground)-\d+$/.test(holeId)) {
    const col = parseInt(holeId.split('-')[1]);
    return col >= 1 && col <= maxCol;
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
  const maxCol = size === '830' ? 63 : 30;

  // Power rails: all holes in same rail connected
  if (holeId.startsWith('+') || holeId.startsWith('positive')) {
    return Array.from({ length: maxCol }, (_, i) => `+${i + 1}`);
  }

  if (holeId.startsWith('-') || holeId.startsWith('ground')) {
    return Array.from({ length: maxCol }, (_, i) => `-${i + 1}`);
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
