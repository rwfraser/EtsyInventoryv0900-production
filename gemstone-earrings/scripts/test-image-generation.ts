// Test Gemini image generation
// Run with: npx tsx scripts/test-image-generation.ts

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { GoogleGenAI } from '@google/genai';
import * as fs from 'node:fs';

async function testImageGeneration() {
  console.log('🧪 Testing Gemini Image Generation...\n');

  try {
    // Check API key
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not found');
    }
    console.log('✓ GEMINI_API_KEY found');

    // Initialize client
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    console.log('✓ GoogleGenAI client initialized');

    // Simple test prompt
    const prompt = 'A beautiful pair of gemstone earrings on a white background';

    console.log('\n📸 Generating test image...');
    console.log(`Prompt: "${prompt}"`);

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: [{ text: prompt }],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: {
          aspectRatio: '1:1',
          imageSize: '2K',
        },
      },
    });

    console.log('\n✓ Response received');
    console.log('Candidates:', response.candidates?.length || 0);

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error('No candidates in response');
    }

    const parts = response.candidates[0].content.parts;
    console.log('Parts:', parts.length);

    let foundImage = false;
    let foundText = false;

    for (const part of parts) {
      if (part.text) {
        foundText = true;
        console.log('\n📝 Text response:', part.text.substring(0, 100) + '...');
      }
      if (part.inlineData) {
        foundImage = true;
        console.log('\n🎨 Image found!');
        console.log('  MIME type:', part.inlineData.mimeType);
        console.log('  Data length:', part.inlineData.data.length);
        
        // Save test image
        const buffer = Buffer.from(part.inlineData.data, 'base64');
        fs.writeFileSync('test-gemini-output.png', buffer);
        console.log('  ✓ Saved as test-gemini-output.png');
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✓ Found text: ${foundText}`);
    console.log(`✓ Found image: ${foundImage}`);
    
    if (foundImage) {
      console.log('\n✅ Image generation is working!');
    } else {
      console.log('\n⚠️  No image was generated - check API configuration');
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
  }
}

testImageGeneration();
