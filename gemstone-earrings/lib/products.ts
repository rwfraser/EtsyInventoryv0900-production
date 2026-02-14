import { EarringPair } from './types';

let cachedDbProducts: EarringPair[] | null = null;
let lastDbFetch: number = 0;
const DB_CACHE_DURATION = 60000; // Cache database products for 1 minute

export async function getProducts(): Promise<EarringPair[]> {
  // Fetch ONLY from database (no more JSON products)
  const now = Date.now();
  if (!cachedDbProducts || (now - lastDbFetch) > DB_CACHE_DURATION) {
    try {
      const dbResponse = await fetch('/api/products');
      if (dbResponse.ok) {
        const dbData = await dbResponse.json();
        cachedDbProducts = dbData.products || [];
        lastDbFetch = now;
      } else {
        console.error('Failed to fetch database products');
        cachedDbProducts = [];
      }
    } catch (error) {
      console.error('Failed to fetch database products:', error);
      cachedDbProducts = [];
    }
  }

  return cachedDbProducts;
}

export async function getProductById(id: string): Promise<EarringPair | undefined> {
  const products = await getProducts();
  return products.find(p => p.pair_id === id);
}

export function getUniqueColors(products: EarringPair[]): string[] {
  const colors = new Set<string>();
  products.forEach(p => {
    if (p.gemstone.color) {
      colors.add(p.gemstone.color);
    }
  });
  return Array.from(colors).sort();
}

export function getUniqueShapes(products: EarringPair[]): string[] {
  const shapes = new Set<string>();
  products.forEach(p => {
    if (p.gemstone.shape) {
      shapes.add(p.gemstone.shape);
    }
  });
  return Array.from(shapes).sort();
}

export function getUniqueSizes(products: EarringPair[]): string[] {
  const sizes = new Set<string>();
  products.forEach(p => {
    if (p.gemstone.size) {
      sizes.add(p.gemstone.size);
    }
  });
  return Array.from(sizes).sort((a, b) => {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    return numA - numB;
  });
}

export function getUniqueMaterials(products: EarringPair[]): string[] {
  const materials = new Set<string>();
  products.forEach(p => {
    if (p.gemstone.material) {
      materials.add(p.gemstone.material);
    }
  });
  return Array.from(materials).sort();
}

export function getUniqueVendors(products: EarringPair[]): string[] {
  const vendors = new Set<string>();
  products.forEach(p => {
    vendors.add(p.vendor);
  });
  return Array.from(vendors).sort();
}

export function filterProducts(
  products: EarringPair[],
  filters: {
    color?: string;
    shape?: string;
    size?: string;
    material?: string;
    vendor?: string;
    minPrice?: number;
    maxPrice?: number;
  }
): EarringPair[] {
  return products.filter(product => {
    if (filters.color && product.gemstone.color !== filters.color) return false;
    if (filters.shape && product.gemstone.shape !== filters.shape) return false;
    if (filters.size && product.gemstone.size !== filters.size) return false;
    if (filters.material && product.gemstone.material !== filters.material) return false;
    if (filters.vendor && product.vendor !== filters.vendor) return false;
    if (filters.minPrice && product.pricing.total_pair_price < filters.minPrice) return false;
    if (filters.maxPrice && product.pricing.total_pair_price > filters.maxPrice) return false;
    return true;
  });
}

export function sortProducts(
  products: EarringPair[],
  sortBy: 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc'
): EarringPair[] {
  const sorted = [...products];
  
  switch (sortBy) {
    case 'price-asc':
      return sorted.sort((a, b) => a.pricing.total_pair_price - b.pricing.total_pair_price);
    case 'price-desc':
      return sorted.sort((a, b) => b.pricing.total_pair_price - a.pricing.total_pair_price);
    case 'name-asc':
      return sorted.sort((a, b) => a.gemstone.name.localeCompare(b.gemstone.name));
    case 'name-desc':
      return sorted.sort((a, b) => b.gemstone.name.localeCompare(a.gemstone.name));
    default:
      return sorted;
  }
}
