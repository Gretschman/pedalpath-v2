# Decoder System Technical Design

**Purpose:** Technical specification for component value decoder system
**Audience:** Worker A (Phase 1, Work Stream A)

## Overview

The decoder system converts component value strings (e.g., "10kΩ", "100nF", "TL072") into visual specifications that the rendering system uses to draw realistic components.

## Architecture

```
Input: Component Value String
  ↓
Decoder (Type-Specific)
  ↓
Visual Specification Object
  ↓
SVG Component Renderer
  ↓
Output: Realistic Component Visual
```

## File Structure

```
src/utils/decoders/
├── index.ts                    # Barrel export
├── resistor-decoder.ts         # Resistor value → color bands
├── capacitor-decoder.ts        # Capacitor value → type/polarity
├── diode-decoder.ts            # Diode model → cathode position
├── ic-decoder.ts               # IC part number → pin count/layout
└── __tests__/
    ├── resistor-decoder.test.ts
    ├── capacitor-decoder.test.ts
    └── ...

src/types/
└── component-specs.types.ts    # TypeScript interfaces
```

## Type Definitions

```typescript
// src/types/component-specs.types.ts

/** Base specification for all components */
export interface ComponentSpec {
  type: 'resistor' | 'capacitor' | 'diode' | 'ic' | 'transistor' | 'led';
  value: string;
  label?: string;
}

/** Resistor visual specification */
export interface ResistorSpec extends ComponentSpec {
  type: 'resistor';
  resistance: number;           // Numeric value in ohms
  bands: ColorBand[];          // 4 or 5 color bands
  tolerance: string;           // "±5%", "±10%", etc.
  powerRating: string;         // "0.25W", "0.5W", etc.
  physicalSize: 'small' | 'medium' | 'large';
}

/** Color band for resistors */
export interface ColorBand {
  color: ResistorColor;
  hex: string;                 // Hex color code for rendering
  position: number;            // 0-4 (band position)
}

export type ResistorColor =
  | 'black' | 'brown' | 'red' | 'orange' | 'yellow'
  | 'green' | 'blue' | 'violet' | 'grey' | 'white'
  | 'gold' | 'silver';

/** Capacitor visual specification */
export interface CapacitorSpec extends ComponentSpec {
  type: 'capacitor';
  capacitance: number;         // Numeric value in farads
  capType: 'ceramic' | 'electrolytic' | 'film' | 'tantalum';
  polarized: boolean;          // True for electrolytic
  voltage: string;             // "25V", "50V", etc.
  physicalSize: 'small' | 'medium' | 'large';
  color: string;               // Body color hex code
  marking?: string;            // Text printed on body (e.g., "104")
}

/** IC visual specification */
export interface ICSpec extends ComponentSpec {
  type: 'ic';
  partNumber: string;          // "TL072", "LM358", etc.
  pinCount: 8 | 14 | 16;       // DIP package pin count
  pinout: PinInfo[];           // Pin descriptions
  description: string;         // "Dual Op-Amp", etc.
  manufacturer?: string;
}

export interface PinInfo {
  number: number;              // Pin number (1-based)
  name: string;                // Pin function name
  description?: string;
}

/** Diode visual specification */
export interface DiodeSpec extends ComponentSpec {
  type: 'diode';
  partNumber: string;          // "1N4148", "1N4001", etc.
  diodeType: 'signal' | 'rectifier' | 'zener' | 'led';
  cathodeMarking: 'band' | 'stripe';
  color: string;               // Body color
  voltage?: number;            // Forward voltage or Zener voltage
}

/** LED visual specification */
export interface LEDSpec extends DiodeSpec {
  diodeType: 'led';
  ledColor: 'red' | 'green' | 'yellow' | 'blue' | 'white';
  size: '3mm' | '5mm';
}

/** Transistor visual specification */
export interface TransistorSpec extends ComponentSpec {
  type: 'transistor';
  partNumber: string;          // "2N5457", "2N3904", etc.
  transistorType: 'bjt-npn' | 'bjt-pnp' | 'jfet-n' | 'jfet-p' | 'mosfet-n' | 'mosfet-p';
  package: 'TO-92' | 'TO-220';
  pinout: ['E' | 'B' | 'C' | 'G' | 'D' | 'S', ...]; // Pin order left to right
}
```

