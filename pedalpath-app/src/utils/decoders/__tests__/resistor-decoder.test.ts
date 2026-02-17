/**
 * Resistor decoder test suite
 * Ported from Python test_decoders.py
 *
 * Tests cover:
 *  - 5-band and 4-band decoding
 *  - All tolerance colors
 *  - Silver/gold multipliers
 *  - Encode + round-trip
 *  - E-series validation
 *  - All common pedal values
 *  - Error handling
 *  - Color aliases
 */

import { describe, it, expect } from 'vitest';
import {
  decodeResistor,
  encodeResistor,
  findESeries,
  formatOhms,
  TOLERANCE_TO_COLOR,
} from '../resistor-decoder';

// Helper for approximate comparison (accounts for float precision)
function approx(a: number, b: number, rel = 0.001): boolean {
  if (b === 0) return Math.abs(a) < rel;
  return Math.abs(a - b) / Math.max(Math.abs(b), 1e-12) < rel;
}

describe('Resistor Decoder: 5-Band Decode', () => {
  const cases: Array<[string[], number, number]> = [
    [['brown', 'black', 'black', 'black', 'brown'], 100, 1.0],
    [['brown', 'black', 'black', 'brown', 'brown'], 1000, 1.0],
    [['yellow', 'violet', 'black', 'red', 'brown'], 47000, 1.0],
    [['brown', 'black', 'black', 'yellow', 'brown'], 1000000, 1.0],
    [['green', 'blue', 'black', 'black', 'brown'], 560, 1.0],
    [['red', 'red', 'black', 'red', 'brown'], 22000, 1.0],
    [['orange', 'orange', 'black', 'orange', 'brown'], 330000, 1.0],
  ];

  cases.forEach(([bands, ohms, tol]) => {
    it(`decodes ${formatOhms(ohms)} correctly`, () => {
      const result = decodeResistor(bands);
      expect(approx(result.ohms, ohms)).toBe(true);
      expect(result.tolerancePercent).toBe(tol);
    });
  });
});

describe('Resistor Decoder: 4-Band Decode', () => {
  const cases: Array<[string[], number, number]> = [
    [['yellow', 'violet', 'orange', 'gold'], 47000, 5.0],
    [['brown', 'black', 'red', 'silver'], 1000, 10.0],
    [['yellow', 'violet', 'gold', 'gold'], 4.7, 5.0],
    [['red', 'red', 'orange', 'silver'], 22000, 10.0],
  ];

  cases.forEach(([bands, ohms, tol]) => {
    it(`decodes ${formatOhms(ohms)} correctly`, () => {
      const result = decodeResistor(bands);
      expect(approx(result.ohms, ohms)).toBe(true);
      expect(result.tolerancePercent).toBe(tol);
    });
  });
});

describe('Resistor Decoder: All Tolerance Colors', () => {
  const base = ['brown', 'black', 'black', 'red']; // 10k
  const expected: Record<string, number> = {
    brown: 1.0,
    red: 2.0,
    green: 0.5,
    blue: 0.25,
    violet: 0.1,
    gray: 0.05,
    gold: 5.0,
    silver: 10.0,
  };

  Object.entries(expected).forEach(([color, pct]) => {
    it(`${color} = ±${pct}%`, () => {
      const result = decodeResistor([...base, color]);
      expect(result.tolerancePercent).toBe(pct);
    });
  });
});

describe('Resistor Decoder: Silver/Gold Multipliers', () => {
  it('decodes silver multiplier: 470*0.01=4.7Ω', () => {
    const result = decodeResistor(['yellow', 'violet', 'black', 'silver', 'brown']);
    expect(approx(result.ohms, 4.7)).toBe(true);
  });

  it('decodes gold multiplier: 47*0.1=4.7Ω', () => {
    const result = decodeResistor(['yellow', 'violet', 'gold', 'gold']);
    expect(approx(result.ohms, 4.7)).toBe(true);
  });
});

describe('Resistor Encoder: Encode + Round-Trip', () => {
  const cases: Array<[number, number]> = [
    [47000, 1.0],
    [4700, 5.0],
    [560, 1.0],
    [1000000, 2.0],
    [22000, 10.0],
    [4.7, 5.0],
  ];

  cases.forEach(([ohms, tol]) => {
    it(`encodes and round-trips ${formatOhms(ohms)}`, () => {
      const encoded = encodeResistor(ohms, tol);
      expect(encoded.bands5).toHaveLength(5);

      const decoded = decodeResistor(encoded.bands5);
      expect(approx(decoded.ohms, ohms)).toBe(true);
    });
  });
});

