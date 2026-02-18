/**
 * Capacitor SVG Demo Page
 *
 * Interactive demonstration of CapacitorSVG component integrated with BreadboardBase.
 * Shows various capacitor types with accurate visual representations.
 *
 * Phase 2 - Work Stream C: Component SVG Rendering
 */

import { useState } from 'react';
import BreadboardBase from '@/components/visualizations/BreadboardBase';
import { CapacitorSVG } from '@/components/visualizations/components-svg';
import { decodeCapacitor, formatCapacitance } from '@/utils/decoders';
import { holeToCoordinates, LAYOUT_830 } from '@/utils/breadboard-utils';

// ===========================================================================
// Demo Capacitors
// ===========================================================================

interface DemoCapacitor {
  marking: string;
  startHole: string;
  endHole: string;
  label: string;
}

const DEMO_CAPACITORS: DemoCapacitor[] = [
  // Ceramic capacitors (small values)
  { marking: '100', startHole: 'a10', endHole: 'a12', label: 'C1' }, // 10pF
  { marking: '220', startHole: 'a15', endHole: 'a17', label: 'C2' }, // 22pF
  { marking: '471', startHole: 'a20', endHole: 'a22', label: 'C3' }, // 470pF

  // Film capacitors (medium values)
  { marking: '102K100', startHole: 'c10', endHole: 'c13', label: 'C4' }, // 1nF 100V
  { marking: '223K100', startHole: 'c17', endHole: 'c20', label: 'C5' }, // 22nF 100V
  { marking: '473K100', startHole: 'c24', endHole: 'c27', label: 'C6' }, // 47nF 100V
  { marking: '104K100', startHole: 'c31', endHole: 'c34', label: 'C7' }, // 100nF 100V

  // Electrolytic capacitors (large values)
  { marking: '1uF 25V', startHole: 'e10', endHole: 'e13', label: 'C8' }, // 1uF 25V
  { marking: '10uF 25V', startHole: 'e17', endHole: 'e20', label: 'C9' }, // 10uF 25V
  { marking: '47uF 25V', startHole: 'e24', endHole: 'e28', label: 'C10' }, // 47uF 25V
  { marking: '100uF 25V', startHole: 'e32', endHole: 'e37', label: 'C11' }, // 100uF 25V

  // Cross-gap capacitors
  { marking: '22n', startHole: 'd40', endHole: 'g40', label: 'C12' }, // Film
  { marking: '4.7uF 16V', startHole: 'd45', endHole: 'h45', label: 'C13' }, // Electrolytic
];

// ===========================================================================
// Main Component
// ===========================================================================

