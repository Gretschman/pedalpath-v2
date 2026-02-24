/**
 * TransistorSVG Component
 *
 * Renders a TO-92 transistor package for breadboard visualization.
 * D-shaped body (flat face forward, dome back), three leads E/B/C.
 *
 * Coordinate system matches BreadboardBase: x = B-pin hole x, y = hole y.
 * Leads extend upward from the hole row to the component body.
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

const TransistorSVG: React.FC<TransistorSVGProps> = ({
  x,
  y,
  spec,
  label,
  pinSpacing = 24,
}) => {
  const leadLength = 14;   // px from hole to body bottom
  const bw = 38;           // body width
  const bh = 20;           // body height (dome height)

  const bodyBottom = y - leadLength;

  // Pin x positions
  const eX = x - pinSpacing;
  const bX = x;
  const cX = x + pinSpacing;

  // D-shape path: flat bottom at bodyBottom, dome curves upward by bh
  // M start bottom-left → line to bottom-right → arc up-and-over back to left → close
  const bodyPath = [
    `M ${x - bw / 2} ${bodyBottom}`,
    `L ${x + bw / 2} ${bodyBottom}`,
    `A ${bw / 2} ${bh} 0 0 0 ${x - bw / 2} ${bodyBottom}`,
    'Z',
  ].join(' ');

  const bodyCenterY = bodyBottom - bh / 2;

  return (
    <g className="transistor-component">
      {/* E lead */}
      <line
        x1={eX} y1={y}
        x2={eX} y2={bodyBottom}
        stroke="#A0A0A0" strokeWidth="1.5" strokeLinecap="round"
      />
      {/* B lead */}
      <line
        x1={bX} y1={y}
        x2={bX} y2={bodyBottom}
        stroke="#A0A0A0" strokeWidth="1.5" strokeLinecap="round"
      />
      {/* C lead */}
      <line
        x1={cX} y1={y}
        x2={cX} y2={bodyBottom}
        stroke="#A0A0A0" strokeWidth="1.5" strokeLinecap="round"
      />

      {/* Body shadow for depth */}
      <path
        d={bodyPath}
        fill="#000000"
        opacity={0.15}
        transform="translate(1, 1)"
      />

      {/* Main body — black TO-92 */}
      <path
        d={bodyPath}
        fill="#1A1A1A"
        stroke="#444444"
        strokeWidth="0.5"
      />

      {/* Subtle highlight on curved top */}
      <ellipse
        cx={x}
        cy={bodyBottom - bh * 0.7}
        rx={bw * 0.3}
        ry={bh * 0.2}
        fill="#FFFFFF"
        opacity={0.08}
      />

      {/* Part number on flat face — positioned just above the flat bottom */}
      <text
        x={x}
        y={bodyCenterY + 2}
        textAnchor="middle"
        fontSize="7"
        fontFamily="monospace"
        fill="#CCCCCC"
        letterSpacing="-0.5"
      >
        {spec.partNumber.substring(0, 7)}
      </text>

      {/* Pin labels E / B / C below leads */}
      <text x={eX} y={y + 11} textAnchor="middle" fontSize="6" fontFamily="sans-serif" fill="#666666">E</text>
      <text x={bX} y={y + 11} textAnchor="middle" fontSize="6" fontFamily="sans-serif" fill="#666666">B</text>
      <text x={cX} y={y + 11} textAnchor="middle" fontSize="6" fontFamily="sans-serif" fill="#666666">C</text>

      {/* Reference designator label (Q1 etc.) above the body */}
      {label && (
        <text
          x={x}
          y={bodyBottom - bh - 7}
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

export default TransistorSVG;
