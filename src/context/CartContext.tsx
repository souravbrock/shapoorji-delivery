import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase, type CartItem, type Product } from '@/lib/supabase';
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
    const { data, error } = await supabase
      .from('cart_items')
      .select('*, product:products(*)')
      .eq('user_id', session.user.id);
    if (error) {
      console.error('Error fetching cart:', error);
    } else {
      setItems(data as CartItem[]);
    }
    setLoading(false);
  }, [session]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = useCallback(async (productId: string, quantity = 1) => {
    if (!session?.user) return;
    const { error } = await supabase
      .from('cart_items')
      .upsert(
        { user_id: session.user.id, product_id: productId, quantity },
        { onConflict: 'user_id,product_id' }
      );
    if (error) {
      console.error('Error adding to cart:', error);
      return;
    }
    await fetchCart();
  }, [session, fetchCart]);

  const updateQuantity = useCallback(async (productId: string, quantity: number) => {
    if (!session?.user) return;
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('user_id', session.user.id)
      .eq('product_id', productId);
    if (error) {
      console.error('Error updating cart:', error);
      return;
    }
    await fetchCart();
  }, [session, fetchCart]);

  const removeFromCart = useCallback(async (productId: string) => {
    if (!session?.user) return;
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', session.user.id)
      .eq('product_id', productId);
    if (error) {
      console.error('Error removing from cart:', error);
      return;
    }
    await fetchCart();
  }, [session, fetchCart]);

  const clearCart = useCallback(async () => {
    if (!session?.user) return;
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', session.user.id);
    if (error) {
      console.error('Error clearing cart:', error);
      return;
    }
    setItems([]);
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