## Resistor Decoder Implementation

```typescript
// src/utils/decoders/resistor-decoder.ts

import { ResistorSpec, ColorBand, ResistorColor } from '@/types/component-specs.types';

/** Color code mapping */
const COLOR_MAP: Record<ResistorColor, { digit: number | null, multiplier: number | null, hex: string }> = {
  black:  { digit: 0, multiplier: 1, hex: '#000000' },
  brown:  { digit: 1, multiplier: 10, hex: '#8B4513' },
  red:    { digit: 2, multiplier: 100, hex: '#CC0000' },
  orange: { digit: 3, multiplier: 1000, hex: '#FF6600' },
  yellow: { digit: 4, multiplier: 10000, hex: '#FFCC00' },
  green:  { digit: 5, multiplier: 100000, hex: '#00AA00' },
  blue:   { digit: 6, multiplier: 1000000, hex: '#0066CC' },
  violet: { digit: 7, multiplier: 10000000, hex: '#9400D3' },
  grey:   { digit: 8, multiplier: null, hex: '#808080' },
  white:  { digit: 9, multiplier: null, hex: '#FFFFFF' },
  gold:   { digit: null, multiplier: 0.1, hex: '#FFD700' },
  silver: { digit: null, multiplier: 0.01, hex: '#C0C0C0' },
};

/** Tolerance band colors */
const TOLERANCE_MAP: Record<ResistorColor, string> = {
  brown: '±1%',
  red: '±2%',
  gold: '±5%',
  silver: '±10%',
  // ... others not commonly used
};

/**
 * Decodes a resistor value string to visual specification
 *
 * @param value - Resistor value (e.g., "10kΩ", "4.7k", "100R", "1M")
 * @returns ResistorSpec with color bands
 *
 * @example
 * decodeResistor("10kΩ")
 * // Returns: { bands: [brown, black, orange, gold], tolerance: "±5%", ... }
 */
export function decodeResistor(value: string): ResistorSpec {
  // Normalize input
  const normalized = normalizeResistorValue(value);

  // Parse to numeric ohms
  const ohms = parseResistorValue(normalized);

  // Calculate color bands
  const bands = calculateColorBands(ohms);

  // Determine physical size based on power rating (assume 0.25W default)
  const physicalSize = determineSizeFromValue(ohms);

  return {
    type: 'resistor',
    value: normalized,
    resistance: ohms,
    bands,
    tolerance: '±5%', // Default gold band
    powerRating: '0.25W',
    physicalSize,
  };
}

/**
 * Normalize resistor value string
 * Handles: "10k", "10K", "10kΩ", "10kohm", "10000", "10000Ω"
 */
function normalizeResistorValue(value: string): string {
  let clean = value.toUpperCase()
    .replace(/Ω|OHM|OHMS/gi, '')
    .trim();

  // Handle suffix notation (k, K, M, R)
  if (clean.includes('K')) {
    clean = clean.replace('K', 'kΩ');
  } else if (clean.includes('M')) {
    clean = clean.replace('M', 'MΩ');
  } else if (clean.includes('R') && !clean.endsWith('R')) {
    // "4R7" means 4.7Ω
    clean = clean.replace('R', '.');
  } else if (!clean.includes('k') && !clean.includes('M')) {
    clean += 'Ω';
  }

  return clean;
}

/**
 * Parse resistor value to numeric ohms
 */
function parseResistorValue(value: string): number {
  const match = value.match(/^([\d.]+)\s*([kKmM]?)Ω?$/);

  if (!match) {
    throw new Error(`Invalid resistor value: ${value}`);
  }

  const [, numStr, unit] = match;
  const num = parseFloat(numStr);

  switch (unit.toLowerCase()) {
    case 'k':
      return num * 1000;
    case 'm':
      return num * 1000000;
    default:
      return num;
  }
}

/**
 * Calculate 4-band color code from resistance value
 */
function calculateColorBands(ohms: number): ColorBand[] {
  // Convert to scientific notation to find bands
  // Example: 10000Ω = 1.0 × 10^4 = brown(1), black(0), orange(3 zeros)

  const exp = Math.floor(Math.log10(ohms));
  const mantissa = ohms / Math.pow(10, exp);

  // Get first two significant digits
  const twoDigits = Math.round(mantissa * 10);
  const firstDigit = Math.floor(twoDigits / 10);
  const secondDigit = twoDigits % 10;

  // Multiplier is 10^(exp-1) because we already used 2 digits
  const multiplierExp = exp - 1;

  // Find color names from digits
  const band1 = digitToColor(firstDigit);
  const band2 = digitToColor(secondDigit);
  const band3 = multiplierToColor(multiplierExp);
  const band4: ColorBand = {
    color: 'gold',
    hex: COLOR_MAP.gold.hex,
    position: 3,
  };

  return [band1, band2, band3, band4];
}

/**
 * Convert digit (0-9) to color band
 */
function digitToColor(digit: number): ColorBand {
  const colors: ResistorColor[] = [
    'black', 'brown', 'red', 'orange', 'yellow',
    'green', 'blue', 'violet', 'grey', 'white'
  ];

  const color = colors[digit];
  return {
    color,
    hex: COLOR_MAP[color].hex,
    position: 0, // Position set by caller
  };
}

/**
 * Convert multiplier exponent to color
 */
function multiplierToColor(exp: number): ColorBand {
  const multiplierColors: Record<number, ResistorColor> = {
    0: 'black',
    1: 'brown',
    2: 'red',
    3: 'orange',
    4: 'yellow',
    5: 'green',
    6: 'blue',
    7: 'violet',
    -1: 'gold',
    -2: 'silver',
  };

  const color = multiplierColors[exp] || 'black';
  return {
    color,
    hex: COLOR_MAP[color].hex,
    position: 2,
  };
}

/**
 * Determine physical size category
 */
function determineSizeFromValue(ohms: number): 'small' | 'medium' | 'large' {
  // This is a simplification - in reality depends on power rating
  // High resistance (>1MΩ) or very low (<10Ω) tend to be larger
  if (ohms < 10 || ohms > 1000000) {
    return 'large';
  } else if (ohms < 100 || ohms > 100000) {
    return 'medium';
  } else {
    return 'small';
  }
}

/** Export default decoder */
export default decodeResistor;
```

