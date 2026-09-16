import { useState } from 'react';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';
import { num } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';
import { useToast } from '@/components/Toast';

export default function CartPage() {
  const { items, loading, updateQuantity, removeFromCart, cartTotal } = useCart();
  const { session } = useAuth();
  const { navigate } = useRouter();
  const { showToast } = useToast();

  const handleUpdate = async (productId: string, quantity: number) => {
    try {
      await updateQuantity(productId, quantity);
    } catch {
      showToast('Could not update cart. Please try again.', 'error');
    }
  };

  const handleRemove = async (productId: string) => {
    try {
      await removeFromCart(productId);
    } catch {
      showToast('Could not remove item. Please try again.', 'error');
    }
  };

  if (!session) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
        <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Sign in to view your cart</h2>
        <button onClick={() => navigate('/auth')} className="btn-primary mt-2">Sign In</button>
      </div>
    );
  }

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8"><div className="card p-8 animate-pulse h-64" /></div>;
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
        <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-4">Browse our products and add items to your cart.</p>
        <button onClick={() => navigate('/shop')} className="btn-primary">Start Shopping</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display font-bold text-2xl sm:text-3xl text-gray-900 mb-6">Shopping Cart</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="card p-4 flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl bg-gray-50 overflow-hidden shrink-0">
                {item.product?.image_url ? (
                  <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-8 h-8 text-gray-300" /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <button onClick={() => navigate(`/product/${item.product_id}`)} className="font-medium text-gray-900 hover:text-primary-700 transition-colors text-left">
                  {item.product?.name || 'Unknown product'}
                </button>
                <p className="text-xs text-gray-500">{item.product?.unit}</p>
                <p className="font-display font-bold text-gray-900 mt-1">₹{num(item.product?.price).toFixed(0)}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg p-1">
                  <button
                    onClick={() => handleUpdate(item.product_id, item.quantity - 1)}
                    className="w-7 h-7 rounded-md bg-white flex items-center justify-center hover:bg-gray-100 transition-colors shadow-sm"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-semibold text-sm w-6 text-center">{item.quantity}</span>
                  <button
                    onClick={() => handleUpdate(item.product_id, item.quantity + 1)}
                    className="w-7 h-7 rounded-md bg-white flex items-center justify-center hover:bg-gray-100 transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-gray-700">₹{((item.product?.price ?? 0) * item.quantity).toFixed(0)}</span>
                  <button
                    onClick={() => handleRemove(item.product_id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          <button onClick={() => navigate('/shop')} className="flex items-center gap-2 text-primary-600 font-medium text-sm hover:gap-3 transition-all mt-4">
            <ArrowLeft className="w-4 h-4" />
            Continue Shopping
          </button>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-20">
            <h3 className="font-display font-semibold text-lg text-gray-900 mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Items ({items.reduce((s, i) => s + i.quantity, 0)})</span>
                <span>₹{cartTotal.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery</span>
                <span className="text-green-600 font-medium">FREE</span>
              </div>
              <div className="border-t border-gray-100 pt-3 mt-3 flex justify-between font-semibold text-gray-900 text-base">
                <span>Total</span>
                <span>₹{cartTotal.toFixed(0)}</span>
              </div>
            </div>
            <button onClick={() => navigate('/checkout')} className="btn-primary w-full mt-6 py-3">
              Proceed to Checkout
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
