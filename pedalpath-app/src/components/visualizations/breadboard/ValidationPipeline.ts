/**
 * ValidationPipeline.ts
 *
 * 6-stage validation between AI output and breadboard renderer.
 * Runs before every render. Returns structured errors for iterative correction
 * (max 5 correction cycles before giving up).
 *
 * Stages:
 *   1 — Schema validation       (required fields present)
 *   2 — Occupancy grid          (no two leads share a tie-point)
 *   3 — Lead spacing            (physical spacing constraints per component type)
 *   4 — Body overlap            (AABB collision detection between component bodies)
 *   5 — Electrical connectivity (STUB — requires full netlist)
 *   6 — Strip connectivity      (stripboard only — STUB — requires cut map)
 */

import {
  LAYOUT_830,
  holeToCoordinates,
  isValidHoleId,
  parseHoleId,
} from '../../../utils/breadboard-utils';
import type {
  ComponentPlacement,
  InlinePlacement,
  ICPlacement,
  TransistorPlacement,
  JumperWirePlacement,
} from '../../../utils/bom-layout';

// ============================================================================
// Public types
// ============================================================================

export interface ValidationError {
  /** Stage number (1–6) */
  stage: number;
  /** Human-readable stage name */
  stageName: string;
  /** Component reference designator, e.g. "R1". Empty string for board-level errors. */
  componentRef: string;
  /** Description of the problem */
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  /** True only when errors array is empty */
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  /** Stage numbers that completed without errors */
  passedStages: number[];
}

// ============================================================================
// Internal helpers
// ============================================================================

/** Extract the reference designator from a placement label (e.g. "R1 10k" → "R1"). */
function refFromLabel(label?: string): string {
  if (!label) return '';
  return label.split(' ')[0] ?? label;
}

/** Collect every hole ID a placement occupies (leads only — not the body). */
function placementHoles(p: ComponentPlacement): string[] {
  switch (p.type) {
    case 'resistor':
    case 'capacitor':
    case 'diode':
    case 'led':
      return [p.startHole, p.endHole];
    case 'transistor':
      return [p.eHole, p.bHole, p.cHole];
    case 'ic': {
      // DIP IC: pins straddle the center gap.
      // pin1Hole is top-left (row e); bottomRowHole is bottom-left (row f).
      // Collect all pin holes for a simplified occupancy check.
      const icP = p as ICPlacement;
      const topRow = icP.pin1Hole[0];       // 'e'
      const botRow = icP.bottomRowHole[0];  // 'f'
      const startCol = parseInt(icP.pin1Hole.substring(1));
      const half = icP.pinCount / 2;
      const holes: string[] = [];
      for (let i = 0; i < half; i++) {
        holes.push(`${topRow}${startCol + i}`);
        holes.push(`${botRow}${startCol + i}`);
      }
      return holes;
    }
    case 'jumper':
      return [p.startHole, p.endHole];
    default:
      return [];
  }
}

/** Parse column number from a terminal-strip hole ID ("a15" → 15). Returns NaN for power rails. */
function colFromHole(holeId: string): number {
  const parsed = parseHoleId(holeId);
  if (!parsed) return NaN;
  return parsed.column;
}

// ============================================================================
// Stage implementations
// ============================================================================

