import { ShoppingCart, Mail, Phone, MapPin } from 'lucide-react';
import { useRouter } from '@/context/RouterContext';

export default function Footer() {
  const { navigate } = useRouter();

  return (
    <footer className="bg-gray-900 text-gray-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-display font-bold text-white text-lg leading-none block">Shapoorji</span>
                <span className="text-xs text-primary-400">Delivery</span>
              </div>
            </div>
            <p className="text-sm text-gray-400 max-w-md leading-relaxed">
              Your trusted neighbourhood grocery delivery service at Shapoorji. Fresh produce, daily essentials, and household items delivered straight to your door.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => navigate('/shop')} className="hover:text-primary-400 transition-colors">Shop</button></li>
              <li><button onClick={() => navigate('/orders')} className="hover:text-primary-400 transition-colors">My Orders</button></li>
              <li><button onClick={() => navigate('/favorites')} className="hover:text-primary-400 transition-colors">Favorites</button></li>
              <li><button onClick={() => navigate('/account')} className="hover:text-primary-400 transition-colors">My Account</button></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary-400 shrink-0" />
                <span>Shapoorji Housing Complex</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary-400 shrink-0" />
                <span>+91 84429 80101</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary-400 shrink-0" />
                <span>info@reddevils.co.in</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-800 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Shapoorji Delivery. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
