import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { api, type CartItem } from '@/lib/api';
import { useAuth } from './AuthContext';

type CartContextType = {
  items: CartItem[];
  loading: boolean;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  cartCount: number;
  cartTotal: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!session?.user) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const data = await api.get<CartItem[]>('/api/cart');
      setItems(data);
    } catch (err) {
      console.error('Error fetching cart:', err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = useCallback(async (productId: string, quantity = 1) => {
    if (!session?.user) return;
    try {
      await api.post('/api/cart', { product_id: productId, quantity });
      await fetchCart();
    } catch (err) {
      console.error('Error adding to cart:', err);
    }
  }, [session, fetchCart]);

  const removeFromCart = useCallback(async (productId: string) => {
    if (!session?.user) return;
    try {
      await api.delete(`/api/cart/${productId}`);
      await fetchCart();
    } catch (err) {
      console.error('Error removing from cart:', err);
    }
  }, [session, fetchCart]);

  const updateQuantity = useCallback(async (productId: string, quantity: number) => {
    if (!session?.user) return;
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }
    try {
      await api.put(`/api/cart/${productId}`, { quantity });
      await fetchCart();
    } catch (err) {
      console.error('Error updating cart:', err);
    }
  }, [session, fetchCart, removeFromCart]);

  const clearCart = useCallback(async () => {
    if (!session?.user) return;
    try {
      await api.delete('/api/cart');
      setItems([]);
    } catch (err) {
      console.error('Error clearing cart:', err);
    }
  }, [session]);

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = items.reduce((sum, item) => {
    const price = item.product?.price ?? 0;
    return sum + price * item.quantity;
  }, 0);

  return (
    <CartContext.Provider value={{ items, loading, addToCart, updateQuantity, removeFromCart, clearCart, cartCount, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
