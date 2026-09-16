import { useEffect, useState } from 'react';
import { Package, LayoutDashboard, Plus, Pencil, Trash2, X, Search, Clock, CheckCircle, Truck, XCircle, TrendingUp, IndianRupee, ShoppingBag, Upload, Loader2, Bell, Send } from 'lucide-react';
import { api, num, type Product, type Category, type Order, type OrderStatus, type OrderItem } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';
import { useToast } from '@/components/Toast';
import Modal from '@/components/Modal';

type Tab = 'dashboard' | 'products' | 'orders' | 'alerts';

export default function AdminPage() {
  const { profile, session } = useAuth();
  const { navigate } = useRouter();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session && profile && profile.role !== 'admin') {
      navigate('/');
    }
  }, [session, profile, navigate]);

  useEffect(() => {
    (async () => {
      await Promise.all([fetchProducts(), fetchOrders()]);
      const cats = await api.get<Category[]>('/api/categories').catch(() => []);
      setCategories(cats);
      setLoading(false);
    })();
  }, []);

  const fetchProducts = async () => {
    const data = await api.get<Product[]>('/api/products?orderBy=created_at_desc').catch(() => []);
    setProducts(data);
  };

  const fetchOrders = async () => {
    const data = await api.get<Order[]>('/api/orders?all=1').catch(() => []);
    setOrders(data);
  };

  if (!session || !profile || profile.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
        <ShieldIcon />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Admin access required</h2>
        <p className="text-gray-500 mb-4">You need administrator privileges to access this page.</p>
        <button onClick={() => navigate('/')} className="btn-primary">Go Home</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-accent-100 flex items-center justify-center">
          <LayoutDashboard className="w-5 h-5 text-accent-600" />
        </div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-gray-900">Admin Panel</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        <TabButton active={tab === 'dashboard'} onClick={() => setTab('dashboard')} icon={LayoutDashboard} label="Dashboard" />
        <TabButton active={tab === 'products'} onClick={() => setTab('products')} icon={Package} label="Products" />
        <TabButton active={tab === 'orders'} onClick={() => setTab('orders')} icon={ShoppingBag} label="Orders" />
        <TabButton active={tab === 'alerts'} onClick={() => setTab('alerts')} icon={Bell} label="Alerts" />
      </div>

      {loading ? (
        <div className="card p-8 animate-pulse h-64" />
      ) : (
        <>
          {tab === 'dashboard' && <DashboardTab products={products} orders={orders} onGoOrders={() => setTab('orders')} />}
          {tab === 'products' && <ProductsTab products={products} categories={categories} onRefresh={fetchProducts} />}
          {tab === 'orders' && <OrdersTab orders={orders} onRefresh={fetchOrders} />}
          {tab === 'alerts' && <AlertsTab />}
        </>
      )}
    </div>
  );
}

