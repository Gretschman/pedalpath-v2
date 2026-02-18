/**
 * ICSVG Component
 *
 * Renders a photorealistic DIP (Dual In-line Package) integrated circuit
 * on a breadboard. Supports 8-pin, 14-pin, and 16-pin DIP packages.
 *
 * The IC is placed horizontally straddling the breadboard center gap:
 *   - Top pins (1 … N/2)  go into row e (top terminal strip)
 *   - Bottom pins (N … N/2+1) go into row f (bottom terminal strip)
 *   - Pin 1 is at the top-left; the notch faces left.
 *
 * Phase 2 - Work Stream C: Component SVG Rendering
 */

import React from 'react';
import type { ICSpec } from '@/types/component-specs.types';

// ============================================================================
// Constants
// ============================================================================

/** Horizontal spacing between adjacent pins — matches LAYOUT_830.holeSpacing */
const PIN_SPACING = 25.4;

/** Extra body width beyond the outermost pins on each side */
const BODY_MARGIN = 6;

/** Radius of the pin-1 notch cutout on the left edge */
const NOTCH_R = 4;

/** Radius of the body corner rounding */
const CORNER_R = 2;

// ============================================================================
// Props
// ============================================================================

export interface ICSVGProps {
  /** X coordinate of pin 1 hole (top-left pin, from holeToCoordinates) */
  pin1X: number;
  /** Y coordinate of top pin row (row e, from holeToCoordinates) */
  pin1Y: number;
  /** Y coordinate of bottom pin row (row f, from holeToCoordinates) */
  bottomRowY: number;
  /** DIP pin count */
  pinCount: 8 | 14 | 16;
  /** IC specification from decodeIC() */
  spec: ICSpec;
  /** Component reference label, e.g. "IC1" */
  label?: string;
  /** Whether to render the component */
  visible?: boolean;
  /** Click handler */
  onClick?: () => void;
}

// ============================================================================
// Main Component
// ============================================================================

