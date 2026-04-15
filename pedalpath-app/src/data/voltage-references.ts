/**
 * voltage-references.ts
 *
 * Curated static lookup table of expected DC pin voltages for common
 * guitar pedal semiconductors. Used as debugging/testing reference
 * in PedalPath build guides.
 *
 * All voltages assume 9V DC center-negative supply (standard pedal power).
 * Op-amp/IC circuits assume single-supply with virtual ground (Vref ≈ 4.5V).
 * Germanium transistors use positive-ground topology (Fuzz Face convention).
 *
 * Sources: real-world measurements from common pedal circuits (Electro-Harmonix
 * Big Muff, Fuzz Face, MXR Phase 90, Klon Centaur, Boss OD-1, etc.)
 */

import type { PinVoltageRef } from '../types/bom.types';

// ── Transistor Voltage References ─────────────────────────────────────────────

export const TRANSISTOR_VOLTAGE_REFS: Record<string, PinVoltageRef[]> = {
  '2N3904': [
    {
      partNumber: '2N3904',
      supplyVoltage: '9V',
      circuitContext: 'NPN common-emitter amplifier with voltage divider bias',
      pins: [
        { pin: 'E', name: 'Emitter', expectedV: '0V', tolerance: '±0.2V' },
        { pin: 'B', name: 'Base', expectedV: '0.6–0.7V', tolerance: '±0.1V' },
        { pin: 'C', name: 'Collector', expectedV: '4.5V', tolerance: '±1.5V' },
      ],
    },
  ],

  '2N3906': [
    {
      partNumber: '2N3906',
      supplyVoltage: '9V',
      circuitContext: 'PNP common-emitter amplifier with voltage divider bias',
      pins: [
        { pin: 'E', name: 'Emitter', expectedV: '9V', tolerance: '±0.2V' },
        { pin: 'B', name: 'Base', expectedV: '8.3V', tolerance: '±0.2V' },
        { pin: 'C', name: 'Collector', expectedV: '4.5V', tolerance: '±1.5V' },
      ],
    },
  ],

  '2N5088': [
    {
      partNumber: '2N5088',
      supplyVoltage: '9V',
      circuitContext: 'NPN high-gain common-emitter (Big Muff gain stage)',
      pins: [
        { pin: 'E', name: 'Emitter', expectedV: '0V', tolerance: '±0.1V' },
        { pin: 'B', name: 'Base', expectedV: '0.6V', tolerance: '±0.1V' },
        { pin: 'C', name: 'Collector', expectedV: '4–5V', tolerance: '±1.5V' },
      ],
    },
  ],

  '2N5089': [
    {
      partNumber: '2N5089',
      supplyVoltage: '9V',
      circuitContext: 'NPN high-gain common-emitter (Big Muff gain stage)',
      pins: [
        { pin: 'E', name: 'Emitter', expectedV: '0V', tolerance: '±0.1V' },
        { pin: 'B', name: 'Base', expectedV: '0.6V', tolerance: '±0.1V' },
        { pin: 'C', name: 'Collector', expectedV: '4–5V', tolerance: '±1.5V' },
      ],
    },
  ],

  'BC549': [
    {
      partNumber: 'BC549',
      supplyVoltage: '9V',
      circuitContext: 'NPN common-emitter amplifier (similar bias to 2N3904)',
      pins: [
        { pin: 'E', name: 'Emitter', expectedV: '0V', tolerance: '±0.2V' },
        { pin: 'B', name: 'Base', expectedV: '0.6–0.7V', tolerance: '±0.1V' },
        { pin: 'C', name: 'Collector', expectedV: '4.5V', tolerance: '±1.5V' },
      ],
    },
  ],

  'BC549C': [
    {
      partNumber: 'BC549C',
      supplyVoltage: '9V',
      circuitContext: 'NPN common-emitter amplifier, high-gain selection (same bias as BC549)',
      pins: [
        { pin: 'E', name: 'Emitter', expectedV: '0V', tolerance: '±0.2V' },
        { pin: 'B', name: 'Base', expectedV: '0.6–0.7V', tolerance: '±0.1V' },
        { pin: 'C', name: 'Collector', expectedV: '4.5V', tolerance: '±1.5V' },
      ],
    },
  ],

  'MPSA18': [
    {
      partNumber: 'MPSA18',
      supplyVoltage: '9V',
      circuitContext: 'NPN high-gain common-emitter (same bias pattern as 2N5088)',
      pins: [
        { pin: 'E', name: 'Emitter', expectedV: '0V', tolerance: '±0.1V' },
        { pin: 'B', name: 'Base', expectedV: '0.6V', tolerance: '±0.1V' },
        { pin: 'C', name: 'Collector', expectedV: '4–5V', tolerance: '±1.5V' },
      ],
    },
  ],

  'BS170': [
    {
      partNumber: 'BS170',
      supplyVoltage: '9V',
      circuitContext: 'N-channel MOSFET boost (e.g., AMZ Mosfet Boost)',
      pins: [
        { pin: 'G', name: 'Gate', expectedV: '3–5V', tolerance: '±1V' },
        { pin: 'S', name: 'Source', expectedV: '0V', tolerance: '±0.1V' },
        { pin: 'D', name: 'Drain', expectedV: '4–5V', tolerance: '±1.5V' },
      ],
    },
  ],

  '2N5457': [
    {
      partNumber: '2N5457',
      supplyVoltage: '9V',
      circuitContext: 'N-channel JFET, self-biased (compressor/phaser, e.g., MXR Phase 90)',
      pins: [
        { pin: 'G', name: 'Gate', expectedV: '0V', tolerance: '±0.1V' },
        { pin: 'S', name: 'Source', expectedV: '1–2V', tolerance: '±0.5V' },
        { pin: 'D', name: 'Drain', expectedV: '5–7V', tolerance: '±1V' },
      ],
    },
  ],

  'J201': [
    {
      partNumber: 'J201',
      supplyVoltage: '9V',
      circuitContext: 'N-channel JFET boost (e.g., Fetzer Valve, miniBooster)',
      pins: [
        { pin: 'G', name: 'Gate', expectedV: '0V', tolerance: '±0.1V' },
        { pin: 'S', name: 'Source', expectedV: '0.5–1V', tolerance: '±0.3V' },
        { pin: 'D', name: 'Drain', expectedV: '4–6V', tolerance: '±1.5V' },
      ],
    },
  ],

  // ── Germanium transistors (PNP positive-ground Fuzz Face topology) ────────
  // Note: In positive-ground circuits, the +9V rail connects to emitter.
  // Meter readings: positive probe on collector, negative probe on ground.
  // Bias trimmer (if present) should be set for ~4.5V collector-to-ground.

  'AC128': [
    {
      partNumber: 'AC128',
      supplyVoltage: '9V',
      circuitContext:
        'PNP germanium fuzz (Fuzz Face). Positive-ground topology. ' +
        'Measured with positive probe on collector, negative on ground. ' +
        'Adjust bias trimmer for ~4.5V difference from supply.',
      pins: [
        { pin: 'E', name: 'Emitter', expectedV: '9V (connected to +V rail)', tolerance: '±0.1V' },
        { pin: 'B', name: 'Base', expectedV: '8.8–8.9V', tolerance: '±0.2V' },
        { pin: 'C', name: 'Collector', expectedV: '4.5V', tolerance: '±1V' },
      ],
    },
  ],

  'NKT275': [
    {
      partNumber: 'NKT275',
      supplyVoltage: '9V',
      circuitContext:
        'PNP germanium fuzz (Fuzz Face). Positive-ground topology. ' +
        'Measured with positive probe on collector, negative on ground. ' +
        'Adjust bias trimmer for ~4.5V difference from supply.',
      pins: [
        { pin: 'E', name: 'Emitter', expectedV: '9V (connected to +V rail)', tolerance: '±0.1V' },
        { pin: 'B', name: 'Base', expectedV: '8.8–8.9V', tolerance: '±0.2V' },
        { pin: 'C', name: 'Collector', expectedV: '4.5V', tolerance: '±1V' },
      ],
    },
  ],

  'OC71': [
    {
      partNumber: 'OC71',
      supplyVoltage: '9V',
      circuitContext:
        'PNP germanium fuzz (Fuzz Face). Positive-ground topology. ' +
        'Measured with positive probe on collector, negative on ground. ' +
        'Adjust bias trimmer for ~4.5V difference from supply.',
      pins: [
        { pin: 'E', name: 'Emitter', expectedV: '9V (connected to +V rail)', tolerance: '±0.1V' },
        { pin: 'B', name: 'Base', expectedV: '8.8–8.9V', tolerance: '±0.2V' },
        { pin: 'C', name: 'Collector', expectedV: '4.5V', tolerance: '±1V' },
      ],
    },
  ],
};

