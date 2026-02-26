/**
 * Breadboard utilities test suite
 *
 * Tests coordinate calculations, hole validation, and connection mapping
 */

import { describe, it, expect } from 'vitest';
import {
  holeToCoordinates,
  isValidHoleId,
  getConnectedHoles,
  parseHoleId,
  getLayout,
  LAYOUT_830,
  LAYOUT_400,
  ROW_NAMES,
} from '../breadboard-utils';

describe('breadboard-utils', () => {
  describe('holeToCoordinates', () => {
    // MB102 physical spec: scale 24px = 2.54mm (9.449 px/mm)
    // terminalStripStart { x:92, y:188 } = board_margin(20,80) + origin_offset(72px,108px)
    // col N: x = 92 + (N-1)*24   |  row idx: y = 188 + idx*24 + (idx>=5 ? 48 : 0)

    it('calculates correct position for terminal strip hole a1', () => {
      const coords = holeToCoordinates('a1', LAYOUT_830);
      expect(coords).toEqual({ x: 92, y: 188 }); // x_to_col1=7.62mm=72px+20, y_to_rowA=11.43mm=108px+80
    });

    it('calculates correct position for terminal strip hole a15', () => {
      const coords = holeToCoordinates('a15', LAYOUT_830);
      expect(coords.x).toBe(428); // 92 + 14 * 24
      expect(coords.y).toBe(188);
    });

    it('calculates correct position for row f (after center gap)', () => {
      const coords = holeToCoordinates('f1', LAYOUT_830);
      expect(coords.x).toBe(92);
      // Row f is index 5, so: 188 + (5 * 24) + 48 (center gap = 5.08mm gutter)
      expect(coords.y).toBe(356);
    });

    it('calculates correct position for row j (last row)', () => {
      const coords = holeToCoordinates('j1', LAYOUT_830);
      expect(coords.x).toBe(92);
      // Row j is index 9, so: 188 + (9 * 24) + 48 (center gap)
      expect(coords.y).toBe(452);
    });

    it('calculates correct position for positive power rail', () => {
      const coords = holeToCoordinates('+10', LAYOUT_830);
      // Matrix-5: i=9, railStart=104, groupGap=floor(9/5)*24=24, centerBreak=0
      // x = 104 + 9*24 + 24 + 0 = 344
      expect(coords.x).toBe(344);
      expect(coords.y).toBe(116); // topPositive: y_to_rail_plus=3.81mm=36px + 80px margin
    });

    it('calculates correct position for ground power rail', () => {
      const coords = holeToCoordinates('-10', LAYOUT_830);
      expect(coords.x).toBe(344); // same x formula as positive rail
      expect(coords.y).toBe(140); // topGround: y_to_rail_minus=6.35mm=60px + 80px margin
    });

    it('handles 400-point breadboard coordinates', () => {
      const coords = holeToCoordinates('a30', LAYOUT_400);
      expect(coords.x).toBe(788); // 92 + 29 * 24
      expect(coords.y).toBe(188);
    });
  });

  describe('isValidHoleId', () => {
    describe('830-point breadboard', () => {
      it('validates correct terminal strip holes', () => {
        expect(isValidHoleId('a1', '830')).toBe(true);
        expect(isValidHoleId('a15', '830')).toBe(true);
        expect(isValidHoleId('j63', '830')).toBe(true);
        expect(isValidHoleId('e32', '830')).toBe(true);
      });

      it('rejects invalid row letters', () => {
        expect(isValidHoleId('k15', '830')).toBe(false);
        expect(isValidHoleId('z1', '830')).toBe(false);
        expect(isValidHoleId('A15', '830')).toBe(false); // Must be lowercase
      });

      it('rejects invalid column numbers', () => {
        expect(isValidHoleId('a0', '830')).toBe(false);
        expect(isValidHoleId('a64', '830')).toBe(false);
        expect(isValidHoleId('a100', '830')).toBe(false);
      });

      it('validates power rail holes', () => {
        expect(isValidHoleId('+1', '830')).toBe(true);
        expect(isValidHoleId('+10', '830')).toBe(true);
        expect(isValidHoleId('+50', '830')).toBe(true);   // max 50 holes per rail
        expect(isValidHoleId('-1', '830')).toBe(true);
        expect(isValidHoleId('-50', '830')).toBe(true);
      });

      it('rejects invalid power rail holes', () => {
        expect(isValidHoleId('+0', '830')).toBe(false);
        expect(isValidHoleId('+51', '830')).toBe(false);  // Matrix-5: only 50 holes
        expect(isValidHoleId('+63', '830')).toBe(false);  // 63 terminal cols ≠ rail holes
        expect(isValidHoleId('-51', '830')).toBe(false);
        expect(isValidHoleId('-63', '830')).toBe(false);
      });

      it('rejects malformed hole IDs', () => {
        expect(isValidHoleId('', '830')).toBe(false);
        expect(isValidHoleId('abc', '830')).toBe(false);
        expect(isValidHoleId('15a', '830')).toBe(false);
        expect(isValidHoleId('a', '830')).toBe(false);
        expect(isValidHoleId('15', '830')).toBe(false);
      });
    });

    describe('400-point breadboard', () => {
      it('validates correct holes within 30 column limit', () => {
        expect(isValidHoleId('a1', '400')).toBe(true);
        expect(isValidHoleId('a30', '400')).toBe(true);
        expect(isValidHoleId('j30', '400')).toBe(true);
      });

      it('rejects holes beyond 30 column limit', () => {
        expect(isValidHoleId('a31', '400')).toBe(false);
        expect(isValidHoleId('a63', '400')).toBe(false);
        expect(isValidHoleId('+31', '400')).toBe(false);
      });
    });
  });

  describe('getConnectedHoles', () => {
    it('returns connected holes for row a-e (upper section)', () => {
      const connected = getConnectedHoles('a15', '830');
      expect(connected).toEqual(['a15', 'b15', 'c15', 'd15', 'e15']);
    });

    it('returns connected holes for row f-j (lower section)', () => {
      const connected = getConnectedHoles('f15', '830');
      expect(connected).toEqual(['f15', 'g15', 'h15', 'i15', 'j15']);
    });

    it('does NOT connect across center gap', () => {
      const connectedE = getConnectedHoles('e15', '830');
      const connectedF = getConnectedHoles('f15', '830');

      expect(connectedE).not.toContain('f15');
      expect(connectedF).not.toContain('e15');
    });

    it('returns all positive power rail holes', () => {
      const connected = getConnectedHoles('+10', '830');
      expect(connected).toHaveLength(50);  // Matrix-5: 50 holes per rail
      expect(connected).toContain('+1');
      expect(connected).toContain('+10');
      expect(connected).toContain('+50');
    });

    it('returns all ground power rail holes', () => {
      const connected = getConnectedHoles('-10', '830');
      expect(connected).toHaveLength(50);  // Matrix-5: 50 holes per rail
      expect(connected).toContain('-1');
      expect(connected).toContain('-10');
      expect(connected).toContain('-50');
    });

    it('power rails are not connected to each other', () => {
      const positiveConnected = getConnectedHoles('+10', '830');
      const groundConnected = getConnectedHoles('-10', '830');

      expect(positiveConnected).not.toContain('-10');
      expect(groundConnected).not.toContain('+10');
    });

    it('handles 400-point breadboard (25 rail holes)', () => {
      const connected = getConnectedHoles('+10', '400');
      expect(connected).toHaveLength(25);  // First half of Matrix-5, no center break
      expect(connected[0]).toBe('+1');
      expect(connected[24]).toBe('+25');
    });
  });

  describe('parseHoleId', () => {
    it('parses terminal strip holes correctly', () => {
      expect(parseHoleId('a15')).toEqual({
        type: 'terminal',
        row: 'a',
        column: 15,
      });

      expect(parseHoleId('j63')).toEqual({
        type: 'terminal',
        row: 'j',
        column: 63,
      });
    });

    it('parses positive power rail holes', () => {
      expect(parseHoleId('+10')).toEqual({
        type: 'power',
        rail: 'positive',
        column: 10,
      });
    });

    it('parses ground power rail holes', () => {
      expect(parseHoleId('-10')).toEqual({
        type: 'power',
        rail: 'ground',
        column: 10,
      });
    });

    it('returns null for invalid hole IDs', () => {
      expect(parseHoleId('')).toBeNull();
      expect(parseHoleId('abc')).toBeNull();
      expect(parseHoleId('15a')).toBeNull();
      expect(parseHoleId('k15')).toBeNull();
    });
  });

  describe('getLayout', () => {
    it('returns 830-point layout', () => {
      const layout = getLayout('830');
      expect(layout.columns).toBe(63);
      expect(layout.totalWidth).toBe(1600); // 165.1mm → 1560px + 40px canvas margin
    });

    it('returns 400-point layout', () => {
      const layout = getLayout('400');
      expect(layout.columns).toBe(30);
      expect(layout.totalWidth).toBe(800);
    });

    it('both layouts have same hole spacing', () => {
      const layout830 = getLayout('830');
      const layout400 = getLayout('400');
      expect(layout830.holeSpacing).toBe(layout400.holeSpacing);
      expect(layout830.holeSpacing).toBe(24);
    });

    it('both layouts have same center gap', () => {
      const layout830 = getLayout('830');
      const layout400 = getLayout('400');
      expect(layout830.centerGap).toBe(layout400.centerGap);
      expect(layout830.centerGap).toBe(48);
    });
  });

  describe('ROW_NAMES constant', () => {
    it('has exactly 10 rows', () => {
      expect(ROW_NAMES).toHaveLength(10);
    });

    it('includes all correct row letters', () => {
      expect(ROW_NAMES).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']);
    });
  });

  describe('Layout constants', () => {
    it('LAYOUT_830 has correct dimensions', () => {
      expect(LAYOUT_830.columns).toBe(63);
      expect(LAYOUT_830.rowsPerSection).toBe(5);
      expect(LAYOUT_830.sections).toBe(2);
      expect(LAYOUT_830.holeSpacing).toBe(24);
      expect(LAYOUT_830.powerRailHoles).toBe(50);  // Matrix-5
    });

    it('LAYOUT_400 has correct dimensions', () => {
      expect(LAYOUT_400.columns).toBe(30);
      expect(LAYOUT_400.rowsPerSection).toBe(5);
      expect(LAYOUT_400.sections).toBe(2);
      expect(LAYOUT_400.powerRailHoles).toBe(25);  // First half of Matrix-5
    });

    it('power rail Y coordinates are correctly ordered', () => {
      const { powerRailY } = LAYOUT_830;
      // Physical MB102 layout: outer (+) rail closer to board edge than inner (−) rail.
      // Top half (smaller Y = closer to top edge):   topPositive < topGround
      // Bottom half (smaller Y = closer to terminal): bottomGround < bottomPositive
      expect(powerRailY.topPositive).toBeLessThan(powerRailY.topGround);
      expect(powerRailY.topGround).toBeLessThan(powerRailY.bottomGround);
      expect(powerRailY.bottomGround).toBeLessThan(powerRailY.bottomPositive);
    });
  });
});
