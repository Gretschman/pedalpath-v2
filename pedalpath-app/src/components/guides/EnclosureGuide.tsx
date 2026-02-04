import { useState } from 'react';
import { Box, Drill, Wrench, Cable, CheckCircle, Circle, AlertTriangle } from 'lucide-react';
import type { BOMData } from '../../types/bom.types';

interface EnclosureGuideProps {
  bomData: BOMData;
  projectName?: string;
}

interface DrillHole {
  id: string;
  component: string;
  diameter: string;
  x: number; // mm from left edge
  y: number; // mm from top edge
  notes?: string;
}

interface WiringConnection {
  from: string;
  to: string;
  wireColor: string;
  notes?: string;
}

export default function EnclosureGuide({ bomData, projectName = 'Your Pedal' }: EnclosureGuideProps) {
  const [selectedStep, setSelectedStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const enclosureSize = bomData.enclosure?.size || '1590B';

  // Generate drill template based on components
  const drillHoles: DrillHole[] = [];
  let xPos = 15; // Start from left edge
  const yTop = 15; // Top row
  const yBottom = 45; // Bottom row

  // Add pots
  bomData.components
    .filter(c => c.component_type === 'potentiometer')
    .forEach((pot, idx) => {
      drillHoles.push({
        id: `pot-${idx}`,
        component: `${pot.value} Pot (${pot.reference_designators.join(', ')})`,
        diameter: '8mm',
        x: xPos + (idx * 25),
        y: yTop,
        notes: 'For 16mm pot with mounting nut'
      });
    });

  // Add footswitch
  if (bomData.components.some(c => c.component_type === 'footswitch')) {
    drillHoles.push({
      id: 'footswitch',
      component: '3PDT Footswitch',
      diameter: '12mm',
      x: 60,
      y: 65,
      notes: 'Center of enclosure for true bypass switching'
    });
  }

  // Add LED
  if (bomData.components.some(c => c.component_type === 'led')) {
    drillHoles.push({
      id: 'led',
      component: 'LED Indicator',
      diameter: '5mm',
      x: 60,
      y: 25,
      notes: 'Above footswitch for visibility'
    });
  }

  // Add jacks (side mounting)
  const inputJack = bomData.components.find(c => c.component_type === 'input-jack');
  const outputJack = bomData.components.find(c => c.component_type === 'output-jack');
  const dcJack = bomData.components.find(c => c.component_type === 'dc-jack');

  if (inputJack) {
    drillHoles.push({
      id: 'input',
      component: 'Input Jack',
      diameter: '11mm',
      x: 10,
      y: 30,
      notes: 'Right side panel (when viewed from front)'
    });
  }

  if (outputJack) {
    drillHoles.push({
      id: 'output',
      component: 'Output Jack',
      diameter: '11mm',
      x: 110,
      y: 30,
      notes: 'Left side panel (when viewed from front)'
    });
  }

  if (dcJack) {
    drillHoles.push({
      id: 'power',
      component: 'DC Power Jack',
      diameter: '11mm',
      x: 100,
      y: 15,
      notes: 'Top panel, away from audio jacks'
    });
  }

  // Wiring connections (3PDT standard)
  const wiringConnections: WiringConnection[] = [
    { from: 'Input Jack Tip', to: '3PDT Pin 2', wireColor: 'White', notes: 'Guitar input signal' },
    { from: '3PDT Pin 5', to: 'Circuit Input', wireColor: 'White', notes: 'To circuit input pad' },
    { from: 'Circuit Output', to: '3PDT Pin 4', wireColor: 'Blue', notes: 'From circuit output pad' },
    { from: '3PDT Pin 1', to: 'Output Jack Tip', wireColor: 'Blue', notes: 'Pedal output' },
    { from: '3PDT Pin 6', to: 'Output Jack Tip', wireColor: 'Blue', notes: 'Bypass connection' },
    { from: 'Input Jack Sleeve', to: 'Ground', wireColor: 'Black', notes: 'Ground/sleeve' },
    { from: 'Output Jack Sleeve', to: 'Ground', wireColor: 'Black', notes: 'Ground/sleeve' },
    { from: 'DC Jack Negative', to: 'Ground', wireColor: 'Black', notes: 'Power ground' },
    { from: 'DC Jack Positive', to: 'Circuit +9V', wireColor: 'Red', notes: 'Power supply' },
    { from: '3PDT Pin 9', to: 'LED Anode (+)', wireColor: 'Red', notes: 'LED indicator power' },
    { from: 'LED Cathode (-)', to: 'Ground (via CLR)', wireColor: 'Black', notes: 'With current limiting resistor' }
  ];

  const buildSteps = [
    {
      title: 'Prepare the Enclosure',
      icon: Box,
      tasks: [
        'Clean enclosure with rubbing alcohol',
        'Remove any burrs or sharp edges',
        'Mark drill locations with permanent marker or center punch',
        'Double-check measurements before drilling'
      ]
    },
    {
      title: 'Drill All Holes',
      icon: Drill,
      tasks: [
        'Start with small pilot holes (2-3mm)',
        'Step up to final sizes gradually',
        'Use cutting oil for cleaner holes in metal',
        'Deburr all holes with a larger bit or file',
        'Test fit all components before proceeding'
      ]
    },
    {
      title: 'Mount Circuit Board',
      icon: Wrench,
      tasks: [
        'Install board standoffs or use adhesive foam pads',
        'Ensure board doesn\'t touch enclosure (shorts!)',
        'Leave room for wiring underneath',
        'Board should be stable and secure'
      ]
    },
    {
      title: 'Wire Off-Board Components',
      icon: Cable,
      tasks: [
        'Wire 3PDT footswitch according to diagram',
        'Connect input and output jacks',
        'Wire potentiometers to board',
        'Connect DC jack with correct polarity',
        'Wire LED with current-limiting resistor (typically 2.2k-4.7k)',
        'Use heat shrink tubing on all exposed connections'
      ]
    },
    {
      title: 'Final Assembly',
      icon: CheckCircle,
      tasks: [
        'Double-check all wiring before powering on',
        'Test circuit outside enclosure first',
        'Mount all components in enclosure',
        'Tighten all nuts and washers securely',
        'Test again inside enclosure',
        'Close enclosure and add rubber feet'
      ]
    }
  ];

  const toggleStepComplete = (stepIdx: number) => {
    setCompletedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepIdx)) {
        newSet.delete(stepIdx);
      } else {
        newSet.add(stepIdx);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-800 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Enclosure Build Guide</h2>
        <p className="text-orange-100 mb-4">
          LEGO-style assembly instructions for your final pedal build
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-orange-700 rounded-lg p-3">
            <div className="text-xs text-orange-200">Enclosure Size</div>
            <div className="text-lg font-bold">{enclosureSize}</div>
          </div>
          <div className="bg-orange-700 rounded-lg p-3">
            <div className="text-xs text-orange-200">Holes to Drill</div>
            <div className="text-lg font-bold">{drillHoles.length}</div>
          </div>
          <div className="bg-orange-700 rounded-lg p-3">
            <div className="text-xs text-orange-200">Wire Connections</div>
            <div className="text-lg font-bold">{wiringConnections.length}</div>
          </div>
        </div>
      </div>

      {/* Drill Template */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Drill className="w-6 h-6" />
            Drilling Template
          </h3>
        </div>
        <div className="p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-blue-900 mb-2">Drilling Safety</h4>
            <ul className="space-y-1 text-blue-800 text-sm">
              <li>• Wear safety glasses</li>
              <li>• Secure enclosure firmly in a vice or clamp</li>
              <li>• Start with pilot holes, step up to final size</li>
              <li>• Use appropriate bits for aluminum (HSS or cobalt)</li>
              <li>• Go slowly to avoid wandering or cracking</li>
            </ul>
          </div>

          {/* Drill Template Visualization */}
          <div className="border-2 border-gray-300 rounded-lg p-8 bg-gray-50 mb-6">
            <div className="text-center text-sm text-gray-600 mb-4">
              Top View - {enclosureSize} Enclosure
            </div>
            <div className="relative bg-white border-2 border-gray-400 rounded" style={{ height: '300px' }}>
              {drillHoles.map(hole => (
                <div
                  key={hole.id}
                  className="absolute group"
                  style={{
                    left: `${(hole.x / 120) * 100}%`,
                    top: `${(hole.y / 80) * 100}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div className="relative">
                    <Circle
                      className="text-red-500 cursor-help"
                      size={hole.diameter === '12mm' ? 32 : hole.diameter === '11mm' ? 28 : 20}
                      fill="rgba(239, 68, 68, 0.2)"
                    />
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block">
                      <div className="bg-gray-900 text-white text-xs rounded px-3 py-2 whitespace-nowrap">
                        <div className="font-semibold">{hole.component}</div>
                        <div>{hole.diameter} hole</div>
                        <div className="text-gray-400">({hole.x}mm, {hole.y}mm)</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center text-xs text-gray-500 mt-2">
              Hover over circles for details
            </div>
          </div>

          {/* Drill Hole List */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Drilling Order</h4>
            {drillHoles.map((hole, idx) => (
              <div key={hole.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="bg-orange-100 text-orange-800 font-bold rounded-full w-8 h-8 flex items-center justify-center text-sm">
                        {idx + 1}
                      </div>
                      <div>
                        <h5 className="font-semibold text-gray-900">{hole.component}</h5>
                        <div className="text-sm text-gray-600 mt-1">
                          Diameter: <span className="font-medium">{hole.diameter}</span> |
                          Position: <span className="font-medium">X: {hole.x}mm, Y: {hole.y}mm</span>
                        </div>
                        {hole.notes && (
                          <div className="text-sm text-gray-700 mt-2 italic">{hole.notes}</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <Circle className="w-6 h-6 text-gray-300" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3PDT Wiring Diagram */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Cable className="w-6 h-6" />
            Off-Board Wiring
          </h3>
        </div>
        <div className="p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-yellow-900 mb-1">Critical: Verify Before Powering</h4>
                <p className="text-yellow-800 text-sm">
                  Double-check all wiring connections before applying power. Incorrect wiring can damage components.
                  Always test continuity and verify no shorts to ground.
                </p>
              </div>
            </div>
          </div>

          {/* 3PDT Diagram */}
          <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-6 mb-6">
            <h4 className="font-semibold text-gray-900 mb-4 text-center">
              3PDT True Bypass Wiring Diagram
            </h4>
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(pin => (
                <div key={pin} className="bg-white border-2 border-gray-400 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-600 mb-1">Pin {pin}</div>
                  <div className="text-xs font-medium text-gray-900">
                    {pin === 1 && 'Output Tip'}
                    {pin === 2 && 'Input Tip'}
                    {pin === 3 && 'Ground'}
                    {pin === 4 && 'Circuit Out'}
                    {pin === 5 && 'Circuit In'}
                    {pin === 6 && 'Bypass'}
                    {pin === 7 && 'LED -'}
                    {pin === 8 && 'N/C'}
                    {pin === 9 && 'LED +'}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-600 text-center mt-4">
              View from solder side (lugs facing you)
            </div>
          </div>

          {/* Wiring Connections List */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Wiring Connections</h4>
            {wiringConnections.map((conn, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex-shrink-0"
                    style={{ backgroundColor: conn.wireColor.toLowerCase() }}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {conn.from} → {conn.to}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Wire Color: <span className="font-medium">{conn.wireColor}</span>
                    </div>
                    {conn.notes && (
                      <div className="text-sm text-gray-700 mt-1 italic">{conn.notes}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Build Steps Checklist */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <h3 className="text-xl font-bold text-gray-900">Build Checklist</h3>
        </div>
        <div className="p-6 space-y-4">
          {buildSteps.map((step, stepIdx) => {
            const StepIcon = step.icon;
            const isCompleted = completedSteps.has(stepIdx);

            return (
              <div key={stepIdx} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 p-4 flex items-center justify-between cursor-pointer"
                     onClick={() => setSelectedStep(selectedStep === stepIdx ? -1 : stepIdx)}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isCompleted ? 'bg-green-100' : 'bg-gray-200'}`}>
                      <StepIcon className={`w-6 h-6 ${isCompleted ? 'text-green-600' : 'text-gray-600'}`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{step.title}</h4>
                      <div className="text-sm text-gray-600">{step.tasks.length} tasks</div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStepComplete(stepIdx);
                    }}
                    className="ml-4"
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    ) : (
                      <Circle className="w-8 h-8 text-gray-300" />
                    )}
                  </button>
                </div>

                {selectedStep === stepIdx && (
                  <div className="p-4 border-t border-gray-200">
                    <ul className="space-y-2">
                      {step.tasks.map((task, taskIdx) => (
                        <li key={taskIdx} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded">
                          <input type="checkbox" className="w-4 h-4 mt-0.5 text-orange-600" />
                          <span className="text-gray-700">{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Final Tips */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-lg p-6 text-white">
        <h3 className="text-xl font-bold mb-3">🎉 You're Almost Done!</h3>
        <div className="space-y-2 text-green-100">
          <p>• Test thoroughly before final assembly</p>
          <p>• Take your time with wiring - neatness matters</p>
          <p>• Label the inside of your pedal for future reference</p>
          <p>• Consider adding artwork or decals to the enclosure</p>
          <p>• Most importantly: Have fun and enjoy your creation!</p>
        </div>
      </div>
    </div>
  );
}
