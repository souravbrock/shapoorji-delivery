const express = require('express');
const crypto = require('crypto');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/reviews?product_id=... — public
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, p.full_name AS reviewer_name
       FROM reviews r JOIN profiles p ON p.id = r.user_id
       WHERE r.product_id = ?
       ORDER BY r.created_at DESC`,
      [req.query.product_id]
    );
    res.json(rows.map((r) => ({ ...r, profiles: { full_name: r.reviewer_name } })));
  } catch (err) {
    next(err);
  }
});

// POST /api/reviews { product_id, rating, comment }
router.post('/', requireAuth, async (req, res, next) => {
  const { product_id, rating, comment } = req.body;
  try {
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO reviews (id, user_id, product_id, rating, comment)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment)`,
      [id, req.user.id, product_id, rating, comment || '']
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/reviews/:product_id — own review only
router.delete('/:product_id', requireAuth, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM reviews WHERE user_id = ? AND product_id = ?', [
      req.user.id,
      req.params.product_id,
    ]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
