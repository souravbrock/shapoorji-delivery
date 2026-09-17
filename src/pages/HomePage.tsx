import { useEffect, useState } from 'react';
import { ArrowRight, Truck, Clock, Shield, Heart } from 'lucide-react';
import { api, type Category, type Product } from '@/lib/api';
import { useRouter } from '@/context/RouterContext';
import ProductCard from '@/components/ProductCard';

export default function HomePage() {
  const { navigate } = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [cats, prods] = await Promise.all([
        api.get<Category[]>('/api/categories'),
        api.get<Product[]>('/api/products?activeOnly=1&orderBy=created_at_desc&limit=8'),
      ]);
      setCategories(cats);
      setProducts(prods);
      setLoading(false);
    })();
  }, []);

  const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {};
  const iconMap: Record<string, string> = {
    'Apple': '🍎', 'Carrot': '🥕', 'Milk': '🥛', 'Croissant': '🥐',
    'Coffee': '☕', 'Cookie': '🍪', 'Wheat': '🌾', 'Trash2': '🧹',
    'ShoppingBasket': '🧺', 'CupSoda': '🥤', 'ShoppingBag': '🛍️',
    'Store': '🏪', 'Package': '📦', 'Egg': '🥚',
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="animate-slide-up">
              <span className="badge bg-primary-100 text-primary-700 mb-4">
                <Truck className="w-3.5 h-3.5" />
                Now delivering at Shapoorji
              </span>
              <h1 className="font-display font-bold text-4xl sm:text-5xl text-gray-900 leading-tight mb-4">
                Fresh groceries,<br />
                <span className="text-primary-600">delivered to your door</span>
              </h1>
              <p className="text-gray-600 text-lg mb-6 max-w-md">
                Order daily essentials, fresh produce, and household items from the comfort of your home. Fast delivery within Shapoorji Housing Complex.
              </p>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => navigate('/shop')} className="btn-primary text-base px-6 py-3">
                  Start Shopping
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button onClick={() => navigate('/auth')} className="btn-secondary text-base px-6 py-3">
                  Create Account
                </button>
              </div>
            </div>
            <div className="hidden md:block relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <img src="https://images.pexels.com/photos/14456110/pexels-photo-14456110.jpeg?auto=compress&cs=tinysrgb&h=400&w=400" alt="Fresh fruits" className="rounded-2xl shadow-lg w-full h-48 object-cover" />
                  <img src="https://images.pexels.com/photos/18254763/pexels-photo-18254763.jpeg?auto=compress&cs=tinysrgb&h=400&w=400" alt="Fresh vegetables" className="rounded-2xl shadow-lg w-full h-32 object-cover" />
                </div>
                <div className="space-y-4 pt-8">
                  <img src="https://images.pexels.com/photos/5967316/pexels-photo-5967316.jpeg?auto=compress&cs=tinysrgb&h=400&w=400" alt="Dairy products" className="rounded-2xl shadow-lg w-full h-32 object-cover" />
                  <img src="https://images.pexels.com/photos/5567093/pexels-photo-5567093.jpeg?auto=compress&cs=tinysrgb&h=400&w=400" alt="Bakery items" className="rounded-2xl shadow-lg w-full h-48 object-cover" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <FeatureCard icon={Truck} title="Fast Delivery" desc="Same-day delivery within Shapoorji complex" />
          <FeatureCard icon={Clock} title="Daily Fresh" desc="Fresh produce restocked every morning" />
          <FeatureCard icon={Shield} title="Quality Assured" desc="100% quality guarantee on every order" />
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h2 className="font-display font-bold text-2xl text-gray-900 mb-6">Shop by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => navigate(`/shop?category=${cat.slug}`)}
              className="card p-4 flex flex-col items-center gap-2 hover:shadow-md hover:border-primary-200 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                {iconMap[cat.icon] || '🛒'}
              </div>
              <span className="text-xs font-medium text-gray-700 text-center leading-tight">{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-2xl text-gray-900">Fresh Arrivals</h2>
          <button onClick={() => navigate('/shop')} className="text-primary-600 font-medium text-sm flex items-center gap-1 hover:gap-2 transition-all">
            View all <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card p-4 h-64 animate-pulse">
                <div className="bg-gray-100 rounded-xl h-40 mb-3" />
                <div className="bg-gray-100 h-4 rounded mb-2" />
                <div className="bg-gray-100 h-4 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <div className="card p-6 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
        <Icon className="w-6 h-6 text-primary-600" />
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-500">{desc}</p>
      </div>
    </div>
  );
}
