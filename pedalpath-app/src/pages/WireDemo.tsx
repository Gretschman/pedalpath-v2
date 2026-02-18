/**
 * Wire SVG Demo Page
 *
 * Interactive demonstration of WireSVG component on a breadboard.
 * Shows all 8 wire colors across short, medium, and long spans,
 * plus cross-gap wires and a mini circuit example.
 *
 * Phase 2 - Work Stream C: Component SVG Rendering
 */

import React, { useState } from 'react';
import BreadboardBase from '@/components/visualizations/BreadboardBase';
import { WireSVG, ResistorSVG } from '@/components/visualizations/components-svg';
import { encodeResistor, formatOhms } from '@/utils/decoders';
import { holeToCoordinates, LAYOUT_830 } from '@/utils/breadboard-utils';
import type { WireColor } from '@/components/visualizations/components-svg/WireSVG';

// ============================================================================
// Demo wire definitions
// ============================================================================

interface DemoWire {
  label: string;
  startHole: string;
  endHole: string;
  color: WireColor;
  arcFlip?: boolean;
  note: string;
}

const DEMO_WIRES: DemoWire[] = [
  // ── Row a: color swatch — all 8 colors, same short span ──────────────────
  { label: 'W1',  startHole: 'a3',  endHole: 'a7',  color: 'red',    note: 'Red — power, V+, positive rails' },
  { label: 'W2',  startHole: 'a10', endHole: 'a14', color: 'black',  note: 'Black — ground, V−, negative rails' },
  { label: 'W3',  startHole: 'a17', endHole: 'a21', color: 'green',  note: 'Green — signal paths, audio' },
  { label: 'W4',  startHole: 'a24', endHole: 'a28', color: 'blue',   note: 'Blue — signal, data, control' },
  { label: 'W5',  startHole: 'a31', endHole: 'a35', color: 'yellow', note: 'Yellow — bypass, test points' },
  { label: 'W6',  startHole: 'a38', endHole: 'a42', color: 'orange', note: 'Orange — intermediate voltages, bias' },
  { label: 'W7',  startHole: 'a45', endHole: 'a49', color: 'white',  note: 'White — general purpose, misc connections' },
  { label: 'W8',  startHole: 'a52', endHole: 'a56', color: 'purple', note: 'Purple — clock, modulation, LFO' },

  // ── Row c: medium spans — arc height scaling ──────────────────────────────
  { label: 'W9',  startHole: 'c3',  endHole: 'c12', color: 'red',    note: 'Medium red wire (9-hole span)' },
  { label: 'W10', startHole: 'c15', endHole: 'c27', color: 'green',  note: 'Medium green wire (12-hole span)' },
  { label: 'W11', startHole: 'c30', endHole: 'c45', color: 'blue',   note: 'Medium blue wire (15-hole span)' },

  // ── Row e: long spans — high arc ─────────────────────────────────────────
  { label: 'W12', startHole: 'e3',  endHole: 'e22', color: 'red',    note: 'Long red wire (19-hole span) — power bus' },
  { label: 'W13', startHole: 'e25', endHole: 'e45', color: 'black',  note: 'Long black wire (20-hole span) — ground bus' },
  { label: 'W14', startHole: 'e48', endHole: 'e62', color: 'orange', note: 'Long orange wire (14-hole span) — bias rail' },

  // ── Cross-gap vertical wires (rows e→f) ───────────────────────────────────
  { label: 'W15', startHole: 'e55', endHole: 'f55', color: 'yellow', note: 'Cross-gap vertical — connects upper/lower sections' },
  { label: 'W16', startHole: 'e58', endHole: 'f58', color: 'white',  arcFlip: true, note: 'Cross-gap vertical (arc flipped right)' },

  // ── Row h: two wires that would overlap — one flipped ─────────────────────
  { label: 'W17', startHole: 'h5',  endHole: 'h20', color: 'purple', note: 'Purple wire — default arc direction' },
  { label: 'W18', startHole: 'h5',  endHole: 'h20', color: 'green',  arcFlip: true, note: 'Same holes, green wire — arcFlip=true keeps them apart' },
];

