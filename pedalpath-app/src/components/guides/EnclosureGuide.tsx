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

  // Generate SVG offboard wiring diagram — BOM-driven, generalised
  // Layout: PCB center · Input jack left · Output jack right
  //         DC jack top (active only) · 3PDT lower-left (if footswitch in BOM)
  //         Pots + switches shown as labeled boxes above PCB with wires to board pads
  const renderWiringDiagram = () => {
    const GREEN = '#16a34a', BLUE = '#2563eb', RED = '#dc2626', BLK = '#374151';
    const ws = (color: string, dashed = false) => ({
      stroke: color, strokeWidth: 2.5, fill: 'none',
      strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
      ...(dashed ? { strokeDasharray: '7,5' } : {}),
    });

    // ── Detect what's actually in the BOM ──
    const hasFootswitch = bomData.components.some(c => c.component_type === 'footswitch');
    const hasDC         = bomData.components.some(c => c.component_type === 'dc-jack') || !!bomData.power;
    const hasLED        = bomData.components.some(c => c.component_type === 'led');
    const pots          = bomData.components.filter(c => c.component_type === 'potentiometer');
    const switches      = bomData.components.filter(c => c.component_type === 'switch');
    const accessories   = [
      ...pots.map((p, i) => ({
        type: 'pot' as const,
        ref:   (p.reference_designators as string[] | undefined)?.[0] ?? `P${i + 1}`,
        value: p.value ?? '',
      })),
      ...switches.map((s, i) => ({
        type: 'sw' as const,
        ref:   (s.reference_designators as string[] | undefined)?.[0] ?? `SW${i + 1}`,
        value: s.value ?? '',
      })),
    ];
    const accCount = accessories.length;

    // ── Canvas sizing ──
    const W          = 960;
    const topMargin  = hasDC ? 120 : (accCount > 0 ? 100 : 50);
    const H          = topMargin + (hasFootswitch ? 470 : 390);
    const GND_Y      = H - 55;

    // ── PCB — always center ──
    const pcbW = 220, pcbH = 130;
    const pcbX = (W - pcbW) / 2;        // 370
    const pcbY = topMargin + (accCount > 0 ? 95 : 45);
    const PCB = {
      x: pcbX, y: pcbY, w: pcbW, h: pcbH,
      cx:   pcbX + pcbW / 2,
      inX:  pcbX + 20,        inY:  pcbY + 65,
      outX: pcbX + pcbW - 20, outY: pcbY + 65,
      gndX: pcbX + pcbW - 20, gndY: pcbY + 108,
      vccX: pcbX + 20,        vccY: pcbY + 22,
    };

    // ── Jacks — vertically aligned with PCB mid ──
    const jackCY = pcbY + pcbH / 2;
    const INJ = { cx: 75,  cy: jackCY, tipX: 124, tipY: jackCY - 22, slvX: 124, slvY: jackCY + 22 };
    const OUJ = { cx: 885, cy: jackCY, tipX: 836, tipY: jackCY - 22, slvX: 836, slvY: jackCY + 22 };

    // ── Accessories (pots + switches) centered above PCB ──
    const accBoxW = 78, accBoxH = 50;
    const accRowY  = topMargin + 34;
    const accGap   = 14;
    const accTotalW = accCount * accBoxW + Math.max(0, accCount - 1) * accGap;
    const accStartX = pcbX + (pcbW - accTotalW) / 2;

    // Per-accessory PCB pad x — spread evenly across PCB top edge
    const pcbPadXFor = (i: number) =>
      accCount === 1
        ? pcbX + pcbW / 2
        : pcbX + 30 + i * (pcbW - 60) / (accCount - 1);

    // ── 3PDT Footswitch ──
    const GAP  = 46;
    const sw3X = 192, sw3Y = pcbY + 20;
    const p3: Record<number, { x: number; y: number }> = {
      7: { x: sw3X,         y: sw3Y         }, 8: { x: sw3X + GAP,     y: sw3Y         }, 9: { x: sw3X + 2 * GAP, y: sw3Y         },
      4: { x: sw3X,         y: sw3Y + GAP   }, 5: { x: sw3X + GAP,     y: sw3Y + GAP   }, 6: { x: sw3X + 2 * GAP, y: sw3Y + GAP   },
      1: { x: sw3X,         y: sw3Y + 2*GAP }, 2: { x: sw3X + GAP,     y: sw3Y + 2*GAP }, 3: { x: sw3X + 2 * GAP, y: sw3Y + 2*GAP },
    };
    const PIN_FN: Record<number, string> = {
      1: 'OUT', 2: 'IN', 3: 'GND', 4: 'BRD←', 5: '→BRD', 6: 'BYP', 7: 'LED−', 8: 'N/C', 9: 'LED+',
    };

    // ── DC Jack ──
    const DCcx = W / 2, DCcy = 52;

    // ── LED ──
    const LEDcx = hasFootswitch ? sw3X + GAP : 210;
    const LEDcy = pcbY - 58;

    // ── Legend ──
    const legendItems = [
      { color: GREEN, label: 'Green — Input signal' },
      { color: BLUE,  label: 'Blue — Output signal' },
      ...(hasDC ? [{ color: RED, label: 'Red — Power (+9V)' }] : []),
      { color: BLK,   label: 'Black — Ground' },
    ];

    return (
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', display: 'block', margin: '0 auto', background: '#f8fafc', borderRadius: 8 }}
        aria-label="Offboard Wiring Diagram"
      >
        <rect width={W} height={H} fill="#f8fafc" />

        {/* ══════════ WIRES (drawn behind components) ══════════ */}

        {/* Input signal: Jack TIP → [3PDT P2 →P5 →] PCB IN */}
        {hasFootswitch ? (
          <>
            <polyline points={`${INJ.tipX},${INJ.tipY} ${INJ.tipX},${sw3Y - 28} ${p3[2].x},${sw3Y - 28} ${p3[2].x},${p3[2].y}`} {...ws(GREEN)} />
            <polyline points={`${p3[5].x},${p3[5].y} ${p3[5].x},${PCB.inY} ${PCB.inX},${PCB.inY}`} {...ws(GREEN)} />
          </>
        ) : (
          <polyline points={`${INJ.tipX},${INJ.tipY} ${PCB.inX},${INJ.tipY} ${PCB.inX},${PCB.inY}`} {...ws(GREEN)} />
        )}

        {/* Output signal: PCB OUT → [3PDT P4 / P1] → Jack TIP  +  bypass dashed */}
        {hasFootswitch ? (
          <>
            <polyline points={`${PCB.outX},${PCB.outY} ${PCB.outX + 38},${PCB.outY} ${PCB.outX + 38},${p3[4].y} ${p3[4].x},${p3[4].y}`} {...ws(BLUE)} />
            <polyline points={`${p3[1].x},${p3[1].y} ${p3[1].x},${GND_Y - 42} ${OUJ.tipX},${GND_Y - 42} ${OUJ.tipX},${OUJ.tipY}`} {...ws(BLUE)} />
            <polyline points={`${p3[6].x},${p3[6].y} ${p3[6].x},${GND_Y - 28} ${OUJ.tipX + 9},${GND_Y - 28} ${OUJ.tipX + 9},${OUJ.tipY}`} {...ws(BLUE, true)} />
          </>
        ) : (
          <polyline points={`${PCB.outX},${PCB.outY} ${OUJ.tipX},${PCB.outY} ${OUJ.tipX},${OUJ.tipY}`} {...ws(BLUE)} />
        )}

        {/* Power: DC+ → PCB +9V  (active only) */}
        {hasDC && (
          <polyline points={`${DCcx - 24},${DCcy + 30} ${DCcx - 24},${PCB.vccY} ${PCB.vccX},${PCB.vccY}`} {...ws(RED)} />
        )}
        {/* Power: 3PDT P9 → LED anode  (LED present) */}
        {hasLED && hasFootswitch && (
          <polyline points={`${p3[9].x},${p3[9].y} ${p3[9].x},${LEDcy + 14} ${LEDcx + 15},${LEDcy + 14}`} {...ws(RED)} />
        )}

        {/* Ground: all → GND bus */}
        <line x1={INJ.slvX} y1={INJ.slvY} x2={INJ.slvX} y2={GND_Y} {...ws(BLK)} />
        <line x1={OUJ.slvX} y1={OUJ.slvY} x2={OUJ.slvX} y2={GND_Y} {...ws(BLK)} />
        <line x1={PCB.gndX} y1={PCB.gndY} x2={PCB.gndX} y2={GND_Y} {...ws(BLK)} />
        {hasDC && <polyline points={`${DCcx + 24},${DCcy + 30} ${W - 80},${DCcy + 30} ${W - 80},${GND_Y}`} {...ws(BLK)} />}
        {hasFootswitch && <line x1={p3[3].x} y1={p3[3].y} x2={p3[3].x} y2={GND_Y} {...ws(BLK)} />}
        {hasLED && <line x1={LEDcx} y1={LEDcy + 24} x2={LEDcx} y2={GND_Y} {...ws(BLK)} />}

        {/* Accessories → PCB: wiper wire (colored) + ground wire (black for pots) */}
        {accessories.map((acc, i) => {
          const boxCX  = accStartX + i * (accBoxW + accGap) + accBoxW / 2;
          const padX   = pcbPadXFor(i);
          const color  = acc.type === 'pot' ? '#7c3aed' : '#b45309';
          return (
            <g key={`wire-${acc.ref}`}>
              <polyline
                points={`${boxCX},${accRowY + accBoxH / 2} ${boxCX},${pcbY - 18} ${padX},${pcbY - 18} ${padX},${pcbY}`}
                stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round"
              />
              {acc.type === 'pot' && (
                <line x1={boxCX - 16} y1={accRowY + accBoxH / 2} x2={boxCX - 16} y2={GND_Y} {...ws(BLK)} />
              )}
            </g>
          );
        })}

        {/* ── Ground Bus ── */}
        <line x1={60} y1={GND_Y} x2={W - 60} y2={GND_Y} stroke={BLK} strokeWidth={5} strokeLinecap="round" />
        <text x={W / 2} y={GND_Y + 20} textAnchor="middle" fontSize={11} fill={BLK} fontWeight="bold" fontFamily="monospace">
          ⏚  GROUND BUS
        </text>

        {/* ══════════ COMPONENTS (in front of wires) ══════════ */}

        {/* Input Jack */}
        <circle cx={INJ.cx} cy={INJ.cy} r={42} fill="#e2e8f0" stroke="#475569" strokeWidth={2.5} />
        <circle cx={INJ.cx} cy={INJ.cy} r={14} fill="#94a3b8" stroke="#475569" strokeWidth={1.5} />
        <text x={INJ.cx} y={INJ.cy - 50} textAnchor="middle" fontSize={12} fill="#0f172a" fontWeight="bold">INPUT</text>
        <text x={INJ.cx} y={INJ.cy - 36} textAnchor="middle" fontSize={10} fill="#64748b">¼″ jack</text>
        <circle cx={INJ.tipX} cy={INJ.tipY} r={7} fill="#fbbf24" stroke="#78350f" strokeWidth={1.5} />
        <text x={INJ.tipX + 11} y={INJ.tipY + 4} fontSize={10} fill="#0f172a" fontWeight="600">TIP</text>
        <circle cx={INJ.slvX} cy={INJ.slvY} r={7} fill="#94a3b8" stroke="#475569" strokeWidth={1.5} />
        <text x={INJ.slvX + 11} y={INJ.slvY + 4} fontSize={10} fill="#0f172a" fontWeight="600">SLV</text>

        {/* Output Jack */}
        <circle cx={OUJ.cx} cy={OUJ.cy} r={42} fill="#e2e8f0" stroke="#475569" strokeWidth={2.5} />
        <circle cx={OUJ.cx} cy={OUJ.cy} r={14} fill="#94a3b8" stroke="#475569" strokeWidth={1.5} />
        <text x={OUJ.cx} y={OUJ.cy - 50} textAnchor="middle" fontSize={12} fill="#0f172a" fontWeight="bold">OUTPUT</text>
        <text x={OUJ.cx} y={OUJ.cy - 36} textAnchor="middle" fontSize={10} fill="#64748b">¼″ jack</text>
        <circle cx={OUJ.tipX} cy={OUJ.tipY} r={7} fill="#fbbf24" stroke="#78350f" strokeWidth={1.5} />
        <text x={OUJ.tipX - 11} y={OUJ.tipY + 4} textAnchor="end" fontSize={10} fill="#0f172a" fontWeight="600">TIP</text>
        <circle cx={OUJ.slvX} cy={OUJ.slvY} r={7} fill="#94a3b8" stroke="#475569" strokeWidth={1.5} />
        <text x={OUJ.slvX - 11} y={OUJ.slvY + 4} textAnchor="end" fontSize={10} fill="#0f172a" fontWeight="600">SLV</text>

        {/* DC Jack (active only) */}
        {hasDC && (
          <g>
            <rect x={DCcx - 58} y={DCcy - 36} width={116} height={66} rx={7} fill="#fef3c7" stroke="#d97706" strokeWidth={2} />
            <text x={DCcx} y={DCcy - 14} textAnchor="middle" fontSize={12} fill="#92400e" fontWeight="bold">DC POWER</text>
            <text x={DCcx} y={DCcy + 4}  textAnchor="middle" fontSize={10} fill="#92400e">2.1mm barrel</text>
            <circle cx={DCcx - 24} cy={DCcy + 30} r={7} fill={RED}  stroke="#991b1b" strokeWidth={1.5} />
            <text x={DCcx - 36} y={DCcy + 34} textAnchor="end" fontSize={13} fill="#991b1b" fontWeight="bold">+</text>
            <circle cx={DCcx + 24} cy={DCcy + 30} r={7} fill={BLK}  stroke="#111827" strokeWidth={1.5} />
            <text x={DCcx + 36} y={DCcy + 34} fontSize={13} fill="#111827" fontWeight="bold">−</text>
          </g>
        )}

        {/* 3PDT Footswitch (if in BOM) */}
        {hasFootswitch && (
          <g>
            <rect x={sw3X - 54} y={sw3Y - 54} width={200} height={208} rx={8} fill="#1e293b" stroke="#0f172a" strokeWidth={2.5} />
            <text x={sw3X + 46} y={sw3Y - 35} textAnchor="middle" fontSize={13} fill="#e2e8f0" fontWeight="bold">3PDT</text>
            <text x={sw3X + 46} y={sw3Y - 20} textAnchor="middle" fontSize={10} fill="#94a3b8">FOOTSWITCH</text>
            <text x={sw3X + 46} y={sw3Y - 7}  textAnchor="middle" fontSize={8}  fill="#64748b">solder side</text>
            {([7, 8, 9, 4, 5, 6, 1, 2, 3] as const).map(n => {
              const { x, y } = p3[n];
              return (
                <g key={n}>
                  <circle cx={x} cy={y} r={17} fill="#475569" stroke="#334155" strokeWidth={1.5} />
                  <text x={x} y={y - 2}  textAnchor="middle" fontSize={11} fill="white"    fontWeight="bold">{n}</text>
                  <text x={x} y={y + 11} textAnchor="middle" fontSize={7}  fill="#cbd5e1">{PIN_FN[n]}</text>
                </g>
              );
            })}
          </g>
        )}

        {/* Circuit Board — always */}
        <rect x={PCB.x} y={PCB.y} width={PCB.w} height={PCB.h} rx={8} fill="#14532d" stroke="#166534" strokeWidth={2.5} />
        <text x={PCB.cx} y={PCB.y + 38} textAnchor="middle" fontSize={13} fill="#bbf7d0" fontWeight="bold">CIRCUIT BOARD</text>
        <text x={PCB.cx} y={PCB.y + 54} textAnchor="middle" fontSize={9}  fill="#86efac">PCB / Stripboard / Veroboard</text>
        {/* IN pad */}
        <circle cx={PCB.inX}  cy={PCB.inY}  r={9} fill={GREEN} stroke="#052e16" strokeWidth={1.5} />
        <text x={PCB.inX}  y={PCB.inY - 14}  textAnchor="middle" fontSize={9} fill="#bbf7d0" fontWeight="bold">IN</text>
        {/* OUT pad */}
        <circle cx={PCB.outX} cy={PCB.outY} r={9} fill={BLUE}  stroke="#1e1b4b" strokeWidth={1.5} />
        <text x={PCB.outX} y={PCB.outY - 14} textAnchor="middle" fontSize={9} fill="#bbf7d0" fontWeight="bold">OUT</text>
        {/* GND pad */}
        <circle cx={PCB.gndX} cy={PCB.gndY} r={9} fill={BLK}   stroke="#111827" strokeWidth={1.5} />
        <text x={PCB.gndX} y={PCB.gndY + 20} textAnchor="middle" fontSize={9} fill="#bbf7d0" fontWeight="bold">GND</text>
        {/* +9V pad (active only) */}
        {hasDC && (
          <>
            <circle cx={PCB.vccX} cy={PCB.vccY} r={9} fill={RED} stroke="#450a0a" strokeWidth={1.5} />
            <text x={PCB.vccX} y={PCB.vccY - 14} textAnchor="middle" fontSize={9} fill="#bbf7d0" fontWeight="bold">+9V</text>
          </>
        )}
        {/* Accessory pads on PCB top edge */}
        {accessories.map((acc, i) => {
          const padX  = pcbPadXFor(i);
          const color = acc.type === 'pot' ? '#7c3aed' : '#b45309';
          return (
            <g key={`pad-${acc.ref}`}>
              <circle cx={padX} cy={PCB.y} r={7} fill={color} stroke="white" strokeWidth={1.5} />
              <text x={padX} y={PCB.y - 12} textAnchor="middle" fontSize={8} fill={color} fontWeight="bold">{acc.ref}</text>
            </g>
          );
        })}

        {/* LED (if in BOM) */}
        {hasLED && (
          <g>
            <polygon points={`${LEDcx},${LEDcy - 20} ${LEDcx - 15},${LEDcy + 12} ${LEDcx + 15},${LEDcy + 12}`} fill="#fde68a" stroke="#d97706" strokeWidth={2} />
            <line x1={LEDcx - 15} y1={LEDcy + 12} x2={LEDcx + 15} y2={LEDcy + 12} stroke="#d97706" strokeWidth={2} />
            <text x={LEDcx} y={LEDcy - 27} textAnchor="middle" fontSize={11} fill="#92400e" fontWeight="bold">LED</text>
          </g>
        )}

        {/* Accessory boxes (pots + switches) */}
        {accessories.map((acc, i) => {
          const ax     = accStartX + i * (accBoxW + accGap);
          const isPot  = acc.type === 'pot';
          const fill   = isPot ? '#ede9fe' : '#fef9c3';
          const stroke = isPot ? '#7c3aed' : '#b45309';
          return (
            <g key={`box-${acc.ref}`}>
              <rect x={ax} y={accRowY - accBoxH / 2} width={accBoxW} height={accBoxH} rx={6} fill={fill} stroke={stroke} strokeWidth={2} />
              <text x={ax + accBoxW / 2} y={accRowY - 10} textAnchor="middle" fontSize={10} fill={stroke} fontWeight="bold">
                {isPot ? '◎ POT' : '⊟ SW'}
              </text>
              <text x={ax + accBoxW / 2} y={accRowY + 5}  textAnchor="middle" fontSize={10} fill={stroke} fontWeight="700">{acc.ref}</text>
              <text x={ax + accBoxW / 2} y={accRowY + 19} textAnchor="middle" fontSize={8}  fill={stroke}>{acc.value.substring(0, 12)}</text>
            </g>
          );
        })}

        {/* Bypass wire label */}
        {hasFootswitch && (
          <text x={W / 2} y={GND_Y - 10} textAnchor="middle" fontSize={9} fill={BLUE} fontStyle="italic" opacity={0.8}>
            ╌╌╌ bypass (effect off)
          </text>
        )}

        {/* Wire colour legend */}
        <rect x={PCB.x + PCB.w + 18} y={PCB.y + 16} width={188} height={legendItems.length * 20 + 26} rx={6} fill="white" stroke="#e2e8f0" strokeWidth={1.5} />
        <text x={PCB.x + PCB.w + 112} y={PCB.y + 34} textAnchor="middle" fontSize={11} fill="#374151" fontWeight="bold">WIRE COLORS</text>
        {legendItems.map((item, i) => (
          <g key={i} transform={`translate(${PCB.x + PCB.w + 30}, ${PCB.y + 50 + i * 20})`}>
            <line x1={0} y1={6} x2={22} y2={6} stroke={item.color} strokeWidth={2.5} strokeLinecap="round" />
            <text x={28} y={10} fontSize={10} fill="#374151">{item.label}</text>
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