// ============================================================
// DASHBOARD
// ============================================================
function DashboardTab({ products, orders, onGoOrders }: { products: Product[]; orders: Order[]; onGoOrders: () => void }) {
  const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + num(o.total), 0);
  const pendingOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;

  const recentOrders = [...orders].slice(0, 5);

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={IndianRupee} label="Total Revenue" value={`₹${totalRevenue.toFixed(0)}`} color="green" />
        <StatCard icon={ShoppingBag} label="Total Orders" value={orders.length.toString()} color="blue" />
        <StatCard icon={Clock} label="Pending Orders" value={pendingOrders.toString()} color="amber" />
        <StatCard icon={Package} label="Products" value={products.length.toString()} color="accent" />
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-lg text-gray-900">Recent Orders</h3>
          <button onClick={onGoOrders} className="text-primary-600 text-sm font-medium hover:underline">View all</button>
        </div>
        {recentOrders.length === 0 ? (
          <p className="text-gray-400 text-sm py-8 text-center">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 font-medium text-gray-500">Order ID</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500">Customer</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500">Date</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500">Total</th>
                  <th className="text-center py-2 px-3 font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 px-3 font-mono text-xs">#{order.id.slice(0, 8).toUpperCase()}</td>
                    <td className="py-3 px-3">{order.customer_name}</td>
                    <td className="py-3 px-3 text-gray-500">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                    <td className="py-3 px-3 text-right font-semibold">₹{num(order.total).toFixed(0)}</td>
                    <td className="py-3 px-3 text-center"><StatusBadge status={order.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    accent: 'bg-accent-50 text-accent-600',
  };
  return (
    <div className="card p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-display font-bold text-2xl text-gray-900 mt-1">{value}</p>
    </div>
  );
}

// ============================================================
// PRODUCTS
// ============================================================
function ProductsTab({ products, categories, onRefresh }: { products: Product[]; categories: Category[]; onRefresh: () => Promise<void> }) {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null);

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const handleDelete = async (product: Product) => {
    try {
      await api.delete(`/api/products/${product.id}`);
      showToast('Product deleted');
      await onRefresh();
    } catch {
      showToast('Failed to delete product', 'error');
    }
    setDeleteConfirm(null);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="input pl-10" />
        </div>
        <button onClick={() => { setEditingProduct(null); setShowForm(true); }} className="btn-primary whitespace-nowrap">
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Product</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Category</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Price</th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">Stock</th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">Status</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr key={product.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-50 overflow-hidden shrink-0">
                        {product.image_url && <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.unit}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{product.category?.name || '—'}</td>
                  <td className="py-3 px-4 text-right font-semibold">₹{num(product.price).toFixed(0)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={product.stock <= 0 ? 'text-red-600 font-medium' : product.stock < 10 ? 'text-amber-600 font-medium' : 'text-gray-700'}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {product.is_active ? (
                      <span className="badge bg-green-50 text-green-700">Active</span>
                    ) : (
                      <span className="badge bg-gray-100 text-gray-500">Hidden</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setEditingProduct(product); setShowForm(true); }} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                        <Pencil className="w-4 h-4 text-gray-600" />
                      </button>
                      <button onClick={() => setDeleteConfirm(product)} className="p-2 rounded-lg hover:bg-red-50 transition-colors">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <ProductForm
          product={editingProduct}
          categories={categories}
          onClose={() => setShowForm(false)}
          onSaved={async () => { await onRefresh(); setShowForm(false); }}
        />
      )}

      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Product" maxWidth="max-w-sm">
        <p className="text-gray-600 mb-6">Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>? This action cannot be undone.</p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setDeleteConfirm(null)} className="btn-secondary">Cancel</button>
          <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="btn-danger">Delete</button>
        </div>
      </Modal>
    </div>
  );
}

function ProductForm({ product, categories, onClose, onSaved }: { product: Product | null; categories: Category[]; onClose: () => void; onSaved: () => void }) {
  const { showToast } = useToast();
  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [price, setPrice] = useState(product?.price?.toString() || '');
  const [unit, setUnit] = useState(product?.unit || 'each');
  const [imageUrl, setImageUrl] = useState(product?.image_url || '');
  const [uploading, setUploading] = useState(false);
  const [categoryId, setCategoryId] = useState(product?.category_id || '');
  const [stock, setStock] = useState(product?.stock?.toString() || '0');
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [saving, setSaving] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { url } = await api.upload<{ url: string }>('/api/uploads', formData);
      setImageUrl(url);
      showToast('Image uploaded');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to upload image', 'error');
    }
    setUploading(false);
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) {
      showToast('Please fill in name and price', 'error');
      return;
    }
    setSaving(true);
    const payload = {
      name,
      description,
      price: parseFloat(price),
      unit,
      image_url: imageUrl,
      category_id: categoryId || null,
      stock: parseInt(stock) || 0,
      is_active: isActive,
    };

    try {
      if (product) {
        await api.put(`/api/products/${product.id}`, payload);
      } else {
        await api.post('/api/products', payload);
      }
      showToast(product ? 'Product updated' : 'Product added');
      onSaved();
    } catch {
      showToast('Failed to save product', 'error');
    }
    setSaving(false);
  };

  return (
    <Modal open onClose={onClose} title={product ? 'Edit Product' : 'Add Product'} maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="input resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (₹)</label>
            <input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} className="input" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Unit</label>
            <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="kg, 500g, 1L..." className="input" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Stock</label>
            <input type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input cursor-pointer">
              <option value="">Uncategorized</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Image</label>
          <div className="flex items-center gap-3 mb-2">
            {imageUrl ? (
              <img src={imageUrl} alt="Preview" className="w-14 h-14 rounded-lg object-cover bg-gray-50 shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-gray-50 flex items-center justify-center text-gray-300 shrink-0">
                <ShoppingBag className="w-6 h-6" />
              </div>
            )}
            <label className="btn-secondary text-sm cursor-pointer">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? 'Uploading...' : 'Upload Image'}
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageUpload} disabled={uploading} className="hidden" />
            </label>
          </div>
          <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Or paste an image URL..." className="input" />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500" />
          <span className="text-sm font-medium text-gray-700">Active (visible to customers)</span>
        </label>
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Product'}</button>
        </div>
      </form>
    </Modal>
  );
}

