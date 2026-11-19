import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CartItem, FoodItem, SCHEMA_LIMITS } from '../types';

const CART_STORAGE_KEY = 'smart_canteen_cart_v1';

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  isDrawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  addItem: (food: FoodItem, quantity?: number) => void;
  updateQuantity: (foodId: string, quantity: number) => void;
  removeItem: (foodId: string) => void;
  clearCart: () => void;
  getItemQuantity: (foodId: string) => number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function loadInitialCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadInitialCart);
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage quota errors
    }
  }, [items]);

  const addItem = useCallback((food: FoodItem, quantity = 1) => {
    if (!food.available) return;
    setItems((prev) => {
      const existing = prev.find((i) => i.foodId === food.id);
      if (existing) {
        const nextQty = Math.min(existing.quantity + quantity, SCHEMA_LIMITS.ORDER_ITEM_MAX_QTY);
        return prev.map((i) =>
          i.foodId === food.id
            ? {
                ...i,
                price: food.price,
                name: food.name,
                imageUrl: food.imageUrl,
                quantity: nextQty,
              }
            : i,
        );
      }
      if (prev.length >= SCHEMA_LIMITS.ORDER_MAX_ITEMS) {
        return prev;
      }
      return [
        ...prev,
        {
          foodId: food.id,
          name: food.name,
          price: food.price,
          quantity: Math.min(Math.max(1, quantity), SCHEMA_LIMITS.ORDER_ITEM_MAX_QTY),
          imageUrl: food.imageUrl,
          category: food.category,
          prepTimeMinutes: food.prepTimeMinutes,
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback((foodId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.foodId !== foodId));
      return;
    }
    const clamped = Math.min(quantity, SCHEMA_LIMITS.ORDER_ITEM_MAX_QTY);
    setItems((prev) =>
      prev.map((i) => (i.foodId === foodId ? { ...i, quantity: clamped } : i)),
    );
  }, []);

  const removeItem = useCallback((foodId: string) => {
    setItems((prev) => prev.filter((i) => i.foodId !== foodId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getItemQuantity = useCallback(
    (foodId: string) => items.find((i) => i.foodId === foodId)?.quantity ?? 0,
    [items],
  );

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        subtotal,
        isDrawerOpen,
        setDrawerOpen,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}
