/**
 * BomBreadboardView Component
 *
 * Integrates BOM data with the SVG BreadboardBase visualization.
 * Auto-lays out components, renders them as SVG overlays, and adds
 * offboard representations for audio jacks and potentiometers.
 *
 * Phase 4 — Work Stream I: End-to-End Integration
 */

import BreadboardBase from './BreadboardBase';
import { ResistorSVG, CapacitorSVG, ICSVG, DiodeSVG, TransistorSVG } from './components-svg';
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
import type { ResistorSpec, ICSpec, TransistorSpec } from '@/types/component-specs.types';

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

function getResistorSpec(value: string): ResistorSpec | null {
  try {
    const ohms = parseOhms(value) ?? 10_000;
    const encoded = encodeResistor(ohms, 5);
    return decodeResistor(encoded.bands4 ?? encoded.bands5);
  } catch {
    return null;
  }
}

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

/** Build a minimal TransistorSpec from a BOM value string. */
function makeTransistorSpec(value: string): TransistorSpec {
  return {
    type: 'transistor',
    value,
    partNumber: value,
    transistorType: 'bjt-npn',
    package: 'TO-92',
    pinout: ['E', 'B', 'C'],
  };
}

// ============================================================================
// Offboard Components
// ============================================================================

/**
 * Renders input/output jacks and potentiometers outside the board area.
 * Uses the existing 1700×566 viewBox — jacks fit in the left/right margins.
 */
function OffboardComponents({ bomData }: { bomData: BOMData }) {
  const midY = 371; // vertical center of the terminal strip area

  // Collect potentiometers from BOM
  const pots = bomData.components.filter(c => c.component_type === 'potentiometer');

  // Board column 1 and 63 x-coordinates
  const col1X = LAYOUT_830.terminalStripStart.x;          // 103
  const col63X = LAYOUT_830.terminalStripStart.x + 62 * LAYOUT_830.holeSpacing; // 1591

  // Jack dimensions
  const jackW = 46;
  const jackH = 52;

  return (
    <g className="offboard-components">
      {/* ── Input Jack (left of board) ───────────────────────── */}
      <g className="input-jack">
        {/* Green signal wire: jack → col 1 */}
        <line
          x1={72} y1={midY}
          x2={col1X} y2={midY}
          stroke="#22CC44" strokeWidth="2.5" strokeLinecap="round"
          opacity="0.85"
        />

        {/* Jack body */}
        <rect
          x={12} y={midY - jackH / 2}
          width={jackW} height={jackH}
          fill="#444444" stroke="#222222" strokeWidth="1"
          rx={5}
        />

        {/* Tip dot */}
        <circle cx={35} cy={midY - 10} r={5} fill="#888888" />
        {/* Sleeve dot */}
        <circle cx={35} cy={midY + 10} r={5} fill="#555555" />

        {/* "IN" label */}
        <text
          x={35} y={midY + 28}
          textAnchor="middle"
          fontSize="10" fontFamily="Arial, sans-serif" fontWeight="700"
          fill="#FFFFFF"
        >
          IN
        </text>
      </g>

      {/* ── Output Jack (right of board) ─────────────────────── */}
      <g className="output-jack">
        {/* Orange signal wire: col 63 → jack */}
        <line
          x1={col63X} y1={midY}
          x2={1628} y2={midY}
          stroke="#FF8800" strokeWidth="2.5" strokeLinecap="round"
          opacity="0.85"
        />

        {/* Jack body */}
        <rect
          x={1628} y={midY - jackH / 2}
          width={jackW} height={jackH}
          fill="#444444" stroke="#222222" strokeWidth="1"
          rx={5}
        />

        {/* Tip dot */}
        <circle cx={1651} cy={midY - 10} r={5} fill="#888888" />
        {/* Sleeve dot */}
        <circle cx={1651} cy={midY + 10} r={5} fill="#555555" />

        {/* "OUT" label */}
        <text
          x={1651} y={midY + 28}
          textAnchor="middle"
          fontSize="10" fontFamily="Arial, sans-serif" fontWeight="700"
          fill="#FFFFFF"
        >
          OUT
        </text>
      </g>

      {/* ── Potentiometers (right of board, stacked vertically) ─ */}
      {pots.slice(0, 3).map((pot, i) => {
        const potY = midY - 80 + i * 70;
        const potX = 1648;
        const refDes = pot.reference_designators[0] ?? `VR${i + 1}`;

        return (
          <g key={i} className="potentiometer">
            {/* Gray wire from board to pot */}
            <line
              x1={col63X} y1={potY}
              x2={1636} y2={potY}
              stroke="#999999" strokeWidth="1.5" strokeLinecap="round"
              opacity="0.7"
            />
            {/* Pot body (circle) */}
            <circle cx={potX} cy={potY} r={16} fill="#888888" stroke="#555555" strokeWidth="1" />
            {/* Wiper line */}
            <line
              x1={potX - 8} y1={potY}
              x2={potX + 8} y2={potY}
              stroke="#DDDDDD" strokeWidth="1.5"
            />
            {/* Label */}
            <text
              x={potX} y={potY + 4}
              textAnchor="middle"
              fontSize="8" fontFamily="Arial, sans-serif" fontWeight="600"
              fill="#FFFFFF"
            >
              {refDes}
            </text>
          </g>
        );
      })}
    </g>
  );
}

// ============================================================================
// Component
// ============================================================================

export default function BomBreadboardView({ bomData, className = '' }: BomBreadboardViewProps) {
  const placements = generateBreadboardLayout(bomData);
  const { totalWidth, totalHeight } = LAYOUT_830;

  // Collect highlighted holes for the base board
  const highlightHoles: string[] = placements.flatMap(p => {
    if (p.type === 'ic') return [p.pin1Hole];
    if (p.type === 'transistor') return [p.eHole, p.bHole, p.cHole];
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
          <div className="relative" style={{ minWidth: 1200 }}>
            {/* SVG breadboard base */}
            <BreadboardBase size="830" highlightHoles={highlightHoles} />

            {/* Component overlay — same viewBox as BreadboardBase */}
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
              {/* Offboard jacks and pots */}
              <OffboardComponents bomData={bomData} />

              {/* Board components */}
              {placements.map((placement, idx) => {
                try {
                  // ── Resistor ────────────────────────────────────────────
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

                  // ── Capacitor ──────────────────────────────────────────
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

                  // ── IC ────────────────────────────────────────────────
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

                  // ── Diode / LED ───────────────────────────────────────
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

                  // ── Transistor ────────────────────────────────────────
                  if (placement.type === 'transistor') {
                    const bPin = holeToCoordinates(placement.bHole, LAYOUT_830);
                    const spec = makeTransistorSpec(placement.value);
                    return (
                      <TransistorSVG
                        key={idx}
                        x={bPin.x}
                        y={bPin.y}
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
            <span className="inline-block w-10 h-2.5 rounded" style={{ background: '#D2B48C' }}></span>
            Resistor
          </span>
          <span className="text-gray-300">|</span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: '#D4A574' }}></span>
            Capacitor
          </span>
          <span className="text-gray-300">|</span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-5 h-3 rounded" style={{ background: '#1A1A1A' }}></span>
            Transistor/IC
          </span>
          <span className="text-gray-300">|</span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-yellow-400 border border-yellow-600"></span>
            Highlighted = component lead
          </span>
        </div>
      )}
    </div>
  );
}