const CapacitorDemo: React.FC = () => {
  const [selectedCapacitor, setSelectedCapacitor] = useState<number | null>(null);
  const [showValues, setShowValues] = useState(true);

  // Decode all capacitors
  const decodedCapacitors = DEMO_CAPACITORS.map(cap => ({
    ...cap,
    spec: decodeCapacitor(cap.marking),
  }));

  // Get all occupied holes for highlighting
  const occupiedHoles = DEMO_CAPACITORS.flatMap(c => [c.startHole, c.endHole]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Capacitor SVG Component Demo
          </h1>
          <p className="text-gray-600">
            Photorealistic capacitors: Ceramic, Film, Electrolytic, and Tantalum
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

          {selectedCapacitor !== null && (
            <button
              onClick={() => setSelectedCapacitor(null)}
              className="ml-auto px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
            >
              Clear Selection
            </button>
          )}
        </div>

        {/* Breadboard with Capacitors */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div style={{ position: 'relative', width: '100%' }}>
            {/* Base breadboard */}
            <BreadboardBase
              size="830"
              highlightHoles={selectedCapacitor !== null ? [
                DEMO_CAPACITORS[selectedCapacitor].startHole,
                DEMO_CAPACITORS[selectedCapacitor].endHole,
              ] : occupiedHoles}
            />

            {/* Capacitors overlay */}
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
              {decodedCapacitors.map((capacitor, index) => {
                const startCoords = holeToCoordinates(capacitor.startHole, LAYOUT_830);
                const endCoords = holeToCoordinates(capacitor.endHole, LAYOUT_830);

                return (
                  <CapacitorSVG
                    key={index}
                    startX={startCoords.x}
                    startY={startCoords.y}
                    endX={endCoords.x}
                    endY={endCoords.y}
                    spec={capacitor.spec}
                    label={showValues ? `${capacitor.label} ${formatCapacitance(capacitor.spec.capacitance)}` : capacitor.label}
                    onClick={() => setSelectedCapacitor(index)}
                  />
                );
              })}
            </svg>
          </div>
        </div>

        {/* Capacitor Details */}
        {selectedCapacitor !== null && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Capacitor Details: {DEMO_CAPACITORS[selectedCapacitor].label}
            </h2>
            {(() => {
              const cap = decodedCapacitors[selectedCapacitor];
              const spec = cap.spec;

              return (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Specifications</h3>
                    <dl className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Capacitance:</dt>
                        <dd className="font-mono font-semibold">{formatCapacitance(spec.capacitance)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Type:</dt>
                        <dd className="font-mono capitalize">{spec.capType.replace('_', ' ')}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Polarized:</dt>
                        <dd className="font-mono">{spec.polarized ? 'Yes' : 'No'}</dd>
                      </div>
                      {spec.voltageMax && (
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Max Voltage:</dt>
                          <dd className="font-mono">{spec.voltageMax}V</dd>
                        </div>
                      )}
                      {spec.tolerancePercent && (
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Tolerance:</dt>
                          <dd className="font-mono">±{spec.tolerancePercent}%</dd>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Position:</dt>
                        <dd className="font-mono">{cap.startHole} → {cap.endHole}</dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Marking</h3>
                    <div className="space-y-2">
                      <div className="bg-gray-100 rounded p-3">
                        <div className="text-xs text-gray-600 mb-1">Original Marking:</div>
                        <div className="font-mono text-lg font-bold">{cap.marking}</div>
                      </div>

                      <div className="text-xs text-gray-600 mt-3">
                        <strong>Unit Conversions:</strong>
                        <div className="font-mono mt-1 space-y-0.5">
                          <div>{spec.capacitance.pf.toFixed(0)} pF</div>
                          <div>{spec.capacitance.nf.toFixed(3)} nF</div>
                          <div>{spec.capacitance.uf.toFixed(6)} µF</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Legend */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-3">Capacitor Types</h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <strong>Ceramic (Tan Disc):</strong>
              <p className="text-xs">Small values (&lt;1nF), non-polarized, compact</p>
            </div>
            <div>
              <strong>Film (Yellow Box):</strong>
              <p className="text-xs">1nF-1µF, non-polarized, higher voltage ratings</p>
            </div>
            <div>
              <strong>Electrolytic (Dark Cylinder):</strong>
              <p className="text-xs">&gt;1µF, polarized (watch the stripe!), large values</p>
            </div>
            <div>
              <strong>Tantalum (Orange Blob):</strong>
              <p className="text-xs">Polarized, compact, stable, expensive</p>
            </div>
          </div>
        </div>

        {/* Reference Table */}
        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">All Capacitors in Circuit</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Ref</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Value</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Voltage</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Polarized</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Position</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Marking</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {decodedCapacitors.map((cap, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedCapacitor(index)}
                  >
                    <td className="px-4 py-3 text-sm font-mono font-semibold">{cap.label}</td>
                    <td className="px-4 py-3 text-sm font-mono">{formatCapacitance(cap.spec.capacitance)}</td>
                    <td className="px-4 py-3 text-sm capitalize">{cap.spec.capType.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-sm font-mono">{cap.spec.voltageMax ? `${cap.spec.voltageMax}V` : '-'}</td>
                    <td className="px-4 py-3 text-sm">{cap.spec.polarized ? '✓' : '✗'}</td>
                    <td className="px-4 py-3 text-sm font-mono">{cap.startHole} → {cap.endHole}</td>
                    <td className="px-4 py-3 text-sm font-mono">{cap.marking}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CapacitorDemo;
