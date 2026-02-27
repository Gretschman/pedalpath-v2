import Anthropic from '@anthropic-ai/sdk';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// System prompt — sets the role/persona for Claude
const SYSTEM_PROMPT = `You are an expert electronics engineer specialising in guitar effects pedal schematics. You extract accurate component lists from schematic images. You are rigorous and conservative: you never invent components, and you never misidentify text labels, PCB names, or title blocks as components.`;

// User prompt — the actual analysis instruction sent with the image
const USER_PROMPT = `Analyze the guitar effects pedal schematic image and extract every electronic component that is shown.

━━━ WHAT COUNTS AS A COMPONENT ━━━
A component MUST have a recognisable schematic SYMBOL (zigzag=resistor, parallel lines=capacitor, triangle=op-amp, etc.) AND a reference designator (R1, C1, Q1, U1, P1, SW1, J1, D1, LED1…).

━━━ WHAT IS NOT A COMPONENT — DO NOT REPORT THESE ━━━
• Board/product names (e.g. "Defizzerator", "Tube Screamer", "Big Muff")
• PCB revision text (e.g. "REV3C", "V2.1", "Rev B")
• Section labels or node names (e.g. "BIAS", "GRIT", "DRIVE", "INPUT", "OUTPUT", "VCC", "GND")
• Copyright text, designer names, dates
• Anything that lacks both a schematic symbol AND a reference designator

━━━ REFERENCE DESIGNATOR GUIDE ━━━
R = resistor | C = capacitor | L = inductor | D = diode | LED = LED
Q = transistor (BJT or JFET) | U, IC = integrated circuit / op-amp
P, RV, VR, POT = potentiometer | SW = switch | J = jack | FS = footswitch

━━━ RULES ━━━
1. Report ONLY components with a clear schematic symbol + reference designator. If a value is illegible, estimate it with low confidence rather than skipping — never skip a component just because its value is hard to read. Never set value to "unspecified" — always give a best estimate.
2. Grouping: ONLY group components into quantity > 1 when their values are CLEARLY and UNAMBIGUOUSLY identical. If values are partially legible or could differ, report each component separately with its own entry and individual confidence score. A wrong value is worse than a duplicate entry.
3. Value accuracy — watch for common misreads:
   • 1k vs 1M (one-k vs one-meg) — check for the Ω or k/M suffix carefully
   • 10n vs 100n vs 10p — check the multiplier prefix (n=nano, p=pico, u=micro)
   • 47n vs 4.7n, 22n vs 2.2n — look for decimal points
   • Capacitor shorthand: U or u suffix = µF (e.g. .1U = 0.1µF, 1U = 1µF, 4.7U = 4.7µF)
   • Leading decimal: .1 means 0.1, .047 means 0.047, .01 means 0.01 — always include the leading zero
   • NEVER return "unspecified" as a value — if a value is hard to read, provide your best estimate with low confidence and explain in the notes field. An estimate is always more useful than "unspecified".
4. Component symbols to look for:
   • Potentiometer (P, RV, VR): resistor symbol with an arrow through it, or a 3-terminal resistor symbol
   • Switch (SW): open-circuit line with a hinge/pivot, often labeled On-Off-On, SPDT, or DPDT
   • These are frequently in passive tone/EQ circuits — look carefully even if hard to see
5. Enclosure size — count only off-board hardware (pots, switches, jacks, LEDs):
   • 1–2 controls → 1590A
   • 3–4 controls → 1590B
   • 5–6 controls → 1590BB or 125B (125B for tall/narrow layouts)
   • 7+ controls → 1590DD
6. Power — ONLY include the "power" field if the schematic contains active components (Q, U, IC, op-amp). Passive circuits (R, C, L, D, pot, switch, jack only) need NO power supply — omit "power" entirely.
7. Return ONLY valid JSON. No markdown, no commentary.

Return this exact structure:

{
  "components": [
    {
      "component_type": "resistor" | "capacitor" | "inductor" | "diode" | "transistor" | "ic" | "op-amp" | "input-jack" | "output-jack" | "dc-jack" | "footswitch" | "potentiometer" | "led" | "switch" | "other",
      "value": "<value as written on schematic, e.g. 10k, 100nF, 2N3904>",
      "quantity": 1,
      "reference_designators": ["R1"],
      "confidence": 95,
      "notes": "Optional: legibility issues or special observations"
    }
  ],
  "enclosure": {
    "size": "1590A" | "1590B" | "1590BB" | "125B" | "1590DD",
    "drill_count": 4,
    "notes": "Brief reasoning"
  },
  "power": {
    "voltage": "9V",
    "current": "~5mA",
    "polarity": "center-negative"
  },
  "confidence_score": 85
}`;

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

      // Passive-circuit guard: strip power recommendation if no active components present.
      // Active types: transistor, ic, op-amp. Passive circuits (R/C/D/pot/jack/switch) need no supply.
      const ACTIVE_TYPES = new Set(['transistor', 'ic', 'op-amp']);
      const hasActiveComponents = bomData.components.some(
        (c: { component_type: string }) => ACTIVE_TYPES.has(c.component_type)
      );
      if (!hasActiveComponents) {
        bomData.power = undefined;
      }

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
