# Breadboard Base Architecture

**Purpose:** Technical design for realistic breadboard SVG rendering
**Audience:** Worker B (Phase 1, Work Stream B)

## Goal

Create a React component that renders a photorealistic breadboard SVG matching the reference images exactly. This component will serve as the base for all circuit visualizations.

## Component API

```typescript
interface BreadboardBaseProps {
  /** Breadboard size */
  size: '830' | '400';

  /** Optional holes to highlight */
  highlightHoles?: string[];

  /** Callback when hole is clicked */
  onHoleClick?: (holeId: string) => void;

  /** CSS class name */
  className?: string;

  /** Scale factor for rendering */
  scale?: number;
}

/**
 * Renders a realistic breadboard base
 *
 * @example
 * <BreadboardBase
 *   size="830"
 *   highlightHoles={["a15", "a16"]}
 *   onHoleClick={(id) => console.log('Clicked', id)}
 * />
 */
export function BreadboardBase(props: BreadboardBaseProps): JSX.Element;
```

## SVG Coordinate System

### Grid Units
- **1 unit = 0.1mm** (so 25.4 units = 2.54mm = standard IC pitch)
- **Hole spacing**: 25.4 units (2.54mm)
- **830-point board**: ~1650 units wide × 550 units tall
- **400-point board**: ~800 units wide × 550 units tall

### Layout Coordinates

```typescript
const LAYOUT_830 = {
  // Terminal strip dimensions
  columns: 63,
  rowsPerSection: 5, // a-e or f-j
  sections: 2,       // Upper and lower

  // Spacing
  holeSpacing: 25.4,
  centerGap: 25.4,   // Gap between row e and row f

  // Power rails
  powerRailY: {
    topPositive: 30,
    topGround: 60,
    bottomGround: 520,
    bottomPositive: 550,
  },

  // Terminal strip starting position
  terminalStripStart: {
    x: 50,  // Left margin
    y: 100, // Below power rails
  },
};

const ROW_NAMES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
```

## Component Structure

```tsx
// src/components/visualizations/BreadboardBase.tsx

import React from 'react';

export interface BreadboardBaseProps {
  size: '830' | '400';
  highlightHoles?: string[];
  onHoleClick?: (holeId: string) => void;
  className?: string;
  scale?: number;
}

export function BreadboardBase({
  size,
  highlightHoles = [],
  onHoleClick,
  className = '',
  scale = 1,
}: BreadboardBaseProps) {
  const config = size === '830' ? LAYOUT_830 : LAYOUT_400;

  // Calculate viewBox dimensions
  const viewBoxWidth = config.totalWidth;
  const viewBoxHeight = config.totalHeight;

  return (
    <svg
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
      className={`breadboard-base ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Definitions for reusable elements */}
      <defs>
        {/* Hole gradient for depth effect */}
        <radialGradient id="holeGradient">
          <stop offset="0%" stopColor="#333333" />
          <stop offset="70%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#000000" />
        </radialGradient>

        {/* Metallic rim gradient */}
        <radialGradient id="rimGradient">
          <stop offset="0%" stopColor="#999999" />
          <stop offset="50%" stopColor="#666666" />
          <stop offset="100%" stopColor="#444444" />
        </radialGradient>
      </defs>

      {/* Board base */}
      <rect
        x="0"
        y="0"
        width={viewBoxWidth}
        height={viewBoxHeight}
        fill="#F5F5F5"
        rx="10"
        ry="10"
      />

      {/* Subtle texture overlay */}
      <rect
        x="0"
        y="0"
        width={viewBoxWidth}
        height={viewBoxHeight}
        fill="url(#texturePattern)"
        opacity="0.03"
      />

      {/* Power Rails - TOP */}
      <PowerRails
        y={config.powerRailY.topPositive}
        columns={config.columns}
        type="positive"
      />
      <PowerRails
        y={config.powerRailY.topGround}
        columns={config.columns}
        type="ground"
      />

      {/* Terminal Strip Holes */}
      <TerminalStrip
        config={config}
        highlightHoles={highlightHoles}
        onHoleClick={onHoleClick}
      />

      {/* Power Rails - BOTTOM */}
      <PowerRails
        y={config.powerRailY.bottomGround}
        columns={config.columns}
        type="ground"
      />
      <PowerRails
        y={config.powerRailY.bottomPositive}
        columns={config.columns}
        type="positive"
      />

      {/* Labels */}
      <Labels config={config} />
    </svg>
  );
}

