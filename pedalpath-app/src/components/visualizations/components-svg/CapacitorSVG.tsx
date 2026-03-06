/**
 * CapacitorSVG Component
 *
 * Renders photorealistic capacitors with different shapes based on type.
 * Supports ceramic, film, electrolytic, and tantalum capacitors.
 *
 * Phase 2 - Work Stream C: Component SVG Rendering
 */

import React from 'react';
import type { CapacitorSpec } from '@/types/component-specs.types';
import { formatCapacitance } from '@/utils/decoders';

// ===========================================================================
// Component Props
// ===========================================================================

export interface CapacitorSVGProps {
  /** Start hole coordinates (where first lead connects) */
  startX: number;
  startY: number;
  /** End hole coordinates (where second lead connects) */
  endX: number;
  endY: number;
  /** Capacitor specification */
  spec: CapacitorSpec;
  /** Optional label to display (e.g., "C1", "47nF") */
  label?: string;
  /** Whether to show the component (for animations) */
  visible?: boolean;
  /** Click handler */
  onClick?: () => void;
}

// ===========================================================================
// Helper Functions
// ===========================================================================

function calculateAngle(x1: number, y1: number, x2: number, y2: number): number {
  return Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
}

function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * Get capacitor body dimensions based on type and value
 */
function getCapacitorDimensions(spec: CapacitorSpec): { width: number; height: number } {
  // Scale: 24px = 2.54mm → 9.45px/mm
  const uf = spec.capacitance.uf;

  switch (spec.capType) {
    case 'ceramic':
      // Ceramic disc: ~3-5mm dia → 28-47px. Use 20px (leaves gap between holes)
      return { width: 20, height: 20 };

    case 'film_box':
      // Box capacitor: ~5-8mm × 4-7mm body
      if (uf < 0.01) return { width: 18, height: 24 }; // < 10nF: small box
      if (uf < 0.1) return { width: 22, height: 28 };  // 10-100nF: medium box
      return { width: 26, height: 32 };                 // > 100nF: larger box

    case 'electrolytic':
      // Cylindrical — diameter scales with capacitance
      if (uf < 1)   return { width: 18, height: 26 };  // small (0.47µF etc)
      if (uf < 10)  return { width: 22, height: 32 };  // medium (4.7µF)
      if (uf < 100) return { width: 26, height: 38 };  // large (47µF)
      return { width: 30, height: 44 };                 // very large (100µF+)

    case 'tantalum':
      // Tantalum bead/teardrop — small
      return { width: 18, height: 22 };

    default:
      return { width: 22, height: 28 };
  }
}

/**
 * Get capacitor body color based on type
 */
function getCapacitorColor(spec: CapacitorSpec): string {
  if (spec.color) return spec.color;

  switch (spec.capType) {
    case 'ceramic':
      return '#C8A86B'; // warm tan/brown disc — matches reference photo

    case 'film_box':
      return '#E8D5A3'; // cream/polyester — matches reference photo (not yellow)

    case 'electrolytic':
      return '#1A2E4A'; // dark navy blue — matches reference photo electrolytics

    case 'tantalum':
      return '#DDBB00'; // yellow bead — matches reference photo small yellow tantalum

    default:
      return '#888888'; // gray
  }
}

// ===========================================================================
// Sub-Components for Different Capacitor Types
// ===========================================================================

interface CapBodyProps {
  width: number;
  height: number;
  color: string;
  spec: CapacitorSpec;
  gradientId: string;
}

function CeramicDiscBody({ width, height: _height, color, spec, gradientId }: CapBodyProps) {
  const radius = width / 2;

  return (
    <g>
      <defs>
        <radialGradient id={gradientId}>
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.3" />
          <stop offset="50%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.2" />
        </radialGradient>
      </defs>

      {/* Disc body */}
      <circle
        cx={0}
        cy={0}
        r={radius}
        fill={`url(#${gradientId})`}
        stroke="#8B7355"
        strokeWidth="0.5"
      />

      {/* Markings */}
      {spec.marking && (
        <text
          x={0}
          y={1.5}
          textAnchor="middle"
          fontSize="4"
          fontFamily="monospace"
          fontWeight="600"
          fill="#333333"
        >
          {spec.marking.substring(0, 3)}
        </text>
      )}
    </g>
  );
}