## Capacitor Decoder Implementation

```typescript
// src/utils/decoders/capacitor-decoder.ts

import { CapacitorSpec } from '@/types/component-specs.types';

/**
 * Decodes capacitor value to visual specification
 *
 * @param value - Capacitor value (e.g., "100nF", "10µF", "0.1uF", "470pF")
 * @returns CapacitorSpec with type and appearance
 */
export function decodeCapacitor(value: string): CapacitorSpec {
  const normalized = normalizeCapacitorValue(value);
  const farads = parseCapacitorValue(normalized);

  // Determine type based on value
  const capType = determineCapacitorType(farads);
  const polarized = capType === 'electrolytic' || capType === 'tantalum';

  // Determine appearance
  const color = getCapacitorColor(capType);
  const physicalSize = determineCapSize(farads, capType);
  const marking = getCapacitorMarking(farads, capType);

  return {
    type: 'capacitor',
    value: normalized,
    capacitance: farads,
    capType,
    polarized,
    voltage: determineVoltage(farads, capType),
    physicalSize,
    color,
    marking,
  };
}

function normalizeCapacitorValue(value: string): string {
  // Handle various notations: uF, µF, nF, pF
  return value
    .replace(/uF|µF/i, 'µF')
    .replace(/nF/i, 'nF')
    .replace(/pF/i, 'pF')
    .trim();
}

function parseCapacitorValue(value: string): number {
  const match = value.match(/^([\d.]+)\s*([pnµu]?)F?$/i);

  if (!match) {
    throw new Error(`Invalid capacitor value: ${value}`);
  }

  const [, numStr, unit] = match;
  const num = parseFloat(numStr);

  switch (unit.toLowerCase()) {
    case 'p':
      return num * 1e-12; // picofarads
    case 'n':
      return num * 1e-9;  // nanofarads
    case 'µ':
    case 'u':
      return num * 1e-6;  // microfarads
    default:
      return num;         // farads
  }
}

function determineCapacitorType(farads: number): CapacitorSpec['capType'] {
  // General rules (not absolute, but good heuristic):
  // < 1nF: Usually ceramic
  // 1nF - 1µF: Ceramic or film
  // > 1µF: Usually electrolytic

  if (farads < 1e-9) {
    return 'ceramic';
  } else if (farads < 1e-6) {
    return 'film';
  } else {
    return 'electrolytic';
  }
}

function getCapacitorColor(type: CapacitorSpec['capType']): string {
  const colors = {
    ceramic: '#FFCC99',      // Tan/orange
    film: '#3399FF',         // Blue
    electrolytic: '#2C3E50', // Dark grey/black
    tantalum: '#FFA500',     // Orange
  };
  return colors[type];
}

function determineCapSize(farads: number, type: string): 'small' | 'medium' | 'large' {
  if (type === 'ceramic') {
    return 'small';
  } else if (type === 'film') {
    return farads > 1e-7 ? 'medium' : 'small';
  } else { // electrolytic
    if (farads < 10e-6) return 'small';
    if (farads < 100e-6) return 'medium';
    return 'large';
  }
}

function getCapacitorMarking(farads: number, type: string): string | undefined {
  if (type === 'ceramic') {
    // Ceramic caps use 3-digit code: XYZ = XY × 10^Z pF
    const pF = farads * 1e12;
    if (pF < 10) {
      return pF.toFixed(1); // e.g., "4.7"
    } else {
      const exp = Math.floor(Math.log10(pF));
      const mantissa = Math.round(pF / Math.pow(10, exp - 1));
      return `${mantissa}${exp}`;
    }
  }
  return undefined;
}

function determineVoltage(farads: number, type: string): string {
  // Default voltages by type
  if (type === 'ceramic' || type === 'film') {
    return '50V';
  } else {
    return farads > 100e-6 ? '16V' : '25V';
  }
}

export default decodeCapacitor;
```

