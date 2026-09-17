const express = require('express');
const crypto = require('crypto');
const pool = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { sendOrderEmail, renderOrderReceiptText, renderOrderReceiptHtml, renderOrderStatusEmail, renderOrderStatusText } = require('../utils/mailer');
const { notifyNewOrderTelegram } = require('../utils/telegram');

const PAYMENT_METHOD = 'Pay on Delivery (Cash / UPI QR)';

// Atomic yearly sequence -> SPD-YYYY-NNNN (starts at 1027). Must run
// on the transaction connection so concurrent checkouts can't collide.
async function nextOrderNumber(conn) {
  const yr = new Date().getFullYear();
  await conn.query(
    'INSERT INTO order_counters (year, next_seq) VALUES (?, 1027) ON DUPLICATE KEY UPDATE next_seq = LAST_INSERT_ID(next_seq + 1)',
    [yr]
  );
  const [[row]] = await conn.query('SELECT LAST_INSERT_ID() AS seq');
  return `SPD-${yr}-${row.seq}`;
}

function nextInvoiceNumber() {
  return `INV-SPD-${Math.floor(10000 + Math.random() * 89999)}`;
}

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
  const { delivery_address, customer_name, customer_phone, notes, items, tower, flat } = req.body;
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

  // Unverified emails cannot check out
  const [meRows] = await pool.query('SELECT email_verified FROM users WHERE id = ?', [req.user.id]);
  if (!meRows[0] || !meRows[0].email_verified) {
    return res.status(403).json({ error: 'Please verify your email before placing an order.' });
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
    const subtotal = Math.round(total * 100) / 100; // avoid float dust
    const deliveryFee = Math.round(Number(process.env.DELIVERY_FEE || 20) * 100) / 100;
    total = Math.round((subtotal + deliveryFee) * 100) / 100;

    const orderNumber = await nextOrderNumber(conn);
    const invoiceNumber = nextInvoiceNumber();

    const orderId = crypto.randomUUID();
    await conn.query(
      `INSERT INTO orders (id, user_id, status, order_number, invoice_number, subtotal, delivery_fee, total, payment_method, tower, flat, delivery_address, customer_name, customer_phone, customer_email, notes)
       VALUES (?, ?, 'received', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderId, req.user.id, orderNumber, invoiceNumber, subtotal, deliveryFee, total, PAYMENT_METHOD, (tower || '').slice(0, 100), (flat || '').slice(0, 100), delivery_address || '', customer_name || '', customer_phone || '', req.user.email || '', notes || '']
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

    const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;
    const receiptText = renderOrderReceiptText(order, serverItems);
    const receiptHtml = renderOrderReceiptHtml(order, serverItems);
    if (req.user.email) {
      // Customer gets the receipt; admin is BCC'd on the same mail.
      sendOrderEmail({
        to: req.user.email,
        bcc: adminEmail || undefined,
        subject: `Order ${orderNumber} confirmed — Shapoorji Delivery`,
        text: receiptText,
        html: receiptHtml,
      });
    } else if (adminEmail) {
      sendOrderEmail({
        to: adminEmail,
        subject: `New order ${orderNumber} (no customer email)`,
        text: receiptText,
        html: receiptHtml,
      });
    }

    // Staff Telegram alerts — fire-and-forget, never blocks the response.
    notifyNewOrderTelegram(order, serverItems);

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
    const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;
    const tag = order ? order.order_number || `#${order.id.slice(0, 8).toUpperCase()}` : '';
    if (order && order.customer_email) {
      // Customer gets the update; admin is BCC'd on the same mail.
      sendOrderEmail({
        to: order.customer_email,
        bcc: adminEmail || undefined,
        subject: `Order ${tag} — status update`,
        text: renderOrderStatusText(order),
        html: renderOrderStatusEmail(order),
      });
    } else if (order && adminEmail) {
      sendOrderEmail({
        to: adminEmail,
        subject: `Order ${tag} — status update (no customer email)`,
        text: renderOrderStatusText(order),
        html: renderOrderStatusEmail(order),
      });
    }
    res.json(order);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
