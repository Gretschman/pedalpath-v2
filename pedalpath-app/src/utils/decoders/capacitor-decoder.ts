/**
 * Capacitor marking decoder and encoder for PedalPath v2
 * Ported from Python (capacitor_decoder.py)
 *
 * Supports:
 *  - Box film capacitor codes: EIA 3-digit (473), alphanumeric (47nK100)
 *  - Ceramic disc codes: EIA 3-digit (104, 222)
 *  - Electrolytic markings: direct value + voltage (47uF 25V)
 *  - Tantalum markings: direct value + voltage
 *  - Bidirectional: decode (marking → value) and encode (value → marking)
 *  - Unit conversion: always provides pF, nF, µF
 *  - Tolerance and voltage parsing
 */

import type { CapacitorSpec, CapUnit, EncodedCapacitor } from '@/types/component-specs.types';
import { CapType } from '@/types/component-specs.types';

// ===========================================================================
// Lookup Tables
// ===========================================================================

// Tolerance letter codes (IEC / EIA standard)
const TOLERANCE_CODES: Record<string, number> = {
  B: 0.1,    // ±0.1pF (only for very small values)
  C: 0.25,   // ±0.25pF
  D: 0.5,    // ±0.5pF
  F: 1.0,    // ±1%
  G: 2.0,    // ±2%
  J: 5.0,    // ±5%
  K: 10.0,   // ±10%
  M: 20.0,   // ±20%
  Z: -20.0,  // +80/-20% (special, used on some electrolytics)
};

// Reverse: tolerance percent → letter (common ones only)
const TOLERANCE_TO_LETTER: Record<number, string> = {
  1.0: 'F',
  2.0: 'G',
  5.0: 'J',
  10.0: 'K',
  20.0: 'M',
};

// IEC 60062 voltage codes (letter + digit)
// Common on smaller film/ceramic caps where space is tight
const VOLTAGE_CODES: Record<string, number> = {
  '0G': 4,    '0L': 5,    '0J': 6,    '1A': 10,   '1B': 12,
  '1C': 16,   '1E': 25,   '1H': 50,   '1J': 63,   '1K': 80,
  '2A': 100,  '2B': 125,  '2C': 160,  '2D': 200,  '2E': 250,
  '2F': 315,  '2G': 400,  '2H': 500,  '2J': 630,  '2K': 800,
  '3A': 1000, '3B': 1250, '3C': 1600, '3D': 2000, '3E': 2500,
};

// Reverse: voltage → common code
const VOLTAGE_TO_CODE: Record<number, string> = Object.fromEntries(
  Object.entries(VOLTAGE_CODES).map(([k, v]) => [v, k])
);

// Unit multipliers relative to picofarads
const UNIT_TO_PF: Record<string, number> = {
  pf: 1.0,
  p: 1.0,
  nf: 1_000.0,
  n: 1_000.0,
  uf: 1_000_000.0,
  u: 1_000_000.0,
  µf: 1_000_000.0,   // micro sign
  µ: 1_000_000.0,
  mf: 1_000_000.0,   // old notation, sometimes seen
};

// Standard capacitor values in the E12 series (significands)
const E12_CAP_VALUES: readonly number[] = [
  1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2,
];

// Common film cap voltages
const COMMON_VOLTAGES: readonly number[] = [
  25, 50, 63, 100, 160, 200, 250, 400, 500, 630, 1000,
];

// ===========================================================================
// Formatting Helpers
// ===========================================================================

/**
 * Format a numeric value cleanly (no trailing zeros, reasonable precision)
 */
function formatValue(val: number): string {
  if (val === 0) return '0';

  if (val >= 1000) {
    return Number.isInteger(val) ? `${val}` : val.toFixed(1);
  }

  if (val >= 1) {
    return Number.isInteger(val) ? `${val}` : val.toPrecision(3);
  }

  // Sub-1 values
  return val.toPrecision(4);
}

/**
 * Format capacitance in the most natural unit
 */
