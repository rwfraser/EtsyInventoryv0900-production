'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { EarringPair } from './types';

interface CartItem {
  product: EarringPair;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: EarringPair, quantity?: number) => void;
  removeFromCart: (pairId: string) => void;
  updateQuantity: (pairId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setItems(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: EarringPair, quantity: number = 1) => {
    setItems(prev => {
      const existing = prev.find(item => item.product.pair_id === product.pair_id);
      if (existing) {
        return prev.map(item =>
          item.product.pair_id === product.pair_id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (pairId: string) => {
    setItems(prev => prev.filter(item => item.product.pair_id !== pairId));
  };

  const updateQuantity = (pairId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(pairId);
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item.product.pair_id === pairId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.product.pricing.total_pair_price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
