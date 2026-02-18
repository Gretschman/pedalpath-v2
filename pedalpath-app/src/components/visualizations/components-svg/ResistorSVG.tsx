/**
 * ResistorSVG Component
 *
 * Renders a photorealistic resistor component with accurate color bands.
 * Used in breadboard visualizations to show resistor placement and values.
 *
 * Phase 2 - Work Stream C: Component SVG Rendering
 */

import React from 'react';
import type { ResistorColor, ResistorSpec } from '@/types/component-specs.types';

// ===========================================================================
// Color Mapping (IEC 60062 Standard Colors)
// ===========================================================================

const RESISTOR_COLOR_HEX: Record<ResistorColor, string> = {
  black: '#000000',
  brown: '#8B4513',
  red: '#FF0000',
  orange: '#FF8C00',
  yellow: '#FFD700',
  green: '#008000',
  blue: '#0000FF',
  violet: '#8B00FF',
  purple: '#8B00FF',  // alias
  gray: '#808080',
  grey: '#808080',    // alias
  white: '#FFFFFF',
  gold: '#FFD700',
  silver: '#C0C0C0',
};

// ===========================================================================
// Component Props
// ===========================================================================

export interface ResistorSVGProps {
  /** Start hole coordinates (where first lead connects) */
  startX: number;
  startY: number;
  /** End hole coordinates (where second lead connects) */
  endX: number;
  endY: number;
  /** Resistor specification with color bands */
  spec: ResistorSpec | { bands: ResistorColor[] };
  /** Optional label to display (e.g., "R1", "10kΩ") */
  label?: string;
  /** Body color (default: tan) */
  bodyColor?: string;
  /** Whether to show the component (for animations) */
  visible?: boolean;
  /** Click handler */
  onClick?: () => void;
}

// ===========================================================================
// Helper Functions
// ===========================================================================

/**
 * Calculate the angle of the resistor relative to horizontal
 */
function calculateAngle(x1: number, y1: number, x2: number, y2: number): number {
  return Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
}

/**
 * Calculate the distance between two points
 */
function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// ===========================================================================
// Main Component
// ===========================================================================

const ResistorSVG: React.FC<ResistorSVGProps> = ({
  startX,
  startY,
  endX,
  endY,
  spec,
  label,
  bodyColor = '#D2B48C', // tan
  visible = true,
  onClick,
}) => {
  if (!visible) return null;

  // Extract bands from spec
  const bands = 'bands' in spec ? spec.bands : [];

  // Use 5-band if 5 colors, otherwise 4-band
  const displayBands = bands.length >= 5 ? bands.slice(0, 5) : bands.slice(0, 4);

  // Calculate resistor orientation and dimensions
  const totalLength = calculateDistance(startX, startY, endX, endY);
  const angle = calculateAngle(startX, startY, endX, endY);
  const centerX = (startX + endX) / 2;
  const centerY = (startY + endY) / 2;

  // Resistor body dimensions (in pixels)
  // Standard 1/4W resistor is about 6mm long, 2.3mm diameter
  // At 25.4px per 2.54mm (breadboard hole spacing), 6mm ≈ 60px
  const bodyLength = Math.min(totalLength * 0.6, 60);
  const bodyWidth = 10; // diameter

  // Band positioning (5-band vs 4-band layouts)
  const isFiveBand = displayBands.length === 5;
  const bandWidth = isFiveBand ? 3 : 4;
  const bandSpacing = isFiveBand ? 7 : 9;
  const firstBandOffset = isFiveBand ? -22 : -20;

  // Generate unique IDs for gradients
  const gradientId = `resistor-gradient-${Math.random().toString(36).substr(2, 9)}`;
  const bodyGradientId = `resistor-body-gradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <g
      transform={`translate(${centerX}, ${centerY}) rotate(${angle})`}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      {/* Define gradients for 3D effect */}
      <defs>
        {/* Cylindrical gradient for body */}
        <linearGradient id={bodyGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
          <stop offset="30%" stopColor={bodyColor} stopOpacity="0.9" />
          <stop offset="70%" stopColor={bodyColor} stopOpacity="1" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
        </linearGradient>

        {/* Shadow gradient */}
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
        </linearGradient>
      </defs>

      {/* Left lead (from start hole to body) */}
      <line
        x1={-totalLength / 2}
        y1={0}
        x2={-bodyLength / 2}
        y2={0}
        stroke="#B8860B"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Right lead (from body to end hole) */}
      <line
        x1={bodyLength / 2}
        y1={0}
        x2={totalLength / 2}
        y2={0}
        stroke="#B8860B"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Resistor body shadow (for depth) */}
      <rect
        x={-bodyLength / 2}
        y={-bodyWidth / 2 + 1}
        width={bodyLength}
        height={bodyWidth}
        fill={`url(#${gradientId})`}
        rx={bodyWidth / 2}
        opacity="0.2"
      />

      {/* Main resistor body */}
      <rect
        x={-bodyLength / 2}
        y={-bodyWidth / 2}
        width={bodyLength}
        height={bodyWidth}
        fill={`url(#${bodyGradientId})`}
        stroke="#8B7355"
        strokeWidth="0.5"
        rx={bodyWidth / 2}
      />

      {/* Color bands */}
      {displayBands.map((color: ResistorColor, index: number) => {
        const bandX = firstBandOffset + index * bandSpacing;
        const bandColor = RESISTOR_COLOR_HEX[color] || '#808080';

        // Special handling for white and gold/silver (add subtle borders)
        const needsBorder = color === 'white' || color === 'gold' || color === 'silver';

        return (
          <g key={`band-${index}`}>
            {/* Band with subtle 3D effect */}
            <rect
              x={bandX}
              y={-bodyWidth / 2}
              width={bandWidth}
              height={bodyWidth}
              fill={bandColor}
              opacity="0.95"
            />

            {/* Highlight on top for 3D effect */}
            <rect
              x={bandX}
              y={-bodyWidth / 2}
              width={bandWidth}
              height={bodyWidth / 3}
              fill="#FFFFFF"
              opacity="0.15"
            />

            {/* Shadow on bottom for 3D effect */}
            <rect
              x={bandX}
              y={bodyWidth / 2 - bodyWidth / 3}
              width={bandWidth}
              height={bodyWidth / 3}
              fill="#000000"
              opacity="0.15"
            />

            {/* Border for light-colored bands */}
            {needsBorder && (
              <rect
                x={bandX}
                y={-bodyWidth / 2}
                width={bandWidth}
                height={bodyWidth}
                fill="none"
                stroke="#666666"
                strokeWidth="0.3"
                opacity="0.3"
              />
            )}
          </g>
        );
      })}

      {/* Label (component reference) */}
      {label && (
        <text
          x={0}
          y={-bodyWidth - 8}
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

export default ResistorSVG;