export function formatCapacitance(cap: CapUnit): string {
  if (cap.uf >= 1.0) {
    return `${formatValue(cap.uf)} µF`;
  }
  if (cap.nf >= 1.0) {
    return `${formatValue(cap.nf)} nF`;
  }
  return `${formatValue(cap.pf)} pF`;
}

// ===========================================================================
// Unit Conversion
// ===========================================================================

/**
 * Convert picofarads to all three units
 */
export function pfToUnits(pf: number): CapUnit {
  return {
    pf,
    nf: pf / 1_000,
    uf: pf / 1_000_000,
  };
}

/**
 * Convert nanofarads to all three units
 */
export function nfToUnits(nf: number): CapUnit {
  return pfToUnits(nf * 1_000);
}

/**
 * Convert microfarads to all three units
 */
export function ufToUnits(uf: number): CapUnit {
  return pfToUnits(uf * 1_000_000);
}

// ===========================================================================
// Decoder (marking → value)
// ===========================================================================

// Regex patterns for different marking styles

// Pattern 1: EIA 3-digit code with optional tolerance + voltage
// Examples: 473, 223K, 473J250, 104, 222K100
const RE_EIA = /^(\d{2})(\d)(?:([A-MZ]))?(?:(\d{2,4}))?$/i;

// Pattern 2: Alphanumeric with explicit unit
// Examples: 47n, 47nK100, 0.047uF, 4.7n, 100p, 47nK, 0.047uF K 100
const RE_ALPHA = /^(\d+\.?\d*)\s*([pnuµ]f?)\s*([A-MZ])?\s*(\d{2,4})?$/i;

// Pattern 2b: R-notation where unit letter replaces decimal point
// Examples: 4n7, 2u2, 4p7, 1n5K100
const RE_RDECIMAL = /^(\d+)([pnuµ])(\d+)\s*([A-MZ])?\s*(\d{2,4})?$/i;

// Pattern 3: Direct electrolytic/tantalum style
// Examples: 47uF 25V, 100uF/16V, 10u 50V, 220uF 35V
const RE_ELECTROLYTIC = /^(\d+\.?\d*)\s*([uµ]f?)\s*[/,]?\s*(\d{1,4})\s*[vV]$/i;

/**
 * Decode a capacitor marking string
 *
 * Handles:
 *  - EIA 3-digit codes: '473', '223K100', '104'
 *  - Alphanumeric: '47n', '47nK100', '0.047uF K 100'
 *  - R-decimal notation: '4n7', '2u2', '1n5K100'
 *  - Electrolytic: '47uF 25V', '100uF/16V'
 *
 * @param marking - The text printed on the capacitor
 * @returns CapacitorSpec with capacitance in all units, tolerance, voltage
 * @throws Error if the marking cannot be parsed
 */
export function decodeCapacitor(marking: string): CapacitorSpec {
  const cleaned = marking.trim();
  if (!cleaned) {
    throw new Error('Empty marking string.');
  }

  // Try electrolytic pattern first (has mandatory V suffix, most specific)
  let result = tryElectrolytic(cleaned);
  if (result) return result;

  // Try R-decimal notation (4n7, 2u2) — before alpha since it's more specific
  result = tryRDecimal(cleaned);
  if (result) return result;

  // Try alphanumeric pattern (has explicit unit letter)
  result = tryAlpha(cleaned);
  if (result) return result;

  // Try EIA 3-digit pattern (most ambiguous, try last)
  result = tryEIA(cleaned);
  if (result) return result;

  throw new Error(
    `Unable to decode "${cleaned}" - no matching capacitor code pattern found.`
  );
}

/**
 * Attempt EIA 3-digit decode
 */