function FilmBoxBody({ width, height, color, spec, gradientId }: CapBodyProps) {
  return (
    <g>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
          <stop offset="50%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* Box body */}
      <rect
        x={-width / 2}
        y={-height / 2}
        width={width}
        height={height}
        fill={`url(#${gradientId})`}
        stroke="#8B7355"
        strokeWidth="0.5"
        rx="1"
      />

      {/* Marking text */}
      {spec.marking && (
        <text
          x={0}
          y={-height / 4}
          textAnchor="middle"
          fontSize="4"
          fontFamily="monospace"
          fontWeight="600"
          fill="#000000"
        >
          {spec.marking}
        </text>
      )}

      {/* Voltage rating */}
      {spec.voltageMax && (
        <text
          x={0}
          y={height / 4}
          textAnchor="middle"
          fontSize="3.5"
          fontFamily="monospace"
          fill="#000000"
        >
          {spec.voltageMax}V
        </text>
      )}
    </g>
  );
}

function ElectrolyticBody({ width, height, color, spec, gradientId }: CapBodyProps) {
  const radius = width / 2;

  return (
    <g>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.3" />
          <stop offset="30%" stopColor={color} stopOpacity="1" />
          <stop offset="70%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
        </linearGradient>
      </defs>

      {/* Cylindrical body */}
      <rect
        x={-radius}
        y={-height / 2}
        width={width}
        height={height}
        fill={`url(#${gradientId})`}
        stroke="#1a1a1a"
        strokeWidth="0.5"
        rx={radius}
      />

      {/* Polarity stripe — white band on negative (left / start) side */}
      {spec.polarized && (
        <g>
          <rect
            x={-radius}
            y={-height / 2}
            width={radius * 0.55}
            height={height}
            fill="#D0D8E0"
            rx={radius}
            opacity="0.85"
          />
          <text
            x={-radius * 0.6}
            y={3}
            textAnchor="middle"
            fontSize="7"
            fontWeight="bold"
            fill="#1A2E4A"
          >
            −
          </text>
        </g>
      )}

      {/* Capacitance value */}
      <text
        x={-radius / 2}
        y={-height / 4 + 2}
        textAnchor="middle"
        fontSize="4"
        fontFamily="monospace"
        fontWeight="600"
        fill="#FFFFFF"
      >
        {formatCapacitance(spec.capacitance)}
      </text>

      {/* Voltage rating */}
      {spec.voltageMax && (
        <text
          x={-radius / 2}
          y={height / 4 - 1}
          textAnchor="middle"
          fontSize="3.5"
          fontFamily="monospace"
          fill="#FFFFFF"
        >
          {spec.voltageMax}V
        </text>
      )}
    </g>
  );
}

function TantalumBody({ width, height, color, spec, gradientId }: CapBodyProps) {
  return (
    <g>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
          <stop offset="50%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* Teardrop/blob body */}
      <ellipse
        cx={0}
        cy={0}
        rx={width / 2}
        ry={height / 2}
        fill={`url(#${gradientId})`}
        stroke="#8B7355"
        strokeWidth="0.5"
      />

      {/* Polarity stripe */}
      {spec.polarized && (
        <rect
          x={width / 2 - 2}
          y={-height / 2}
          width={1.5}
          height={height}
          fill="#FFFFFF"
          opacity="0.8"
        />
      )}

      {/* Value */}
      <text
        x={0}
        y={1}
        textAnchor="middle"
        fontSize="3.5"
        fontFamily="monospace"
        fontWeight="600"
        fill="#000000"
      >
        {formatCapacitance(spec.capacitance)}
      </text>
    </g>
  );
}

// ===========================================================================
// Upright (top-down view) — for radial electrolytics and film caps
// ===========================================================================

/**
 * Top-down silhouette of an upright radial capacitor.
 * Angle ≈ 90°: the two leads go into adjacent rows (e.g. b→c on the breadboard),
 * so the body stands perpendicular to the board and we show the can from above.
 */
interface UprightCapBodyProps {
  spec: CapacitorSpec;
  /** Distance from startHole to endHole (one hole pitch = 24px) */
  totalLength: number;
  /** Unique id prefix for SVG defs */
  gradientId: string;
  /** Angle of lead axis — used to counter-rotate text so it stays readable */
  angle: number;
}

