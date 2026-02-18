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
  const uf = spec.capacitance.uf;

  switch (spec.capType) {
    case 'ceramic':
      // Small disc: 5-8mm diameter
      return { width: 8, height: 8 };

    case 'film_box':
      // Box capacitor: varies by capacitance
      if (uf < 0.01) return { width: 8, height: 12 }; // < 10nF
      if (uf < 0.1) return { width: 10, height: 14 }; // 10-100nF
      return { width: 12, height: 16 }; // > 100nF

    case 'electrolytic':
      // Cylindrical: diameter based on capacitance
      if (uf < 1) return { width: 8, height: 12 };
      if (uf < 10) return { width: 10, height: 16 };
      if (uf < 100) return { width: 12, height: 20 };
      return { width: 14, height: 24 };

    case 'tantalum':
      // Small teardrop/blob
      return { width: 8, height: 10 };

    default:
      return { width: 10, height: 14 };
  }
}

/**
 * Get capacitor body color based on type
 */
function getCapacitorColor(spec: CapacitorSpec): string {
  if (spec.color) return spec.color;

  switch (spec.capType) {
    case 'ceramic':
      return '#D4A574'; // tan/brown

    case 'film_box':
      return '#FFD700'; // yellow/gold (Polyester film)

    case 'electrolytic':
      return '#2C3E50'; // dark blue/black

    case 'tantalum':
      return '#FFB347'; // orange/tan

    default:
      return '#808080'; // gray
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

      {/* Polarity stripe (negative side) */}
      {spec.polarized && (
        <g>
          <rect
            x={radius - 3}
            y={-height / 2}
            width={2}
            height={height}
            fill="#CCCCCC"
            opacity="0.8"
          />
          <text
            x={radius - 2}
            y={0}
            textAnchor="middle"
            fontSize="6"
            fontWeight="bold"
            fill="#FFFFFF"
          >
            -
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

  const { width, height } = getCapacitorDimensions(spec);
  const color = getCapacitorColor(spec);
  const gradientId = `cap-gradient-${Math.random().toString(36).substr(2, 9)}`;

  // Choose rendering component based on type
  const BodyComponent =
    spec.capType === 'ceramic' ? CeramicDiscBody :
    spec.capType === 'film_box' ? FilmBoxBody :
    spec.capType === 'electrolytic' ? ElectrolyticBody :
    spec.capType === 'tantalum' ? TantalumBody :
    FilmBoxBody; // default

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
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Right lead */}
      <line
        x1={width / 2 + 2}
        y1={0}
        x2={totalLength / 2}
        y2={0}
        stroke="#B8860B"
        strokeWidth="1.5"
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
