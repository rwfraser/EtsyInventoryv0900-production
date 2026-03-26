/**
 * Server-side product data access
 * Use this in server components instead of the API endpoint
 */

import { db } from '@/lib/db';
import { products } from '@/drizzle/schema';
import { desc, eq } from 'drizzle-orm';
import { EarringPair } from '@/lib/types';

/**
 * Convert a database product to EarringPair format
 */
function toEarringPair(product: typeof products.$inferSelect): EarringPair {
  const images = [
    product.image1,
    product.image2,
    product.image3,
    product.image4,
    product.imageUrl,
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
}

/**
 * Get all products from the database (server-side only)
 */
export async function getProductsServer(): Promise<EarringPair[]> {
  const dbProducts = await db.select().from(products).orderBy(desc(products.createdAt));
  return dbProducts.map(toEarringPair);
}

/**
 * Get a single product by ID (server-side only)
 */
export async function getProductByIdServer(id: string): Promise<EarringPair | null> {
  // Handle DB_ prefix if present
  const dbId = id.startsWith('DB_') ? id.slice(3) : id;
  
  const [product] = await db.select().from(products).where(eq(products.id, dbId)).limit(1);
  
  if (!product) {
    return null;
  }
  
  return toEarringPair(product);
}
