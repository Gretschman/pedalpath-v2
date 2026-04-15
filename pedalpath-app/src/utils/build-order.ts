// build-order.ts — Phase 1 build guide sort logic
// Two modes: signal-flow (by circuit section) and build-order (by component type, shortest-to-tallest)

import type { BOMComponent, BomSection } from '@/types/bom.types';

// ── Step interface ────────────────────────────────────────────────────────────

export interface BreadboardStep {
  number: number;
  section: BomSection;
  title: string;
  /** One or two sentences explaining WHY this step matters. */
  why: string;
  items: BOMComponent[];
  tips?: string;
  warning?: string;
}

// ── Section order & metadata (signal-flow mode) ──────────────────────────────

export const SECTION_ORDER: BomSection[] = ['power', 'input', 'active', 'clipping', 'tone', 'output'];

export const SECTION_META: Record<BomSection, { title: string; why: string; tips?: string; warning?: string }> = {
  power: {
    title: 'Power Section',
    why: 'Filters noise from the power supply and protects the circuit from reverse polarity damage.',
    warning: 'Electrolytic capacitors are polarized — negative leg to ground. Verify power polarity before connecting.',
  },
  input: {
    title: 'Input',
    why: 'Blocks DC from your guitar while passing signal. The pulldown resistor (~1MΩ) prevents a loud pop when switching the effect on.',
    tips: 'The input coupling capacitor value sets how much low-frequency content enters the circuit.',
  },
  active: {
    title: 'Active Stage',
    why: 'The gain core. Transistors and ICs amplify or shape the signal; bias resistors set their operating point.',
    tips: 'ICs straddle the center gap — pin 1 at the notch or dot. Touch grounded metal before handling ICs.',
    warning: 'Static electricity can damage ICs. Handle by the body, not the pins.',
  },
  clipping: {
    title: 'Clipping Stage',
    why: 'Signal diodes shunt peaks to ground, creating the clipping and overdrive character of the effect.',
    tips: 'The stripe on a diode marks the cathode. Current flows anode → cathode (toward the stripe).',
  },
  tone: {
    title: 'Tone Controls',
    why: 'Shapes the frequency response — cut highs, boost lows, or sweep a frequency band.',
    tips: 'Wire pots with jumper wires for breadboard testing. Left lug = GND, center = wiper, right = signal.',
  },
  output: {
    title: 'Output',
    why: 'Sets the final output level and routes the processed signal to your amplifier.',
    tips: 'Test with guitar in and amp on output. Keep volume LOW on first power-up.',
  },
};

// ── Off-board component types (excluded from both modes) ─────────────────────

const OFF_BOARD_TYPES = new Set(['input-jack', 'output-jack', 'dc-jack', 'footswitch']);

function filterBoardComponents(components: BOMComponent[]): BOMComponent[] {
  return components.filter(c => !OFF_BOARD_TYPES.has(c.component_type));
}

// ── inferSection — assign a circuit section to a component ───────────────────

export function inferSection(c: BOMComponent): BomSection {
  if (c.section) return c.section;
  const t = c.component_type;
  const v = c.value.toLowerCase();
  if (t === 'dc-jack') return 'power';
  if (t === 'input-jack') return 'input';
  if (t === 'output-jack' || t === 'footswitch' || t === 'led') return 'output';
  if (t === 'transistor' || t === 'ic' || t === 'op-amp') return 'active';
  if (t === 'potentiometer') return 'tone';
  if (t === 'diode') {
    if (/4001|4004|4007|5817|5819/.test(v)) return 'power';
    return 'clipping';
  }
  if (t === 'capacitor') {
    const m = v.match(/(\d+\.?\d*)\s*(?:uf?|µf?)/i);
    if (m && parseFloat(m[1]) >= 47) return 'power';
    return 'active';
  }
  return 'active';
}

// ── Signal-flow sort ─────────────────────────────────────────────────────────

