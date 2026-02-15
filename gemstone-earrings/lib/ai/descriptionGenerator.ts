// Description generator combining Gemini image analysis with ChatGPT text generation
import { analyzeProductImages } from './imageEnhancer';
import { generateDescription, generateKeywords, generateEmbedding } from './openai';

interface DescriptionResult {
  success: boolean;
  description?: string;
  keywords?: string[];
  embedding?: number[];
  error?: string;
  modelsUsed?: string;
}

/**
 * Generate AI-enhanced product description
 * Combines Gemini image analysis with ChatGPT description generation
 */
export async function generateProductDescription(
  productName: string,
  existingDescription: string | null,
  imageUrls: string[]
): Promise<DescriptionResult> {
  try {
    // Step 1: Analyze images with Gemini
    const imageAnalysis = await analyzeProductImages(imageUrls);

    // Step 2: Generate description with ChatGPT
    const description = await generateDescription(
      productName,
      existingDescription,
      imageAnalysis
    );

    // Step 3: Generate SEO keywords
    const keywords = await generateKeywords(productName, description);

    // Step 4: Generate embedding for RAG
    const embeddingText = `${productName} ${description} ${keywords.join(' ')}`;
    const embedding = await generateEmbedding(embeddingText);

    return {
      success: true,
      description,
      keywords,
      embedding,
      modelsUsed: 'gemini-3-pro-image-preview, gpt-5.2',
    };
  } catch (error) {
    console.error('Description generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Regenerate embedding for existing product
 * Useful for updating RAG index
 */
export async function regenerateEmbedding(
  productName: string,
  description: string,
  keywords: string[]
): Promise<number[] | null> {
  try {
    const embeddingText = `${productName} ${description} ${keywords.join(' ')}`;
    return await generateEmbedding(embeddingText);
  } catch (error) {
    console.error('Embedding generation error:', error);
    return null;
  }
}
