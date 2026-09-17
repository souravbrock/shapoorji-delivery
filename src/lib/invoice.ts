import type { Order, OrderItem } from '@/lib/api';

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function generateInvoiceHTML(order: Order, items: OrderItem[]): string {
  const invoiceId = order.id.slice(0, 8).toUpperCase();
  const date = new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const itemsHTML = items.map((item, idx) => {
    const price = Number(item.price) || 0;
    const qty = Number(item.quantity) || 0;
    return `
    <tr style="${idx % 2 === 0 ? 'background: #f9fafb' : ''}">
      <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(item.product_name)}</td>
      <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; text-align: center;">${escapeHtml(item.unit)}</td>
      <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; text-align: center;">${escapeHtml(qty)}</td>
      <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${price.toFixed(2)}</td>
      <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${(price * qty).toFixed(2)}</td>
    </tr>
  `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice - ${invoiceId}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', Arial, sans-serif; color: #1f2937; background: #f3f4f6; padding: 40px; }
    .invoice { max-width: 700px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #16a34a, #15803d); padding: 32px 40px; color: white; }
    .header h1 { font-size: 28px; font-weight: 700; }
    .header p { opacity: 0.9; margin-top: 4px; font-size: 14px; }
    .invoice-meta { display: flex; justify-content: space-between; padding: 24px 40px; border-bottom: 1px solid #e5e7eb; }
    .invoice-meta .label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .invoice-meta .value { font-size: 14px; font-weight: 600; margin-top: 2px; }
    .billing { padding: 24px 40px; border-bottom: 1px solid #e5e7eb; }
    .billing h3 { font-size: 14px; color: #6b7280; margin-bottom: 8px; }
    .billing p { font-size: 14px; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; }
    thead th { padding: 12px 16px; background: #f9fafb; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; border-bottom: 2px solid #e5e7eb; }
    thead th:nth-child(2), thead th:nth-child(3) { text-align: center; }
    thead th:nth-child(4), thead th:nth-child(5) { text-align: right; }
    .total { padding: 20px 40px; display: flex; justify-content: space-between; align-items: center; background: #f0fdf4; border-top: 2px solid #16a34a; }
    .total .label { font-size: 18px; font-weight: 700; color: #1f2937; }
    .total .amount { font-size: 24px; font-weight: 800; color: #16a34a; }
    .footer { padding: 20px 40px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
    @media print { body { background: white; padding: 0; } .invoice { box-shadow: none; } }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <h1>Shapoorji Delivery</h1>
      <p>Fresh groceries delivered to your door · Shapoorji Housing Complex</p>
    </div>
    <div class="invoice-meta">
      <div>
        <div class="label">Invoice Number</div>
        <div class="value">${invoiceId}</div>
      </div>
      <div style="text-align: right;">
        <div class="label">Date</div>
        <div class="value">${date}</div>
      </div>
    </div>
    <div class="billing">
      <h3>Bill To</h3>
      <p><strong>${escapeHtml(order.customer_name)}</strong></p>
      <p>${escapeHtml(order.delivery_address)}</p>
      <p>Phone: ${escapeHtml(order.customer_phone)}</p>
      ${order.notes ? `<p style="margin-top: 8px; color: #6b7280;"><em>Note: ${escapeHtml(order.notes)}</em></p>` : ''}
    </div>
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th>Unit</th>
          <th>Qty</th>
          <th>Price</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>${itemsHTML}</tbody>
    </table>
    <div class="total">
      <span class="label">Total Amount</span>
      <span class="amount">₹${(Number(order.total) || 0).toFixed(2)}</span>
    </div>
    <div class="footer">
      <p>Thank you for shopping with Shapoorji Delivery!</p>
      <p style="margin-top: 4px;">This is a computer-generated invoice and does not require a signature.</p>
    </div>
  </div>
</body>
</html>`;
}

// Render the same invoice design to a PDF download (A4, multi-page safe).
// Works purely in the browser: the invoice HTML is rasterized offscreen,
// so the PDF keeps the exact on-screen look.
export async function downloadInvoicePDF(order: Order, items: OrderItem[]): Promise<void> {
  // Lazy-loaded so the PDF libraries don't weigh down the initial page load.
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);
  const invoiceId = order.id.slice(0, 8).toUpperCase();
  const full = generateInvoiceHTML(order, items);
  const doc = new DOMParser().parseFromString(full, 'text/html');
  const css = Array.from(doc.querySelectorAll('style'))
    .map((s) => s.textContent || '')
    .join('\n')
    // Scope the template's `body` rule to our container so the live page
    // never flashes grey/padded while rendering offscreen.
    .replace(/\bbody\s*\{/g, '.pdf-root{');

  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-10000px;top:0;width:700px;background:#ffffff;';
  const style = document.createElement('style');
  style.textContent = css;
  const root = document.createElement('div');
  root.className = 'pdf-root';
  root.innerHTML = doc.body.innerHTML;
  host.appendChild(style);
  host.appendChild(root);
  document.body.appendChild(host);
  try {
    const canvas = await html2canvas(host, { scale: 2, backgroundColor: '#ffffff', logging: false });
    const img = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = 210;
    const pageH = 297;
    const imgW = pageW;
    const imgH = (canvas.height * pageW) / canvas.width;
    if (imgH <= pageH) {
      pdf.addImage(img, 'PNG', 0, 0, imgW, imgH);
    } else {
      // Slice one tall image across pages via vertical offsets.
      let pos = 0;
      while (true) {
        pdf.addImage(img, 'PNG', 0, -pos, imgW, imgH);
        pos += pageH;
        if (pos >= imgH) break;
        pdf.addPage();
      }
    }
    pdf.save(`invoice-${invoiceId}.pdf`);
  } finally {
    document.body.removeChild(host);
  }
}
