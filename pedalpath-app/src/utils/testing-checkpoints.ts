import type {
  BOMData,
  BOMComponent,
  BomSection,
  TestCheckpoint,
} from '@/types/bom.types';

const SECTION_ORDER: BomSection[] = ['power', 'input', 'active', 'clipping', 'tone', 'output'];

/**
 * Extract the first numeric value from a voltage string like "9V", "18V", "9-18V", "+9V".
 * Returns 9 if the string is unparseable.
 */
function parseVoltageNumber(voltage: string): number {
  const match = voltage.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 9;
}

/**
 * Generate testing checkpoints to inject between build sections based on BOM contents.
 * Checkpoints are returned in section order: power → input → active → clipping → tone → output.
 */
export function generateCheckpoints(bomData: BOMData): TestCheckpoint[] {
  const voltage = bomData.power?.voltage ?? '9V';
  const polarity = bomData.power?.polarity ?? 'center-negative';
  const volts = parseVoltageNumber(voltage);
  const halfV = volts / 2;

  const checkpoints: TestCheckpoint[] = [];

  // 1. Always: Power Supply Check
  checkpoints.push({
    afterSection: 'power',
    title: 'Power Supply Check',
    instructions: `Connect your ${voltage} power supply (${polarity}). Do NOT connect guitar or amp yet.`,
    expectedResult:
      'LED should light up (if present). No components should get hot. If anything gets warm, disconnect immediately and check polarized component orientation.',
    voltageChecks: [
      { point: 'Positive power rail', expected: voltage },
      { point: 'Ground rail', expected: '0V' },
    ],
  });

  // Gather component info for conditional checkpoints
  const transistors = bomData.components.filter(
    (c: BOMComponent) => c.component_type === 'transistor'
  );
  const ics = bomData.components.filter(
    (c: BOMComponent) => c.component_type === 'ic' || c.component_type === 'op-amp'
  );
  const trimPots = bomData.components.filter(
    (c: BOMComponent) =>
      c.component_type === 'potentiometer' &&
      (/trim/i.test(c.value) || /trim/i.test(c.notes ?? ''))
  );

  // 2. If BOM has transistors: Gain Stage Voltage Check
  if (transistors.length > 0) {
    const voltageChecks = transistors.flatMap((t: BOMComponent) =>
      t.reference_designators.map((ref) => ({
        point: `${ref} Collector`,
        expected: `~${halfV}V`,
      }))
    );

    checkpoints.push({
      afterSection: 'active',
      title: 'Gain Stage Voltage Check',
      instructions:
        'With power connected, use a multimeter set to DC voltage. Touch the black probe to ground. Touch the red probe to each transistor pin.',
      expectedResult: `Collector voltage should read approximately half of supply voltage (~${halfV}V). If collector reads 0V or full supply voltage, the transistor may be inserted backwards or a bias resistor is wrong.`,
      voltageChecks,
    });
  }

  // 3. If BOM has ICs/op-amps: IC Voltage Check
  if (ics.length > 0) {
    checkpoints.push({
      afterSection: 'active',
      title: 'IC Voltage Check',
      instructions:
        "Verify the IC is receiving power. Measure voltage on the IC's V+ pin (usually pin 8 for DIP-8) and V- pin (usually pin 4).",
      expectedResult: `V+ should read ${voltage}, V- should read 0V. Output pins should read approximately half supply (~${halfV}V) at rest.`,
      voltageChecks: [
        { point: 'IC V+ pin', expected: voltage },
        { point: 'IC V- pin', expected: '0V' },
        { point: 'IC output pin(s)', expected: `~${halfV}V` },
      ],
    });
  }

  // 5. If BOM has trim pots: Bias Trim Adjustment (listed before output but after active)
  if (trimPots.length > 0) {
    checkpoints.push({
      afterSection: 'active',
      title: 'Bias Trim Adjustment',
      instructions:
        'Using a small flathead screwdriver, slowly adjust the trim pot. If a target voltage is specified in the schematic, measure with a multimeter. Otherwise, adjust by ear for the best sound — start from the center position.',
      expectedResult:
        'The trim pot fine-tunes the operating point. You should hear the effect character change as you adjust. Find the sweet spot where the effect sounds fullest without gating or sputtering.',
    });
  }

  // 4. Always: Audio Signal Test
  checkpoints.push({
    afterSection: 'output',
    title: 'Audio Signal Test',
    instructions:
      'Connect your guitar to the input jack and your amp to the output jack. Set amp volume low. Turn all pedal knobs to noon (12 o\'clock). Engage the effect.',
    expectedResult:
      'You should hear your guitar signal, modified by the effect. Turn each knob through its full range to verify all controls work. If you hear nothing, check: (1) input/output jack wiring, (2) footswitch wiring, (3) that the LED lights when engaged.',
  });

  // Sort by section order; preserve insertion order for same-section checkpoints
  checkpoints.sort(
    (a, b) => SECTION_ORDER.indexOf(a.afterSection) - SECTION_ORDER.indexOf(b.afterSection)
  );

  return checkpoints;
}
