/**
 * BomBreadboardView Component
 *
 * Integrates BOM data with the photorealistic BreadboardBase visualization.
 * Uses the decoder system (Phase 1) to convert component values into visual
 * specs, auto-lays them out on the board (bom-layout utility), and renders
 * the Phase 2 component SVGs (ResistorSVG, CapacitorSVG, ICSVG, DiodeSVG)
 * as an absolute-positioned overlay on top of BreadboardBase.
 *
 * The layout is a visual reference, not electrically routed — it shows the
 * user what their real components look like so they can identify and verify
 * them before building.
 *
 * Phase 4 — Work Stream I: End-to-End Integration
 */

import BreadboardBase from './BreadboardBase';
import { ResistorSVG, CapacitorSVG, ICSVG, DiodeSVG } from './components-svg';
import {
  encodeResistor,
  decodeResistor,
  decodeCapacitor,
  decodeIC,
  decodeDiode,
  decodeLED,
} from '@/utils/decoders';
import { holeToCoordinates, LAYOUT_830 } from '@/utils/breadboard-utils';
import { generateBreadboardLayout } from '@/utils/bom-layout';
import type { BOMData } from '@/types/bom.types';
import type { ResistorSpec, ICSpec } from '@/types/component-specs.types';

// ============================================================================
// Props
// ============================================================================

export interface BomBreadboardViewProps {
  /** BOM data from Claude Vision AI analysis */
  bomData: BOMData;
  /** Additional CSS class name */
  className?: string;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Parse a resistor value string ("10k", "4.7kΩ", "100", "1M", "330R") into
 * ohms. Returns null if the string cannot be parsed.
 */
function parseOhms(value: string): number | null {
  const cleaned = value
    .toLowerCase()
    .replace(/[ωΩ\s]/g, '')
    .replace('ohm', '')
    .replace('r', '');

  const match = cleaned.match(/^(\d+\.?\d*)(k|m)?$/);
  if (!match) return null;

  const [, num, unit] = match;
  const n = parseFloat(num);
  if (unit === 'k') return n * 1_000;
  if (unit === 'm') return n * 1_000_000;
  return n;
}

/** Convert a BOM resistor value string into a ResistorSpec, or null on failure. */
function getResistorSpec(value: string): ResistorSpec | null {
  try {
    const ohms = parseOhms(value) ?? 10_000; // fallback to 10 kΩ
    const encoded = encodeResistor(ohms, 5);
    // decodeResistor takes color-band string[]; use 4-band if available
    return decodeResistor(encoded.bands4 ?? encoded.bands5);
  } catch {
    return null;
  }
}

/** Build a minimal ICSpec for ICs not in the decoder database. */
function makeFallbackICSpec(value: string, pinCount: 8 | 14 | 16): ICSpec {
  return {
    type: 'ic',
    value,
    partNumber: value,
    pinCount,
    pinout: [],
    description: value,
  };
}

// ============================================================================
// Component
// ============================================================================

/**
 * Renders a photorealistic breadboard populated with the components from a
 * real BOM analysis. Each component is decoded to its visual spec and drawn
 * using the Phase 2 SVG component library.
 */
export default function BomBreadboardView({ bomData, className = '' }: BomBreadboardViewProps) {
  const placements = generateBreadboardLayout(bomData);
  const { totalWidth, totalHeight } = LAYOUT_830;

  // Collect all endpoint holes for highlighting on the base board
  const highlightHoles: string[] = placements.flatMap(p => {
    if (p.type === 'ic') return [p.pin1Hole];
    return [p.startHole, p.endHole];
  });

  const hasRenderableComponents = placements.length > 0;

  return (
    <div className={`w-full ${className}`}>
      {!hasRenderableComponents ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-500">
          <p className="font-medium mb-1">No components to display</p>
          <p className="text-sm">
            The BOM does not contain any resistors, capacitors, ICs, or diodes.
          </p>
        </div>
      ) : (
        <div className="relative w-full overflow-x-auto rounded-lg">
          <div className="relative" style={{ minWidth: 600 }}>
            {/* Realistic breadboard base */}
            <BreadboardBase size="830" highlightHoles={highlightHoles} />

            {/* Component SVG overlay — same viewBox as BreadboardBase */}
            <svg
              viewBox={`0 0 ${totalWidth} ${totalHeight}`}
              preserveAspectRatio="xMidYMid meet"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
              }}
            >
              {placements.map((placement, idx) => {
                try {
                  // ── Resistor ──────────────────────────────────────────────
                  if (placement.type === 'resistor') {
                    const spec = getResistorSpec(placement.value);
                    if (!spec) return null;
                    const start = holeToCoordinates(placement.startHole, LAYOUT_830);
                    const end   = holeToCoordinates(placement.endHole,   LAYOUT_830);
                    return (
                      <ResistorSVG
                        key={idx}
                        startX={start.x} startY={start.y}
                        endX={end.x}     endY={end.y}
                        spec={spec}
                        label={placement.label}
                      />
                    );
                  }

                  // ── Capacitor ─────────────────────────────────────────────
                  if (placement.type === 'capacitor') {
                    const spec  = decodeCapacitor(placement.value);
                    const start = holeToCoordinates(placement.startHole, LAYOUT_830);
                    const end   = holeToCoordinates(placement.endHole,   LAYOUT_830);
                    return (
                      <CapacitorSVG
                        key={idx}
                        startX={start.x} startY={start.y}
                        endX={end.x}     endY={end.y}
                        spec={spec}
                        label={placement.label}
                      />
                    );
                  }

                  // ── IC ────────────────────────────────────────────────────
                  if (placement.type === 'ic') {
                    const pin1      = holeToCoordinates(placement.pin1Hole,      LAYOUT_830);
                    const bottomRow = holeToCoordinates(placement.bottomRowHole, LAYOUT_830);

                    let spec: ICSpec;
                    try {
                      spec = decodeIC(placement.value);
                    } catch {
                      spec = makeFallbackICSpec(placement.value, placement.pinCount);
                    }

                    return (
                      <ICSVG
                        key={idx}
                        pin1X={pin1.x}        pin1Y={pin1.y}
                        bottomRowY={bottomRow.y}
                        pinCount={placement.pinCount}
                        spec={spec}
                        label={placement.label}
                      />
                    );
                  }

                  // ── Diode / LED ───────────────────────────────────────────
                  if (placement.type === 'diode' || placement.type === 'led') {
                    const start = holeToCoordinates(placement.startHole, LAYOUT_830);
                    const end   = holeToCoordinates(placement.endHole,   LAYOUT_830);

                    const spec = placement.type === 'led'
                      ? decodeLED('red', '5mm')
                      : (() => {
                          try { return decodeDiode(placement.value); }
                          catch { return decodeDiode('1N4148'); }
                        })();

                    return (
                      <DiodeSVG
                        key={idx}
                        startX={start.x} startY={start.y}
                        endX={end.x}     endY={end.y}
                        spec={spec}
                        label={placement.label}
                      />
                    );
                  }
                } catch {
                  // Silently skip components that fail to decode
                }

                return null;
              })}
            </svg>
          </div>
        </div>
      )}

      {/* Legend */}
      {hasRenderableComponents && (
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-600">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-yellow-400 border border-yellow-600"></span>
            Highlighted holes = component leads
          </span>
          <span className="text-gray-400">•</span>
          <span>Visual reference layout — not circuit-routed</span>
        </div>
      )}
    </div>
  );
}
