import { useState } from 'react';
import { Grid, Scissors, Zap, CheckCircle, Info } from 'lucide-react';
import type { BOMData } from '../../types/bom.types';

interface StripboardGuideProps {
  bomData: BOMData;
  projectName?: string;
}

interface StripboardPlacement {
  component: string;
  coordinates: string;
  orientation: string;
  notes?: string;
}

interface TrackCut {
  location: string;
  reason: string;
}

export default function StripboardGuide({ bomData, projectName = 'Your Pedal' }: StripboardGuideProps) {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'placement' | 'cuts' | 'wiring'>('overview');

  // Estimate board size based on component count
  const componentCount = bomData.components.reduce((sum, c) => sum + c.quantity, 0);
  const estimatedBoardSize = componentCount < 15 ? '24x5 strips' : componentCount < 30 ? '36x12 strips' : '48x15 strips';

  // Generate example placements (in a real implementation, this would be calculated)
  const placements: StripboardPlacement[] = [
    ...bomData.components
      .filter(c => ['ic', 'op-amp'].includes(c.component_type))
      .map((c, idx) => ({
        component: `${c.value} (${c.reference_designators.join(', ')})`,
        coordinates: `Rows 5-${5 + 7}, Columns ${3 + idx * 5}-${6 + idx * 5}`,
        orientation: 'Straddle center gap',
        notes: 'Pin 1 to left, notch/dot indicates pin 1'
      })),
    ...bomData.components
      .filter(c => c.component_type === 'transistor')
      .map((c, idx) => ({
        component: `${c.value} (${c.reference_designators.join(', ')})`,
        coordinates: `Row ${8 + idx * 3}, Columns ${10 + idx * 2}-${12 + idx * 2}`,
        orientation: 'Flat side facing reference direction',
        notes: 'Check pinout: E-B-C or C-B-E depending on type'
      }))
  ];

  // Example track cuts
  const trackCuts: TrackCut[] = [
    { location: 'Row 5, between columns 4-5', reason: 'Isolate IC pin 1 from pin 14' },
    { location: 'Row 8, between columns 4-5', reason: 'Isolate IC pin 4 from pin 11' },
    { location: 'Row 10, between columns 6-7', reason: 'Create separate power rail' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Stripboard/Veroboard Build Guide</h2>
        <p className="text-purple-100 mb-4">
          Transfer your working breadboard prototype to stripboard for a permanent build
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-purple-700 rounded-lg p-3">
            <div className="text-xs text-purple-200">Estimated Board Size</div>
            <div className="text-lg font-bold">{estimatedBoardSize}</div>
          </div>
          <div className="bg-purple-700 rounded-lg p-3">
            <div className="text-xs text-purple-200">Total Components</div>
            <div className="text-lg font-bold">{componentCount}</div>
          </div>
          <div className="bg-purple-700 rounded-lg p-3">
            <div className="text-xs text-purple-200">Track Cuts Needed</div>
            <div className="text-lg font-bold">~{trackCuts.length}</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setSelectedTab('overview')}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              selectedTab === 'overview'
                ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Info className="w-5 h-5 inline-block mr-2" />
            Overview
          </button>
          <button
            onClick={() => setSelectedTab('placement')}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              selectedTab === 'placement'
                ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Grid className="w-5 h-5 inline-block mr-2" />
            Component Placement
          </button>
          <button
            onClick={() => setSelectedTab('cuts')}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              selectedTab === 'cuts'
                ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Scissors className="w-5 h-5 inline-block mr-2" />
            Track Cuts
          </button>
          <button
            onClick={() => setSelectedTab('wiring')}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              selectedTab === 'wiring'
                ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Zap className="w-5 h-5 inline-block mr-2" />
            Wire Links
          </button>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {selectedTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">What is Stripboard?</h3>
                <p className="text-gray-700 mb-4">
                  Stripboard (also called veroboard) is a prototyping board with parallel copper strips running along one side.
                  Components are placed on the non-copper side, with leads pushed through holes and soldered on the copper side.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Before You Start</h4>
                <ul className="space-y-2 text-blue-800 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Ensure your breadboard prototype is working perfectly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Take photos of your breadboard from multiple angles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Gather tools: soldering iron, solder, wire cutters, 3mm drill bit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Plan component layout on paper first</span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Stripboard Basics</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-2">Coordinate System</h5>
                    <p className="text-sm text-gray-700">
                      Holes are organized in rows (horizontal) and columns (vertical).
                      Standard stripboard has 0.1" (2.54mm) spacing between holes.
                    </p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-2">Copper Strips</h5>
                    <p className="text-sm text-gray-700">
                      Copper runs in strips along the length of the board.
                      All holes in a strip are electrically connected.
                    </p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-2">Track Cuts</h5>
                    <p className="text-sm text-gray-700">
                      Use a 3mm drill bit to cut copper strips and isolate connections.
                      This is essential for proper circuit operation.
                    </p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-2">Wire Links</h5>
                    <p className="text-sm text-gray-700">
                      Use bare or insulated wire to create connections that cross strips.
                      These replace breadboard jumper wires.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-2">Pro Tips</h4>
                <ul className="space-y-2 text-yellow-800 text-sm">
                  <li>• Start with larger components (ICs, transistors) and work towards smaller ones</li>
                  <li>• Make all track cuts BEFORE soldering any components</li>
                  <li>• Test continuity with a multimeter after making cuts</li>
                  <li>• Keep component leads as short as possible but don't trim until soldered</li>
                  <li>• Use different colored wires for power, ground, and signal for easy troubleshooting</li>
                </ul>
              </div>
            </div>
          )}

          {/* Component Placement Tab */}
          {selectedTab === 'placement' && (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                <p className="text-purple-900 text-sm">
                  <strong>Note:</strong> This is a general placement guide. Refer to your working breadboard prototype
                  for the exact layout. In a future version, we'll provide visual stripboard layouts.
                </p>
              </div>

              <div className="space-y-3">
                {placements.length > 0 ? (
                  placements.map((placement, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{placement.component}</h4>
                          <div className="text-sm text-gray-600 mt-1">
                            <strong>Location:</strong> {placement.coordinates}
                          </div>
                          <div className="text-sm text-gray-600">
                            <strong>Orientation:</strong> {placement.orientation}
                          </div>
                          {placement.notes && (
                            <div className="text-sm text-blue-700 mt-2 bg-blue-50 p-2 rounded">
                              {placement.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Grid className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Component placement guide will be generated based on your specific circuit.</p>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
                <h4 className="font-semibold text-gray-900 mb-3">Passive Components</h4>
                <p className="text-sm text-gray-700 mb-3">
                  Resistors and non-polarized capacitors can be placed in any orientation.
                  Plan their positions to minimize wire links.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  {bomData.components
                    .filter(c => ['resistor', 'capacitor'].includes(c.component_type))
                    .slice(0, 6)
                    .map((c, idx) => (
                      <div key={idx} className="bg-white p-2 rounded border border-gray-200">
                        {c.reference_designators.join(', ')}: {c.value}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Track Cuts Tab */}
          {selectedTab === 'cuts' && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-900 mb-2">IMPORTANT: Make ALL Cuts Before Soldering</h4>
                <p className="text-red-800 text-sm">
                  Track cuts must be made before any soldering. Use a 3mm drill bit or specialized track cutter.
                  Verify each cut with a multimeter to ensure the strip is actually broken.
                </p>
              </div>

              <div className="space-y-3">
                {trackCuts.map((cut, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-red-100 rounded-full p-2">
                        <Scissors className="w-5 h-5 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">Cut #{idx + 1}</h4>
                        <div className="text-sm text-gray-700 mt-1">
                          <strong>Location:</strong> {cut.location}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          <strong>Reason:</strong> {cut.reason}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <h4 className="font-semibold text-blue-900 mb-2">How to Make Track Cuts</h4>
                <ol className="space-y-2 text-blue-800 text-sm list-decimal list-inside">
                  <li>Mark cut locations with a marker on the copper side</li>
                  <li>Use a 3mm drill bit by hand (twist slowly) or specialized cutter</li>
                  <li>Remove only enough copper to break the connection - don't drill through the board</li>
                  <li>Clean away copper burrs with a blade or sandpaper</li>
                  <li>Test with multimeter: resistance should be infinite between cut sections</li>
                  <li>Mark completed cuts with permanent marker</li>
                </ol>
              </div>
            </div>
          )}

          {/* Wire Links Tab */}
          {selectedTab === 'wiring' && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-900 text-sm">
                  Wire links connect points that aren't on the same copper strip.
                  These replace the jumper wires from your breadboard prototype.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Wire Types</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-2">Bare Wire Links</h5>
                    <p className="text-sm text-gray-700">
                      Use bare tinned copper wire for short connections on the component side.
                      22AWG solid core works well.
                    </p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-2">Insulated Wire</h5>
                    <p className="text-sm text-gray-700">
                      Use insulated hookup wire for longer connections or when wires must cross.
                      Color code: Red = +V, Black = Ground, Others = Signal.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-2">Wiring Best Practices</h4>
                <ul className="space-y-2 text-yellow-800 text-sm">
                  <li>• Install wire links after components but before off-board wiring</li>
                  <li>• Keep wires as short and neat as possible</li>
                  <li>• Route wires to avoid crossing high-impedance signal paths</li>
                  <li>• Use different colors for power, ground, and signal</li>
                  <li>• Test continuity of each wire link after soldering</li>
                  <li>• Label or document complex wire connections</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Common Wire Links</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-red-600"></div>
                    <span className="text-gray-700">Power rail connections (+9V)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-black"></div>
                    <span className="text-gray-700">Ground rail connections</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-blue-600"></div>
                    <span className="text-gray-700">Signal paths between stages</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-green-600"></div>
                    <span className="text-gray-700">Control (pot) connections</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Build Checklist</h3>
        <div className="space-y-2">
          {[
            'Cut stripboard to size',
            'Mark component positions on paper/board',
            'Make all track cuts',
            'Test cuts with multimeter',
            'Place and solder ICs/transistors',
            'Add passive components (resistors, capacitors)',
            'Add wire links',
            'Test continuity of all connections',
            'Connect off-board components (pots, jacks, switch)',
            'Final testing before boxing'
          ].map((item, idx) => (
            <label key={idx} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
              <input type="checkbox" className="w-4 h-4 text-purple-600" />
              <span className="text-gray-700">{item}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
