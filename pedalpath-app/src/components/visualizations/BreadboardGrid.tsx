import React from 'react';

interface BreadboardGridProps {
  highlightHoles?: string[]; // e.g., ['a15', 'f15', 'c20']
  components?: HardcodedComponent[];
  showDemo?: boolean; // Show hardcoded demo components
}

interface HardcodedComponent {
  type: 'ic' | 'resistor' | 'wire';
  position: string; // e.g., 'a15-a22' for IC, 'a15-f15' for wire
  color?: string;
  label?: string;
}

const BreadboardGrid: React.FC<BreadboardGridProps> = ({
  highlightHoles = [],
  components = [],
  showDemo = true,
}) => {
  const ROWS = 63;
  const COLUMNS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
  const HOLE_SPACING = 12;
  const HOLE_RADIUS = 4;
  const RAIL_HEIGHT = 30;
  const TOP_MARGIN = 50;
  const LEFT_MARGIN = 50;
  const CENTER_GAP = 20;

  // Demo components
  const demoComponents: HardcodedComponent[] = showDemo
    ? [
        // IC straddling center (8-pin DIP at rows 20-27)
        { type: 'ic', position: 'e20-f27', label: 'TL072' },
        // Resistors
        { type: 'resistor', position: 'a15-a17', color: '#d4af37', label: 'R1 10kΩ' },
        { type: 'resistor', position: 'c25-c27', color: '#8b4513', label: 'R2 1kΩ' },
        { type: 'resistor', position: 'h30-h32', color: '#d4af37', label: 'R3 100kΩ' },
        // Wires
        { type: 'wire', position: 'a15-f20', color: '#ef4444', label: 'Power' },
        { type: 'wire', position: 'b18-g25', color: '#22c55e', label: 'Signal' },
        { type: 'wire', position: 'd30-i30', color: '#3b82f6', label: 'Ground' },
      ]
    : components;

  // Parse position string to coordinates
  const parsePosition = (pos: string) => {
    const [start, end] = pos.split('-');
    return { start, end };
  };

  const getHoleCoords = (hole: string) => {
    const col = hole.charAt(0);
    const row = parseInt(hole.slice(1));
    const colIndex = COLUMNS.indexOf(col);
    const xOffset = colIndex >= 5 ? CENTER_GAP : 0;
    return {
      x: LEFT_MARGIN + colIndex * HOLE_SPACING + xOffset,
      y: TOP_MARGIN + RAIL_HEIGHT + row * HOLE_SPACING,
    };
  };

  const isHighlighted = (col: string, row: number) => {
    return highlightHoles.includes(`${col}${row}`);
  };

  // Calculate SVG dimensions
  const totalWidth = LEFT_MARGIN * 2 + COLUMNS.length * HOLE_SPACING + CENTER_GAP;
  const totalHeight = TOP_MARGIN + RAIL_HEIGHT * 2 + ROWS * HOLE_SPACING + 20;

  return (
    <div className="w-full overflow-auto bg-gray-50 rounded-lg p-4">
      <svg
        viewBox={`0 0 ${totalWidth} ${totalHeight}`}
        className="w-full h-auto"
        style={{ maxHeight: '800px' }}
      >
        {/* Background */}
        <rect width={totalWidth} height={totalHeight} fill="#f8f9fa" />

        {/* Title */}
        <text
          x={totalWidth / 2}
          y={25}
          textAnchor="middle"
          className="text-lg font-semibold"
          fill="#1f2937"
        >
          Breadboard Layout (63 rows × 10 columns)
        </text>

        {/* Power Rails */}
        {/* Positive rail (top) */}
        <g id="power-rail-positive">
          <rect
            x={LEFT_MARGIN}
            y={TOP_MARGIN}
            width={COLUMNS.length * HOLE_SPACING + CENTER_GAP}
            height={RAIL_HEIGHT}
            fill="#fee2e2"
            stroke="#ef4444"
            strokeWidth="2"
            rx="4"
          />
          <text
            x={LEFT_MARGIN + 10}
            y={TOP_MARGIN + RAIL_HEIGHT / 2 + 5}
            className="text-sm font-bold"
            fill="#dc2626"
          >
            + (9V)
          </text>
          {/* Power rail holes */}
          {Array.from({ length: ROWS }).map((_, i) => (
            <circle
              key={`power-pos-${i}`}
              cx={LEFT_MARGIN + 15}
              cy={TOP_MARGIN + RAIL_HEIGHT + i * HOLE_SPACING}
              r={HOLE_RADIUS}
              fill="#ef4444"
              opacity="0.3"
            />
          ))}
        </g>

        {/* Negative rail (bottom - shown at top right for visibility) */}
        <g id="power-rail-negative">
          <rect
            x={totalWidth - LEFT_MARGIN - COLUMNS.length * HOLE_SPACING - CENTER_GAP}
            y={TOP_MARGIN}
            width={COLUMNS.length * HOLE_SPACING + CENTER_GAP}
            height={RAIL_HEIGHT}
            fill="#dbeafe"
            stroke="#3b82f6"
            strokeWidth="2"
            rx="4"
          />
          <text
            x={totalWidth - LEFT_MARGIN - 50}
            y={TOP_MARGIN + RAIL_HEIGHT / 2 + 5}
            className="text-sm font-bold"
            fill="#2563eb"
          >
            - (GND)
          </text>
          {/* Ground rail holes */}
          {Array.from({ length: ROWS }).map((_, i) => (
            <circle
              key={`power-neg-${i}`}
              cx={totalWidth - LEFT_MARGIN - 15}
              cy={TOP_MARGIN + RAIL_HEIGHT + i * HOLE_SPACING}
              r={HOLE_RADIUS}
              fill="#3b82f6"
              opacity="0.3"
            />
          ))}
        </g>

        {/* Column labels */}
        {COLUMNS.map((col, colIndex) => {
          const xOffset = colIndex >= 5 ? CENTER_GAP : 0;
          return (
            <text
              key={`col-${col}`}
              x={LEFT_MARGIN + colIndex * HOLE_SPACING + xOffset}
              y={TOP_MARGIN + RAIL_HEIGHT - 5}
              textAnchor="middle"
              className="text-xs font-mono font-bold"
              fill="#374151"
            >
              {col}
            </text>
          );
        })}

        {/* Main breadboard holes */}
        {Array.from({ length: ROWS }).map((_, rowIndex) => {
          const row = rowIndex + 1;
          return (
            <g key={`row-${row}`}>
              {/* Row number */}
              <text
                x={LEFT_MARGIN - 20}
                y={TOP_MARGIN + RAIL_HEIGHT + row * HOLE_SPACING + 4}
                textAnchor="middle"
                className="text-xs font-mono"
                fill="#6b7280"
              >
                {row}
              </text>

              {/* Holes for each column */}
              {COLUMNS.map((col, colIndex) => {
                const xOffset = colIndex >= 5 ? CENTER_GAP : 0;
                const highlighted = isHighlighted(col, row);
                return (
                  <circle
                    key={`hole-${col}${row}`}
                    cx={LEFT_MARGIN + colIndex * HOLE_SPACING + xOffset}
                    cy={TOP_MARGIN + RAIL_HEIGHT + row * HOLE_SPACING}
                    r={HOLE_RADIUS}
                    fill={highlighted ? '#fbbf24' : '#1f2937'}
                    stroke={highlighted ? '#f59e0b' : '#6b7280'}
                    strokeWidth={highlighted ? 2 : 1}
                    opacity={highlighted ? 1 : 0.6}
                  />
                );
              })}

              {/* Connection indicators (every 5 rows for clarity) */}
              {row % 5 === 0 && (
                <>
                  {/* Left side connection (a-e) */}
                  <line
                    x1={LEFT_MARGIN}
                    y1={TOP_MARGIN + RAIL_HEIGHT + row * HOLE_SPACING}
                    x2={LEFT_MARGIN + 4 * HOLE_SPACING}
                    y2={TOP_MARGIN + RAIL_HEIGHT + row * HOLE_SPACING}
                    stroke="#9ca3af"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                    opacity="0.4"
                  />
                  {/* Right side connection (f-j) */}
                  <line
                    x1={LEFT_MARGIN + 5 * HOLE_SPACING + CENTER_GAP}
                    y1={TOP_MARGIN + RAIL_HEIGHT + row * HOLE_SPACING}
                    x2={LEFT_MARGIN + 9 * HOLE_SPACING + CENTER_GAP}
                    y2={TOP_MARGIN + RAIL_HEIGHT + row * HOLE_SPACING}
                    stroke="#9ca3af"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                    opacity="0.4"
                  />
                </>
              )}
            </g>
          );
        })}

        {/* Center divider label */}
        <text
          x={LEFT_MARGIN + 4.5 * HOLE_SPACING + CENTER_GAP / 2}
          y={TOP_MARGIN + RAIL_HEIGHT - 5}
          textAnchor="middle"
          className="text-xs italic"
          fill="#9ca3af"
        >
          center gap
        </text>

        {/* Demo components overlay */}
        {demoComponents.map((comp, index) => {
          const { start, end } = parsePosition(comp.position);
          const startCoords = getHoleCoords(start);
          const endCoords = end ? getHoleCoords(end) : startCoords;

          if (comp.type === 'ic') {
            // Draw IC chip
            const width = Math.abs(endCoords.x - startCoords.x) + HOLE_SPACING;
            const height = Math.abs(endCoords.y - startCoords.y) + HOLE_SPACING;
            const x = Math.min(startCoords.x, endCoords.x) - HOLE_SPACING / 2;
            const y = Math.min(startCoords.y, endCoords.y) - HOLE_SPACING / 2;

            return (
              <g key={`comp-${index}`}>
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  fill="#374151"
                  stroke="#1f2937"
                  strokeWidth="2"
                  rx="3"
                  opacity="0.9"
                />
                <circle cx={x + 5} cy={y + 5} r="2" fill="#ffffff" />
                <text
                  x={x + width / 2}
                  y={y + height / 2 + 4}
                  textAnchor="middle"
                  className="text-xs font-mono font-bold"
                  fill="#ffffff"
                >
                  {comp.label}
                </text>
              </g>
            );
          }

          if (comp.type === 'resistor') {
            // Draw resistor
            const midX = (startCoords.x + endCoords.x) / 2;
            const midY = (startCoords.y + endCoords.y) / 2;
            const width = 25;
            const height = 8;

            return (
              <g key={`comp-${index}`}>
                <line
                  x1={startCoords.x}
                  y1={startCoords.y}
                  x2={endCoords.x}
                  y2={endCoords.y}
                  stroke={comp.color || '#8b4513'}
                  strokeWidth="2"
                />
                <rect
                  x={midX - width / 2}
                  y={midY - height / 2}
                  width={width}
                  height={height}
                  fill={comp.color || '#d4af37'}
                  stroke="#000"
                  strokeWidth="1"
                  rx="2"
                />
                {comp.label && (
                  <text
                    x={midX}
                    y={midY - 12}
                    textAnchor="middle"
                    className="text-xs font-mono"
                    fill="#1f2937"
                  >
                    {comp.label}
                  </text>
                )}
              </g>
            );
          }

          if (comp.type === 'wire') {
            // Draw wire
            return (
              <g key={`comp-${index}`}>
                <line
                  x1={startCoords.x}
                  y1={startCoords.y}
                  x2={endCoords.x}
                  y2={endCoords.y}
                  stroke={comp.color || '#6b7280'}
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity="0.8"
                />
                {comp.label && (
                  <text
                    x={(startCoords.x + endCoords.x) / 2}
                    y={(startCoords.y + endCoords.y) / 2 - 8}
                    textAnchor="middle"
                    className="text-xs font-mono"
                    fill={comp.color || '#1f2937'}
                  >
                    {comp.label}
                  </text>
                )}
              </g>
            );
          }

          return null;
        })}

        {/* Legend */}
        <g id="legend" transform={`translate(${LEFT_MARGIN}, ${totalHeight - 60})`}>
          <rect x="0" y="0" width="200" height="50" fill="#ffffff" stroke="#d1d5db" rx="4" />
          <text x="10" y="15" className="text-xs font-semibold" fill="#1f2937">
            Legend:
          </text>
          <circle cx="15" cy="30" r="4" fill="#1f2937" opacity="0.6" />
          <text x="25" y="34" className="text-xs" fill="#4b5563">
            Connection hole
          </text>
          <circle cx="115" cy="30" r="4" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" />
          <text x="125" y="34" className="text-xs" fill="#4b5563">
            Highlighted
          </text>
        </g>
      </svg>

      {/* Info text */}
      <div className="mt-4 text-sm text-gray-600 space-y-1">
        <p>
          • <strong>Columns a-e and f-j</strong> are separate (divided by center gap)
        </p>
        <p>
          • <strong>Holes in each column</strong> are electrically connected (shown by dashed lines)
        </p>
        <p>
          • <strong>Power rails (+/-)</strong> run the full length for easy power distribution
        </p>
      </div>
    </div>
  );
};

export default BreadboardGrid;
