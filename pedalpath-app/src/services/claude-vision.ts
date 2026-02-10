import type {
  SchematicAnalysisRequest,
  SchematicAnalysisResponse,
  BOMComponent,
} from '../types/bom.types';

/**
 * Analyze a schematic image using Claude Vision API via backend
 */
export async function analyzeSchematic(
  request: SchematicAnalysisRequest
): Promise<SchematicAnalysisResponse> {
  try {
    // Call our backend API instead of Anthropic directly
    const response = await fetch('/api/analyze-schematic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Analysis failed: ${response.statusText}`);
    }

    return await response.json();

  } catch (error) {
    console.error('Error analyzing schematic:', error);

    if (error instanceof Error) {
      return {
        success: false,
        error: `Analysis failed: ${error.message}`,
      };
    }

    return {
      success: false,
      error: 'An unknown error occurred during schematic analysis.',
    };
  }
}

/**
 * Convert a File or Blob to base64 string
 */
export async function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Analyze a schematic file
 */
export async function analyzeSchematicFile(file: File): Promise<SchematicAnalysisResponse> {
  try {
    // Convert file to base64
    const base64Data = await fileToBase64(file);

    // Determine media type
    let mediaType: SchematicAnalysisRequest['image_type'];
    if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
      mediaType = 'image/jpeg';
    } else if (file.type === 'image/png') {
      mediaType = 'image/png';
    } else if (file.type === 'image/webp') {
      mediaType = 'image/webp';
    } else if (file.type === 'image/gif') {
      mediaType = 'image/gif';
    } else {
      throw new Error(`Unsupported file type: ${file.type}. Supported types: JPEG, PNG, WEBP, GIF`);
    }

    // Analyze with Claude Vision
    return await analyzeSchematic({
      image_base64: base64Data,
      image_type: mediaType,
    });

  } catch (error) {
    console.error('Error analyzing schematic file:', error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: 'Failed to process schematic file.',
    };
  }
}

/**
 * Calculate estimated total cost for BOM
 * This is a rough estimate based on typical component prices
 */
export function estimateBOMCost(components: BOMComponent[]): number {
  const prices: Record<string, number> = {
    resistor: 0.05,
    capacitor: 0.15,
    diode: 0.20,
    transistor: 0.50,
    ic: 2.00,
    'op-amp': 1.50,
    'input-jack': 1.50,
    'output-jack': 1.50,
    'dc-jack': 1.00,
    footswitch: 4.00,
    potentiometer: 2.00,
    led: 0.25,
    switch: 1.50,
    other: 0.50,
  };

  return components.reduce((total, component) => {
    const unitPrice = prices[component.component_type] || 0.50;
    return total + (unitPrice * component.quantity);
  }, 0);
}
