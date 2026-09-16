import { useState, useEffect } from 'react';
import { Heart, ShoppingCart, Plus, Minus, Check } from 'lucide-react';
import { api, num, type Product } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';

export default function ProductCard({ product }: { product: Product }) {
  const { items, addToCart } = useCart();
  const { session } = useAuth();
  const { navigate } = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showQty, setShowQty] = useState(false);

  // UPDATED FIX: Check if "kg" or "gm" exists anywhere in the unit string
  const normalizedUnit = product.unit?.toLowerCase() || '';
  const isWeightBased = normalizedUnit.includes('kg') || normalizedUnit.includes('gm') || normalizedUnit.includes('g');
  
  const step = isWeightBased ? 0.25 : 1;
  const initialQty = isWeightBased ? 0.25 : 1;
  
  const [qty, setQty] = useState(initialQty);

  const cartItem = items?.find((item) => item.product_id === product.id);
  const isInCart = !!cartItem;

  useEffect(() => {
    if (!session?.user) return;
    (async () => {
      const { isFavorite } = await api.get<{ isFavorite: boolean }>(`/api/favorites/${product.id}/check`);
      setIsFavorite(isFavorite);
    })();
  }, [session, product.id]);

  const toggleFavorite = async () => {
    if (!session) {
      navigate('/auth');
      return;
    }
    if (isFavorite) {
      await api.delete(`/api/favorites/${product.id}`);
      setIsFavorite(false);
    } else {
      await api.post('/api/favorites', { product_id: product.id });
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
    setQty(initialQty);
  };

  const outOfStock = product.stock <= 0;

  // Format the visual display (shows "250g" instead of "0.25", or "1.5kg")
  const displayQty = isWeightBased 
    ? (qty < 1 ? `${qty * 1000}g` : `${qty}kg`)
    : qty;

  // Dynamically show the updated price on the card based on selected weight
  const currentPrice = product.price * qty;

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
        <p className="text-xs text-gray-500 mt-0.5">{product.unit} (₹{num(product.price).toFixed(0)}/unit)</p>

        <div className="mt-auto pt-3 flex items-center justify-between gap-2">
          {/* Display dynamically updating price based on weight/quantity */}
          <span className="font-display font-bold text-lg text-gray-900">
            ₹{currentPrice.toFixed(0)}
          </span>

          {!showQty && !isInCart ? (
            <button
              onClick={() => session ? setShowQty(true) : navigate('/auth')}
              disabled={outOfStock}
              className="btn-primary text-xs px-3 py-2 gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          ) : isInCart ? (
            <button
              onClick={() => navigate('/cart')}
              className="bg-green-100 text-green-700 hover:bg-green-200 rounded-xl font-medium text-xs px-3 py-2 flex items-center gap-1 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Added
            </button>
          ) : (
            <div className="flex items-center gap-1.5 animate-scale-in">
              <button
                onClick={() => setQty(Math.max(step, qty - step))}
                className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              
              <span className="text-sm font-semibold w-10 text-center">{displayQty}</span>
              
              <button
                onClick={() => setQty(qty + step)}
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
