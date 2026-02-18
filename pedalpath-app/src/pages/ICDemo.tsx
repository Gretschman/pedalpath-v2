/**
 * IC SVG Demo Page
 *
 * Interactive demonstration of ICSVG component integrated with BreadboardBase.
 * Shows 8-pin, 14-pin, and 16-pin DIP ICs commonly found in guitar pedals.
 *
 * Phase 2 - Work Stream C: Component SVG Rendering
 */

import React, { useState } from 'react';
import BreadboardBase from '@/components/visualizations/BreadboardBase';
import { ICSVG } from '@/components/visualizations/components-svg';
import { decodeIC } from '@/utils/decoders';
import { holeToCoordinates, LAYOUT_830 } from '@/utils/breadboard-utils';
import type { ICSpec } from '@/types/component-specs.types';

// ============================================================================
// Demo IC definitions
// ============================================================================

interface DemoIC {
  partNumber: string;
  label: string;
  /** Hole ID for pin 1 (top-left) — always in row e */
  pin1Hole: string;
  description: string;
}

const DEMO_ICS: DemoIC[] = [
  {
    partNumber: 'TL072',
    label: 'IC1',
    pin1Hole: 'e5',
    description: 'Dual JFET op-amp — the most common IC in DIY guitar pedals',
  },
  {
    partNumber: 'NE5532',
    label: 'IC2',
    pin1Hole: 'e15',
    description: 'Dual low-noise audio op-amp — audiophile-grade, warm sound',
  },
  {
    partNumber: 'TL074',
    label: 'IC3',
    pin1Hole: 'e27',
    description: 'Quad JFET op-amp — 4 op-amps in one 14-pin package',
  },
  {
    partNumber: 'PT2399',
    label: 'IC4',
    pin1Hole: 'e42',
    description: 'Echo audio processor — the workhorse of DIY delay pedals',
  },
];

// ============================================================================
// Helpers
// ============================================================================

/**
 * Return all hole IDs occupied by an IC (all top + bottom pin positions).
 */
function getICHoles(pin1Hole: string, pinCount: 8 | 14 | 16): string[] {
  const col = parseInt(pin1Hole.substring(1));
  const pinsPerSide = pinCount / 2;
  const holes: string[] = [];
  for (let i = 0; i < pinsPerSide; i++) {
    holes.push(`e${col + i}`);
    holes.push(`f${col + i}`);
  }
  return holes;
}

// ============================================================================
// Main Component
// ============================================================================

