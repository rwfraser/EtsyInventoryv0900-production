// Google Gemini AI client configuration
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini client (lazy initialization)
let genAI: GoogleGenerativeAI | null = null;

function getGenAI() {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

// Get Gemini model for image enhancement
// Using gemini-3-pro-image-preview as specified in plan
export function getImageModel() {
  const client = getGenAI();
  return client.getGenerativeModel({ 
    model: 'gemini-3-pro-image-preview' 
  });
}

// Get Gemini model for text generation (if needed as fallback)
export function getTextModel() {
  const client = getGenAI();
  return client.getGenerativeModel({ 
    model: 'gemini-pro' 
  });
}

// Helper to convert image URL to base64 for Gemini
export async function imageUrlToBase64(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString('base64');
}

// Helper to prepare image for Gemini API
export async function prepareImageForGemini(imageUrl: string) {
  const base64 = await imageUrlToBase64(imageUrl);
  const mimeType = imageUrl.endsWith('.png') ? 'image/png' : 'image/jpeg';
  
  return {
    inlineData: {
      data: base64,
      mimeType,
    },
  };
}

export { getGenAI };