// ── IC Voltage References ─────────────────────────────────────────────────────

/**
 * Standard dual op-amp DIP-8 pin voltages at quiescent (no signal).
 * Applies to TL072, TL082, JRC4558, RC4558, NE5532, and equivalents.
 * Single-supply with virtual ground bias network (Vref = 4.5V).
 */
function dualOpAmpDIP8(partNumber: string, context: string): PinVoltageRef {
  return {
    partNumber,
    supplyVoltage: '9V',
    circuitContext: context,
    pins: [
      { pin: '1', name: 'Output A', expectedV: '4.5V', tolerance: '±0.5V' },
      { pin: '2', name: 'Inverting Input A', expectedV: '4.5V', tolerance: '±0.3V' },
      { pin: '3', name: 'Non-Inverting Input A', expectedV: '4.5V', tolerance: '±0.3V' },
      { pin: '4', name: 'V- (GND)', expectedV: '0V' },
      { pin: '5', name: 'Non-Inverting Input B', expectedV: '4.5V', tolerance: '±0.3V' },
      { pin: '6', name: 'Inverting Input B', expectedV: '4.5V', tolerance: '±0.3V' },
      { pin: '7', name: 'Output B', expectedV: '4.5V', tolerance: '±0.5V' },
      { pin: '8', name: 'V+ (Supply)', expectedV: '9V', tolerance: '±0.2V' },
    ],
  };
}

