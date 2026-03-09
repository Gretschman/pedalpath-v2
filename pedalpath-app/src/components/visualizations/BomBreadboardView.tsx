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
import { ResistorSVG, CapacitorSVG, ICSVG, DiodeSVG, TransistorSVG, WireSVG } from './components-svg';
import type { WireColor } from './components-svg';
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
import type { BOMData, BomSection } from '@/types/bom.types';
import type { ResistorSpec, ICSpec, TransistorSpec } from '@/types/component-specs.types';

// ============================================================================
// Props
// ============================================================================

export interface BomBreadboardViewProps {
  /** BOM data from Claude Vision AI analysis */
  bomData: BOMData;
  /** When set, only these component types render at full opacity; others dim to 15% */
  focusComponentTypes?: string[];
  /** When set, only render components whose section is in this list (cumulative build view) */
  visibleSections?: BomSection[];
  /** Highlight components in this section as the "current" step — renders brighter with glow */
  highlightSection?: BomSection;
  /** Additional CSS class name */
  className?: string;
  /** Column to highlight in grid labels */
  activeCol?: number;
  /** Row to highlight in grid labels */
  activeRow?: string;
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

/** Infer circuit section for a board placement (fallback when section not stored in layout). */
function inferPlacementSection(type: string, value?: string): BomSection {
  if (type === 'jumper') return 'power';
  value = value ?? '';
  const v = value.toLowerCase();
  if (type === 'ic' || type === 'op-amp') return 'active';
  if (type === 'transistor') return 'active';
  if (type === 'led') return 'output';
  if (type === 'diode') {
    if (/4001|4004|4007|5817|5819/.test(v)) return 'power';
    return 'clipping';
  }
  if (type === 'capacitor') {
    const m = v.match(/(\d+\.?\d*)\s*(?:uf?|µf?)/i);
    if (m && parseFloat(m[1]) >= 47) return 'power';
    return 'active';
  }
  return 'active';
}

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
        {/* Blue signal wire: col 63 → jack */}
        <line
          x1={col63X} y1={midY}
          x2={1628} y2={midY}
          stroke="#0044CC" strokeWidth="2.5" strokeLinecap="round"
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

export default function BomBreadboardView({ bomData, focusComponentTypes, visibleSections, highlightSection, className = '', activeCol, activeRow }: BomBreadboardViewProps) {
  const placements = generateBreadboardLayout(bomData);
  const { totalWidth, totalHeight } = LAYOUT_830;

  // Highlight only the holes for focused (or all) components — exclude jumper wires
  const highlightHoles: string[] = placements
    .filter(p => p.type !== 'jumper' && (!focusComponentTypes || focusComponentTypes.includes(p.type)))
    .flatMap(p => {
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
            <BreadboardBase size="830" highlightHoles={highlightHoles} activeCol={activeCol} activeRow={activeRow} />

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
              {/* Filters for component drop shadow */}
              <defs>
                <filter id="componentShadow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="1" dy="1.5" stdDeviation="0.8" floodOpacity="0.4" />
                </filter>
                <filter id="currentStepGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#F59E0B" floodOpacity="0.9" />
                </filter>
              </defs>

              {/* Offboard jacks and pots */}
              <OffboardComponents bomData={bomData} />

              {/* Board components */}
              {placements.map((placement, idx) => {
                // Cumulative section filter — skip components not yet in the build sequence
                const pvalue = 'value' in placement ? (placement as { value: string }).value : undefined;
                if (visibleSections) {
                  const sec = inferPlacementSection(placement.type, pvalue);
                  if (!visibleSections.includes(sec)) return null;
                }
                // Opacity: current-step components glow; previous steps dim; focus filter still works
                const placementSec = inferPlacementSection(placement.type, pvalue);
                const isCurrent = highlightSection != null && placementSec === highlightSection;
                const isFocused = placement.type === 'jumper'
                  || (!focusComponentTypes && !highlightSection)
                  || (focusComponentTypes != null && focusComponentTypes.includes(placement.type))
                  || isCurrent;
                const opacity = isFocused ? 1 : (highlightSection != null ? 0.4 : 0.15);
                const filterAttr = isCurrent ? 'url(#currentStepGlow)' : 'url(#componentShadow)';

                try {
                  // ── Jumper Wire ──────────────────────────────────────────
                  if (placement.type === 'jumper') {
                    const start = holeToCoordinates(placement.startHole, LAYOUT_830);
                    const end   = holeToCoordinates(placement.endHole,   LAYOUT_830);
                    return (
                      <WireSVG
                        key={idx}
                        startX={start.x} startY={start.y}
                        endX={end.x}     endY={end.y}
                        color={placement.color as WireColor}
                        label={placement.label}
                      />
                    );
                  }

                  // ── Resistor ────────────────────────────────────────────
                  if (placement.type === 'resistor') {
                    const spec = getResistorSpec(placement.value);
                    if (!spec) return null;
                    const start = holeToCoordinates(placement.startHole, LAYOUT_830);
                    const end   = holeToCoordinates(placement.endHole,   LAYOUT_830);
                    // Parse column numbers from hole IDs (e.g. "a5" → 5, "a10" → 10)
                    const startCol = parseInt(placement.startHole.substring(1));
                    const endCol   = parseInt(placement.endHole.substring(1));
                    // Body width = (endCol - startCol - 1) * holeSpacing
                    // Leaves one hole-pitch of lead wire on each side of the body
                    const bodyLengthOverride = (endCol - startCol - 1) * LAYOUT_830.holeSpacing;
                    return (
                      <g key={idx} opacity={opacity} filter={filterAttr}>
                        <ResistorSVG
                          startX={start.x} startY={start.y}
                          endX={end.x}     endY={end.y}
                          spec={spec}
                          label={placement.label}
                          bodyLengthOverride={bodyLengthOverride}
                        />
                      </g>
                    );
                  }

                  // ── Capacitor ──────────────────────────────────────────
                  if (placement.type === 'capacitor') {
                    const spec  = decodeCapacitor(placement.value);
                    const start = holeToCoordinates(placement.startHole, LAYOUT_830);
                    const end   = holeToCoordinates(placement.endHole,   LAYOUT_830);
                    return (
                      <g key={idx} opacity={opacity} filter={filterAttr}>
                        <CapacitorSVG
                          startX={start.x} startY={start.y}
                          endX={end.x}     endY={end.y}
                          spec={spec}
                          label={placement.label}
                        />
                      </g>
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
                      <g key={idx} opacity={opacity} filter={filterAttr}>
                        <ICSVG
                          pin1X={pin1.x}        pin1Y={pin1.y}
                          bottomRowY={bottomRow.y}
                          pinCount={placement.pinCount}
                          spec={spec}
                          label={placement.label}
                        />
                      </g>
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
                      <g key={idx} opacity={opacity} filter={filterAttr}>
                        <DiodeSVG
                          startX={start.x} startY={start.y}
                          endX={end.x}     endY={end.y}
                          spec={spec}
                          label={placement.label}
                        />
                      </g>
                    );
                  }

                  // ── Transistor ────────────────────────────────────────
                  if (placement.type === 'transistor') {
                    const bPin = holeToCoordinates(placement.bHole, LAYOUT_830);
                    const spec = makeTransistorSpec(placement.value);
                    return (
                      <g key={idx} opacity={opacity} filter={filterAttr}>
                        <TransistorSVG
                          x={bPin.x}
                          y={bPin.y}
                          spec={spec}
                          label={placement.label}
                        />
                      </g>
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
