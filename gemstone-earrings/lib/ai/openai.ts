// OpenAI client configuration
import OpenAI from 'openai';

// Initialize OpenAI client (lazy initialization)
let openaiClient: OpenAI | null = null;

function getOpenAI() {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

// Using ChatGPT v5.2 as specified in plan
export const GPT_MODEL = 'gpt-5.2';

// Generate embeddings for RAG (using text-embedding-3-small for efficiency)
export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getOpenAI();
  const response = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });

  return response.data[0].embedding;
}

// Generate product description using ChatGPT
export async function generateDescription(
  productName: string,
  existingDescription: string | null,
  imageAnalysis: string
): Promise<string> {
  const prompt = `You are an expert e-commerce copywriter specializing in jewelry.
  
Product Name: ${productName}
${existingDescription ? `Existing Description: ${existingDescription}` : ''}
Image Analysis: ${imageAnalysis}

Generate a compelling, SEO-friendly product description (2-3 paragraphs) that:
- Highlights the unique features and beauty of the earrings
- Uses sensory and emotional language
- Includes relevant keywords naturally
- Appeals to potential buyers
- Maintains a premium, elegant tone

Do not use markdown formatting. Return plain text only.`;

  const client = getOpenAI();
  const completion = await client.chat.completions.create({
    model: GPT_MODEL,
    messages: [
      {
        role: 'system',
        content: 'You are an expert jewelry copywriter who creates compelling product descriptions.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 500,
  });

  return completion.choices[0].message.content || '';
}

// Generate SEO keywords
export async function generateKeywords(
  productName: string,
  description: string
): Promise<string[]> {
  const prompt = `Given this jewelry product information:

Product Name: ${productName}
Description: ${description}

Generate 10-15 relevant SEO keywords and phrases. Focus on:
- Product type and material (e.g., "sterling silver earrings")
- Gemstone names and colors
- Style descriptors (e.g., "elegant", "dangle", "stud")
- Occasion keywords (e.g., "wedding jewelry", "everyday wear")

Return ONLY a JSON array of keywords, no other text.`;

  const client = getOpenAI();
  const completion = await client.chat.completions.create({
    model: GPT_MODEL,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.5,
    max_tokens: 200,
  });

  const content = completion.choices[0].message.content || '[]';
  try {
    return JSON.parse(content);
  } catch {
    // Fallback: split by commas if not valid JSON
    return content.split(',').map((k) => k.trim().replace(/["\[\]]/g, ''));
  }
}