## IC Decoder (Stub)

```typescript
// src/utils/decoders/ic-decoder.ts

import { ICSpec } from '@/types/component-specs.types';

/** IC database (simplified - expand as needed) */
const IC_DATABASE: Record<string, Omit<ICSpec, 'type' | 'value'>> = {
  'TL072': {
    partNumber: 'TL072',
    pinCount: 8,
    description: 'Dual JFET Op-Amp',
    pinout: [
      { number: 1, name: 'OUT1', description: 'Output 1' },
      { number: 2, name: 'IN1-', description: 'Inverting Input 1' },
      { number: 3, name: 'IN1+', description: 'Non-inverting Input 1' },
      { number: 4, name: 'V-', description: 'Negative Supply' },
      { number: 5, name: 'IN2+', description: 'Non-inverting Input 2' },
      { number: 6, name: 'IN2-', description: 'Inverting Input 2' },
      { number: 7, name: 'OUT2', description: 'Output 2' },
      { number: 8, name: 'V+', description: 'Positive Supply' },
    ],
  },
  'LM358': {
    partNumber: 'LM358',
    pinCount: 8,
    description: 'Dual Op-Amp',
    pinout: [
      { number: 1, name: 'OUT1', description: 'Output 1' },
      { number: 2, name: 'IN1-', description: 'Inverting Input 1' },
      { number: 3, name: 'IN1+', description: 'Non-inverting Input 1' },
      { number: 4, name: 'GND', description: 'Ground' },
      { number: 5, name: 'IN2+', description: 'Non-inverting Input 2' },
      { number: 6, name: 'IN2-', description: 'Inverting Input 2' },
      { number: 7, name: 'OUT2', description: 'Output 2' },
      { number: 8, name: 'VCC', description: 'Positive Supply' },
    ],
  },
  // Add more ICs as needed
};

export function decodeIC(partNumber: string): ICSpec {
  const normalized = partNumber.toUpperCase().trim();
  const icData = IC_DATABASE[normalized];

  if (!icData) {
    // Return generic IC if not in database
    return {
      type: 'ic',
      value: partNumber,
      partNumber: normalized,
      pinCount: 8,
      description: 'Integrated Circuit',
      pinout: [],
    };
  }

  return {
    type: 'ic',
    value: partNumber,
    ...icData,
  };
}

export default decodeIC;
```

