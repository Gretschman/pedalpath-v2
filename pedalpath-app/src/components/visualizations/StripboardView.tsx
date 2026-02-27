/**
 * StripboardView — Realistic Veroboard/Stripboard Visualization
 *
 * Renders a photorealistic stripboard with:
 *   - Phenolic resin board (warm brown, component side)
 *   - Brushed copper horizontal tracks (copper side)
 *   - Annular ring solder pads with drill holes
 *   - Track cut markers (red ✕, gap in copper)
 *   - Grid labels: columns A–X (left→right), rows 1–25 (top→bottom)
 *
 * Physical spec (same scale as MB-102 breadboard: 24px = 2.54mm):
 *   HOLE_SPACING = 24px (2.54mm pitch)
 *   HOLE_RADIUS  = 5px  (1.02mm drill → dia≈9.6px)
 *   STRIP_H      = 20px (2.1mm copper width; 4px gap to next strip)
 *   Board        = 24 cols × 25 rows
 */

import React, { useState } from 'react';
import type { StripboardComponent } from '../../utils/stripboard-layout';
import { resistorDigits, resistorBandColor } from '../../utils/stripboard-layout';

// ============================================================================
// Physical constants
// ============================================================================

const HOLE_SPACING = 24;   // 2.54mm pitch → 24px
const HOLE_RADIUS  = 5;    // 1.02mm drill hole → r=5px
const PAD_RADIUS   = 8.5;  // copper annular ring outer radius
const STRIP_H      = 20;   // 2.1mm copper strip height → 20px
const COLS         = 24;
const ROWS         = 25;
const ML           = 40;   // left margin (row labels)
const MT           = 34;   // top margin (col labels)
const MR           = 16;   // right margin
const MB           = 16;   // bottom margin

const TOTAL_W = ML + COLS * HOLE_SPACING + MR;   // 632px
const TOTAL_H = MT + ROWS * HOLE_SPACING + MB;   // 650px

const COL_LABELS = Array.from({ length: COLS }, (_, i) => String.fromCharCode(65 + i)); // A–X

// ============================================================================
// Props
// ============================================================================

export interface StripboardViewProps {
  viewMode?: 'component' | 'copper' | 'both';
  onViewModeChange?: (mode: string) => void;
  components?: StripboardComponent[];
  trackCuts?: string[];     // e.g. ['D11', 'G10']
  showDemo?: boolean;
}

// ============================================================================
// Helpers
// ============================================================================

/** SVG x for a column index (0-based) */
const holeCx = (ci: number) => ML + ci * HOLE_SPACING;

/** SVG y for a row number (1-based) */
const holeCy = (row: number) => MT + (row - 1) * HOLE_SPACING + HOLE_SPACING / 2;

// ============================================================================
// Sub-component: single stripboard SVG
// ============================================================================

interface BoardSVGProps {
  copperSide: boolean;
  cutSet: Set<string>;
  componentPlacements?: StripboardComponent[];
}

