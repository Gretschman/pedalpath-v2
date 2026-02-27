/**
 * Tests for the BOM → breadboard layout generator
 *
 * Phase 4 — Work Stream J: QA Testing
 */

import { describe, test, expect } from 'vitest';
import { generateBreadboardLayout } from '../bom-layout';
import type { BOMData } from '../../types/bom.types';

// ============================================================================
// Helpers
// ============================================================================

function makeBOM(overrides: Partial<BOMData> = {}): BOMData {
  return {
    components: [],
    confidence_score: 95,
    parsed_at: new Date(),
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('generateBreadboardLayout', () => {
  test('returns empty array for empty BOM', () => {
    const result = generateBreadboardLayout(makeBOM());
    expect(result).toHaveLength(0);
  });

  test('places a single resistor in row a', () => {
    const bom = makeBOM({
      components: [{
        component_type: 'resistor',
        value: '10k',
        quantity: 1,
        reference_designators: ['R1'],
      }],
    });
    const [placement] = generateBreadboardLayout(bom);
    expect(placement.type).toBe('resistor');
    expect(placement.label).toBe('R1');
    if (placement.type === 'resistor') {
      expect(placement.startHole).toMatch(/^a\d+$/);
      expect(placement.endHole).toMatch(/^a\d+$/);
    }
  });

  test('places a single capacitor in row c', () => {
    const bom = makeBOM({
      components: [{
        component_type: 'capacitor',
        value: '100nF',
        quantity: 1,
        reference_designators: ['C1'],
      }],
    });
    const [placement] = generateBreadboardLayout(bom);
    expect(placement.type).toBe('capacitor');
    if (placement.type === 'capacitor') {
      expect(placement.startHole).toMatch(/^c\d+$/);
    }
  });

  test('places an IC straddling rows e / f', () => {
    const bom = makeBOM({
      components: [{
        component_type: 'ic',
        value: 'TL072',
        quantity: 1,
        reference_designators: ['IC1'],
      }],
    });
    const [placement] = generateBreadboardLayout(bom);
    expect(placement.type).toBe('ic');
    if (placement.type === 'ic') {
      expect(placement.pin1Hole).toMatch(/^e\d+$/);
      expect(placement.bottomRowHole).toMatch(/^f\d+$/);
      expect(placement.pinCount).toBe(8);
    }
  });

  test('assigns 14 pins to TL074', () => {
    const bom = makeBOM({
      components: [{
        component_type: 'ic',
        value: 'TL074',
        quantity: 1,
        reference_designators: ['IC1'],
      }],
    });
    const [placement] = generateBreadboardLayout(bom);
    if (placement.type === 'ic') {
      expect(placement.pinCount).toBe(14);
    }
  });

  test('assigns 16 pins to PT2399', () => {
    const bom = makeBOM({
      components: [{
        component_type: 'ic',
        value: 'PT2399',
        quantity: 1,
        reference_designators: ['IC1'],
      }],
    });
    const [placement] = generateBreadboardLayout(bom);
    if (placement.type === 'ic') {
      expect(placement.pinCount).toBe(16);
    }
  });

  test('places a diode in row d', () => {
    const bom = makeBOM({
      components: [{
        component_type: 'diode',
        value: '1N4148',
        quantity: 1,
        reference_designators: ['D1'],
      }],
    });
    const [placement] = generateBreadboardLayout(bom);
    expect(placement.type).toBe('diode');
    if (placement.type === 'diode') {
      expect(placement.startHole).toMatch(/^d\d+$/);
    }
  });

  test('places LED type as led (not diode) in row d', () => {
    const bom = makeBOM({
      components: [{
        component_type: 'led',
        value: 'Red LED',
        quantity: 1,
        reference_designators: ['LED1'],
      }],
    });
    const [placement] = generateBreadboardLayout(bom);
    expect(placement.type).toBe('led');
    if (placement.type === 'led') {
      expect(placement.startHole).toMatch(/^d\d+$/);
    }
  });

  test('uses reference designators as labels', () => {
    const bom = makeBOM({
      components: [{
        component_type: 'resistor',
        value: '4.7k',
        quantity: 2,
        reference_designators: ['R1', 'R2'],
      }],
    });
    const placements = generateBreadboardLayout(bom);
    expect(placements).toHaveLength(2);
    expect(placements[0].label).toBe('R1');
    expect(placements[1].label).toBe('R2');
  });

  test('generates placements for a mixed BOM', () => {
    const bom = makeBOM({
      components: [
        { component_type: 'ic',        value: 'TL072',   quantity: 1, reference_designators: ['IC1'] },
        { component_type: 'resistor',  value: '10k',     quantity: 2, reference_designators: ['R1', 'R2'] },
        { component_type: 'capacitor', value: '100nF',   quantity: 1, reference_designators: ['C1'] },
        { component_type: 'diode',     value: '1N4148',  quantity: 1, reference_designators: ['D1'] },
      ],
      power: { voltage: '9V', polarity: 'center-negative' },
    });
    const placements = generateBreadboardLayout(bom);
    // 1 IC + 2 R + 1 C + 1 D + 2 jumper wires (VCC + GND)
    expect(placements.length).toBe(7);

    const types = placements.map(p => p.type);
    expect(types).toContain('ic');
    expect(types).toContain('resistor');
    expect(types).toContain('capacitor');
    expect(types).toContain('diode');
    expect(types).toContain('jumper');
  });

  test('all inline placement holes are in valid row+column format', () => {
    const bom = makeBOM({
      components: [
        { component_type: 'resistor',  value: '10k',   quantity: 3, reference_designators: ['R1', 'R2', 'R3'] },
        { component_type: 'capacitor', value: '100nF', quantity: 2, reference_designators: ['C1', 'C2'] },
        { component_type: 'diode',     value: '1N4148',quantity: 2, reference_designators: ['D1', 'D2'] },
      ],
    });
    const placements = generateBreadboardLayout(bom);
    for (const p of placements) {
      if (p.type !== 'ic') {
        expect(p.startHole).toMatch(/^[a-j]\d+$/);
        expect(p.endHole).toMatch(/^[a-j]\d+$/);
      }
    }
  });

  test('columns stay within board bounds (1-63)', () => {
    // Create a large BOM that could overflow
    const bom = makeBOM({
      components: [
        { component_type: 'resistor', value: '1k', quantity: 10, reference_designators: Array.from({ length: 10 }, (_, i) => `R${i + 1}`) },
      ],
    });
    const placements = generateBreadboardLayout(bom);
    for (const p of placements) {
      if (p.type !== 'ic' && p.type !== 'jumper') {
        const endCol = parseInt(p.endHole.slice(1));
        expect(endCol).toBeLessThanOrEqual(63);
      }
    }
  });

  test('generates VCC and GND jumper wires when IC is present with power', () => {
    const bom = makeBOM({
      components: [
        { component_type: 'ic', value: 'TL072', quantity: 1, reference_designators: ['IC1'] },
      ],
      power: { voltage: '9V', polarity: 'center-negative' },
    });
    const placements = generateBreadboardLayout(bom);
    const jumpers = placements.filter(p => p.type === 'jumper');

    expect(jumpers).toHaveLength(2);
    const colors = jumpers.map(j => j.type === 'jumper' ? j.color : null);
    expect(colors).toContain('red');
    expect(colors).toContain('black');
  });

  test('generates VCC and GND jumper wires for transistor-only circuit with power', () => {
    const bom = makeBOM({
      components: [
        { component_type: 'transistor', value: '2N5088', quantity: 1, reference_designators: ['Q1'] },
        { component_type: 'resistor',   value: '470k',   quantity: 1, reference_designators: ['R1'] },
      ],
      power: { voltage: '9V', polarity: 'center-negative' },
    });
    const placements = generateBreadboardLayout(bom);
    const jumpers = placements.filter(p => p.type === 'jumper');

    expect(jumpers).toHaveLength(2);
    const colors = jumpers.map(j => j.type === 'jumper' ? j.color : null);
    expect(colors).toContain('red');
    expect(colors).toContain('black');
  });

  test('generates no jumper wires for passive-only circuits', () => {
    const bom = makeBOM({
      components: [
        { component_type: 'resistor',  value: '10k',   quantity: 1, reference_designators: ['R1'] },
        { component_type: 'capacitor', value: '100nF', quantity: 1, reference_designators: ['C1'] },
      ],
      // No power field = passive circuit
    });
    const placements = generateBreadboardLayout(bom);
    const jumpers = placements.filter(p => p.type === 'jumper');
    expect(jumpers).toHaveLength(0);
  });

  test('IC jumper wire startHole targets the correct power rail format', () => {
    const bom = makeBOM({
      components: [
        { component_type: 'ic', value: 'TL072', quantity: 1, reference_designators: ['IC1'] },
      ],
      power: { voltage: '9V', polarity: 'center-negative' },
    });
    const placements = generateBreadboardLayout(bom);
    const jumpers = placements.filter(p => p.type === 'jumper');

    for (const j of jumpers) {
      if (j.type === 'jumper') {
        // startHole should be a power rail hole (+N or -N)
        expect(j.startHole).toMatch(/^[+-]\d+$/);
        // endHole should be a terminal strip hole
        expect(j.endHole).toMatch(/^[a-j]\d+$/);
      }
    }
  });
});
