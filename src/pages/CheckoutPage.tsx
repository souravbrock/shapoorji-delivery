import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, MapPin, User, Phone, MessageSquare, Loader2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';
import { useToast } from '@/components/Toast';
import { supabase } from '@/lib/supabase';

export default function CheckoutPage() {
  const { items, cartTotal, clearCart } = useCart();
  const { session, profile } = useAuth();
  const { navigate } = useRouter();
  const { showToast } = useToast();
  
  const [name, setName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState<string | null>(null);

  // Auto-fill fields if the profile has them saved
  useEffect(() => {
    if (profile) {
      setName(profile.full_name || '');
      setPhone(profile.phone || '');
      setAddress(profile.address || '');
    }
  }, [profile]);

  if (!session) {
    navigate('/auth');
    return null;
  }

  if (items.length === 0 && !orderPlaced) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Your cart is empty</h2>
        <button onClick={() => navigate('/shop')} className="btn-primary mt-2">Browse Products</button>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !address.trim()) {
      showToast('Please fill in all delivery details', 'error');
      return;
    }
    setPlacing(true);

    try {
      // 1. SAVE PROFILE DATA: This ensures the user doesn't have to re-type it next time!
      await supabase.from('profiles').upsert({
        id: session.user.id,
        full_name: name,
        phone: phone,
        address: address,
        updated_at: new Date().toISOString()
      });

      // 2. Create the Order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: session.user.id,
          total: cartTotal,
          delivery_address: address,
          customer_name: name,
          customer_phone: phone,
          customer_email: session.user.email,
          notes: notes,
          status: 'received',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 3. Insert Order Items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product?.name || '',
        price: item.product?.price ?? 0,
        quantity: item.quantity,
        unit: item.product?.unit || 'each',
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      // 4. Trigger Email & Telegram Notification (Now includes Name, Phone, Address!)
      supabase.functions.invoke('send-order-email', {
        body: {
          type: 'NEW_ORDER',
          customerEmail: session.user.email,
          customerName: name,           
          customerPhone: phone,         
          customerAddress: address,     
          orderDetails: {
            items: orderItems.map(item => ({
              name: item.product_name,
              quantity: item.quantity,
              price: item.price
            })),
            total: cartTotal
          }
        }
      }).catch(err => console.error("Failed to trigger email/telegram:", err));

      await clearCart();
      setOrderPlaced(order.id);
      showToast('Order placed successfully!');
    } catch (err) {
      showToast('Failed to place order. Please try again.', 'error');
      console.error(err);
    }
    setPlacing(false);
  };

  if (orderPlaced) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6 animate-scale-in">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h1 className="font-display font-bold text-3xl text-gray-900 mb-3">Order Confirmed!</h1>
        <p className="text-gray-600 mb-2">Your order has been received and is being processed.</p>
        <p className="text-sm text-gray-400 mb-8">Order ID: {orderPlaced.slice(0, 8).toUpperCase()}</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button onClick={() => navigate(`/orders`)} className="btn-primary">Track My Order</button>
          <button onClick={() => navigate('/shop')} className="btn-secondary">Continue Shopping</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <button onClick={() => navigate('/cart')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm font-medium">
        <ArrowLeft className="w-4 h-4" />
        Back to Cart
      </button>
      <h1 className="font-display font-bold text-2xl sm:text-3xl text-gray-900 mb-6">Checkout</h1>

      <form onSubmit={handlePlaceOrder} className="grid lg:grid-cols-3 gap-6">
        {/* Delivery details */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-6">
            <h3 className="font-display font-semibold text-lg text-gray-900 mb-4">Delivery Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input pl-10" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 84429 80101" className="input pl-10" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} placeholder="Flat number, building, Shapoorji Housing Complex..." className="input pl-10 resize-none" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Order Notes (Optional)</label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Any special instructions for delivery..." className="input pl-10 resize-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="card p-6">
            <h3 className="font-display font-semibold text-lg text-gray-900 mb-4">Order Items ({items.length})</h3>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gray-50 overflow-hidden shrink-0">
                    {item.product?.image_url && <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{item.product?.name}</p>
                    <p className="text-xs text-gray-500">{item.quantity} × ₹{(item.product?.price ?? 0).toFixed(0)}</p>
                  </div>
                  <span className="font-semibold text-sm">₹{((item.product?.price ?? 0) * item.quantity).toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-20">
            <h3 className="font-display font-semibold text-lg text-gray-900 mb-4">Payment Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
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
            
            <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-100">
              <p className="text-sm text-amber-800 font-semibold mb-1">Pay on Delivery (COD/UPI)</p>
              <p className="text-xs text-amber-700 leading-relaxed">Pay easily via Cash or any UPI app (GPay, PhonePe, Paytm) when your order arrives at your doorstep.</p>
            </div>

            <button type="submit" disabled={placing} className="btn-primary w-full mt-6 py-3 shadow-md hover:shadow-lg transition-all">
              {placing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Placing Order...</>
              ) : 'Place Order'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
