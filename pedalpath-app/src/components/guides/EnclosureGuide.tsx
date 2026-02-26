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
  width: number;  // mm (face width)
  height: number; // mm (face height)
  depth: number;  // mm (box depth)
  /** Recommended Y (mm from top) for first row of controls — below top forbidden zone */
  firstDrillY: number;
}

// All standard Hammond/Tayda 1590-series + 125B enclosures.
// Face dimensions are internal working area (mm).
const ENCLOSURE_SIZES: Record<string, EnclosureDimensions> = {
  '1590A':  { name: '1590A (Mini)',     width: 92,    height: 38,   depth: 31,   firstDrillY: 12 },
  '1590B':  { name: '1590B (Standard)', width: 112,   height: 60,   depth: 31,   firstDrillY: 20 },
  '125B':   { name: '125B (Tall)',       width: 62.7,  height: 118,  depth: 34,   firstDrillY: 32 },
  '1590N1': { name: '1590N1 (Tall)',     width: 57.5,  height: 111,  depth: 31,   firstDrillY: 30 },
  '1590BB': { name: '1590BB (Large)',    width: 119,   height: 94,   depth: 56,   firstDrillY: 22 },
  '1590DD': { name: '1590DD (XL)',       width: 190.5, height: 119,  depth: 59,   firstDrillY: 22 },
};

// Forbidden Zones — hardware collision areas per enclosure face.
// Coordinates relative to top-left of enclosure face (mm).
// Source: Enclosure125B (enclosure_logic.py) + standard Tayda layouts.
interface ForbiddenZone {
  label: string;
  yMin: number;
  yMax: number;
  color: string;
}

const FORBIDDEN_ZONES: Record<string, ForbiddenZone[]> = {
  // 1590A: tiny, footswitch dominates bottom ~35%
  '1590A':  [
    { label: 'FOOTSWITCH ZONE', yMin: 24, yMax: 38,  color: '#ef4444' },
  ],
  // 1590B: standard. Footswitch centered at ~50mm from top.
  '1590B':  [
    { label: 'FOOTSWITCH ZONE', yMin: 42, yMax: 60,  color: '#ef4444' },
  ],
  // 125B (tall vertical): jacks/DC at top, footswitch at bottom
  '125B': [
    { label: 'JACKS / DC ZONE',  yMin: 0,   yMax: 25,  color: '#ef4444' },
    { label: 'FOOTSWITCH ZONE',  yMin: 95,  yMax: 118, color: '#ef4444' },
  ],
  // 1590N1 (tall): proportionally similar to 125B
  '1590N1': [
    { label: 'JACKS / DC ZONE',  yMin: 0,   yMax: 22,  color: '#ef4444' },
    { label: 'FOOTSWITCH ZONE',  yMin: 89,  yMax: 111, color: '#ef4444' },
  ],
  // 1590BB: larger box, footswitch near bottom
  '1590BB': [
    { label: 'FOOTSWITCH ZONE',  yMin: 74,  yMax: 94,  color: '#ef4444' },
  ],
  // 1590DD: XL box, footswitch zone near bottom
  '1590DD': [
    { label: 'FOOTSWITCH ZONE',  yMin: 98,  yMax: 119, color: '#ef4444' },
  ],
};

