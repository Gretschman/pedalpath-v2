/**
 * Resistor color-code decoder and encoder for PedalPath v2
 * Ported from Python (resistor_decoder.py)
 *
 * Supports:
 *  - 4-band and 5-band color-code decoding (bands → value)
 *  - Reverse encoding (value → bands) for build guides
 *  - E-series validation (E12, E24, E48, E96)
 *  - Human-friendly formatting with proper Unicode symbols
 *
 * All lookup tables are complete per IEC 60062.
 */

import type { ResistorSpec, ResistorColor, EncodedResistor } from '@/types/component-specs.types';

// ===========================================================================
// Lookup Tables (complete per IEC 60062)
// ===========================================================================

const DIGIT_COLORS: Record<string, number> = {
  black: 0,
  brown: 1,
  red: 2,
  orange: 3,
  yellow: 4,
  green: 5,
  blue: 6,
  violet: 7,
  purple: 7,  // alias
  gray: 8,
  grey: 8,    // alias
  white: 9,
};

// Reverse: digit → canonical color name (no aliases)
const DIGIT_TO_COLOR: Record<number, ResistorColor> = {
  0: 'black',
  1: 'brown',
  2: 'red',
  3: 'orange',
  4: 'yellow',
  5: 'green',
  6: 'blue',
  7: 'violet',
  8: 'gray',
  9: 'white',
};

const MULTIPLIER_COLORS: Record<string, number> = {
  black: 1,
  brown: 10,
  red: 100,
  orange: 1_000,
  yellow: 10_000,
  green: 100_000,
  blue: 1_000_000,
  violet: 10_000_000,
  purple: 10_000_000,   // alias
  gray: 100_000_000,
  grey: 100_000_000,    // alias
  white: 1_000_000_000,
  gold: 0.1,
  silver: 0.01,
};

// Reverse: multiplier value → canonical color name
const MULTIPLIER_TO_COLOR: Record<number, ResistorColor> = {
  1: 'black',
  10: 'brown',
  100: 'red',
  1_000: 'orange',
  10_000: 'yellow',
  100_000: 'green',
  1_000_000: 'blue',
  10_000_000: 'violet',
  100_000_000: 'gray',
  1_000_000_000: 'white',
  0.1: 'gold',
  0.01: 'silver',
};

const TOLERANCE_COLORS: Record<string, number> = {
  brown: 1.0,
  red: 2.0,
  green: 0.5,
  blue: 0.25,
  violet: 0.1,
  purple: 0.1,    // alias
  gray: 0.05,
  grey: 0.05,     // alias
  gold: 5.0,
  silver: 10.0,
};

// Reverse: tolerance percent → canonical color name
export const TOLERANCE_TO_COLOR: Record<number, ResistorColor> = {
  0.05: 'gray',
  0.1: 'violet',
  0.25: 'blue',
  0.5: 'green',
  1.0: 'brown',
  2.0: 'red',
  5.0: 'gold',
  10.0: 'silver',
};

// ===========================================================================
// E-series Standard Values (significands, multiply by decade)
// ===========================================================================

const E12_VALUES: readonly number[] = [
  1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2,
];

const E24_VALUES: readonly number[] = [
  1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0,
  3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1,
];

const E48_VALUES: readonly number[] = [
  1.00, 1.05, 1.10, 1.15, 1.21, 1.27, 1.33, 1.40, 1.47, 1.54,
  1.62, 1.69, 1.78, 1.87, 1.96, 2.05, 2.15, 2.26, 2.37, 2.49,
  2.61, 2.74, 2.87, 3.01, 3.16, 3.32, 3.48, 3.65, 3.83, 4.02,
  4.22, 4.42, 4.64, 4.87, 5.11, 5.36, 5.62, 5.90, 6.19, 6.49,
  6.81, 7.15, 7.50, 7.87, 8.25, 8.66, 9.09, 9.53,
];

const E96_VALUES: readonly number[] = [
  1.00, 1.02, 1.05, 1.07, 1.10, 1.13, 1.15, 1.18, 1.21, 1.24,
  1.27, 1.30, 1.33, 1.37, 1.40, 1.43, 1.47, 1.50, 1.54, 1.58,
  1.62, 1.65, 1.69, 1.74, 1.78, 1.82, 1.87, 1.91, 1.96, 2.00,
  2.05, 2.10, 2.15, 2.21, 2.26, 2.32, 2.37, 2.43, 2.49, 2.55,
  2.61, 2.67, 2.74, 2.80, 2.87, 2.94, 3.01, 3.09, 3.16, 3.24,
  3.32, 3.40, 3.48, 3.57, 3.65, 3.74, 3.83, 3.92, 4.02, 4.12,
  4.22, 4.32, 4.42, 4.53, 4.64, 4.75, 4.87, 4.99, 5.11, 5.23,
  5.36, 5.49, 5.62, 5.76, 5.90, 6.04, 6.19, 6.34, 6.49, 6.65,
  6.81, 6.98, 7.15, 7.32, 7.50, 7.68, 7.87, 8.06, 8.25, 8.45,
  8.66, 8.87, 9.09, 9.31, 9.53, 9.76,
];