function stage1_schema(
  placements: ComponentPlacement[],
  errors: ValidationError[],
  warnings: ValidationError[],
): void {
  for (const p of placements) {
    const ref = 'label' in p ? refFromLabel((p as { label?: string }).label) : '';

    // All placements must have a type
    if (!p.type) {
      errors.push({
        stage: 1, stageName: 'Schema',
        componentRef: ref,
        message: 'Placement is missing required field: type',
        severity: 'error',
      });
      continue;
    }

    // Inline components (resistor, capacitor, diode, led) need startHole + endHole
    if (['resistor', 'capacitor', 'diode', 'led'].includes(p.type)) {
      const ip = p as InlinePlacement;
      if (!ip.startHole || !ip.endHole) {
        errors.push({
          stage: 1, stageName: 'Schema',
          componentRef: ref,
          message: `${p.type} is missing startHole or endHole`,
          severity: 'error',
        });
      }
      if (!ip.value) {
        warnings.push({
          stage: 1, stageName: 'Schema',
          componentRef: ref,
          message: `${p.type} has no value string`,
          severity: 'warning',
        });
      }
    }

    // Transistor needs eHole, bHole, cHole
    if (p.type === 'transistor') {
      const tp = p as TransistorPlacement;
      if (!tp.eHole || !tp.bHole || !tp.cHole) {
        errors.push({
          stage: 1, stageName: 'Schema',
          componentRef: ref,
          message: 'transistor is missing eHole, bHole, or cHole',
          severity: 'error',
        });
      }
    }

    // IC needs pin1Hole, bottomRowHole, pinCount
    if (p.type === 'ic') {
      const ic = p as ICPlacement;
      if (!ic.pin1Hole || !ic.bottomRowHole) {
        errors.push({
          stage: 1, stageName: 'Schema',
          componentRef: ref,
          message: 'ic is missing pin1Hole or bottomRowHole',
          severity: 'error',
        });
      }
      if (![8, 14, 16].includes(ic.pinCount)) {
        errors.push({
          stage: 1, stageName: 'Schema',
          componentRef: ref,
          message: `ic has invalid pinCount: ${ic.pinCount} (must be 8, 14, or 16)`,
          severity: 'error',
        });
      }
    }

    // Jumper needs startHole + endHole + color
    if (p.type === 'jumper') {
      const jp = p as JumperWirePlacement;
      if (!jp.startHole || !jp.endHole) {
        errors.push({
          stage: 1, stageName: 'Schema',
          componentRef: '',
          message: 'jumper is missing startHole or endHole',
          severity: 'error',
        });
      }
      if (!jp.color) {
        warnings.push({
          stage: 1, stageName: 'Schema',
          componentRef: '',
          message: 'jumper has no color specified',
          severity: 'warning',
        });
      }
    }
  }
}

function stage2_occupancy(
  placements: ComponentPlacement[],
  errors: ValidationError[],
  boardSize: '830' | '400',
): void {
  // Map from holeId → first componentRef that claimed it
  const occupied = new Map<string, string>();

  for (const p of placements) {
    const ref = 'label' in p ? refFromLabel((p as { label?: string }).label) : '';
    const holes = placementHoles(p);

    for (const holeId of holes) {
      // Validate hole ID format
      if (!isValidHoleId(holeId, boardSize)) {
        errors.push({
          stage: 2, stageName: 'Occupancy',
          componentRef: ref,
          message: `hole ID "${holeId}" is not valid for a ${boardSize}-point board`,
          severity: 'error',
        });
        continue;
      }

      const existing = occupied.get(holeId);
      if (existing !== undefined) {
        errors.push({
          stage: 2, stageName: 'Occupancy',
          componentRef: ref,
          message: `tie-point collision between "${ref}" and "${existing}" at hole ${holeId}`,
          severity: 'error',
        });
      } else {
        occupied.set(holeId, ref || p.type);
      }
    }
  }
}