// ============================================================
// ORDERS
// ============================================================
function OrdersTab({ orders, onRefresh }: { orders: Order[]; onRefresh: () => Promise<void> }) {
  const { showToast } = useToast();
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<Record<string, any[]>>({});

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

const updateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      // The API updates the status AND emails the customer in one call.
      await api.patch(`/api/orders/${orderId}/status`, { status });
      showToast(`Order marked as ${status.replace(/_/g, ' ')}`);
      await onRefresh();
    } catch {
      showToast('Failed to update order status', 'error');
    }
  };

  const toggleExpand = async (orderId: string) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
      return;
    }
    if (!orderItems[orderId]) {
      const data = await api.get<OrderItem[]>(`/api/orders/${orderId}/items`).catch(() => []);
      setOrderItems({ ...orderItems, [orderId]: data });
    }
    setExpandedOrder(orderId);
  };

  const statusOptions: OrderStatus[] = ['received', 'packed', 'out_for_delivery', 'delivered', 'cancelled'];

  return (
    <div>
      {/* Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        <FilterButton active={filter === 'all'} onClick={() => setFilter('all')} label="All" count={orders.length} />
        {statusOptions.map((s) => (
          <FilterButton key={s} active={filter === s} onClick={() => setFilter(s)} label={s.replace(/_/g, ' ')} count={orders.filter(o => o.status === s).length} />
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No orders found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <div key={order.id} className="card overflow-hidden">
              <div className="p-4 flex items-center gap-4">
                <button onClick={() => toggleExpand(order.id)} className="flex-1 flex items-center gap-4 text-left min-w-0">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">#{order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-sm text-gray-500 truncate">{order.customer_name} · {order.customer_phone}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </button>
                <div className="text-right shrink-0">
                  <p className="font-display font-bold text-lg text-gray-900">₹{num(order.total).toFixed(0)}</p>
                  <StatusBadge status={order.status} />
                </div>
              </div>

              {expandedOrder === order.id && (
                <div className="border-t border-gray-100 p-4 bg-gray-50/50 animate-slide-down">
                  {/* Address */}
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Delivery Address</p>
                    <p className="text-sm text-gray-700">{order.delivery_address}</p>
                    {order.notes && <p className="text-sm text-gray-500 mt-1"><em>Note: {order.notes}</em></p>}
                  </div>

                  {/* Items */}
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 uppercase mb-2">Items</p>
                    <div className="space-y-1">
                      {(orderItems[order.id] || []).map((item: any) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-gray-700">{item.product_name} × {item.quantity}</span>
                          <span className="font-medium">₹{(item.price * item.quantity).toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status update */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-2">Update Status</p>
                    <div className="flex flex-wrap gap-2">
                      {statusOptions.map((s) => (
                        <button
                          key={s}
                          onClick={() => updateStatus(order.id, s)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            order.status === s
                              ? 'bg-primary-600 text-white'
                              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {s.replace(/_/g, ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// SHARED
// ============================================================
function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
        active ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function FilterButton({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
        active ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
      }`}
    >
      <span className="capitalize">{label}</span>
      <span className={`px-1.5 py-0.5 rounded-full text-xs ${active ? 'bg-white/20' : 'bg-gray-100'}`}>{count}</span>
    </button>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const config: Record<OrderStatus, { label: string; className: string }> = {
    received: { label: 'Received', className: 'bg-blue-50 text-blue-700' },
    packed: { label: 'Packed', className: 'bg-amber-50 text-amber-700' },
    out_for_delivery: { label: 'Out for Delivery', className: 'bg-accent-50 text-accent-700' },
    delivered: { label: 'Delivered', className: 'bg-green-50 text-green-700' },
    cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-600' },
  };
  const c = config[status];
  return <span className={`badge ${c.className}`}>{c.label}</span>;
}

type TelegramStatus = { configured: boolean; admin: number; manager: number; staff: number };

function AlertsTab() {
  const { showToast } = useToast();
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    api.get<TelegramStatus>('/api/admin/telegram-status').then(setStatus).catch(() => setStatus(null));
  }, []);

  const runTest = async () => {
    setTesting(true);
    try {
      const res = await api.post<{ sent: number; total: number }>('/api/admin/telegram-test');
      showToast(`Test dispatch: ${res.sent}/${res.total} delivered`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Test dispatch failed', 'error');
    }
    setTesting(false);
  };

  const tiers = [
    { name: 'Store Admin', count: status?.admin ?? 0, detail: 'Full order detail incl. phone + email' },
    { name: 'Store Managers', count: status?.manager ?? 0, detail: 'Address + items, no phone/email' },
    { name: 'Store Staff', count: status?.staff ?? 0, detail: 'Customer name + amount only' },
  ];

  return (
    <div className="space-y-4">
      <div className="card p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <h3 className="font-display font-semibold text-lg text-gray-900">Telegram Bot Channel</h3>
            <p className="text-sm text-gray-500">
              {status === null
                ? 'Could not load bot status.'
                : status.configured
                  ? 'Bot connected. New orders alert all tiers instantly.'
                  : 'Bot token not set on the server — alerts are paused.'}
            </p>
          </div>
          <button onClick={runTest} disabled={testing || !status?.configured} className="btn-primary gap-2 disabled:opacity-50">
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {testing ? 'Dispatching…' : 'Test Telegram Dispatch (Broadcast to All IDs)'}
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {tiers.map((t) => (
            <div key={t.name} className="rounded-xl border border-gray-100 p-4">
              <p className="font-semibold text-gray-900">{t.name}</p>
              <p className="text-2xl font-display font-bold text-primary-700 mt-1">{t.count} <span className="text-sm font-normal text-gray-500">chat IDs</span></p>
              <p className="text-xs text-gray-500 mt-1">{t.detail}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="card p-6">
        <h3 className="font-display font-semibold text-lg text-gray-900 mb-2">Setup</h3>
        <ol className="text-sm text-gray-600 space-y-1.5 list-decimal list-inside">
          <li>Create a bot with @BotFather and keep the token secret.</li>
          <li>Each staff member presses Start on the bot, then you read their chat ID via @userinfobot.</li>
          <li>cPanel → Setup Node.js App → Environment Variables, set TELEGRAM_BOT_TOKEN plus TELEGRAM_ADMIN_CHAT_IDS / TELEGRAM_MANAGER_CHAT_IDS / TELEGRAM_STAFF_CHAT_IDS (comma separated), then Restart.</li>
          <li>Mail receipts go to the customer with the admin BCC'd automatically.</li>
        </ol>
      </div>
    </div>
  );
}

function ShieldIcon() {
  return (
    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
      <LayoutDashboard className="w-8 h-8 text-gray-400" />
    </div>
  );
}
