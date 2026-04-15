import { describe, it, expect } from 'vitest';
import { computeDifficulty } from '@/utils/difficulty-scorer';
import type { BOMData, BOMComponent } from '@/types/bom.types';

function makeBOM(components: BOMComponent[]): BOMData {
  return {
    components,
    parsed_at: new Date('2026-04-14'),
    confidence_score: 85,
  };
}

function comp(overrides: Partial<BOMComponent> & Pick<BOMComponent, 'component_type' | 'value' | 'quantity'>): BOMComponent {
  return {
    reference_designators: [],
    ...overrides,
  };
}

// ── Fixture: LPB-1 single-transistor boost ──────────────────────────────
const lpb1BOM = makeBOM([
  comp({ component_type: 'transistor', value: '2N5088', quantity: 1, reference_designators: ['Q1'], package: 'to92' }),
  comp({ component_type: 'resistor', value: '10k', quantity: 2, reference_designators: ['R1', 'R2'] }),
  comp({ component_type: 'resistor', value: '390k', quantity: 1, reference_designators: ['R3'] }),
  comp({ component_type: 'resistor', value: '100', quantity: 1, reference_designators: ['R4'] }),
  comp({ component_type: 'resistor', value: '1M', quantity: 1, reference_designators: ['R5'] }),
  comp({ component_type: 'capacitor', value: '100nF', quantity: 1, reference_designators: ['C1'], package: 'film' }),
  comp({ component_type: 'capacitor', value: '47uF', quantity: 1, reference_designators: ['C2'], package: 'electrolytic' }),
  comp({ component_type: 'capacitor', value: '100uF', quantity: 1, reference_designators: ['C3'], package: 'electrolytic' }),
  comp({ component_type: 'diode', value: '1N4001', quantity: 1, reference_designators: ['D1'] }),
  // Off-board (excluded from count)
  comp({ component_type: 'input-jack', value: '1/4" mono', quantity: 1, reference_designators: ['J1'] }),
  comp({ component_type: 'output-jack', value: '1/4" mono', quantity: 1, reference_designators: ['J2'] }),
  comp({ component_type: 'dc-jack', value: '2.1mm', quantity: 1, reference_designators: ['J3'] }),
  comp({ component_type: 'footswitch', value: '3PDT', quantity: 1, reference_designators: ['SW1'] }),
]);

// ── Fixture: Tube Screamer ──────────────────────────────────────────────
const tubeScreamerBOM = makeBOM([
  comp({ component_type: 'ic', value: 'TL072', quantity: 1, reference_designators: ['U1'], package: 'dip8' }),
  comp({ component_type: 'resistor', value: '10k', quantity: 4, reference_designators: ['R1', 'R2', 'R3', 'R4'] }),
  comp({ component_type: 'resistor', value: '4.7k', quantity: 3, reference_designators: ['R5', 'R6', 'R7'] }),
  comp({ component_type: 'resistor', value: '510', quantity: 2, reference_designators: ['R8', 'R9'] }),
  comp({ component_type: 'resistor', value: '100k', quantity: 1, reference_designators: ['R10'] }),
  comp({ component_type: 'capacitor', value: '47nF', quantity: 3, reference_designators: ['C1', 'C2', 'C3'], package: 'film' }),
  comp({ component_type: 'capacitor', value: '100nF', quantity: 2, reference_designators: ['C4', 'C5'], package: 'film' }),
  comp({ component_type: 'capacitor', value: '47uF', quantity: 2, reference_designators: ['C6', 'C7'], package: 'electrolytic' }),
  comp({ component_type: 'capacitor', value: '1uF', quantity: 1, reference_designators: ['C8'], package: 'film' }),
  comp({ component_type: 'diode', value: '1N914', quantity: 2, reference_designators: ['D1', 'D2'] }),
  comp({ component_type: 'diode', value: '1N4001', quantity: 1, reference_designators: ['D3'] }),
  comp({ component_type: 'potentiometer', value: '500k', quantity: 1, reference_designators: ['RV1'] }),
  comp({ component_type: 'potentiometer', value: '20k', quantity: 1, reference_designators: ['RV2'] }),
  comp({ component_type: 'input-jack', value: '1/4" mono', quantity: 1, reference_designators: ['J1'] }),
  comp({ component_type: 'output-jack', value: '1/4" mono', quantity: 1, reference_designators: ['J2'] }),
  comp({ component_type: 'footswitch', value: '3PDT', quantity: 1, reference_designators: ['SW1'] }),
]);

