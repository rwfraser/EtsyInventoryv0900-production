'use client';

import Link from 'next/link';
import { useCart } from '@/lib/CartContext';

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
          <p className="text-gray-600 mb-8">
            Browse our collection and find the perfect earrings for you.
          </p>
          <Link
            href="/products"
            className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Shopping Cart</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            {items.map((item, index) => (
              <div
                key={item.product.pair_id}
                className={`p-6 ${index !== items.length - 1 ? 'border-b' : ''}`}
              >
                <div className="flex gap-4">
                  {/* Product Image */}
                  <div className="flex-shrink-0 w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded flex items-center justify-center">
                    <div className="text-3xl">💎</div>
                  </div>

                  {/* Product Info */}
                  <div className="flex-1">
                    <Link
                      href={`/products/${item.product.pair_id}`}
                      className="text-lg font-semibold hover:text-purple-600 line-clamp-2"
                    >
                      {item.product.gemstone.name}
                    </Link>
                    
                    <div className="text-sm text-gray-600 mt-1">
                      {item.product.gemstone.size} • {item.product.gemstone.shape}
                      {item.product.gemstone.color && ` • ${item.product.gemstone.color}`}
                    </div>

                    <div className="text-lg font-bold text-purple-600 mt-2">
                      ${item.product.pricing.total_pair_price.toFixed(2)}
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.product.pair_id, item.quantity - 1)}
                          className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center"
                        >
                          −
                        </button>
                        <span className="w-12 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.pair_id, item.quantity + 1)}
                          className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product.pair_id)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Item Total */}
                  <div className="text-right">
                    <div className="font-bold text-lg">
                      ${(item.product.pricing.total_pair_price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <button
              onClick={clearCart}
              className="text-red-600 hover:text-red-700 font-medium"
            >
              Clear Cart
            </button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
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

            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded mb-4">
              Proceed to Checkout
            </button>

            <Link
              href="/products"
              className="block text-center text-purple-600 hover:underline"
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
    </div>
  );
}
