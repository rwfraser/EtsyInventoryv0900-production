import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Get product details by ID
 * GET /api/products/details/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    console.log('[API] Fetching product details for ID:', productId);
    console.log('[API] Product ID type:', typeof productId);

    // Fetch product from database
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    console.log('[API] Query result:', product ? 'Found' : 'Not found');
    
    if (!product) {
      console.log('[API] Product not found:', productId);
      
      // Try to find similar IDs for debugging
      const allProducts = await db
        .select({ id: products.id, name: products.name })
        .from(products)
        .limit(5);
      
      console.log('[API] Sample product IDs from database:', allProducts.map(p => ({ id: p.id, name: p.name })));
      
      return NextResponse.json(
        { success: false, error: 'Product not found', productId, sampleIds: allProducts.map(p => p.id) },
        { status: 404 }
      );
    }

    console.log('[API] Product found:', {
      id: product.id,
      name: product.name,
      hasImage1: !!product.image1,
      hasImage2: !!product.image2,
    });

    // Format response
    const formattedProduct = {
      id: product.id,
      sku: product.sku,
      name: product.name,
      description: product.description || product.aiDescription,
      price: product.price,
      image1: product.image1,
      image2: product.image2,
      image3: product.image3,
      image4: product.image4,
      images: [product.image1, product.image2, product.image3, product.image4].filter(Boolean),
      stock: product.stock,
      category: product.category,
    };

    return NextResponse.json({
      success: true,
      product: formattedProduct,
    });
  } catch (error) {
    console.error('[API] Error fetching product details:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch product details',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
