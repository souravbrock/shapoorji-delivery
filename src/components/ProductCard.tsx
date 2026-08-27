import { useState, useEffect } from 'react';
import { Heart, ShoppingCart, Star, Plus, Minus } from 'lucide-react';
import type { Product } from '@/lib/supabase';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';
import { supabase } from '@/lib/supabase';

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const { session } = useAuth();
  const { navigate } = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showQty, setShowQty] = useState(false);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (!session?.user) return;
    (async () => {
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('product_id', product.id)
        .maybeSingle();
      setIsFavorite(!!data);
    })();
  }, [session, product.id]);

  const toggleFavorite = async () => {
    if (!session) {
      navigate('/auth');
      return;
    }
    if (isFavorite) {
      await supabase.from('favorites').delete().eq('user_id', session.user.id).eq('product_id', product.id);
      setIsFavorite(false);
    } else {
      await supabase.from('favorites').insert({ user_id: session.user.id, product_id: product.id });
      setIsFavorite(true);
    }
  };

  const handleAddToCart = async () => {
    if (!session) {
      navigate('/auth');
      return;
    }
    setAdding(true);
    await addToCart(product.id, qty);
    setAdding(false);
    setShowQty(false);
    setQty(1);
  };

  const outOfStock = product.stock <= 0;

  return (
    <div className="card overflow-hidden group hover:shadow-md transition-all duration-300 flex flex-col">
      {/* Image */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <ShoppingCart className="w-12 h-12" />
          </div>
        )}
        {outOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white/90 text-gray-800 text-sm font-semibold px-3 py-1.5 rounded-full">Out of Stock</span>
          </div>
        )}
        {/* Favorite button */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleFavorite(); }}
          className="absolute top-2.5 right-2.5 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
          aria-label="Toggle favorite"
        >
          <Heart className={`w-4.5 h-4.5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
        </button>
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col flex-1">
        <button
          onClick={() => navigate(`/product/${product.id}`)}
          className="text-left font-medium text-gray-900 text-sm leading-snug hover:text-primary-700 transition-colors line-clamp-2"
        >
          {product.name}
        </button>
        <p className="text-xs text-gray-500 mt-0.5">{product.unit}</p>

        <div className="mt-auto pt-3 flex items-center justify-between gap-2">
          <span className="font-display font-bold text-lg text-gray-900">
            ₹{product.price.toFixed(0)}
          </span>

          {!showQty ? (
            <button
              onClick={() => session ? setShowQty(true) : navigate('/auth')}
              disabled={outOfStock}
              className="btn-primary text-xs px-3 py-2 gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          ) : (
            <div className="flex items-center gap-1.5 animate-scale-in">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-sm font-semibold w-5 text-center">{qty}</span>
              <button
                onClick={() => setQty(qty + 1)}
                className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleAddToCart}
                disabled={adding}
                className="btn-primary text-xs px-3 py-1.5 ml-1"
              >
                {adding ? '...' : 'OK'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