const E_SERIES: Record<string, readonly number[]> = {
  E12: E12_VALUES,
  E24: E24_VALUES,
  E48: E48_VALUES,
  E96: E96_VALUES,
};

// ===========================================================================
// Formatting Helpers
// ===========================================================================

/**
 * Format an ohm value with SI prefix and Ω symbol
 */
export function formatOhms(ohms: number): string {
  const units: Array<[number, string]> = [
    [1_000_000_000, 'GΩ'],
    [1_000_000, 'MΩ'],
    [1_000, 'kΩ'],
    [1, 'Ω'],
  ];

  for (const [scale, unit] of units) {
    if (ohms >= scale) {
      const scaled = ohms / scale;
      if (Number.isInteger(scaled)) {
        return `${scaled} ${unit}`;
      }
      return `${scaled.toPrecision(3)} ${unit}`;
    }
  }

  // Sub-ohm values
  if (ohms > 0) {
    return `${ohms.toPrecision(3)} Ω`;
  }
  return '0 Ω';
}

// ===========================================================================
// E-series Validation
// ===========================================================================

/**
 * Check which E-series (if any) contains this value
 *
 * @returns [seriesName, null] if exact match, or [null, nearestE96Value] if no match
 */
export function findESeries(ohms: number): [string | null, number | null] {
  if (ohms <= 0) {
    return [null, null];
  }

  // Normalize to significand in [1.0, 10.0)
  const decade = Math.pow(10, Math.floor(Math.log10(ohms)));
  const significand = ohms / decade;

  // Round to 2 decimal places to handle float imprecision
  const sigRounded = Math.round(significand * 100) / 100;

  // Check each series from most restrictive to least
  for (const seriesName of ['E12', 'E24', 'E48', 'E96']) {
    const seriesValues = E_SERIES[seriesName];
    for (const val of seriesValues) {
      if (Math.abs(Math.round(val * 100) / 100 - sigRounded) < 0.005) {
        return [seriesName, null];
      }
    }
  }

  // No match -- find nearest E96 value
  let bestVal: number | null = null;
  let bestDiff = Infinity;
  for (const val of E96_VALUES) {
    const candidate = val * decade;
    const diff = Math.abs(candidate - ohms);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestVal = candidate;
    }
  }

  return [null, bestVal];
}

// ===========================================================================
// Decoder (bands → value)
// ===========================================================================

/**
 * Decode a resistor value from its color bands
 *
 * @param bands - Color names left-to-right
 *                5-band: [d1, d2, d3, multiplier, tolerance]
 *                4-band: [d1, d2, multiplier, tolerance]
 * @returns ResistorSpec with ohms, tolerance, E-series info, and original bands
 * @throws Error if band count is wrong or a color is unrecognized
 */
export function decodeResistor(bands: string[]): ResistorSpec {
  const normalized = bands.map((b) => b.trim().toLowerCase());

  let ohms: number;
  let tolerance: number | undefined;

  if (normalized.length === 5) {
    const [d1, d2, d3, multBand, tolBand] = normalized;

    if (!(d1 in DIGIT_COLORS) || !(d2 in DIGIT_COLORS) || !(d3 in DIGIT_COLORS)) {
      throw new Error(`Unsupported color for 5-band decoding: ${d1}, ${d2}, or ${d3}`);
    }
    if (!(multBand in MULTIPLIER_COLORS)) {
      throw new Error(`Unsupported multiplier color: ${multBand}`);
    }

    const digits = DIGIT_COLORS[d1] * 100 + DIGIT_COLORS[d2] * 10 + DIGIT_COLORS[d3];
    const multiplier = MULTIPLIER_COLORS[multBand];
    tolerance = TOLERANCE_COLORS[tolBand];
    ohms = digits * multiplier;
  } else if (normalized.length === 4) {
    const [d1, d2, multBand, tolBand] = normalized;

    if (!(d1 in DIGIT_COLORS) || !(d2 in DIGIT_COLORS)) {
      throw new Error(`Unsupported color for 4-band decoding: ${d1} or ${d2}`);
    }
    if (!(multBand in MULTIPLIER_COLORS)) {
      throw new Error(`Unsupported multiplier color: ${multBand}`);
    }

    const digits = DIGIT_COLORS[d1] * 10 + DIGIT_COLORS[d2];
    const multiplier = MULTIPLIER_COLORS[multBand];
    tolerance = TOLERANCE_COLORS[tolBand];
    ohms = digits * multiplier;
  } else {
    throw new Error(`Expected 4 or 5 color bands, got ${normalized.length}.`);
  }

  const [seriesName, nearest] = findESeries(ohms);

  return {
    type: 'resistor',
    value: formatOhms(ohms),
    ohms,
    tolerancePercent: tolerance,
    bands: normalized as ResistorColor[],
    eSeriesMatch: seriesName || undefined,
    nearestStandard: nearest || undefined,
  };
}

