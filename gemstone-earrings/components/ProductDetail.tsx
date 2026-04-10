'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Minus, Plus, ShoppingCart } from 'lucide-react';
import { EarringPair } from '@/lib/types';
import { useCart } from '@/lib/CartContext';

interface ProductDetailProps {
  product: EarringPair;
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const [addedToCart, setAddedToCart] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <div className="container mx-auto px-4 py-6 md:py-8 pb-28 md:pb-8">
      <Link href="/products" className="text-purple-600 hover:underline mb-4 inline-flex items-center gap-1 min-h-[44px]">
        <ChevronLeft className="w-4 h-4" />
        Back to Products
      </Link>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="grid md:grid-cols-2 gap-4 md:gap-8">
          {/* Product Image Gallery */}
          <div className="p-3 md:p-4">
            {/* Main Image */}
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 aspect-square flex items-center justify-center relative rounded-lg overflow-hidden mb-3 md:mb-4">
              {product.images && product.images.length > 0 ? (
                <>
                  <Image
                    src={product.images[currentImageIndex]}
                    alt={`${product.gemstone.name} - Image ${currentImageIndex + 1}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-contain p-4 md:p-8"
                  />
                  {/* Navigation Arrows */}
                  {product.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentImageIndex((prev) => 
                          prev === 0 ? (product.images?.length ?? 1) - 1 : prev - 1
                        )}
                        className="absolute left-1 md:left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center shadow-lg transition-colors"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={() => setCurrentImageIndex((prev) => 
                          prev === (product.images?.length ?? 1) - 1 ? 0 : prev + 1
                        )}
                        className="absolute right-1 md:right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center shadow-lg transition-colors"
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="text-7xl md:text-9xl">💎</div>
              )}
            </div>
            
            {/* Thumbnail Navigation — snap scroll */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all snap-start ${
                      currentImageIndex === index
                        ? 'border-purple-600 ring-2 ring-purple-300'
                        : 'border-gray-200 hover:border-purple-400'
                    }`}
                  >
                    <div className="relative w-full h-full bg-gradient-to-br from-purple-50 to-pink-50">
                      <Image
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="p-4 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">{product.gemstone.name}</h1>
            
            {/* Description */}
            {product.description && (
              <div className="mb-4 md:mb-6 text-gray-700">
                <p className="leading-relaxed text-sm md:text-base">{product.description}</p>
              </div>
            )}
            
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <span className="text-3xl md:text-4xl font-bold text-purple-600">
                ${product.pricing.total_pair_price.toFixed(2)}
              </span>
            </div>

            {/* Gemstone Details */}
            <div className="mb-4 md:mb-6">
              <h2 className="text-lg md:text-xl font-semibold mb-2 md:mb-3">Gemstone Details</h2>
              <div className="space-y-2 text-sm md:text-base text-gray-700">
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
            <div className="mb-4 md:mb-6">
              <h2 className="text-lg md:text-xl font-semibold mb-2 md:mb-3">Setting Details</h2>
              <div className="space-y-2 text-sm md:text-base text-gray-700">
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
            <div className="mb-4 md:mb-6 p-3 md:p-4 bg-gray-50 rounded">
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

            {/* Quantity and Add to Cart — desktop only (mobile uses sticky bar) */}
            <div className="hidden md:block">
              <div className="flex items-center gap-4 mb-4">
                <label className="font-medium">Quantity:</label>
                <div className="flex items-center">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center border rounded-l-lg hover:bg-gray-100"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    inputMode="numeric"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 min-h-[44px] text-center border-t border-b appearance-none"
                  />
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center border rounded-r-lg hover:bg-gray-100"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                className={`w-full font-bold min-h-[48px] py-3 px-6 rounded transition-colors ${
                  addedToCart
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-purple-600 hover:bg-purple-700'
                } text-white`}
              >
                {addedToCart ? '✓ Added to Cart!' : 'Add to Cart'}
              </button>
            </div>

            {/* External Links */}
            <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t">
              <p className="text-sm text-gray-600 mb-2">View component products:</p>
              <div className="flex flex-col gap-2">
                <a
                  href={product.gemstone.product_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-purple-600 hover:underline min-h-[44px] inline-flex items-center"
                >
                  View Gemstones →
                </a>
                <a
                  href={product.setting.product_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-purple-600 hover:underline min-h-[44px] inline-flex items-center"
                >
                  View Settings →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div
        className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.08)] p-3 z-40 flex items-center gap-3 md:hidden"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        {/* Price */}
        <div className="flex flex-col leading-tight">
          <span className="text-xs text-gray-500">Total</span>
          <span className="text-lg font-bold text-purple-600">
            ${product.pricing.total_pair_price.toFixed(2)}
          </span>
        </div>

        {/* Quantity stepper */}
        <div className="flex items-center">
          <button
            onClick={() => setQuantity(q => Math.max(1, q - 1))}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center border rounded-l-lg"
            aria-label="Decrease quantity"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="min-h-[44px] w-10 flex items-center justify-center border-t border-b text-sm font-medium">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity(q => q + 1)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center border rounded-r-lg"
            aria-label="Increase quantity"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Add to Cart button */}
        <button
          onClick={handleAddToCart}
          className={`flex-1 min-h-[48px] flex items-center justify-center gap-2 font-bold rounded-lg transition-colors text-white ${
            addedToCart
              ? 'bg-green-600'
              : 'bg-purple-600 active:bg-purple-700'
          }`}
        >
          <ShoppingCart className="w-5 h-5" />
          {addedToCart ? 'Added!' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