function tryEIA(marking: string): CapacitorSpec | null {
  const match = RE_EIA.exec(marking);
  if (!match) return null;

  const [, sigStr, multDigit, tolLetter, voltageStr] = match;
  const significand = parseInt(sigStr, 10);
  const multiplier = parseInt(multDigit, 10);

  // Special case: multiplier digit 8 = 0.01, digit 9 = 0.1 (for sub-pF, rare)
  let pf: number;
  if (multiplier === 8) {
    pf = significand * 0.01;
  } else if (multiplier === 9) {
    pf = significand * 0.1;
  } else {
    pf = significand * Math.pow(10, multiplier);
  }

  let tolPct: number | undefined;
  let tolLetterUpper: string | undefined;
  if (tolLetter) {
    tolLetterUpper = tolLetter.toUpperCase();
    tolPct = TOLERANCE_CODES[tolLetterUpper];
  }

  const voltage = voltageStr ? parseInt(voltageStr, 10) : undefined;

  // Guess cap type from value range
  const capType = guessTypeFromPF(pf, voltage);

  return {
    type: 'capacitor',
    value: formatCapacitance(pfToUnits(pf)),
    capacitance: pfToUnits(pf),
    capType,
    polarized: capType === CapType.Electrolytic || capType === CapType.Tantalum,
    tolerancePercent: tolPct,
    toleranceLetter: tolPct !== undefined ? tolLetterUpper : undefined,
    voltageMax: voltage,
    sourceCode: marking,
    confidence: 1.0,
  };
}

/**
 * Attempt alphanumeric decode with explicit unit
 */
function tryAlpha(marking: string): CapacitorSpec | null {
  const match = RE_ALPHA.exec(marking);
  if (!match) return null;

  const [, valueStr, unitStr, tolLetter, voltageStr] = match;
  const value = parseFloat(valueStr);

  // Normalize unit key
  const unitLower = unitStr.toLowerCase();
  let multiplier: number | undefined;

  if (unitLower in UNIT_TO_PF) {
    multiplier = UNIT_TO_PF[unitLower];
  } else if (unitLower + 'f' in UNIT_TO_PF) {
    multiplier = UNIT_TO_PF[unitLower + 'f'];
  }

  if (multiplier === undefined) return null;

  const pf = value * multiplier;

  let tolPct: number | undefined;
  let tolLetterUpper: string | undefined;
  if (tolLetter) {
    tolLetterUpper = tolLetter.toUpperCase();
    tolPct = TOLERANCE_CODES[tolLetterUpper];
  }

  const voltage = voltageStr ? parseInt(voltageStr, 10) : undefined;
  const capType = guessTypeFromPF(pf, voltage);

  return {
    type: 'capacitor',
    value: formatCapacitance(pfToUnits(pf)),
    capacitance: pfToUnits(pf),
    capType,
    polarized: capType === CapType.Electrolytic || capType === CapType.Tantalum,
    tolerancePercent: tolPct,
    toleranceLetter: tolPct !== undefined ? tolLetterUpper : undefined,
    voltageMax: voltage,
    sourceCode: marking,
    confidence: 1.0,
  };
}

/**
 * Attempt R-decimal notation decode (4n7, 2u2, 1n5K100)
 */
function tryRDecimal(marking: string): CapacitorSpec | null {
  const match = RE_RDECIMAL.exec(marking);
  if (!match) return null;

  const [, intPart, unitChar, fracPart, tolLetter, voltageStr] = match;

  // Reconstruct the decimal value: "4" + "." + "7" = 4.7
  const value = parseFloat(`${intPart}.${fracPart}`);

  const unitLower = unitChar.toLowerCase();
  let multiplier: number | undefined;

  if (unitLower in UNIT_TO_PF) {
    multiplier = UNIT_TO_PF[unitLower];
  } else if (unitLower + 'f' in UNIT_TO_PF) {
    multiplier = UNIT_TO_PF[unitLower + 'f'];
  }

  if (multiplier === undefined) return null;

  const pf = value * multiplier;

  let tolPct: number | undefined;
  let tolLetterUpper: string | undefined;
  if (tolLetter) {
    tolLetterUpper = tolLetter.toUpperCase();
    tolPct = TOLERANCE_CODES[tolLetterUpper];
  }

  const voltage = voltageStr ? parseInt(voltageStr, 10) : undefined;
  const capType = guessTypeFromPF(pf, voltage);

  return {
    type: 'capacitor',
    value: formatCapacitance(pfToUnits(pf)),
    capacitance: pfToUnits(pf),
    capType,
    polarized: capType === CapType.Electrolytic || capType === CapType.Tantalum,
    tolerancePercent: tolPct,
    toleranceLetter: tolPct !== undefined ? tolLetterUpper : undefined,
    voltageMax: voltage,
    sourceCode: marking,
    confidence: 1.0,
  };
}

