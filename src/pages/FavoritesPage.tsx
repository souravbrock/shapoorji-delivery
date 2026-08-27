import { useEffect, useState } from 'react';
import { Heart, ArrowRight, Package } from 'lucide-react';
import { supabase, type Product } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';
import ProductCard from '@/components/ProductCard';

export default function FavoritesPage() {
  const { session } = useAuth();
  const { navigate } = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) return;
    (async () => {
      const { data, error } = await supabase
        .from('favorites')
        .select('product:products(*)')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      if (error) {
        console.error(error);
      } else {
        setProducts((data || []).map((f: any) => f.product).filter(Boolean) as Product[]);
      }
      setLoading(false);
    })();
  }, [session]);

  if (!session) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
        <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Sign in to view your favorites</h2>
        <button onClick={() => navigate('/auth')} className="btn-primary mt-2">Sign In</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display font-bold text-2xl sm:text-3xl text-gray-900 mb-6">My Favorites</h1>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-4 h-64 animate-pulse">
              <div className="bg-gray-100 rounded-xl h-40 mb-3" />
              <div className="bg-gray-100 h-4 rounded mb-2" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="card p-12 text-center">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No favorites yet</h2>
          <p className="text-gray-500 mb-4">Tap the heart icon on any product to save it here.</p>
          <button onClick={() => navigate('/shop')} className="btn-primary">
            Browse Products
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
