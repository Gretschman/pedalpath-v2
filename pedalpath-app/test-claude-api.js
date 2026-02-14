import Anthropic from '@anthropic-ai/sdk';

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('ANTHROPIC_API_KEY not set');
  process.exit(1);
}

const client = new Anthropic({ apiKey });

const MODELS_TO_TEST = [
  'claude-opus-4-6',                 // Latest Opus 4.6 (Feb 2026)
  'claude-sonnet-4-5-20250929',      // Sonnet 4.5 (Sept 2025)
  'claude-3-5-sonnet-latest',
  'claude-3-5-sonnet-20241022',
  'claude-3-opus-20240229',
  'claude-3-sonnet-20240229',
];

async function testModels() {
  console.log('Testing Claude API models...\n');

  for (const model of MODELS_TO_TEST) {
    try {
      console.log(`Testing: ${model}`);

      const response = await client.messages.create({
        model: model,
        max_tokens: 100,
        messages: [{
          role: 'user',
          content: 'Reply with just "OK"'
        }]
      });

      console.log(`✅ SUCCESS: ${model} works!\n`);
    } catch (error) {
      console.log(`❌ FAILED: ${model}`);
      console.log(`   Error: ${error.message}\n`);
    }
  }
}

testModels().catch(console.error);