function stage3_leadSpacing(
  placements: ComponentPlacement[],
  errors: ValidationError[],
  warnings: ValidationError[],
): void {
  for (const p of placements) {
    const ref = 'label' in p ? refFromLabel((p as { label?: string }).label) : '';

    // ── Inline components: check hole span ────────────────────────────────
    if (['resistor', 'capacitor', 'diode', 'led'].includes(p.type)) {
      const ip = p as InlinePlacement;
      const startCol = colFromHole(ip.startHole);
      const endCol   = colFromHole(ip.endHole);

      if (isNaN(startCol) || isNaN(endCol)) continue; // power rail holes — skip span check
      const span = Math.abs(endCol - startCol); // number of hole pitches between leads

      if (p.type === 'resistor') {
        // 1/4W resistor: minimum 3 holes apart (3 pitches), preferred 5, max 10
        if (span < 3) {
          errors.push({
            stage: 3, stageName: 'LeadSpacing',
            componentRef: ref,
            message: `resistor lead span is ${span} holes — minimum is 3 (5 preferred for 1/4W)`,
            severity: 'error',
          });
        } else if (span < 5) {
          warnings.push({
            stage: 3, stageName: 'LeadSpacing',
            componentRef: ref,
            message: `resistor lead span is ${span} holes — 5 holes preferred for 1/4W body`,
            severity: 'warning',
          });
        } else if (span > 10) {
          warnings.push({
            stage: 3, stageName: 'LeadSpacing',
            componentRef: ref,
            message: `resistor lead span is ${span} holes — exceeds practical max of 10 for 1/4W leads`,
            severity: 'warning',
          });
        }
      }

      if (p.type === 'capacitor') {
        // Electrolytic ≤100µF: 1 hole (2.5mm pitch), 100–470µF: 2 holes (5mm)
        // Detect from value — simple heuristic
        const val = ip.value.toLowerCase().replace(/\s/g, '');
        const matchUf = val.match(/^(\d+\.?\d*)[uµ]/i);
        if (matchUf) {
          const uf = parseFloat(matchUf[1]);
          if (uf <= 100 && span > 2) {
            warnings.push({
              stage: 3, stageName: 'LeadSpacing',
              componentRef: ref,
              message: `electrolytic cap ≤100µF has span ${span} holes — expected 1–2 holes (2.5–5mm pitch)`,
              severity: 'warning',
            });
          } else if (uf > 100 && uf <= 470 && span > 3) {
            warnings.push({
              stage: 3, stageName: 'LeadSpacing',
              componentRef: ref,
              message: `electrolytic cap ${uf}µF has span ${span} holes — expected 2–3 holes (5mm pitch)`,
              severity: 'warning',
            });
          }
        }
      }
    }

    // ── Transistor: must occupy exactly 3 consecutive holes ───────────────
    if (p.type === 'transistor') {
      const tp = p as TransistorPlacement;
      const eCol = colFromHole(tp.eHole);
      const bCol = colFromHole(tp.bHole);
      const cCol = colFromHole(tp.cHole);

      if (!isNaN(eCol) && !isNaN(bCol) && !isNaN(cCol)) {
        if (bCol !== eCol + 1 || cCol !== eCol + 2) {
          errors.push({
            stage: 3, stageName: 'LeadSpacing',
            componentRef: ref,
            message: `TO-92 transistor pins must be in 3 consecutive holes (e=${eCol}, b=${bCol}, c=${cCol})`,
            severity: 'error',
          });
        }
      }
    }

    // ── IC: pin1Hole must be in row 'e', bottomRowHole in row 'f' ─────────
    if (p.type === 'ic') {
      const ic = p as ICPlacement;
      const topRow = ic.pin1Hole[0];
      const botRow = ic.bottomRowHole[0];

      if (topRow !== 'e') {
        errors.push({
          stage: 3, stageName: 'LeadSpacing',
          componentRef: ref,
          message: `DIP IC pin1Hole must be in row 'e' to straddle center gap (got row '${topRow}')`,
          severity: 'error',
        });
      }
      if (botRow !== 'f') {
        errors.push({
          stage: 3, stageName: 'LeadSpacing',
          componentRef: ref,
          message: `DIP IC bottomRowHole must be in row 'f' to straddle center gap (got row '${botRow}')`,
          severity: 'error',
        });
      }
    }
  }
}

/** Simple AABB bounding box */
interface AABB {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  ref: string;
}

