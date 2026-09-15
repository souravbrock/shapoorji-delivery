const express = require('express');
const crypto = require('crypto');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/cart — current user's cart, with product joined
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT ci.id AS cart_id, ci.quantity, ci.created_at AS cart_created_at, p.*
       FROM cart_items ci JOIN products p ON p.id = ci.product_id
       WHERE ci.user_id = ?`,
      [req.user.id]
    );
    res.json(
      rows.map((r) => ({
        id: r.cart_id,
        user_id: req.user.id,
        product_id: r.id,
        quantity: r.quantity,
        created_at: r.cart_created_at,
        product: {
          id: r.id,
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

// POST /api/cart { product_id, quantity } — upsert (add or bump quantity)
router.post('/', async (req, res, next) => {
  const { product_id, quantity = 1 } = req.body;
  try {
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO cart_items (id, user_id, product_id, quantity)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)`,
      [id, req.user.id, product_id, quantity]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// PUT /api/cart/:product_id { quantity }
router.put('/:product_id', async (req, res, next) => {
  const { quantity } = req.body;
  try {
    await pool.query('UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?', [
      quantity,
      req.user.id,
      req.params.product_id,
    ]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/cart/:product_id
router.delete('/:product_id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?', [
      req.user.id,
      req.params.product_id,
    ]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/cart — clear entire cart
router.delete('/', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
