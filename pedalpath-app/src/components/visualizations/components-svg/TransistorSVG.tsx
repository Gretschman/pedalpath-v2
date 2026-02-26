/**
 * TransistorSVG Component
 *
 * Renders transistor packages for breadboard visualization.
 *
 * Packages:
 *   TO-92  — Silicon BJT/FET (e.g. BC547, 2N3904). D-shaped black body, flat face down.
 *   TO-18  — Germanium Metal Can (e.g. AC128, OC71). Round silver can with ID tab.
 *   TO-220 — Power device with heatsink tab (not yet rendered, falls through to TO-92).
 *
 * Coordinate system: x = center (B) pin hole, y = hole row y.
 * Leads extend upward from holes to body bottom.
 */

import React from 'react';
import type { TransistorSpec } from '@/types/component-specs.types';

export interface TransistorSVGProps {
  /** Center (B pin) hole x coordinate */
  x: number;
  /** Hole row y coordinate — leads connect here */
  y: number;
  /** Transistor specification */
  spec: TransistorSpec;
  /** Optional label (e.g. "Q1") */
  label?: string;
  /** Pin spacing in px — defaults to 24 (breadboard hole spacing) */
  pinSpacing?: number;
}

// ============================================================================
// TO-92 D-Shape Body (Silicon)
// ============================================================================

function TO92Body({ x, bodyBottom, bw, bh }: { x: number; bodyBottom: number; bw: number; bh: number }) {
  const bodyPath = [
    `M ${x - bw / 2} ${bodyBottom}`,
    `L ${x + bw / 2} ${bodyBottom}`,
    `A ${bw / 2} ${bh / 2} 0 0 0 ${x - bw / 2} ${bodyBottom}`,
    'Z',
  ].join(' ');
  const bodyCenterY = bodyBottom - bh / 2;

  return (
    <>
      {/* Shadow */}
      <path d={bodyPath} fill="#000000" opacity={0.15} transform="translate(1,1)" />
      {/* Black D-shape body */}
      <path d={bodyPath} fill="#1A1A1A" stroke="#444444" strokeWidth="0.5" />
      {/* Highlight */}
      <ellipse cx={x} cy={bodyBottom - bh * 0.7} rx={bw * 0.3} ry={bh * 0.2} fill="#FFFFFF" opacity={0.08} />
      {/* Part number on flat face */}
      <text x={x} y={bodyCenterY + 2} textAnchor="middle" fontSize="7" fontFamily="monospace" fill="#CCCCCC" letterSpacing="-0.5">
        {'\u00A0'}
      </text>
    </>
  );
}

// ============================================================================
// TO-18 Metal Can Body (Germanium)
// ============================================================================

function TO18Body({ x, bodyBottom, radius, gradId }: { x: number; bodyBottom: number; radius: number; gradId: string }) {
  const bodyCenterY = bodyBottom - radius;

  return (
    <>
      {/* Shadow */}
      <circle cx={x + 1} cy={bodyCenterY + 1} r={radius} fill="#000000" opacity={0.15} />
      {/* Silver metal can */}
      <circle cx={x} cy={bodyCenterY} r={radius} fill={`url(#${gradId})`} stroke="#666666" strokeWidth="1" />
      {/* Identification tab (key notch at bottom) — marks pin 1 (Emitter) */}
      <rect
        x={x - 2.5} y={bodyBottom - 4}
        width={5} height={6}
        fill="#888888" stroke="#555555" strokeWidth="0.5" rx="1"
      />
      {/* Specular highlight */}
      <ellipse
        cx={x - radius * 0.3} cy={bodyCenterY - radius * 0.3}
        rx={radius * 0.25} ry={radius * 0.18}
        fill="#FFFFFF" opacity={0.4}
      />
    </>
  );
}

// ============================================================================
// Main Component
// ============================================================================

const TransistorSVG: React.FC<TransistorSVGProps> = ({
  x,
  y,
  spec,
  label,
  pinSpacing = 24,
}) => {
  // Scale: 24px = 2.54mm → 9.45px/mm
  const isTO18 = spec.package === 'TO-18';

  // TO-18: round can, ~5.6mm dia → radius 27px
  // TO-92: D-shape, ~5mm wide → bw=46, bh=46
  const leadLength = 36;  // px from hole to body base

  const bodyBottom = y - leadLength;

  const eX = x - pinSpacing;
  const bX = x;
  const cX = x + pinSpacing;

  // Body dimensions
  const to18Radius = 27;
  const bw = 46;
  const bh = 46;
  const bodyTopY = isTO18 ? bodyBottom - to18Radius * 2 : bodyBottom - bh;

  const uid = React.useId().replace(/:/g, '');

  return (
    <g className="transistor-component">
      {/* Gradient def for TO-18 metal can */}
      <defs>
        <radialGradient id={`to18-grad-${uid}`} cx="35%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#D8D8D8" />
          <stop offset="60%" stopColor="#A0A0A0" />
          <stop offset="100%" stopColor="#666666" />
        </radialGradient>
      </defs>

      {/* Three leads: E (left), B (center), C (right) */}
      <line x1={eX} y1={y} x2={eX} y2={bodyBottom} stroke="#A0A0A0" strokeWidth="2.5" strokeLinecap="round" />
      <line x1={bX} y1={y} x2={bX} y2={bodyBottom} stroke="#A0A0A0" strokeWidth="2.5" strokeLinecap="round" />
      <line x1={cX} y1={y} x2={cX} y2={bodyBottom} stroke="#A0A0A0" strokeWidth="2.5" strokeLinecap="round" />

      {/* Package body */}
      {isTO18 ? (
        <TO18Body x={x} bodyBottom={bodyBottom} radius={to18Radius} gradId={`to18-grad-${uid}`} />
      ) : (
        <TO92Body x={x} bodyBottom={bodyBottom} bw={bw} bh={bh} />
      )}

      {/* Part number */}
      <text
        x={x} y={isTO18 ? bodyBottom - to18Radius + 4 : bodyBottom - bh / 2 + 2}
        textAnchor="middle" fontSize="7" fontFamily="monospace"
        fill={isTO18 ? '#333333' : '#CCCCCC'} letterSpacing="-0.5"
      >
        {spec.partNumber.substring(0, 7)}
      </text>

      {/* Pin labels below leads */}
      <text x={eX} y={y + 11} textAnchor="middle" fontSize="6" fontFamily="sans-serif" fill="#666666">E</text>
      <text x={bX} y={y + 11} textAnchor="middle" fontSize="6" fontFamily="sans-serif" fill="#666666">B</text>
      <text x={cX} y={y + 11} textAnchor="middle" fontSize="6" fontFamily="sans-serif" fill="#666666">C</text>

      {/* Reference designator (Q1 etc.) */}
      {label && (
        <text
          x={x} y={bodyTopY - 7}
          textAnchor="middle" fontSize="10" fontFamily="monospace" fontWeight="600" fill="#1f2937"
        >
          {label}
        </text>
      )}
    </g>
  );
};

export default TransistorSVG;