function stage4_bodyOverlap(
  placements: ComponentPlacement[],
  warnings: ValidationError[],
): void {
  const BODY_HALF_H = 11; // ~half the component body height in px (22px total = 2.3mm dia)
  const BODY_MARGIN = 2;  // 2px clearance before flagging as overlap

  const boxes: AABB[] = [];

  for (const p of placements) {
    const ref = 'label' in p ? refFromLabel((p as { label?: string }).label) : '';
    if (p.type === 'jumper') continue; // wires don't have physical bodies

    try {
      let box: AABB | null = null;

      if (['resistor', 'capacitor', 'diode', 'led'].includes(p.type)) {
        const ip = p as InlinePlacement;
        const s = holeToCoordinates(ip.startHole, LAYOUT_830);
        const e = holeToCoordinates(ip.endHole,   LAYOUT_830);
        box = {
          x1: Math.min(s.x, e.x),
          y1: Math.min(s.y, e.y) - BODY_HALF_H,
          x2: Math.max(s.x, e.x),
          y2: Math.max(s.y, e.y) + BODY_HALF_H,
          ref,
        };
      } else if (p.type === 'transistor') {
        const tp = p as TransistorPlacement;
        const e = holeToCoordinates(tp.eHole, LAYOUT_830);
        const c = holeToCoordinates(tp.cHole, LAYOUT_830);
        // TO-92 body sits above the holes
        box = {
          x1: e.x - 12,
          y1: e.y - 90, // body extends ~90px above row d
          x2: c.x + 12,
          y2: e.y + 6,
          ref,
        };
      } else if (p.type === 'ic') {
        const ic = p as ICPlacement;
        const pin1 = holeToCoordinates(ic.pin1Hole, LAYOUT_830);
        const botRow = holeToCoordinates(ic.bottomRowHole, LAYOUT_830);
        const half = ic.pinCount / 2;
        box = {
          x1: pin1.x - 6,
          y1: pin1.y - 6,
          x2: pin1.x + (half - 1) * LAYOUT_830.holeSpacing + 6,
          y2: botRow.y + 6,
          ref,
        };
      }

      if (box) {
        // Check against all previously processed boxes
        for (const prev of boxes) {
          const overlapX = box.x1 < prev.x2 - BODY_MARGIN && box.x2 > prev.x1 + BODY_MARGIN;
          const overlapY = box.y1 < prev.y2 - BODY_MARGIN && box.y2 > prev.y1 + BODY_MARGIN;
          if (overlapX && overlapY) {
            warnings.push({
              stage: 4, stageName: 'BodyOverlap',
              componentRef: ref,
              message: `body of "${ref}" overlaps with "${prev.ref}" — may be too crowded`,
              severity: 'warning',
            });
          }
        }
        boxes.push(box);
      }
    } catch {
      // holeToCoordinates can throw for invalid IDs — already caught in stage 2
    }
  }
}

function stage5_electricalConnectivity(warnings: ValidationError[]): void {
  // Stage 5 requires a full netlist which is not yet available.
  // Emit a single informational warning and mark as passed.
  warnings.push({
    stage: 5,
    stageName: 'ElectricalConnectivity',
    componentRef: '',
    message: 'Stage 5 (electrical connectivity) is not yet implemented — skipping',
    severity: 'warning',
  });
}

function stage6_stripConnectivity(isStripboard: boolean, warnings: ValidationError[]): void {
  if (!isStripboard) return;

  // Stage 6 requires a cut map which is not yet passed into the pipeline.
  warnings.push({
    stage: 6,
    stageName: 'StripConnectivity',
    componentRef: '',
    message: 'Stage 6 (strip connectivity) requires cut map data — skipping',
    severity: 'warning',
  });
}

// ============================================================================
// Public entry point
// ============================================================================

/**
 * Validate an array of component placements through 6 stages before rendering.
 *
 * @param placements  - Array of ComponentPlacement objects from generateBreadboardLayout()
 * @param boardSize   - '830' (default) or '400'
 * @param isStripboard - Enable Stage 6 strip-connectivity checks (default false)
 * @returns ValidationResult — check `.valid` and `.errors` before rendering
 */
export function validatePlacements(
  placements: ComponentPlacement[],
  boardSize: '830' | '400' = '830',
  isStripboard = false,
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const passedStages: number[] = [];

  // Stage 1 — Schema validation
  const pre1Errors = errors.length;
  stage1_schema(placements, errors, warnings);
  if (errors.length === pre1Errors) passedStages.push(1);

  // Stage 2 — Occupancy grid
  const pre2Errors = errors.length;
  stage2_occupancy(placements, errors, boardSize);
  if (errors.length === pre2Errors) passedStages.push(2);

  // Stage 3 — Lead spacing
  const pre3Errors = errors.length;
  stage3_leadSpacing(placements, errors, warnings);
  if (errors.length === pre3Errors) passedStages.push(3);

  // Stage 4 — Body overlap (warnings only — never blocks render)
  const pre4Warnings = warnings.length;
  stage4_bodyOverlap(placements, warnings);
  passedStages.push(4); // stage 4 never produces errors, always passes

  // Stage 5 — Electrical connectivity (stub)
  const pre5Warnings = warnings.length;
  stage5_electricalConnectivity(warnings);
  passedStages.push(5); // stub always passes

  // Stage 6 — Strip connectivity (stub, stripboard only)
  stage6_stripConnectivity(isStripboard, warnings);
  passedStages.push(6); // stub always passes

  // Suppress unused-variable warnings from TypeScript
  void pre4Warnings;
  void pre5Warnings;

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    passedStages,
  };
}