describe('Resistor Encoder: All Tolerances', () => {
  Object.entries(TOLERANCE_TO_COLOR).forEach(([pct, color]) => {
    it(`±${pct}% → ${color}`, () => {
      const encoded = encodeResistor(10000, Number(pct));
      expect(encoded.toleranceColor).toBe(color);
    });
  });
});

describe('Resistor Encoder: 4-Band Encode', () => {
  it('47k has 4-band representation', () => {
    const encoded = encodeResistor(47000, 5.0);
    expect(encoded.bands4).toBeDefined();

    if (encoded.bands4) {
      const decoded = decodeResistor(encoded.bands4);
      expect(approx(decoded.ohms, 47000)).toBe(true);
    }
  });

  it('475Ω has no 4-band (3 sig digits)', () => {
    const encoded = encodeResistor(475, 1.0);
    expect(encoded.bands4).toBeUndefined();
  });
});

describe('Resistor Decoder: E-Series Validation', () => {
  const e12Values = [100, 120, 150, 220, 330, 470, 1000, 4700, 10000, 47000, 100000];

  e12Values.forEach((value) => {
    it(`${formatOhms(value)} is E12`, () => {
      const [series] = findESeries(value);
      expect(series).toBe('E12');
    });
  });

  const nonStandardValues = [47300, 123456];

  nonStandardValues.forEach((value) => {
    it(`${formatOhms(value)} is non-standard with nearest value`, () => {
      const [series, nearest] = findESeries(value);
      expect(series).toBeNull();
      expect(nearest).not.toBeNull();
    });
  });
});

describe('Resistor Decoder: All Common Pedal Values', () => {
  const values = [
    100, 220, 330, 470, 560, 680, 1000, 1500, 2200, 3300, 4700, 5600, 6800,
    10000, 15000, 22000, 33000, 47000, 68000, 100000, 150000, 220000,
    330000, 390000, 470000, 680000, 1000000, 2200000, 4700000, 10000000,
    4.7, 10, 22, 47,
  ];

  it('all common pedal resistors round-trip successfully', () => {
    let fails = 0;

    for (const value of values) {
      try {
        const encoded = encodeResistor(value, 1.0);
        const decoded = decodeResistor(encoded.bands5);
        if (!approx(decoded.ohms, value)) fails++;
      } catch {
        fails++;
      }
    }

    expect(fails).toBe(0);
  });
});

describe('Resistor Decoder: Error Handling', () => {
  it('throws on 3 bands', () => {
    expect(() => decodeResistor(['red', 'red', 'red'])).toThrow();
  });

  it('throws on 6 bands', () => {
    expect(() => decodeResistor(['red', 'red', 'red', 'red', 'red', 'red'])).toThrow();
  });

  it('throws on bad color', () => {
    expect(() => decodeResistor(['red', 'pink', 'blue', 'brown', 'gold'])).toThrow();
  });

  it('throws on empty array', () => {
    expect(() => decodeResistor([])).toThrow();
  });

  it('throws on bad tolerance percent', () => {
    expect(() => encodeResistor(10000, 3.0)).toThrow();
  });

  it('throws on zero ohms', () => {
    expect(() => encodeResistor(0, 1.0)).toThrow();
  });
});

describe('Resistor Decoder: Color Aliases', () => {
  it('violet/purple and grey/gray are interchangeable', () => {
    const r1 = decodeResistor(['violet', 'grey', 'black', 'red', 'brown']);
    const r2 = decodeResistor(['purple', 'gray', 'black', 'red', 'brown']);
    expect(r1.ohms).toBe(r2.ohms);
  });
});

describe('Resistor Utility: formatOhms', () => {
  it('formats 47000 as "47 kΩ"', () => {
    expect(formatOhms(47000)).toMatch(/47.*k.*Ω/i);
  });

  it('formats 1000000 as "1 MΩ"', () => {
    expect(formatOhms(1000000)).toMatch(/1.*M.*Ω/i);
  });

  it('formats 100 as "100 Ω"', () => {
    expect(formatOhms(100)).toMatch(/100.*Ω/);
  });
});
