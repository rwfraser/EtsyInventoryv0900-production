import Link from 'next/link';
import { EarringPair } from '@/lib/types';
import ProductCard from '@/components/ProductCard';
import { auth } from '@/lib/auth';
import AuthGate from '@/components/AuthGate';
import { db } from '@/lib/db';
import { products } from '@/drizzle/schema';

export default async function Home() {
  const session = await auth();

  // If user is not authenticated, show auth gate
  if (!session) {
    return <AuthGate />;
  }

  // Load products from database
  const dbProducts = await db.select().from(products);
  
  // Convert to EarringPair format
  const allProducts: EarringPair[] = dbProducts.map((product) => {
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
  });
  
  // Get a selection of featured products (first 6)
  const featuredProducts = allProducts.slice(0, 6);
  const totalProducts = allProducts.length;

  return (
    <main>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-600 to-pink-500 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Exquisite Gemstone Earrings
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto">
            Discover {totalProducts} unique handcrafted earring designs featuring premium gemstones 
            and sterling silver settings
          </p>
          <Link
            href="/products"
            className="inline-block bg-white text-purple-600 font-bold py-3 px-8 rounded-full hover:bg-gray-100 transition-colors text-lg"
          >
            Browse Collection
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="text-5xl mb-4">✨</div>
              <h3 className="text-xl font-bold mb-2">Premium Quality</h3>
              <p className="text-gray-600">
                Genuine gemstones and lab-created stones in sterling silver settings
              </p>
            </div>
            <div className="p-6">
              <div className="text-5xl mb-4">🎨</div>
              <h3 className="text-xl font-bold mb-2">Unique Designs</h3>
              <p className="text-gray-600">
                {totalProducts} exclusive combinations of gems, shapes, and sizes
              </p>
            </div>
            <div className="p-6">
              <div className="text-5xl mb-4">💝</div>
              <h3 className="text-xl font-bold mb-2">Perfect Gift</h3>
              <p className="text-gray-600">
                Beautiful earrings for any occasion or personal style
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Featured Designs</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {featuredProducts.map(product => (
              <ProductCard key={product.pair_id} product={product} />
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/products"
              className="inline-block bg-purple-600 text-white font-bold py-3 px-8 rounded hover:bg-purple-700 transition-colors"
            >
              View All {totalProducts} Designs
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-purple-100 to-pink-100 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Find Your Perfect Pair</h2>
          <p className="text-lg text-gray-700 mb-6">
            Browse by color, shape, size, or gemstone type
          </p>
          <Link
            href="/products"
            className="inline-block bg-purple-600 text-white font-bold py-3 px-8 rounded hover:bg-purple-700 transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      </section>
    </main>
  );
}
