import Anthropic from '@anthropic-ai/sdk';
import type {
  SchematicAnalysisRequest,
  SchematicAnalysisResponse,
  BOMData,
  BOMComponent,
} from '../types/bom.types';

// Initialize Anthropic client
const getAnthropicClient = () => {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
    throw new Error('Anthropic API key not configured. Please add VITE_ANTHROPIC_API_KEY to your .env.local file.');
  }

  return new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true, // Required for client-side usage
  });
};

// System prompt for schematic analysis
const SCHEMATIC_ANALYSIS_PROMPT = `You are an expert in guitar effects pedal circuits and electronic schematics. Analyze this guitar effects pedal schematic and extract ALL components needed to build it.

Return a structured JSON response with the following format:

{
  "components": [
    {
      "component_type": "resistor" | "capacitor" | "diode" | "transistor" | "ic" | "op-amp" | "input-jack" | "output-jack" | "dc-jack" | "footswitch" | "potentiometer" | "led" | "switch" | "other",
      "value": "10k" | "100nF" | "2N3904" | "TL072" | etc.,
      "quantity": 1,
      "reference_designators": ["R1", "R2"],
      "confidence": 95,
      "notes": "Optional notes about the component"
    }
  ],
  "enclosure": {
    "size": "1590B" | "125B" | "1590BB" | etc.,
    "drill_count": 6,
    "notes": "Recommended based on component count and controls"
  },
  "power": {
    "voltage": "9V" | "18V" | "9-18V",
    "current": "20mA",
    "polarity": "center-negative" | "center-positive"
  },
  "confidence_score": 85
}

CRITICAL REQUIREMENTS:
1. Extract EVERY component visible in the schematic including:
   - All resistors (with values like 10k, 1M, 470Ω)
   - All capacitors (with values like 100nF, 10µF, 47pF)
   - All semiconductors (transistors, diodes, ICs, op-amps)
   - Input/output jacks (typically 1/4" mono or stereo)
   - DC power jack (typically 2.1mm barrel jack)
   - Footswitch (typically 3PDT for true bypass)
   - All potentiometers with taper (e.g., "100kB" for audio taper, "100kA" for linear)
   - LEDs for indicators
   - Any switches

2. Group identical components together:
   - If there are three 10k resistors, list as quantity: 3 with all reference designators

3. Provide confidence scores (0-100) for each component based on:
   - How clearly the value is marked
   - Standard component marking conventions
   - Context from the circuit

4. For the enclosure recommendation:
   - Count the number of off-board components (pots, switches, jacks, LEDs)
   - 1590B: 3-4 knobs, compact
   - 125B: 3-5 knobs, standard size
   - 1590BB: 5+ knobs or complex layouts

5. Standard power for guitar pedals is 9V center-negative unless marked otherwise

6. Return ONLY valid JSON, no additional text or markdown formatting.`;

/**
 * Analyze a schematic image using Claude Vision API
 */
export async function analyzeSchematic(
  request: SchematicAnalysisRequest
): Promise<SchematicAnalysisResponse> {
  try {
    const client = getAnthropicClient();

    // Call Claude Vision API
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: request.image_type,
                data: request.image_base64,
              },
            },
            {
              type: 'text',
              text: SCHEMATIC_ANALYSIS_PROMPT,
            },
          ],
        },
      ],
    });

    // Extract text from response
    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in Claude response');
    }

    const rawText = textContent.text;

    // Parse JSON response
    let bomData: BOMData;
    try {
      // Try to extract JSON if Claude wrapped it in markdown
      const jsonMatch = rawText.match(/```json\n([\s\S]*?)\n```/) || rawText.match(/```\n([\s\S]*?)\n```/);
      const jsonText = jsonMatch ? jsonMatch[1] : rawText;

      const parsed = JSON.parse(jsonText);

      bomData = {
        components: parsed.components || [],
        enclosure: parsed.enclosure,
        power: parsed.power,
        parsed_at: new Date(),
        confidence_score: parsed.confidence_score || 0,
      };
    } catch (parseError) {
      console.error('Failed to parse Claude response as JSON:', parseError);
      console.error('Raw response:', rawText);

      return {
        success: false,
        error: 'Failed to parse schematic analysis. The AI response was not in the expected format.',
        raw_response: rawText,
      };
    }

    // Validate that we got some components
    if (!bomData.components || bomData.components.length === 0) {
      return {
        success: false,
        error: 'No components detected in the schematic. Please ensure the image is clear and contains a valid schematic.',
        raw_response: rawText,
      };
    }

    return {
      success: true,
      bom_data: bomData,
      raw_response: rawText,
    };

  } catch (error) {
    console.error('Error analyzing schematic with Claude Vision:', error);

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
