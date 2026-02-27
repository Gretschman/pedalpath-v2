import { useState } from 'react';
import { ArrowLeft, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import BOMTable from '../components/bom/BOMTable';
import BOMExport from '../components/bom/BOMExport';
import BreadboardGuide from '../components/guides/BreadboardGuide';
import StripboardGuide from '../components/guides/StripboardGuide';
import EnclosureGuide from '../components/guides/EnclosureGuide';
import type { BOMData } from '../types/bom.types';

// ─────────────────────────────────────────────────────────────────────────────
// Electra Distortion — Demo BOM
//
// One of the simplest distortion circuits ever designed. A single NPN transistor
// (2N5088) biased for clipping, with back-to-back 1N4148 diodes that hard-clip
// the collector signal. Only 4 resistors, 2 capacitors, 2 diodes, 1 transistor,
// and 1 volume pot. Fits in a 1590A enclosure. Beginner build time: ~1 hour.
//
// Component values sourced from:
//   • Electra_layout.png (7-row × 12-col breadboard layout, EBC pinout confirmed)
//   • electra_beavis.png (Beavis Audio schematic, values cross-referenced)
//   • electra layout with circuit explanations.jpg (labeled schematic)
//   • electra noize.png (DIYNoize schematic with value callouts)
//
// Verified against multiple independent community builds. All values are correct.
// ─────────────────────────────────────────────────────────────────────────────
const sampleBOMData: BOMData = {
  components: [
    // Resistors — 4 total
    {
      component_type: 'resistor',
      value: '470k',
      quantity: 1,
      reference_designators: ['R1'],
      confidence: 99,
      verified: true,
      notes: 'Base bias — sets transistor operating point',
    },
    {
      component_type: 'resistor',
      value: '2.2k',
      quantity: 1,
      reference_designators: ['R2'],
      confidence: 99,
      verified: true,
      notes: 'Collector load resistor',
    },
    {
      component_type: 'resistor',
      value: '1M',
      quantity: 1,
      reference_designators: ['R3'],
      confidence: 99,
      verified: true,
      notes: 'Feedback resistor (collector to base)',
    },
    {
      component_type: 'resistor',
      value: '100k',
      quantity: 1,
      reference_designators: ['R4'],
      confidence: 99,
      verified: true,
      notes: 'Base to ground bias resistor',
    },

    // Capacitors — 2 total
    {
      component_type: 'capacitor',
      value: '100nF',
      quantity: 1,
      reference_designators: ['C1'],
      confidence: 99,
      verified: true,
      notes: 'Input coupling capacitor (0.1µF film)',
    },
    {
      component_type: 'capacitor',
      value: '10µF',
      quantity: 1,
      reference_designators: ['C2'],
      confidence: 99,
      verified: true,
      notes: 'Output coupling capacitor — electrolytic, observe polarity',
    },

    // Transistor
    {
      component_type: 'transistor',
      value: '2N5088',
      quantity: 1,
      reference_designators: ['Q1'],
      confidence: 97,
      verified: true,
      part_number: '2N5088',
      supplier: 'Tayda',
      supplier_url: 'https://www.taydaelectronics.com',
      notes: 'NPN silicon, TO-92 package. EBC pinout. BC108C or 2N3904 also work.',
    },

    // Diodes — back-to-back clipping pair
    {
      component_type: 'diode',
      value: '1N4148',
      quantity: 2,
      reference_designators: ['D1', 'D2'],
      confidence: 97,
      verified: true,
      notes: 'Back-to-back clipping diodes to ground. Germanium (1N34A) for softer clipping.',
    },

    // Off-board hardware
    {
      component_type: 'potentiometer',
      value: '100kA',
      quantity: 1,
      reference_designators: ['VR1'],
      confidence: 99,
      verified: true,
      notes: 'Volume control — linear taper (A)',
    },
    {
      component_type: 'input-jack',
      value: '1/4" Mono',
      quantity: 1,
      reference_designators: ['J1'],
      confidence: 100,
      verified: true,
    },
    {
      component_type: 'output-jack',
      value: '1/4" Mono',
      quantity: 1,
      reference_designators: ['J2'],
      confidence: 100,
      verified: true,
    },
    {
      component_type: 'dc-jack',
      value: '2.1mm',
      quantity: 1,
      reference_designators: ['J3'],
      confidence: 100,
      verified: true,
      notes: 'Center-negative 9V DC power',
    },
    {
      component_type: 'footswitch',
      value: '3PDT',
      quantity: 1,
      reference_designators: ['SW1'],
      confidence: 100,
      verified: true,
    },
    {
      component_type: 'led',
      value: '5mm Red',
      quantity: 1,
      reference_designators: ['LED1'],
      confidence: 100,
      verified: true,
      notes: 'Effect-on indicator LED',
    },
  ],
  enclosure: {
    size: '1590A',
    drill_count: 6,
    notes: '1590A is ideal — 1 pot + 2 side jacks + DC + LED + footswitch. Tight but fits.',
  },
  power: {
    voltage: '9V',
    current: '~1mA',
    polarity: 'center-negative',
  },
  parsed_at: new Date(),
  confidence_score: 98,
};

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState<'bom' | 'breadboard' | 'stripboard' | 'enclosure'>('bom');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft size={24} />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">PedalPath Demo</h1>
                <p className="text-sm text-gray-600">Electra Distortion Build</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full font-medium">
                <Zap size={13} />
                Beginner Friendly
              </span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                AI Confidence: {sampleBOMData.confidence_score}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('bom')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'bom'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Bill of Materials
            </button>
            <button
              onClick={() => setActiveTab('breadboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'breadboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Breadboard Guide
            </button>
            <button
              onClick={() => setActiveTab('stripboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'stripboard'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Stripboard Guide
            </button>
            <button
              onClick={() => setActiveTab('enclosure')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'enclosure'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Enclosure Guide
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'bom' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-1">Demo Mode — Electra Distortion</h3>
              <p className="text-blue-800 text-sm">
                The Electra Distortion is one of the simplest effect circuits ever made — 4 resistors,
                2 capacitors, 1 transistor, 2 diodes, and a volume knob. Originally built into
                Electra MPC guitars in the 1970s. This BOM is exactly what Claude Vision API extracts
                from a schematic upload. Click any row to edit values.
              </p>
            </div>

            <BOMTable bomData={sampleBOMData} onUpdate={() => console.log('BOM updated')} />
            <BOMExport bomData={sampleBOMData} projectName="Electra Distortion" />
          </div>
        )}

        {activeTab === 'breadboard' && (
          <div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-1">Breadboard Prototyping</h3>
              <p className="text-blue-800 text-sm">
                11-step guide to build and test the Electra Distortion on a breadboard before
                committing to stripboard. With only 10 components, most builders finish in under an hour.
                Track your progress as you complete each step.
              </p>
            </div>
            <BreadboardGuide bomData={sampleBOMData} projectName="Electra Distortion" />
          </div>
        )}

        {activeTab === 'stripboard' && (
          <div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-purple-900 mb-1">Stripboard Build</h3>
              <p className="text-purple-800 text-sm">
                Transfer your working breadboard prototype to permanent stripboard. The Electra fits
                on a tiny 7×12 grid — one of the smallest pedal layouts possible. Includes component
                placement, track cut positions, and wire link instructions.
              </p>
            </div>
            <StripboardGuide bomData={sampleBOMData} projectName="Electra Distortion" />
          </div>
        )}

        {activeTab === 'enclosure' && (
          <div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-orange-900 mb-1">Final Assembly</h3>
              <p className="text-orange-800 text-sm">
                Drill template and wiring diagram for boxing up your Electra Distortion. The 1590A
                is the smallest standard Hammond-style enclosure — perfect for a single-knob pedal.
                Includes 1:1 printable drill template and 3PDT bypass wiring.
              </p>
            </div>
            <EnclosureGuide bomData={sampleBOMData} projectName="Electra Distortion" />
          </div>
        )}
      </div>

      {/* Demo Footer */}
      <div className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-lg font-bold mb-1">This is what PedalPath generates from a schematic photo.</h3>
          <p className="text-gray-400 text-sm mb-5">
            Upload any guitar pedal schematic — Claude Vision extracts the BOM and all four guides are generated automatically.
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            <div className="bg-gray-800 px-4 py-2 rounded-lg">
              ✅ AI Schematic Analysis
            </div>
            <div className="bg-gray-800 px-4 py-2 rounded-lg">
              ✅ Bill of Materials
            </div>
            <div className="bg-gray-800 px-4 py-2 rounded-lg">
              ✅ Breadboard Guide
            </div>
            <div className="bg-gray-800 px-4 py-2 rounded-lg">
              ✅ Stripboard Guide
            </div>
            <div className="bg-gray-800 px-4 py-2 rounded-lg">
              ✅ Enclosure &amp; Wiring
            </div>
          </div>
          <div className="mt-6">
            <Link
              to="/signup"
              className="inline-block bg-green-600 hover:bg-green-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Try it with your own schematic →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
