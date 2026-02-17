/**
 * IC (Integrated Circuit) decoder for PedalPath v2
 *
 * This is a stub implementation for Phase 1.
 * Full implementation will be added in a future phase.
 *
 * Planned features:
 *  - Part number lookup (TL072, NE5532, etc.)
 *  - Pin count detection (8-pin, 14-pin, 16-pin DIP)
 *  - Pinout information
 *  - Manufacturer data
 */

import type { ICSpec } from '@/types/component-specs.types';

/**
 * Decode an IC part number (stub implementation)
 *
 * @param partNumber - IC part number (e.g., "TL072", "NE5532")
 * @returns ICSpec with basic information
 */
export function decodeIC(partNumber: string): ICSpec {
  const cleaned = partNumber.trim().toUpperCase();

  // Basic stub implementation - returns minimal info
  // TODO: Add full IC database lookup in future phase
  return {
    type: 'ic',
    value: cleaned,
    partNumber: cleaned,
    pinCount: 8, // Default assumption
    pinout: [
      { number: 1, name: 'Pin 1' },
      { number: 2, name: 'Pin 2' },
      { number: 3, name: 'Pin 3' },
      { number: 4, name: 'Pin 4' },
      { number: 5, name: 'Pin 5' },
      { number: 6, name: 'Pin 6' },
      { number: 7, name: 'Pin 7' },
      { number: 8, name: 'Pin 8' },
    ],
    description: `IC: ${cleaned} (generic)`,
  };
}
