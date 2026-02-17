/**
 * Capacitor decoder test suite
 * Ported from Python test_decoders.py
 *
 * Tests cover:
 *  - EIA 3-digit codes
 *  - Alphanumeric codes
 *  - R-decimal notation
 *  - Electrolytic markings
 *  - Unit conversion
 *  - Type classification
 *  - Encode + round-trip
 *  - All tolerance codes
 *  - Error handling
 */

import { describe, it, expect } from 'vitest';
import {
  decodeCapacitor,
  encodeCapacitor,
  decodeWithType,
  pfToUnits,
  nfToUnits,
  ufToUnits,
} from '../capacitor-decoder';
import { CapType } from '@/types/component-specs.types';

// Helper for approximate comparison (accounts for float precision)
function approx(a: number, b: number, rel = 0.001): boolean {
  if (b === 0) return Math.abs(a) < rel;
  return Math.abs(a - b) / Math.max(Math.abs(b), 1e-12) < rel;
}

describe('Capacitor Decoder: EIA 3-Digit Decode', () => {
  const cases: Array<[string, number, number | undefined, number | undefined]> = [
    ['473', 47000, undefined, undefined],
    ['223', 22000, undefined, undefined],
    ['104', 100000, undefined, undefined],
    ['471', 470, undefined, undefined],
    ['222', 2200, undefined, undefined],
    ['100', 10, undefined, undefined],
    ['220', 22, undefined, undefined],
    ['473J250', 47000, 5.0, 250],
    ['223K100', 22000, 10.0, 100],
    ['104M', 100000, 20.0, undefined],
  ];

  cases.forEach(([marking, pf, tol, volt]) => {
    it(`decodes "${marking}" correctly`, () => {
      const result = decodeCapacitor(marking);
      expect(approx(result.capacitance.pf, pf)).toBe(true);

      if (tol !== undefined) {
        expect(result.tolerancePercent).toBe(tol);
      }

      if (volt !== undefined) {
        expect(result.voltageMax).toBe(volt);
      }
    });
  });
});

describe('Capacitor Decoder: Alphanumeric Decode', () => {
  const cases: Array<[string, number]> = [
    ['47n', 47000],
    ['47nF', 47000],
    ['47nK100', 47000],
    ['0.047uF', 47000],
    ['100p', 100],
    ['22n', 22000],
    ['0.1uF', 100000],
    ['10nJ63', 10000],
  ];

  cases.forEach(([marking, pf]) => {
    it(`decodes "${marking}" correctly`, () => {
      const result = decodeCapacitor(marking);
      expect(approx(result.capacitance.pf, pf)).toBe(true);
    });
  });
});

describe('Capacitor Decoder: R-Decimal Notation', () => {
  const cases: Array<[string, number]> = [
    ['4n7', 4700],
    ['2n2', 2200],
    ['1n5', 1500],
    ['4p7', 4.7],
    ['1n0', 1000],
  ];

  cases.forEach(([marking, pf]) => {
    it(`decodes "${marking}" correctly`, () => {
      const result = decodeCapacitor(marking);
      expect(approx(result.capacitance.pf, pf)).toBe(true);
    });
  });
});

describe('Capacitor Decoder: Electrolytic Decode', () => {
  const cases: Array<[string, number, number]> = [
    ['47uF 25V', 47e6, 25],
    ['100uF/16V', 100e6, 16],
    ['10u 50V', 10e6, 50],
    ['220uF 35V', 220e6, 35],
    ['1uF 50V', 1e6, 50],
  ];

  cases.forEach(([marking, pf, volt]) => {
    it(`decodes "${marking}" as electrolytic`, () => {
      const result = decodeCapacitor(marking);
      expect(result.capType).toBe(CapType.Electrolytic);
      expect(approx(result.capacitance.pf, pf)).toBe(true);
      expect(result.voltageMax).toBe(volt);
    });
  });
});

describe('Capacitor Decoder: Unit Conversion', () => {
  it('converts 47000pF to 47nF', () => {
    const units = pfToUnits(47000);
    expect(approx(units.nf, 47)).toBe(true);
  });

  it('converts 47000pF to 0.047uF', () => {
    const units = pfToUnits(47000);
    expect(approx(units.uf, 0.047)).toBe(true);
  });

  it('converts 100nF to 100000pF', () => {
    const units = nfToUnits(100);
    expect(approx(units.pf, 100000)).toBe(true);
  });

  it('converts 100nF to 0.1uF', () => {
    const units = nfToUnits(100);
    expect(approx(units.uf, 0.1)).toBe(true);
  });

  it('converts 10uF to 10000nF', () => {
    const units = ufToUnits(10);
    expect(approx(units.nf, 10000)).toBe(true);
  });

  it('converts 10uF to 10000000pF', () => {
    const units = ufToUnits(10);
    expect(approx(units.pf, 10000000)).toBe(true);
  });
});