function BoardSVG({ copperSide, cutSet, componentPlacements = [] }: BoardSVGProps) {
  // Color palette
  const boardFill      = copperSide ? 'url(#sb-board-copper)' : 'url(#sb-board-top)';
  const boardStroke    = copperSide ? '#3A2810' : '#9A6020';
  const labelFill      = copperSide ? '#9A7040' : '#5A3A10';
  const holeFill       = copperSide ? '#060200' : '#1E0C00';
  const cutGapFill     = copperSide ? '#060200' : '#C4904A';

  const stripStartX = ML - 8;
  const stripW      = COLS * HOLE_SPACING + 16;

  return (
    <svg
      width={TOTAL_W}
      height={TOTAL_H}
      viewBox={`0 0 ${TOTAL_W} ${TOTAL_H}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Board top (component side) — warm phenolic resin */}
        <linearGradient id="sb-board-top" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#D4A870" />
          <stop offset="100%" stopColor="#B8893A" />
        </linearGradient>

        {/* Board copper side — near-black epoxy */}
        <linearGradient id="sb-board-copper" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#110800" />
          <stop offset="100%" stopColor="#080400" />
        </linearGradient>

        {/* Copper track gradient — top-lit brushed copper */}
        <linearGradient id="sb-copper-track" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#E0A840" />
          <stop offset="30%"  stopColor="#C08030" />
          <stop offset="70%"  stopColor="#A06020" />
          <stop offset="100%" stopColor="#703A10" />
        </linearGradient>

        {/* Top-side copper: duller, visible through board holes */}
        <linearGradient id="sb-copper-topview" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#C89840" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#A07020" stopOpacity="0.65" />
        </linearGradient>

        {/* Solder pad on copper side: matte solder ring */}
        <radialGradient id="sb-solder-pad" cx="38%" cy="35%" r="62%">
          <stop offset="0%"   stopColor="#E8DEB8" />
          <stop offset="55%"  stopColor="#C0A858" />
          <stop offset="100%" stopColor="#887838" />
        </radialGradient>

        {/* Copper pad ring on top side */}
        <radialGradient id="sb-pad-top" cx="38%" cy="35%" r="62%">
          <stop offset="0%"   stopColor="#DCA840" />
          <stop offset="100%" stopColor="#8B5520" />
        </radialGradient>
      </defs>

      {/* Board body */}
      <rect
        x={ML - 10} y={MT - 10}
        width={COLS * HOLE_SPACING + 20}
        height={ROWS * HOLE_SPACING + 20}
        fill={boardFill}
        stroke={boardStroke}
        strokeWidth="2"
        rx="4"
      />

      {/* Mounting hole corners (cosmetic) */}
      {[
        [ML - 3,                     MT - 3],
        [ML + COLS * HOLE_SPACING + 3 - HOLE_SPACING, MT - 3],
        [ML - 3,                     MT + (ROWS - 1) * HOLE_SPACING + 3],
        [ML + COLS * HOLE_SPACING + 3 - HOLE_SPACING, MT + (ROWS - 1) * HOLE_SPACING + 3],
      ].map(([mx, my], idx) => (
        <circle key={`mh-${idx}`} cx={mx} cy={my} r={4}
          fill={copperSide ? '#0A0500' : '#8B6020'}
          stroke={copperSide ? '#3A2000' : '#6A4010'}
          strokeWidth="0.5"
        />
      ))}

      {/* Copper strips — one per row */}
      {Array.from({ length: ROWS }, (_, ri) => {
        const rowNum = ri + 1;
        const cy = holeCy(rowNum);
        const stripY = cy - STRIP_H / 2;
        const trackGrad = copperSide ? 'url(#sb-copper-track)' : 'url(#sb-copper-topview)';

        // Collect cut column indices for this row
        const cutCols = COL_LABELS.reduce<number[]>((acc, col, ci) => {
          if (cutSet.has(`${col}${rowNum}`)) acc.push(ci);
          return acc;
        }, []);

        return (
          <g key={`strip-${rowNum}`}>
            {/* Full copper strip */}
            <rect
              x={stripStartX} y={stripY}
              width={stripW} height={STRIP_H}
              fill={trackGrad}
              rx="2"
            />
            {/* Edge highlight on copper side */}
            {copperSide && (
              <rect
                x={stripStartX} y={stripY}
                width={stripW} height={2}
                fill="#E8C060" opacity="0.4"
                rx="1"
              />
            )}

            {/* Track cuts: overlay gap in copper */}
            {cutCols.map((ci) => {
              const gapCx = holeCx(ci);
              return (
                <g key={`cut-${ci}`}>
                  {/* Board-coloured gap breaks the copper */}
                  <rect
                    x={gapCx - HOLE_RADIUS - 3} y={stripY - 1}
                    width={HOLE_RADIUS * 2 + 6}  height={STRIP_H + 2}
                    fill={cutGapFill}
                  />
                  {/* Red ✕ cut marker */}
                  <line
                    x1={gapCx - 5} y1={cy - 5}
                    x2={gapCx + 5} y2={cy + 5}
                    stroke="#DD1111" strokeWidth="2.5" strokeLinecap="round"
                  />
                  <line
                    x1={gapCx - 5} y1={cy + 5}
                    x2={gapCx + 5} y2={cy - 5}
                    stroke="#DD1111" strokeWidth="2.5" strokeLinecap="round"
                  />
                </g>
              );
            })}
          </g>
        );
      })}

      {/* Solder pads + drill holes */}
      {Array.from({ length: ROWS }, (_, ri) =>
        Array.from({ length: COLS }, (_, ci) => {
          const rowNum = ri + 1;
          const col = COL_LABELS[ci];
          const cx = holeCx(ci);
          const cy = holeCy(rowNum);
          const onCut = cutSet.has(`${col}${rowNum}`);
          const padGrad = copperSide ? 'url(#sb-solder-pad)' : 'url(#sb-pad-top)';

          return (
            <g key={`hole-${ri}-${ci}`}>
              {/* Annular ring (skip on cut) */}
              {!onCut && (
                <circle
                  cx={cx} cy={cy} r={PAD_RADIUS}
                  fill={padGrad}
                />
              )}
              {/* Drill hole */}
              <circle
                cx={cx} cy={cy} r={HOLE_RADIUS}
                fill={holeFill}
              />
              {/* Hole rim */}
              <circle
                cx={cx} cy={cy} r={HOLE_RADIUS}
                fill="none"
                stroke={copperSide ? '#3A2000' : '#5A3010'}
                strokeWidth="0.5"
              />
            </g>
          );
        })
      )}

      {/* Column labels (A–X) */}
      {COL_LABELS.map((col, ci) => (
        <text
          key={`cl-${col}`}
          x={holeCx(ci)} y={MT - 16}
          textAnchor="middle"
          fontSize="10" fontFamily="monospace" fontWeight="700"
          fill={labelFill}
        >
          {col}
        </text>
      ))}

      {/* Row labels (1–25) */}
      {Array.from({ length: ROWS }, (_, ri) => (
        <text
          key={`rl-${ri}`}
          x={ML - 14} y={holeCy(ri + 1) + 4}
          textAnchor="middle"
          fontSize="9" fontFamily="monospace"
          fill={labelFill}
        >
          {ri + 1}
        </text>
      ))}

      {/* Component overlays — component side only */}
      {!copperSide && componentPlacements.length > 0 && (
        <ComponentOverlay components={componentPlacements} />
      )}
    </svg>
  );
}

// ============================================================================
// Component overlay — rendered on component-side view only
// ============================================================================

interface ComponentOverlayProps {
  components: StripboardComponent[];
}

function ComponentOverlay({ components }: ComponentOverlayProps) {
  return (
    <>
      {components.map((comp) => {
        const cx1 = holeCx(comp.lead1.col);
        const cy1 = holeCy(comp.lead1.row);

        if (comp.type === 'transistor' && comp.lead2 && comp.lead3) {
          const cy2 = holeCy(comp.lead2.row);
          const cy3 = holeCy(comp.lead3.row);
          const midY = (cy1 + cy3) / 2;
          const bodyTop = cy1 - 6;
          const bodyBot = cy3 + 6;
          const bx = cx1 - 9;
          const bw = 18;

          return (
            <g key={comp.id}>
              {/* Body: TO-92 flat-D outline */}
              <path
                d={`M ${bx} ${bodyTop} L ${bx + bw} ${bodyTop} L ${bx + bw} ${bodyBot} Q ${cx1} ${bodyBot + 10} ${bx} ${bodyBot} Z`}
                fill="#1a1a1a"
                stroke="#444"
                strokeWidth="1"
              />
              {/* Leads: 3 short stubs down */}
              <line x1={cx1} y1={bodyBot + 10} x2={cx1} y2={cy3 + HOLE_RADIUS} stroke="#999" strokeWidth="1.5" />
              <line x1={cx1} y1={cy1 - HOLE_RADIUS} x2={cx1} y2={bodyTop} stroke="#999" strokeWidth="1.5" />
              {/* E/B/C labels */}
              <text x={cx1 + 12} y={cy1 + 3} fontSize="7" fontFamily="monospace" fill="#666">E</text>
              <text x={cx1 + 12} y={cy2 + 3} fontSize="7" fontFamily="monospace" fill="#666">B</text>
              <text x={cx1 + 12} y={cy3 + 3} fontSize="7" fontFamily="monospace" fill="#666">C</text>
              {/* Ref */}
              <text x={cx1 - 18} y={midY + 3} fontSize="8" fontFamily="monospace" fill="#333" textAnchor="end">{comp.ref}</text>
            </g>
          );
        }

        if ((comp.type === 'resistor' || comp.type === 'diode') && comp.lead2) {
          const cy2 = holeCy(comp.lead2.row);
          const bodyTop = Math.min(cy1, cy2) + 6;
          const bodyBot = Math.max(cy1, cy2) - 6;
          const bodyH = bodyBot - bodyTop;
          const midY = (bodyTop + bodyBot) / 2;
          const [d1, d2, dm] = resistorDigits(comp.value);
          const bandH = Math.max(2, bodyH / 5);

          if (comp.type === 'diode') {
            return (
              <g key={comp.id}>
                <line x1={cx1} y1={cy1} x2={cx1} y2={bodyTop} stroke="#888" strokeWidth="1.5" />
                <line x1={cx1} y1={bodyBot} x2={cx1} y2={cy2} stroke="#888" strokeWidth="1.5" />
                <rect x={cx1 - 6} y={bodyTop} width={12} height={bodyH} fill="#555" rx="2" />
                {/* Cathode stripe */}
                <rect x={cx1 - 6} y={midY + bodyH / 4} width={12} height={3} fill="#e8e0d0" rx="0.5" />
                <text x={cx1 + 8} y={midY + 3} fontSize="8" fontFamily="monospace" fill="#333">{comp.ref}</text>
              </g>
            );
          }

          return (
            <g key={comp.id}>
              {/* Leads */}
              <line x1={cx1} y1={cy1} x2={cx1} y2={bodyTop} stroke="#888" strokeWidth="1.5" />
              <line x1={cx1} y1={bodyBot} x2={cx1} y2={cy2} stroke="#888" strokeWidth="1.5" />
              {/* Body */}
              <rect x={cx1 - 7} y={bodyTop} width={14} height={bodyH} fill="#D4C080" rx="3" />
              {/* Color bands */}
              <rect x={cx1 - 7} y={bodyTop + bandH * 0.5} width={14} height={bandH} fill={resistorBandColor(d1)} />
              <rect x={cx1 - 7} y={bodyTop + bandH * 1.8} width={14} height={bandH} fill={resistorBandColor(d2)} />
              <rect x={cx1 - 7} y={bodyTop + bandH * 3.0} width={14} height={bandH} fill={resistorBandColor(dm)} />
              {/* Tolerance band (gold) */}
              <rect x={cx1 - 7} y={bodyBot - bandH * 1.2} width={14} height={bandH * 0.8} fill="#C0A020" />
              {/* Ref */}
              <text x={cx1 + 9} y={midY + 3} fontSize="8" fontFamily="monospace" fill="#333">{comp.ref}</text>
            </g>
          );
        }

        if (comp.type === 'capacitor' && comp.lead2) {
          const cy2 = holeCy(comp.lead2.row);
          const bodyTop = Math.min(cy1, cy2) + 5;
          const bodyBot = Math.max(cy1, cy2) - 5;
          const bodyH = bodyBot - bodyTop;
          const midY = (bodyTop + bodyBot) / 2;

          return (
            <g key={comp.id}>
              {/* Leads */}
              <line x1={cx1} y1={cy1} x2={cx1} y2={bodyTop} stroke="#888" strokeWidth="1.5" />
              <line x1={cx1} y1={bodyBot} x2={cx1} y2={cy2} stroke="#888" strokeWidth="1.5" />
              {/* Body: film cap = orange rectangle; electrolytic = blue cylinder */}
              <rect x={cx1 - 7} y={bodyTop} width={14} height={bodyH}
                fill={/[uµ]/i.test(comp.value) ? '#4A7CC0' : '#E08030'}
                rx="3"
              />
              {/* + mark for electrolytic */}
              {/[uµ]/i.test(comp.value) && (
                <>
                  <line x1={cx1} y1={bodyTop + 4} x2={cx1} y2={bodyTop + 10} stroke="white" strokeWidth="1.5" />
                  <line x1={cx1 - 3} y1={bodyTop + 7} x2={cx1 + 3} y2={bodyTop + 7} stroke="white" strokeWidth="1.5" />
                </>
              )}
              {/* Ref */}
              <text x={cx1 + 9} y={midY + 3} fontSize="8" fontFamily="monospace" fill="#333">{comp.ref}</text>
            </g>
          );
        }

        // Fallback: simple dot
        return (
          <circle key={comp.id} cx={cx1} cy={cy1} r={6} fill="#999" opacity="0.6" />
        );
      })}
    </>
  );
}

// ============================================================================
// Main export
// ============================================================================

const StripboardView: React.FC<StripboardViewProps> = ({
  viewMode: initialViewMode = 'component',
  onViewModeChange,
  components: componentPlacements = [],
  trackCuts: propCuts = [],
  showDemo = true,
}) => {
  const [showCopper, setShowCopper] = useState(initialViewMode === 'copper');

  const demoTrackCuts: string[] = showDemo
    ? ['D11', 'D14', 'G10', 'L13']
    : propCuts;
  const trackCuts = showDemo ? demoTrackCuts : propCuts;
  const cutSet = new Set(trackCuts);

  const handleToggle = (copper: boolean) => {
    setShowCopper(copper);
    onViewModeChange?.(copper ? 'copper' : 'component');
  };

  return (
    <div className="w-full space-y-3">
      {/* View toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => handleToggle(false)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            !showCopper
              ? 'bg-amber-700 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Component Side
        </button>
        <button
          onClick={() => handleToggle(true)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            showCopper
              ? 'bg-amber-700 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Copper Side
        </button>
      </div>

      {/* Board */}
      <div className="overflow-x-auto rounded-lg shadow-sm">
        <BoardSVG
          copperSide={showCopper}
          cutSet={cutSet}
          componentPlacements={showDemo ? [] : componentPlacements}
        />
      </div>

      {/* Track cut legend */}
      {trackCuts.length > 0 && (
        <div className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="font-semibold mb-1">Track Cuts (red ✕):</p>
          <div className="flex flex-wrap gap-2">
            {trackCuts.map((cut) => (
              <span key={cut} className="font-mono bg-amber-100 border border-amber-300 rounded px-1.5 py-0.5">
                {cut}
              </span>
            ))}
          </div>
          <p className="mt-1.5 text-amber-700">
            Use a track cutter or 5mm drill bit to break the copper strip at each marked hole.
          </p>
        </div>
      )}

      {/* Info */}
      <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1">
        <p><strong>Component Side</strong> — phenolic top surface; place components here</p>
        <p><strong>Copper Side</strong> — horizontal copper tracks; solder and cut here</p>
        <p><strong>Track cuts</strong> — break the copper strip to isolate circuit nodes</p>
      </div>
    </div>
  );
};

export default StripboardView;
