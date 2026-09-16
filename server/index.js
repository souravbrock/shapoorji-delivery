require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');
const productRoutes = require('./routes/products');
const favoriteRoutes = require('./routes/favorites');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const reviewRoutes = require('./routes/reviews');
const uploadRoutes = require('./routes/uploads');

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
if (allowedOrigins.length === 0) {
  console.error('FATAL: CORS_ORIGIN env var is not set. Refusing to start with open CORS.');
  process.exit(1);
}
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Serve uploaded product images.
// The app is mounted under /api on cPanel (reddevils.co.in/api) where
// Express sees the full request path, so serve under both /uploads
// (subdomain-root setups) and /api/uploads (subpath setup).
const uploadsDir = path.join(__dirname, 'public', 'uploads');
// .jfif isn't in the default mime map (served as octet-stream) — serve as JPEG.
if (express.static.mime && express.static.mime.define) {
  express.static.mime.define({ 'image/jpeg': ['jfif'] });
}
app.use('/uploads', express.static(uploadsDir));
app.use('/api/uploads', express.static(uploadsDir));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/uploads', uploadRoutes);

// Central error handler — log full error internally, send generic message in production
app.use((err, req, res, next) => {
  console.error(err);
  const isProd = process.env.NODE_ENV === 'production';
  const message = isProd ? 'Internal server error' : err.message || 'Internal server error';
  res.status(err.status || 500).json({ error: message });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Shapoorji Delivery API listening on port ${PORT}`);
});
