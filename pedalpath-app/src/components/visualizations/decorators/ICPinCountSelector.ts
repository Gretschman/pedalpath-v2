// ICPinCountSelector — maps IC type/value to correct DIP sprite

export type ICSpriteId = 'ic-dip8' | 'ic-dip14' | 'ic-dip16';

// Known IC types and their pin counts
const IC_PIN_MAP: Record<string, number> = {
  // 8-pin DIPs
  'tl071': 8, 'tl072': 8, 'jrc4558': 8, 'rc4558': 8, 'rc4559': 8,
  'ne5532': 8, 'lm308': 8, 'lm386': 8, 'lm741': 8, 'lf351': 8,
  'opa2134': 8, 'lm833': 8, 'njm4558': 8, 'mc4558': 8, 'ba4558': 8,
  'tc1044': 8, 'max1044': 8, 'icl7660': 8, 'lt1054': 8, 'lm358': 8,
  // 14-pin DIPs
  'tl074': 14, 'lf353': 14,
  // 16-pin DIPs
  'pt2399': 16, 'cd4049ube': 16, 'cd4049': 16,
};

export function getICSpriteId(value: string): ICSpriteId {
  const normalized = value?.toLowerCase().replace(/[^a-z0-9]/g, '') ?? '';

  for (const [part, pins] of Object.entries(IC_PIN_MAP)) {
    const partNorm = part.replace(/[^a-z0-9]/g, '');
    if (normalized.includes(partNorm) || partNorm.includes(normalized)) {
      if (pins <= 8)  return 'ic-dip8';
      if (pins <= 14) return 'ic-dip14';
      return 'ic-dip16';
    }
  }
  return 'ic-dip8'; // default: most pedal ICs are 8-pin
}
