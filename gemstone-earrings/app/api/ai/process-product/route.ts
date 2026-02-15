import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { products } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { enhanceProductImages } from '@/lib/ai/imageEnhancer';
import { generateProductDescription } from '@/lib/ai/descriptionGenerator';

export async function POST(request: NextRequest) {
  try {
    // Check authentication - only admins can process products
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'Missing productId' },
        { status: 400 }
      );
    }

    // Fetch product from database
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Collect image URLs
    const imageUrls = [
      product.image1,
      product.image2,
      product.image3,
      product.image4,
    ].filter(Boolean) as string[];

    if (imageUrls.length === 0) {
      return NextResponse.json(
        { error: 'Product has no images' },
        { status: 400 }
      );
    }

    // Step 1: Enhance images (if 4 images available)
    let enhancementResults = null;
    if (imageUrls.length === 4) {
      enhancementResults = await enhanceProductImages(
        imageUrls as [string, string, string, string]
      );
    }

    // Step 2: Generate description
    const descriptionResult = await generateProductDescription(
      product.name,
      product.description,
      imageUrls
    );

    if (!descriptionResult.success) {
      return NextResponse.json(
        { error: descriptionResult.error || 'Failed to generate description' },
        { status: 500 }
      );
    }

    // Step 3: Update product in database
    const [updatedProduct] = await db
      .update(products)
      .set({
        originalDescription: product.description,
        aiDescription: descriptionResult.description,
        aiKeywords: JSON.stringify(descriptionResult.keywords),
        embeddingVector: JSON.stringify(descriptionResult.embedding),
        aiProcessedAt: new Date(),
        aiModelUsed: descriptionResult.modelsUsed || 'gemini-3-pro-image-preview, gpt-5.2',
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId))
      .returning();

    return NextResponse.json({
      success: true,
      product: updatedProduct,
      enhancementResults,
      aiDescription: descriptionResult.description,
      aiKeywords: descriptionResult.keywords,
      modelsUsed: descriptionResult.modelsUsed,
    });
  } catch (error) {
    console.error('Product processing API error:', error);
    return NextResponse.json(
      { error: 'Failed to process product' },
      { status: 500 }
    );
  }
}
