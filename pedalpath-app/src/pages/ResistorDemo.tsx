/**
 * Resistor SVG Demo Page
 *
 * Interactive demonstration of ResistorSVG component integrated with BreadboardBase.
 * Shows various resistor values with accurate color bands.
 *
 * Phase 2 - Work Stream C: Component SVG Rendering
 */

import React, { useState } from 'react';
import BreadboardBase from '@/components/visualizations/BreadboardBase';
import { ResistorSVG } from '@/components/visualizations/components-svg';
import { encodeResistor, decodeResistor, formatOhms } from '@/utils/decoders';
import { holeToCoordinates, LAYOUT_830 } from '@/utils/breadboard-utils';

// ===========================================================================
// Demo Resistors
// ===========================================================================

interface DemoResistor {
  ohms: number;
  tolerance: number;
  startHole: string;
  endHole: string;
  label: string;
}

const DEMO_RESISTORS: DemoResistor[] = [
  { ohms: 100, tolerance: 5.0, startHole: 'a10', endHole: 'a15', label: 'R1' },
  { ohms: 220, tolerance: 5.0, startHole: 'a20', endHole: 'a25', label: 'R2' },
  { ohms: 1000, tolerance: 5.0, startHole: 'a30', endHole: 'a35', label: 'R3' },
  { ohms: 4700, tolerance: 1.0, startHole: 'c10', endHole: 'c15', label: 'R4' },
  { ohms: 10000, tolerance: 1.0, startHole: 'c20', endHole: 'c25', label: 'R5' },
  { ohms: 47000, tolerance: 1.0, startHole: 'c30', endHole: 'c35', label: 'R6' },
  { ohms: 100000, tolerance: 5.0, startHole: 'e10', endHole: 'e15', label: 'R7' },
  { ohms: 220000, tolerance: 5.0, startHole: 'e20', endHole: 'e25', label: 'R8' },
  { ohms: 1000000, tolerance: 5.0, startHole: 'e30', endHole: 'e35', label: 'R9' },

  // Cross-gap resistors (from left section to right section)
  { ohms: 560, tolerance: 5.0, startHole: 'd40', endHole: 'g40', label: 'R10' },
  { ohms: 2200, tolerance: 1.0, startHole: 'd45', endHole: 'h45', label: 'R11' },
];

// ===========================================================================
// Main Component
// ===========================================================================

