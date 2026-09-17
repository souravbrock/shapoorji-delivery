const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');
const { sendOrderEmail, renderVerifyEmailText, renderVerifyEmailHtml } = require('../utils/mailer');

function makeCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashCode(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
}

// (Re)issues a 6-digit code valid for 10 minutes and mails it.
// Fire-and-forget mail — a slow SMTP server never blocks signup.
async function sendVerificationCode(db, userId, email) {
  const code = makeCode();
  await db.query(
    `UPDATE users
       SET verification_code_hash = ?,
           verification_expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE),
           verification_attempts = 0,
           verification_sent_at = NOW()
     WHERE id = ?`,
    [hashCode(code), userId]
  );
  sendOrderEmail({
    to: email,
    subject: 'Your Shapoorji Delivery verification code',
    text: renderVerifyEmailText(code),
    html: renderVerifyEmailHtml(code),
  });
}

const router = express.Router();

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: '/',
};

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
}

// Browsers only delete a cookie when the expired replacement matches the
// original's attributes. A cookie once set with SameSite=None; Secure can
// NOT be removed by a SameSite=Lax clear (and vice versa), leaving a stale
// "zombie" login behind. Clear both variants everywhere.
function clearToken(res) {
  res.clearCookie('token', { ...COOKIE_OPTS, maxAge: undefined });
  res.clearCookie('token', { ...COOKIE_OPTS, secure: true, sameSite: 'none', maxAge: undefined });
}

function setToken(res, token) {
  clearToken(res); // kill any stranded cookie first, then set the fresh one
  res.cookie('token', token, COOKIE_OPTS);
}

// POST /api/auth/signup
router.post('/signup', async (req, res, next) => {
  const { email, password, fullName } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const conn = await pool.getConnection();
  try {
    const [existing] = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const userId = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);

    await conn.beginTransaction();

    await conn.query('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)', [
      userId,
      email,
      passwordHash,
    ]);

    // First user to register becomes admin, mirroring the old Postgres trigger.
    const [[{ adminCount }]] = await conn.query(
      "SELECT COUNT(*) as adminCount FROM profiles WHERE role = 'admin'"
    );
    const role = adminCount === 0 ? 'admin' : 'customer';

    await conn.query(
      'INSERT INTO profiles (id, full_name, role, address) VALUES (?, ?, ?, ?)',
      [userId, fullName || '', role, '']
    );

    await conn.commit();

    await sendVerificationCode(pool, userId, email);

    const token = signToken({ id: userId, email });
    setToken(res, token);
    res.json({ user: { id: userId, email, emailVerified: false } });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  try {
    const [rows] = await pool.query('SELECT id, email, password_hash, email_verified FROM users WHERE email = ?', [
      email,
    ]);
    if (!rows.length) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = signToken(user);
    setToken(res, token);
    res.json({ user: { id: user.id, email: user.email, emailVerified: !!user.email_verified } });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  clearToken(res);
  res.json({ ok: true });
});

// GET /api/auth/session — returns current user + profile, or null
router.get('/session', requireAuthOptional, async (req, res, next) => {
  if (!req.user) return res.json({ user: null, profile: null });
  try {
    const [rows] = await pool.query('SELECT * FROM profiles WHERE id = ?', [req.user.id]);
    const [urows] = await pool.query('SELECT email_verified FROM users WHERE id = ?', [req.user.id]);
    res.json({
      user: { ...req.user, emailVerified: !!urows[0]?.email_verified },
      profile: rows[0] || null,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/verify-email { code } — confirm own email address
router.post('/verify-email', requireAuth, async (req, res, next) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Verification code is required' });
  }
  try {
    const [rows] = await pool.query(
      'SELECT email_verified, verification_code_hash, verification_expires_at, verification_attempts FROM users WHERE id = ?',
      [req.user.id]
    );
    const u = rows[0];
    if (!u) return res.status(404).json({ error: 'Account not found' });
    if (u.email_verified) return res.json({ ok: true, already: true });
    if ((u.verification_attempts || 0) >= 5) {
      return res.status(429).json({ error: 'Too many wrong attempts — please request a new code.' });
    }
    if (
      !u.verification_code_hash ||
      !u.verification_expires_at ||
      new Date(u.verification_expires_at) < new Date()
    ) {
      return res.status(400).json({ error: 'Code expired — please request a new one.' });
    }
    const a = Buffer.from(hashCode(String(code).trim()), 'hex');
    const b = Buffer.from(u.verification_code_hash, 'hex');
    const match = a.length === b.length && crypto.timingSafeEqual(a, b);
    if (!match) {
      await pool.query('UPDATE users SET verification_attempts = verification_attempts + 1 WHERE id = ?', [req.user.id]);
      return res.status(400).json({ error: 'Incorrect code. Please try again.' });
    }
    await pool.query(
      'UPDATE users SET email_verified = 1, verification_code_hash = NULL, verification_expires_at = NULL, verification_attempts = 0 WHERE id = ?',
      [req.user.id]
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/resend-code — issue a fresh code (60s cooldown)
router.post('/resend-code', requireAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT email_verified, verification_sent_at FROM users WHERE id = ?',
      [req.user.id]
    );
    const u = rows[0];
    if (!u) return res.status(404).json({ error: 'Account not found' });
    if (u.email_verified) return res.json({ ok: true, already: true });
    if (u.verification_sent_at && Date.now() - new Date(u.verification_sent_at).getTime() < 60 * 1000) {
      return res.status(429).json({ error: 'Please wait a minute before requesting another code.' });
    }
    await sendVerificationCode(pool, req.user.id, req.user.email);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Local helper so /session doesn't 401 when logged out
function requireAuthOptional(req, res, next) {
  const jwtLib = require('jsonwebtoken');
  const token = req.cookies?.token;
  if (!token) return next();
  try {
    const payload = jwtLib.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email };
  } catch (err) {
    // treat as anonymous
  }
  next();
}

// PATCH /api/auth/profile — update own profile (used by CheckoutPage)
router.patch('/profile', requireAuth, async (req, res, next) => {
  const { full_name, phone, address } = req.body;
  try {
    await pool.query(
      'UPDATE profiles SET full_name = COALESCE(?, full_name), phone = COALESCE(?, phone), address = COALESCE(?, address) WHERE id = ?',
      [full_name, phone, address, req.user.id]
    );
    const [rows] = await pool.query('SELECT * FROM profiles WHERE id = ?', [req.user.id]);
    res.json({ profile: rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
