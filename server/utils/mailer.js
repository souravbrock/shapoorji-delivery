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
async function sendOrderEmail({ to, subject, html }) {
  try {
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error('Failed to send order email:', err.message);
  }
}

function renderOrderPlacedEmail(order, items) {
  const rows = items
    .map(
      (i) =>
        `<tr><td>${i.product_name}</td><td>${i.quantity} ${i.unit}</td><td>₹${Number(i.price).toFixed(2)}</td></tr>`
    )
    .join('');
  return `
    <h2>Order Confirmation — #${order.id.slice(0, 8)}</h2>
    <p>Hi ${order.customer_name}, thanks for your order!</p>
    <table border="1" cellpadding="6" cellspacing="0">
      <tr><th>Item</th><th>Qty</th><th>Price</th></tr>
      ${rows}
    </table>
    <p><strong>Total: ₹${Number(order.total).toFixed(2)}</strong></p>
    <p>Delivery address: ${order.delivery_address}</p>
  `;
}

function renderOrderStatusEmail(order) {
  const statusLabels = {
    received: 'Received',
    packed: 'Packed',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };
  return `
    <h2>Order #${order.id.slice(0, 8)} update</h2>
    <p>Your order status is now: <strong>${statusLabels[order.status] || order.status}</strong></p>
  `;
}

module.exports = { sendOrderEmail, renderOrderPlacedEmail, renderOrderStatusEmail };
