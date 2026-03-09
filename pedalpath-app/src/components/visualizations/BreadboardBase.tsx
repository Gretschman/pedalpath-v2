/**
 * BreadboardBase Component
 *
 * Renders a clean original SVG breadboard (no photo dependency).
 * Warm cream body, colored power rails, visible holes, row/column labels.
 *
 * Design spec:
 *   Board body:        #F2EFE4 (warm cream), border #C8C0A8
 *   Terminal strip:    #F8F5EE (slightly lighter)
 *   Holes:             #3A3A3A center, #888888 metallic ring
 *   Positive rail:     #FFDCDC tint + #CC2200 stripe
 *   Ground rail:       #DCE8FF tint + #0055CC stripe
 *   Center gap:        #E0DDD4
 */

import React from 'react';
import { getLayout, type BreadboardLayout, ROW_NAMES } from '@/utils/breadboard-utils';
import './BreadboardBase.css';

export interface BreadboardBaseProps {
  /** Breadboard size */
  size: '830' | '400';

  /** Optional holes to highlight */
  highlightHoles?: string[];

  /** Callback when hole is clicked */
  onHoleClick?: (holeId: string) => void;

  /** CSS class name */
  className?: string;

  /** Scale factor for rendering */
  scale?: number;

  /** Column number to emphasise (bold + larger) in the column labels */
  activeCol?: number;

  /** Row letter to emphasise (bold + larger) in the row labels */
  activeRow?: string;
}

