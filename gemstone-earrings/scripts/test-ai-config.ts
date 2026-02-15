// Test AI configuration
// Run with: npx tsx scripts/test-ai-config.ts

// Load environment variables
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { getConfigStatus } from '../lib/ai/imageEnhancer';

async function testConfig() {
  console.log('🤖 Testing AI Configuration...\n');

  const config = getConfigStatus();

  console.log('Environment Variables:');
  console.log(`  ✓ GEMINI_API_KEY: ${config.hasGeminiKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`  ✓ OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`  ✓ AI_BASELINE_IMAGE_URL: ${config.hasBaselineImage ? '✅ Set' : '❌ Missing'}`);
  console.log(`  ✓ AI_ENHANCEMENT_PROMPT: ${config.hasCustomPrompt ? '✅ Custom' : '📝 Using default'}`);

  if (config.hasBaselineImage) {
    console.log(`\n  Baseline Image URL: ${process.env.AI_BASELINE_IMAGE_URL}`);
  }

  console.log('\n' + '='.repeat(50));

  if (config.hasGeminiKey && config.hasBaselineImage && process.env.OPENAI_API_KEY) {
    console.log('✅ All AI services are configured and ready!');
    console.log('\nYou can now:');
    console.log('  1. Use /api/ai/enhance-images to analyze product images');
    console.log('  2. Use /api/ai/generate-description to create AI descriptions');
    console.log('  3. Use /api/ai/process-product to do complete AI processing');
  } else {
    console.log('❌ AI configuration incomplete');
    console.log('\nMissing:');
    if (!config.hasGeminiKey) console.log('  - GEMINI_API_KEY');
    if (!process.env.OPENAI_API_KEY) console.log('  - OPENAI_API_KEY');
    if (!config.hasBaselineImage) console.log('  - AI_BASELINE_IMAGE_URL');
  }

  process.exit(0);
}

testConfig();
