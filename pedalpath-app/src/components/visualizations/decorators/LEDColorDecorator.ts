// LEDColorDecorator — maps color string to CSS hex for lens fill

const COLOR_MAP: Record<string, string> = {
  red:    '#ff2222',
  green:  '#22cc44',
  blue:   '#2244ff',
  yellow: '#ffdd00',
  orange: '#ff8800',
  white:  '#f0f8ff',
  amber:  '#ffaa00',
  purple: '#9922cc',
  uv:     '#6600cc',
  pink:   '#ff66aa',
};

export interface LEDColorVars {
  '--pp-lens-color': string;
}

export function getLEDColorVars(colorValue: string): LEDColorVars {
  const normalized = colorValue?.toLowerCase() ?? '';
  for (const [key, hex] of Object.entries(COLOR_MAP)) {
    if (normalized.includes(key)) {
      return { '--pp-lens-color': hex };
    }
  }
  return { '--pp-lens-color': '#ff2222' }; // default red
}
