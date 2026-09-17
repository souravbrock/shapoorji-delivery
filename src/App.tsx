import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { RouterProvider, useRouter, matchRoute } from '@/context/RouterContext';
import { ToastProvider } from '@/components/Toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HomePage from '@/pages/HomePage';
import ShopPage from '@/pages/ShopPage';
import AuthPage from '@/pages/AuthPage';
import VerifyEmailPage from '@/pages/VerifyEmailPage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import CartPage from '@/pages/CartPage';
import CheckoutPage from '@/pages/CheckoutPage';
import FavoritesPage from '@/pages/FavoritesPage';
import OrdersPage from '@/pages/OrdersPage';
import AccountPage from '@/pages/AccountPage';
import AdminPage from '@/pages/AdminPage';

function AppContent() {
  const { route, navigate } = useRouter();
  const path = route.path.split('?')[0];

  // Route matching
  if (path === '/' || path === '') return <><Header /><HomePage /><Footer /></>;
  if (path === '/shop') return <><Header /><ShopPage /><Footer /></>;
  if (path === '/auth') return <><AuthPage /></>;
  if (path === '/verify-email') return <><VerifyEmailPage /></>;
  if (path === '/cart') return <><Header /><CartPage /><Footer /></>;
  if (path === '/checkout') return <><Header /><CheckoutPage /><Footer /></>;
  if (path === '/favorites') return <><Header /><FavoritesPage /><Footer /></>;
  if (path === '/orders') return <><Header /><OrdersPage /><Footer /></>;
  if (path === '/account') return <><Header /><AccountPage /><Footer /></>;
  if (path === '/admin') return <><Header /><AdminPage /><Footer /></>;

  const productMatch = matchRoute('/product/:id', path);
  if (productMatch) return <><Header /><ProductDetailPage productId={productMatch.id} /><Footer /></>;

  // 404
  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h1 className="font-display font-bold text-4xl text-gray-900 mb-2">404</h1>
        <p className="text-gray-500 mb-4">Page not found.</p>
        <button onClick={() => navigate('/')} className="btn-primary">Go Home</button>
      </div>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ToastProvider>
          <RouterProvider>
            <AppContent />
          </RouterProvider>
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}