/** Group components by circuit section (power→input→active→clipping→tone→output). */
export function sortBySignalFlow(components: BOMComponent[]): BreadboardStep[] {
  const board = filterBoardComponents(components);

  const rawSteps = SECTION_ORDER
    .map(sec => {
      const meta = SECTION_META[sec];
      return {
        section: sec,
        title: meta.title,
        why: meta.why,
        items: board.filter(c => inferSection(c) === sec),
        tips: meta.tips,
        warning: meta.warning,
      };
    })
    .filter(s => s.items.length > 0);

  return rawSteps.map((s, i) => ({ ...s, number: i + 1 }));
}

// ── Build-order sort (shortest-to-tallest) ───────────────────────────────────

interface BuildOrderGroup {
  title: string;
  why: string;
  tips?: string;
  warning?: string;
  filter: (c: BOMComponent) => boolean;
}

/** Whether a capacitor package is polarized (electrolytic or tantalum). */
function isPolarizedCap(c: BOMComponent): boolean {
  const pkg = (c.package ?? '').toLowerCase();
  return pkg === 'electrolytic' || pkg === 'tantalum';
}

/** Whether a capacitor package is non-polarized (ceramic, film, or unspecified). */
function isNonPolarizedCap(c: BOMComponent): boolean {
  const pkg = (c.package ?? '').toLowerCase();
  return pkg === 'ceramic-disc' || pkg === 'film' || pkg === '';
}

const BUILD_ORDER_GROUPS: BuildOrderGroup[] = [
  {
    title: 'Resistors',
    why: 'Resistors are the lowest-profile components. Place them first so they lay flat against the board when flipped for soldering.',
    filter: c => c.component_type === 'resistor',
  },
  {
    title: 'Diodes',
    why: 'Diodes are small but polarized — the stripe marks the cathode. Match the stripe to the band marking on the board.',
    warning: 'Check the stripe orientation on every diode before soldering.',
    filter: c => c.component_type === 'diode',
  },
  {
    title: 'IC Sockets',
    why: 'Place sockets now but do NOT insert the ICs yet. Sockets protect heat-sensitive chips from soldering iron damage.',
    warning: 'Align the notch on the socket with the notch on the PCB silkscreen. Do NOT insert IC chips until all soldering is complete.',
    filter: c => c.component_type === 'ic' || c.component_type === 'op-amp',
  },
  {
    title: 'Non-Polarized Capacitors',
    why: 'These capacitors can go in either direction — no polarity to worry about. Ceramic discs are the smallest, films are slightly taller.',
    filter: c => c.component_type === 'capacitor' && isNonPolarizedCap(c),
  },
  {
    title: 'Transistors',
    why: 'Match the flat face of the transistor to the flat side shown on the board layout. Pin order varies by part number — check the pinout.',
    warning: 'Transistors are orientation-critical. A backwards transistor won\'t damage anything but the circuit won\'t work.',
    filter: c => c.component_type === 'transistor',
  },
  {
    title: 'Electrolytic Capacitors',
    why: 'These are the tallest through-hole components. They ARE polarized — the longer lead is positive, the stripe marks negative.',
    warning: 'Installing electrolytic capacitors backwards can cause them to fail or leak. Double-check polarity.',
    filter: c => c.component_type === 'capacitor' && isPolarizedCap(c),
  },
  {
    title: 'LEDs',
    why: 'The longer lead is the anode (+). The flat side of the lens marks the cathode (−).',
    filter: c => c.component_type === 'led',
  },
  {
    title: 'Controls',
    why: 'Panel-mount components connect to the board last. Snap off the alignment tab on each pot with pliers before mounting.',
    filter: c => c.component_type === 'potentiometer' || c.component_type === 'switch',
  },
];

/** Group components by type in PCB assembly order (shortest-to-tallest). */
export function sortByBuildOrder(components: BOMComponent[]): BreadboardStep[] {
  const board = filterBoardComponents(components);

  const rawSteps = BUILD_ORDER_GROUPS
    .map(group => ({
      section: 'active' as BomSection,
      title: group.title,
      why: group.why,
      items: board.filter(group.filter),
      tips: group.tips,
      warning: group.warning,
    }))
    .filter(s => s.items.length > 0);

  return rawSteps.map((s, i) => ({ ...s, number: i + 1 }));
}
