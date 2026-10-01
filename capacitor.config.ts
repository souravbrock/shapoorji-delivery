import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.co.reddevils.spdelivery',
  appName: 'Shapoorji Delivery',
  webDir: 'dist',
  android: {
    // https scheme so Secure cookies behave; API calls ride the native
    // HTTP layer below, which owns its cookie jar (see plugins).
    scheme: 'https',
  },
  plugins: {
    // Route all fetch/XHR through native networking. The WebView origin
    // is cross-site to the API, where SameSite=Lax cookies would otherwise
    // never be sent — native transport keeps login/cart working in-app.
    CapacitorHttp: { enabled: true },
  },
};

export default config;