/**
 * Attempt electrolytic/tantalum decode
 */
function tryElectrolytic(marking: string): CapacitorSpec | null {
  const match = RE_ELECTROLYTIC.exec(marking);
  if (!match) return null;

  const [, valueStr, unitStr, voltageStr] = match;
  const value = parseFloat(valueStr);

  const unitLower = unitStr.toLowerCase();
  let multiplier: number | undefined;

  if (unitLower in UNIT_TO_PF) {
    multiplier = UNIT_TO_PF[unitLower];
  } else if (unitLower + 'f' in UNIT_TO_PF) {
    multiplier = UNIT_TO_PF[unitLower + 'f'];
  }

  if (multiplier === undefined) return null;

  const pf = value * multiplier;
  const voltage = parseInt(voltageStr, 10);

  // Electrolytics are typically 20% tolerance
  return {
    type: 'capacitor',
    value: formatCapacitance(pfToUnits(pf)),
    capacitance: pfToUnits(pf),
    capType: CapType.Electrolytic,
    polarized: true,
    tolerancePercent: 20.0,
    toleranceLetter: 'M',
    voltageMax: voltage,
    sourceCode: marking,
    confidence: 0.95,
  };
}

/**
 * Heuristic guess at capacitor type based on value and voltage
 */
function guessTypeFromPF(pf: number, voltage?: number): CapType {
  const uf = pf / 1_000_000;

  // Very large values (>1uF) are almost always electrolytic
  if (uf >= 1.0) {
    return CapType.Electrolytic;
  }

  // Sub-1nF values (< 1000pF) are often ceramic
  if (pf < 1_000) {
    return CapType.Ceramic;
  }

  // Film caps are common from 1nF to 1uF
  // Higher voltages strongly suggest film
  if (voltage && voltage >= 50) {
    return CapType.FilmBox;
  }

  // 1nF to 1uF range defaults to film (most common in pedals)
  if (pf >= 1_000 && pf <= 1_000_000) {
    return CapType.FilmBox;
  }

  return CapType.Unknown;
}

// ===========================================================================
// Encoder (value → markings)
// ===========================================================================

/**
 * Encode a capacitance value into standard marking strings
 *
 * Provide exactly one of pf, nf, or uf.
 *
 * @param options - Encoding options
 * @param options.pf - Value in picofarads
 * @param options.nf - Value in nanofarads
 * @param options.uf - Value in microfarads
 * @param options.tolerancePercent - Desired tolerance (default 10% = K)
 * @param options.voltage - Max voltage rating (e.g. 100, 250)
 * @returns EncodedCapacitor with EIA 3-digit code, alphanumeric code, and full codes
 * @throws Error if input is ambiguous or can't be encoded
 */
export function encodeCapacitor(options: {
  pf?: number;
  nf?: number;
  uf?: number;
  tolerancePercent?: number;
  voltage?: number;
}): EncodedCapacitor {
  const { pf, nf, uf, tolerancePercent = 10.0, voltage } = options;

  // Resolve to picofarads
  const provided = [pf, nf, uf].filter(x => x !== undefined).length;
  if (provided !== 1) {
    throw new Error('Provide exactly one of pf, nf, or uf.');
  }

  let pfVal: number;
  if (pf !== undefined) {
    pfVal = pf;
  } else if (nf !== undefined) {
    pfVal = nf * 1_000;
  } else {
    pfVal = uf! * 1_000_000;
  }

  if (pfVal <= 0) {
    throw new Error('Capacitance must be positive.');
  }

  const units = pfToUnits(pfVal);

  // Tolerance letter
  const tolLetter = TOLERANCE_TO_LETTER[tolerancePercent];
  if (!tolLetter) {
    const valid = Object.keys(TOLERANCE_TO_LETTER).sort((a, b) => Number(a) - Number(b));
    throw new Error(
      `Tolerance ${tolerancePercent}% has no standard letter code. Valid: ${valid.join(', ')}`
    );
  }

  // Generate EIA 3-digit code
  const eiaCode = encodeEIA(pfVal);

  // Generate alphanumeric code
  const alphaCode = encodeAlpha(pfVal);

  // Full codes with tolerance and voltage
  const voltageStr = voltage ? String(voltage) : '';
  const fullFilmCode = `${eiaCode}${tolLetter}${voltageStr}`;
  const fullAlphaCode = `${alphaCode}${tolLetter}${voltageStr}`;

  return {
    capacitance: units,
    eiaCode,
    alphaCode,
    fullFilmCode,
    fullAlphaCode,
    toleranceLetter: tolLetter,
    voltage,
  };
}

