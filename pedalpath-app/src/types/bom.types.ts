// BOM (Bill of Materials) type definitions

export type BomSection = 'power' | 'input' | 'active' | 'clipping' | 'tone' | 'output';

export type ComponentType =
  | 'resistor'
  | 'capacitor'
  | 'diode'
  | 'transistor'
  | 'ic'
  | 'op-amp'
  | 'input-jack'
  | 'output-jack'
  | 'dc-jack'
  | 'footswitch'
  | 'potentiometer'
  | 'led'
  | 'switch'
  | 'other';

export interface BOMComponent {
  id?: string;
  component_type: ComponentType;
  value: string; // e.g., "10k", "100nF", "2N3904", "TL072"
  quantity: number;
  reference_designators: string[]; // e.g., ["R1", "R2", "C3"]
  part_number?: string;
  supplier?: string;
  supplier_url?: string;
  confidence?: number; // 0-100, from AI parsing
  section?: BomSection; // Circuit functional section
  notes?: string;
  verified?: boolean; // User confirmed accuracy
  package?: string;  // "axial" | "electrolytic" | "ceramic-disc" | "film" | "tantalum" | "to92" | "to18" | "dip8" | "dip14" | "dip16" | "ts" | "barrel" | "alpha-round" | "stomp" | "led-5mm" | "led-3mm"
  package_type?: string; // Visual taxonomy key → SVG selector: "resistor" | "capacitor-electrolytic" | "capacitor-ceramic" | "capacitor-film" | "led" | "transistor" | "ic" | "diode" | "potentiometer" | "switch" | "transformer" | "inductor" | "crystal" | "fuse" | "relay" | "connector" | "ferrite" | "generic"
  material?: string; // "Ge" for germanium transistors
}

export interface EnclosureRecommendation {
  size: string; // e.g., "1590B", "125B"
  drill_count: number;
  notes?: string;
}

export interface PowerRequirements {
  voltage: string; // e.g., "9V", "18V", "9-18V"
  current?: string; // e.g., "20mA"
  polarity: 'center-negative' | 'center-positive';
}

export interface BOMData {
  components: BOMComponent[];
  enclosure?: EnclosureRecommendation;
  power?: PowerRequirements;
  total_cost_estimate?: number;
  parsed_at: Date;
  confidence_score: number; // Overall confidence 0-100
}

// ── Build Guide Types ──────────────────────────────────────────────────────

export type BuildMode = 'signal-flow' | 'build-order';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface DifficultyFactor {
  label: string;
  points: number;
}

export interface DifficultyScore {
  level: DifficultyLevel;
  numericScore: number;
  factors: DifficultyFactor[];
}

export interface TestCheckpoint {
  afterSection: BomSection;
  title: string;
  instructions: string;
  expectedResult: string;
  voltageChecks?: { point: string; expected: string }[];
}

export interface PinVoltageRef {
  partNumber: string;
  pins: { pin: string; name: string; expectedV: string; tolerance?: string }[];
  supplyVoltage: string;
  circuitContext: string;
}

export interface SchematicAnalysisRequest {
  image_base64: string;
  image_type: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
}

export interface SchematicAnalysisResponse {
  success: boolean;
  bom_data?: BOMData;
  error?: string;
  raw_response?: string; // For debugging
}