function UprightCapBody({ spec, totalLength, gradientId, angle }: UprightCapBodyProps) {
  const color = getCapacitorColor(spec);
  const uf = spec.capacitance.uf;

  if (spec.capType === 'electrolytic' || spec.capType === 'tantalum') {
    // Electrolytic: large circle = view from above the can top
    // Diameter scales with capacitance, capped so it covers the lead holes nicely
    const r = uf >= 100 ? 14 : uf >= 10 ? 12 : uf >= 1 ? 10 : 8;
    const clipId = `${gradientId}-clip`;

    return (
      <g>
        <defs>
          <radialGradient id={gradientId} cx="35%" cy="35%">
            <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.5" />
            <stop offset="55%"  stopColor={color}   stopOpacity="1" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
          </radialGradient>
          <clipPath id={clipId}>
            <circle cx={0} cy={0} r={r} />
          </clipPath>
        </defs>

        {/* Can body — circle */}
        <circle cx={0} cy={0} r={r} fill={`url(#${gradientId})`} stroke="#1a1a1a" strokeWidth="0.6" />

        {/* Polarity stripe — light band on negative (endHole = +y direction) side */}
        {spec.polarized && (
          <rect
            x={-r * 0.55}
            y={0}
            width={r * 1.1}
            height={r}
            fill="#D0D8E0"
            opacity="0.85"
            clipPath={`url(#${clipId})`}
          />
        )}

        {/* + marker (positive side, toward startHole = -y direction in rotated frame) */}
        {spec.polarized && (
          <text x={0} y={-r * 0.4} textAnchor="middle" fontSize="7" fontWeight="bold" fill="#FFFFFF">+</text>
        )}

        {/* Value label — rotated back to horizontal so it's always readable */}
        <text
          x={r + 8}
          y={1}
          textAnchor="start"
          fontSize="8"
          fontFamily="monospace"
          fontWeight="600"
          fill="#1f2937"
          transform={`rotate(${-angle})`}
        >
          {formatCapacitance(spec.capacitance)}
        </text>
      </g>
    );
  }

  // Film cap top-down: compact upright rectangle
  const w = 8;
  const h = totalLength * 0.7; // slightly smaller than hole span
  return (
    <g>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.4" />
          <stop offset="50%"  stopColor={color}   stopOpacity="1" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={`url(#${gradientId})`} stroke="#8B7355" strokeWidth="0.5" rx="1" />
      {spec.marking && (
        <text
          x={w + 4}
          y={1}
          textAnchor="start"
          fontSize="7"
          fontFamily="monospace"
          fontWeight="600"
          fill="#1f2937"
          transform={`rotate(${-angle})`}
        >
          {spec.marking}
        </text>
      )}
    </g>
  );
}

// ===========================================================================
// Main Component
// ===========================================================================

const CapacitorSVG: React.FC<CapacitorSVGProps> = ({
  startX,
  startY,
  endX,
  endY,
  spec,
  label,
  visible = true,
  onClick,
}) => {
  if (!visible) return null;

  // Calculate orientation and dimensions
  const totalLength = calculateDistance(startX, startY, endX, endY);
  const angle = calculateAngle(startX, startY, endX, endY);
  const centerX = (startX + endX) / 2;
  const centerY = (startY + endY) / 2;

  // Upright mode: leads in same column, adjacent rows → angle ≈ ±90°
  const isUpright = Math.abs(Math.abs(angle) - 90) < 20;

  const { width, height } = getCapacitorDimensions(spec);
  const color = getCapacitorColor(spec);
  const gradientId = `cap-gradient-${Math.random().toString(36).substr(2, 9)}`;

  // Choose rendering component based on type (horizontal/axial mode only)
  const BodyComponent =
    spec.capType === 'ceramic' ? CeramicDiscBody :
    spec.capType === 'film_box' ? FilmBoxBody :
    spec.capType === 'electrolytic' ? ElectrolyticBody :
    spec.capType === 'tantalum' ? TantalumBody :
    FilmBoxBody; // default

  // Upright (top-down) mode: radial cap standing perpendicular to the board
  if (isUpright) {
    return (
      <g
        transform={`translate(${centerX}, ${centerY}) rotate(${angle})`}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
        onClick={onClick}
      >
        {/* Lead to startHole (positive, upper) */}
        <line x1={0} y1={0} x2={-totalLength / 2} y2={0} stroke="#B8860B" strokeWidth="2" strokeLinecap="round" />
        {/* Lead to endHole (negative, lower) */}
        <line x1={0} y1={0} x2={totalLength / 2} y2={0} stroke="#B8860B" strokeWidth="2" strokeLinecap="round" />

        <UprightCapBody spec={spec} totalLength={totalLength} gradientId={gradientId} angle={angle} />

        {/* Reference label (e.g. C1) — counter-rotated, above body */}
        {label && (
          <text
            x={-16}
            y={-2}
            textAnchor="middle"
            fontSize="9"
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
  }

  // Horizontal (axial) mode — ceramic discs and fallback
  return (
    <g
      transform={`translate(${centerX}, ${centerY}) rotate(${angle})`}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      {/* Left lead */}
      <line
        x1={-totalLength / 2}
        y1={0}
        x2={-width / 2 - 2}
        y2={0}
        stroke="#B8860B"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Right lead */}
      <line
        x1={width / 2 + 2}
        y1={0}
        x2={totalLength / 2}
        y2={0}
        stroke="#B8860B"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Capacitor body */}
      <BodyComponent
        width={width}
        height={height}
        color={color}
        spec={spec}
        gradientId={gradientId}
      />

      {/* Label */}
      {label && (
        <text
          x={0}
          y={-height / 2 - 8}
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

export default CapacitorSVG;
