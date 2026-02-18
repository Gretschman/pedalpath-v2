/**
 * Diode SVG Demo Page
 *
 * Interactive demonstration of DiodeSVG component on a breadboard.
 * Shows signal, rectifier, zener, and LED diode types commonly found
 * in guitar pedal circuits.
 *
 * Phase 2 - Work Stream C: Component SVG Rendering
 */

import React, { useState } from 'react';
import BreadboardBase from '@/components/visualizations/BreadboardBase';
import { DiodeSVG } from '@/components/visualizations/components-svg';
import { decodeDiode, decodeLED } from '@/utils/decoders';
import { holeToCoordinates, LAYOUT_830 } from '@/utils/breadboard-utils';
import type { DiodeSpec, LEDSpec } from '@/types/component-specs.types';

// ============================================================================
// Demo diodes
// ============================================================================

interface DemoEntry {
  label: string;
  startHole: string;  // anode
  endHole: string;    // cathode
  spec: DiodeSpec | LEDSpec;
  note: string;
}

function makeDemos(): DemoEntry[] {
  return [
    // Row 1 — signal diodes
    {
      label: 'D1 1N4148',
      startHole: 'a5', endHole: 'a10',
      spec: decodeDiode('1N4148'),
      note: 'Fast signal diode — amber glass, most common in pedal clipping',
    },
    {
      label: 'D2 1N914',
      startHole: 'a14', endHole: 'a19',
      spec: decodeDiode('1N914'),
      note: 'Equivalent to 1N4148, interchangeable in virtually all pedal circuits',
    },
    {
      label: 'D3 OA91',
      startHole: 'a23', endHole: 'a28',
      spec: decodeDiode('OA91'),
      note: 'Germanium diode — orange glass, warm asymmetric clipping (~0.2V Vf)',
    },
    {
      label: 'D4 1N34A',
      startHole: 'a32', endHole: 'a37',
      spec: decodeDiode('1N34A'),
      note: 'Germanium signal diode — vintage fuzz pedals, warm clipping',
    },
    {
      label: 'D5 BAT41',
      startHole: 'a41', endHole: 'a46',
      spec: decodeDiode('BAT41'),
      note: 'Schottky small-signal diode — very low Vf (0.34V), dark body',
    },

    // Row 2 — rectifiers
    {
      label: 'D6 1N4148',
      startHole: 'c5', endHole: 'c10',
      spec: decodeDiode('1N4001'),
      note: '1N4001 general-purpose rectifier — 50V 1A, power supply protection',
    },
    {
      label: 'D7 1N4007',
      startHole: 'c14', endHole: 'c19',
      spec: decodeDiode('1N4007'),
      note: '1N4007 rectifier — 1000V 1A, reverse polarity protection diode',
    },
    {
      label: 'D8 1N5819',
      startHole: 'c23', endHole: 'c28',
      spec: decodeDiode('1N5819'),
      note: '1N5819 Schottky rectifier — 40V 1A, preferred for pedal power protection',
    },

    // Row 3 — zeners
    {
      label: 'D9 1N4733',
      startHole: 'e5', endHole: 'e10',
      spec: decodeDiode('1N4733'),
      note: '5.1V zener — clipping diode, creates soft clipping at fixed voltage',
    },
    {
      label: 'D10 1N4735',
      startHole: 'e14', endHole: 'e19',
      spec: decodeDiode('1N4735'),
      note: '6.2V zener — tone shaping and voltage limiting',
    },

    // Row 4 — LEDs
    {
      label: 'LED1',
      startHole: 'h5', endHole: 'h9',
      spec: decodeLED('red', '5mm'),
      note: '5mm Red LED — status indicator, clip indicator',
    },
    {
      label: 'LED2',
      startHole: 'h12', endHole: 'h16',
      spec: decodeLED('green', '5mm'),
      note: '5mm Green LED — power indicator, bypass indicator',
    },
    {
      label: 'LED3',
      startHole: 'h19', endHole: 'h23',
      spec: decodeLED('yellow', '5mm'),
      note: '5mm Yellow LED — warm indicator light',
    },
    {
      label: 'LED4',
      startHole: 'h26', endHole: 'h30',
      spec: decodeLED('blue', '5mm'),
      note: '5mm Blue LED — modern pedal indicator',
    },
    {
      label: 'LED5',
      startHole: 'h33', endHole: 'h36',
      spec: decodeLED('red', '3mm'),
      note: '3mm Red LED — smaller footprint for tight layouts',
    },
  ];
}

// ============================================================================
// Helpers
// ============================================================================

const DIODE_TYPE_LABELS: Record<string, string> = {
  signal:    'Signal',
  rectifier: 'Rectifier',
  zener:     'Zener',
  led:       'LED',
};

// ============================================================================
// Main Component
// ============================================================================