const ResistorDemo: React.FC = () => {
  const [selectedResistor, setSelectedResistor] = useState<number | null>(null);
  const [showValues, setShowValues] = useState(true);

  // Get all occupied holes for highlighting
  const occupiedHoles = DEMO_RESISTORS.flatMap(r => [r.startHole, r.endHole]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Resistor SVG Component Demo
          </h1>
          <p className="text-gray-600">
            Photorealistic resistors with accurate IEC 60062 color codes
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex gap-4 items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showValues}
              onChange={(e) => setShowValues(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-gray-700">Show Values</span>
          </label>

          {selectedResistor !== null && (
            <button
              onClick={() => setSelectedResistor(null)}
              className="ml-auto px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
            >
              Clear Selection
            </button>
          )}
        </div>

        {/* Breadboard with Resistors */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div style={{ position: 'relative', width: '100%' }}>
            {/* Base breadboard */}
            <BreadboardBase
              size="830"
              highlightHoles={selectedResistor !== null ? [
                DEMO_RESISTORS[selectedResistor].startHole,
                DEMO_RESISTORS[selectedResistor].endHole,
              ] : occupiedHoles}
            />

            {/* Resistors overlay */}
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
              {DEMO_RESISTORS.map((resistor, index) => {
                const startCoords = holeToCoordinates(resistor.startHole, LAYOUT_830);
                const endCoords = holeToCoordinates(resistor.endHole, LAYOUT_830);
                const encoded = encodeResistor(resistor.ohms, resistor.tolerance);

                return (
                  <ResistorSVG
                    key={index}
                    startX={startCoords.x}
                    startY={startCoords.y}
                    endX={endCoords.x}
                    endY={endCoords.y}
                    spec={{ bands: encoded.bands5 }}
                    label={showValues ? `${resistor.label} ${formatOhms(resistor.ohms)}` : resistor.label}
                    onClick={() => setSelectedResistor(index)}
                  />
                );
              })}
            </svg>
          </div>
        </div>

        {/* Resistor Details */}
        {selectedResistor !== null && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Resistor Details: {DEMO_RESISTORS[selectedResistor].label}
            </h2>
            {(() => {
              const resistor = DEMO_RESISTORS[selectedResistor];
              const encoded = encodeResistor(resistor.ohms, resistor.tolerance);
              const decoded = decodeResistor(encoded.bands5);

              return (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Specifications</h3>
                    <dl className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Resistance:</dt>
                        <dd className="font-mono font-semibold">{formatOhms(resistor.ohms)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Tolerance:</dt>
                        <dd className="font-mono">±{resistor.tolerance}%</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Position:</dt>
                        <dd className="font-mono">{resistor.startHole} → {resistor.endHole}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">E-Series:</dt>
                        <dd className="font-mono">{decoded.eSeriesMatch || 'N/A'}</dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Color Bands (5-band)</h3>
                    <div className="space-y-2">
                      {encoded.bands5.map((color: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-4 h-4 text-xs flex items-center justify-center text-gray-500">
                            {idx + 1}
                          </div>
                          <div
                            className="w-12 h-6 rounded border border-gray-300"
                            style={{
                              backgroundColor:
                                color === 'black' ? '#000' :
                                color === 'brown' ? '#8B4513' :
                                color === 'red' ? '#F00' :
                                color === 'orange' ? '#FF8C00' :
                                color === 'yellow' ? '#FFD700' :
                                color === 'green' ? '#080' :
                                color === 'blue' ? '#00F' :
                                color === 'violet' ? '#8B00FF' :
                                color === 'gray' ? '#808080' :
                                color === 'white' ? '#FFF' :
                                color === 'gold' ? '#FFD700' :
                                color === 'silver' ? '#C0C0C0' :
                                '#808080',
                            }}
                          />
                          <span className="text-sm font-mono capitalize">{color}</span>
                          <span className="text-xs text-gray-500 ml-auto">
                            {idx < 3 ? 'Digit' : idx === 3 ? 'Multiplier' : 'Tolerance'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Legend */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-3">How to Use</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• <strong>Click any resistor</strong> to see detailed specifications and color band breakdown</li>
            <li>• <strong>Color bands</strong> follow IEC 60062 standard (used worldwide)</li>
            <li>• <strong>5-band resistors</strong> provide higher precision (1% tolerance)</li>
            <li>• <strong>4-band resistors</strong> are standard (5% tolerance)</li>
            <li>• <strong>Hover holes</strong> to see which ones are occupied by resistor leads</li>
          </ul>
        </div>

        {/* Reference Table */}
        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">All Resistors in Circuit</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Ref</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Value</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Tolerance</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Position</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Color Bands</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {DEMO_RESISTORS.map((resistor, index) => {
                  const encoded = encodeResistor(resistor.ohms, resistor.tolerance);
                  return (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedResistor(index)}
                    >
                      <td className="px-4 py-3 text-sm font-mono font-semibold">{resistor.label}</td>
                      <td className="px-4 py-3 text-sm font-mono">{formatOhms(resistor.ohms)}</td>
                      <td className="px-4 py-3 text-sm font-mono">±{resistor.tolerance}%</td>
                      <td className="px-4 py-3 text-sm font-mono">{resistor.startHole} → {resistor.endHole}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-1">
                          {encoded.bands5.map((color: string, idx: number) => (
                            <div
                              key={idx}
                              className="w-6 h-6 rounded border border-gray-300"
                              title={color}
                              style={{
                                backgroundColor:
                                  color === 'black' ? '#000' :
                                  color === 'brown' ? '#8B4513' :
                                  color === 'red' ? '#F00' :
                                  color === 'orange' ? '#FF8C00' :
                                  color === 'yellow' ? '#FFD700' :
                                  color === 'green' ? '#080' :
                                  color === 'blue' ? '#00F' :
                                  color === 'violet' ? '#8B00FF' :
                                  color === 'gray' ? '#808080' :
                                  color === 'white' ? '#FFF' :
                                  color === 'gold' ? '#FFD700' :
                                  color === 'silver' ? '#C0C0C0' :
                                  '#808080',
                              }}
                            />
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResistorDemo;
