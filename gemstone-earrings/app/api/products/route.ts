import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products } from '@/drizzle/schema';
import { EarringPair } from '@/lib/types';

export async function GET() {
  try {
    const dbProducts = await db.select().from(products);
    
    // Convert database products to EarringPair format
    const earringPairs: EarringPair[] = dbProducts.map((product) => ({
      pair_id: `DB_${product.id}`,
      setting: {
        product_number: product.id,
        product_title: product.name,
        price_per_setting: 0,
        material: 'Sterling Silver',
        gemstone_dimensions: '',
        gemstone_shape: '',
        variant_id: 0,
        product_url: '',
        quantity_needed: 2,
      },
      gemstone: {
        name: product.name,
        material: product.category || null,
        color: null,
        shape: '',
        size: '',
        price_per_stone: 0,
        product_url: '',
        quantity_needed: 2,
      },
      pricing: {
        settings_subtotal: 0,
        gemstones_subtotal: 0,
        subtotal: parseFloat(product.price),
        markup: 0,
        total_pair_price: parseFloat(product.price),
      },
      compatibility: {
        size_match: '',
        shape_match: '',
      },
      vendor: 'Admin',
      category: product.category || 'Custom',
      description: product.description || '',
      images: product.imageUrl ? [product.imageUrl] : [],
    }));

    return NextResponse.json({ products: earringPairs });
  } catch (error: any) {
    console.error('Error fetching database products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products', products: [] },
      { status: 500 }
    );
  }
}
