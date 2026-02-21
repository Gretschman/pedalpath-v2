import { useState, useRef } from 'react';
import { Box, Drill, Wrench, Cable, CheckCircle, Circle, AlertTriangle, Printer } from 'lucide-react';
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

interface EnclosureDimensions {
  name: string;
  width: number;  // mm
  height: number; // mm
  depth: number;  // mm
}

const ENCLOSURE_SIZES: Record<string, EnclosureDimensions> = {
  '1590B': { name: '1590B (Small)', width: 112, height: 60, depth: 31 },
  '125B': { name: '125B (Medium)', width: 120, height: 94, depth: 34 },
  '1590BB': { name: '1590BB (Large)', width: 119, height: 94, depth: 56 },
};

export default function EnclosureGuide({ bomData, projectName: _projectName = 'Your Pedal' }: EnclosureGuideProps) {
  const [selectedStep, setSelectedStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [selectedEnclosure, setSelectedEnclosure] = useState<string>(bomData.enclosure?.size || '1590B');
  const printTemplateRef = useRef<HTMLDivElement>(null);

  const enclosureSize = selectedEnclosure;
  const dimensions = ENCLOSURE_SIZES[enclosureSize];

  // Generate drill template based on components with accurate positioning
  // faceHoles = top face of enclosure (pots, footswitch, LED)
  const faceHoles: DrillHole[] = [];
  const pots = bomData.components.filter(c => c.component_type === 'potentiometer');
  const potCount = pots.length;

  // Calculate proper pot spacing based on enclosure width
  const potSpacing = potCount > 1 ? (dimensions.width - 40) / (potCount + 1) : dimensions.width / 2;
  const potYPosition = 19; // 19mm from top edge (standard)

  // Add pots with proper spacing
  pots.forEach((pot, idx) => {
    faceHoles.push({
      id: `pot-${idx}`,
      component: `${pot.value} Pot (${pot.reference_designators.join(', ')})`,
      diameter: '8mm',
      x: 20 + potSpacing * (idx + 1),
      y: potYPosition,
      notes: 'For 16mm pot with mounting nut'
    });
  });

  // Add footswitch (centered horizontally, lower on enclosure)
  if (bomData.components.some(c => c.component_type === 'footswitch')) {
    faceHoles.push({
      id: 'footswitch',
      component: '3PDT Footswitch',
      diameter: '12mm',
      x: dimensions.width / 2,
      y: dimensions.height - 19, // 19mm from bottom
      notes: 'Center of enclosure for true bypass switching'
    });
  }

  // Add LED (centered horizontally, between pots and footswitch)
  if (bomData.components.some(c => c.component_type === 'led')) {
    faceHoles.push({
      id: 'led',
      component: 'LED Indicator',
      diameter: '5mm',
      x: dimensions.width / 2,
      y: dimensions.height / 2,
      notes: 'Above footswitch for visibility'
    });
  }

  // Side-panel holes: jacks go on separate panels, not the top face
  // Side panels are dimensions.height × dimensions.depth (e.g., 60×31 for 1590B)
  // End panel is dimensions.width × dimensions.depth
  const hasInputJack = !!bomData.components.find(c => c.component_type === 'input-jack');
  const hasOutputJack = !!bomData.components.find(c => c.component_type === 'output-jack');
  const hasDCJack = !!bomData.components.find(c => c.component_type === 'dc-jack');

  const sidePanelCenterX = dimensions.height / 2; // centered along side panel width
  const sidePanelCenterY = dimensions.depth / 2;  // centered in panel height (depth)

  const inputSideHole: DrillHole = {
    id: 'input',
    component: 'Input Jack',
    diameter: '9.5mm',
    x: sidePanelCenterX,
    y: sidePanelCenterY,
    notes: 'Centered on left side panel (1/4" mono jack)'
  };
  const outputSideHole: DrillHole = {
    id: 'output',
    component: 'Output Jack',
    diameter: '9.5mm',
    x: sidePanelCenterX,
    y: sidePanelCenterY,
    notes: 'Centered on right side panel (1/4" mono jack)'
  };
  const dcEndHole: DrillHole = {
    id: 'power',
    component: 'DC Power Jack',
    diameter: '7.5mm',
    x: dimensions.width / 2,
    y: dimensions.depth / 2,
    notes: 'Centered on top end panel (2.1mm barrel jack)'
  };

  const allDrillHoles = [
    ...faceHoles,
    ...(hasInputJack ? [inputSideHole] : []),
    ...(hasOutputJack ? [outputSideHole] : []),
    ...(hasDCJack ? [dcEndHole] : []),
  ];

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

  const handlePrint = () => {
    if (printTemplateRef.current) {
      const printWindow = window.open('', '', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Drill Template - ${enclosureSize}</title>
              <style>
                @media print {
                  @page { size: A4; margin: 10mm; }
                  body { margin: 0; padding: 0; }
                }
                body { font-family: Arial, sans-serif; }
              </style>
            </head>
            <body>
              ${printTemplateRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    }
  };

  // Generate SVG drill template — professional engineering drawing style
  const renderDrillTemplate = (
    holes: DrillHole[],
    panelW: number,
    panelH: number,
    _title: string
  ) => {
    // px per mm — 3.7795 ≈ 96 dpi / 25.4 mm/in gives true 1:1 at 96dpi
    const PX_PER_MM = 3.7795;
    const margin = 40; // px margin around enclosure for labels
    const rulerArea = 30; // px below enclosure for calibration ruler

    const encW = panelW * PX_PER_MM;
    const encH = panelH * PX_PER_MM;
    const svgW = encW + margin * 2;
    const svgH = encH + margin * 2 + rulerArea;

    // Convert hole mm coords to SVG coords (offset by margin)
    const toX = (mm: number) => margin + mm * PX_PER_MM;
    const toY = (mm: number) => margin + mm * PX_PER_MM;

    // Assign a short label letter for each hole
    const holeLabels = holes.map((_, i) => String.fromCharCode(65 + i)); // A, B, C…

    return (
      <svg
        width="100%"
        viewBox={`0 0 ${svgW} ${svgH}`}
        style={{ maxWidth: '700px', margin: '0 auto', display: 'block', background: '#ffffff' }}
      >
        {/* ── Background ── */}
        <rect x={0} y={0} width={svgW} height={svgH} fill="#ffffff" />

        {/* ── 10mm grid (light blue — engineering paper style) ── */}
        {Array.from({ length: Math.ceil(panelW / 10) + 1 }).map((_, i) => (
          <line key={`v${i}`}
            x1={toX(i * 10)} y1={margin}
            x2={toX(i * 10)} y2={margin + encH}
            stroke="#dbeafe" strokeWidth="0.5"
          />
        ))}
        {Array.from({ length: Math.ceil(panelH / 10) + 1 }).map((_, i) => (
          <line key={`h${i}`}
            x1={margin} y1={toY(i * 10)}
            x2={margin + encW} y2={toY(i * 10)}
            stroke="#dbeafe" strokeWidth="0.5"
          />
        ))}

        {/* ── Panel outline ── */}
        <rect
          x={margin} y={margin}
          width={encW} height={encH}
          fill="#f8fafc"
          stroke="#1e293b"
          strokeWidth="2"
          rx="3"
        />

        {/* ── Corner registration marks ── */}
        {[
          [margin, margin],
          [margin + encW, margin],
          [margin, margin + encH],
          [margin + encW, margin + encH],
        ].map(([cx, cy], i) => (
          <g key={`corner-${i}`}>
            <line x1={cx - 10} y1={cy} x2={cx + 10} y2={cy} stroke="#64748b" strokeWidth="0.8" />
            <line x1={cx} y1={cy - 10} x2={cx} y2={cy + 10} stroke="#64748b" strokeWidth="0.8" />
          </g>
        ))}

        {/* ── Width dimension line (top) ── */}
        <line x1={margin} y1={margin - 14} x2={margin + encW} y2={margin - 14} stroke="#64748b" strokeWidth="0.8" />
        <line x1={margin} y1={margin - 18} x2={margin} y2={margin - 10} stroke="#64748b" strokeWidth="0.8" />
        <line x1={margin + encW} y1={margin - 18} x2={margin + encW} y2={margin - 10} stroke="#64748b" strokeWidth="0.8" />
        <text x={margin + encW / 2} y={margin - 16} textAnchor="middle" fontSize="9" fill="#374151" fontWeight="bold">
          {panelW}mm
        </text>

        {/* ── Height dimension line (left) ── */}
        <line x1={margin - 14} y1={margin} x2={margin - 14} y2={margin + encH} stroke="#64748b" strokeWidth="0.8" />
        <line x1={margin - 18} y1={margin} x2={margin - 10} y2={margin} stroke="#64748b" strokeWidth="0.8" />
        <line x1={margin - 18} y1={margin + encH} x2={margin - 10} y2={margin + encH} stroke="#64748b" strokeWidth="0.8" />
        <text
          x={margin - 16} y={margin + encH / 2}
          textAnchor="middle" fontSize="9" fill="#374151" fontWeight="bold"
          transform={`rotate(-90 ${margin - 16} ${margin + encH / 2})`}
        >
          {panelH}mm
        </text>

        {/* ── Drill holes ── */}
        {holes.map((hole, i) => {
          const cx = toX(hole.x);
          const cy = toY(hole.y);
          const r = (parseFloat(hole.diameter) / 2) * PX_PER_MM;
          const label = holeLabels[i];
          // Short name to display next to hole (first 2 words)
          const shortName = hole.component.split('(')[0].trim().split(' ').slice(0, 2).join(' ');

          return (
            <g key={hole.id}>
              {/* Full-span crosshair lines (dashed, stop at hole edge) */}
              <line x1={margin} y1={cy} x2={cx - r} y2={cy}
                stroke="#94a3b8" strokeWidth="0.6" strokeDasharray="3,2" />
              <line x1={cx + r} y1={cy} x2={margin + encW} y2={cy}
                stroke="#94a3b8" strokeWidth="0.6" strokeDasharray="3,2" />
              <line x1={cx} y1={margin} x2={cx} y2={cy - r}
                stroke="#94a3b8" strokeWidth="0.6" strokeDasharray="3,2" />
              <line x1={cx} y1={cy + r} x2={cx} y2={margin + encH}
                stroke="#94a3b8" strokeWidth="0.6" strokeDasharray="3,2" />

              {/* Hole circle at true diameter */}
              <circle cx={cx} cy={cy} r={r} fill="white" stroke="#dc2626" strokeWidth="1.5" />

              {/* Center punch mark */}
              <circle cx={cx} cy={cy} r={1.5} fill="#dc2626" />

              {/* Short crosshair inside hole */}
              <line x1={cx - 5} y1={cy} x2={cx + 5} y2={cy} stroke="#dc2626" strokeWidth="0.8" />
              <line x1={cx} y1={cy - 5} x2={cx} y2={cy + 5} stroke="#dc2626" strokeWidth="0.8" />

              {/* Letter badge */}
              <circle cx={cx + r + 8} cy={cy - r / 2} r={7} fill="#dc2626" />
              <text x={cx + r + 8} y={cy - r / 2 + 3.5} textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">
                {label}
              </text>

              {/* Component name label — always visible, below hole */}
              <text x={cx} y={cy + r + 10} textAnchor="middle" fontSize="7" fill="#1e293b" fontWeight="600">
                {shortName}
              </text>
              {/* Diameter label below name */}
              <text x={cx} y={cy + r + 19} textAnchor="middle" fontSize="6" fill="#64748b">
                ⌀{hole.diameter}
              </text>

              {/* X/Y coords at bottom of panel */}
              <text x={cx} y={margin + encH + 12} textAnchor="middle" fontSize="7" fill="#374151">
                {label}: {hole.x},{hole.y}mm
              </text>
            </g>
          );
        })}

        {/* ── Calibration ruler (25mm reference) ── */}
        <g transform={`translate(${margin}, ${margin + encH + rulerArea - 8})`}>
          <line x1={0} y1={0} x2={25 * PX_PER_MM} y2={0} stroke="#dc2626" strokeWidth="1.5" />
          <line x1={0} y1={-4} x2={0} y2={4} stroke="#dc2626" strokeWidth="1.5" />
          <line x1={25 * PX_PER_MM} y1={-4} x2={25 * PX_PER_MM} y2={4} stroke="#dc2626" strokeWidth="1.5" />
          <text x={12.5 * PX_PER_MM} y={-6} textAnchor="middle" fontSize="8" fill="#dc2626" fontWeight="bold">
            ← 25mm calibration →
          </text>
        </g>
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-800 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Enclosure Build Guide</h2>
        <p className="text-orange-100 mb-4">
          LEGO-style assembly instructions for your final pedal build
        </p>

        {/* Enclosure Size Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-orange-100 mb-2">
            Select Enclosure Size:
          </label>
          <select
            value={selectedEnclosure}
            onChange={(e) => setSelectedEnclosure(e.target.value)}
            className="w-full md:w-auto px-4 py-2 rounded-lg bg-orange-700 text-white border-2 border-orange-500 focus:outline-none focus:border-orange-300"
          >
            {Object.entries(ENCLOSURE_SIZES).map(([key, enc]) => (
              <option key={key} value={key}>
                {enc.name} ({enc.width}×{enc.height}mm)
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-orange-700 rounded-lg p-3">
            <div className="text-xs text-orange-200">Dimensions</div>
            <div className="text-lg font-bold">
              {dimensions.width}×{dimensions.height}×{dimensions.depth}mm
            </div>
          </div>
          <div className="bg-orange-700 rounded-lg p-3">
            <div className="text-xs text-orange-200">Holes to Drill</div>
            <div className="text-lg font-bold">{allDrillHoles.length}</div>
          </div>
          <div className="bg-orange-700 rounded-lg p-3">
            <div className="text-xs text-orange-200">Wire Connections</div>
            <div className="text-lg font-bold">{wiringConnections.length}</div>
          </div>
        </div>
      </div>

      {/* Drill Template */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Drill className="w-6 h-6" />
            Drilling Template (1:1 Scale)
          </h3>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print Template
          </button>
        </div>
        <div className="p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-blue-900 mb-2">Drilling Safety & Instructions</h4>
            <ul className="space-y-1 text-blue-800 text-sm">
              <li>• Wear safety glasses and secure enclosure firmly in a vice or clamp</li>
              <li>• Start with pilot holes (2-3mm), step up to final size gradually</li>
              <li>• Use appropriate bits for aluminum (HSS or cobalt)</li>
              <li>• Print template and verify scale with 25mm calibration ruler</li>
              <li>• Tape template to enclosure, center punch each location, then drill</li>
            </ul>
          </div>

          {/* Printable SVG Drill Templates — one per panel */}
          <div ref={printTemplateRef} className="space-y-8 mb-6">
            <div className="text-center text-sm text-gray-600">
              <strong>Drill Templates - {dimensions.name}</strong>
              <div className="text-xs text-gray-500 mt-1">
                Print at 100% scale (no scaling) • Verify with calibration ruler
              </div>
            </div>

            {/* TOP FACE */}
            <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
              <h4 className="font-semibold text-gray-800 mb-3 text-center">
                Top Face — {dimensions.width}×{dimensions.height}mm (pots, footswitch, LED)
              </h4>
              {renderDrillTemplate(faceHoles, dimensions.width, dimensions.height, 'Top Face')}
            </div>

            {/* SIDE PANELS */}
            {(hasInputJack || hasOutputJack) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hasInputJack && (
                  <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
                    <h4 className="font-semibold text-gray-800 mb-3 text-center">
                      Left Side Panel — Input Jack ({dimensions.height}×{dimensions.depth}mm)
                    </h4>
                    {renderDrillTemplate([inputSideHole], dimensions.height, dimensions.depth, 'Left Side')}
                  </div>
                )}
                {hasOutputJack && (
                  <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
                    <h4 className="font-semibold text-gray-800 mb-3 text-center">
                      Right Side Panel — Output Jack ({dimensions.height}×{dimensions.depth}mm)
                    </h4>
                    {renderDrillTemplate([outputSideHole], dimensions.height, dimensions.depth, 'Right Side')}
                  </div>
                )}
              </div>
            )}

            {/* END PANEL for DC */}
            {hasDCJack && (
              <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
                <h4 className="font-semibold text-gray-800 mb-3 text-center">
                  Top End Panel — DC Power Jack ({dimensions.width}×{dimensions.depth}mm)
                </h4>
                {renderDrillTemplate([dcEndHole], dimensions.width, dimensions.depth, 'Top End')}
              </div>
            )}
          </div>

          {/* Drill Hole List grouped by panel */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Drilling Order</h4>

            {faceHoles.length > 0 && (
              <>
                <p className="text-sm font-medium text-gray-700 mt-2">Top Face</p>
                {faceHoles.map((hole, idx) => (
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
              </>
            )}

            {(hasInputJack || hasOutputJack) && (
              <>
                <p className="text-sm font-medium text-gray-700 mt-2">Side Panels</p>
                {hasInputJack && (
                  <div key="input" className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 text-blue-800 font-bold rounded-full w-8 h-8 flex items-center justify-center text-sm">L</div>
                          <div>
                            <h5 className="font-semibold text-gray-900">{inputSideHole.component}</h5>
                            <div className="text-sm text-gray-600 mt-1">
                              Diameter: <span className="font-medium">{inputSideHole.diameter}</span> |
                              Position: <span className="font-medium">X: {inputSideHole.x}mm, Y: {inputSideHole.y}mm</span>
                            </div>
                            {inputSideHole.notes && (
                              <div className="text-sm text-gray-700 mt-2 italic">{inputSideHole.notes}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      <Circle className="w-6 h-6 text-gray-300" />
                    </div>
                  </div>
                )}
                {hasOutputJack && (
                  <div key="output" className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 text-blue-800 font-bold rounded-full w-8 h-8 flex items-center justify-center text-sm">R</div>
                          <div>
                            <h5 className="font-semibold text-gray-900">{outputSideHole.component}</h5>
                            <div className="text-sm text-gray-600 mt-1">
                              Diameter: <span className="font-medium">{outputSideHole.diameter}</span> |
                              Position: <span className="font-medium">X: {outputSideHole.x}mm, Y: {outputSideHole.y}mm</span>
                            </div>
                            {outputSideHole.notes && (
                              <div className="text-sm text-gray-700 mt-2 italic">{outputSideHole.notes}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      <Circle className="w-6 h-6 text-gray-300" />
                    </div>
                  </div>
                )}
              </>
            )}

            {hasDCJack && (
              <>
                <p className="text-sm font-medium text-gray-700 mt-2">End Panel</p>
                <div key="power" className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="bg-yellow-100 text-yellow-800 font-bold rounded-full w-8 h-8 flex items-center justify-center text-sm">DC</div>
                        <div>
                          <h5 className="font-semibold text-gray-900">{dcEndHole.component}</h5>
                          <div className="text-sm text-gray-600 mt-1">
                            Diameter: <span className="font-medium">{dcEndHole.diameter}</span> |
                            Position: <span className="font-medium">X: {dcEndHole.x}mm, Y: {dcEndHole.y}mm</span>
                          </div>
                          {dcEndHole.notes && (
                            <div className="text-sm text-gray-700 mt-2 italic">{dcEndHole.notes}</div>
                          )}
                        </div>
                      </div>
                    </div>
                    <Circle className="w-6 h-6 text-gray-300" />
                  </div>
                </div>
              </>
            )}
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
