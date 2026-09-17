const nodemailer = require('nodemailer');

let transporter = null;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: process.env.SMTP_SECURE !== 'false',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }
  return transporter;
}

// Fire-and-forget style — logs errors but never throws, so a broken
// mail server never blocks checkout or admin status updates.
async function sendOrderEmail({ to, bcc, subject, html, text }) {
  try {
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM,
      to,
      ...(bcc ? { bcc } : {}),
      subject,
      ...(text ? { text } : {}),
      html,
    });
  } catch (err) {
    console.error('Failed to send order email:', err.message);
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function money2(n) {
  return `₹${(Number(n) || 0).toFixed(2)}`;
}

function moneyLine(n) {
  const r = Math.round(Number(n) * 100) / 100;
  return `₹${Number.isInteger(r) ? String(r) : r.toFixed(2)}`;
}

function fmtDateTime(d) {
  try {
    // DB DATETIME strings are IST wall time — pin the offset explicitly
    // because the server itself runs in a different timezone.
    const s = d instanceof Date ? d.toISOString() : String(d ?? '').replace(' ', 'T');
    const withZone = /[+-]\d{2}:?\d{2}$|Z$/.test(s) ? s : `${s}+05:30`;
    return new Date(withZone).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    });
  } catch {
    return String(d ?? '');
  }
}

function orderTag(order) {
  return order.order_number || `#${String(order.id).slice(0, 8).toUpperCase()}`;
}

// Plain-text store receipt (also used as the e-mail text body).
function renderOrderReceiptText(order, items) {
  const itemLines = items
    .map((i) => `- ${i.product_name} (x${Number(i.quantity)}) : ${moneyLine(Number(i.price) * Number(i.quantity))}`)
    .join('\n');
  const L = [];
  L.push('==================================================');
  L.push('            SHAPOORJI GROCERY DELIVERY');
  L.push('           spdelivery.reddevils.co.in');
  L.push('==================================================');
  L.push('Status: ORDER RECEIVED');
  L.push(`Order Number  : ${order.order_number || '—'}`);
  L.push(`Invoice Number: ${order.invoice_number || '—'}`);
  L.push(`Date & Time   : ${fmtDateTime(order.created_at)}`);
  L.push('--------------------------------------------------');
  L.push('CUSTOMER & DELIVERY LOCATION:');
  L.push(`Name          : ${order.customer_name || '—'}`);
  L.push(`Email         : ${order.customer_email || '—'}`);
  L.push(`Phone         : ${order.customer_phone || '—'}`);
  L.push(`Tower/Building: ${order.tower || '—'}`);
  L.push(`Flat / Unit   : ${order.flat || '—'}`);
  L.push('Location Status: Verified Inside Shapoorji Shukhobrishti');
  L.push(`Notes         : ${order.notes || '—'}`);
  L.push('--------------------------------------------------');
  L.push('ORDER ITEMS & PRICING:');
  L.push(`Items Count   : ${items.length} items`);
  L.push(`Subtotal      : ${money2(order.subtotal)}`);
  L.push(`Delivery Fee  : ${money2(order.delivery_fee)} (Free inside Shapoorji)`);
  L.push(`Grand Total   : ${money2(order.total)}`);
  L.push(`Payment Method: ${order.payment_method || 'Pay on Delivery (Cash / UPI QR)'}`);
  L.push('--------------------------------------------------');
  L.push('🛍️ Items Billed:');
  L.push(itemLines);
  L.push('==================================================');
  L.push('Delivered exclusively inside Shapoorji Shukhobrishti, Action Area III, Kolkata.');
  L.push('Store Contact: order@spdelivery.reddevils.co.in | +91-8442980101');
  return L.join('\n');
}

// HTML twin of the receipt (same content, monospace block).
function renderOrderReceiptHtml(order, items) {
  return `<pre style="font-family:monospace,monospace;font-size:13px;line-height:1.5;">${escapeHtml(
    renderOrderReceiptText(order, items)
  )}</pre>`;
}

function renderOrderStatusEmail(order) {
  const statusLabels = {
    received: 'Received',
    packed: 'Packed',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };
  const label = statusLabels[order.status] || order.status;
  const tag = escapeHtml(orderTag(order));
  return `
    <h2>Order ${tag} update</h2>
    <p>Hi ${escapeHtml(order.customer_name || 'there')}, your order status is now: <strong>${escapeHtml(label)}</strong></p>
    ${order.invoice_number ? `<p>Invoice: ${escapeHtml(order.invoice_number)}</p>` : ''}
  `;
}

function renderVerifyEmailText(code) {
  return [
    'SHAPOORJI GROCERY DELIVERY',
    '',
    'Verify your email address to start ordering.',
    '',
    `Your verification code is: ${code}`,
    '',
    'It expires in 10 minutes. If you did not create this account, ignore this mail.',
  ].join('\n');
}

function renderVerifyEmailHtml(code) {
  return `
    <h2>Verify your email — Shapoorji Delivery</h2>
    <p>Enter this code on the website to verify your email address:</p>
    <p style="font-size:28px;font-weight:800;letter-spacing:6px;">${escapeHtml(code)}</p>
    <p>It expires in 10 minutes. If you did not create this account, ignore this mail.</p>
  `;
}

function renderOrderStatusText(order) {
  const statusLabels = {
    received: 'Received',
    packed: 'Packed',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };
  return [
    'SHAPOORJI GROCERY DELIVERY',
    `Order ${orderTag(order)} update`,
    `Status: ${(statusLabels[order.status] || order.status).toUpperCase()}`,
    order.invoice_number ? `Invoice: ${order.invoice_number}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

module.exports = {
  sendOrderEmail,
  renderVerifyEmailText,
  renderVerifyEmailHtml,
  renderOrderReceiptText,
  renderOrderReceiptHtml,
  renderOrderStatusEmail,
  renderOrderStatusText,
};
