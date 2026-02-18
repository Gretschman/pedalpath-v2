/**
 * Diode decoder for PedalPath v2
 *
 * Part number lookup for common guitar pedal diodes and LEDs.
 * Returns full DiodeSpec / LEDSpec with body color, cathode marking,
 * and voltage rating.
 */

import type { DiodeSpec, LEDSpec, DiodeType } from '@/types/component-specs.types';

// ============================================================================
// Diode database
// ============================================================================

interface DiodeData {
  diodeType: DiodeType;
  voltage?: number;          // forward or breakdown voltage
  color: string;             // body hex color
  cathodeMarkColor: string;  // cathode band / stripe hex color
  description: string;
}

const DIODE_DATABASE: Record<string, DiodeData> = {
  // ── Signal diodes (glass body) ────────────────────────────────────────────
  '1N4148': {
    diodeType: 'signal',
    voltage: 75,
    color: '#E8B87A',        // amber glass
    cathodeMarkColor: '#111111',
    description: 'Fast switching signal diode — ubiquitous in pedal clipping stages',
  },
  '1N914': {
    diodeType: 'signal',
    voltage: 75,
    color: '#E8B87A',
    cathodeMarkColor: '#111111',
    description: 'Equivalent to 1N4148, interchangeable in most pedal circuits',
  },
  'BAT41': {
    diodeType: 'signal',
    voltage: 100,
    color: '#2A2A2A',        // dark/black body (SOD-80 glass)
    cathodeMarkColor: '#C0C0C0',
    description: 'Schottky small-signal diode — low forward voltage (0.34V)',
  },
  'BAT46': {
    diodeType: 'signal',
    voltage: 100,
    color: '#2A2A2A',
    cathodeMarkColor: '#C0C0C0',
    description: 'Schottky small-signal diode — low Vf, fast switching',
  },

  // ── Germanium signal diodes ───────────────────────────────────────────────
  '1N34A': {
    diodeType: 'signal',
    voltage: 60,
    color: '#B8A878',        // warm gray/tan glass
    cathodeMarkColor: '#111111',
    description: 'Germanium diode — warm asymmetric clipping in vintage fuzz circuits',
  },
  'OA91': {
    diodeType: 'signal',
    voltage: 60,
    color: '#C87C3C',        // orange glass can
    cathodeMarkColor: '#111111',
    description: 'Germanium diode — low Vf (~0.2V), classic vintage fuzz tone',
  },
  'OA85': {
    diodeType: 'signal',
    voltage: 25,
    color: '#C87C3C',
    cathodeMarkColor: '#111111',
    description: 'Germanium diode — similar to OA91, used in vintage circuits',
  },
  'D9E': {
    diodeType: 'signal',
    voltage: 30,
    color: '#C87C3C',
    cathodeMarkColor: '#111111',
    description: 'Soviet germanium diode — Sovtek Big Muff original',
  },

  // ── Rectifier diodes (black plastic body) ────────────────────────────────
  '1N4001': {
    diodeType: 'rectifier',
    voltage: 50,
    color: '#1A1A1A',
    cathodeMarkColor: '#C0C0C0',
    description: 'General-purpose rectifier — 50V 1A, power supply protection',
  },
  '1N4002': {
    diodeType: 'rectifier',
    voltage: 100,
    color: '#1A1A1A',
    cathodeMarkColor: '#C0C0C0',
    description: 'General-purpose rectifier — 100V 1A',
  },
  '1N4004': {
    diodeType: 'rectifier',
    voltage: 400,
    color: '#1A1A1A',
    cathodeMarkColor: '#C0C0C0',
    description: 'General-purpose rectifier — 400V 1A, common power supply diode',
  },
  '1N4007': {
    diodeType: 'rectifier',
    voltage: 1000,
    color: '#1A1A1A',
    cathodeMarkColor: '#C0C0C0',
    description: 'General-purpose rectifier — 1000V 1A, reverse polarity protection',
  },

  // ── Schottky rectifiers ───────────────────────────────────────────────────
  '1N5817': {
    diodeType: 'rectifier',
    voltage: 20,
    color: '#1A1A1A',
    cathodeMarkColor: '#C0C0C0',
    description: 'Schottky rectifier — 20V 1A, low dropout power protection',
  },
  '1N5818': {
    diodeType: 'rectifier',
    voltage: 30,
    color: '#1A1A1A',
    cathodeMarkColor: '#C0C0C0',
    description: 'Schottky rectifier — 30V 1A',
  },
  '1N5819': {
    diodeType: 'rectifier',
    voltage: 40,
    color: '#1A1A1A',
    cathodeMarkColor: '#C0C0C0',
    description: 'Schottky rectifier — 40V 1A, preferred for pedal power supply protection',
  },
  'SS14': {
    diodeType: 'rectifier',
    voltage: 40,
    color: '#1A1A1A',
    cathodeMarkColor: '#C0C0C0',
    description: 'SMD Schottky rectifier (SMA) — 40V 1A',
  },

  // ── Zener diodes (glass body) ─────────────────────────────────────────────
  '1N4728': {
    diodeType: 'zener',
    voltage: 3.3,
    color: '#D0B870',        // yellow-amber glass
    cathodeMarkColor: '#111111',
    description: 'Zener 3.3V — clipping and voltage reference',
  },
  '1N4733': {
    diodeType: 'zener',
    voltage: 5.1,
    color: '#D0B870',
    cathodeMarkColor: '#111111',
    description: 'Zener 5.1V — very common in pedal clipping and tone shaping',
  },
  '1N4735': {
    diodeType: 'zener',
    voltage: 6.2,
    color: '#D0B870',
    cathodeMarkColor: '#111111',
    description: 'Zener 6.2V — gain control and clipping stages',
  },
  '1N4740': {
    diodeType: 'zener',
    voltage: 10,
    color: '#D0B870',
    cathodeMarkColor: '#111111',
    description: 'Zener 10V — voltage regulation',
  },
  '1N4744': {
    diodeType: 'zener',
    voltage: 15,
    color: '#D0B870',
    cathodeMarkColor: '#111111',
    description: 'Zener 15V — voltage regulation',
  },
  '1N751': {
    diodeType: 'zener',
    voltage: 5.1,
    color: '#D0B870',
    cathodeMarkColor: '#111111',
    description: 'Zener 5.1V — classic vintage pedal zener',
  },
};