// ── Fixture: Big Muff ───────────────────────────────────────────────────
const bigMuffBOM = makeBOM([
  comp({ component_type: 'transistor', value: '2N5088', quantity: 4, reference_designators: ['Q1', 'Q2', 'Q3', 'Q4'], package: 'to92' }),
  comp({ component_type: 'resistor', value: '10k', quantity: 6, reference_designators: ['R1', 'R2', 'R3', 'R4', 'R5', 'R6'] }),
  comp({ component_type: 'resistor', value: '100k', quantity: 5, reference_designators: ['R7', 'R8', 'R9', 'R10', 'R11'] }),
  comp({ component_type: 'resistor', value: '470k', quantity: 4, reference_designators: ['R12', 'R13', 'R14', 'R15'] }),
  comp({ component_type: 'resistor', value: '8.2k', quantity: 2, reference_designators: ['R16', 'R17'] }),
  comp({ component_type: 'resistor', value: '39k', quantity: 2, reference_designators: ['R18', 'R19'] }),
  comp({ component_type: 'resistor', value: '150', quantity: 1, reference_designators: ['R20'] }),
  comp({ component_type: 'capacitor', value: '100nF', quantity: 4, reference_designators: ['C1', 'C2', 'C3', 'C4'], package: 'film' }),
  comp({ component_type: 'capacitor', value: '47nF', quantity: 2, reference_designators: ['C5', 'C6'], package: 'film' }),
  comp({ component_type: 'capacitor', value: '4nF', quantity: 2, reference_designators: ['C7', 'C8'], package: 'film' }),
  comp({ component_type: 'capacitor', value: '10nF', quantity: 1, reference_designators: ['C9'], package: 'film' }),
  comp({ component_type: 'capacitor', value: '1uF', quantity: 1, reference_designators: ['C10'], package: 'electrolytic' }),
  comp({ component_type: 'diode', value: '1N914', quantity: 4, reference_designators: ['D1', 'D2', 'D3', 'D4'] }),
  comp({ component_type: 'diode', value: '1N4001', quantity: 1, reference_designators: ['D5'] }),
  comp({ component_type: 'led', value: 'red', quantity: 1, reference_designators: ['LED1'], package: 'led-5mm' }),
  comp({ component_type: 'potentiometer', value: '100k', quantity: 2, reference_designators: ['RV1', 'RV2'] }),
  comp({ component_type: 'potentiometer', value: '25k', quantity: 1, reference_designators: ['RV3'] }),
  comp({ component_type: 'input-jack', value: '1/4" mono', quantity: 1, reference_designators: ['J1'] }),
  comp({ component_type: 'output-jack', value: '1/4" mono', quantity: 1, reference_designators: ['J2'] }),
  comp({ component_type: 'footswitch', value: '3PDT', quantity: 1, reference_designators: ['SW1'] }),
]);

