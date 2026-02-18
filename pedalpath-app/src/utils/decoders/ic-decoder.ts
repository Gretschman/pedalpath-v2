/**
 * IC (Integrated Circuit) decoder for PedalPath v2
 *
 * Provides part number lookup for common guitar pedal ICs.
 * Returns full ICSpec with pin count, pinout, and description.
 */

import type { ICSpec } from '@/types/component-specs.types';

// ============================================================================
// IC Database
// ============================================================================

interface ICData {
  pinCount: 8 | 14 | 16;
  description: string;
  manufacturer: string;
  pinout: Array<{ number: number; name: string; description: string }>;
}

const IC_DATABASE: Record<string, ICData> = {
  // ── Dual Op-Amps (8-pin) ──────────────────────────────────────────────────
  'TL072': {
    pinCount: 8,
    description: 'Dual JFET-Input Operational Amplifier',
    manufacturer: 'Texas Instruments',
    pinout: [
      { number: 1, name: 'OUT A',  description: 'Op-amp A output' },
      { number: 2, name: 'IN−A',   description: 'Op-amp A inverting input' },
      { number: 3, name: 'IN+A',   description: 'Op-amp A non-inverting input' },
      { number: 4, name: 'V−',     description: 'Negative power supply' },
      { number: 5, name: 'IN+B',   description: 'Op-amp B non-inverting input' },
      { number: 6, name: 'IN−B',   description: 'Op-amp B inverting input' },
      { number: 7, name: 'OUT B',  description: 'Op-amp B output' },
      { number: 8, name: 'V+',     description: 'Positive power supply' },
    ],
  },
  'TL062': {
    pinCount: 8,
    description: 'Low-Power Dual JFET-Input Op-Amp',
    manufacturer: 'Texas Instruments',
    pinout: [
      { number: 1, name: 'OUT A',  description: 'Op-amp A output' },
      { number: 2, name: 'IN−A',   description: 'Op-amp A inverting input' },
      { number: 3, name: 'IN+A',   description: 'Op-amp A non-inverting input' },
      { number: 4, name: 'V−',     description: 'Negative power supply' },
      { number: 5, name: 'IN+B',   description: 'Op-amp B non-inverting input' },
      { number: 6, name: 'IN−B',   description: 'Op-amp B inverting input' },
      { number: 7, name: 'OUT B',  description: 'Op-amp B output' },
      { number: 8, name: 'V+',     description: 'Positive power supply' },
    ],
  },
  'NE5532': {
    pinCount: 8,
    description: 'Dual Low-Noise High-Speed Audio Op-Amp',
    manufacturer: 'Texas Instruments / Signetics',
    pinout: [
      { number: 1, name: 'OUT A',  description: 'Op-amp A output' },
      { number: 2, name: 'IN−A',   description: 'Op-amp A inverting input' },
      { number: 3, name: 'IN+A',   description: 'Op-amp A non-inverting input' },
      { number: 4, name: 'V−',     description: 'Negative power supply' },
      { number: 5, name: 'IN+B',   description: 'Op-amp B non-inverting input' },
      { number: 6, name: 'IN−B',   description: 'Op-amp B inverting input' },
      { number: 7, name: 'OUT B',  description: 'Op-amp B output' },
      { number: 8, name: 'V+',     description: 'Positive power supply' },
    ],
  },
  'RC4558': {
    pinCount: 8,
    description: 'Dual General-Purpose Op-Amp (TS-808 classic)',
    manufacturer: 'Texas Instruments / Raytheon',
    pinout: [
      { number: 1, name: 'OUT A',  description: 'Op-amp A output' },
      { number: 2, name: 'IN−A',   description: 'Op-amp A inverting input' },
      { number: 3, name: 'IN+A',   description: 'Op-amp A non-inverting input' },
      { number: 4, name: 'V−',     description: 'Negative power supply' },
      { number: 5, name: 'IN+B',   description: 'Op-amp B non-inverting input' },
      { number: 6, name: 'IN−B',   description: 'Op-amp B inverting input' },
      { number: 7, name: 'OUT B',  description: 'Op-amp B output' },
      { number: 8, name: 'V+',     description: 'Positive power supply' },
    ],
  },
  'LM358': {
    pinCount: 8,
    description: 'Dual Operational Amplifier (single supply)',
    manufacturer: 'Texas Instruments / Various',
    pinout: [
      { number: 1, name: 'OUT A',  description: 'Op-amp A output' },
      { number: 2, name: 'IN−A',   description: 'Op-amp A inverting input' },
      { number: 3, name: 'IN+A',   description: 'Op-amp A non-inverting input' },
      { number: 4, name: 'GND',    description: 'Ground / V−' },
      { number: 5, name: 'IN+B',   description: 'Op-amp B non-inverting input' },
      { number: 6, name: 'IN−B',   description: 'Op-amp B inverting input' },
      { number: 7, name: 'OUT B',  description: 'Op-amp B output' },
      { number: 8, name: 'V+',     description: 'Positive power supply' },
    ],
  },

  // ── Single Op-Amps (8-pin) ────────────────────────────────────────────────
  'TL071': {
    pinCount: 8,
    description: 'Single JFET-Input Operational Amplifier',
    manufacturer: 'Texas Instruments',
    pinout: [
      { number: 1, name: 'OFFSET', description: 'Offset null A' },
      { number: 2, name: 'IN−',    description: 'Inverting input' },
      { number: 3, name: 'IN+',    description: 'Non-inverting input' },
      { number: 4, name: 'V−',     description: 'Negative power supply' },
      { number: 5, name: 'OFFSET', description: 'Offset null B' },
      { number: 6, name: 'OUT',    description: 'Output' },
      { number: 7, name: 'V+',     description: 'Positive power supply' },
      { number: 8, name: 'N/C',    description: 'No connect' },
    ],
  },
  'LM741': {
    pinCount: 8,
    description: 'General-Purpose Single Op-Amp',
    manufacturer: 'Texas Instruments / Various',
    pinout: [
      { number: 1, name: 'OFFSET', description: 'Offset null A' },
      { number: 2, name: 'IN−',    description: 'Inverting input' },
      { number: 3, name: 'IN+',    description: 'Non-inverting input' },
      { number: 4, name: 'V−',     description: 'Negative power supply' },
      { number: 5, name: 'OFFSET', description: 'Offset null B' },
      { number: 6, name: 'OUT',    description: 'Output' },
      { number: 7, name: 'V+',     description: 'Positive power supply' },
      { number: 8, name: 'N/C',    description: 'No connect' },
    ],
  },

  // ── BBD / Delay Chips (8-pin) ─────────────────────────────────────────────
  'MN3005': {
    pinCount: 8,
    description: '4096-Stage BBD Delay Line (chorus/flanger)',
    manufacturer: 'Panasonic',
    pinout: [
      { number: 1, name: 'VG',    description: 'Gate voltage bias' },
      { number: 2, name: 'IN',    description: 'Signal input' },
      { number: 3, name: 'VDD',   description: 'Positive supply +15V' },
      { number: 4, name: 'CLK1',  description: 'Clock input 1' },
      { number: 5, name: 'CLK2',  description: 'Clock input 2' },
      { number: 6, name: 'VSS',   description: 'Ground' },
      { number: 7, name: 'OUT',   description: 'Signal output' },
      { number: 8, name: 'N/C',   description: 'No connect' },
    ],
  },
  'MN3101': {
    pinCount: 8,
    description: 'BBD Clock Driver (for MN3005)',
    manufacturer: 'Panasonic',
    pinout: [
      { number: 1, name: 'OUT1',  description: 'Clock output 1' },
      { number: 2, name: 'OUT2',  description: 'Clock output 2' },
      { number: 3, name: 'VDD',   description: 'Positive supply +15V' },
      { number: 4, name: 'VSS',   description: 'Ground' },
      { number: 5, name: 'OSC',   description: 'Oscillator (RC timing)' },
      { number: 6, name: 'N/C',   description: 'No connect' },
      { number: 7, name: 'N/C',   description: 'No connect' },
      { number: 8, name: 'N/C',   description: 'No connect' },
    ],
  },

  // ── Quad Op-Amps (14-pin) ─────────────────────────────────────────────────
  'TL074': {
    pinCount: 14,
    description: 'Quad JFET-Input Operational Amplifier',
    manufacturer: 'Texas Instruments',
    pinout: [
      { number: 1,  name: 'OUT A',  description: 'Op-amp A output' },
      { number: 2,  name: 'IN−A',   description: 'Op-amp A inverting input' },
      { number: 3,  name: 'IN+A',   description: 'Op-amp A non-inverting input' },
      { number: 4,  name: 'V+',     description: 'Positive power supply' },
      { number: 5,  name: 'IN+B',   description: 'Op-amp B non-inverting input' },
      { number: 6,  name: 'IN−B',   description: 'Op-amp B inverting input' },
      { number: 7,  name: 'OUT B',  description: 'Op-amp B output' },
      { number: 8,  name: 'OUT C',  description: 'Op-amp C output' },
      { number: 9,  name: 'IN−C',   description: 'Op-amp C inverting input' },
      { number: 10, name: 'IN+C',   description: 'Op-amp C non-inverting input' },
      { number: 11, name: 'V−',     description: 'Negative power supply' },
      { number: 12, name: 'IN+D',   description: 'Op-amp D non-inverting input' },
      { number: 13, name: 'IN−D',   description: 'Op-amp D inverting input' },
      { number: 14, name: 'OUT D',  description: 'Op-amp D output' },
    ],
  },
  'LM324': {
    pinCount: 14,
    description: 'Quad Operational Amplifier (single supply)',
    manufacturer: 'Texas Instruments / Various',
    pinout: [
      { number: 1,  name: 'OUT A',  description: 'Op-amp A output' },
      { number: 2,  name: 'IN−A',   description: 'Op-amp A inverting input' },
      { number: 3,  name: 'IN+A',   description: 'Op-amp A non-inverting input' },
      { number: 4,  name: 'V+',     description: 'Positive power supply' },
      { number: 5,  name: 'IN+B',   description: 'Op-amp B non-inverting input' },
      { number: 6,  name: 'IN−B',   description: 'Op-amp B inverting input' },
      { number: 7,  name: 'OUT B',  description: 'Op-amp B output' },
      { number: 8,  name: 'OUT C',  description: 'Op-amp C output' },
      { number: 9,  name: 'IN−C',   description: 'Op-amp C inverting input' },
      { number: 10, name: 'IN+C',   description: 'Op-amp C non-inverting input' },
      { number: 11, name: 'GND',    description: 'Ground / V−' },
      { number: 12, name: 'IN+D',   description: 'Op-amp D non-inverting input' },
      { number: 13, name: 'IN−D',   description: 'Op-amp D inverting input' },
      { number: 14, name: 'OUT D',  description: 'Op-amp D output' },
    ],
  },

  // ── Echo / Delay ICs (16-pin) ─────────────────────────────────────────────
  'PT2399': {
    pinCount: 16,
    description: 'Echo Audio Processor IC (digital delay)',
    manufacturer: 'Princeton Technology Corp',
    pinout: [
      { number: 1,  name: 'VDD',   description: 'Power supply +5V' },
      { number: 2,  name: 'VREF',  description: 'Reference voltage output (~2.5V)' },
      { number: 3,  name: 'INV',   description: 'Internal inverting amp output' },
      { number: 4,  name: 'NINV',  description: 'Internal non-inverting amp input' },
      { number: 5,  name: 'IN−',   description: 'Op-amp inverting input' },
      { number: 6,  name: 'IN+',   description: 'Op-amp non-inverting input' },
      { number: 7,  name: 'OUT',   description: 'Delayed signal output' },
      { number: 8,  name: 'GND',   description: 'Ground' },
      { number: 9,  name: 'OSC1',  description: 'Oscillator pin 1' },
      { number: 10, name: 'OSC2',  description: 'Oscillator pin 2 (timing cap)' },
      { number: 11, name: 'CLK',   description: 'Clock output' },
      { number: 12, name: 'PDN',   description: 'Power down (active high)' },
      { number: 13, name: 'ADR',   description: 'A/D control (delay range)' },
      { number: 14, name: 'ADW',   description: 'A/D write enable' },
      { number: 15, name: 'D+',    description: 'ADC positive input' },
      { number: 16, name: 'D−',    description: 'ADC negative input' },
    ],
  },
};

