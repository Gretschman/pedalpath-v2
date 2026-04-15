import type { BOMData, BOMComponent, DifficultyScore, DifficultyFactor, DifficultyLevel } from '@/types/bom.types';

const EXCLUDED_TYPES = new Set(['input-jack', 'output-jack', 'dc-jack', 'footswitch']);
const CHARGE_PUMP_PATTERNS = /tc1044|max1044|lt1054|icl7660|7660s/i;

function onBoardComponents(components: BOMComponent[]): BOMComponent[] {
  return components.filter(c => !EXCLUDED_TYPES.has(c.component_type));
}

function sumQuantity(components: BOMComponent[]): number {
  return components.reduce((sum, c) => sum + c.quantity, 0);
}

export function computeDifficulty(bomData: BOMData): DifficultyScore {
  const factors: DifficultyFactor[] = [];
  const onBoard = onBoardComponents(bomData.components);
  const totalCount = sumQuantity(onBoard);

  // 1. Component count complexity
  let countPoints: number;
  if (totalCount <= 10) countPoints = 1;
  else if (totalCount <= 20) countPoints = 2;
  else if (totalCount <= 30) countPoints = 3;
  else countPoints = 4;
  factors.push({ label: `${totalCount} on-board components`, points: countPoints });

  // 2. Polarized components
  const polarized = onBoard.filter(c =>
    c.package === 'electrolytic' ||
    c.package === 'tantalum' ||
    c.component_type === 'diode' ||
    c.component_type === 'led'
  );
  const polarizedCount = sumQuantity(polarized);
  if (polarizedCount > 0) {
    const pts = polarizedCount * 0.5;
    factors.push({ label: `${polarizedCount} polarized components require correct orientation`, points: pts });
  }

  // 3. IC count
  const ics = onBoard.filter(c => c.component_type === 'ic' || c.component_type === 'op-amp');
  const icCount = sumQuantity(ics);
  if (icCount > 0) {
    factors.push({ label: `${icCount} IC${icCount > 1 ? 's' : ''} require socket orientation`, points: icCount });
  }

  // 4. Transistor count
  const transistors = onBoard.filter(c => c.component_type === 'transistor');
  const transistorCount = sumQuantity(transistors);
  if (transistorCount > 0) {
    const pts = transistorCount * 0.75;
    factors.push({ label: `${transistorCount} transistor${transistorCount > 1 ? 's' : ''} require pinout matching`, points: pts });
  }

  // 5. Trim pot presence
  const hasTrimPot = onBoard.some(c =>
    /trim/i.test(c.value) ||
    (c.component_type === 'potentiometer' && c.notes && /trim/i.test(c.notes))
  );
  if (hasTrimPot) {
    factors.push({ label: 'Trim pots require bias adjustment', points: 1 });
  }

  // 6. Charge pump IC
  const hasChargePump = onBoard.some(c => CHARGE_PUMP_PATTERNS.test(c.value));
  if (hasChargePump) {
    factors.push({ label: 'Charge pump IC adds voltage rail complexity', points: 1.5 });
  }

  // 7. Germanium transistors
  const hasGermanium = onBoard.some(c =>
    c.component_type === 'transistor' && c.material === 'Ge'
  );
  if (hasGermanium) {
    factors.push({ label: 'Germanium transistors are heat-sensitive', points: 1 });
  }

  const numericScore = factors.reduce((sum, f) => sum + f.points, 0);

  let level: DifficultyLevel;
  if (numericScore < 5) level = 'beginner';
  else if (numericScore < 10) level = 'intermediate';
  else level = 'advanced';

  return { level, numericScore, factors };
}
