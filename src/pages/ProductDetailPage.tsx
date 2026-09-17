import { useEffect, useState } from 'react';
import { Heart, Star, ShoppingCart, ArrowLeft, Plus, Minus, Package } from 'lucide-react';
import { api, num, parseDbDate, type Product, type Review } from '@/lib/api';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/components/Toast';

export default function ProductDetailPage({ productId }: { productId: string }) {
  const { navigate } = useRouter();
  const { session } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [adding, setAdding] = useState(false);

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const prod = await api.get<Product>(`/api/products/${productId}`).catch(() => null);
      setProduct(prod);

      const revs = await api.get<Review[]>(`/api/reviews?product_id=${productId}`).catch(() => []);
      setReviews(revs);

      if (session?.user) {
        const { isFavorite } = await api.get<{ isFavorite: boolean }>(`/api/favorites/${productId}/check`);
        setIsFavorite(isFavorite);
      }
      setLoading(false);
    })();
  }, [productId, session]);

  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  const toggleFavorite = async () => {
    if (!session) { navigate('/auth'); return; }
    if (isFavorite) {
      await api.delete(`/api/favorites/${productId}`);
      setIsFavorite(false);
      showToast('Removed from favorites');
    } else {
      await api.post('/api/favorites', { product_id: productId });
      setIsFavorite(true);
      showToast('Added to favorites');
    }
  };

  const handleAddToCart = async () => {
    if (!session) { navigate('/auth'); return; }
    setAdding(true);
    try {
      await addToCart(product!.id, qty);
      showToast(`${qty} × ${product!.name} added to cart`);
    } catch {
      showToast('Could not add to cart. Please try again.', 'error');
    }
    setAdding(false);
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) { navigate('/auth'); return; }
    setSubmittingReview(true);
    try {
      await api.post('/api/reviews', { product_id: productId, rating, comment });
      showToast('Review submitted!');
      setShowReviewForm(false);
      setComment('');
      setRating(5);
      const revs = await api.get<Review[]>(`/api/reviews?product_id=${productId}`).catch(() => []);
      setReviews(revs);
    } catch {
      showToast('Failed to submit review', 'error');
    }
    setSubmittingReview(false);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid md:grid-cols-2 gap-8 animate-pulse">
          <div className="bg-gray-100 rounded-2xl h-96" />
          <div className="space-y-4">
            <div className="bg-gray-100 h-8 rounded w-3/4" />
            <div className="bg-gray-100 h-6 rounded w-1/2" />
            <div className="bg-gray-100 h-24 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Product not found</h2>
        <button onClick={() => navigate('/shop')} className="btn-primary mt-4">Back to Shop</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <button onClick={() => navigate('/shop')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm font-medium">
        <ArrowLeft className="w-4 h-4" />
        Back to Shop
      </button>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="card overflow-hidden">
          <div className="aspect-square bg-gray-50">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-24 h-24 text-gray-300" />
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col">
          {product.category && (
            <span className="badge bg-primary-50 text-primary-700 w-fit mb-3">{product.category.name}</span>
          )}
          <h1 className="font-display font-bold text-3xl text-gray-900 mb-2">{product.name}</h1>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${star <= Math.round(avgRating) ? 'fill-secondary-400 text-secondary-400' : 'text-gray-300'}`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500">
              {reviews.length > 0 ? `${avgRating.toFixed(1)} (${reviews.length} review${reviews.length !== 1 ? 's' : ''})` : 'No reviews yet'}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-4">
            <span className="font-display font-bold text-3xl text-gray-900">₹{num(product.price).toFixed(0)}</span>
            <span className="text-gray-500 text-sm">/ {product.unit}</span>
          </div>

          <p className="text-gray-600 leading-relaxed mb-6">{product.description}</p>

          <div className="flex items-center gap-2 mb-6">
            {product.stock > 0 ? (
              <span className="badge bg-green-50 text-green-700">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                In Stock ({product.stock} available)
              </span>
            ) : (
              <span className="badge bg-red-50 text-red-600">Out of Stock</span>
            )}
          </div>

          {/* Add to cart */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-9 h-9 rounded-lg bg-white flex items-center justify-center hover:bg-gray-100 transition-colors shadow-sm"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-semibold w-8 text-center">{qty}</span>
              <button
                onClick={() => setQty(qty + 1)}
                className="w-9 h-9 rounded-lg bg-white flex items-center justify-center hover:bg-gray-100 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={product.stock <= 0 || adding}
              className="btn-primary flex-1 py-3"
            >
              <ShoppingCart className="w-5 h-5" />
              {adding ? 'Adding...' : 'Add to Cart'}
            </button>
            <button
              onClick={toggleFavorite}
              className="btn-secondary p-3"
              aria-label="Toggle favorite"
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} />
            </button>
          </div>

          {/* Reviews section */}
          <div className="mt-8 pt-8 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-xl text-gray-900">Reviews & Ratings</h2>
              {session && (
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="text-primary-600 text-sm font-medium hover:underline"
                >
                  {showReviewForm ? 'Cancel' : 'Write a Review'}
                </button>
              )}
            </div>

            {showReviewForm && (
              <form onSubmit={submitReview} className="card p-4 mb-4 animate-slide-down">
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                      >
                        <Star className={`w-7 h-7 transition-colors ${star <= rating ? 'fill-secondary-400 text-secondary-400' : 'text-gray-300 hover:text-gray-400'}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Review</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience with this product..."
                    rows={3}
                    className="input resize-none"
                  />
                </div>
                <button type="submit" disabled={submittingReview} className="btn-primary text-sm">
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            )}

            {reviews.length === 0 ? (
              <p className="text-gray-400 text-sm py-4">No reviews yet. Be the first to review this product!</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-sm">
                          {review.profiles?.full_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <span className="font-medium text-sm text-gray-900">{review.profiles?.full_name || 'Anonymous'}</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${star <= review.rating ? 'fill-secondary-400 text-secondary-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>}
                    <p className="text-xs text-gray-400 mt-2">{parseDbDate(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