// Aliases (alternate part numbers that map to the same IC)
const IC_ALIASES: Record<string, string> = {
  'TL072CP': 'TL072',
  'TL072IP': 'TL072',
  'TL072CN': 'TL072',
  'TL071CP': 'TL071',
  'TL074CN': 'TL074',
  'NE5532P': 'NE5532',
  'NE5532N': 'NE5532',
  'SA5532': 'NE5532',
  'JRC4558': 'RC4558',
  '4558':    'RC4558',
  'LM358N': 'LM358',
  'LM741CN': 'LM741',
  'LM324N': 'LM324',
};

// ============================================================================
// Decoder
// ============================================================================

/**
 * Decode an IC part number into a full ICSpec.
 *
 * Supports all common guitar pedal ICs. Falls back to a generic 8-pin
 * spec for unrecognised parts.
 *
 * @param partNumber - IC part number (e.g. "TL072", "PT2399", "NE5532P")
 * @returns ICSpec with pinout, description, and manufacturer
 *
 * @example
 * decodeIC('TL072')   // → { pinCount: 8, description: 'Dual JFET-Input...', ... }
 * decodeIC('PT2399')  // → { pinCount: 16, description: 'Echo Audio Processor...', ... }
 */
export function decodeIC(partNumber: string): ICSpec {
  const cleaned = partNumber.trim().toUpperCase();

  // Resolve alias (e.g. "JRC4558" → "RC4558")
  const canonical = IC_ALIASES[cleaned] ?? cleaned;

  const data = IC_DATABASE[canonical];

  if (data) {
    return {
      type: 'ic',
      value: canonical,
      partNumber: canonical,
      pinCount: data.pinCount,
      pinout: data.pinout,
      description: data.description,
      manufacturer: data.manufacturer,
    };
  }

  // Fallback: generic 8-pin stub
  return {
    type: 'ic',
    value: cleaned,
    partNumber: cleaned,
    pinCount: 8,
    pinout: Array.from({ length: 8 }, (_, i) => ({
      number: i + 1,
      name: `Pin ${i + 1}`,
      description: 'Unknown',
    })),
    description: `IC: ${cleaned} (unrecognised)`,
  };
}

/**
 * Returns all known IC part numbers in the database.
 */
export function listKnownICs(): string[] {
  return Object.keys(IC_DATABASE);
}