// ===========================================================================
// Encoder (value → bands)
// ===========================================================================

/**
 * Encode an ohm value into color bands
 *
 * @param ohms - Resistance in ohms (e.g. 47000 for 47k)
 * @param tolerancePercent - Desired tolerance (default 1% = brown, typical metal film)
 * @returns EncodedResistor with 5-band (always) and 4-band (when possible)
 * @throws Error if the value can't be represented or tolerance is unknown
 */
export function encodeResistor(
  ohms: number,
  tolerancePercent: number = 1.0
): EncodedResistor {
  if (!(tolerancePercent in TOLERANCE_TO_COLOR)) {
    const valid = Object.keys(TOLERANCE_TO_COLOR).sort((a, b) => Number(a) - Number(b));
    throw new Error(
      `Tolerance ${tolerancePercent}% not available. Valid: ${valid.join(', ')}`
    );
  }

  const tolColor = TOLERANCE_TO_COLOR[tolerancePercent];
  const bands5 = encode5Band(ohms, tolColor);
  const bands4 = encode4Band(ohms, tolColor);

  return {
    ohms,
    bands5,
    bands4: bands4 || undefined,
    toleranceColor: tolColor,
    tolerancePercent,
  };
}

/**
 * Encode to 5-band: 3 digit bands + multiplier + tolerance
 */
function encode5Band(ohms: number, tolColor: ResistorColor): ResistorColor[] {
  if (ohms <= 0) {
    throw new Error('Resistance must be positive.');
  }

  // Try each multiplier to find 3-digit significand in [100, 999]
  const sortedMultipliers = Object.keys(MULTIPLIER_TO_COLOR)
    .map(Number)
    .sort((a, b) => b - a);

  for (const multValue of sortedMultipliers) {
    if (multValue <= 0) continue;

    const candidate = ohms / multValue;
    if (candidate >= 99.5 && candidate <= 999.5) {
      const sig = Math.round(candidate);
      if (Math.abs((sig * multValue - ohms) / Math.max(ohms, 1e-12)) < 0.001) {
        const d1 = Math.floor(sig / 100);
        const d2 = Math.floor((sig / 10) % 10);
        const d3 = sig % 10;
        return [
          DIGIT_TO_COLOR[d1],
          DIGIT_TO_COLOR[d2],
          DIGIT_TO_COLOR[d3],
          MULTIPLIER_TO_COLOR[multValue],
          tolColor,
        ];
      }
    }
  }

  // Try gold (0.1) and silver (0.01) multipliers for sub-10 ohm values
  for (const multValue of [0.1, 0.01]) {
    const candidate = ohms / multValue;
    if (candidate >= 99.5 && candidate <= 999.5) {
      const sig = Math.round(candidate);
      if (Math.abs((sig * multValue - ohms) / Math.max(ohms, 1e-12)) < 0.01) {
        const d1 = Math.floor(sig / 100);
        const d2 = Math.floor((sig / 10) % 10);
        const d3 = sig % 10;
        return [
          DIGIT_TO_COLOR[d1],
          DIGIT_TO_COLOR[d2],
          DIGIT_TO_COLOR[d3],
          MULTIPLIER_TO_COLOR[multValue],
          tolColor,
        ];
      }
    }
  }

  throw new Error(`Cannot represent ${ohms} Ω as a 5-band resistor.`);
}

/**
 * Encode to 4-band: 2 digit bands + multiplier + tolerance
 * Returns null if the value needs 3 significant digits
 */
function encode4Band(ohms: number, tolColor: ResistorColor): ResistorColor[] | null {
  const sortedMultipliers = Object.keys(MULTIPLIER_TO_COLOR)
    .map(Number)
    .sort((a, b) => b - a);

  for (const multValue of sortedMultipliers) {
    if (multValue <= 0) continue;

    const candidate = ohms / multValue;
    if (candidate >= 9.5 && candidate <= 99.5) {
      const sig = Math.round(candidate);
      if (Math.abs((sig * multValue - ohms) / Math.max(ohms, 1e-12)) < 0.001) {
        const d1 = Math.floor(sig / 10);
        const d2 = sig % 10;
        return [
          DIGIT_TO_COLOR[d1],
          DIGIT_TO_COLOR[d2],
          MULTIPLIER_TO_COLOR[multValue],
          tolColor,
        ];
      }
    }
  }

  // Try fractional multipliers
  for (const multValue of [0.1, 0.01]) {
    const candidate = ohms / multValue;
    if (candidate >= 9.5 && candidate <= 99.5) {
      const sig = Math.round(candidate);
      if (Math.abs((sig * multValue - ohms) / Math.max(ohms, 1e-12)) < 0.01) {
        const d1 = Math.floor(sig / 10);
        const d2 = sig % 10;
        return [
          DIGIT_TO_COLOR[d1],
          DIGIT_TO_COLOR[d2],
          MULTIPLIER_TO_COLOR[multValue],
          tolColor,
        ];
      }
    }
  }

  return null;
}
