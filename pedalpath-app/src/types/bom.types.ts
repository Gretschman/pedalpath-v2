// BOM (Bill of Materials) type definitions

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
  notes?: string;
  verified?: boolean; // User confirmed accuracy
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
