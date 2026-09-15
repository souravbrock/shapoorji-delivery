const express = require('express');
const crypto = require('crypto');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/favorites — current user's favorites, with product joined
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT f.*, p.* , f.id as fav_id, f.created_at as fav_created_at
       FROM favorites f JOIN products p ON p.id = f.product_id
       WHERE f.user_id = ?`,
      [req.user.id]
    );
    res.json(
      rows.map((r) => ({
        id: r.fav_id,
        user_id: req.user.id,
        product_id: r.product_id,
        created_at: r.fav_created_at,
        product: {
          id: r.product_id,
          name: r.name,
          description: r.description,
          price: r.price,
          unit: r.unit,
          image_url: r.image_url,
          category_id: r.category_id,
          stock: r.stock,
          is_active: !!r.is_active,
        },
      }))
    );
  } catch (err) {
    next(err);
  }
});

// GET /api/favorites/:product_id/check — is this product favorited by me?
router.get('/:product_id/check', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id FROM favorites WHERE user_id = ? AND product_id = ?',
      [req.user.id, req.params.product_id]
    );
    res.json({ isFavorite: rows.length > 0 });
  } catch (err) {
    next(err);
  }
});

// POST /api/favorites { product_id }
router.post('/', async (req, res, next) => {
  const { product_id } = req.body;
  try {
    const id = crypto.randomUUID();
    await pool.query(
      'INSERT IGNORE INTO favorites (id, user_id, product_id) VALUES (?, ?, ?)',
      [id, req.user.id, product_id]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/favorites/:product_id
router.delete('/:product_id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM favorites WHERE user_id = ? AND product_id = ?', [
      req.user.id,
      req.params.product_id,
    ]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