describe('Capacitor Decoder: Type Classification', () => {
  it('classifies 470pF as ceramic', () => {
    const result = decodeCapacitor('471'); // 470pF
    expect(result.capType).toBe(CapType.Ceramic);
  });

  it('classifies 47nF as film_box', () => {
    const result = decodeCapacitor('473'); // 47nF
    expect(result.capType).toBe(CapType.FilmBox);
  });

  it('classifies 47uF as electrolytic', () => {
    const result = decodeCapacitor('47uF 25V');
    expect(result.capType).toBe(CapType.Electrolytic);
  });

  it('allows type override with decodeWithType', () => {
    const result = decodeWithType('104', CapType.Ceramic);
    expect(result.capType).toBe(CapType.Ceramic);
  });
});

describe('Capacitor Encoder: Encode + Round-Trip', () => {
  const cases: Array<{
    value: { pf?: number; nf?: number };
    tol: number;
    volt?: number;
    expEIA: string;
  }> = [
    { value: { nf: 47 }, tol: 10.0, volt: 100, expEIA: '473K100' },
    { value: { nf: 22 }, tol: 5.0, volt: 250, expEIA: '223J250' },
    { value: { pf: 470 }, tol: 10.0, expEIA: '471K' },
    { value: { nf: 4.7 }, tol: 5.0, volt: 63, expEIA: '472J63' },
  ];

  cases.forEach(({ value, tol, volt, expEIA }) => {
    const label = value.nf ? `${value.nf}nF` : `${value.pf}pF`;

    it(`encodes ${label} correctly`, () => {
      const encoded = encodeCapacitor({
        ...value,
        tolerancePercent: tol,
        voltage: volt,
      });

      expect(encoded.fullFilmCode).toBe(expEIA);
      // Alpha code should contain tolerance letter and voltage (if provided)
      expect(encoded.fullAlphaCode).toContain(tol === 5.0 ? 'J' : 'K');
      if (volt) {
        expect(encoded.fullAlphaCode).toContain(String(volt));
      }
    });

    it(`round-trips ${label} via EIA code`, () => {
      const encoded = encodeCapacitor({
        ...value,
        tolerancePercent: tol,
        voltage: volt,
      });

      const decoded = decodeCapacitor(encoded.fullFilmCode);
      const origPF = value.pf ?? (value.nf! * 1000);
      expect(approx(decoded.capacitance.pf, origPF)).toBe(true);
    });
  });
});

describe('Capacitor Decoder: Common Pedal Values Round-Trip', () => {
  const nfValues = [0.47, 1, 2.2, 3.3, 4.7, 10, 22, 33, 47, 68, 100, 220, 470];

  it('all common pedal cap values round-trip successfully', () => {
    let fails = 0;

    for (const nf of nfValues) {
      try {
        const encoded = encodeCapacitor({
          nf,
          tolerancePercent: 10.0,
          voltage: 100,
        });

        const decoded = decodeCapacitor(encoded.fullFilmCode);
        if (!approx(decoded.capacitance.nf, nf)) fails++;
      } catch {
        fails++;
      }
    }

    expect(fails).toBe(0);
  });
});

describe('Capacitor Decoder: All Tolerance Codes Decode', () => {
  const letters = ['J', 'K', 'M', 'F', 'G'];

  letters.forEach((letter) => {
    it(`recognizes tolerance ${letter}`, () => {
      const marking = `473${letter}100`;
      const result = decodeCapacitor(marking);
      expect(result.tolerancePercent).toBeDefined();
    });
  });
});

describe('Capacitor Decoder: Error Handling', () => {
  it('throws on empty string', () => {
    expect(() => decodeCapacitor('')).toThrow();
  });

  it('throws on nonsense marking', () => {
    expect(() => decodeCapacitor('XYZZY')).toThrow();
  });

  it('throws on bad tolerance for encode', () => {
    expect(() =>
      encodeCapacitor({ nf: 47, tolerancePercent: 3.0 })
    ).toThrow();
  });

  it('throws when no value provided for encode', () => {
    expect(() =>
      encodeCapacitor({ tolerancePercent: 10.0 })
    ).toThrow();
  });

  it('throws when multiple values provided for encode', () => {
    expect(() =>
      encodeCapacitor({ nf: 47, pf: 47000, tolerancePercent: 10.0 })
    ).toThrow();
  });
});

describe('Capacitor Decoder: Polarized Detection', () => {
  it('marks electrolytic as polarized', () => {
    const result = decodeCapacitor('47uF 25V');
    expect(result.polarized).toBe(true);
  });

  it('marks film caps as non-polarized', () => {
    const result = decodeCapacitor('473'); // 47nF film
    expect(result.polarized).toBe(false);
  });

  it('marks ceramic caps as non-polarized', () => {
    const result = decodeCapacitor('104'); // 100nF
    expect(result.polarized).toBe(false);
  });
});
