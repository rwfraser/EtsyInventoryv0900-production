'use client';

import Link from 'next/link';
import { useCart } from '@/lib/CartContext';
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';

export default function Header() {
  const { totalItems, items, removeFromCart, totalPrice } = useCart();
  const [showCart, setShowCart] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { data: session } = useSession();

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-3xl">💎</span>
            <h1 className="text-2xl font-bold text-purple-600">
              Gemstone Earrings
            </h1>
          </Link>

          <nav className="flex items-center space-x-6">
            {session && (
              <>
                <Link href="/products" className="text-gray-700 hover:text-purple-600 font-medium">
                  Browse All
                </Link>
                <Link href="/returns" className="text-gray-700 hover:text-purple-600 font-medium">
                  Returns
                </Link>
              </>
            )}
            
            {/* User Menu */}
            {session && (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-purple-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{session.user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        signOut({ callbackUrl: '/' });
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Cart */}
            {session && (
              <div className="relative">
              <button
                onClick={() => setShowCart(!showCart)}
                className="flex items-center space-x-2 text-gray-700 hover:text-purple-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>

              {showCart && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto">
                  {items.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      Your cart is empty
                    </div>
                  ) : (
                    <>
                      <div className="p-4">
                        {items.map(item => (
                          <div key={item.product.pair_id} className="flex items-center justify-between mb-3 pb-3 border-b">
                            <div className="flex-1">
                              <p className="text-sm font-medium line-clamp-1">
                                {item.product.gemstone.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                ${item.product.pricing.total_pair_price.toFixed(2)} × {item.quantity}
                              </p>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.product.pair_id)}
                              className="text-red-500 hover:text-red-700 ml-2"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                      
                      <div className="border-t p-4 bg-gray-50">
                        <div className="flex justify-between font-bold text-lg mb-3">
                          <span>Total:</span>
                          <span>${totalPrice.toFixed(2)}</span>
                        </div>
                        <Link
                          href="/cart"
                          onClick={() => setShowCart(false)}
                          className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded text-center"
                        >
                          View Cart & Checkout
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              )}
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
