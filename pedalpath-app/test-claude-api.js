import Anthropic from '@anthropic-ai/sdk';

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('ANTHROPIC_API_KEY not set');
  process.exit(1);
}

const client = new Anthropic({ apiKey });

const MODELS_TO_TEST = [
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