const DiodeDemo: React.FC = () => {
  const [selectedDiode, setSelectedDiode] = useState<number | null>(null);
  const [showLabels, setShowLabels]       = useState(true);

  const DEMOS = React.useMemo(() => makeDemos(), []);

  const allOccupiedHoles = DEMOS.flatMap(d => [d.startHole, d.endHole]);
  const selectedHoles =
    selectedDiode !== null
      ? [DEMOS[selectedDiode].startHole, DEMOS[selectedDiode].endHole]
      : allOccupiedHoles;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Diode SVG Component Demo
          </h1>
          <p className="text-gray-600">
            Signal, rectifier, zener, and LED diodes — photorealistic with cathode band marking
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

          {selectedDiode !== null && (
            <button
              onClick={() => setSelectedDiode(null)}
              className="ml-auto px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
            >
              Clear Selection
            </button>
          )}
        </div>

        {/* Breadboard with diodes */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div style={{ position: 'relative', width: '100%' }}>
            <BreadboardBase
              size="830"
              highlightHoles={selectedHoles}
            />

            <svg
              style={{
                position: 'absolute',
                top: 0, left: 0,
                width: '100%', height: '100%',
                pointerEvents: 'none',
              }}
              viewBox={`0 0 ${LAYOUT_830.totalWidth} ${LAYOUT_830.totalHeight}`}
            >
              {DEMOS.map((d, i) => {
                const start = holeToCoordinates(d.startHole, LAYOUT_830);
                const end   = holeToCoordinates(d.endHole,   LAYOUT_830);
                return (
                  <DiodeSVG
                    key={i}
                    startX={start.x} startY={start.y}
                    endX={end.x}     endY={end.y}
                    spec={d.spec}
                    label={showLabels ? d.label : undefined}
                    onClick={() => setSelectedDiode(i)}
                  />
                );
              })}
            </svg>
          </div>
        </div>

        {/* Detail panel */}
        {selectedDiode !== null && (() => {
          const d    = DEMOS[selectedDiode];
          const spec = d.spec;
          const isLed = spec.diodeType === 'led';
          const ledSpec = isLed ? (spec as LEDSpec) : null;

          return (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{d.label}</h2>
                  <p className="text-gray-500 text-sm mt-0.5">{d.note}</p>
                </div>
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: spec.color === '#E8B87A' || spec.color.startsWith('#D0') ? '#8B6914' : spec.color === '#1A1A1A' || spec.color === '#2A2A2A' ? '#333' : spec.color }}
                >
                  {DIODE_TYPE_LABELS[spec.diodeType]}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Specifications</h3>
                  <dl className="space-y-1">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Part Number:</dt>
                      <dd className="font-mono font-semibold">{spec.partNumber}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Type:</dt>
                      <dd className="font-mono">{DIODE_TYPE_LABELS[spec.diodeType]}</dd>
                    </div>
                    {spec.voltage != null && spec.voltage > 0 && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600">
                          {spec.diodeType === 'zener' ? 'Breakdown Voltage:' : 'Max Voltage:'}
                        </dt>
                        <dd className="font-mono">{spec.voltage}V</dd>
                      </div>
                    )}
                    {ledSpec && (
                      <>
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Color:</dt>
                          <dd className="font-mono capitalize">{ledSpec.ledColor}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Size:</dt>
                          <dd className="font-mono">{ledSpec.size}</dd>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Position:</dt>
                      <dd className="font-mono">{d.startHole} (A) → {d.endHole} (K)</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Visual Markings</h3>
                  <dl className="space-y-1">
                    <div className="flex justify-between items-center">
                      <dt className="text-gray-600">Body color:</dt>
                      <dd className="flex items-center gap-2">
                        <div
                          className="w-8 h-4 rounded border border-gray-300"
                          style={{ backgroundColor: spec.color }}
                        />
                        <span className="font-mono text-xs">{spec.color}</span>
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Cathode mark:</dt>
                      <dd className="font-mono capitalize">{isLed ? 'flat edge' : spec.cathodeMarking}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Anode end:</dt>
                      <dd className="font-mono">{d.startHole} (longer lead)</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Cathode end:</dt>
                      <dd className="font-mono">{d.endHole} (band / short lead)</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Reference table */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">All Diodes in Demo</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Ref</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Part</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Body</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Position (A → K)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {DEMOS.map((d, i) => (
                  <tr
                    key={i}
                    className={`hover:bg-gray-50 cursor-pointer ${selectedDiode === i ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedDiode(i)}
                  >
                    <td className="px-4 py-3 text-sm font-mono font-semibold">{d.label}</td>
                    <td className="px-4 py-3 text-sm font-mono">{d.spec.partNumber}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700">
                        {DIODE_TYPE_LABELS[d.spec.diodeType]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className="w-10 h-4 rounded border border-gray-300"
                        style={{ backgroundColor: d.spec.color }}
                        title={d.spec.color}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">
                      {d.startHole} → {d.endHole}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-3">How to Read Diodes</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• <strong>Click any diode</strong> to see its type, voltage rating, and placement info</li>
            <li>• <strong>Cathode band</strong> (black or silver stripe) marks the negative (−) end</li>
            <li>• <strong>Signal diodes</strong> (1N4148): amber glass body — used for clipping in overdrive/fuzz</li>
            <li>• <strong>Rectifier diodes</strong> (1N4001/1N5819): black body — used for power supply protection</li>
            <li>• <strong>Zener diodes</strong>: yellow-amber glass — clamp voltage at a fixed breakdown level</li>
            <li>• <strong>LEDs</strong>: flat edge on cathode side, shorter cathode lead; always observe polarity</li>
            <li>• <strong>Germanium diodes</strong> (OA91, 1N34A): warm glass body — low Vf, vintage fuzz tone</li>
          </ul>
        </div>

      </div>
    </div>
  );
};

export default DiodeDemo;