// A tiny circuit in row j: resistors + wires
const CIRCUIT_WIRES: DemoWire[] = [
  { label: '',  startHole: 'j3',  endHole: '+3',  color: 'red',   note: 'Power to R1 anode' },
  { label: '',  startHole: 'j10', endHole: 'j15', color: 'green', note: 'R1 → R2 junction' },
  { label: '',  startHole: 'j20', endHole: '-20', color: 'black', note: 'R2 to ground' },
];

// ============================================================================
// Main Component
// ============================================================================

const WireDemo: React.FC = () => {
  const [selectedWire, setSelectedWire] = useState<number | null>(null);
  const [showLabels,   setShowLabels]   = useState(true);
  const [showCircuit,  setShowCircuit]  = useState(true);

  const allOccupiedHoles = DEMO_WIRES.flatMap(w => [w.startHole, w.endHole]);
  const selectedHoles =
    selectedWire !== null
      ? [DEMO_WIRES[selectedWire]?.startHole, DEMO_WIRES[selectedWire]?.endHole].filter(Boolean)
      : allOccupiedHoles;

  // Resistors for the mini circuit
  const r1 = encodeResistor(10000, 1);
  const r2 = encodeResistor(4700, 1);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Wire SVG Component Demo
          </h1>
          <p className="text-gray-600">
            Jumper wires with Bézier arcs — arc height scales with wire length
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex gap-6 items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showLabels}
              onChange={e => setShowLabels(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-gray-700">Show Labels</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showCircuit}
              onChange={e => setShowCircuit(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-gray-700">Show Mini Circuit</span>
          </label>
          {selectedWire !== null && (
            <button
              onClick={() => setSelectedWire(null)}
              className="ml-auto px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
            >
              Clear Selection
            </button>
          )}
        </div>

        {/* Breadboard */}
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
              {/* Demo wires */}
              {DEMO_WIRES.map((w, i) => {
                const s = holeToCoordinates(w.startHole, LAYOUT_830);
                const e = holeToCoordinates(w.endHole,   LAYOUT_830);
                return (
                  <WireSVG
                    key={i}
                    startX={s.x} startY={s.y}
                    endX={e.x}   endY={e.y}
                    color={w.color}
                    arcFlip={w.arcFlip}
                    label={showLabels ? w.label : undefined}
                    onClick={() => setSelectedWire(i)}
                  />
                );
              })}

              {/* Mini circuit: resistors + wires */}
              {showCircuit && (
                <>
                  {/* R1: 10kΩ */}
                  {(() => {
                    const s = holeToCoordinates('j3',  LAYOUT_830);
                    const e = holeToCoordinates('j8',  LAYOUT_830);
                    return (
                      <ResistorSVG
                        startX={s.x} startY={s.y}
                        endX={e.x}   endY={e.y}
                        spec={{ bands: r1.bands5 }}
                        label="R1 10k"
                      />
                    );
                  })()}
                  {/* R2: 4.7kΩ */}
                  {(() => {
                    const s = holeToCoordinates('j13', LAYOUT_830);
                    const e = holeToCoordinates('j18', LAYOUT_830);
                    return (
                      <ResistorSVG
                        startX={s.x} startY={s.y}
                        endX={e.x}   endY={e.y}
                        spec={{ bands: r2.bands5 }}
                        label={`R2 ${formatOhms(4700)}`}
                      />
                    );
                  })()}
                  {/* Circuit wires */}
                  {CIRCUIT_WIRES.map((w, i) => {
                    const s = holeToCoordinates(w.startHole, LAYOUT_830);
                    const e = holeToCoordinates(w.endHole,   LAYOUT_830);
                    return (
                      <WireSVG
                        key={`circuit-${i}`}
                        startX={s.x} startY={s.y}
                        endX={e.x}   endY={e.y}
                        color={w.color}
                      />
                    );
                  })}
                </>
              )}
            </svg>
          </div>
        </div>

        {/* Selected wire detail */}
        {selectedWire !== null && selectedWire < DEMO_WIRES.length && (() => {
          const w = DEMO_WIRES[selectedWire];
          const s = holeToCoordinates(w.startHole, LAYOUT_830);
          const e = holeToCoordinates(w.endHole,   LAYOUT_830);
          const dx = e.x - s.x;
          const dy = e.y - s.y;
          const distPx = Math.round(Math.sqrt(dx*dx + dy*dy));
          const startCol = parseInt(w.startHole.substring(1));
          const endCol   = parseInt(w.endHole.substring(1));
          const holeSpan = Math.abs(endCol - startCol);

          return (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-12 h-4 rounded-full"
                  style={{ backgroundColor: WIRE_HEX[w.color] }}
                />
                <h2 className="text-xl font-bold text-gray-900">{w.label} — {w.color} wire</h2>
              </div>
              <p className="text-gray-600 text-sm mb-4">{w.note}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <dl className="space-y-1">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Color:</dt>
                    <dd className="font-mono capitalize">{w.color}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">From → To:</dt>
                    <dd className="font-mono">{w.startHole} → {w.endHole}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Hole span:</dt>
                    <dd className="font-mono">{holeSpan} holes</dd>
                  </div>
                </dl>
                <dl className="space-y-1">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">SVG length:</dt>
                    <dd className="font-mono">{distPx} px</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Arc height:</dt>
                    <dd className="font-mono">~{Math.round(Math.min(distPx * 0.28, 42))} px</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Arc flipped:</dt>
                    <dd className="font-mono">{w.arcFlip ? 'yes' : 'no'}</dd>
                  </div>
                </dl>
              </div>
            </div>
          );
        })()}

        {/* Color reference table */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Wire Color Convention</h3>
          <div className="grid grid-cols-2 gap-3">
            {(Object.entries(WIRE_HEX) as [WireColor, string][]).map(([color, hex]) => (
              <div key={color} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                <div className="w-16 h-4 rounded-full shadow-sm" style={{ backgroundColor: hex }} />
                <div>
                  <span className="font-mono font-semibold text-gray-900 capitalize">{color}</span>
                  <span className="text-xs text-gray-500 ml-2">{hex}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* All wires table */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">All Wires in Demo</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Ref</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Color</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">From → To</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Span</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Arc Flip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {DEMO_WIRES.map((w, i) => (
                  <tr
                    key={i}
                    className={`hover:bg-gray-50 cursor-pointer ${selectedWire === i ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedWire(i)}
                  >
                    <td className="px-4 py-2.5 text-sm font-mono font-semibold">{w.label}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-3 rounded-full" style={{ backgroundColor: WIRE_HEX[w.color] }} />
                        <span className="text-sm font-mono capitalize">{w.color}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-sm font-mono text-gray-600">{w.startHole} → {w.endHole}</td>
                    <td className="px-4 py-2.5 text-sm font-mono text-gray-600">
                      {Math.abs(parseInt(w.endHole.substring(1)) - parseInt(w.startHole.substring(1)))} holes
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-500">{w.arcFlip ? '✓' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-3">How Jumper Wires Work</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• <strong>Click any wire</strong> to see its color, span, and arc height</li>
            <li>• <strong>Arc height</strong> scales automatically with wire length — short wires are flat, long wires arch high</li>
            <li>• <strong>arcFlip</strong> mirrors the arc to the opposite side — use when two wires share the same holes to prevent overlap</li>
            <li>• <strong>Insertion circles</strong> mark where the wire tips enter the breadboard holes</li>
            <li>• <strong>Red = power (+)</strong>, <strong>Black = ground (−)</strong> — always follow this convention to avoid mistakes</li>
            <li>• The mini circuit (row j) shows wires working with resistors in a real layout</li>
          </ul>
        </div>

      </div>
    </div>
  );
};

// Re-export the color map so the demo page can use it for the swatch table
const WIRE_HEX: Record<WireColor, string> = {
  red:    '#CC0000',
  black:  '#222222',
  green:  '#007700',
  blue:   '#0044CC',
  yellow: '#BBAA00',
  orange: '#CC5500',
  white:  '#C8C8C8',
  purple: '#6600AA',
};

export default WireDemo;
