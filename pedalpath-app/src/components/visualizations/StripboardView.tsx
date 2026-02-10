import React, { useState } from 'react';

type ViewMode = 'component' | 'copper' | 'both';

interface StripboardViewProps {
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  components?: StripboardComponent[];
  trackCuts?: string[]; // e.g., ['C2', 'E5']
  showDemo?: boolean;
}

interface StripboardComponent {
  type: 'ic' | 'resistor' | 'capacitor' | 'wire';
  position: string; // e.g., 'D4-D11' for IC, 'B5-D5' for resistor
  label?: string;
  orientation?: 'horizontal' | 'vertical';
}

const StripboardView: React.FC<StripboardViewProps> = ({
  viewMode: initialViewMode = 'both',
  onViewModeChange,
  components: propsComponents = [],
  trackCuts: propsTrackCuts = [],
  showDemo = true,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);

  const ROWS = 25;
  const COLUMNS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').slice(0, 20); // A-T
  const HOLE_SPACING = 15;
  const HOLE_RADIUS = 3;
  const TOP_MARGIN = 40;
  const LEFT_MARGIN = 40;

  // Demo data
  const demoComponents: StripboardComponent[] = showDemo
    ? [
        // IC (8-pin DIP at D10-K10 area)
        { type: 'ic', position: 'D10-D17', label: 'TL072' },
        // Resistors
        { type: 'resistor', position: 'B5-E5', label: 'R1 10kΩ', orientation: 'horizontal' },
        { type: 'resistor', position: 'F8-I8', label: 'R2 1kΩ', orientation: 'horizontal' },
        // Capacitor
        { type: 'capacitor', position: 'L12-O12', label: 'C1 100nF', orientation: 'horizontal' },
        // Wire links
        { type: 'wire', position: 'B7-B12', orientation: 'vertical' },
        { type: 'wire', position: 'M15-M18', orientation: 'vertical' },
      ]
    : propsComponents;

  const demoTrackCuts: string[] = showDemo
    ? ['D11', 'D14', 'G10', 'L13'] // Example track cuts
    : propsTrackCuts;

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    onViewModeChange?.(mode);
  };

  // Parse position like 'D10-K17' to coordinates
  const parsePosition = (pos: string) => {
    const [start, end] = pos.split('-');
    return { start, end: end || start };
  };

  const getHoleCoords = (hole: string) => {
    const col = hole.charAt(0);
    const row = parseInt(hole.slice(1));
    const colIndex = COLUMNS.indexOf(col);
    return {
      x: LEFT_MARGIN + colIndex * HOLE_SPACING,
      y: TOP_MARGIN + row * HOLE_SPACING,
    };
  };

  const renderComponentSide = () => {
    const width = LEFT_MARGIN * 2 + COLUMNS.length * HOLE_SPACING;
    const height = TOP_MARGIN * 2 + ROWS * HOLE_SPACING;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* Background */}
        <rect width={width} height={height} fill="#f0e5d8" />

        {/* Title */}
        <text
          x={width / 2}
          y={20}
          textAnchor="middle"
          className="text-sm font-semibold"
          fill="#1f2937"
        >
          Component Side
        </text>

        {/* Grid */}
        {/* Column labels */}
        {COLUMNS.map((col, colIndex) => (
          <text
            key={`col-${col}`}
            x={LEFT_MARGIN + colIndex * HOLE_SPACING}
            y={TOP_MARGIN - 10}
            textAnchor="middle"
            className="text-xs font-mono font-bold"
            fill="#374151"
          >
            {col}
          </text>
        ))}

        {/* Row labels and holes */}
        {Array.from({ length: ROWS }).map((_, rowIndex) => {
          const row = rowIndex + 1;
          return (
            <g key={`row-${row}`}>
              {/* Row number */}
              <text
                x={LEFT_MARGIN - 15}
                y={TOP_MARGIN + row * HOLE_SPACING + 4}
                textAnchor="middle"
                className="text-xs font-mono"
                fill="#6b7280"
              >
                {row}
              </text>

              {/* Holes */}
              {COLUMNS.map((col, colIndex) => (
                <circle
                  key={`hole-${col}${row}`}
                  cx={LEFT_MARGIN + colIndex * HOLE_SPACING}
                  cy={TOP_MARGIN + row * HOLE_SPACING}
                  r={HOLE_RADIUS}
                  fill="#1f2937"
                  opacity="0.3"
                  stroke="#6b7280"
                  strokeWidth="0.5"
                />
              ))}
            </g>
          );
        })}

        {/* Components overlay */}
        {demoComponents.map((comp, index) => {
          const { start, end } = parsePosition(comp.position);
          const startCoords = getHoleCoords(start);
          const endCoords = getHoleCoords(end);

          if (comp.type === 'ic') {
            // Draw IC chip
            const height = Math.abs(endCoords.y - startCoords.y) + HOLE_SPACING;
            const width = 30;
            const x = startCoords.x - width / 2;
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
                  rx="2"
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
            // Draw resistor body
            const midX = (startCoords.x + endCoords.x) / 2;
            const midY = (startCoords.y + endCoords.y) / 2;
            const isHorizontal = comp.orientation === 'horizontal';
            const bodyWidth = isHorizontal ? 30 : 8;
            const bodyHeight = isHorizontal ? 8 : 30;

            return (
              <g key={`comp-${index}`}>
                {/* Lead lines */}
                <line
                  x1={startCoords.x}
                  y1={startCoords.y}
                  x2={endCoords.x}
                  y2={endCoords.y}
                  stroke="#8b4513"
                  strokeWidth="2"
                />
                {/* Body */}
                <rect
                  x={midX - bodyWidth / 2}
                  y={midY - bodyHeight / 2}
                  width={bodyWidth}
                  height={bodyHeight}
                  fill="#d4af37"
                  stroke="#8b4513"
                  strokeWidth="1.5"
                  rx="2"
                />
                {/* Color bands */}
                <rect
                  x={midX - bodyWidth / 4}
                  y={midY - bodyHeight / 2}
                  width={2}
                  height={bodyHeight}
                  fill="#8b4513"
                />
                {comp.label && (
                  <text
                    x={midX}
                    y={midY - bodyHeight / 2 - 8}
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

          if (comp.type === 'capacitor') {
            // Draw capacitor
            const midX = (startCoords.x + endCoords.x) / 2;
            const midY = (startCoords.y + endCoords.y) / 2;
            const isHorizontal = comp.orientation === 'horizontal';
            const bodyWidth = isHorizontal ? 25 : 10;
            const bodyHeight = isHorizontal ? 10 : 25;

            return (
              <g key={`comp-${index}`}>
                {/* Lead lines */}
                <line
                  x1={startCoords.x}
                  y1={startCoords.y}
                  x2={endCoords.x}
                  y2={endCoords.y}
                  stroke="#6b7280"
                  strokeWidth="2"
                />
                {/* Body */}
                <rect
                  x={midX - bodyWidth / 2}
                  y={midY - bodyHeight / 2}
                  width={bodyWidth}
                  height={bodyHeight}
                  fill="#fbbf24"
                  stroke="#92400e"
                  strokeWidth="1.5"
                  rx="2"
                />
                {comp.label && (
                  <text
                    x={midX}
                    y={midY - bodyHeight / 2 - 8}
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
            // Draw wire link
            return (
              <line
                key={`comp-${index}`}
                x1={startCoords.x}
                y1={startCoords.y}
                x2={endCoords.x}
                y2={endCoords.y}
                stroke="#1f2937"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            );
          }

          return null;
        })}
      </svg>
    );
  };

  const renderCopperSide = () => {
    const width = LEFT_MARGIN * 2 + COLUMNS.length * HOLE_SPACING;
    const height = TOP_MARGIN * 2 + ROWS * HOLE_SPACING;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* Background */}
        <rect width={width} height={height} fill="#1a1a1a" />

        {/* Title */}
        <text
          x={width / 2}
          y={20}
          textAnchor="middle"
          className="text-sm font-semibold"
          fill="#ffffff"
        >
          Copper Side (Solder View)
        </text>

        {/* Column labels */}
        {COLUMNS.map((col, colIndex) => (
          <text
            key={`col-${col}`}
            x={LEFT_MARGIN + colIndex * HOLE_SPACING}
            y={TOP_MARGIN - 10}
            textAnchor="middle"
            className="text-xs font-mono font-bold"
            fill="#d1d5db"
          >
            {col}
          </text>
        ))}

        {/* Copper strips (horizontal) */}
        {Array.from({ length: ROWS }).map((_, rowIndex) => {
          const row = rowIndex + 1;
          const y = TOP_MARGIN + row * HOLE_SPACING;
          const isGroundRail = row === 1;
          const isPowerRail = row === 2;

          return (
            <g key={`strip-${row}`}>
              {/* Row number */}
              <text
                x={LEFT_MARGIN - 15}
                y={y + 4}
                textAnchor="middle"
                className="text-xs font-mono"
                fill="#9ca3af"
              >
                {row}
              </text>

              {/* Copper strip */}
              <rect
                x={LEFT_MARGIN - 5}
                y={y - 4}
                width={COLUMNS.length * HOLE_SPACING + 10}
                height={8}
                fill={isGroundRail ? '#3b82f6' : isPowerRail ? '#ef4444' : '#d97706'}
                opacity={isGroundRail || isPowerRail ? 0.7 : 0.6}
                rx="1"
              />

              {/* Holes (solder pads) */}
              {COLUMNS.map((col, colIndex) => {
                const holeId = `${col}${row}`;
                const isCut = demoTrackCuts.includes(holeId);

                return (
                  <g key={`pad-${holeId}`}>
                    <circle
                      cx={LEFT_MARGIN + colIndex * HOLE_SPACING}
                      cy={y}
                      r={HOLE_RADIUS + 1}
                      fill={isCut ? '#1a1a1a' : '#b45309'}
                      stroke="#92400e"
                      strokeWidth="1"
                    />
                    {/* Track cut indicator */}
                    {isCut && (
                      <>
                        <line
                          x1={LEFT_MARGIN + colIndex * HOLE_SPACING - 6}
                          y1={y - 6}
                          x2={LEFT_MARGIN + colIndex * HOLE_SPACING + 6}
                          y2={y + 6}
                          stroke="#ef4444"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                        <line
                          x1={LEFT_MARGIN + colIndex * HOLE_SPACING - 6}
                          y1={y + 6}
                          x2={LEFT_MARGIN + colIndex * HOLE_SPACING + 6}
                          y2={y - 6}
                          stroke="#ef4444"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                      </>
                    )}
                  </g>
                );
              })}

              {/* Rail labels */}
              {isGroundRail && (
                <text
                  x={width - LEFT_MARGIN + 20}
                  y={y + 4}
                  className="text-xs font-bold"
                  fill="#3b82f6"
                >
                  GND
                </text>
              )}
              {isPowerRail && (
                <text
                  x={width - LEFT_MARGIN + 20}
                  y={y + 4}
                  className="text-xs font-bold"
                  fill="#ef4444"
                >
                  +9V
                </text>
              )}
            </g>
          );
        })}

        {/* Legend */}
        <g transform={`translate(${LEFT_MARGIN}, ${height - 30})`}>
          <text x="0" y="0" className="text-xs font-semibold" fill="#d1d5db">
            Legend:
          </text>
          <line x1="50" y1="-3" x2="70" y2="-3" stroke="#ef4444" strokeWidth="3" />
          <text x="75" y="0" className="text-xs" fill="#d1d5db">
            Track cut (X)
          </text>
          <circle cx="145" cy="-3" r="4" fill="#b45309" stroke="#92400e" />
          <text x="155" y="0" className="text-xs" fill="#d1d5db">
            Solder pad
          </text>
        </g>
      </svg>
    );
  };

  return (
    <div className="w-full space-y-4">
      {/* View mode toggle buttons */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => handleViewModeChange('component')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'component'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Component Side
        </button>
        <button
          onClick={() => handleViewModeChange('copper')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'copper'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Copper Side
        </button>
        <button
          onClick={() => handleViewModeChange('both')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'both'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Both Views
        </button>
      </div>

      {/* View content */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        {viewMode === 'component' && renderComponentSide()}
        {viewMode === 'copper' && renderCopperSide()}
        {viewMode === 'both' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>{renderComponentSide()}</div>
            <div>{renderCopperSide()}</div>
          </div>
        )}
      </div>

      {/* Info text */}
      <div className="text-sm text-gray-600 space-y-1 bg-gray-50 p-4 rounded-lg">
        <p>
          • <strong>Component Side:</strong> Shows where components are placed from the top view
        </p>
        <p>
          • <strong>Copper Side:</strong> Shows horizontal copper strips (tracks) and where to cut
          them
        </p>
        <p>
          • <strong>Track Cuts (X):</strong> Break the copper strip to isolate circuit sections
        </p>
        <p>
          • <strong>Ground (blue) & Power (red):</strong> Typically use bottom rows for easy access
        </p>
      </div>
    </div>
  );
};

export default StripboardView;
