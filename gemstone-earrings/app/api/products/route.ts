import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products } from '@/drizzle/schema';
import { EarringPair } from '@/lib/types';

export async function GET() {
  try {
    const dbProducts = await db.select().from(products);
    
    // Convert database products to EarringPair format
    const earringPairs: EarringPair[] = dbProducts.map((product) => {
      // Build images array from all available image fields
      const images = [
        product.image1,
        product.image2,
        product.image3,
        product.image4,
        product.imageUrl, // Fallback to old imageUrl field
      ].filter((img): img is string => img !== null && img !== undefined && img !== '');

      return {
        pair_id: `DB_${product.id}`,
        setting: {
          product_number: product.id,
          product_title: product.name,
          price_per_setting: parseFloat(product.price) / 2,
          material: 'Sterling Silver',
          gemstone_dimensions: '',
          gemstone_shape: '',
          variant_id: 0,
          product_url: '',
          quantity_needed: 2,
        },
        gemstone: {
          name: product.name,
          material: product.category || 'Gemstone',
          color: null,
          shape: '',
          size: '',
          price_per_stone: parseFloat(product.price) / 2,
          product_url: '',
          quantity_needed: 2,
        },
        pricing: {
          settings_subtotal: parseFloat(product.price) / 2,
          gemstones_subtotal: parseFloat(product.price) / 2,
          subtotal: parseFloat(product.price),
          markup: 0,
          total_pair_price: parseFloat(product.price),
        },
        compatibility: {
          size_match: 'Custom',
          shape_match: 'Custom',
        },
        vendor: 'Custom Design',
        category: product.category || 'Earrings',
        description: product.description || '',
        images: images,
      };
    });

    return NextResponse.json({ products: earringPairs });
  } catch (error: any) {
    console.error('Error fetching database products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products', products: [] },
      { status: 500 }
    );
  }
}
