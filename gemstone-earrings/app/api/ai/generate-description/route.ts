import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateProductDescription } from '@/lib/ai/descriptionGenerator';
import { checkRateLimit, formatRateLimitError, getRateLimitHeaders } from '@/lib/rateLimiter';
import { trackCost, estimateOpenAICost } from '@/lib/costTracker';

export async function POST(request: NextRequest) {
  try {
    // Check authentication - only admins can generate descriptions
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get identifier for rate limiting
    const userEmail = session.user.email;
    const identifier = userEmail || request.headers.get('x-forwarded-for') || 'anonymous';
    const userRole = session.user.role === 'admin' ? 'admin' : 'user';
    
    // Check rate limit
    const rateLimit = await checkRateLimit(identifier, userRole);
    
    if (!rateLimit.success) {
      const errorResponse = formatRateLimitError(rateLimit);
      return NextResponse.json(errorResponse, {
        status: 429,
        headers: getRateLimitHeaders(rateLimit),
      });
    }

    const body = await request.json();
    const { productName, existingDescription, imageUrls } = body;

    // Validate input
    if (!productName || !imageUrls || !Array.isArray(imageUrls)) {
      return NextResponse.json(
        { error: 'Missing required fields: productName, imageUrls' },
        { status: 400 }
      );
    }

    // Generate description with AI
    const result = await generateProductDescription(
      productName,
      existingDescription || null,
      imageUrls
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate description' },
        { status: 500 }
      );
    }

    // Track AI cost (estimate ~500 tokens for description generation)
    const estimatedTokens = 500;
    const estimatedCost = estimateOpenAICost(estimatedTokens, 'gpt-4');
    await trackCost({
      service: 'openai',
      endpoint: '/api/ai/generate-description',
      userId: identifier,
      tokens: estimatedTokens,
      estimatedCost,
    });

    return NextResponse.json(
      {
        success: true,
        description: result.description,
        keywords: result.keywords,
        embedding: result.embedding,
        modelsUsed: result.modelsUsed,
      },
      {
        headers: getRateLimitHeaders(rateLimit),
      }
    );
  } catch (error) {
    console.error('Description generation API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate description' },
      { status: 500 }
    );
  }
}
