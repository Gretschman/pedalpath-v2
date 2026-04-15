/**
 * component-descriptions.ts
 *
 * Plain-English descriptions of what a component does in a specific
 * circuit section, plus orientation/polarity guidance for builders.
 */

import type { BomSection, ComponentType } from '../types/bom.types';

// ── Role descriptions keyed by ComponentType → BomSection ─────────────────

const roleMap: Partial<Record<ComponentType, Partial<Record<BomSection, string>>>> = {
  resistor: {
    power: 'Limits current to protect the circuit from power surges.',
    input: "Sets the input impedance \u2014 how the pedal 'listens' to your guitar signal.",
    active: 'Sets the bias point for the gain stage, controlling how the transistor or op-amp amplifies.',
    clipping: 'Works with the diodes to set the clipping threshold and distortion character.',
    tone: 'Part of the tone filter network \u2014 shapes which frequencies pass through.',
    output: 'Sets the output impedance and signal level sent to your amp.',
  },
  capacitor: {
    power: 'Filters noise from the power supply to keep the circuit quiet.',
    input: 'Blocks DC voltage while passing the guitar signal (coupling cap).',
    active: 'Shapes the frequency response of the gain stage.',
    clipping: "Sets which frequencies get clipped, affecting the distortion's tonal character.",
    tone: 'Part of the tone filter \u2014 determines the cutoff frequency with the resistors.',
    output: 'Blocks DC while passing the final audio signal to the output jack.',
  },
  diode: {
    power: 'Protects the circuit from reverse-polarity power connections.',
    clipping: 'Clips the signal peaks to create distortion or overdrive.',
  },
  transistor: {
    power: 'Regulates voltage for the circuit (voltage regulator).',
    input: 'Buffers the guitar signal to prevent tone loss.',
    active: 'Amplifies the guitar signal \u2014 the heart of the gain stage.',
    clipping: 'Drives the clipping stage with amplified signal.',
    output: 'Buffers the output signal for consistent volume.',
  },
  ic: {
    power: 'Regulates or doubles the supply voltage.',
    input: 'Buffers the input signal with low noise.',
    active: 'Amplifies the signal with precise gain control.',
    clipping: 'Drives the clipping diodes with adjustable gain.',
    tone: 'Active tone filter for precise EQ shaping.',
    output: 'Buffers the output for low-impedance drive.',
  },
  'op-amp': {
    power: 'Regulates or doubles the supply voltage.',
    input: 'Buffers the input signal with low noise.',
    active: 'Amplifies the signal with precise gain control.',
    clipping: 'Drives the clipping diodes with adjustable gain.',
    tone: 'Active tone filter for precise EQ shaping.',
    output: 'Buffers the output for low-impedance drive.',
  },
  potentiometer: {
    active: 'Controls the amount of gain (drive/distortion knob).',
    clipping: 'Adjusts the clipping intensity.',
    tone: 'Controls the tone \u2014 sweeps the EQ filter cutoff.',
    output: 'Controls the output volume level.',
  },
  led: {
    power: 'Indicates power is on.',
    clipping: 'Used as a clipping element \u2014 LEDs clip at ~1.8V for softer distortion.',
    output: 'Indicates the effect is engaged.',
  },
};

/**
 * Returns a concise, builder-friendly sentence describing what a
 * component does in a given circuit section.
 *
 * @param type    - The component type (resistor, capacitor, etc.)
 * @param section - The circuit section (power, input, active, etc.)
 * @param value   - Optional component value (currently unused but
 *                  reserved for future value-aware descriptions)
 */
export function describeComponentRole(
  type: ComponentType,
  section: BomSection,
  _value?: string,
): string {
  const sectionMap = roleMap[type];
  if (sectionMap) {
    const description = sectionMap[section];
    if (description) return description;
  }

  // Generic fallback for uncommon type/section pairings
  const sectionLabel: Record<BomSection, string> = {
    power: 'power supply',
    input: 'input',
    active: 'gain',
    clipping: 'clipping',
    tone: 'tone',
    output: 'output',
  };

  return `Part of the ${sectionLabel[section]} stage circuitry.`;
}

// ── Orientation / polarity guidance ───────────────────────────────────────

const ELECTROLYTIC_KEYWORDS = ['electrolytic', 'tantalum', 'polar', 'elko'];

/**
 * Returns a short orientation instruction for polarized or keyed
 * components, or null if the component is non-polarized and can
 * be placed in either direction.
 *
 * @param type - The component type
 * @param pkg  - Optional package descriptor (e.g. "electrolytic",
 *               "ceramic-disc", "film", "to92", "dip8")
 */
export function getOrientationGuide(
  type: ComponentType,
  pkg?: string,
): string | null {
  switch (type) {
    case 'resistor':
      return null;

    case 'capacitor': {
      if (!pkg) return null;
      const lower = pkg.toLowerCase();
      const isPolarized = ELECTROLYTIC_KEYWORDS.some((kw) => lower.includes(kw));
      return isPolarized
        ? 'Negative stripe faces the ground rail. Longer lead is positive.'
        : null;
    }

    case 'diode':
      return 'Stripe marks the cathode (negative). Match stripe to the band on the layout.';

    case 'led':
      return 'Flat side of the lens is the cathode. Longer lead is the anode (positive).';

    case 'transistor':
      return 'Flat face toward you. Pin order varies by part \u2014 check the pinout diagram.';

    case 'ic':
    case 'op-amp':
      return 'Notch or dot marks pin 1. Align with the socket or board marking.';

    default:
      return null;
  }
}
