// Image enhancement service using Gemini
import { GoogleGenAI } from '@google/genai';
import { prepareImageForGemini } from './gemini';
import { put } from '@vercel/blob';

// Baseline professional photo URL (to be provided by user)
const BASELINE_IMAGE_URL = process.env.AI_BASELINE_IMAGE_URL || '';

// Initialize GoogleGenAI client
let genAI: GoogleGenAI | null = null;

function getGenAI() {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return genAI;
}

// Engineered prompt for image enhancement (to be provided by user)
const ENHANCEMENT_PROMPT = process.env.AI_ENHANCEMENT_PROMPT || `**Role**  You are a professional jewelry photographer and photoshop artist.  The first of the two attached photos is representative of your work.  A client has provided you with samples of their earring photography which is mediocre.  The second attached photo is an example.  
**Task**  The client has a library of thousands of earring images similar in  quality to the mediocre sample image above.  The client has asked you to upgrade their images to appear as professional and appealing as your professional image which is the first attached image.
**Instructions**  As a professional photographer and photoshop artist you know many techniques for editing lossy .jpeg images to improve the quality and appearance of inferior photographs.  You know how to use traditional  post production image editing techniques to improve the lighting, remove shadows, improve the color palette,  and increase the shininess of jewelry while still maintaining the high degree of photorealism and image quality that jewelry  images require.  You are also well-versed on AI techniques which allow you to  change the angle at which photographs are taken, and the relative positions of the jewelry items in the photograph.  You understand how to present earrings in a visually appealing manner, how to convey the  functionality of a given piece, and, most importantly how to foster a positive interest in the person viewing the image in acquiring and wearing a given pair of earrings.  You are exceptionally skilled in the post processing of .jpeg files and therefore you know the correct techniques to use in post processing to achieve these effects while still maintaining the image quality and photorealism necessary for credible jewelry images.  
** Instructions** Apply your expertise as described above to the task of analysing, modifying, and substantially improving  the attached  inferior photo, using the superior, professionally shot image as a benchmark image.  Please deliver an exceptional image.  **CRITICAL NOTE**  The output images MUST portray the exact pair of earrings in the client-provided image, but which have been upgraded to appear as professional and attractive as the benchmark image.  Please review these instructions and ask for clarification if necessary before proceeding 
    `;

interface EnhancementResult {
  success: boolean;
  enhancedImageUrl?: string;
  enhancementInstructions?: string;
  error?: string;
  modelUsed: string;
}

/**
 * Enhance a single product image using Gemini with baseline reference
 */
export async function enhanceSingleImage(
  productImageUrl: string,
  imageNumber: number
): Promise<EnhancementResult> {
  try {
    if (!BASELINE_IMAGE_URL) {
      throw new Error('AI_BASELINE_IMAGE_URL environment variable not set');
    }

    const ai = getGenAI();

    // Prepare both images for Gemini
    const baselineImage = await prepareImageForGemini(BASELINE_IMAGE_URL);
    const productImage = await prepareImageForGemini(productImageUrl);

    // Generate enhanced image using Gemini
    const contents = [
      { text: ENHANCEMENT_PROMPT },
      baselineImage,
      productImage,
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: {
          aspectRatio: '1:1',
          imageSize: '2K',
        },
      },
    });

    // Extract enhanced image from response
    let enhancedImageUrl: string | undefined;
    let enhancementInstructions: string | undefined;

    for (const part of response.candidates[0].content.parts) {
      if (part.text) {
        enhancementInstructions = part.text;
      } else if (part.inlineData) {
        // Convert base64 image to Buffer and upload to Vercel Blob
        const imageData = part.inlineData.data;
        const buffer = Buffer.from(imageData, 'base64');
        const mimeType = part.inlineData.mimeType || 'image/png';
        
        // Upload to Vercel Blob
        const timestamp = Date.now();
        const filename = `enhanced/enhanced-${timestamp}-${imageNumber}.png`;
        
        const blob = await put(filename, buffer, {
          access: 'public',
          token: process.env.BLOB_READ_WRITE_TOKEN,
          contentType: mimeType,
        });
        
        enhancedImageUrl = blob.url;
      }
    }

    return {
      success: true,
      enhancedImageUrl,
      enhancementInstructions,
      modelUsed: 'gemini-3-pro-image-preview',
    };
  } catch (error) {
    console.error('Image enhancement error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      modelUsed: 'gemini-3-pro-image-preview',
    };
  }
}

/**
 * Enhance all 4 product images
 */
export async function enhanceProductImages(
  images: [string, string, string, string]
): Promise<EnhancementResult[]> {
  const results = await Promise.all(
    images.map((imageUrl, index) => enhanceSingleImage(imageUrl, index + 1))
  );

  return results;
}

/**
 * Analyze product images to generate description
 * Used as input for ChatGPT description generation
 */
export async function analyzeProductImages(
  images: string[]
): Promise<string> {
  try {
    const ai = getGenAI();
    
    // Prepare all product images
    const imagePromises = images
      .filter(url => url && url.trim() !== '')
      .map(url => prepareImageForGemini(url));
    
    const preparedImages = await Promise.all(imagePromises);

    const analysisPrompt = `Analyze these jewelry product images and provide a detailed description including:
- Type of jewelry (earrings, style)
- Materials and gemstones visible
- Colors and finishes
- Design features and craftsmanship details
- Overall aesthetic and style

Focus on factual observations that would help write a compelling product description.`;

    const contents = [
      { text: analysisPrompt },
      ...preparedImages,
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents,
    });

    return response.candidates[0].content.parts.find(p => p.text)?.text || 'Unable to analyze images';
  } catch (error) {
    console.error('Image analysis error:', error);
    return 'Unable to analyze images';
  }
}

/**
 * Configuration check
 */
export function isConfigured(): boolean {
  return !!(BASELINE_IMAGE_URL && process.env.GEMINI_API_KEY);
}

export function getConfigStatus() {
  return {
    hasBaselineImage: !!BASELINE_IMAGE_URL,
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    hasCustomPrompt: !!process.env.AI_ENHANCEMENT_PROMPT,
  };
}
