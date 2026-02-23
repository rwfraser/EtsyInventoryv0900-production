'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { EarringPair } from './types';
import { useSession } from 'next-auth/react';

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
  const [isInitialized, setIsInitialized] = useState(false);
  const { data: session, status } = useSession();

  // Load cart from localStorage and database on mount
  useEffect(() => {
    if (status === 'loading') return;

    const loadCart = async () => {
      // First, load from localStorage
      const savedCart = localStorage.getItem('cart');
      const localItems: CartItem[] = savedCart ? JSON.parse(savedCart) : [];

      // If user is authenticated, load from database and merge
      if (session?.user) {
        try {
          const response = await fetch('/api/cart/load');
          if (response.ok) {
            const data = await response.json();
            const dbItems: CartItem[] = data.items || [];

            // Merge local and database carts
            const mergedItems = mergeCarts(localItems, dbItems);
            setItems(mergedItems);

            // Sync merged cart back to database
            if (mergedItems.length > 0) {
              await syncCartToDatabase(mergedItems);
            }
          } else {
            setItems(localItems);
          }
        } catch (error) {
          console.error('Failed to load cart from database:', error);
          setItems(localItems);
        }
      } else {
        setItems(localItems);
      }

      setIsInitialized(true);
    };

    loadCart();
  }, [session, status]);

  // Save cart to localStorage and sync to database whenever it changes
  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem('cart', JSON.stringify(items));
    
    // Sync to database immediately if user is authenticated
    if (session?.user) {
      syncCartToDatabase(items);
    }
  }, [items, isInitialized, session]);

  // No longer need periodic sync - we sync immediately on every change

  // Merge local and database carts
  const mergeCarts = (localItems: CartItem[], dbItems: CartItem[]): CartItem[] => {
    const merged = [...dbItems];

    localItems.forEach(localItem => {
      const existingIndex = merged.findIndex(
        item => item.product.pair_id === localItem.product.pair_id
      );

      if (existingIndex >= 0) {
        // If item exists in both, use the higher quantity
        merged[existingIndex].quantity = Math.max(
          merged[existingIndex].quantity,
          localItem.quantity
        );
      } else {
        // Add new item from local cart
        merged.push(localItem);
      }
    });

    return merged;
  };

  // Sync cart to database
  const syncCartToDatabase = async (cartItems: CartItem[]) => {
    try {
      await fetch('/api/cart/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cartItems }),
      });
    } catch (error) {
      console.error('Failed to sync cart to database:', error);
    }
  };

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
