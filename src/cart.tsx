"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "./apiClient";
import { useAuth } from "./auth";
import type { Cart } from "@/types";

interface CartContextValue {
  cart: Cart | null;
  itemCount: number;
  loading: boolean;
  refreshCart: () => Promise<void>;
  addItem: (input: { foodItemId: string; quantity: number; notes?: string; variationIds?: string[] }) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!user || user.role !== "CUSTOMER") {
      setCart(null);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get<Cart>("/cart");
      setCart(res);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addItem: CartContextValue["addItem"] = async (input) => {
    const res = await api.post<Cart>("/cart/items", input);
    setCart(res);
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    const res = await api.patch<Cart>(`/cart/items/${itemId}`, { quantity });
    setCart(res);
  };

  const removeItem = async (itemId: string) => {
    const res = await api.delete<Cart>(`/cart/items/${itemId}`);
    setCart(res);
  };

  const clearCart = async () => {
    const res = await api.delete<Cart>("/cart");
    setCart(res);
  };

  const itemCount = cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

  return (
    <CartContext.Provider value={{ cart, itemCount, loading, refreshCart, addItem, updateQuantity, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