const ICDemo: React.FC = () => {
  const [selectedIC, setSelectedIC] = useState<number | null>(null);
  const [showLabels, setShowLabels] = useState(true);

  // Decode all ICs up front
  const decodedICs: ICSpec[] = DEMO_ICS.map(ic => decodeIC(ic.partNumber));

  // Occupied holes for breadboard highlighting
  const allOccupiedHoles = DEMO_ICS.flatMap((ic, i) =>
    getICHoles(ic.pin1Hole, decodedICs[i].pinCount)
  );

  const selectedHoles =
    selectedIC !== null
      ? getICHoles(DEMO_ICS[selectedIC].pin1Hole, decodedICs[selectedIC].pinCount)
      : allOccupiedHoles;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            IC SVG Component Demo
          </h1>
          <p className="text-gray-600">
            Photorealistic DIP integrated circuits — 8-pin, 14-pin, and 16-pin packages
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex gap-4 items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showLabels}
              onChange={e => setShowLabels(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-gray-700">Show Labels</span>
          </label>

          {selectedIC !== null && (
            <button
              onClick={() => setSelectedIC(null)}
              className="ml-auto px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
            >
              Clear Selection
            </button>
          )}
        </div>

        {/* Breadboard with ICs */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div style={{ position: 'relative', width: '100%' }}>
            {/* Base breadboard */}
            <BreadboardBase
              size="830"
              highlightHoles={selectedHoles}
            />

            {/* IC overlay SVG (same viewBox as BreadboardBase) */}
            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
              }}
              viewBox={`0 0 ${LAYOUT_830.totalWidth} ${LAYOUT_830.totalHeight}`}
            >
              {DEMO_ICS.map((ic, index) => {
                const spec = decodedICs[index];
                const pin1Coords   = holeToCoordinates(ic.pin1Hole, LAYOUT_830);
                // Bottom row is 'f' + same column number
                const bottomHole   = `f${ic.pin1Hole.substring(1)}`;
                const bottomCoords = holeToCoordinates(bottomHole, LAYOUT_830);

                return (
                  <ICSVG
                    key={index}
                    pin1X={pin1Coords.x}
                    pin1Y={pin1Coords.y}
                    bottomRowY={bottomCoords.y}
                    pinCount={spec.pinCount}
                    spec={spec}
                    label={showLabels ? ic.label : undefined}
                    onClick={() => setSelectedIC(index)}
                  />
                );
              })}
            </svg>
          </div>
        </div>

        {/* IC Details Panel */}
        {selectedIC !== null && (() => {
          const ic   = DEMO_ICS[selectedIC];
          const spec = decodedICs[selectedIC];
          const pinsPerSide = spec.pinCount / 2;

          return (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {ic.label} — {spec.partNumber}
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">{spec.description}</p>
                  {spec.manufacturer && (
                    <p className="text-gray-400 text-xs mt-0.5">
                      Manufacturer: {spec.manufacturer}
                    </p>
                  )}
                </div>
                <span className="px-3 py-1 rounded-full text-sm font-semibold bg-gray-900 text-white">
                  DIP-{spec.pinCount}
                </span>
              </div>

              <p className="text-gray-700 text-sm mb-4">{ic.description}</p>

              {/* Pinout table — two columns mirroring the physical DIP layout */}
              <div className="grid grid-cols-2 gap-4">
                {/* Left side: pins 1 … N/2 */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Left side (pins 1–{pinsPerSide})
                  </h3>
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-gray-100">
                      {spec.pinout.slice(0, pinsPerSide).map(pin => (
                        <tr key={pin.number} className="hover:bg-gray-50">
                          <td className="py-1.5 pr-3 font-mono font-semibold text-gray-500 w-8">
                            {pin.number}
                          </td>
                          <td className="py-1.5 pr-3 font-mono font-semibold text-gray-900 w-20">
                            {pin.name}
                          </td>
                          <td className="py-1.5 text-gray-500 text-xs">
                            {pin.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Right side: pins N/2+1 … N */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Right side (pins {pinsPerSide + 1}–{spec.pinCount})
                  </h3>
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-gray-100">
                      {spec.pinout.slice(pinsPerSide).map(pin => (
                        <tr key={pin.number} className="hover:bg-gray-50">
                          <td className="py-1.5 pr-3 font-mono font-semibold text-gray-500 w-8">
                            {pin.number}
                          </td>
                          <td className="py-1.5 pr-3 font-mono font-semibold text-gray-900 w-20">
                            {pin.name}
                          </td>
                          <td className="py-1.5 text-gray-500 text-xs">
                            {pin.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {/* IC Reference Table */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            ICs in This Demo
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Ref</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Part</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Package</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Position (Pin 1)</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {DEMO_ICS.map((ic, index) => {
                  const spec = decodedICs[index];
                  return (
                    <tr
                      key={index}
                      className={`hover:bg-gray-50 cursor-pointer ${selectedIC === index ? 'bg-blue-50' : ''}`}
                      onClick={() => setSelectedIC(index)}
                    >
                      <td className="px-4 py-3 text-sm font-mono font-semibold">{ic.label}</td>
                      <td className="px-4 py-3 text-sm font-mono font-semibold">{spec.partNumber}</td>
                      <td className="px-4 py-3 text-sm font-mono">
                        <span className="px-2 py-0.5 bg-gray-900 text-white text-xs rounded">
                          DIP-{spec.pinCount}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">{ic.pin1Hole}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{spec.description}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Educational legend */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-3">How DIP ICs Work on a Breadboard</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• <strong>Click any IC</strong> to see its full pinout and description</li>
            <li>• <strong>DIP = Dual In-line Package</strong> — two rows of pins, one on each side</li>
            <li>• <strong>Pin 1 is top-left</strong>, marked by a notch (⌒) and a white dot on the body</li>
            <li>• <strong>Numbering</strong> goes counter-clockwise: down the left side, then up the right side</li>
            <li>• <strong>ICs straddle the center gap</strong> — top pins go in row e, bottom pins go in row f</li>
            <li>• <strong>8-pin ICs</strong> span 4 columns; <strong>14-pin</strong> span 7 columns; <strong>16-pin</strong> span 8 columns</li>
          </ul>
        </div>

      </div>
    </div>
  );
};

export default ICDemo;
