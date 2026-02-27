import { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, Circle, AlertCircle } from 'lucide-react';
import type { BOMData, BOMComponent } from '@/types/bom.types';
import {
  encodeResistor,
  decodeResistor,
  decodeCapacitor,
  decodeDiode,
  decodeLED,
} from '@/utils/decoders';
import { ResistorSVG, CapacitorSVG, DiodeSVG } from '../visualizations/components-svg';
import BomBreadboardView from '../visualizations/BomBreadboardView';

interface BreadboardGuideProps {
  bomData: BOMData;
  projectName?: string;
}

interface BreadboardStep {
  number: number;
  title: string;
  description: string;
  components: string[];
  /** BOM component objects — renders visual thumbnails instead of plain text */
  componentItems?: BOMComponent[];
  /** Component types to highlight on the board view — others dim to 15% opacity */
  focusComponentTypes?: string[];
  tips?: string;
  warning?: string;
}

// ============================================================================
// Component Thumbnail
// ============================================================================

/** Parse a resistor value string like "470k", "2.2k", "1M", "100" → ohms. */
function parseOhmsForThumbnail(value: string): number {
  const cleaned = value.toLowerCase().replace(/[ωΩ\s]/g, '').replace('ohm', '').replace(/r$/, '');
  const match = cleaned.match(/^(\d+\.?\d*)(k|m)?$/);
  if (!match) return 10_000;
  const [, num, unit] = match;
  const n = parseFloat(num);
  if (unit === 'k') return n * 1_000;
  if (unit === 'm') return n * 1_000_000;
  return n;
}

