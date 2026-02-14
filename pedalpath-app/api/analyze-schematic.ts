import Anthropic from '@anthropic-ai/sdk';
import type { VercelRequest, VercelResponse } from '@vercel/node';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image_base64, image_type } = req.body;

    // Validate inputs
    if (!image_base64 || !image_type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: image_base64 and image_type'
      });
    }

    // Validate image type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(image_type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid image type: ${image_type}. Supported types: ${validTypes.join(', ')}`
      });
    }

    // Initialize Anthropic (server-side - secure!)
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not configured');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error: API key not found'
      });
    }

    const client = new Anthropic({
      apiKey,
    });

    // Try models in order of preference
    // This ensures we use the best available model that actually works
    const MODELS_TO_TRY = [
      'claude-3-5-sonnet-latest',        // Always points to latest Sonnet 3.5
      'claude-3-5-sonnet-20241022',      // Original (in case it comes back)
      'claude-3-opus-20240229',          // Stable fallback with vision support
      'claude-3-sonnet-20240229',        // Older but reliable
    ];

    let response;
    let lastError;

    for (const modelName of MODELS_TO_TRY) {
      try {
        console.log(`Attempting to use model: ${modelName}`);

        response = await client.messages.create({
          model: modelName,
          max_tokens: 4096,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: image_type,
                    data: image_base64,
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

        // If we got here, the model worked!
        console.log(`Successfully used model: ${modelName}`);
        break; // Exit loop on success

      } catch (error: any) {
        lastError = error;
        console.warn(`Model ${modelName} failed:`, error.message);

        // If this is the last model in the list, throw the error
        if (modelName === MODELS_TO_TRY[MODELS_TO_TRY.length - 1]) {
          throw error;
        }

        // Otherwise, continue to next model
        continue;
      }
    }

    if (!response) {
      throw new Error(`All models failed. Last error: ${lastError?.message || 'Unknown error'}`);
    }

    // Extract text from response
    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return res.status(500).json({
        success: false,
        error: 'No text content in Claude response',
      });
    }

    const rawText = textContent.text;

    // Parse JSON response
    try {
      // Try to extract JSON if Claude wrapped it in markdown
      const jsonMatch = rawText.match(/```json\n([\s\S]*?)\n```/) || rawText.match(/```\n([\s\S]*?)\n```/);
      const jsonText = jsonMatch ? jsonMatch[1] : rawText;

      const parsed = JSON.parse(jsonText);

      const bomData = {
        components: parsed.components || [],
        enclosure: parsed.enclosure,
        power: parsed.power,
        parsed_at: new Date(),
        confidence_score: parsed.confidence_score || 0,
      };

      // Validate that we got some components
      if (!bomData.components || bomData.components.length === 0) {
        return res.status(200).json({
          success: false,
          error: 'No components detected in the schematic. Please ensure the image is clear and contains a valid schematic.',
          raw_response: rawText,
        });
      }

      return res.status(200).json({
        success: true,
        bom_data: bomData,
        raw_response: rawText,
      });

    } catch (parseError) {
      console.error('Failed to parse Claude response as JSON:', parseError);
      console.error('Raw response:', rawText);

      return res.status(200).json({
        success: false,
        error: 'Failed to parse schematic analysis. The AI response was not in the expected format.',
        raw_response: rawText,
      });
    }

  } catch (error: any) {
    console.error('Error analyzing schematic:', error);

    // Log detailed error information for debugging
    console.error('Error details:', {
      name: error?.name,
      message: error?.message,
      status: error?.status,
      type: error?.type,
      request_id: error?.request_id,
    });

    // Check if it's an Anthropic API error
    if (error?.status === 404 && error?.message?.includes('model')) {
      return res.status(500).json({
        success: false,
        error: 'The AI model is temporarily unavailable. Please try again in a few moments.',
        details: 'Model not found - this has been logged and will be addressed.',
      });
    }

    // Check if it's an authentication error
    if (error?.status === 401 || error?.message?.includes('authentication')) {
      console.error('CRITICAL: Anthropic API key authentication failed');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error. Please contact support.',
        details: 'API authentication failed',
      });
    }

    // Generic error response
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred during schematic analysis.',
      details: 'An unexpected error occurred. This has been logged.',
    });
  }
}