## Testing Strategy

```typescript
// src/utils/decoders/__tests__/resistor-decoder.test.ts

import { decodeResistor } from '../resistor-decoder';

describe('Resistor Decoder', () => {
  test('decodes 10kΩ correctly', () => {
    const result = decodeResistor('10kΩ');

    expect(result.resistance).toBe(10000);
    expect(result.bands).toHaveLength(4);
    expect(result.bands[0].color).toBe('brown');  // 1
    expect(result.bands[1].color).toBe('black');  // 0
    expect(result.bands[2].color).toBe('orange'); // ×1k
    expect(result.bands[3].color).toBe('gold');   // ±5%
  });

  test('handles various notation formats', () => {
    expect(decodeResistor('10k').resistance).toBe(10000);
    expect(decodeResistor('10K').resistance).toBe(10000);
    expect(decodeResistor('10kohm').resistance).toBe(10000);
    expect(decodeResistor('10000').resistance).toBe(10000);
  });

  test('decodes 4.7kΩ correctly', () => {
    const result = decodeResistor('4.7kΩ');

    expect(result.resistance).toBe(4700);
    expect(result.bands[0].color).toBe('yellow');  // 4
    expect(result.bands[1].color).toBe('violet');  // 7
    expect(result.bands[2].color).toBe('red');     // ×100
  });

  test('decodes 1MΩ correctly', () => {
    const result = decodeResistor('1MΩ');

    expect(result.resistance).toBe(1000000);
    expect(result.bands[0].color).toBe('brown');   // 1
    expect(result.bands[1].color).toBe('black');   // 0
    expect(result.bands[2].color).toBe('green');   // ×100k
  });
});
```

## Deliverables (Phase 1, Work Stream A)

1. **Type definitions**: `src/types/component-specs.types.ts`
2. **Decoder implementations**:
   - `src/utils/decoders/resistor-decoder.ts`
   - `src/utils/decoders/capacitor-decoder.ts`
   - `src/utils/decoders/ic-decoder.ts`
   - `src/utils/decoders/diode-decoder.ts` (simplified)
   - `src/utils/decoders/index.ts` (barrel export)
3. **Tests**: Minimum 80% coverage
4. **Documentation**: JSDoc comments on all public functions

## Dependencies

**None** - This is Phase 1 work, no blockers.

## Handoff to Phase 2

After completion, create `HANDOFF.md` documenting:
- How to import decoders
- Example usage
- Known limitations
- Component types not yet supported

---

**Implementation Location:** `3-implementation/phase1-decoders/`
