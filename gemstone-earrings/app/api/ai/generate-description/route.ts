import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateProductDescription } from '@/lib/ai/descriptionGenerator';

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

    return NextResponse.json({
      success: true,
      description: result.description,
      keywords: result.keywords,
      embedding: result.embedding,
      modelsUsed: result.modelsUsed,
    });
  } catch (error) {
    console.error('Description generation API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate description' },
      { status: 500 }
    );
  }
}
