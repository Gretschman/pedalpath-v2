/**
 * ResistorBands — compact inline SVG showing color bands for a resistor value.
 *
 * Distinct from ResistorSVG (which renders a full breadboard component with leads).
 * This is a small inline badge suitable for BOM table cells.
 *
 * Uses encodeResistor() from the existing TS decoder — no API calls, pure client-side.
 */

import { encodeResistor } from '@/utils/decoders/resistor-decoder';

// IEC 60062 color hex values — matches ResistorSVG.tsx
const BAND_COLOR_HEX: Record<string, string> = {
  black:  '#1a1a1a',
  brown:  '#7B3F00',
  red:    '#CC0000',
  orange: '#FF8000',
  yellow: '#FFD700',
  green:  '#007A00',
  blue:   '#0033BB',
  violet: '#7700BB',
  gray:   '#888888',
  grey:   '#888888',
  white:  '#F5F5F5',
  gold:   '#C5A028',
  silver: '#A8A8A8',
};

/**
 * Parse a resistor value string (e.g. "47k", "4.7k", "100R", "1M", "4k7") to ohms.
 * Returns null if the string is unrecognizable.
 */
export function parseResistorOhms(value: string): number | null {
  const s = value.trim().replace(/[ΩΩ]/g, '').replace(/ohms?$/i, '').trim();

  // "4R7" → 4.7 Ω, "4K7" → 4700 Ω
  const codeNotation = s.match(/^(\d+)([RrKkMmGg])(\d+)$/);
  if (codeNotation) {
    const base = parseFloat(`${codeNotation[1]}.${codeNotation[3]}`);
    const unit = codeNotation[2].toLowerCase();
    if (unit === 'r') return base;
    if (unit === 'k') return base * 1e3;
    if (unit === 'm') return base * 1e6;
    if (unit === 'g') return base * 1e9;
  }

  const m = s.match(/^([\d.]+)\s*([kKmMgGrR]?)$/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (isNaN(n)) return null;
  const suffix = m[2].toLowerCase();
  if (suffix === 'k') return n * 1e3;
  if (suffix === 'm') return n * 1e6;
  if (suffix === 'g') return n * 1e9;
  return n; // 'r', '', or plain digits → ohms
}

interface ResistorBandsProps {
  /** Resistor value string from BOM, e.g. "47k", "100R", "4.7k" */
  value: string;
  /** Prefer 4-band display when available (default: 5-band) */
  preferFourBand?: boolean;
  /** SVG width in px (default 54) */
  width?: number;
  /** SVG height in px (default 16) */
  height?: number;
}

export function ResistorBands({
  value,
  preferFourBand = false,
  width = 54,
  height = 16,
}: ResistorBandsProps) {
  const ohms = parseResistorOhms(value);
  if (ohms === null || ohms <= 0) return null;

  let encoded;
  try {
    encoded = encodeResistor(ohms, 1.0);
  } catch {
    return null;
  }

  const bands =
    preferFourBand && encoded.bands4 ? encoded.bands4 : encoded.bands5;

  const n = bands.length;
  const bodyH = Math.round(height * 0.72);
  const bodyY = Math.round((height - bodyH) / 2);
  const padX = 3;
  const bodyX = padX;
  const bodyW = width - padX * 2;
  const bandW = 3.5;
  const innerPad = 5;
  const usable = bodyW - innerPad * 2;
  const gap = n > 1 ? usable / (n - 1) : 0;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      aria-label={`${value} color bands`}
    >
      <title>{`${value} — ${n}-band`}</title>
      {/* Resistor body */}
      <rect
        x={bodyX}
        y={bodyY}
        width={bodyW}
        height={bodyH}
        fill="#D2B48C"
        rx={bodyH / 2}
      />
      {/* Subtle highlight on top */}
      <rect
        x={bodyX}
        y={bodyY}
        width={bodyW}
        height={Math.round(bodyH * 0.3)}
        fill="#FFFFFF"
        opacity={0.25}
        rx={bodyH / 2}
      />
      {/* Color bands */}
      {bands.map((color, i) => {
        const cx = bodyX + innerPad + i * gap;
        const hex = BAND_COLOR_HEX[color] ?? '#808080';
        const needsBorder =
          color === 'white' || color === 'gold' || color === 'silver';
        return (
          <g key={i}>
            <rect
              x={cx - bandW / 2}
              y={bodyY}
              width={bandW}
              height={bodyH}
              fill={hex}
            />
            {needsBorder && (
              <rect
                x={cx - bandW / 2}
                y={bodyY}
                width={bandW}
                height={bodyH}
                fill="none"
                stroke="#555"
                strokeWidth={0.5}
                opacity={0.4}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
