import { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, Circle, AlertCircle } from 'lucide-react';
import type { BOMData } from '../../types/bom.types';
import BreadboardGrid from '../visualizations/BreadboardGrid';

interface BreadboardGuideProps {
  bomData: BOMData;
  projectName?: string;
}

interface BreadboardStep {
  number: number;
  title: string;
  description: string;
  components: string[];
  tips?: string;
  warning?: string;
}

export default function BreadboardGuide({ bomData, projectName: _projectName = 'Your Pedal' }: BreadboardGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Generate breadboard steps based on BOM data
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
      tips: 'ICs should straddle the center gap of the breadboard. Pin 1 is usually marked with a notch or dot.',
      warning: 'Static electricity can damage ICs. Touch a grounded metal surface before handling.'
    },
    {
      number: 4,
      title: 'Add Resistors',
      description: 'Place all resistors according to the schematic. Resistors are non-polarized, so orientation doesn\'t matter.',
      components: bomData.components
        .filter(c => c.component_type === 'resistor')
        .map(c => `${c.quantity}x ${c.value} - ${c.reference_designators.join(', ')}`),
      tips: 'Bend resistor leads at 90° to fit breadboard spacing. Keep leads short but manageable.',
      warning: 'Double-check resistor color codes. A wrong value can prevent the circuit from working or cause damage.'
    },
    {
      number: 5,
      title: 'Add Capacitors',
      description: 'Place capacitors carefully. Electrolytic capacitors are polarized - negative leg must go to ground.',
      components: bomData.components
        .filter(c => c.component_type === 'capacitor')
        .map(c => `${c.quantity}x ${c.value} - ${c.reference_designators.join(', ')}`),
      tips: 'Ceramic caps (small, yellow/brown) are non-polarized. Electrolytic caps (cylindrical) have polarity marked.',
      warning: 'CRITICAL: Electrolytic capacitors can explode if connected backwards. Check polarity twice!'
    },
    {
      number: 6,
      title: 'Add Diodes',
      description: 'Place any diodes in the circuit. Diodes are polarized - the stripe indicates the cathode (negative).',
      components: bomData.components
        .filter(c => c.component_type === 'diode')
        .map(c => `${c.quantity}x ${c.value} - ${c.reference_designators.join(', ')}`),
      tips: 'The stripe on a diode marks the cathode. Current flows from anode to cathode (towards the stripe).'
    },
    {
      number: 7,
      title: 'Add Potentiometers (Test Controls)',
      description: 'Wire up potentiometers using jumper wires. For now, connect them with clips for testing.',
      components: bomData.components
        .filter(c => c.component_type === 'potentiometer')
        .map(c => `${c.quantity}x ${c.value} - ${c.reference_designators.join(', ')}`),
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
        `Power: ${bomData.power?.voltage || '9V'} ${bomData.power?.polarity || 'center-negative'}`,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Breadboard Prototyping Guide</h2>
        <p className="text-blue-100 mb-4">
          Build a working prototype on a breadboard before committing to a permanent build
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
          {/* Components/Instructions */}
          {currentStepData.components.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">What You Need:</h4>
              <ul className="space-y-2">
                {currentStepData.components.map((component, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
                    <span className="text-gray-700">{component}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Breadboard Visualization (for relevant steps) */}
          {(currentStepData.number === 2 || currentStepData.number === 3) && (
            <div className="my-6">
              <h4 className="font-semibold text-gray-900 mb-3">Visual Reference:</h4>
              <BreadboardGrid showDemo={true} />
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
