/**
 * DiodeSVG Component
 *
 * Renders photorealistic diodes and LEDs on a breadboard.
 *
 * Diode types and their appearances:
 *   signal    — amber glass cylinder, black cathode band (1N4148, germanium)
 *   rectifier — black plastic cylinder, silver cathode band (1N4001, 1N5817)
 *   zener     — yellow-amber glass cylinder, black cathode band (1N4733)
 *   led       — colored dome with radial glow, flat cathode edge
 *
 * Like ResistorSVG, the component is positioned via startX/startY (anode side)
 * and endX/endY (cathode side). The cathode band / flat edge is rendered near endX.
 *
 * Phase 2 - Work Stream C: Component SVG Rendering
 */

import React from 'react';
import type { DiodeSpec, LEDSpec } from '@/types/component-specs.types';

// ============================================================================
// Props
// ============================================================================

export interface DiodeSVGProps {
  /** Anode lead hole coordinates */
  startX: number;
  startY: number;
  /** Cathode lead hole coordinates */
  endX: number;
  endY: number;
  /** Diode or LED specification from decodeDiode() / decodeLED() */
  spec: DiodeSpec | LEDSpec;
  /** Optional label (e.g. "D1", "D2 1N4148") */
  label?: string;
  /** Whether to render the component */
  visible?: boolean;
  /** Click handler */
  onClick?: () => void;
}

// ============================================================================
// Helpers
// ============================================================================

function calcAngle(x1: number, y1: number, x2: number, y2: number): number {
  return Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
}

function calcDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/** True if the spec is an LEDSpec */
function isLED(spec: DiodeSpec | LEDSpec): spec is LEDSpec {
  return spec.diodeType === 'led';
}

/** Dark bodies get a light band; light bodies get a dark band. */
function cathodeColor(bodyColor: string): string {
  // Parse brightness of body color
  const hex = bodyColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance < 128 ? '#C0C0C0' : '#111111';
}

// ============================================================================
// Sub-renderers
// ============================================================================

interface CylinderProps {
  totalLength: number;
  bodyColor: string;
  diodeType: 'signal' | 'rectifier' | 'zener';
  partNumber: string;
  voltage?: number;
  gradId: string;
}

/** Glass or plastic cylindrical diode body with cathode band */
function CylinderBody({ totalLength, bodyColor, diodeType, partNumber, voltage, gradId }: CylinderProps) {
  // Body dimensions — Scale: 24px = 2.54mm → 9.45px/mm
  // Signal/zener glass body: ~2mm dia × 4mm long → 19px × 38px
  // Rectifier plastic body:  ~2.7mm dia × 5.5mm long → 26px × 52px
  const bodyWidth  = diodeType === 'rectifier' ? 20 : 16;
  const bodyLength = Math.min(totalLength * 0.55, diodeType === 'rectifier' ? 50 : 36);
  const halfBody   = bodyLength / 2;
  const halfWidth  = bodyWidth / 2;
  const cathodeBandW = 5;

  // Cathode band sits near the right (+) end of the body
  const bandX = halfBody - cathodeBandW - 2;
  const bandColor = cathodeColor(bodyColor);

  // Glass-type gradient (light top, body color middle, dark bottom)
  // Plastic-type is flatter/darker
  const isGlass = diodeType !== 'rectifier';

  return (
    <>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
          {isGlass ? (
            <>
              <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.5" />
              <stop offset="25%"  stopColor={bodyColor} stopOpacity="0.9" />
              <stop offset="75%"  stopColor={bodyColor} stopOpacity="1.0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.25" />
            </>
          ) : (
            <>
              <stop offset="0%"   stopColor="#555555" stopOpacity="1" />
              <stop offset="35%"  stopColor={bodyColor} stopOpacity="1" />
              <stop offset="100%" stopColor="#000000" stopOpacity="1" />
            </>
          )}
        </linearGradient>
      </defs>

      {/* Left lead (anode) */}
      <line
        x1={-totalLength / 2} y1={0}
        x2={-halfBody}        y2={0}
        stroke="#B8860B" strokeWidth="2.5" strokeLinecap="round"
      />

      {/* Right lead (cathode) */}
      <line
        x1={halfBody}          y1={0}
        x2={totalLength / 2}   y2={0}
        stroke="#B8860B" strokeWidth="2.5" strokeLinecap="round"
      />

      {/* Body */}
      <rect
        x={-halfBody} y={-halfWidth}
        width={bodyLength} height={bodyWidth}
        fill={`url(#${gradId})`}
        stroke={isGlass ? '#8B7355' : '#333333'}
        strokeWidth="0.5"
        rx={halfWidth}
      />

      {/* Cathode band */}
      <rect
        x={bandX}     y={-halfWidth}
        width={cathodeBandW} height={bodyWidth}
        fill={bandColor}
        opacity="0.9"
      />
      {/* Band highlight for 3-D effect */}
      <rect
        x={bandX} y={-halfWidth}
        width={cathodeBandW} height={bodyWidth / 3}
        fill="#FFFFFF" opacity="0.12"
      />

      {/* Voltage label for zener (if body is wide enough) */}
      {diodeType === 'zener' && voltage && bodyLength > 22 && (
        <text
          x={-halfBody / 2} y={1.5}
          textAnchor="middle"
          fontSize="4.5"
          fontFamily="monospace"
          fontWeight="600"
          fill={isGlass ? '#553311' : '#CCCCCC'}
        >
          {voltage}V
        </text>
      )}

      {/* Part number for rectifier (body is large enough) */}
      {diodeType === 'rectifier' && bodyLength > 30 && (
        <text
          x={-halfBody / 2 - 2} y={1.5}
          textAnchor="middle"
          fontSize="4"
          fontFamily="monospace"
          fill="#CCCCCC"
        >
          {partNumber}
        </text>
      )}
    </>
  );
}

