/**
 * WireSVG Component
 *
 * Renders a jumper wire between two breadboard holes using a quadratic
 * Bézier arc. The arc height scales with wire length so short wires lie
 * nearly flat and long wires arch clearly above the board surface.
 *
 * Wire appearance:
 *   - Solid-core 22 AWG style (3.5 px stroke, rounded ends)
 *   - Semi-translucent white highlight for 3-D depth
 *   - Small filled circles mark each insertion point
 *   - Eight standard colors: red, black, green, blue, yellow, orange, white, purple
 *
 * The arc always curves toward the "upper-left" side of the wire
 * (negative-y / perpendicular to the wire direction, biased upward).
 * Pass arcFlip={true} to mirror it to the opposite side when wires
 * would otherwise overlap.
 *
 * Phase 2 - Work Stream C: Component SVG Rendering
 */

import React from 'react';

// ============================================================================
// Wire color palette
// ============================================================================

export type WireColor =
  | 'red'
  | 'black'
  | 'green'
  | 'blue'
  | 'yellow'
  | 'orange'
  | 'white'
  | 'purple';

const WIRE_HEX: Record<WireColor, string> = {
  red:    '#CC0000',
  black:  '#222222',
  green:  '#007700',
  blue:   '#0044CC',
  yellow: '#BBAA00',
  orange: '#CC5500',
  white:  '#C8C8C8',
  purple: '#6600AA',
};

// ============================================================================
// Props
// ============================================================================

export interface WireSVGProps {
  /** First hole (one end of the wire) */
  startX: number;
  startY: number;
  /** Second hole (other end of the wire) */
  endX: number;
  endY: number;
  /** Insulation color */
  color?: WireColor;
  /** Flip the arc to the other side of the wire */
  arcFlip?: boolean;
  /** Optional label */
  label?: string;
  /** Whether to render the component */
  visible?: boolean;
  /** Click handler */
  onClick?: () => void;
}

// ============================================================================
// Helpers
// ============================================================================

interface ArcPoints {
  /** Bézier control point */
  cx: number;
  cy: number;
  /** Arc height (pixels) */
  height: number;
}

/**
 * Compute the Bézier control point for the wire arc.
 *
 * The control point is placed perpendicular to the wire midpoint.
 * The perpendicular direction is biased toward "upward" (negative y).
 * arcFlip mirrors it to the opposite side.
 */
function calcArcPoints(
  x1: number, y1: number,
  x2: number, y2: number,
  flip: boolean,
): ArcPoints {
  const dx   = x2 - x1;
  const dy   = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;

  // Arc height scales with wire length, capped at 42 px
  const height = Math.min(dist * 0.28, 42);

  // Perpendicular unit vector (90° counter-clockwise)
  let perpX = -dy / dist;
  let perpY =  dx / dist;

  // Bias toward upward (negative y). If the perpendicular points downward,
  // flip it — unless the wire is nearly vertical (|dy| >> |dx|), in which
  // case we want a sideways arc and keep whichever side is "left".
  const isMoreVertical = Math.abs(dy) > Math.abs(dx) * 1.5;
  if (!isMoreVertical && perpY > 0.1) {
    perpX = -perpX;
    perpY = -perpY;
  }

  if (flip) {
    perpX = -perpX;
    perpY = -perpY;
  }

  return {
    cx: (x1 + x2) / 2 + perpX * height,
    cy: (y1 + y2) / 2 + perpY * height,
    height,
  };
}

// ============================================================================
// Main Component
// ============================================================================

const WireSVG: React.FC<WireSVGProps> = ({
  startX, startY,
  endX,   endY,
  color   = 'red',
  arcFlip = false,
  label,
  visible = true,
  onClick,
}) => {
  if (!visible) return null;

  const hex  = WIRE_HEX[color];
  const arc  = calcArcPoints(startX, startY, endX, endY, arcFlip);

  const pathD = `M ${startX} ${startY} Q ${arc.cx} ${arc.cy} ${endX} ${endY}`;

  // Label position: midpoint of the quadratic Bézier at t=0.5
  // B(0.5) = 0.25*P0 + 0.5*P1 + 0.25*P2
  const labelX = 0.25 * startX + 0.5 * arc.cx + 0.25 * endX;
  const labelY = 0.25 * startY + 0.5 * arc.cy + 0.25 * endY - 6;

  return (
    <g
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      {/* Shadow / depth layer */}
      <path
        d={pathD}
        fill="none"
        stroke="#000000"
        strokeWidth="4.5"
        strokeLinecap="round"
        opacity="0.12"
      />

      {/* Main wire insulation */}
      <path
        d={pathD}
        fill="none"
        stroke={hex}
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Highlight — white translucent stripe along the top of the wire */}
      <path
        d={pathD}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.25"
      />

      {/* Insertion point circles (wire tip entering the hole) */}
      <circle cx={startX} cy={startY} r={3}   fill={hex} />
      <circle cx={startX} cy={startY} r={1.5} fill="#FFFFFF" opacity="0.4" />

      <circle cx={endX} cy={endY} r={3}   fill={hex} />
      <circle cx={endX} cy={endY} r={1.5} fill="#FFFFFF" opacity="0.4" />

      {/* Optional label */}
      {label && (
        <text
          x={labelX}
          y={labelY}
          textAnchor="middle"
          fontSize="9"
          fontFamily="monospace"
          fontWeight="600"
          fill="#1f2937"
        >
          {label}
        </text>
      )}
    </g>
  );
};

export default WireSVG;
