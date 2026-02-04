import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import BOMTable from '../components/bom/BOMTable';
import BOMExport from '../components/bom/BOMExport';
import BreadboardGuide from '../components/guides/BreadboardGuide';
import StripboardGuide from '../components/guides/StripboardGuide';
import EnclosureGuide from '../components/guides/EnclosureGuide';
import type { BOMData } from '../types/bom.types';

// Sample BOM data for demo (simulating a Tube Screamer circuit)
const sampleBOMData: BOMData = {
  components: [
    // Resistors
    { component_type: 'resistor', value: '10k', quantity: 3, reference_designators: ['R1', 'R2', 'R3'], confidence: 95, verified: false },
    { component_type: 'resistor', value: '4.7k', quantity: 2, reference_designators: ['R4', 'R5'], confidence: 98, verified: true },
    { component_type: 'resistor', value: '51k', quantity: 1, reference_designators: ['R6'], confidence: 92, verified: false },
    { component_type: 'resistor', value: '1M', quantity: 2, reference_designators: ['R7', 'R8'], confidence: 96, verified: false },
    { component_type: 'resistor', value: '470Ω', quantity: 1, reference_designators: ['R9'], confidence: 90, verified: false },

    // Capacitors
    { component_type: 'capacitor', value: '100nF', quantity: 4, reference_designators: ['C1', 'C2', 'C3', 'C4'], confidence: 94, verified: false },
    { component_type: 'capacitor', value: '47µF', quantity: 2, reference_designators: ['C5', 'C6'], confidence: 88, verified: false, notes: 'Electrolytic, observe polarity' },
    { component_type: 'capacitor', value: '10µF', quantity: 1, reference_designators: ['C7'], confidence: 91, verified: false },
    { component_type: 'capacitor', value: '220pF', quantity: 1, reference_designators: ['C8'], confidence: 85, verified: false },

    // ICs
    { component_type: 'op-amp', value: 'JRC4558D', quantity: 1, reference_designators: ['IC1'], confidence: 98, verified: true, part_number: 'JRC4558D', supplier: 'Tayda', supplier_url: 'https://www.taydaelectronics.com' },

    // Diodes
    { component_type: 'diode', value: '1N4148', quantity: 2, reference_designators: ['D1', 'D2'], confidence: 97, verified: false },

    // Hardware
    { component_type: 'input-jack', value: '1/4" Mono', quantity: 1, reference_designators: ['J1'], confidence: 100, verified: true },
    { component_type: 'output-jack', value: '1/4" Mono', quantity: 1, reference_designators: ['J2'], confidence: 100, verified: true },
    { component_type: 'dc-jack', value: '2.1mm', quantity: 1, reference_designators: ['J3'], confidence: 100, verified: true },
    { component_type: 'footswitch', value: '3PDT', quantity: 1, reference_designators: ['SW1'], confidence: 100, verified: true },
    { component_type: 'potentiometer', value: '100kB', quantity: 1, reference_designators: ['VR1'], confidence: 95, verified: false, notes: 'Drive control' },
    { component_type: 'potentiometer', value: '100kA', quantity: 1, reference_designators: ['VR2'], confidence: 95, verified: false, notes: 'Tone control' },
    { component_type: 'potentiometer', value: '100kA', quantity: 1, reference_designators: ['VR3'], confidence: 95, verified: false, notes: 'Level control' },
    { component_type: 'led', value: '5mm Red', quantity: 1, reference_designators: ['LED1'], confidence: 100, verified: true },
  ],
  enclosure: {
    size: '125B',
    drill_count: 8,
    notes: 'Standard Hammond-style enclosure, powder-coated'
  },
  power: {
    voltage: '9V',
    current: '20mA',
    polarity: 'center-negative'
  },
  parsed_at: new Date(),
  confidence_score: 93
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
                <p className="text-sm text-gray-600">Tube Screamer Clone Build</p>
              </div>
            </div>
            <div className="text-sm text-gray-600">
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
              <h3 className="font-semibold text-blue-900 mb-2">📋 Demo Mode</h3>
              <p className="text-blue-800 text-sm">
                This is a sample Tube Screamer circuit BOM. In the real app, this data would come from
                analyzing an uploaded schematic with Claude Vision API. You can click on components to edit them.
              </p>
            </div>

            <BOMTable bomData={sampleBOMData} onUpdate={() => console.log('BOM updated')} />
            <BOMExport bomData={sampleBOMData} projectName="Tube Screamer Clone" />
          </div>
        )}

        {activeTab === 'breadboard' && (
          <div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">🍞 Breadboard Prototyping</h3>
              <p className="text-blue-800 text-sm">
                Interactive 11-step guide for building your prototype on a breadboard.
                Track your progress as you complete each step.
              </p>
            </div>
            <BreadboardGuide bomData={sampleBOMData} projectName="Tube Screamer Clone" />
          </div>
        )}

        {activeTab === 'stripboard' && (
          <div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-purple-900 mb-2">📐 Stripboard Build</h3>
              <p className="text-purple-800 text-sm">
                Transfer your working breadboard to permanent stripboard. Includes component placement,
                track cuts, and wiring instructions.
              </p>
            </div>
            <StripboardGuide bomData={sampleBOMData} projectName="Tube Screamer Clone" />
          </div>
        )}

        {activeTab === 'enclosure' && (
          <div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-orange-900 mb-2">📦 Final Assembly</h3>
              <p className="text-orange-800 text-sm">
                LEGO-style instructions for drilling and wiring your pedal enclosure.
                Includes drill template and 3PDT wiring diagram.
              </p>
            </div>
            <EnclosureGuide bomData={sampleBOMData} projectName="Tube Screamer Clone" />
          </div>
        )}
      </div>

      {/* Demo Footer */}
      <div className="bg-gray-800 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-xl font-bold mb-2">PedalPath v2 - Week 2 Complete</h3>
          <p className="text-gray-400 mb-4">
            All core components implemented and ready for integration
          </p>
          <div className="flex justify-center gap-4 text-sm">
            <div className="bg-gray-700 px-4 py-2 rounded">
              ✅ Claude Vision Integration
            </div>
            <div className="bg-gray-700 px-4 py-2 rounded">
              ✅ BOM Management
            </div>
            <div className="bg-gray-700 px-4 py-2 rounded">
              ✅ 3 Build Guides
            </div>
            <div className="bg-gray-700 px-4 py-2 rounded">
              ✅ Export Features
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
