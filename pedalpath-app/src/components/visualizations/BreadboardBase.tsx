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
      {/* Definitions for reusable elements */}
      <defs>
        {/* Hole gradient for depth effect */}
        <radialGradient id="holeGradient">
          <stop offset="0%" stopColor="#333333" />
          <stop offset="70%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#000000" />
        </radialGradient>

        {/* Metallic rim gradient */}
        <radialGradient id="rimGradient">
          <stop offset="0%" stopColor="#999999" />
          <stop offset="50%" stopColor="#666666" />
          <stop offset="100%" stopColor="#444444" />
        </radialGradient>

        {/* Subtle texture pattern */}
        <pattern id="texturePattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <rect width="20" height="20" fill="#F5F5F5" />
          <circle cx="2" cy="2" r="0.5" fill="#E0E0E0" />
          <circle cx="12" cy="8" r="0.5" fill="#E0E0E0" />
          <circle cx="7" cy="15" r="0.5" fill="#E0E0E0" />
          <circle cx="17" cy="12" r="0.5" fill="#E0E0E0" />
        </pattern>
      </defs>

      {/* Board base */}
      <rect
        x="0"
        y="0"
        width={viewBoxWidth}
        height={viewBoxHeight}
        fill="#F5F5F5"
        rx="10"
        ry="10"
      />

      {/* Subtle texture overlay */}
      <rect
        x="0"
        y="0"
        width={viewBoxWidth}
        height={viewBoxHeight}
        fill="url(#texturePattern)"
        opacity="0.03"
      />

      {/* Board shadow (subtle depth) */}
      <rect
        x="5"
        y="5"
        width={viewBoxWidth}
        height={viewBoxHeight}
        fill="none"
        stroke="#CCCCCC"
        strokeWidth="1"
        rx="10"
        ry="10"
        opacity="0.3"
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
        strokeWidth="8"
        opacity="0.7"
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

/** Individual hole rendering */
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
      {/* Metallic rim */}
      <circle
        cx={x}
        cy={y}
        r="5.5"
        fill="url(#rimGradient)"
      />

      {/* Hole interior */}
      <circle
        cx={x}
        cy={y}
        r="4"
        fill="url(#holeGradient)"
      />

      {/* Highlight overlay */}
      {highlighted && (
        <circle
          cx={x}
          cy={y}
          r="7"
          fill="none"
          stroke="#FFD700"
          strokeWidth="2"
          opacity="0.8"
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