/** Power rail rendering */
function PowerRails({
  y,
  columns,
  type,
}: {
  y: number;
  columns: number;
  type: 'positive' | 'ground';
}) {
  const color = type === 'positive' ? '#CC0000' : '#0066CC';
  const holeSpacing = 25.4;
  const startX = 50;

  return (
    <g className={`power-rail power-rail-${type}`}>
      {/* Colored stripe */}
      <line
        x1={startX - 20}
        y1={y}
        x2={startX + columns * holeSpacing + 20}
        y2={y}
        stroke={color}
        strokeWidth="8"
        opacity="0.7"
      />

      {/* Holes */}
      {Array.from({ length: columns }).map((_, i) => {
        const x = startX + i * holeSpacing;
        const holeId = `${type}-${i + 1}`;

        return (
          <Hole
            key={holeId}
            id={holeId}
            x={x}
            y={y}
            highlighted={false}
            onClick={() => {}}
          />
        );
      })}
    </g>
  );
}

/** Terminal strip rendering */
function TerminalStrip({
  config,
  highlightHoles,
  onHoleClick,
}: {
  config: typeof LAYOUT_830;
  highlightHoles: string[];
  onHoleClick?: (id: string) => void;
}) {
  const { columns, rowsPerSection, terminalStripStart, holeSpacing, centerGap } = config;
  const rows = ROW_NAMES;

  return (
    <g className="terminal-strip">
      {rows.map((row, rowIdx) => {
        // Calculate Y position with center gap
        let y = terminalStripStart.y + rowIdx * holeSpacing;
        if (rowIdx >= 5) {
          y += centerGap; // Add gap after row 'e'
        }

        return (
          <g key={row} className={`row-${row}`}>
            {Array.from({ length: columns }).map((_, colIdx) => {
              const x = terminalStripStart.x + colIdx * holeSpacing;
              const holeId = `${row}${colIdx + 1}`;
              const highlighted = highlightHoles.includes(holeId);

              return (
                <Hole
                  key={holeId}
                  id={holeId}
                  x={x}
                  y={y}
                  highlighted={highlighted}
                  onClick={() => onHoleClick?.(holeId)}
                />
              );
            })}
          </g>
        );
      })}

      {/* Center divider line */}
      <line
        x1={terminalStripStart.x - 20}
        y1={terminalStripStart.y + 5 * holeSpacing + centerGap / 2}
        x2={terminalStripStart.x + columns * holeSpacing + 20}
        y2={terminalStripStart.y + 5 * holeSpacing + centerGap / 2}
        stroke="#CCCCCC"
        strokeWidth="2"
        strokeDasharray="5,5"
        opacity="0.5"
      />
    </g>
  );
}

/** Individual hole rendering */
function Hole({
  id,
  x,
  y,
  highlighted,
  onClick,
}: {
  id: string;
  x: number;
  y: number;
  highlighted: boolean;
  onClick: () => void;
}) {
  return (
    <g
      className={`hole ${highlighted ? 'hole-highlighted' : ''}`}
      data-hole-id={id}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {/* Metallic rim */}
      <circle
        cx={x}
        cy={y}
        r="5.5"
        fill="url(#rimGradient)"
      />

      {/* Hole interior */}
      <circle
        cx={x}
        cy={y}
        r="4"
        fill="url(#holeGradient)"
      />

      {/* Highlight overlay */}
      {highlighted && (
        <circle
          cx={x}
          cy={y}
          r="7"
          fill="none"
          stroke="#FFD700"
          strokeWidth="2"
          opacity="0.8"
        />
      )}
    </g>
  );
}

