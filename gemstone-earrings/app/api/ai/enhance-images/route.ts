import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { enhanceProductImages, getConfigStatus } from '@/lib/ai/imageEnhancer';
import { checkRateLimit, formatRateLimitError, getRateLimitHeaders } from '@/lib/rateLimiter';
import { trackCost, estimateGeminiCost } from '@/lib/costTracker';

export async function POST(request: NextRequest) {
  try {
    // Check authentication - only admins can enhance images
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

    // Check AI configuration
    const config = getConfigStatus();
    if (!config.hasBaselineImage || !config.hasGeminiKey) {
      return NextResponse.json(
        { 
          error: 'AI not configured',
          config,
          message: 'Please set AI_BASELINE_IMAGE_URL and GEMINI_API_KEY environment variables'
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { images } = body;

    // Validate input
    if (!images || !Array.isArray(images) || images.length !== 4) {
      return NextResponse.json(
        { error: 'Must provide exactly 4 image URLs' },
        { status: 400 }
      );
    }

    // Enhance all 4 images
    const results = await enhanceProductImages(images as [string, string, string, string]);

    // Check if all enhancements succeeded
    const allSuccessful = results.every(r => r.success);

    // Track AI cost (Gemini Pro Vision - 4 images)
    const estimatedCost = estimateGeminiCost({ images: 4 });
    await trackCost({
      service: 'gemini',
      endpoint: '/api/ai/enhance-images',
      userId: identifier,
      images: 4,
      estimatedCost,
    });

    return NextResponse.json(
      {
        success: allSuccessful,
        results,
        message: allSuccessful 
          ? 'All images analyzed successfully'
          : 'Some images failed to process'
      },
      { 
        status: allSuccessful ? 200 : 207,
        headers: getRateLimitHeaders(rateLimit),
      }
    );
  } catch (error) {
    console.error('Image enhancement API error:', error);
    return NextResponse.json(
      { error: 'Failed to enhance images' },
      { status: 500 }
    );
  }
}
