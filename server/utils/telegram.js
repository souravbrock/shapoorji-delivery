// Telegram staff notifications via the Bot HTTP API.
// Fire-and-forget by design: every function catches internally and
// NEVER throws, so a broken token/network can never block checkout.
// (No new npm deps — uses the global fetch on Node 18+.)
//
// Env (cPanel -> Setup Node.js App -> Environment Variables):
//   TELEGRAM_BOT_TOKEN        from @BotFather (never commit it)
//   TELEGRAM_ADMIN_CHAT_IDS   comma-separated chat IDs, full detail
//   TELEGRAM_MANAGER_CHAT_IDS comma-separated chat IDs, no phone/email
//   TELEGRAM_STAFF_CHAT_IDS   comma-separated chat IDs, minimal version

const DIV = '━━━━━━━━━━━━━━━━━━━━';
const FOOTER = `${DIV}\n🔔 Alert sent to Store Admin, Managers & Staff`;

function parseIds(value) {
  return String(value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function tiers() {
  return {
    admin: parseIds(process.env.TELEGRAM_ADMIN_CHAT_IDS),
    manager: parseIds(process.env.TELEGRAM_MANAGER_CHAT_IDS),
    staff: parseIds(process.env.TELEGRAM_STAFF_CHAT_IDS),
  };
}

function isConfigured() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN);
}

function money2(n) {
  return `₹${(Number(n) || 0).toFixed(2)}`;
}

function moneyLine(n) {
  const r = Math.round(Number(n) * 100) / 100;
  return `₹${Number.isInteger(r) ? String(r) : r.toFixed(2)}`;
}

function shortId(order) {
  return `#${String(order.id).slice(0, 8).toUpperCase()}`;
}

function statusText(status) {
  return (
    {
      received: 'Order Received',
      packed: 'Packed',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    }[status] || status
  );
}

function header(order, status) {
  return [
    '🚨 NEW ORDER RECEIVED - SHAPOORJI DELIVERY',
    DIV,
    `📌 Status: ${status}`,
    `🆔 Order: ${order.order_number || shortId(order)}`,
    `📄 Invoice: ${order.invoice_number || '—'}`,
  ].join('\n');
}

function itemLines(items) {
  return items
    .map((i) => `- ${i.product_name} (x${Number(i.quantity)}) : ${moneyLine(Number(i.price) * Number(i.quantity))}`)
    .join('\n');
}

function amountBlock(order, items) {
  const method = order.payment_method || 'Pay on Delivery (Cash / UPI QR)';
  return [`💰 Amount: ${money2(order.total)} (${method})`, `📦 Total Items: ${items.length}`].join('\n');
}

function buildAdminMessage(order, items) {
  return [
    header(order, statusText(order.status)),
    `👤 Customer: ${order.customer_name || '—'}`,
    `📞 Phone: ${order.customer_phone || '—'}`,
    `📍 Address: ${order.delivery_address || '—'}`,
    `📧 Email: ${order.customer_email || '—'}`,
    '🛍️ Items Billed:',
    itemLines(items),
    amountBlock(order, items),
    FOOTER,
  ].join('\n');
}

function buildManagerMessage(order, items) {
  return [
    header(order, statusText(order.status)),
    `👤 Customer: ${order.customer_name || '—'}`,
    `📍 Address: ${order.delivery_address || '—'}`,
    '🛍️ Items Billed:',
    itemLines(items),
    amountBlock(order, items),
    FOOTER,
  ].join('\n');
}

function buildStaffMessage(order, items) {
  return [
    header(order, statusText(order.status)),
    `👤 Customer: ${order.customer_name || '—'}`,
    amountBlock(order, items),
    FOOTER,
  ].join('\n');
}

async function tgSend(chatId, text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { ok: false, skipped: true };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
      signal: ctrl.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!data.ok) console.error(`Telegram send failed for ${chatId}:`, data.description || res.status);
    return { ok: !!data.ok, error: data.description };
  } catch (err) {
    console.error(`Telegram send error for ${chatId}:`, err.message);
    return { ok: false, error: err.message };
  } finally {
    clearTimeout(timer);
  }
}

// Notify all tiers about a new order. Never throws.
async function notifyNewOrderTelegram(order, items) {
  if (!isConfigured()) return { sent: 0, skipped: true };
  const t = tiers();
  const jobs = [
    ...t.admin.map((id) => tgSend(id, buildAdminMessage(order, items))),
    ...t.manager.map((id) => tgSend(id, buildManagerMessage(order, items))),
    ...t.staff.map((id) => tgSend(id, buildStaffMessage(order, items))),
  ];
  const results = await Promise.all(jobs);
  const sent = results.filter((r) => r.ok).length;
  console.log(`Telegram new-order dispatch: ${sent}/${jobs.length} delivered`);
  return { sent, total: jobs.length };
}

function telegramStatus() {
  const t = tiers();
  return {
    configured: isConfigured(),
    admin: t.admin.length,
    manager: t.manager.length,
    staff: t.staff.length,
  };
}

// Test broadcast used by the admin panel button. Never exposes the token.
async function sendTestDispatch() {
  if (!isConfigured()) {
    throw Object.assign(new Error('TELEGRAM_BOT_TOKEN is not set on the server'), { status: 400 });
  }
  const t = tiers();
  const text = '✅ Test dispatch from Shapoorji Delivery — bot is connected. New-order alerts will arrive here.';
  const jobs = [...t.admin, ...t.manager, ...t.staff].map((id) => tgSend(id, text));
  if (!jobs.length) {
    throw Object.assign(new Error('No Telegram chat IDs configured (admin/manager/staff lists are all empty)'), { status: 400 });
  }
  const results = await Promise.all(jobs);
  const sent = results.filter((r) => r.ok).length;
  return { sent, total: jobs.length };
}

module.exports = {
  notifyNewOrderTelegram,
  telegramStatus,
  sendTestDispatch,
  // exported for tests/previews, not used by routes directly
  buildAdminMessage,
  buildManagerMessage,
  buildStaffMessage,
};