/** Small SVG preview of a single BOM component — used in "What You Need" rows. */
function ComponentThumbnail({ component }: { component: BOMComponent }) {
  const w = 120;
  const h = 56;
  const sx = 10; const sy = 28; const ex = 110; const ey = 28;

  try {
    if (component.component_type === 'resistor') {
      const ohms = parseOhmsForThumbnail(component.value);
      const encoded = encodeResistor(ohms, 5);
      const spec = decodeResistor(encoded.bands4 ?? encoded.bands5);
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
          <ResistorSVG startX={sx} startY={sy} endX={ex} endY={ey} spec={spec} />
        </svg>
      );
    }

    if (component.component_type === 'capacitor') {
      const spec = decodeCapacitor(component.value);
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
          <CapacitorSVG startX={sx} startY={sy} endX={ex} endY={ey} spec={spec} />
        </svg>
      );
    }

    if (component.component_type === 'diode') {
      const spec = decodeDiode(component.value);
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
          <DiodeSVG startX={sx} startY={sy} endX={ex} endY={ey} spec={spec} />
        </svg>
      );
    }

    if (component.component_type === 'led') {
      const spec = decodeLED('red', '5mm');
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
          <DiodeSVG startX={sx} startY={sy} endX={ex} endY={ey} spec={spec} />
        </svg>
      );
    }

    if (component.component_type === 'transistor') {
      // Custom inline thumbnail — sized for 120×56 viewport.
      // TransistorSVG is designed for the large board canvas (leadLength=36, bh=46)
      // and clips at this scale, so we draw a simplified TO-92 directly.
      // Body: flat face at y=34, dome curves up to ~y=12. Leads: y=34–48. Labels: y=54.
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
          {/* Three leads: E (left), B (center), C (right) */}
          <line x1={48} y1={48} x2={48} y2={34} stroke="#A0A0A0" strokeWidth="2.5" strokeLinecap="round" />
          <line x1={60} y1={48} x2={60} y2={34} stroke="#A0A0A0" strokeWidth="2.5" strokeLinecap="round" />
          <line x1={72} y1={48} x2={72} y2={34} stroke="#A0A0A0" strokeWidth="2.5" strokeLinecap="round" />
          {/* D-shaped body: flat face at y=34, dome sweeps upward to ~y=12 */}
          <path d="M 38 34 L 82 34 A 22 22 0 0 0 38 34 Z"
            fill="#1A1A1A" stroke="#444444" strokeWidth="0.5" />
          {/* Subtle highlight on dome */}
          <ellipse cx={60} cy={20} rx={12} ry={7} fill="#FFFFFF" opacity="0.08" />
          {/* Part number */}
          <text x={60} y={25} textAnchor="middle" fontSize="7" fontFamily="monospace"
            fill="#CCCCCC" letterSpacing="-0.5">
            {component.value.substring(0, 7)}
          </text>
          {/* Pin labels */}
          <text x={48} y={54} textAnchor="middle" fontSize="7" fontFamily="sans-serif" fill="#666666">E</text>
          <text x={60} y={54} textAnchor="middle" fontSize="7" fontFamily="sans-serif" fill="#666666">B</text>
          <text x={72} y={54} textAnchor="middle" fontSize="7" fontFamily="sans-serif" fill="#666666">C</text>
        </svg>
      );
    }

    if (component.component_type === 'ic' || component.component_type === 'op-amp') {
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
          {/* DIP body */}
          <rect x={22} y={8} width={76} height={36} fill="#1A1A1A" stroke="#444" strokeWidth="1" rx={2} />
          {/* Notch */}
          <path d="M 56 8 A 4 4 0 0 1 64 8" fill="#2A2A2A" stroke="#444" strokeWidth="0.5" />
          {/* Pin stubs top row */}
          {[0, 1, 2, 3].map(i => (
            <line key={`t${i}`} x1={32 + i * 14} y1={3} x2={32 + i * 14} y2={8}
              stroke="#A0A0A0" strokeWidth="1.5" />
          ))}
          {/* Pin stubs bottom row */}
          {[0, 1, 2, 3].map(i => (
            <line key={`b${i}`} x1={32 + i * 14} y1={44} x2={32 + i * 14} y2={49}
              stroke="#A0A0A0" strokeWidth="1.5" />
          ))}
          <text x={60} y={30} textAnchor="middle" fontSize="9" fontFamily="monospace"
            fill="#CCCCCC" fontWeight="600">
            {component.value.substring(0, 7)}
          </text>
        </svg>
      );
    }

    if (component.component_type === 'potentiometer') {
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
          <circle cx={60} cy={28} r={22} fill="#888888" stroke="#555" strokeWidth="1" />
          <circle cx={60} cy={28} r={11} fill="#666666" />
          <line x1={60} y1={17} x2={60} y2={8} stroke="#DDDDDD" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    }
  } catch {
    // Fall through to generic thumbnail
  }

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <rect x={10} y={16} width={100} height={24} fill="#999" rx={3} />
      <text x={60} y={31} textAnchor="middle" fontSize="9" fill="#fff" fontFamily="monospace">
        {component.value.substring(0, 10)}
      </text>
    </svg>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function BreadboardGuide({ bomData, projectName: _projectName = 'Your Pedal' }: BreadboardGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const steps: BreadboardStep[] = [
    {
      number: 1,
      title: 'Gather Your Materials',
      description: 'Before starting, collect all the components and tools you\'ll need for breadboard prototyping.',
      components: [
        'Full-size breadboard (830 tie points recommended)',
        'Jumper wire kit (22AWG solid core)',
        'All components from your BOM',
        'Wire stripper and cutters',
        '9V battery with clip (for testing)',
        'Multimeter',
        'Guitar cable and test guitar/signal generator'
      ],
      tips: 'Organize components by type in small containers or bags. Label everything!'
    },
    {
      number: 2,
      title: 'Prepare the Breadboard',
      description: 'Set up your breadboard power rails and understand the layout.',
      components: [
        'Connect positive rail (red) on both sides',
        'Connect negative/ground rail (blue) on both sides',
        'Use wire bridges at the middle gap'
      ],
      tips: 'The two sides of a breadboard are not connected by default. Bridge the power rails if you need both sides.',
      warning: 'Always double-check power connections before applying power. Reversed polarity can damage components.'
    },
    {
      number: 3,
      title: 'Place ICs and Transistors',
      description: 'Start by placing the active components (ICs, transistors, op-amps) on the breadboard.',
      components: bomData.components
        .filter(c => ['ic', 'op-amp', 'transistor'].includes(c.component_type))
        .map(c => `${c.quantity}x ${c.value}`),
      componentItems: bomData.components.filter(c =>
        ['ic', 'op-amp', 'transistor'].includes(c.component_type)
      ),
      focusComponentTypes: ['ic', 'op-amp', 'transistor'],
      tips: 'ICs should straddle the center gap of the breadboard. Pin 1 is usually marked with a notch or dot.',
      warning: 'Static electricity can damage ICs. Touch a grounded metal surface before handling.'
    },
    {
      number: 4,
      title: 'Add Resistors',
      description: 'Place all resistors according to the schematic. Resistors are non-polarized, so orientation doesn\'t matter.',
      components: bomData.components
        .filter(c => c.component_type === 'resistor')
        .map(c => `${c.quantity}x ${c.value} — ${c.reference_designators.join(', ')}`),
      componentItems: bomData.components.filter(c => c.component_type === 'resistor'),
      focusComponentTypes: ['resistor'],
      tips: 'Bend resistor leads at 90° to fit breadboard spacing. Keep leads short but manageable.',
      warning: 'Double-check resistor color codes. A wrong value can prevent the circuit from working or cause damage.'
    },
    {
      number: 5,
      title: 'Add Capacitors',
      description: 'Place capacitors carefully. Electrolytic capacitors are polarized — negative leg must go to ground.',
      components: bomData.components
        .filter(c => c.component_type === 'capacitor')
        .map(c => `${c.quantity}x ${c.value} — ${c.reference_designators.join(', ')}`),
      componentItems: bomData.components.filter(c => c.component_type === 'capacitor'),
      focusComponentTypes: ['capacitor'],
      tips: 'Ceramic caps (small, yellow/brown) are non-polarized. Electrolytic caps (cylindrical) have polarity marked.',
      warning: 'CRITICAL: Electrolytic capacitors can explode if connected backwards. Check polarity twice!'
    },
    {
      number: 6,
      title: 'Add Diodes',
      description: 'Place any diodes in the circuit. Diodes are polarized — the stripe indicates the cathode (negative).',
      components: bomData.components
        .filter(c => c.component_type === 'diode' || c.component_type === 'led')
        .map(c => `${c.quantity}x ${c.value} — ${c.reference_designators.join(', ')}`),
      componentItems: bomData.components.filter(c =>
        c.component_type === 'diode' || c.component_type === 'led'
      ),
      focusComponentTypes: ['diode', 'led'],
      tips: 'The stripe on a diode marks the cathode. Current flows from anode to cathode (towards the stripe).'
    },
    {
      number: 7,
      title: 'Add Potentiometers (Test Controls)',
      description: 'Wire up potentiometers using jumper wires. For now, connect them with clips for testing.',
      components: bomData.components
        .filter(c => c.component_type === 'potentiometer')
        .map(c => `${c.quantity}x ${c.value} — ${c.reference_designators.join(', ')}`),
      componentItems: bomData.components.filter(c => c.component_type === 'potentiometer'),
      focusComponentTypes: ['potentiometer'],
      tips: 'Potentiometers typically have 3 pins: left (ground), middle (wiper/output), right (signal). Check the datasheet.'
    },
    {
      number: 8,
      title: 'Wire Input and Output',
      description: 'Connect input and output jacks using alligator clips or direct wiring to test the circuit.',
      components: [
        'Input: Connect guitar cable tip to circuit input',
        'Input: Connect guitar cable sleeve to ground',
        'Output: Connect circuit output to amplifier',
        'Output: Connect ground to amplifier ground'
      ],
      tips: 'Use alligator clips for initial testing. This makes troubleshooting easier.'
    },
    {
      number: 9,
      title: 'Connect Power',
      description: 'Connect your power supply. Most guitar pedals use 9V center-negative.',
      components: [
        `Power: ${bomData.power?.voltage ?? '9V'} ${bomData.power?.polarity ?? 'center-negative'}`,
        'Connect positive (+9V) to positive rail',
        'Connect negative (ground) to ground rail',
        'Add 100μF capacitor across power rails (near circuit)'
      ],
      warning: 'Verify polarity before connecting power! Guitar pedals are typically CENTER-NEGATIVE.',
      tips: 'Always use a current-limited power supply for first testing. Start with 50mA limit if possible.'
    },
    {
      number: 10,
      title: 'Test and Troubleshoot',
      description: 'Power on and test the circuit systematically.',
      components: [
        'Check power rails with multimeter (should read ~9V)',
        'Verify IC pins have proper voltages',
        'Connect guitar and amplifier',
        'Test with known good signal',
        'Adjust controls and listen for proper operation'
      ],
      tips: 'If it doesn\'t work, check: power connections, IC orientation, capacitor polarity, resistor values.',
      warning: 'Keep volume LOW when first testing! Some circuits can produce very loud signals.'
    },
    {
      number: 11,
      title: 'Document and Prepare for Build',
      description: 'Once working, take photos and notes before transferring to permanent board.',
      components: [
        'Take photos from multiple angles',
        'Note any modifications from the original schematic',
        'Measure voltages at test points',
        'Write down any quirks or settings',
        'Prepare for stripboard or PCB build'
      ],
      tips: 'Your breadboard prototype is your reference. Don\'t disassemble it until the final build is working!'
    }
  ];

  const toggleStepComplete = (stepNumber: number) => {
    setCompletedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepNumber)) {
        newSet.delete(stepNumber);
      } else {
        newSet.add(stepNumber);
      }
      return newSet;
    });
  };

  const progress = (completedSteps.size / steps.length) * 100;
  const currentStepData = steps[currentStep];

  const hasComponentThumbnails =
    (currentStepData.componentItems?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Breadboard Layout</h2>
        <p className="text-blue-100 mb-4">
          Build a working prototype before committing to a permanent build
        </p>
        <div className="flex items-center justify-between">
          <div className="text-sm">
            Progress: {completedSteps.size} of {steps.length} steps completed
          </div>
          <div className="text-sm font-medium">
            {Math.round(progress)}%
          </div>
        </div>
        <div className="mt-2 bg-blue-900 rounded-full h-2">
          <div
            className="bg-green-400 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step Navigation */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4">
        <button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={20} />
          Previous
        </button>

        <div className="text-center">
          <div className="text-sm text-gray-600">Step {currentStepData.number} of {steps.length}</div>
          <div className="font-semibold text-gray-900">{currentStepData.title}</div>
        </div>

        <button
          onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
          disabled={currentStep === steps.length - 1}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Current Step */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Step Header */}
        <div className="bg-gray-50 border-b border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Step {currentStepData.number}: {currentStepData.title}
              </h3>
              <p className="text-gray-700">{currentStepData.description}</p>
            </div>
            <button
              onClick={() => toggleStepComplete(currentStepData.number)}
              className="ml-4"
            >
              {completedSteps.has(currentStepData.number) ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : (
                <Circle className="w-8 h-8 text-gray-300" />
              )}
            </button>
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6 space-y-4">

          {/* What You Need — visual thumbnails for BOM steps */}
          {hasComponentThumbnails && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">What You Need:</h4>
              <div className="flex flex-wrap gap-3">
                {currentStepData.componentItems!.map((component, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
                    style={{ minWidth: 130 }}
                  >
                    <ComponentThumbnail component={component} />
                    <span className="text-xs font-semibold text-gray-800 text-center leading-tight">
                      {component.value}
                    </span>
                    <span className="text-xs text-gray-500 text-center leading-tight">
                      {component.reference_designators.slice(0, 3).join(', ')}
                      {component.quantity > 1 && ` ×${component.quantity}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* What You Need — plain text list for non-BOM steps */}
          {!hasComponentThumbnails && currentStepData.components.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">What You Need:</h4>
              <ul className="space-y-2">
                {currentStepData.components.map((component, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-gray-700">{component}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Breadboard visualization — shown for build steps 2–9 */}
          {currentStepData.number >= 2 && currentStepData.number <= 9 && (
            <div className="my-6">
              <h4 className="font-semibold text-gray-900 mb-3">Your Components on the Breadboard:</h4>
              <BomBreadboardView
                bomData={bomData}
                focusComponentTypes={currentStepData.focusComponentTypes}
              />
            </div>
          )}

          {/* Tips */}
          {currentStepData.tips && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-green-900 mb-1">Tip</div>
                  <div className="text-green-800 text-sm">{currentStepData.tips}</div>
                </div>
              </div>
            </div>
          )}

          {/* Warning */}
          {currentStepData.warning && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-red-900 mb-1">Warning</div>
                  <div className="text-red-800 text-sm">{currentStepData.warning}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mark Complete Button */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <button
            onClick={() => {
              toggleStepComplete(currentStepData.number);
              if (currentStep < steps.length - 1) {
                setCurrentStep(currentStep + 1);
              }
            }}
            className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
              completedSteps.has(currentStepData.number)
                ? 'bg-gray-300 text-gray-600'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {completedSteps.has(currentStepData.number)
              ? '✓ Step Completed'
              : 'Mark as Complete & Continue'}
          </button>
        </div>
      </div>

      {/* Step Overview */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">All Steps</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {steps.map((step) => (
            <button
              key={step.number}
              onClick={() => setCurrentStep(step.number - 1)}
              className={`text-left p-3 rounded-lg border-2 transition-colors ${
                currentStep === step.number - 1
                  ? 'border-blue-600 bg-blue-50'
                  : completedSteps.has(step.number)
                  ? 'border-green-600 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {completedSteps.has(step.number) ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-xs font-medium text-gray-600">Step {step.number}</span>
              </div>
              <div className="text-sm font-medium text-gray-900">{step.title}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
