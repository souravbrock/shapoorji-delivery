const express = require('express');
const crypto = require('crypto');
const pool = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/categories — public
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY sort_order');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/categories — admin only
router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  const { name, slug, icon, sort_order } = req.body;
  try {
    const id = crypto.randomUUID();
    await pool.query(
      'INSERT INTO categories (id, name, slug, icon, sort_order) VALUES (?, ?, ?, ?, ?)',
      [id, name, slug, icon || 'ShoppingBasket', sort_order || 0]
    );
    const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/categories/:id — admin only
router.put('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  const { name, slug, icon, sort_order } = req.body;
  try {
    await pool.query(
      'UPDATE categories SET name = COALESCE(?, name), slug = COALESCE(?, slug), icon = COALESCE(?, icon), sort_order = COALESCE(?, sort_order) WHERE id = ?',
      [name, slug, icon, sort_order, req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/categories/:id — admin only
router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
