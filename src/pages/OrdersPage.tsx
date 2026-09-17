import { useEffect, useState } from 'react';
import { Package, Clock, CheckCircle, Truck, XCircle, Download, ChevronRight, ArrowLeft } from 'lucide-react';
import { api, num, type Order, type OrderItem, type OrderStatus } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';
import { useToast } from '@/components/Toast';
import { downloadInvoicePDF } from '@/lib/invoice';

const statusConfig: Record<OrderStatus, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; step: number }> = {
  received: { label: 'Order Received', icon: Clock, color: 'text-blue-600 bg-blue-50', step: 1 },
  packed: { label: 'Order Packed', icon: Package, color: 'text-amber-600 bg-amber-50', step: 2 },
  out_for_delivery: { label: 'Out for Delivery', icon: Truck, color: 'text-accent-600 bg-accent-50', step: 3 },
  delivered: { label: 'Delivered', icon: CheckCircle, color: 'text-green-600 bg-green-50', step: 4 },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-red-600 bg-red-50', step: 0 },
};

export default function OrdersPage() {
  const { session } = useAuth();
  const { navigate } = useRouter();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    if (!session?.user) return;
    (async () => {
      const data = await api.get<Order[]>('/api/orders').catch((err) => {
        console.error(err);
        return [];
      });
      setOrders(data);
      setLoading(false);
    })();
  }, [session]);

  const viewOrder = async (order: Order) => {
    setSelectedOrder(order);
    const data = await api.get<OrderItem[]>(`/api/orders/${order.id}/items`).catch(() => []);
    setOrderItems(data);
  };

  const downloadInvoice = async (order: Order, items: OrderItem[]) => {
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadInvoicePDF(order, items);
    } catch (err) {
      console.error('Invoice PDF failed:', err);
      showToast('Could not generate the invoice PDF. Please try again.', 'error');
    }
    setDownloading(false);
  };

  if (!session) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Sign in to view your orders</h2>
        <button onClick={() => navigate('/auth')} className="btn-primary mt-2">Sign In</button>
      </div>
    );
  }

  if (selectedOrder) {
    const config = statusConfig[selectedOrder.status];
    const steps = ['received', 'packed', 'out_for_delivery', 'delivered'] as OrderStatus[];
    const currentStep = config.step;

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <button onClick={() => setSelectedOrder(null)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </button>

        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-display font-bold text-2xl text-gray-900">Order #{selectedOrder.id.slice(0, 8).toUpperCase()}</h1>
              <p className="text-sm text-gray-500 mt-1">
                Placed on {new Date(selectedOrder.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <button onClick={() => downloadInvoice(selectedOrder, orderItems)} disabled={downloading} className="btn-secondary text-sm disabled:opacity-50">
              <Download className="w-4 h-4" />
              {downloading ? 'Preparing PDF…' : 'Invoice (PDF)'}
            </button>
          </div>

          {/* Status tracker */}
          {selectedOrder.status !== 'cancelled' ? (
            <div className="flex items-center justify-between mb-2 mt-8">
              {steps.map((step, idx) => {
                const sc = statusConfig[step];
                const Icon = sc.icon;
                const isActive = idx < currentStep;
                const isCurrent = idx === currentStep - 1;
                return (
                  <div key={step} className="flex flex-col items-center flex-1 relative">
                    {idx < steps.length - 1 && (
                      <div className={`absolute top-5 left-1/2 w-full h-0.5 ${idx < currentStep - 1 ? 'bg-primary-500' : 'bg-gray-200'}`} />
                    )}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-colors ${
                      isActive ? 'bg-primary-600 text-white' : isCurrent ? 'bg-primary-100 text-primary-600 ring-4 ring-primary-100' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-xs mt-2 font-medium text-center ${isActive || isCurrent ? 'text-gray-900' : 'text-gray-400'}`}>
                      {sc.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 mt-4">
              <XCircle className="w-6 h-6 text-red-500" />
              <span className="font-medium text-red-700">This order has been cancelled.</span>
            </div>
          )}
        </div>

        {/* Delivery info */}
        <div className="card p-6 mb-6">
          <h3 className="font-display font-semibold text-lg text-gray-900 mb-4">Delivery Information</h3>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Name</p>
              <p className="font-medium text-gray-900">{selectedOrder.customer_name}</p>
            </div>
            <div>
              <p className="text-gray-500">Phone</p>
              <p className="font-medium text-gray-900">{selectedOrder.customer_phone}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-gray-500">Address</p>
              <p className="font-medium text-gray-900">{selectedOrder.delivery_address}</p>
            </div>
            {selectedOrder.notes && (
              <div className="sm:col-span-2">
                <p className="text-gray-500">Notes</p>
                <p className="font-medium text-gray-900">{selectedOrder.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="card p-6">
          <h3 className="font-display font-semibold text-lg text-gray-900 mb-4">Order Items</h3>
          <div className="space-y-3">
            {orderItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="font-medium text-sm text-gray-900">{item.product_name}</p>
                  <p className="text-xs text-gray-500">{item.quantity} × ₹{num(item.price).toFixed(0)} / {item.unit}</p>
                </div>
                <span className="font-semibold text-sm">₹{(item.price * item.quantity).toFixed(0)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
            <span className="font-display font-semibold text-lg text-gray-900">Total</span>
            <span className="font-display font-bold text-xl text-gray-900">₹{num(selectedOrder.total).toFixed(0)}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display font-bold text-2xl sm:text-3xl text-gray-900 mb-6">My Orders</h1>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="card p-6 h-24 animate-pulse" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="card p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No orders yet</h2>
          <p className="text-gray-500 mb-4">Your order history will appear here.</p>
          <button onClick={() => navigate('/shop')} className="btn-primary">Start Shopping</button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const config = statusConfig[order.status];
            const Icon = config.icon;
            return (
              <button
                key={order.id}
                onClick={() => viewOrder(order)}
                className="card p-4 flex items-center gap-4 w-full text-left hover:shadow-md transition-shadow group"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${config.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · ₹{num(order.total).toFixed(0)}
                  </p>
                  <span className={`badge ${config.color} mt-1`}>{config.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
