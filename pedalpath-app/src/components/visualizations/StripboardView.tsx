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
  components?: unknown[];   // reserved for future component overlay
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
}

function BoardSVG({ copperSide, cutSet }: BoardSVGProps) {
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
    </svg>
  );
}

// ============================================================================
// Main export
// ============================================================================

const StripboardView: React.FC<StripboardViewProps> = ({
  viewMode: initialViewMode = 'component',
  onViewModeChange,
  components: _components = [],
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
        <BoardSVG copperSide={showCopper} cutSet={cutSet} />
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