// ── Fixture: Complex build (charge pump + germanium + trim pot) ─────────
const complexBOM = makeBOM([
  comp({ component_type: 'ic', value: 'MAX1044', quantity: 1, reference_designators: ['U1'], package: 'dip8' }),
  comp({ component_type: 'ic', value: 'TL072', quantity: 2, reference_designators: ['U2', 'U3'], package: 'dip8' }),
  comp({ component_type: 'transistor', value: 'AC128', quantity: 2, reference_designators: ['Q1', 'Q2'], package: 'to92', material: 'Ge' }),
  comp({ component_type: 'transistor', value: '2N3904', quantity: 1, reference_designators: ['Q3'], package: 'to92' }),
  comp({ component_type: 'resistor', value: '10k', quantity: 8, reference_designators: ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8'] }),
  comp({ component_type: 'resistor', value: '100k', quantity: 4, reference_designators: ['R9', 'R10', 'R11', 'R12'] }),
  comp({ component_type: 'resistor', value: '1M', quantity: 2, reference_designators: ['R13', 'R14'] }),
  comp({ component_type: 'resistor', value: '4.7k', quantity: 2, reference_designators: ['R15', 'R16'] }),
  comp({ component_type: 'capacitor', value: '100nF', quantity: 3, reference_designators: ['C1', 'C2', 'C3'], package: 'film' }),
  comp({ component_type: 'capacitor', value: '10uF', quantity: 3, reference_designators: ['C4', 'C5', 'C6'], package: 'electrolytic' }),
  comp({ component_type: 'capacitor', value: '47uF', quantity: 2, reference_designators: ['C7', 'C8'], package: 'electrolytic' }),
  comp({ component_type: 'diode', value: '1N914', quantity: 4, reference_designators: ['D1', 'D2', 'D3', 'D4'] }),
  comp({ component_type: 'diode', value: '1N4001', quantity: 1, reference_designators: ['D5'] }),
  comp({ component_type: 'led', value: 'blue', quantity: 1, reference_designators: ['LED1'], package: 'led-5mm' }),
  comp({ component_type: 'potentiometer', value: '100k', quantity: 2, reference_designators: ['RV1', 'RV2'] }),
  comp({ component_type: 'potentiometer', value: '10k trim', quantity: 1, reference_designators: ['RV3'], notes: 'bias trim' }),
  comp({ component_type: 'input-jack', value: '1/4" mono', quantity: 1, reference_designators: ['J1'] }),
  comp({ component_type: 'output-jack', value: '1/4" mono', quantity: 1, reference_designators: ['J2'] }),
  comp({ component_type: 'dc-jack', value: '2.1mm', quantity: 1, reference_designators: ['J3'] }),
  comp({ component_type: 'footswitch', value: '3PDT', quantity: 1, reference_designators: ['SW1'] }),
]);

describe('computeDifficulty', () => {
  describe('LPB-1 single-transistor boost', () => {
    it('should be beginner level', () => {
      const result = computeDifficulty(lpb1BOM);
      expect(result.level).toBe('beginner');
    });

    it('should have a numeric score under 5', () => {
      const result = computeDifficulty(lpb1BOM);
      expect(result.numericScore).toBeLessThan(5);
    });

    it('should list contributing factors', () => {
      const result = computeDifficulty(lpb1BOM);
      expect(result.factors.length).toBeGreaterThan(0);
      expect(result.factors.every(f => f.label && f.points > 0)).toBe(true);
    });
  });

  describe('Tube Screamer', () => {
    it('should be intermediate level', () => {
      const result = computeDifficulty(tubeScreamerBOM);
      expect(result.level).toBe('intermediate');
    });

    it('should score between 5 and 9 inclusive', () => {
      const result = computeDifficulty(tubeScreamerBOM);
      expect(result.numericScore).toBeGreaterThanOrEqual(5);
      expect(result.numericScore).toBeLessThan(10);
    });

    it('should include IC factor', () => {
      const result = computeDifficulty(tubeScreamerBOM);
      const icFactor = result.factors.find(f => f.label.includes('IC'));
      expect(icFactor).toBeDefined();
      expect(icFactor!.points).toBe(1);
    });
  });

  describe('Big Muff', () => {
    it('should be intermediate or advanced', () => {
      const result = computeDifficulty(bigMuffBOM);
      expect(['intermediate', 'advanced']).toContain(result.level);
    });

    it('should include transistor factor', () => {
      const result = computeDifficulty(bigMuffBOM);
      const tFactor = result.factors.find(f => f.label.includes('transistor'));
      expect(tFactor).toBeDefined();
      expect(tFactor!.points).toBe(3); // 4 * 0.75
    });

    it('should include polarized component factor', () => {
      const result = computeDifficulty(bigMuffBOM);
      const pFactor = result.factors.find(f => f.label.includes('polarized'));
      expect(pFactor).toBeDefined();
    });
  });

  describe('Complex build (charge pump + germanium + trim pot)', () => {
    it('should be advanced level', () => {
      const result = computeDifficulty(complexBOM);
      expect(result.level).toBe('advanced');
    });

    it('should score 10 or higher', () => {
      const result = computeDifficulty(complexBOM);
      expect(result.numericScore).toBeGreaterThanOrEqual(10);
    });

    it('should include charge pump factor', () => {
      const result = computeDifficulty(complexBOM);
      const cpFactor = result.factors.find(f => f.label.includes('Charge pump'));
      expect(cpFactor).toBeDefined();
      expect(cpFactor!.points).toBe(1.5);
    });

    it('should include germanium factor', () => {
      const result = computeDifficulty(complexBOM);
      const geFactor = result.factors.find(f => f.label.includes('Germanium'));
      expect(geFactor).toBeDefined();
      expect(geFactor!.points).toBe(1);
    });

    it('should include trim pot factor', () => {
      const result = computeDifficulty(complexBOM);
      const trimFactor = result.factors.find(f => f.label.includes('Trim'));
      expect(trimFactor).toBeDefined();
      expect(trimFactor!.points).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('should handle empty BOM', () => {
      const result = computeDifficulty(makeBOM([]));
      expect(result.level).toBe('beginner');
      expect(result.numericScore).toBe(1); // 0 components = 1pt bracket
      expect(result.factors).toHaveLength(1);
    });

    it('should exclude off-board components from count', () => {
      const offBoardOnly = makeBOM([
        comp({ component_type: 'input-jack', value: '1/4"', quantity: 1, reference_designators: ['J1'] }),
        comp({ component_type: 'output-jack', value: '1/4"', quantity: 1, reference_designators: ['J2'] }),
        comp({ component_type: 'footswitch', value: '3PDT', quantity: 1, reference_designators: ['SW1'] }),
      ]);
      const result = computeDifficulty(offBoardOnly);
      expect(result.factors[0].label).toContain('0 on-board');
    });
  });
});