/**
 * Generate EIA 3-digit code from picofarads
 *
 * The code is: 2 significand digits + 1 multiplier digit (power of 10).
 * Example: 47000 pF → 473 (47 * 10^3)
 */
function encodeEIA(pf: number): string {
  if (pf <= 0) {
    throw new Error('Capacitance must be positive.');
  }

  // Handle sub-10 pF values (multiplier digits 8 and 9)
  if (pf < 10) {
    const sig = Math.round(pf);
    if (sig >= 10) {
      return `${sig}0`;  // e.g., 10pF = 100
    }
    if (sig > 0) {
      return `${sig.toString().padStart(2, '0')}0`;  // e.g., 4pF = "040" — non-standard
    }
    throw new Error(`Cannot represent ${pf} pF as EIA 3-digit code.`);
  }

  // Find the multiplier: pf = significand * 10^multiplier
  // significand must be 10-99 (two digits)
  for (let mult = 0; mult < 10; mult++) {
    const divisor = Math.pow(10, mult);
    const sig = pf / divisor;
    if (sig >= 9.95 && sig <= 99.5) {
      const sigInt = Math.round(sig);
      // Verify round-trip
      if (Math.abs(sigInt * divisor - pf) / pf < 0.001) {
        return `${sigInt}${mult}`;
      }
    }
  }

  throw new Error(`Cannot represent ${pf} pF as EIA 3-digit code.`);
}

/**
 * Generate alphanumeric code from picofarads
 *
 * Uses the most natural unit (p, n, or u).
 * Examples: 47000 pF → '47n', 4700 pF → '4n7', 100 pF → '100p'
 */
function encodeAlpha(pf: number): string {
  const uf = pf / 1_000_000;
  const nf = pf / 1_000;

  // Use uF for values >= 0.1 uF
  if (uf >= 0.1) {
    return alphaFormat(uf, 'u');
  }

  // Use nF for values >= 0.1 nF
  if (nf >= 0.1) {
    return alphaFormat(nf, 'n');
  }

  // Use pF
  return alphaFormat(pf, 'p');
}

/**
 * Format a value with unit letter, using R-style decimal notation
 *
 * Examples: 47.0 → '47n', 4.7 → '4n7', 0.47 → '0u47'
 */
function alphaFormat(value: number, unit: string): string {
  if (Number.isInteger(value)) {
    return `${value}${unit}`;
  }

  // Check if it's a clean single-decimal value like 4.7
  const intPart = Math.floor(value);
  const fracPart = value - intPart;
  const fracStr = fracPart.toPrecision(3).replace(/^0\./, '').replace(/0+$/, '');

  if (intPart > 0) {
    return `${intPart}${unit}${fracStr}`;
  } else {
    return `0${unit}${fracStr}`;
  }
}

// ===========================================================================
// Convenience: decode with type hint
// ===========================================================================

/**
 * Decode a marking with an optional type override
 *
 * If capType is provided, it overrides the heuristic guess.
 * Useful when the user knows they're looking at a ceramic vs film cap.
 */
export function decodeWithType(
  marking: string,
  capType?: CapType
): CapacitorSpec {
  const result = decodeCapacitor(marking);

  if (capType !== undefined) {
    return {
      ...result,
      capType,
      polarized: capType === CapType.Electrolytic || capType === CapType.Tantalum,
    };
  }

  return result;
}