/** Label rendering */
function Labels({ config }: { config: typeof LAYOUT_830 }) {
  const { columns, terminalStripStart, holeSpacing, centerGap } = config;

  return (
    <g className="labels">
      {/* Column numbers (1-63) */}
      {Array.from({ length: columns }).map((_, i) => {
        const x = terminalStripStart.x + i * holeSpacing;
        const col = i + 1;

        return (
          <React.Fragment key={`col-${col}`}>
            {/* Above row 'a' */}
            <text
              x={x}
              y={terminalStripStart.y - 15}
              fontSize="10"
              fill="#666666"
              textAnchor="middle"
              fontFamily="Arial, sans-serif"
            >
              {col}
            </text>

            {/* Below row 'j' */}
            <text
              x={x}
              y={terminalStripStart.y + 10 * holeSpacing + centerGap + 20}
              fontSize="10"
              fill="#666666"
              textAnchor="middle"
              fontFamily="Arial, sans-serif"
            >
              {col}
            </text>
          </React.Fragment>
        );
      })}

      {/* Row letters (a-j) */}
      {ROW_NAMES.map((row, idx) => {
        let y = terminalStripStart.y + idx * holeSpacing;
        if (idx >= 5) {
          y += centerGap;
        }

        return (
          <text
            key={`row-${row}`}
            x={terminalStripStart.x - 25}
            y={y + 4}
            fontSize="12"
            fill="#666666"
            textAnchor="end"
            fontFamily="Arial, sans-serif"
            fontWeight="600"
          >
            {row}
          </text>
        );
      })}

      {/* Power rail labels */}
      <text x="15" y={config.powerRailY.topPositive + 4} fontSize="14" fill="#CC0000" fontWeight="bold">+</text>
      <text x="15" y={config.powerRailY.topGround + 4} fontSize="14" fill="#0066CC" fontWeight="bold">−</text>
      <text x="15" y={config.powerRailY.bottomGround + 4} fontSize="14" fill="#0066CC" fontWeight="bold">−</text>
      <text x="15" y={config.powerRailY.bottomPositive + 4} fontSize="14" fill="#CC0000" fontWeight="bold">+</text>
    </g>
  );
}

// Layout configurations
const LAYOUT_830 = {
  columns: 63,
  rowsPerSection: 5,
  sections: 2,
  holeSpacing: 25.4,
  centerGap: 25.4,
  powerRailY: {
    topPositive: 30,
    topGround: 60,
    bottomGround: 490,
    bottomPositive: 520,
  },
  terminalStripStart: {
    x: 50,
    y: 100,
  },
  totalWidth: 1700,
  totalHeight: 600,
};

const LAYOUT_400 = {
  ...LAYOUT_830,
  columns: 30,
  totalWidth: 850,
};

const ROW_NAMES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'] as const;

export default BreadboardBase;
```

## Styling

```css
/* src/components/visualizations/BreadboardBase.css */

.breadboard-base {
  max-width: 100%;
  height: auto;
  display: block;
}

.hole {
  transition: all 0.2s ease;
}

.hole:hover {
  filter: brightness(1.2);
}

