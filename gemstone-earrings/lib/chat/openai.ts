import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompt for the sales chatbot
export const SYSTEM_PROMPT = `You are a knowledgeable and friendly sales assistant for myearringadvisor.com, an online jewelry store specializing in beautiful gemstone earrings.

PERSONALITY:
- Warm, helpful, and enthusiastic about jewelry
- Professional but conversational
- Ask clarifying questions to understand customer needs
- Make personalized recommendations

CAPABILITIES:
- Search for products by gemstone type, color, price range, and style
- Provide detailed product information
- Add items to the customer's cart
- Offer virtual try-on feature to let customers see how earrings look on them
- Answer questions about shipping, returns, and materials
- Help customers find the perfect earrings for any occasion

GUIDELINES:
- Always be helpful and patient
- If you don't know something, admit it and offer to connect them with support
- Suggest 2-3 products max at a time to avoid overwhelming
- Mention key details: price, gemstone type, availability
- Use the functions available to search products and help customers
- When showing products, describe them enthusiastically
- Proactively suggest the virtual try-on feature when customers show interest in a product
- If a customer seems ready to buy, gently guide them to add to cart

PRODUCT KNOWLEDGE:
- We sell earrings with various gemstones (ruby, sapphire, emerald, etc.)
- Price range: $20-$200+
- All products have 4 high-quality images
- Free shipping on all orders
- 30-day return policy
- Handcrafted jewelry

Remember: Your goal is to help customers find earrings they'll love and complete their purchase.`;

// Define available functions for GPT to call
export const CHAT_FUNCTIONS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'searchProducts',
      description: 'Search for earring products based on criteria like gemstone type, color, price range, or keywords',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query or keywords (e.g., "ruby earrings", "blue gemstone")',
          },
          minPrice: {
            type: 'number',
            description: 'Minimum price in USD',
          },
          maxPrice: {
            type: 'number',
            description: 'Maximum price in USD',
          },
          category: {
            type: 'string',
            description: 'Product category (e.g., "Earrings", "Necklaces")',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results to return (default: 5, max: 10)',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getProductDetails',
      description: 'Get detailed information about a specific product by its ID',
      parameters: {
        type: 'object',
        properties: {
          productId: {
            type: 'string',
            description: 'The unique ID of the product',
          },
        },
        required: ['productId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'addToCart',
      description: 'Add a product to the customer\'s shopping cart',
      parameters: {
        type: 'object',
        properties: {
          productId: {
            type: 'string',
            description: 'The unique ID of the product to add',
          },
          quantity: {
            type: 'number',
            description: 'Quantity to add (default: 1)',
          },
        },
        required: ['productId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getCartContents',
      description: 'View the current contents of the customer\'s shopping cart',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'startVirtualTryOn',
      description: 'Initiate virtual try-on feature for a product, allowing customer to see how earrings look on them',
      parameters: {
        type: 'object',
        properties: {
          productId: {
            type: 'string',
            description: 'The unique ID of the product to try on',
          },
          productName: {
            type: 'string',
            description: 'Name of the product for display',
          },
        },
        required: ['productId', 'productName'],
      },
    },
  },
];

// Model configuration with fallback
const PRIMARY_MODEL = 'gpt-4o-mini';
const FALLBACK_MODELS = ['gpt-4o', 'gpt-3.5-turbo'];

// Send chat completion request to OpenAI with fallback support
export async function sendChatCompletion(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  attemptedModels: string[] = []
): Promise<OpenAI.Chat.Completions.ChatCompletion> {
  const modelsToTry = attemptedModels.length === 0 
    ? [PRIMARY_MODEL, ...FALLBACK_MODELS]
    : FALLBACK_MODELS.filter(m => !attemptedModels.includes(m));
  
  if (modelsToTry.length === 0) {
    throw new Error('All fallback models exhausted');
  }
  
  const currentModel = modelsToTry[0];
  
  try {
    console.log(`Attempting chat completion with model: ${currentModel}`);
    
    const completion = await openai.chat.completions.create({
      model: currentModel,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      tools: CHAT_FUNCTIONS,
      tool_choice: 'auto', // Let GPT decide when to use functions
      temperature: 0.7, // Slightly creative but not too random
      max_tokens: 500, // Reasonable response length
    });

    return completion;
  } catch (error) {
    console.error(`==================== OpenAI API Error (${currentModel}) ====================`);
    console.error('Error details:', error);
    
    // Check if error is retryable with fallback model
    const isModelError = error instanceof Error && (
      error.message.includes('model') ||
      error.message.includes('does not exist') ||
      error.message.includes('not found') ||
      (error as any).code === 'model_not_found'
    );
    
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
    }
    
    // If model-specific error and we have fallback models, try them
    if (isModelError && modelsToTry.length > 1) {
      console.warn(`Model ${currentModel} failed, attempting fallback...`);
      const nextAttemptedModels = [...attemptedModels, currentModel];
      return sendChatCompletion(messages, nextAttemptedModels);
    }
    
    // Log full error details for non-retryable errors
    if (typeof error === 'object' && error !== null) {
      console.error('Error object keys:', Object.keys(error));
      console.error('Full error:', JSON.stringify(error, null, 2));
    }
    console.error('=========================================================');
    throw new Error(`Failed to get response from AI (tried: ${[...attemptedModels, currentModel].join(', ')})`);
  }
}

// Calculate cost of API call (approximate)
export function calculateCost(completion: OpenAI.Chat.Completions.ChatCompletion): number {
  const inputTokens = completion.usage?.prompt_tokens || 0;
  const outputTokens = completion.usage?.completion_tokens || 0;

  // GPT-4 Turbo pricing (as of 2024)
  const inputCostPerToken = 0.01 / 1000; // $0.01 per 1K tokens
  const outputCostPerToken = 0.03 / 1000; // $0.03 per 1K tokens

  return inputTokens * inputCostPerToken + outputTokens * outputCostPerToken;
}
