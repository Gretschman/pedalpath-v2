// CapacitorBodySelector — maps component type/value/package to a sprite ID

export type CapacitorSpriteId =
  | 'capacitor-electrolytic'
  | 'capacitor-ceramic-disc'
  | 'capacitor-film'
  | 'capacitor-tantalum';

export function getCapacitorSpriteId(
  package_: string,
  value: string,
): CapacitorSpriteId {
  const pkg = package_?.toLowerCase() ?? '';
  const val = value?.toLowerCase() ?? '';

  // Explicit package field (from AI output contract)
  if (pkg === 'electrolytic') return 'capacitor-electrolytic';
  if (pkg === 'ceramic-disc' || pkg === 'ceramic') return 'capacitor-ceramic-disc';
  if (pkg === 'film')         return 'capacitor-film';
  if (pkg === 'tantalum')     return 'capacitor-tantalum';

  // Fallback: infer from value when package is missing/wrong
  if (val.includes('tant')) return 'capacitor-tantalum';

  // Electrolytic: polarized and large value (≥1µF)
  const electrolyticPattern = /^\d+(\.\d+)?\s*u/i;
  if (electrolyticPattern.test(val)) return 'capacitor-electrolytic';

  // Small values → ceramic disc
  const smallPattern = /^\d+(\.\d+)?\s*p/i;
  if (smallPattern.test(val)) return 'capacitor-ceramic-disc';
  const nanoPattern = /^\d+(\.\d+)?\s*n/i;
  if (nanoPattern.test(val)) return 'capacitor-ceramic-disc';

  return 'capacitor-film'; // default for ambiguous mid-range values
}
