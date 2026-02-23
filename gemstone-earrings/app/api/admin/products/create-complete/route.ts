import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { products } from '@/drizzle/schema';
import { SKUGenerator } from '@/lib/skuGenerator';

/**
 * Complete Product Creation API
 * 
 * Creates a product with ALL data including AI-generated content and SKU
 * This replaces the old two-step workflow (create → enhance)
 * 
 * POST /api/admin/products/create-complete
 * 
 * Body (JSON):
 * {
 *   // Basic product info
 *   name: string
 *   description: string (user's original)
 *   price: string
 *   category?: string
 *   stock: number
 *   
 *   // Images (Vercel Blob URLs - already uploaded)
 *   image1?: string
 *   image2?: string
 *   image3?: string
 *   image4?: string
 *   
 *   // AI-generated content (from preview step)
 *   aiDescription?: string
 *   aiKeywords?: string[] 
 *   aiProcessedAt?: string
 *   embeddingVector?: number[]
 *   
 *   // AI-enhanced images (Vercel Blob URLs)
 *   enhancedImage1?: string
 *   enhancedImage2?: string
 *   enhancedImage3?: string
 *   enhancedImage4?: string
 *   
 *   // SKU (generated in preview step)
 *   sku: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    const {
      sku,
      name,
      description,
      price,
      stock,
      category,
      image1,
      image2,
      image3,
      image4,
      enhancedImage1,
      enhancedImage2,
      enhancedImage3,
      enhancedImage4,
      aiDescription,
      aiKeywords,
      aiProcessedAt,
      embeddingVector
    } = body;

    if (!sku || !name || !price) {
      return NextResponse.json(
        { error: 'SKU, name, and price are required' },
        { status: 400 }
      );
    }

    // Validate SKU format
    if (!SKUGenerator.validateSKU(sku)) {
      return NextResponse.json(
        { error: 'Invalid SKU format' },
        { status: 400 }
      );
    }

    // Check SKU uniqueness
    const existingProduct = await db
      .select({ id: products.id })
      .from(products)
      .where(products.sku.eq(sku))
      .limit(1);

    if (existingProduct.length > 0) {
      return NextResponse.json(
        { 
          error: 'SKU already exists',
          message: 'This SKU is already assigned to another product'
        },
        { status: 409 }
      );
    }

    // Prepare data for insertion
    const productData = {
      sku,
      name,
      description: description || null,
      price: price.toString(),
      category: category || null,
      stock: parseInt(stock?.toString() || '0', 10),
      
      // Original images
      image1: image1 || null,
      image2: image2 || null,
      image3: image3 || null,
      image4: image4 || null,
      imageUrl: image1 || null, // Legacy field
      
      // AI-enhanced images
      enhancedImage1: enhancedImage1 || null,
      enhancedImage2: enhancedImage2 || null,
      enhancedImage3: enhancedImage3 || null,
      enhancedImage4: enhancedImage4 || null,
      
      // AI-generated content
      originalDescription: description || null,
      aiDescription: aiDescription || null,
      aiKeywords: aiKeywords ? JSON.stringify(aiKeywords) : null,
      embeddingVector: embeddingVector ? JSON.stringify(embeddingVector) : null,
      aiProcessedAt: aiProcessedAt ? new Date(aiProcessedAt) : null,
      aiModelUsed: (aiDescription || aiKeywords) ? 'gemini-3-pro-image-preview, gpt-5.2' : null,
    };

    // Insert product
    const [newProduct] = await db
      .insert(products)
      .values(productData)
      .returning();

    console.log(`Created product: ${sku} - ${name}`);

    return NextResponse.json({
      success: true,
      product: newProduct,
      message: 'Product created successfully'
    });

  } catch (error) {
    console.error('Product creation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create product',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
