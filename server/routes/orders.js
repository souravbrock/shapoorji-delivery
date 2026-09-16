const express = require('express');
const crypto = require('crypto');
const pool = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { sendOrderEmail, renderOrderPlacedEmail, renderOrderStatusEmail } = require('../utils/mailer');

const router = express.Router();
router.use(requireAuth);

// GET /api/orders — own orders for customers; admins pass ?all=1 to see everyone's
router.get('/', async (req, res, next) => {
  try {
    let rows;
    if (req.query.all === '1') {
      const [profileRows] = await pool.query('SELECT role FROM profiles WHERE id = ?', [req.user.id]);
      if (!profileRows.length || profileRows[0].role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      [rows] = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    } else {
      [rows] = await pool.query(
        'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
        [req.user.id]
      );
    }
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:id/items — items for an order (own order, or admin)
router.get('/:id/items', async (req, res, next) => {
  try {
    const [orderRows] = await pool.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!orderRows.length) return res.status(404).json({ error: 'Order not found' });
    const order = orderRows[0];

    if (order.user_id !== req.user.id) {
      const [profileRows] = await pool.query('SELECT role FROM profiles WHERE id = ?', [req.user.id]);
      if (!profileRows.length || profileRows[0].role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to view this order' });
      }
    }

    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [req.params.id]);
    res.json(items);
  } catch (err) {
    next(err);
  }
});

// POST /api/orders — create order + items in one transaction (checkout)
// IMPORTANT: price/name/unit always come from the DB, never from the client.
router.post('/', async (req, res, next) => {
  const { delivery_address, customer_name, customer_phone, notes, items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Order must include at least one item' });
  }
  if (items.length > 100) {
    return res.status(400).json({ error: 'Too many items in order' });
  }

  // Basic validation of client input (product_id + quantity only)
  for (const i of items) {
    if (!i || !i.product_id) {
      return res.status(400).json({ error: 'Each item must have a product_id' });
    }
    const qty = Number(i.quantity);
    if (!Number.isFinite(qty) || qty <= 0 || qty > 1000) {
      return res.status(400).json({ error: 'Invalid quantity' });
    }
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Look up authoritative price/name/unit from DB
    const ids = [...new Set(items.map((i) => i.product_id))];
    const [products] = await conn.query(
      `SELECT id, name, price, unit, is_active FROM products WHERE id IN (${ids.map(() => '?').join(',')})`,
      ids
    );
    const byId = new Map(products.map((p) => [String(p.id), p]));

    let total = 0;
    const serverItems = [];
    for (const i of items) {
      const p = byId.get(String(i.product_id));
      if (!p) {
        throw Object.assign(new Error(`Product not found: ${i.product_id}`), { status: 400 });
      }
      if (p.is_active === 0 || p.is_active === false) {
        throw Object.assign(new Error(`Product not available: ${p.name}`), { status: 400 });
      }
      const qty = Number(i.quantity);
      const price = Number(p.price);
      total += price * qty;
      serverItems.push({
        product_id: p.id,
        product_name: p.name,
        price,
        quantity: qty,
        unit: p.unit || 'each',
      });
    }
    total = Math.round(total * 100) / 100; // avoid float dust

    const orderId = crypto.randomUUID();
    await conn.query(
      `INSERT INTO orders (id, user_id, status, total, delivery_address, customer_name, customer_phone, customer_email, notes)
       VALUES (?, ?, 'received', ?, ?, ?, ?, ?, ?)`,
      [orderId, req.user.id, total, delivery_address || '', customer_name || '', customer_phone || '', req.user.email || '', notes || '']
    );

    for (const item of serverItems) {
      await conn.query(
        `INSERT INTO order_items (id, order_id, product_id, product_name, price, quantity, unit)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [crypto.randomUUID(), orderId, item.product_id || null, item.product_name, item.price, item.quantity, item.unit || 'each']
      );
    }

    await conn.commit();

    const [orderRows] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    const order = orderRows[0];

    if (req.user.email) {
      sendOrderEmail({
        to: req.user.email,
        subject: `Order Confirmation #${orderId.slice(0, 8).toUpperCase()}`,
        html: renderOrderPlacedEmail(order, serverItems),
      });
    }
    if (process.env.ADMIN_NOTIFY_EMAIL) {
      sendOrderEmail({
        to: process.env.ADMIN_NOTIFY_EMAIL,
        subject: `New order #${orderId.slice(0, 8).toUpperCase()}`,
        html: renderOrderPlacedEmail(order, serverItems),
      });
    }

    res.status(201).json(order);
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

// PATCH /api/orders/:id/status { status } — admin only
router.patch('/:id/status', requireAdmin, async (req, res, next) => {
  const { status } = req.body;
  const allowed = ['received', 'packed', 'out_for_delivery', 'delivered', 'cancelled'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  try {
    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    const order = rows[0];
    if (order && order.customer_email) {
      sendOrderEmail({
        to: order.customer_email,
        subject: `Order #${order.id.slice(0, 8).toUpperCase()} — status update`,
        html: renderOrderStatusEmail(order),
      });
    }
    res.json(order);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
