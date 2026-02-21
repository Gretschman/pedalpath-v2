import Anthropic from '@anthropic-ai/sdk';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// System prompt — sets the role/persona for Claude
const SYSTEM_PROMPT = `You are an expert in guitar effects pedal circuits and electronic schematics. Your sole task is to analyze schematic images and extract component lists from what is actually visible in the image. You never invent, guess, or assume components that are not clearly shown in the image.`;

// User prompt — the actual analysis instruction sent with the image
const USER_PROMPT = `Analyze the guitar effects pedal schematic in the image above. Extract ALL components that are VISIBLY SHOWN in this specific image.

CRITICAL: Only report components you can actually see in THIS image. Do not use prior knowledge to fill in components that are not visible. If a value is hard to read, use your best estimate with a low confidence score rather than skipping it or substituting a different component.

Return a structured JSON response:

{
  "components": [
    {
      "component_type": "resistor" | "capacitor" | "diode" | "transistor" | "ic" | "op-amp" | "input-jack" | "output-jack" | "dc-jack" | "footswitch" | "potentiometer" | "led" | "switch" | "other",
      "value": "<exact value as shown in schematic, e.g. 10k, 100nF, 2N3904, OC44>",
      "quantity": 1,
      "reference_designators": ["R1"],
      "confidence": 95,
      "notes": "Optional notes about legibility or context"
    }
  ],
  "enclosure": {
    "size": "1590B" | "125B" | "1590BB",
    "drill_count": 6,
    "notes": "Recommended based on visible controls"
  },
  "power": {
    "voltage": "9V",
    "current": "20mA",
    "polarity": "center-negative" | "center-positive"
  },
  "confidence_score": 85
}

Requirements:
1. Include EVERY component visible: resistors (with values), capacitors (with values), semiconductors (transistors, diodes, ICs), jacks, footswitch, potentiometers, LEDs, switches
2. Group identical components (same type AND value) — set quantity > 1 and list all reference designators
3. Set confidence 0-100 based on how clearly each value is marked in the image
4. For enclosure: count off-board components (pots, switches, jacks, LEDs); 1590B=3-4 knobs, 125B=3-5 knobs, 1590BB=5+ knobs
5. Standard pedal power is 9V center-negative unless the schematic shows otherwise
6. Return ONLY valid JSON, no markdown or extra text`;

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
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
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
    // All models listed support vision (text and image input)
    const MODELS_TO_TRY = [
      'claude-sonnet-4-5-20250929',      // Sonnet 4.5 (Sept 2025) - best balance of speed/intelligence
      'claude-opus-4-6',                 // Latest Opus 4.6 (Feb 2026) - most intelligent
      'claude-haiku-4-5-20251001',       // Haiku 4.5 (Oct 2025) - fastest
      'claude-opus-4-5-20251101',        // Legacy: Opus 4.5 (Nov 2025)
      'claude-sonnet-4-20250514',        // Legacy: Sonnet 4 (May 2025)
      'claude-3-7-sonnet-20250219',      // Legacy: Sonnet 3.7 (Feb 2025)
      'claude-3-5-sonnet-20241022',      // Legacy: Sonnet 3.5 (Oct 2024)
      'claude-3-opus-20240229',          // Legacy: Opus 3 (Feb 2024)
    ];

    let response;
    let lastError;

    for (const modelName of MODELS_TO_TRY) {
      try {
        console.log(`Attempting to use model: ${modelName}`);

        response = await client.messages.create({
          model: modelName,
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
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
                  text: USER_PROMPT,
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