const ICSVG: React.FC<ICSVGProps> = ({
  pin1X,
  pin1Y,
  bottomRowY,
  pinCount,
  spec,
  label,
  visible = true,
  onClick,
}) => {
  if (!visible) return null;

  const pinsPerSide = pinCount / 2;
  const rowGap = bottomRowY - pin1Y;

  // Body geometry — sits in the gap between the two pin rows
  const bodyMarginY = Math.max(5, rowGap * 0.1);
  const bodyWidth   = (pinsPerSide - 1) * PIN_SPACING + BODY_MARGIN * 2;
  const bodyHeight  = rowGap - bodyMarginY * 2;
  const bodyLeft    = pin1X - BODY_MARGIN;
  const bodyTop     = pin1Y + bodyMarginY;
  const bodyBottom  = bodyTop + bodyHeight;
  const bodyCenterY = (bodyTop + bodyBottom) / 2;
  const bodyRight   = bodyLeft + bodyWidth;

  // Unique gradient/clip IDs (React.useId is stable across re-renders)
  const uid = React.useId().replace(/:/g, '');
  const gradId = `ic-grad-${uid}`;

  // IC body path: rounded rectangle + concave notch on left side (pin-1 end)
  //
  // The notch arc goes clockwise from (bodyLeft, bodyCenterY - NOTCH_R)
  // through (bodyLeft + NOTCH_R, bodyCenterY) to (bodyLeft, bodyCenterY + NOTCH_R),
  // creating a concave indentation into the body.
  const bodyPath = [
    `M ${bodyLeft + CORNER_R} ${bodyTop}`,
    `L ${bodyRight - CORNER_R} ${bodyTop}`,
    `Q ${bodyRight} ${bodyTop} ${bodyRight} ${bodyTop + CORNER_R}`,
    `L ${bodyRight} ${bodyBottom - CORNER_R}`,
    `Q ${bodyRight} ${bodyBottom} ${bodyRight - CORNER_R} ${bodyBottom}`,
    `L ${bodyLeft + CORNER_R} ${bodyBottom}`,
    `Q ${bodyLeft} ${bodyBottom} ${bodyLeft} ${bodyBottom - CORNER_R}`,
    `L ${bodyLeft} ${bodyCenterY + NOTCH_R}`,
    `A ${NOTCH_R} ${NOTCH_R} 0 0 1 ${bodyLeft} ${bodyCenterY - NOTCH_R}`,
    `L ${bodyLeft} ${bodyTop + CORNER_R}`,
    `Q ${bodyLeft} ${bodyTop} ${bodyLeft + CORNER_R} ${bodyTop}`,
    `Z`,
  ].join(' ');

  // Top pins: 1, 2, …, pinsPerSide  (left → right)
  const topPins = Array.from({ length: pinsPerSide }, (_, i) => ({
    number: i + 1,
    x: pin1X + i * PIN_SPACING,
  }));

  // Bottom pins: pinCount, pinCount−1, …, pinsPerSide+1  (left → right)
  const bottomPins = Array.from({ length: pinsPerSide }, (_, i) => ({
    number: pinCount - i,
    x: pin1X + i * PIN_SPACING,
  }));

  return (
    <g
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#3a3a3a" />
          <stop offset="40%"  stopColor="#1c1c1c" />
          <stop offset="100%" stopColor="#0a0a0a" />
        </linearGradient>
      </defs>

      {/* Top pin leads (from hole to body top edge) */}
      {topPins.map(pin => (
        <line
          key={`top-${pin.number}`}
          x1={pin.x} y1={pin1Y}
          x2={pin.x} y2={bodyTop}
          stroke="#C0C0C0"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      ))}

      {/* Bottom pin leads (from body bottom edge to hole) */}
      {bottomPins.map(pin => (
        <line
          key={`bottom-${pin.number}`}
          x1={pin.x} y1={bodyBottom}
          x2={pin.x} y2={bottomRowY}
          stroke="#C0C0C0"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      ))}

      {/* IC body */}
      <path
        d={bodyPath}
        fill={`url(#${gradId})`}
        stroke="#555555"
        strokeWidth="0.5"
      />

      {/* Highlight strip along top edge for 3-D effect */}
      <rect
        x={bodyLeft + CORNER_R}
        y={bodyTop}
        width={bodyWidth - CORNER_R * 2}
        height={2}
        fill="#FFFFFF"
        opacity="0.08"
        rx="1"
      />

      {/* Pin-1 dot indicator (white dot near top-left of body) */}
      <circle
        cx={bodyLeft + BODY_MARGIN}
        cy={bodyTop + 4}
        r={1.5}
        fill="#FFFFFF"
        opacity="0.7"
      />

      {/* Part number text */}
      <text
        x={bodyLeft + bodyWidth / 2}
        y={bodyCenterY}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={bodyHeight >= 20 ? '7' : '6'}
        fontFamily="monospace"
        fontWeight="600"
        fill="#C0C0C0"
        letterSpacing="0.3"
      >
        {spec.partNumber}
      </text>

      {/* Pin-1 number label (above body) */}
      <text
        x={pin1X}
        y={bodyTop - 3}
        textAnchor="middle"
        fontSize="5"
        fontFamily="monospace"
        fill="#888888"
      >
        1
      </text>

      {/* First bottom-row pin label (below body) — marks pin N/2+1 */}
      <text
        x={pin1X + (pinsPerSide - 1) * PIN_SPACING}
        y={bodyBottom + 9}
        textAnchor="middle"
        fontSize="5"
        fontFamily="monospace"
        fill="#888888"
      >
        {pinsPerSide + 1}
      </text>

      {/* Component reference label (e.g. "IC1") */}
      {label && (
        <text
          x={bodyLeft + bodyWidth / 2}
          y={bodyTop - 12}
          textAnchor="middle"
          fontSize="10"
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

export default ICSVG;
