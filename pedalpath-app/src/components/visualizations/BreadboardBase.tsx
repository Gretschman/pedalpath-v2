/**
 * BreadboardBase Component
 *
 * Renders a photorealistic breadboard SVG matching reference images.
 * Supports 830-point and 400-point breadboards with proper hole layout,
 * power rails, and labeling.
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
}

/**
 * Renders a realistic breadboard base
 *
 * @example
 * <BreadboardBase
 *   size="830"
 *   highlightHoles={["a15", "a16"]}
 *   onHoleClick={(id) => console.log('Clicked', id)}
 * />
 */
export function BreadboardBase({
  size,
  highlightHoles = [],
  onHoleClick,
  className = '',
  scale = 1,
}: BreadboardBaseProps) {
  const config = getLayout(size);

  // Calculate viewBox dimensions
  const viewBoxWidth = config.totalWidth;
  const viewBoxHeight = config.totalHeight;

  return (
    <svg
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
      className={`breadboard-base ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
    >
      {/* Photo background — replaces hand-drawn SVG board */}
      <image
        href={size === '830' ? '/breadboard-830.jpg' : '/breadboard-400.jpg'}
        x="0"
        y="0"
        width={viewBoxWidth}
        height={viewBoxHeight}
        preserveAspectRatio="none"
      />

      {/* Power Rails - TOP */}
      <PowerRails
        y={config.powerRailY.topPositive}
        columns={config.columns}
        type="positive"
        position="top"
        config={config}
        highlightHoles={highlightHoles}
        onHoleClick={onHoleClick}
      />
      <PowerRails
        y={config.powerRailY.topGround}
        columns={config.columns}
        type="ground"
        position="top"
        config={config}
        highlightHoles={highlightHoles}
        onHoleClick={onHoleClick}
      />

      {/* Terminal Strip Holes */}
      <TerminalStrip
        config={config}
        highlightHoles={highlightHoles}
        onHoleClick={onHoleClick}
      />

      {/* Power Rails - BOTTOM */}
      <PowerRails
        y={config.powerRailY.bottomGround}
        columns={config.columns}
        type="ground"
        position="bottom"
        config={config}
        highlightHoles={highlightHoles}
        onHoleClick={onHoleClick}
      />
      <PowerRails
        y={config.powerRailY.bottomPositive}
        columns={config.columns}
        type="positive"
        position="bottom"
        config={config}
        highlightHoles={highlightHoles}
        onHoleClick={onHoleClick}
      />

      {/* Labels */}
      <Labels config={config} />
    </svg>
  );
}

/** Power rail rendering */
function PowerRails({
  y,
  columns,
  type,
  position: _position,
  config,
  highlightHoles,
  onHoleClick,
}: {
  y: number;
  columns: number;
  type: 'positive' | 'ground';
  position: 'top' | 'bottom';
  config: BreadboardLayout;
  highlightHoles: string[];
  onHoleClick?: (id: string) => void;
}) {
  const color = type === 'positive' ? '#CC0000' : '#0066CC';
  const holeSpacing = config.holeSpacing;
  const startX = config.terminalStripStart.x;

  return (
    <g className={`power-rail power-rail-${type}`}>
      {/* Colored stripe */}
      <line
        x1={startX - 20}
        y1={y}
        x2={startX + columns * holeSpacing + 20}
        y2={y}
        stroke={color}
        strokeWidth="3"
        opacity="0.85"
      />

      {/* Holes */}
      {Array.from({ length: columns }).map((_, i) => {
        const x = startX + i * holeSpacing;
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
    </g>
  );
}

/** Terminal strip rendering */
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
        // Calculate Y position with center gap
        let y = terminalStripStart.y + rowIdx * holeSpacing;
        if (rowIdx >= 5) {
          y += centerGap; // Add gap after row 'e'
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

      {/* Center divider line */}
      <line
        x1={terminalStripStart.x - 20}
        y1={terminalStripStart.y + 5 * holeSpacing + centerGap / 2}
        x2={terminalStripStart.x + columns * holeSpacing + 20}
        y2={terminalStripStart.y + 5 * holeSpacing + centerGap / 2}
        stroke="#CCCCCC"
        strokeWidth="2"
        strokeDasharray="5,5"
        opacity="0.5"
      />
    </g>
  );
}

/** Individual hole rendering — transparent click target + highlight ring over photo */
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
      {/* Invisible click target */}
      <rect
        x={x - 7}
        y={y - 7}
        width={14}
        height={14}
        fill="transparent"
      />

      {/* Golden highlight ring — only shown when hole is occupied/selected */}
      {highlighted && (
        <rect
          x={x - 7}
          y={y - 7}
          width={14}
          height={14}
          rx={2}
          fill="none"
          stroke="#FFD700"
          strokeWidth="2"
          opacity="0.85"
        />
      )}
    </g>
  );
}

/** Label rendering */
function Labels({ config }: { config: BreadboardLayout }) {
  const { columns, terminalStripStart, holeSpacing, centerGap } = config;

  return (
    <g className="labels">
      {/* Column numbers (1-63) - displayed every 5 columns for readability */}
      {Array.from({ length: columns }).map((_, i) => {
        const x = terminalStripStart.x + i * holeSpacing;
        const col = i + 1;

        // Only show every 5th number to avoid clutter
        if (col % 5 !== 0 && col !== 1 && col !== columns) {
          return null;
        }

        return (
          <React.Fragment key={`col-${col}`}>
            {/* Above row 'a' */}
            <text
              x={x}
              y={terminalStripStart.y - 15}
              fontSize="10"
              fill="#666666"
              textAnchor="middle"
              fontFamily="Arial, sans-serif"
            >
              {col}
            </text>

            {/* Below row 'j' */}
            <text
              x={x}
              y={terminalStripStart.y + 10 * holeSpacing + centerGap + 20}
              fontSize="10"
              fill="#666666"
              textAnchor="middle"
              fontFamily="Arial, sans-serif"
            >
              {col}
            </text>
          </React.Fragment>
        );
      })}

      {/* Row letters (a-j) */}
      {ROW_NAMES.map((row, idx) => {
        let y = terminalStripStart.y + idx * holeSpacing;
        if (idx >= 5) {
          y += centerGap;
        }

        return (
          <text
            key={`row-${row}`}
            x={terminalStripStart.x - 25}
            y={y + 4}
            fontSize="12"
            fill="#666666"
            textAnchor="end"
            fontFamily="Arial, sans-serif"
            fontWeight="600"
          >
            {row}
          </text>
        );
      })}

      {/* Power rail labels */}
      <text x="15" y={config.powerRailY.topPositive + 4} fontSize="14" fill="#CC0000" fontWeight="bold">+</text>
      <text x="15" y={config.powerRailY.topGround + 4} fontSize="14" fill="#0066CC" fontWeight="bold">−</text>
      <text x="15" y={config.powerRailY.bottomGround + 4} fontSize="14" fill="#0066CC" fontWeight="bold">−</text>
      <text x="15" y={config.powerRailY.bottomPositive + 4} fontSize="14" fill="#CC0000" fontWeight="bold">+</text>
    </g>
  );
}

export default BreadboardBase;
