import { useEffect, useState, useMemo } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { supabase, type Category, type Product } from '@/lib/supabase';
import { useRouter } from '@/context/RouterContext';
import ProductCard from '@/components/ProductCard';

export default function ShopPage() {
  const { route, navigate } = useRouter();
  const params = new URLSearchParams(route.path.split('?')[1] || '');
  const initialQuery = params.get('q') || '';
  const initialCategory = params.get('category') || '';

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [sortBy, setSortBy] = useState<'name' | 'price_low' | 'price_high'>('name');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setSearch(initialQuery);
    setSelectedCategory(initialCategory);
  }, [initialQuery, initialCategory]);

  useEffect(() => {
    (async () => {
      const [{ data: cats }, { data: prods }] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order'),
        supabase.from('products').select('*, category:categories(*)').eq('is_active', true).order('name'),
      ]);
      setCategories(cats as Category[] || []);
      setProducts(prods as Product[] || []);
      setLoading(false);
    })();
  }, []);

  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    if (selectedCategory) {
      result = result.filter(p => p.category?.slug === selectedCategory);
    }
    if (sortBy === 'price_low') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price_high') result.sort((a, b) => b.price - a.price);
    else result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [products, search, selectedCategory, sortBy]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = search.trim();
    const cat = selectedCategory ? `&category=${selectedCategory}` : '';
    navigate(query ? `/shop?q=${encodeURIComponent(query)}${cat}` : `/shop${cat ? `?category=${selectedCategory}` : ''}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-gray-900">Shop Groceries</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="md:hidden btn-secondary text-sm px-4 py-2"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Search + Sort bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
            />
            {search && (
              <button type="button" onClick={() => { setSearch(''); navigate('/shop'); }} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </form>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="input sm:w-auto cursor-pointer"
        >
          <option value="name">Sort: Name (A-Z)</option>
          <option value="price_low">Sort: Price (Low to High)</option>
          <option value="price_high">Sort: Price (High to Low)</option>
        </select>
      </div>

      <div className="flex gap-6">
        {/* Category sidebar - desktop */}
        <aside className={`${showFilters ? 'block' : 'hidden'} md:block w-full md:w-56 shrink-0`}>
          <div className="card p-4 sticky top-20">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Categories</h3>
            <div className="space-y-1">
              <button
                onClick={() => { setSelectedCategory(''); navigate('/shop'); setShowFilters(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${!selectedCategory ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                All Products
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat.slug); navigate(`/shop?category=${cat.slug}`); setShowFilters(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCategory === cat.slug ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Products grid */}
        <div className="flex-1">
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
          ) : filteredProducts.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-gray-500 text-lg">No products found.</p>
              <p className="text-gray-400 text-sm mt-1">Try a different search or category.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-4">{filteredProducts.length} products</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
