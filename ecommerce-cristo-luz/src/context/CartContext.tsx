import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { CartItem } from "../types/product";
import { getProductById } from "../data/products";

const STORAGE_KEY = "cristo-luz-cart";

function lineMatches(item: CartItem, productId: string, size?: string, color?: string): boolean {
  return item.productId === productId && item.size === size && item.color === color;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addToCart: (productId: string, quantity?: number, size?: string, color?: string) => void;
  increment: (productId: string, size?: string, color?: string) => void;
  decrement: (productId: string, size?: string, color?: string) => void;
  removeFromCart: (productId: string, size?: string, color?: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function readInitialCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(readInitialCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function addToCart(productId: string, quantity = 1, size?: string, color?: string) {
    setItems((current) => {
      const existing = current.find((item) => lineMatches(item, productId, size, color));
      if (existing) {
        return current.map((item) =>
          lineMatches(item, productId, size, color)
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }
      return [...current, { productId, quantity, size, color }];
    });
  }

  function increment(productId: string, size?: string, color?: string) {
    setItems((current) =>
      current.map((item) =>
        lineMatches(item, productId, size, color)
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      ),
    );
  }

  function decrement(productId: string, size?: string, color?: string) {
    setItems((current) =>
      current
        .map((item) =>
          lineMatches(item, productId, size, color)
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function removeFromCart(productId: string, size?: string, color?: string) {
    setItems((current) => current.filter((item) => !lineMatches(item, productId, size, color)));
  }

  function clearCart() {
    setItems([]);
  }

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        const product = getProductById(item.productId);
        return product ? sum + product.price * item.quantity : sum;
      }, 0),
    [items],
  );

  const value: CartContextValue = {
    items,
    itemCount,
    subtotal,
    addToCart,
    increment,
    decrement,
    removeFromCart,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe usarse dentro de un CartProvider");
  }
  return context;
}
