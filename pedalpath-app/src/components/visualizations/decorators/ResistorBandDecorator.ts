// ResistorBandDecorator — wires to existing resistor-decoder.ts
// Uses encodeResistor() to get band colors from a resistance value string.
// decodeResistor() takes string[] of color names — not a value string.
// For value → bands, we parse the value to ohms then use encodeResistor().

import { encodeResistor } from '../../../utils/decoders/resistor-decoder';

// IEC 60062 color name → hex
const IEC_HEX: Record<string, string> = {
  black:  '#111111',
  brown:  '#8B4513',
  red:    '#CC0000',
  orange: '#FF8C00',
  yellow: '#FFD700',
  green:  '#228B22',
  blue:   '#0000CC',
  violet: '#8B008B',
  purple: '#8B008B',
  grey:   '#808080',
  gray:   '#808080',
  white:  '#F5F5F5',
  gold:   '#D4A017',
  silver: '#C0C0C0',
  none:   '#8B7355', // fallback tan (bare body color)
};

export interface ResistorBandColors {
  '--pp-band1': string;
  '--pp-band2': string;
  '--pp-band3': string;
  '--pp-band4': string;
}

/**
 * Parse a human-readable resistance value string into ohms.
 * Handles: 10k, 4.7K, 1M, 100R, 470, 2.2k, 1M5, 4k7, etc.
 */
function parseOhms(value: string): number | null {
  if (!value) return null;
  const v = value.trim().toUpperCase().replace(/\s+/g, '');

  // European notation: 4k7 → 4700, 1M5 → 1.5M
  const euroMatch = v.match(/^(\d+)([KMRG])(\d+)$/i);
  if (euroMatch) {
    const [, a, unit, b] = euroMatch;
    const base = parseFloat(`${a}.${b}`);
    return applyMultiplier(base, unit);
  }

  // Standard: 10k, 4.7K, 1M, 100R, 470Ω
  const stdMatch = v.match(/^([\d.]+)\s*([KMRG\u03A9]?)$/i);
  if (stdMatch) {
    const [, num, unit] = stdMatch;
    return applyMultiplier(parseFloat(num), unit || 'R');
  }

  return null;
}

function applyMultiplier(val: number, unit: string): number {
  switch (unit.toUpperCase()) {
    case 'G': return val * 1_000_000_000;
    case 'M': return val * 1_000_000;
    case 'K': return val * 1_000;
    case 'R':
    case '\u03A9':
    case '':  return val;
    default:  return val;
  }
}

export function getResistorBandColors(value: string): ResistorBandColors {
  try {
    const ohms = parseOhms(value);
    if (ohms === null || ohms <= 0) return fallback();

    const encoded = encodeResistor(ohms, 5.0); // 5% tolerance → gold band
    // Prefer 4-band if available, else use first 3 of 5-band + tolerance
    const bands = encoded.bands4 ?? [
      encoded.bands5[0],
      encoded.bands5[1],
      encoded.bands5[2],
      encoded.toleranceColor,
    ];

    const get = (i: number) => IEC_HEX[bands[i]?.toLowerCase() ?? ''] ?? IEC_HEX.none;

    return {
      '--pp-band1': get(0),
      '--pp-band2': get(1),
      '--pp-band3': get(2),
      '--pp-band4': get(3),
    };
  } catch {
    return fallback();
  }
}

function fallback(): ResistorBandColors {
  return {
    '--pp-band1': IEC_HEX.none,
    '--pp-band2': IEC_HEX.none,
    '--pp-band3': IEC_HEX.none,
    '--pp-band4': IEC_HEX.gold,
  };
}