interface DomeProps {
  totalLength: number;
  spec: LEDSpec;
  gradId: string;
  glowId: string;
  clipId: string;
}

/** LED dome body with colored glow, flat cathode edge, and anode/cathode leads */
function LEDDome({ totalLength, spec, gradId, glowId, clipId }: DomeProps) {
  // 5mm LED dia = 47px → radius 24px; 3mm LED = 28px → radius 14px
  const radius = spec.size === '5mm' ? 22 : 14;
  const bodyColor = spec.color;

  // LED colors are bright — compute a lighter glow color
  const hex = bodyColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const glowColor = `rgb(${Math.min(r + 80, 255)},${Math.min(g + 80, 255)},${Math.min(b + 80, 255)})`;

  // Flat cathode edge: clip the right side of the circle
  const flatCutX = radius - 3; // how far in from the right edge the flat sits

  return (
    <>
      <defs>
        {/* Radial glow gradient */}
        <radialGradient id={gradId}>
          <stop offset="0%"   stopColor={glowColor}  stopOpacity="1.0" />
          <stop offset="55%"  stopColor={bodyColor}   stopOpacity="1.0" />
          <stop offset="100%" stopColor={bodyColor}   stopOpacity="0.7" />
        </radialGradient>

        {/* Outer glow halo */}
        <radialGradient id={glowId}>
          <stop offset="0%"   stopColor={glowColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={glowColor} stopOpacity="0" />
        </radialGradient>

        {/* Clip path to create flat cathode edge */}
        <clipPath id={clipId}>
          <rect
            x={-radius - 2}
            y={-radius - 2}
            width={radius + flatCutX + 2}
            height={(radius + 2) * 2}
          />
        </clipPath>
      </defs>

      {/* Anode lead (left) */}
      <line
        x1={-totalLength / 2} y1={0}
        x2={-(radius + 2)}    y2={0}
        stroke="#B8860B" strokeWidth="2.5" strokeLinecap="round"
      />

      {/* Cathode lead (right, slightly shorter) */}
      <line
        x1={flatCutX + 1}   y1={0}
        x2={totalLength / 2} y2={0}
        stroke="#B8860B" strokeWidth="2.5" strokeLinecap="round"
      />

      {/* Outer glow halo */}
      <circle
        cx={0} cy={0}
        r={radius + 5}
        fill={`url(#${glowId})`}
      />

      {/* LED body — clipped to produce flat cathode edge */}
      <circle
        cx={0} cy={0}
        r={radius}
        fill={`url(#${gradId})`}
        stroke={bodyColor}
        strokeWidth="0.8"
        clipPath={`url(#${clipId})`}
      />

      {/* Flat cathode edge line */}
      <line
        x1={flatCutX} y1={-Math.sqrt(Math.max(0, radius ** 2 - flatCutX ** 2))}
        x2={flatCutX} y2={ Math.sqrt(Math.max(0, radius ** 2 - flatCutX ** 2))}
        stroke={bodyColor}
        strokeWidth="1.5"
        opacity="0.8"
      />

      {/* Specular highlight */}
      <ellipse
        cx={-radius * 0.25} cy={-radius * 0.3}
        rx={radius * 0.25}  ry={radius * 0.15}
        fill="#FFFFFF" opacity="0.35"
      />
    </>
  );
}

// ============================================================================
// Main Component
// ============================================================================

const DiodeSVG: React.FC<DiodeSVGProps> = ({
  startX, startY,
  endX,   endY,
  spec,
  label,
  visible = true,
  onClick,
}) => {
  if (!visible) return null;

  const totalLength = calcDistance(startX, startY, endX, endY);
  const angle  = calcAngle(startX, startY, endX, endY);
  const centerX = (startX + endX) / 2;
  const centerY = (startY + endY) / 2;

  const uid = React.useId().replace(/:/g, '');

  // Choose body height for label positioning (matches updated CylinderBody / LEDDome sizes)
  const bodyWidth = isLED(spec)
    ? (spec.size === '5mm' ? 44 : 28)
    : (spec.diodeType === 'rectifier' ? 20 : 16);

  return (
    <g
      transform={`translate(${centerX}, ${centerY}) rotate(${angle})`}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      {isLED(spec) ? (
        <LEDDome
          totalLength={totalLength}
          spec={spec}
          gradId={`led-grad-${uid}`}
          glowId={`led-glow-${uid}`}
          clipId={`led-clip-${uid}`}
        />
      ) : (
        <CylinderBody
          totalLength={totalLength}
          bodyColor={spec.color}
          diodeType={spec.diodeType as 'signal' | 'rectifier' | 'zener'}
          partNumber={spec.partNumber}
          voltage={spec.voltage}
          gradId={`diode-grad-${uid}`}
        />
      )}

      {/* Label */}
      {label && (
        <text
          x={0}
          y={-bodyWidth / 2 - 8}
          textAnchor="middle"
          fontSize="10"
          fontFamily="monospace"
          fontWeight="600"
          fill="#1f2937"
          transform={`rotate(${-angle})`}
        >
          {label}
        </text>
      )}
    </g>
  );
};

export default DiodeSVG;