export function BreadboardBase({
  size,
  highlightHoles = [],
  onHoleClick,
  className = '',
  scale = 1,
  activeCol,
  activeRow,
}: BreadboardBaseProps) {
  const config = getLayout(size);
  const { totalWidth, totalHeight } = config;

  return (
    <svg
      width={totalWidth}
      height={totalHeight}
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      className={`breadboard-base ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
    >
      {/* SVG filter defs — hole bevel + component drop shadow */}
      <defs>
        <filter id="holeBevel" x="-20%" y="-20%" width="140%" height="140%">
          <feOffset dx="0" dy="0.4" />
          <feGaussianBlur stdDeviation="0.25" result="blur" />
          <feComposite operator="out" in="SourceGraphic" in2="blur" result="inner" />
          <feFlood floodColor="#000" floodOpacity="0.6" result="color" />
          <feComposite operator="in" in="color" in2="inner" result="shadow" />
          <feComposite operator="over" in="shadow" in2="SourceGraphic" />
        </filter>
        <filter id="componentShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="1" dy="1.5" stdDeviation="0.8" floodOpacity="0.4" />
        </filter>
        {/* Reusable hole symbol — reduces DOM node count ~94% for 830-hole boards */}
        <symbol id="bb-hole" viewBox="0 0 10 10">
          {/* Metallic ring */}
          <circle cx="5" cy="5" r="5" fill="#888888" />
          {/* Dark hole center with holeBevel inset shadow */}
          <circle cx="5" cy="5" r="3" fill="#3A3A3A" filter="url(#holeBevel)" />
        </symbol>
      </defs>

      {/* Clean SVG board — no photo dependency */}
      <BoardBackground config={config} />

      {/* Power Rails */}
      <PowerRails
        y={config.powerRailY.topPositive}
        type="positive"
        config={config}
        highlightHoles={highlightHoles}
        onHoleClick={onHoleClick}
      />
      <PowerRails
        y={config.powerRailY.topGround}
        type="ground"
        config={config}
        highlightHoles={highlightHoles}
        onHoleClick={onHoleClick}
      />

      {/* Terminal Strip */}
      <TerminalStrip
        config={config}
        highlightHoles={highlightHoles}
        onHoleClick={onHoleClick}
      />

      {/* Power Rails — Bottom */}
      <PowerRails
        y={config.powerRailY.bottomGround}
        type="ground"
        config={config}
        highlightHoles={highlightHoles}
        onHoleClick={onHoleClick}
      />
      <PowerRails
        y={config.powerRailY.bottomPositive}
        type="positive"
        config={config}
        highlightHoles={highlightHoles}
        onHoleClick={onHoleClick}
      />

      {/* Labels */}
      <Labels config={config} activeCol={activeCol} activeRow={activeRow} />
    </svg>
  );
}

// ============================================================================
// Board Background
// ============================================================================

function BoardBackground({ config }: { config: BreadboardLayout }) {
  const {
    totalHeight,
    terminalStripStart, holeSpacing, centerGap, powerRailY, columns,
  } = config;

  // Physical board rect — derived from MB102 mechanical spec
  // Scale: holeSpacing px / 2.54mm = px per mm
  const S = holeSpacing / 2.54; // px/mm
  const boardLeft = terminalStripStart.x - Math.round(7.62 * S);   // col-1 offset: 3 pitches = 72px → x=20
  const boardTop  = terminalStripStart.y - Math.round(11.43 * S);  // row-A offset: 4.5 pitches = 108px → y=80
  const boardW    = terminalStripStart.x + (columns - 1) * holeSpacing - boardLeft; // col-1 to col-63 span = 1560px
  const boardH    = Math.round(54.6 * S);  // 54.6mm board height = 516px

  // Active area rect (slightly inset — contains rails + terminal strip)
  const areaLeft  = boardLeft + 14;
  const areaRight = boardLeft + boardW - 14;
  const railH = 20; // power rail tint strip height (px)

  // Terminal strip bounding box
  const tsTop    = terminalStripStart.y - 16;
  const tsBottom = terminalStripStart.y + 9 * holeSpacing + centerGap + 16;

  // Center gap bounding box
  const gapTop    = terminalStripStart.y + 5 * holeSpacing;
  const gapBottom = gapTop + centerGap;

  return (
    <g className="board-background">
      {/* Board body — physically sized (165.1mm × 54.6mm) */}
      <rect
        x={boardLeft} y={boardTop}
        width={boardW} height={boardH}
        fill="#F2EFE4"
        rx={6}
      />
      {/* Board border */}
      <rect
        x={boardLeft + 2} y={boardTop + 2}
        width={boardW - 4} height={boardH - 4}
        fill="none"
        stroke="#C8C0A8"
        strokeWidth="3"
        rx={5}
      />

      {/* Terminal strip area */}
      <rect
        x={areaLeft} y={tsTop}
        width={areaRight - areaLeft} height={tsBottom - tsTop}
        fill="#F8F5EE"
        stroke="#D8D0BC"
        strokeWidth="0.75"
        rx={3}
      />

      {/* Center gap */}
      <rect
        x={areaLeft} y={gapTop}
        width={areaRight - areaLeft} height={gapBottom - gapTop}
        fill="#E0DDD4"
      />

      {/* Top positive rail tint */}
      <rect
        x={areaLeft} y={powerRailY.topPositive - railH / 2}
        width={areaRight - areaLeft} height={railH}
        fill="#FFDCDC" rx={2}
      />
      <line
        x1={areaLeft} y1={powerRailY.topPositive}
        x2={areaRight} y2={powerRailY.topPositive}
        stroke="#CC2200" strokeWidth="1.5" opacity="0.65"
      />

      {/* Top ground rail tint */}
      <rect
        x={areaLeft} y={powerRailY.topGround - railH / 2}
        width={areaRight - areaLeft} height={railH}
        fill="#DCE8FF" rx={2}
      />
      <line
        x1={areaLeft} y1={powerRailY.topGround}
        x2={areaRight} y2={powerRailY.topGround}
        stroke="#0055CC" strokeWidth="1.5" opacity="0.65"
      />

      {/* Bottom positive rail tint */}
      {powerRailY.bottomPositive < totalHeight && (
        <>
          <rect
            x={areaLeft} y={powerRailY.bottomPositive - railH / 2}
            width={areaRight - areaLeft} height={railH}
            fill="#FFDCDC" rx={2}
          />
          <line
            x1={areaLeft} y1={powerRailY.bottomPositive}
            x2={areaRight} y2={powerRailY.bottomPositive}
            stroke="#CC2200" strokeWidth="1.5" opacity="0.65"
          />
        </>
      )}

      {/* Bottom ground rail tint (partially visible if within bounds) */}
      {powerRailY.bottomGround < totalHeight && (
        <>
          <rect
            x={areaLeft} y={powerRailY.bottomGround - railH / 2}
            width={areaRight - areaLeft}
            height={Math.min(railH, totalHeight - (powerRailY.bottomGround - railH / 2))}
            fill="#DCE8FF" rx={2}
          />
          <line
            x1={areaLeft} y1={powerRailY.bottomGround}
            x2={areaRight} y2={powerRailY.bottomGround}
            stroke="#0055CC" strokeWidth="1.5" opacity="0.65"
          />
        </>
      )}
    </g>
  );
}

// ============================================================================
// Power Rails
// ============================================================================

function PowerRails({
  y,
  type,
  config,
  highlightHoles,
  onHoleClick,
}: {
  y: number;
  type: 'positive' | 'ground';
  config: BreadboardLayout;
  highlightHoles: string[];
  onHoleClick?: (id: string) => void;
}) {
  const { holeSpacing, terminalStripStart, powerRailHoles } = config;

  // Matrix-5: rail holes start at col-1 + half-pitch (1.27mm)
  // x formula for hole i (0-based):
  //   railStartX = terminalStripStart.x + round(1.27 × scale) = 92 + 12 = 104px
  //   x = railStartX + i×24 + floor(i/5)×24 + (i≥25 ? 48 : 0)
  const S = holeSpacing / 2.54;  // px/mm scale factor
  const railStartX = terminalStripStart.x + Math.round(1.27 * S);
  const centerBreakPx = Math.round(5.08 * S);  // 48px

  // Compute x positions for all 50 holes so we can find the midpoint gap location
  const holeXPositions = Array.from({ length: powerRailHoles }).map((_, i) => {
    const groupGap = Math.floor(i / 5) * holeSpacing;
    const centerBreak = i >= 25 ? centerBreakPx : 0;
    return railStartX + i * holeSpacing + groupGap + centerBreak;
  });

  // Midpoint gap: between hole index 24 (hole 25) and hole index 25 (hole 26)
  // The center break is already 48px wide — we draw a tick at the midpoint of that gap.
  const midGapX = holeXPositions[24] + holeSpacing / 2 + holeSpacing / 2; // midpoint between seg 1 last and seg 2 first
  const railColor = type === 'positive' ? '#CC2200' : '#0055CC';

  return (
    <g className={`power-rail power-rail-${type}`}>
      {holeXPositions.map((x, i) => {
        const holeId = `${type === 'positive' ? '+' : '-'}${i + 1}`;
        const highlighted = highlightHoles.includes(holeId);

        return (
          <Hole
            key={holeId}
            id={holeId}
            x={x}
            y={y}
            highlighted={highlighted}
            onClick={() => onHoleClick?.(holeId)}
          />
        );
      })}

      {/* Midpoint split indicator — vertical tick between hole 25 and hole 26.
          Signals the two independent 25-hole segments are NOT electrically connected. */}
      <line
        x1={midGapX} y1={y - 8}
        x2={midGapX} y2={y + 8}
        stroke={railColor}
        strokeWidth="1.5"
        strokeDasharray="2 2"
        opacity="0.55"
      />
    </g>
  );
}

// ============================================================================
// Terminal Strip
// ============================================================================

function TerminalStrip({
  config,
  highlightHoles,
  onHoleClick,
}: {
  config: BreadboardLayout;
  highlightHoles: string[];
  onHoleClick?: (id: string) => void;
}) {
  const { columns, terminalStripStart, holeSpacing, centerGap } = config;
  const rows = ROW_NAMES;

  return (
    <g className="terminal-strip">
      {rows.map((row, rowIdx) => {
        let y = terminalStripStart.y + rowIdx * holeSpacing;
        if (rowIdx >= 5) {
          y += centerGap;
        }

        return (
          <g key={row} className={`row-${row}`}>
            {Array.from({ length: columns }).map((_, colIdx) => {
              const x = terminalStripStart.x + colIdx * holeSpacing;
              const holeId = `${row}${colIdx + 1}`;
              const highlighted = highlightHoles.includes(holeId);

              return (
                <Hole
                  key={holeId}
                  id={holeId}
                  x={x}
                  y={y}
                  highlighted={highlighted}
                  onClick={() => onHoleClick?.(holeId)}
                />
              );
            })}
          </g>
        );
      })}
    </g>
  );
}

// ============================================================================
// Individual Hole
// ============================================================================

function Hole({
  id,
  x,
  y,
  highlighted,
  onClick,
}: {
  id: string;
  x: number;
  y: number;
  highlighted: boolean;
  onClick: () => void;
}) {
  return (
    <g
      className={`hole ${highlighted ? 'hole-highlighted' : ''}`}
      data-hole-id={id}
      onClick={onClick}
      style={{ cursor: onClick !== undefined ? 'pointer' : 'default' }}
    >
      {/* Reuse shared hole symbol — one DOM node instead of two circles */}
      <use href="#bb-hole" x={x - 5} y={y - 5} width="10" height="10" />

      {/* Highlight ring when occupied */}
      {highlighted && (
        <circle
          cx={x} cy={y} r={6.5}
          fill="none"
          stroke="#FFD700"
          strokeWidth="2"
          opacity="0.9"
        />
      )}
    </g>
  );
}

// ============================================================================
// Labels
// ============================================================================

function Labels({ config, activeCol, activeRow }: { config: BreadboardLayout; activeCol?: number; activeRow?: string }) {
  const { columns, terminalStripStart, holeSpacing, centerGap } = config;

  // Polarity marker x: inside board left margin, left of active area
  const S = holeSpacing / 2.54;
  const boardLeft  = terminalStripStart.x - Math.round(7.62 * S);  // 20
  const polarityX  = boardLeft + 10;  // 30px — comfortably inside board edge

  return (
    <g className="labels">
      {/* Column numbers — every 5 columns plus first and last */}
      {Array.from({ length: columns }).map((_, i) => {
        const x = terminalStripStart.x + i * holeSpacing;
        const col = i + 1;

        if (col % 5 !== 0 && col !== 1 && col !== columns) return null;

        const isActive = col === activeCol;
        return (
          <React.Fragment key={`col-${col}`}>
            {/* Above row a */}
            <text
              x={x}
              y={terminalStripStart.y - 14}
              fontSize={isActive ? 11 : 9}
              fill={isActive ? '#1f2937' : '#888888'}
              textAnchor="middle"
              fontFamily="Arial, sans-serif"
              fontWeight={isActive ? 'bold' : 'normal'}
            >
              {col}
            </text>
            {/* Below row j */}
            <text
              x={x}
              y={terminalStripStart.y + 9 * holeSpacing + centerGap + 20}
              fontSize={isActive ? 11 : 9}
              fill={isActive ? '#1f2937' : '#888888'}
              textAnchor="middle"
              fontFamily="Arial, sans-serif"
              fontWeight={isActive ? 'bold' : 'normal'}
            >
              {col}
            </text>
          </React.Fragment>
        );
      })}

      {/* Row letters a–j */}
      {ROW_NAMES.map((row, idx) => {
        let y = terminalStripStart.y + idx * holeSpacing;
        if (idx >= 5) y += centerGap;
        const isActiveRow = row === activeRow;

        return (
          <text
            key={`row-${row}`}
            x={terminalStripStart.x - 22}
            y={y + 4}
            fontSize={isActiveRow ? 13 : 11}
            fill={isActiveRow ? '#1f2937' : '#888888'}
            textAnchor="end"
            fontFamily="Arial, sans-serif"
            fontWeight={isActiveRow ? 'bold' : '600'}
          >
            {row}
          </text>
        );
      })}

      {/* Power rail polarity markers — positioned inside board left margin */}
      <text x={polarityX} y={config.powerRailY.topPositive + 5} fontSize="14" fill="#CC2200" fontWeight="bold" fontFamily="Arial, sans-serif">+</text>
      <text x={polarityX} y={config.powerRailY.topGround + 5} fontSize="14" fill="#0055CC" fontWeight="bold" fontFamily="Arial, sans-serif">−</text>
      {config.powerRailY.bottomGround < config.totalHeight && (
        <text x={polarityX} y={config.powerRailY.bottomGround + 5} fontSize="14" fill="#0055CC" fontWeight="bold" fontFamily="Arial, sans-serif">−</text>
      )}
      {config.powerRailY.bottomPositive < config.totalHeight && (
        <text x={polarityX} y={config.powerRailY.bottomPositive + 5} fontSize="14" fill="#CC2200" fontWeight="bold" fontFamily="Arial, sans-serif">+</text>
      )}
    </g>
  );
}

export default BreadboardBase;