.hole-highlighted {
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.power-rail line {
  transition: stroke-width 0.2s ease;
}

.labels text {
  user-select: none;
  pointer-events: none;
}
```

## Hole ID Utility Functions

```typescript
// src/utils/breadboard-utils.ts

/**
 * Converts hole ID to coordinates
 */
export function holeToCoordinates(
  holeId: string,
  config: typeof LAYOUT_830
): { x: number; y: number } {
  // Power rail holes: "+1", "-15", etc.
  if (holeId.startsWith('+') || holeId.startsWith('-')) {
    const col = parseInt(holeId.substring(1));
    const x = config.terminalStripStart.x + (col - 1) * config.holeSpacing;
    const y = holeId.startsWith('+')
      ? config.powerRailY.topPositive
      : config.powerRailY.topGround;
    return { x, y };
  }

  // Terminal strip holes: "a15", "f32", etc.
  const row = holeId[0];
  const col = parseInt(holeId.substring(1));

  const rowIdx = ROW_NAMES.indexOf(row);
  const x = config.terminalStripStart.x + (col - 1) * config.holeSpacing;
  let y = config.terminalStripStart.y + rowIdx * config.holeSpacing;

  // Add center gap for rows f-j
  if (rowIdx >= 5) {
    y += config.centerGap;
  }

  return { x, y };
}

/**
 * Validates hole ID format
 */
export function isValidHoleId(holeId: string, size: '830' | '400'): boolean {
  const maxCol = size === '830' ? 63 : 30;

  // Power rails
  if (/^[+-]\d+$/.test(holeId)) {
    const col = parseInt(holeId.substring(1));
    return col >= 1 && col <= maxCol;
  }

  // Terminal strip
  const match = holeId.match(/^([a-j])(\d+)$/);
  if (!match) return false;

  const [, row, colStr] = match;
  const col = parseInt(colStr);

  return (
    ROW_NAMES.includes(row as any) &&
    col >= 1 &&
    col <= maxCol
  );
}

/**
 * Get connected holes (same connection group)
 */
export function getConnectedHoles(holeId: string, size: '830' | '400'): string[] {
  // Power rails: all holes in same rail connected
  if (holeId.startsWith('+') || holeId.startsWith('-')) {
    const maxCol = size === '830' ? 63 : 30;
    const prefix = holeId[0];
    return Array.from({ length: maxCol }, (_, i) => `${prefix}${i + 1}`);
  }

  // Terminal strip: 5 holes in same column connected
  const row = holeId[0];
  const col = holeId.substring(1);

  // Rows a-e connected, rows f-j connected
  const rowGroup = ['a', 'b', 'c', 'd', 'e'].includes(row)
    ? ['a', 'b', 'c', 'd', 'e']
    : ['f', 'g', 'h', 'i', 'j'];

  return rowGroup.map(r => `${r}${col}`);
}

const ROW_NAMES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
```

## Testing & Verification

### Visual Tests
1. Render side-by-side with reference photo
2. Measure hole spacing with browser dev tools
3. Verify colors match (#F5F5F5, #CC0000, #0066CC)
4. Check power rails at top/bottom (not sides!)
5. Verify column numbers: 1-63, row letters: a-j

### Interaction Tests
```tsx
// Test hole highlighting
<BreadboardBase
  size="830"
  highlightHoles={["a15", "a16", "b15", "b16"]}
/>

// Test hole click
<BreadboardBase
  size="830"
  onHoleClick={(id) => console.log('Clicked:', id)}
/>
```

### Unit Tests
```typescript
describe('breadboard-utils', () => {
  test('holeToCoordinates calculates correct position', () => {
    const coords = holeToCoordinates('a1', LAYOUT_830);
    expect(coords).toEqual({ x: 50, y: 100 });
  });

  test('getConnectedHoles returns correct group', () => {
    const connected = getConnectedHoles('a15', '830');
    expect(connected).toEqual(['a15', 'b15', 'c15', 'd15', 'e15']);
  });

  test('validates hole IDs correctly', () => {
    expect(isValidHoleId('a15', '830')).toBe(true);
    expect(isValidHoleId('k15', '830')).toBe(false); // No 'k' row
    expect(isValidHoleId('a64', '830')).toBe(false); // Max 63 cols
    expect(isValidHoleId('+10', '830')).toBe(true);
  });
});
```

## Deliverables

1. **Component**: `src/components/visualizations/BreadboardBase.tsx`
2. **Utilities**: `src/utils/breadboard-utils.ts`
3. **Tests**: Coverage for utils and visual regression tests
4. **Styling**: CSS for hover/highlight effects
5. **Documentation**: JSDoc and usage examples

## Known Limitations

- Does not render components (Phase 2)
- No zoom/pan controls (Phase 3)
- Power rail gaps not implemented (rare, needed for some boards)

## Handoff to Phase 2

Document in `HANDOFF.md`:
- How to position components on holes
- How to get hole coordinates
- Connection groups for circuit validation

---

**Implementation Location:** `3-implementation/phase1-decoders/` (shared phase with decoders)
