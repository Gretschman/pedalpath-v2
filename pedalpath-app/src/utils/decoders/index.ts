/**
 * Component decoders barrel export
 *
 * Provides bidirectional decoding/encoding for electronic components:
 *  - Resistors: color bands ↔ ohm values
 *  - Capacitors: markings ↔ capacitance values
 *  - ICs: part numbers → pinout (stub)
 *  - Diodes: part numbers → specs (stub)
 */

// Resistor decoder
export {
  decodeResistor,
  encodeResistor,
  findESeries,
  formatOhms,
  TOLERANCE_TO_COLOR,
} from './resistor-decoder';

// Capacitor decoder
export {
  decodeCapacitor,
  encodeCapacitor,
  decodeWithType,
  pfToUnits,
  nfToUnits,
  ufToUnits,
  formatCapacitance,
} from './capacitor-decoder';

// IC decoder
export { decodeIC, listKnownICs } from './ic-decoder';

// Diode decoder (stub)
export { decodeDiode, decodeLED } from './diode-decoder';

// Re-export types for convenience
export type {
  ResistorSpec,
  ResistorColor,
  EncodedResistor,
  CapacitorSpec,
  CapUnit,
  EncodedCapacitor,
  ICSpec,
  DiodeSpec,
  LEDSpec,
  AnyComponentSpec,
} from '@/types/component-specs.types';

export { CapType } from '@/types/component-specs.types';
