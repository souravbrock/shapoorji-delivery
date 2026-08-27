import { useState } from 'react';
import { ShoppingCart, Heart, User, Menu, X, Search, Package, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useRouter } from '@/context/RouterContext';
import { supabase } from '@/lib/supabase';

export default function Header() {
  const { session, profile, signOut } = useAuth();
  const { cartCount } = useCart();
  const { navigate, route } = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isAdmin = profile?.role === 'admin';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setUserMenuOpen(false);
    navigate('/');
  };

  const isActive = (path: string) => route.path === path || route.path.startsWith(path + '/');

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 shrink-0 group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block text-left">
              <span className="font-display font-bold text-gray-900 text-lg leading-none block">Shapoorji</span>
              <span className="text-xs text-primary-600 font-medium">Delivery</span>
            </div>
          </button>

          {/* Search bar - desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for groceries..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
              />
            </div>
          </form>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink active={isActive('/shop')} onClick={() => navigate('/shop')} icon={Package} label="Shop" />
            {session && (
              <NavLink active={isActive('/favorites')} onClick={() => navigate('/favorites')} icon={Heart} label="Favorites" badge={undefined} />
            )}
            {session && (
              <NavLink active={isActive('/orders')} onClick={() => navigate('/orders')} icon={Package} label="Orders" />
            )}
            {isAdmin && (
              <NavLink active={isActive('/admin')} onClick={() => navigate('/admin')} icon={LayoutDashboard} label="Admin" />
            )}
          </nav>

          {/* Cart + User */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/cart')}
              className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors"
              aria-label="Cart"
            >
              <ShoppingCart className="w-5 h-5 text-gray-700" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-accent-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-scale-in">
                  {cartCount}
                </span>
              )}
            </button>

            {session ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-sm">
                    {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-20 animate-slide-down">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="font-semibold text-sm text-gray-900">{profile?.full_name || 'User'}</p>
                        <p className="text-xs text-gray-500">{profile?.role === 'admin' ? 'Administrator' : 'Customer'}</p>
                      </div>
                      <MenuItem onClick={() => { navigate('/account'); setUserMenuOpen(false); }} icon={User} label="My Account" />
                      <MenuItem onClick={() => { navigate('/orders'); setUserMenuOpen(false); }} icon={Package} label="My Orders" />
                      <MenuItem onClick={() => { navigate('/favorites'); setUserMenuOpen(false); }} icon={Heart} label="Favorites" />
                      {isAdmin && (
                        <MenuItem onClick={() => { navigate('/admin'); setUserMenuOpen(false); }} icon={LayoutDashboard} label="Admin Panel" />
                      )}
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <MenuItem onClick={handleSignOut} icon={X} label="Sign Out" danger />
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button onClick={() => navigate('/auth')} className="btn-primary text-sm px-4 py-2 hidden sm:flex">
                Sign In
              </button>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl hover:bg-gray-100 transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 animate-slide-down">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for groceries..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-primary-400"
                />
              </div>
            </form>
            <nav className="flex flex-col gap-1">
              <MobileNavLink onClick={() => { navigate('/shop'); setMobileMenuOpen(false); }} icon={Package} label="Shop" />
              {session && (
                <>
                  <MobileNavLink onClick={() => { navigate('/favorites'); setMobileMenuOpen(false); }} icon={Heart} label="Favorites" />
                  <MobileNavLink onClick={() => { navigate('/orders'); setMobileMenuOpen(false); }} icon={Package} label="My Orders" />
                  <MobileNavLink onClick={() => { navigate('/account'); setMobileMenuOpen(false); }} icon={User} label="My Account" />
                </>
              )}
              {isAdmin && (
                <MobileNavLink onClick={() => { navigate('/admin'); setMobileMenuOpen(false); }} icon={LayoutDashboard} label="Admin Panel" />
              )}
              {!session && (
                <MobileNavLink onClick={() => { navigate('/auth'); setMobileMenuOpen(false); }} icon={User} label="Sign In" />
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

function NavLink({ active, onClick, icon: Icon, label, badge }: { active: boolean; onClick: () => void; icon: React.ComponentType<{ className?: string }>; label: string; badge?: number }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${active ? 'text-primary-700 bg-primary-50' : 'text-gray-600 hover:bg-gray-50'}`}
    >
      <Icon className="w-4 h-4" />
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="bg-accent-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );
}

function MobileNavLink({ onClick, icon: Icon, label }: { onClick: () => void; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
    >
      <Icon className="w-5 h-5 text-gray-500" />
      {label}
    </button>
  );
}

function MenuItem({ onClick, icon: Icon, label, danger }: { onClick: () => void; icon: React.ComponentType<{ className?: string }>; label: string; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50 ${danger ? 'text-red-600' : 'text-gray-700'}`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