// Aliases (common alternate markings)
const DIODE_ALIASES: Record<string, string> = {
  '1N4148W': '1N4148',
  '1N4148-1': '1N4148',
  '1N914B': '1N914',
  'IN4148': '1N4148',
  'IN4001': '1N4001',
  'IN4007': '1N4007',
  '1N5817-1': '1N5817',
};

// LED body colors (emissive color with slight diffusion)
const LED_BODY_COLOR: Record<string, string> = {
  red:    '#DD1111',
  green:  '#11BB11',
  yellow: '#DDBB00',
  blue:   '#1133DD',
  white:  '#DDDDDD',
};

// LED glow color (brighter, for gradient center)
const LED_GLOW_COLOR: Record<string, string> = {
  red:    '#FF4444',
  green:  '#44FF44',
  yellow: '#FFEE22',
  blue:   '#4466FF',
  white:  '#FFFFFF',
};

// ============================================================================
// Exported decoders
// ============================================================================

/**
 * Decode a diode part number into a full DiodeSpec.
 *
 * @param partNumber - e.g. "1N4148", "1N5819", "OA91"
 * @returns DiodeSpec with body color, cathode marking, and description
 *
 * @example
 * decodeDiode('1N4148')  // → { diodeType: 'signal', color: '#E8B87A', ... }
 * decodeDiode('1N4733')  // → { diodeType: 'zener',  voltage: 5.1, ... }
 */
export function decodeDiode(partNumber: string): DiodeSpec {
  const cleaned  = partNumber.trim().toUpperCase();
  const canonical = DIODE_ALIASES[cleaned] ?? cleaned;
  const data = DIODE_DATABASE[canonical];

  if (data) {
    return {
      type: 'diode',
      value: canonical,
      partNumber: canonical,
      diodeType: data.diodeType,
      cathodeMarking: 'band',
      color: data.color,
      voltage: data.voltage,
      label: data.description,
    };
  }

  // Fallback: generic signal diode
  return {
    type: 'diode',
    value: cleaned,
    partNumber: cleaned,
    diodeType: 'signal',
    cathodeMarking: 'band',
    color: '#E8B87A',
  };
}

/**
 * Decode an LED into a LEDSpec.
 *
 * @param ledColor - LED color
 * @param size     - Physical size: '3mm' or '5mm'
 * @returns LEDSpec with body and glow colors
 *
 * @example
 * decodeLED('red', '5mm')  // → { ledColor: 'red', color: '#DD1111', ... }
 */
export function decodeLED(
  ledColor: 'red' | 'green' | 'yellow' | 'blue' | 'white' = 'red',
  size: '3mm' | '5mm' = '5mm',
): LEDSpec {
  const bodyColor = LED_BODY_COLOR[ledColor] ?? '#DD1111';

  return {
    type: 'diode',
    value: `LED-${ledColor.toUpperCase()}-${size}`,
    partNumber: `LED-${ledColor.toUpperCase()}-${size}`,
    diodeType: 'led',
    cathodeMarking: 'band',
    color: bodyColor,
    ledColor,
    size,
    label: `${size} ${ledColor} LED`,
    // Store glow color in description (used by DiodeSVG)
    voltage: 0,
  };
}

/**
 * Get the LED glow color for rendering (used by DiodeSVG).
 */
export function getLEDGlowColor(ledColor: string): string {
  return LED_GLOW_COLOR[ledColor] ?? '#FF4444';
}

/**
 * Get the cathode band color for a given body color.
 * Light bodies get a black band; dark bodies get a silver band.
 */
export function getCathodeMarkColor(bodyColor: string): string {
  const data = Object.values(DIODE_DATABASE).find(d => d.color === bodyColor);
  return data?.cathodeMarkColor ?? '#111111';
}

/**
 * Returns all known diode part numbers.
 */
export function listKnownDiodes(): string[] {
  return Object.keys(DIODE_DATABASE);
}
