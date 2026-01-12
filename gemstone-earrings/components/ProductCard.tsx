'use client';

import Link from 'next/link';
import { EarringPair } from '@/lib/types';
import { useCart } from '@/lib/CartContext';

interface ProductCardProps {
  product: EarringPair;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product);
  };

  return (
    <Link href={`/products/${product.pair_id}`}>
      <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden h-full flex flex-col">
        {/* Placeholder for product image */}
        <div className="bg-gradient-to-br from-purple-100 to-pink-100 h-48 flex items-center justify-center">
          <div className="text-6xl">💎</div>
        </div>
        
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">
            {product.gemstone.name}
          </h3>
          
          <div className="text-sm text-gray-600 mb-2">
            <span className="inline-block px-2 py-1 bg-gray-100 rounded mr-2">
              {product.gemstone.size}
            </span>
            {product.gemstone.color && (
              <span className="inline-block px-2 py-1 bg-gray-100 rounded">
                {product.gemstone.color}
              </span>
            )}
          </div>

          <p className="text-sm text-gray-500 mb-2 line-clamp-1">
            {product.setting.product_title}
          </p>

          <div className="mt-auto">
            <div className="text-2xl font-bold text-purple-600 mb-3">
              ${product.pricing.total_pair_price.toFixed(2)}
            </div>
            
            <button
              onClick={handleAddToCart}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded transition-colors"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
