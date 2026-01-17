'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { EarringPair } from '@/lib/types';
import { getProductById } from '@/lib/products';
import { useCart } from '@/lib/CartContext';

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [product, setProduct] = useState<EarringPair | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      const p = await getProductById(id);
      setProduct(p || null);
      setLoading(false);
    }
    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
        <Link href="/products" className="text-purple-600 hover:underline">
          Browse all products
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/products" className="text-purple-600 hover:underline mb-4 inline-block">
        ← Back to Products
      </Link>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="bg-gradient-to-br from-purple-100 to-pink-100 aspect-square flex items-center justify-center relative">
            {product.images && product.images.length > 0 ? (
              <Image
                src={product.images[0]}
                alt={product.gemstone.name}
                fill
                className="object-contain p-8"
              />
            ) : (
              <div className="text-9xl">💎</div>
            )}
          </div>

          {/* Product Info */}
          <div className="p-8">
            <h1 className="text-3xl font-bold mb-4">{product.gemstone.name}</h1>
            
            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl font-bold text-purple-600">
                ${product.pricing.total_pair_price.toFixed(2)}
              </span>
            </div>

            {/* Gemstone Details */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Gemstone Details</h2>
              <div className="space-y-2 text-gray-700">
                <div className="flex justify-between">
                  <span className="font-medium">Shape:</span>
                  <span>{product.gemstone.shape}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Size:</span>
                  <span>{product.gemstone.size}</span>
                </div>
                {product.gemstone.color && (
                  <div className="flex justify-between">
                    <span className="font-medium">Color:</span>
                    <span>{product.gemstone.color}</span>
                  </div>
                )}
                {product.gemstone.material && (
                  <div className="flex justify-between">
                    <span className="font-medium">Material:</span>
                    <span>{product.gemstone.material}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-medium">Price per stone:</span>
                  <span>${product.gemstone.price_per_stone.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Setting Details */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Setting Details</h2>
              <div className="space-y-2 text-gray-700">
                <div className="flex justify-between">
                  <span className="font-medium">Product #:</span>
                  <span>{product.setting.product_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Material:</span>
                  <span>{product.setting.material}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Dimensions:</span>
                  <span>{product.setting.gemstone_dimensions}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {product.setting.product_title}
                </p>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="mb-6 p-4 bg-gray-50 rounded">
              <h3 className="font-semibold mb-2">Price Breakdown:</h3>
              <div className="space-y-1 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>Settings (2x):</span>
                  <span>${product.pricing.settings_subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gemstones (2x):</span>
                  <span>${product.pricing.gemstones_subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-1 font-semibold">
                  <span>Total:</span>
                  <span>${product.pricing.total_pair_price.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Quantity and Add to Cart */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <label className="font-medium">Quantity:</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 p-2 border rounded"
                />
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              className={`w-full font-bold py-3 px-6 rounded transition-colors ${
                addedToCart
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-purple-600 hover:bg-purple-700'
              } text-white`}
            >
              {addedToCart ? '✓ Added to Cart!' : 'Add to Cart'}
            </button>

            {/* External Links */}
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-gray-600 mb-2">View component products:</p>
              <div className="flex flex-col gap-2">
                <a
                  href={product.gemstone.product_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-purple-600 hover:underline"
                >
                  View Gemstones →
                </a>
                <a
                  href={product.setting.product_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-purple-600 hover:underline"
                >
                  View Settings →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