export default function EnclosureGuide({ bomData, projectName: _projectName = 'Your Pedal' }: EnclosureGuideProps) {
  const [selectedStep, setSelectedStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [selectedEnclosure, setSelectedEnclosure] = useState<string>(bomData.enclosure?.size || '1590B');
  const printTemplateRef = useRef<HTMLDivElement>(null);

  const enclosureSize = selectedEnclosure;
  const dimensions = ENCLOSURE_SIZES[enclosureSize];
  const forbiddenZones = FORBIDDEN_ZONES[enclosureSize] ?? [];

  // Generate drill template based on components with accurate positioning
  // faceHoles = top face of enclosure (pots, footswitch, LED)
  const faceHoles: DrillHole[] = [];
  const pots = bomData.components.filter(c => c.component_type === 'potentiometer');
  const potCount = pots.length;

  // Calculate proper pot spacing based on enclosure width.
  // Formula: divide usable width (minus 20mm margins on each side) into (n+1) equal segments.
  // This centers the group for any pot count, including single-pot.
  const potSpacing = (dimensions.width - 40) / (potCount + 1);
  // Use enclosure's firstDrillY so pots always land below any top forbidden zone
  const potYPosition = dimensions.firstDrillY;

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

  // Hardware Collision Detection — flag face holes landing in forbidden zones
  const collisions = faceHoles.filter(hole =>
    forbiddenZones.some(z => hole.y >= z.yMin && hole.y <= z.yMax)
  );

  // Wire color → hex for rendering
  const WIRE_COLOR_HEX: Record<string, string> = {
    green: '#16a34a', blue: '#2563eb', red: '#dc2626', black: '#374151', white: '#f1f5f9',
  };

  // Wiring connections (3PDT standard)
  const wiringConnections: WiringConnection[] = [
    { from: 'Input Jack Tip', to: '3PDT Pin 2', wireColor: 'Green', notes: 'Guitar input signal' },
    { from: '3PDT Pin 5', to: 'Circuit Input', wireColor: 'Green', notes: 'To circuit input pad' },
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
    _title: string,
    zones: ForbiddenZone[] = []
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

        {/* ── Forbidden Zones (hardware collision areas) ── */}
        {zones.map((zone, zi) => {
          const zy = margin + zone.yMin * PX_PER_MM;
          const zh = (zone.yMax - zone.yMin) * PX_PER_MM;
          return (
            <g key={`zone-${zi}`}>
              <rect
                x={margin} y={zy}
                width={encW} height={zh}
                fill="#ef4444" fillOpacity="0.12"
                stroke="#ef4444" strokeWidth="0.8" strokeDasharray="4,3"
              />
              <text
                x={margin + encW / 2} y={zy + zh / 2 + 4}
                textAnchor="middle" fontSize="8" fill="#dc2626" fontWeight="bold"
              >
                ⚠ {zone.label}
              </text>
            </g>
          );
        })}

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

  // Generate SVG offboard wiring diagram — standard true bypass 3PDT
  // Pin layout (solder side): rows top→bottom = [7,8,9] / [4,5,6] / [1,2,3]
  // Wire colours: Green=input, Blue=output, Red=power, Black=ground
  const renderWiringDiagram = () => {
    const svgW = 800, svgH = 500;
    const GAP = 46;

    const swX = 220, swY = 290;
    const pins: Record<number, { x: number; y: number }> = {
      7: { x: swX,           y: swY         }, 8: { x: swX + GAP,     y: swY         }, 9: { x: swX + 2 * GAP, y: swY         },
      4: { x: swX,           y: swY + GAP   }, 5: { x: swX + GAP,     y: swY + GAP   }, 6: { x: swX + 2 * GAP, y: swY + GAP   },
      1: { x: swX,           y: swY + 2*GAP }, 2: { x: swX + GAP,     y: swY + 2*GAP }, 3: { x: swX + 2 * GAP, y: swY + 2*GAP },
    };
    const PIN_FN: Record<number, string> = {
      1: 'OUT', 2: 'IN', 3: 'GND', 4: 'BRD←', 5: '→BRD', 6: 'BYP', 7: 'LED−', 8: 'N/C', 9: 'LED+',
    };

    const INJ = { cx: 72,  cy: 280, tipX: 108, tipY: 255, slvX: 108, slvY: 305 };
    const OUJ = { cx: 728, cy: 280, tipX: 692, tipY: 255, slvX: 692, slvY: 305 };
    const DCJ = { cx: 400, cy: 52,  posX: 378, posY: 78,  negX: 422, negY: 78  };
    const PCB = { x: 490, y: 210, w: 140, h: 100, inX: 506, inY: 233, outX: 506, outY: 278, gnX: 614, gnY: 278, nvX: 614, nvY: 233 };
    const LED = { cx: 395, cy: 162, anX: 377, anY: 178, caX: 413, caY: 178 };
    const GND_Y = 435, GND_X1 = 108, GND_X2 = 760;

    const GREEN = '#16a34a', BLUE = '#2563eb', RED = '#dc2626', BLK = '#374151';
    const ws = (color: string, dashed = false) => ({
      stroke: color, strokeWidth: 2.5, fill: 'none',
      strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
      ...(dashed ? { strokeDasharray: '7,5' } : {}),
    });

    return (
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        style={{ width: '100%', maxWidth: 800, display: 'block', margin: '0 auto', background: '#f8fafc', borderRadius: 8 }}
        aria-label="3PDT True Bypass Offboard Wiring Diagram"
      >
        <rect width={svgW} height={svgH} fill="#f8fafc" />

        {/* ════ WIRES — drawn first so components sit on top ════ */}

        {/* GREEN — Input Tip → Pin 2, Pin 5 → Board IN */}
        <polyline points={`${INJ.tipX},${INJ.tipY} ${INJ.tipX},205 ${pins[2].x},205 ${pins[2].x},${pins[2].y}`} {...ws(GREEN)} />
        <polyline points={`${pins[5].x},${pins[5].y} ${pins[5].x},318 455,318 455,${PCB.inY} ${PCB.inX},${PCB.inY}`} {...ws(GREEN)} />

        {/* BLUE solid — Board OUT → Pin 4, Pin 1 → Output Tip */}
        <polyline points={`${PCB.outX},${PCB.outY} 474,${PCB.outY} 474,350 ${pins[4].x},350 ${pins[4].x},${pins[4].y}`} {...ws(BLUE)} />
        <polyline points={`${pins[1].x},${pins[1].y} ${pins[1].x},405 ${OUJ.tipX},405 ${OUJ.tipX},${OUJ.tipY}`} {...ws(BLUE)} />
        {/* BLUE dashed — Pin 6 → Output Tip (bypass, effect off) */}
        <polyline points={`${pins[6].x},${pins[6].y} ${pins[6].x},418 ${OUJ.tipX + 6},418 ${OUJ.tipX + 6},${OUJ.tipY}`} {...ws(BLUE, true)} />

        {/* RED — DC+ → Board +9V, Pin 9 → LED Anode */}
        <polyline points={`${DCJ.posX},${DCJ.posY} ${DCJ.posX},120 645,120 645,${PCB.nvY} ${PCB.nvX},${PCB.nvY}`} {...ws(RED)} />
        <polyline points={`${pins[9].x},${pins[9].y} ${pins[9].x},190 ${LED.anX},190 ${LED.anX},${LED.anY}`} {...ws(RED)} />

        {/* BLACK — all ground connections */}
        <line x1={INJ.slvX}  y1={INJ.slvY}  x2={INJ.slvX}  y2={GND_Y} {...ws(BLK)} />
        <line x1={OUJ.slvX}  y1={OUJ.slvY}  x2={OUJ.slvX}  y2={GND_Y} {...ws(BLK)} />
        <polyline points={`${DCJ.negX},${DCJ.negY} ${GND_X2},${DCJ.negY} ${GND_X2},${GND_Y}`} {...ws(BLK)} />
        <line x1={LED.caX}   y1={LED.caY}    x2={LED.caX}   y2={GND_Y} {...ws(BLK)} />
        <line x1={PCB.gnX}   y1={PCB.gnY}    x2={PCB.gnX}   y2={GND_Y} {...ws(BLK)} />
        <line x1={pins[3].x} y1={pins[3].y}  x2={pins[3].x} y2={GND_Y} {...ws(BLK)} />

        {/* ── Ground Bus ── */}
        <line x1={GND_X1} y1={GND_Y} x2={GND_X2} y2={GND_Y} stroke={BLK} strokeWidth={4} strokeLinecap="round" />
        {[GND_X1, pins[3].x, LED.caX, PCB.gnX, OUJ.slvX, GND_X2].map((gx, i) => (
          <line key={i} x1={gx} y1={GND_Y} x2={gx} y2={GND_Y + 7} stroke={BLK} strokeWidth={2} />
        ))}
        <text x={(GND_X1 + GND_X2) / 2} y={GND_Y + 18} textAnchor="middle" fontSize={10} fill={BLK} fontWeight="bold" fontFamily="monospace">
          ⏚  GROUND BUS
        </text>

        {/* ════ COMPONENTS — drawn on top of wires ════ */}

        {/* ── Input Jack ── */}
        <circle cx={INJ.cx} cy={INJ.cy} r={36} fill="#e2e8f0" stroke="#475569" strokeWidth={2} />
        <circle cx={INJ.cx} cy={INJ.cy} r={12} fill="#94a3b8" stroke="#475569" strokeWidth={1.5} />
        <text x={INJ.cx} y={INJ.cy - 42} textAnchor="middle" fontSize={11} fill="#0f172a" fontWeight="bold">INPUT</text>
        <text x={INJ.cx} y={INJ.cy - 30} textAnchor="middle" fontSize={9}  fill="#64748b">¼″ jack</text>
        <circle cx={INJ.tipX} cy={INJ.tipY} r={5} fill="#fbbf24" stroke="#78350f" strokeWidth={1.5} />
        <text x={INJ.tipX + 8} y={INJ.tipY + 4} fontSize={9} fill="#0f172a" fontWeight="600">TIP</text>
        <circle cx={INJ.slvX} cy={INJ.slvY} r={5} fill="#94a3b8" stroke="#475569" strokeWidth={1.5} />
        <text x={INJ.slvX + 8} y={INJ.slvY + 4} fontSize={9} fill="#0f172a" fontWeight="600">SLV</text>

        {/* ── Output Jack ── */}
        <circle cx={OUJ.cx} cy={OUJ.cy} r={36} fill="#e2e8f0" stroke="#475569" strokeWidth={2} />
        <circle cx={OUJ.cx} cy={OUJ.cy} r={12} fill="#94a3b8" stroke="#475569" strokeWidth={1.5} />
        <text x={OUJ.cx} y={OUJ.cy - 42} textAnchor="middle" fontSize={11} fill="#0f172a" fontWeight="bold">OUTPUT</text>
        <text x={OUJ.cx} y={OUJ.cy - 30} textAnchor="middle" fontSize={9}  fill="#64748b">¼″ jack</text>
        <circle cx={OUJ.tipX} cy={OUJ.tipY} r={5} fill="#fbbf24" stroke="#78350f" strokeWidth={1.5} />
        <text x={OUJ.tipX - 8} y={OUJ.tipY + 4} textAnchor="end" fontSize={9} fill="#0f172a" fontWeight="600">TIP</text>
        <circle cx={OUJ.slvX} cy={OUJ.slvY} r={5} fill="#94a3b8" stroke="#475569" strokeWidth={1.5} />
        <text x={OUJ.slvX - 8} y={OUJ.slvY + 4} textAnchor="end" fontSize={9} fill="#0f172a" fontWeight="600">SLV</text>

        {/* ── DC Jack ── */}
        <rect x={DCJ.cx - 40} y={DCJ.cy - 28} width={80} height={52} rx={6} fill="#fef3c7" stroke="#d97706" strokeWidth={2} />
        <text x={DCJ.cx} y={DCJ.cy - 10} textAnchor="middle" fontSize={10} fill="#92400e" fontWeight="bold">DC POWER</text>
        <text x={DCJ.cx} y={DCJ.cy + 5}  textAnchor="middle" fontSize={9}  fill="#92400e">2.1mm barrel</text>
        <circle cx={DCJ.posX} cy={DCJ.posY} r={5} fill={RED} stroke="#991b1b" strokeWidth={1.5} />
        <text x={DCJ.posX} y={DCJ.posY + 16} textAnchor="middle" fontSize={10} fill="#991b1b" fontWeight="bold">+</text>
        <circle cx={DCJ.negX} cy={DCJ.negY} r={5} fill={BLK} stroke="#111827" strokeWidth={1.5} />
        <text x={DCJ.negX} y={DCJ.negY + 16} textAnchor="middle" fontSize={10} fill="#111827" fontWeight="bold">−</text>

        {/* ── 3PDT Footswitch ── */}
        <rect x={swX - 42} y={swY - 48} width={164} height={164} rx={8} fill="#1e293b" stroke="#0f172a" strokeWidth={2.5} />
        <text x={swX + 40} y={swY - 30} textAnchor="middle" fontSize={11} fill="#e2e8f0" fontWeight="bold">3PDT</text>
        <text x={swX + 40} y={swY - 17} textAnchor="middle" fontSize={9}  fill="#94a3b8">FOOTSWITCH</text>
        <text x={swX + 40} y={swY - 5}  textAnchor="middle" fontSize={8}  fill="#64748b">solder side</text>
        {[7, 8, 9, 4, 5, 6, 1, 2, 3].map(n => {
          const { x, y } = pins[n];
          return (
            <g key={n}>
              <circle cx={x} cy={y} r={14} fill="#475569" stroke="#334155" strokeWidth={1.5} />
              <text x={x} y={y - 2} textAnchor="middle" fontSize={10} fill="white" fontWeight="bold">{n}</text>
              <text x={x} y={y + 9}  textAnchor="middle" fontSize={7}  fill="#cbd5e1">{PIN_FN[n]}</text>
            </g>
          );
        })}

        {/* ── Circuit Board ── */}
        <rect x={PCB.x} y={PCB.y} width={PCB.w} height={PCB.h} rx={6} fill="#14532d" stroke="#166534" strokeWidth={2} />
        <text x={PCB.x + PCB.w / 2} y={PCB.y + 28} textAnchor="middle" fontSize={12} fill="#bbf7d0" fontWeight="bold">CIRCUIT</text>
        <text x={PCB.x + PCB.w / 2} y={PCB.y + 44} textAnchor="middle" fontSize={10} fill="#86efac">BOARD</text>
        <circle cx={PCB.inX} cy={PCB.inY} r={7} fill={GREEN} stroke="#052e16" strokeWidth={1.5} />
        <text x={PCB.inX} y={PCB.inY - 12} textAnchor="middle" fontSize={9} fill="#bbf7d0" fontWeight="bold">IN</text>
        <circle cx={PCB.outX} cy={PCB.outY} r={7} fill={BLUE}  stroke="#1e1b4b" strokeWidth={1.5} />
        <text x={PCB.outX} y={PCB.outY + 18} textAnchor="middle" fontSize={9} fill="#bbf7d0" fontWeight="bold">OUT</text>
        <circle cx={PCB.gnX}  cy={PCB.gnY}  r={7} fill={BLK}   stroke="#111827" strokeWidth={1.5} />
        <text x={PCB.gnX} y={PCB.gnY + 18} textAnchor="middle" fontSize={9} fill="#bbf7d0" fontWeight="bold">GND</text>
        <circle cx={PCB.nvX}  cy={PCB.nvY}  r={7} fill={RED}   stroke="#450a0a" strokeWidth={1.5} />
        <text x={PCB.nvX} y={PCB.nvY - 12} textAnchor="middle" fontSize={9} fill="#bbf7d0" fontWeight="bold">+9V</text>

        {/* ── LED ── */}
        <polygon points={`${LED.cx},${LED.cy - 20} ${LED.cx - 15},${LED.cy + 8} ${LED.cx + 15},${LED.cy + 8}`} fill="#fde68a" stroke="#d97706" strokeWidth={2} />
        <line x1={LED.cx - 15} y1={LED.cy + 8} x2={LED.cx + 15} y2={LED.cy + 8} stroke="#d97706" strokeWidth={2} />
        <text x={LED.cx} y={LED.cy - 26} textAnchor="middle" fontSize={10} fill="#92400e" fontWeight="bold">LED</text>
        <circle cx={LED.anX} cy={LED.anY} r={5} fill={RED} stroke="#991b1b" strokeWidth={1.5} />
        <text x={LED.anX - 8} y={LED.anY + 4} textAnchor="end" fontSize={9} fill="#991b1b" fontWeight="bold">+</text>
        <circle cx={LED.caX} cy={LED.caY} r={5} fill={BLK} stroke="#111827" strokeWidth={1.5} />
        <text x={LED.caX + 8} y={LED.caY + 4} fontSize={9} fill="#111827" fontWeight="bold">−</text>
        <text x={LED.caX + 18} y={LED.caY + 4} fontSize={8} fill="#6b7280" fontStyle="italic">CLR</text>

        {/* ── Bypass label ── */}
        <text x={(pins[6].x + OUJ.tipX) / 2} y={425} textAnchor="middle" fontSize={9} fill={BLUE} fontStyle="italic" opacity={0.85}>
          bypass (effect off)
        </text>

        {/* ── Wire colour legend ── */}
        <rect x={492} y={328} width={162} height={92} rx={6} fill="white" stroke="#e2e8f0" strokeWidth={1.5} />
        <text x={573} y={346} textAnchor="middle" fontSize={10} fill="#374151" fontWeight="bold">WIRE COLORS</text>
        {[
          { color: GREEN, label: 'Green — Input signal' },
          { color: BLUE,  label: 'Blue — Output signal' },
          { color: RED,   label: 'Red — Power (+9V)'    },
          { color: BLK,   label: 'Black — Ground'       },
        ].map((item, i) => (
          <g key={i} transform={`translate(502, ${358 + i * 15})`}>
            <line x1={0} y1={5} x2={18} y2={5} stroke={item.color} strokeWidth={2.5} strokeLinecap="round" />
            <text x={24} y={9} fontSize={9} fill="#374151">{item.label}</text>
          </g>
        ))}
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

      {/* Hardware Collision Warning */}
      {collisions.length > 0 && (
        <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-red-900">Hardware Collision Detected</h4>
            <p className="text-red-800 text-sm mt-1">
              The following components are placed in forbidden zones and will conflict with
              enclosure hardware (jacks, DC connector, or footswitch):
            </p>
            <ul className="mt-2 space-y-1">
              {collisions.map(h => {
                const zone = forbiddenZones.find(z => h.y >= z.yMin && h.y <= z.yMax);
                return (
                  <li key={h.id} className="text-sm text-red-800 font-medium">
                    • {h.component} at Y={h.y}mm — conflicts with {zone?.label}
                  </li>
                );
              })}
            </ul>
            <p className="text-red-700 text-xs mt-2">
              Move these components to Y: 25mm–95mm (the safe working area).
            </p>
          </div>
        </div>
      )}

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
              {faceHoles.length === 0 ? (
                <div className="text-center text-gray-500 py-8 text-sm">
                  <p className="font-medium mb-1">No face components detected in BOM</p>
                  <p>Pots, footswitches, and LEDs will appear here once identified in the schematic analysis.</p>
                  <p className="mt-2 text-xs text-gray-400">
                    Typical 125B layout: 3 pots across top (30/60/90mm), footswitch centered at 70mm from top, LED at 48mm.
                  </p>
                </div>
              ) : (
                renderDrillTemplate(faceHoles, dimensions.width, dimensions.height, 'Top Face', forbiddenZones)
              )}
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

          {/* 3PDT Diagram — SVG */}
          <div className="mb-6">
            {renderWiringDiagram()}
          </div>

          {/* Wiring Connections List */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Wiring Connections</h4>
            {wiringConnections.map((conn, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex-shrink-0"
                    style={{ backgroundColor: WIRE_COLOR_HEX[conn.wireColor.toLowerCase()] ?? conn.wireColor.toLowerCase() }}
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