export const IC_VOLTAGE_REFS: Record<string, PinVoltageRef[]> = {
  'TL072': [
    dualOpAmpDIP8('TL072', 'Dual JFET op-amp, single-supply with Vref bias (e.g., Tube Screamer tone stage, Klon buffer)'),
  ],

  'TL082': [
    dualOpAmpDIP8('TL082', 'Dual JFET op-amp, single-supply with Vref bias (same pinout as TL072)'),
  ],

  'JRC4558': [
    dualOpAmpDIP8('JRC4558', 'Dual op-amp, single-supply with Vref bias (classic Tube Screamer, Boss OD-1)'),
  ],

  'RC4558': [
    dualOpAmpDIP8('RC4558', 'Dual op-amp, single-supply with Vref bias (same as JRC4558, different manufacturer)'),
  ],

  'NE5532': [
    dualOpAmpDIP8('NE5532', 'Dual low-noise op-amp, single-supply with Vref bias (high-fidelity pedal circuits)'),
  ],

  'LM308': [
    {
      partNumber: 'LM308',
      supplyVoltage: '9V',
      circuitContext: 'Single op-amp DIP-8, single-supply with Vref bias (e.g., ProCo RAT distortion)',
      pins: [
        { pin: '1', name: 'Balance', expectedV: 'N/A (trim)' },
        { pin: '2', name: 'Inverting Input', expectedV: '4.5V', tolerance: '±0.3V' },
        { pin: '3', name: 'Non-Inverting Input', expectedV: '4.5V', tolerance: '±0.3V' },
        { pin: '4', name: 'V- (GND)', expectedV: '0V' },
        { pin: '5', name: 'Balance', expectedV: 'N/A (trim)' },
        { pin: '6', name: 'Output', expectedV: '4.5V', tolerance: '±0.5V' },
        { pin: '7', name: 'V+ (Supply)', expectedV: '9V', tolerance: '±0.2V' },
        { pin: '8', name: 'N/C', expectedV: 'N/A' },
      ],
    },
  ],

  'LM386': [
    {
      partNumber: 'LM386',
      supplyVoltage: '9V',
      circuitContext: 'Audio power amplifier DIP-8 (practice amp, signal booster). Inputs biased to ground, not Vref.',
      pins: [
        { pin: '1', name: 'Gain (1)', expectedV: 'N/A (gain set resistor)' },
        { pin: '2', name: 'Inverting Input', expectedV: '0V', tolerance: '±0.1V' },
        { pin: '3', name: 'Non-Inverting Input', expectedV: '0V', tolerance: '±0.1V' },
        { pin: '4', name: 'GND', expectedV: '0V' },
        { pin: '5', name: 'Output', expectedV: '4.5V', tolerance: '±0.5V' },
        { pin: '6', name: 'V+ (Supply)', expectedV: '9V', tolerance: '±0.2V' },
        { pin: '7', name: 'Bypass', expectedV: 'N/A (decoupling cap)' },
        { pin: '8', name: 'Gain (8)', expectedV: 'N/A (gain set resistor)' },
      ],
    },
  ],
};

// ── Lookup Helpers ────────────────────────────────────────────────────────────

/**
 * Look up voltage references by exact part number (case-insensitive).
 * Checks both transistor and IC tables. Returns empty array if not found.
 */
export function getVoltageRef(partNumber: string): PinVoltageRef[] {
  const key = partNumber.trim().toUpperCase();
  return TRANSISTOR_VOLTAGE_REFS[key] ?? IC_VOLTAGE_REFS[key] ?? [];
}

/**
 * Try to match a BOMComponent's `value` field against the voltage reference
 * tables. The value field typically contains the part number (e.g., "2N3904",
 * "TL072"). Falls back to componentType-based heuristics if needed.
 *
 * @param value - The `value` field from a BOMComponent
 * @param componentType - The `component_type` field from a BOMComponent
 * @returns Matching PinVoltageRef entries, or empty array if no match
 */
export function getVoltageRefForComponent(
  value: string,
  componentType: string,
): PinVoltageRef[] {
  if (!value) return [];

  const normalized = value.trim().toUpperCase();

  // Direct match against both tables
  const direct = getVoltageRef(normalized);
  if (direct.length > 0) return direct;

  // Try stripping common suffixes/prefixes that appear in BOM values
  // e.g., "2N3904 NPN" → "2N3904", "TL072CP" → "TL072"
  const words = normalized.split(/[\s,/]+/);
  for (const word of words) {
    const match = getVoltageRef(word);
    if (match.length > 0) return match;
  }

  // Try removing common IC package suffixes (CP, CN, P, N, D, etc.)
  if (componentType === 'ic' || componentType === 'op-amp') {
    const stripped = normalized.replace(/[CPND]+$/, '');
    if (stripped !== normalized) {
      const match = getVoltageRef(stripped);
      if (match.length > 0) return match;
    }
  }

  return [];
}
