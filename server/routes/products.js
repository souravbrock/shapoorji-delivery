const express = require('express');
const crypto = require('crypto');
const pool = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

const ALLOWED_ORDER = {
  name: 'p.name ASC',
  created_at_desc: 'p.created_at DESC',
  created_at_asc: 'p.created_at ASC',
};

// GET /api/products?activeOnly=1&orderBy=name&limit=8 — public
router.get('/', async (req, res, next) => {
  const { activeOnly, orderBy, limit } = req.query;
  try {
    let sql = `
      SELECT p.*, c.id AS cat_id, c.name AS cat_name, c.slug AS cat_slug,
             c.icon AS cat_icon, c.sort_order AS cat_sort_order
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
    `;
    const params = [];
    if (activeOnly === '1' || activeOnly === 'true') {
      sql += ' WHERE p.is_active = 1';
    }
    sql += ` ORDER BY ${ALLOWED_ORDER[orderBy] || ALLOWED_ORDER.created_at_desc}`;
    if (limit) {
      sql += ' LIMIT ?';
      params.push(Number(limit));
    }
    const [rows] = await pool.query(sql, params);
    res.json(rows.map(shapeProduct));
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id — public
router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, c.id AS cat_id, c.name AS cat_name, c.slug AS cat_slug,
              c.icon AS cat_icon, c.sort_order AS cat_sort_order
       FROM products p LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json(shapeProduct(rows[0]));
  } catch (err) {
    next(err);
  }
});

// POST /api/products — admin only
router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  const { name, description, price, unit, image_url, category_id, stock, is_active } = req.body;
  try {
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO products (id, name, description, price, unit, image_url, category_id, stock, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        name,
        description || '',
        price || 0,
        unit || 'each',
        image_url || '',
        category_id || null,
        stock || 0,
        is_active === undefined ? 1 : is_active ? 1 : 0,
      ]
    );
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/products/:id — admin only
router.put('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  const { name, description, price, unit, image_url, category_id, stock, is_active } = req.body;
  try {
    await pool.query(
      `UPDATE products SET
         name = COALESCE(?, name),
         description = COALESCE(?, description),
         price = COALESCE(?, price),
         unit = COALESCE(?, unit),
         image_url = COALESCE(?, image_url),
         category_id = ?,
         stock = COALESCE(?, stock),
         is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [
        name,
        description,
        price,
        unit,
        image_url,
        category_id ?? null,
        stock,
        is_active === undefined ? null : is_active ? 1 : 0,
        req.params.id,
      ]
    );
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/products/:id — admin only
router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

function shapeProduct(row) {
  const { cat_id, cat_name, cat_slug, cat_icon, cat_sort_order, ...product } = row;
  return {
    ...product,
    is_active: !!product.is_active,
    category: cat_id
      ? { id: cat_id, name: cat_name, slug: cat_slug, icon: cat_icon, sort_order: cat_sort_order }
      : null,
  };
}

module.exports = router;
