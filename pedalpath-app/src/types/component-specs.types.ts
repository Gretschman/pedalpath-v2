/**
 * Component specification types for PedalPath v2
 * Ported from Python decoders (resistor_decoder.py, capacitor_decoder.py)
 *
 * These types define the visual specifications returned by decoders,
 * used by SVG rendering components to draw realistic components.
 */

// ===========================================================================
// Base Types
// ===========================================================================

export type ComponentType = 'resistor' | 'capacitor' | 'diode' | 'ic' | 'transistor' | 'led';

export interface ComponentSpec {
  type: ComponentType;
  value: string;
  label?: string;
}

// ===========================================================================
// Resistor Types
// ===========================================================================

export type ResistorColor =
  | 'black'
  | 'brown'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'violet'
  | 'purple'  // alias for violet
  | 'gray'
  | 'grey'    // alias for gray
  | 'white'
  | 'gold'
  | 'silver';

export interface ColorBand {
  color: ResistorColor;
  hex: string;
  position: number;
}

export interface ResistorSpec extends ComponentSpec {
  type: 'resistor';
  ohms: number;
  tolerancePercent?: number;
  bands: ResistorColor[];
  eSeriesMatch?: string;        // "E12", "E24", "E48", "E96"
  nearestStandard?: number;     // Nearest E-series value if non-standard
  powerRating?: string;         // "0.25W", "0.5W", etc.
  physicalSize?: 'small' | 'medium' | 'large';
}

export interface EncodedResistor {
  ohms: number;
  bands5: ResistorColor[];
  bands4?: ResistorColor[];     // null if value needs 3 sig digits
  toleranceColor: ResistorColor;
  tolerancePercent: number;
}

// ===========================================================================
// Capacitor Types
// ===========================================================================

export enum CapType {
  FilmBox = 'film_box',
  Ceramic = 'ceramic',
  Electrolytic = 'electrolytic',
  Tantalum = 'tantalum',
  Unknown = 'unknown',
}

export interface CapUnit {
  pf: number;
  nf: number;
  uf: number;
}

export interface CapacitorSpec extends ComponentSpec {
  type: 'capacitor';
  capacitance: CapUnit;
  capType: CapType;
  polarized: boolean;
  tolerancePercent?: number;
  toleranceLetter?: string;
  voltageMax?: number;
  physicalSize?: 'small' | 'medium' | 'large';
  color?: string;               // Body color hex code
  marking?: string;             // Text printed on body
  sourceCode?: string;          // Original marking that was decoded
  confidence?: number;          // 0.0-1.0
}

export interface EncodedCapacitor {
  capacitance: CapUnit;
  eiaCode: string;              // e.g. "473"
  alphaCode: string;            // e.g. "47n"
  fullFilmCode: string;         // e.g. "473K100"
  fullAlphaCode: string;        // e.g. "47nK100"
  toleranceLetter: string;
  voltage?: number;
}

// ===========================================================================
// IC Types
// ===========================================================================

export interface PinInfo {
  number: number;
  name: string;
  description?: string;
}

export interface ICSpec extends ComponentSpec {
  type: 'ic';
  partNumber: string;
  pinCount: 8 | 14 | 16;
  pinout: PinInfo[];
  description: string;
  manufacturer?: string;
}

// ===========================================================================
// Diode Types
// ===========================================================================

export type DiodeType = 'signal' | 'rectifier' | 'zener' | 'led';

export interface DiodeSpec extends ComponentSpec {
  type: 'diode';
  partNumber: string;
  diodeType: DiodeType;
  cathodeMarking: 'band' | 'stripe';
  color: string;
  voltage?: number;
}

export interface LEDSpec extends DiodeSpec {
  diodeType: 'led';
  ledColor: 'red' | 'green' | 'yellow' | 'blue' | 'white';
  size: '3mm' | '5mm';
}

// ===========================================================================
// Transistor Types
// ===========================================================================

export type TransistorType = 'bjt-npn' | 'bjt-pnp' | 'jfet-n' | 'jfet-p' | 'mosfet-n' | 'mosfet-p';

export interface TransistorSpec extends ComponentSpec {
  type: 'transistor';
  partNumber: string;
  transistorType: TransistorType;
  /** TO-18: Metal Can (Germanium, e.g. AC128). TO-92: D-shape (Silicon, e.g. BC547). TO-220: tab heatsink. */
  package: 'TO-92' | 'TO-18' | 'TO-220';
  pinout: string[];  // Pin order left to right, e.g. ['E', 'B', 'C'] or ['G', 'D', 'S']
}

// ===========================================================================
// Helper Types
// ===========================================================================

export type AnyComponentSpec =
  | ResistorSpec
  | CapacitorSpec
  | ICSpec
  | DiodeSpec
  | LEDSpec
  | TransistorSpec;
