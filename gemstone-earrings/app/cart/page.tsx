'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '@/lib/CartContext';

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h1 className="text-2xl md:text-3xl font-bold mb-4">Your Cart is Empty</h1>
          <p className="text-gray-600 mb-8">
            Browse our collection and find the perfect earrings for you.
          </p>
          <Link
            href="/products"
            className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold min-h-[48px] py-3 px-8 rounded"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-8 pb-28 md:pb-8">
      <h1 className="text-2xl md:text-4xl font-bold mb-6 md:mb-8">Shopping Cart</h1>

      <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="space-y-4 md:space-y-0 md:bg-white md:rounded-lg md:shadow">
          {items.map((item, index) => (
            <div
              key={item.product.pair_id}
              className={`bg-white rounded-lg shadow md:rounded-none md:shadow-none md:bg-transparent p-4 md:p-6 ${index !== items.length - 1 ? 'md:border-b' : ''}`}
            >
              {/* Mobile: stacked layout */}
              <div className="flex flex-col md:flex-row md:gap-4">
                {/* Product Image */}
                <Link
                  href={`/products/${item.product.pair_id}`}
                  className="block w-full md:w-24 md:h-24 aspect-square md:aspect-auto bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg md:rounded overflow-hidden relative hover:opacity-80 transition-opacity flex-shrink-0 mb-3 md:mb-0"
                >
                  {item.product.images && item.product.images.length > 0 ? (
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.gemstone.name}
                      fill
                      className="object-cover md:object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl md:text-3xl">💎</div>
                  )}
                </Link>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/products/${item.product.pair_id}`}
                      className="text-base md:text-lg font-semibold hover:text-purple-600 line-clamp-2"
                    >
                      {item.product.gemstone.name}
                    </Link>
                    {/* Item total — visible on desktop */}
                    <div className="hidden md:block text-right flex-shrink-0">
                      <div className="font-bold text-lg">
                        ${(item.product.pricing.total_pair_price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 mt-1">
                    {item.product.gemstone.size} • {item.product.gemstone.shape}
                    {item.product.gemstone.color && ` • ${item.product.gemstone.color}`}
                  </div>

                  <div className="text-lg font-bold text-purple-600 mt-1">
                    ${item.product.pricing.total_pair_price.toFixed(2)}
                    <span className="text-sm font-normal text-gray-500 ml-1">each</span>
                  </div>

                  {/* Quantity + Remove row */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center">
                      <button
                        onClick={() => updateQuantity(item.product.pair_id, item.quantity - 1)}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-l-lg border border-gray-300"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="min-h-[44px] w-12 flex items-center justify-center border-t border-b border-gray-300 text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.pair_id, item.quantity + 1)}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-r-lg border border-gray-300"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Item total — mobile only */}
                      <span className="md:hidden font-bold">
                        ${(item.product.pricing.total_pair_price * item.quantity).toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.product.pair_id)}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center text-red-600 hover:text-red-700"
                        aria-label={`Remove ${item.product.gemstone.name}`}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          </div>

          <div className="hidden md:block">
            <div className="mt-4">
              <button
                onClick={clearCart}
                className="text-red-600 hover:text-red-700 font-medium min-h-[44px]"
              >
                Clear Cart
              </button>
            </div>
          </div>

          {/* Mobile clear cart */}
          <div className="md:hidden">
            <button
              onClick={clearCart}
              className="w-full text-red-600 hover:text-red-700 font-medium min-h-[44px] text-center"
            >
              Clear Cart
            </button>
          </div>
        </div>

        {/* Order Summary — hidden on mobile (replaced by sticky bar) */}
        <div className="hidden md:block lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-24">
            <h2 className="text-2xl font-bold mb-6">Order Summary</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal:</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Shipping:</span>
                <span className="text-green-600">FREE</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-xl font-bold">
                <span>Total:</span>
                <span className="text-purple-600">${totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold min-h-[48px] py-3 px-6 rounded mb-4">
              Proceed to Checkout
            </button>

            <Link
              href="/products"
              className="block text-center text-purple-600 hover:underline min-h-[44px] leading-[44px]"
            >
              Continue Shopping
            </Link>

            {/* Trust Badges */}
            <div className="mt-6 pt-6 border-t">
              <div className="text-sm text-gray-600 space-y-2">
                <div className="flex items-center gap-2">
                  <span>✓</span>
                  <span>Secure Payment</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>✓</span>
                  <span>Free Shipping</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>✓</span>
                  <span>30-Day Returns</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Checkout Bar */}
      <div
        className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.08)] p-3 z-40 md:hidden"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">
            {items.length} {items.length === 1 ? 'item' : 'items'} • Free shipping
          </span>
          <span className="text-xl font-bold text-purple-600">${totalPrice.toFixed(2)}</span>
        </div>
        <button className="w-full bg-purple-600 active:bg-purple-700 text-white font-bold min-h-[48px] rounded-lg">
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}
