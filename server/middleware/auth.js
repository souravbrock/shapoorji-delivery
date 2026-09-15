const jwt = require('jsonwebtoken');
const pool = require('../db');

// Reads the JWT from the httpOnly cookie, verifies it, and attaches
// req.user = { id, email }. Responds 401 if missing/invalid.
function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

// Same as requireAuth, but doesn't fail if there's no token —
// just leaves req.user undefined. Used for public-read routes that
// behave slightly differently for logged-in users.
function optionalAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email };
  } catch (err) {
    // ignore invalid token, treat as anonymous
  }
  next();
}

// Must run after requireAuth. Checks the user's profile role in the DB
// (not just the JWT) so role changes take effect immediately.
async function requireAdmin(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT role FROM profiles WHERE id = ?', [req.user.id]);
    if (!rows.length || rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireAuth, optionalAuth, requireAdmin };
