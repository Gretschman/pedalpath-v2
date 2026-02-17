/**
 * Diode decoder for PedalPath v2
 *
 * This is a stub implementation for Phase 1.
 * Full implementation will be added in a future phase.
 *
 * Planned features:
 *  - Part number lookup (1N4148, 1N4001, 1N5817, etc.)
 *  - Diode type classification (signal, rectifier, zener, LED)
 *  - Voltage ratings
 *  - LED color identification
 */

import type { DiodeSpec, LEDSpec } from '@/types/component-specs.types';

/**
 * Decode a diode part number (stub implementation)
 *
 * @param partNumber - Diode part number (e.g., "1N4148", "1N4001")
 * @returns DiodeSpec with basic information
 */
export function decodeDiode(partNumber: string): DiodeSpec {
  const cleaned = partNumber.trim().toUpperCase();

  // Basic stub implementation - returns minimal info
  // TODO: Add full diode database lookup in future phase
  return {
    type: 'diode',
    value: cleaned,
    partNumber: cleaned,
    diodeType: 'signal', // Default assumption
    cathodeMarking: 'band',
    color: '#000000', // Black body
  };
}

/**
 * Decode an LED (stub implementation)
 *
 * @param size - LED size ('3mm' or '5mm')
 * @param color - LED color
 * @returns LEDSpec with basic information
 */
export function decodeLED(
  size: '3mm' | '5mm' = '5mm',
  color: 'red' | 'green' | 'yellow' | 'blue' | 'white' = 'red'
): LEDSpec {
  return {
    type: 'diode',
    value: `LED ${color} ${size}`,
    partNumber: `LED-${color.toUpperCase()}-${size}`,
    diodeType: 'led',
    cathodeMarking: 'band',
    color: '#000000',
    ledColor: color,
    size,
  };
}
