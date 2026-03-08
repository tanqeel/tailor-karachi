import type { Order, Customer, Measurements } from '@/lib/store';

interface PrintReceiptOptions {
  order: Order;
  customer: Customer;
  lang: 'en' | 'ur';
  shopName?: string;
}

export function printReceipt({ order, customer, lang, shopName = 'Karachi Tailors' }: PrintReceiptOptions) {
  const isUrdu = lang === 'ur';
  const balance = order.totalAmount - order.advancePaid;
  const m = customer.measurements;

  const measurementRows = [
    { label: isUrdu ? 'لمبائی' : 'Length', value: m.kameezLength },
    { label: isUrdu ? 'سینہ' : 'Chest', value: m.chest },
    { label: isUrdu ? 'کندھا' : 'Shoulder', value: m.shoulder },
    { label: isUrdu ? 'آستین' : 'Sleeve', value: m.sleeve },
    { label: isUrdu ? 'کالر' : 'Collar', value: m.collar },
    { label: isUrdu ? 'دامن' : 'Daman', value: m.daman },
    { label: isUrdu ? 'شلوار لمبائی' : 'Shalwar Length', value: m.shalwarLength },
    { label: isUrdu ? 'کمر' : 'Waist', value: m.waist },
    { label: isUrdu ? 'ہپ' : 'Hip', value: m.hip },
    { label: isUrdu ? 'پانچا' : 'Pancha', value: m.pancha },
  ].filter(r => r.value);

  const suitTypes: Record<string, string> = {
    full_suit: isUrdu ? 'فل سوٹ' : 'Full Suit',
    kameez: isUrdu ? 'قمیض' : 'Kameez',
    shalwar: isUrdu ? 'شلوار' : 'Shalwar',
  };

  const html = `<!DOCTYPE html>
<html dir="${isUrdu ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8">
  <title>${isUrdu ? 'رسید' : 'Receipt'} - ${customer.customerId}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: ${isUrdu ? "'Noto Nastaliq Urdu', serif" : "'Inter', Arial, sans-serif"}; padding: 20px; max-width: 380px; margin: 0 auto; font-size: 13px; color: #111; }
    .header { text-align: center; border-bottom: 2px solid #1a6b4a; padding-bottom: 12px; margin-bottom: 16px; }
    .header h1 { font-size: 20px; color: #1a6b4a; margin-bottom: 4px; }
    .header p { font-size: 11px; color: #666; }
    .section { margin-bottom: 14px; }
    .section-title { font-weight: bold; font-size: 13px; color: #1a6b4a; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-bottom: 8px; }
    .row { display: flex; justify-content: space-between; padding: 3px 0; }
    .row .label { color: #555; }
    .row .value { font-weight: 600; }
    .measurements { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 16px; }
    .total-row { font-size: 15px; font-weight: bold; border-top: 2px solid #111; padding-top: 6px; margin-top: 6px; }
    .balance { color: #c00; }
    .paid { color: #1a6b4a; }
    .footer { text-align: center; margin-top: 20px; padding-top: 12px; border-top: 1px dashed #999; font-size: 11px; color: #888; }
    .suits-table { width: 100%; border-collapse: collapse; margin-top: 6px; }
    .suits-table th, .suits-table td { padding: 4px 8px; text-align: ${isUrdu ? 'right' : 'left'}; border-bottom: 1px solid #eee; font-size: 12px; }
    .suits-table th { font-weight: 600; color: #555; }
    @media print { body { padding: 10px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>✂️ ${shopName}</h1>
    <p>${isUrdu ? 'رسید / آرڈر سلپ' : 'Order Receipt'}</p>
  </div>

  <div class="section">
    <div class="section-title">${isUrdu ? 'گاہک کی تفصیلات' : 'Customer Details'}</div>
    <div class="row"><span class="label">${isUrdu ? 'نام' : 'Name'}</span><span class="value">${customer.name}</span></div>
    <div class="row"><span class="label">${isUrdu ? 'آئی ڈی' : 'ID'}</span><span class="value">${customer.customerId}</span></div>
    ${customer.phone ? `<div class="row"><span class="label">${isUrdu ? 'فون' : 'Phone'}</span><span class="value">${customer.phone}</span></div>` : ''}
    <div class="row"><span class="label">${isUrdu ? 'تاریخ' : 'Date'}</span><span class="value">${new Date(order.createdAt).toLocaleDateString()}</span></div>
    <div class="row"><span class="label">${isUrdu ? 'ڈیڈ لائن' : 'Deadline'}</span><span class="value">${new Date(order.deadline).toLocaleDateString()}</span></div>
  </div>

  ${measurementRows.length > 0 ? `
  <div class="section">
    <div class="section-title">${isUrdu ? 'ناپ' : 'Measurements'}</div>
    <div class="measurements">
      ${measurementRows.map(r => `<div class="row"><span class="label">${r.label}</span><span class="value">${r.value}</span></div>`).join('')}
    </div>
    ${m.notes ? `<div style="margin-top:6px;font-size:11px;color:#666;">${isUrdu ? 'نوٹس' : 'Notes'}: ${m.notes}</div>` : ''}
  </div>` : ''}

  <div class="section">
    <div class="section-title">${isUrdu ? 'سوٹ کی تفصیلات' : 'Suit Details'}</div>
    <table class="suits-table">
      <tr><th>#</th><th>${isUrdu ? 'قسم' : 'Type'}</th><th>${isUrdu ? 'ڈیزائن' : 'Design'}</th><th>${isUrdu ? 'حالت' : 'Status'}</th></tr>
      ${order.suits.map((s, i) => `<tr><td>${i + 1}</td><td>${suitTypes[s.type] || s.type}</td><td>${s.designWork ? '✓' : '—'}</td><td>${s.status}</td></tr>`).join('')}
    </table>
  </div>

  <div class="section">
    <div class="section-title">${isUrdu ? 'ادائیگی' : 'Payment'}</div>
    <div class="row"><span class="label">${isUrdu ? 'کل رقم' : 'Total'}</span><span class="value">Rs ${order.totalAmount.toLocaleString()}</span></div>
    <div class="row"><span class="label">${isUrdu ? 'پیشگی' : 'Advance Paid'}</span><span class="value paid">Rs ${order.advancePaid.toLocaleString()}</span></div>
    <div class="row total-row"><span class="label">${isUrdu ? 'بقایا' : 'Balance Due'}</span><span class="value ${balance > 0 ? 'balance' : 'paid'}">Rs ${balance.toLocaleString()}</span></div>
  </div>

  <div class="footer">
    <p>${isUrdu ? 'شکریہ! اللہ حافظ' : 'Thank you for choosing Karachi Tailors!'}</p>
    <p style="margin-top:4px;">${new Date().toLocaleString()}</p>
  </div>
</body>
</html>`;

  const printWindow = window.open('', '_blank', 'width=420,height=600');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

export function getReceiptWhatsAppLink({ order, customer, lang, shopName = 'Karachi Tailors' }: PrintReceiptOptions): string {
  const isUrdu = lang === 'ur';
  const balance = order.totalAmount - order.advancePaid;
  const m = customer.measurements;

  const suitTypes: Record<string, string> = {
    full_suit: isUrdu ? 'فل سوٹ' : 'Full Suit',
    kameez: isUrdu ? 'قمیض' : 'Kameez',
    shalwar: isUrdu ? 'شلوار' : 'Shalwar',
  };

  const measurementLines = [
    { label: isUrdu ? 'لمبائی' : 'Length', value: m.kameezLength },
    { label: isUrdu ? 'سینہ' : 'Chest', value: m.chest },
    { label: isUrdu ? 'کندھا' : 'Shoulder', value: m.shoulder },
    { label: isUrdu ? 'آستین' : 'Sleeve', value: m.sleeve },
    { label: isUrdu ? 'کالر' : 'Collar', value: m.collar },
    { label: isUrdu ? 'دامن' : 'Daman', value: m.daman },
    { label: isUrdu ? 'شلوار' : 'Shalwar', value: m.shalwarLength },
    { label: isUrdu ? 'کمر' : 'Waist', value: m.waist },
    { label: isUrdu ? 'ہپ' : 'Hip', value: m.hip },
    { label: isUrdu ? 'پانچا' : 'Pancha', value: m.pancha },
  ].filter(r => r.value).map(r => `  ${r.label}: ${r.value}`).join('\n');

  const suitsText = order.suits.map((s, i) =>
    `  ${i + 1}. ${suitTypes[s.type] || s.type}${s.designWork ? (isUrdu ? ' (ڈیزائن)' : ' (Design)') : ''} - ${s.status}`
  ).join('\n');

  const lines = [
    `✂️ *${shopName}*`,
    isUrdu ? '📋 آرڈر رسید' : '📋 Order Receipt',
    '━━━━━━━━━━━━━━',
    `${isUrdu ? 'نام' : 'Name'}: *${customer.name}*`,
    `${isUrdu ? 'آئی ڈی' : 'ID'}: ${customer.customerId}`,
    `${isUrdu ? 'تاریخ' : 'Date'}: ${new Date(order.createdAt).toLocaleDateString()}`,
    `${isUrdu ? 'ڈیڈ لائن' : 'Deadline'}: ${new Date(order.deadline).toLocaleDateString()}`,
    '',
    `📐 *${isUrdu ? 'ناپ' : 'Measurements'}*`,
    measurementLines || (isUrdu ? '  ناپ درج نہیں' : '  Not recorded'),
    '',
    `👔 *${isUrdu ? 'سوٹ' : 'Suits'}*`,
    suitsText,
    '',
    `💰 *${isUrdu ? 'ادائیگی' : 'Payment'}*`,
    `  ${isUrdu ? 'کل' : 'Total'}: Rs ${order.totalAmount.toLocaleString()}`,
    `  ${isUrdu ? 'پیشگی' : 'Advance'}: Rs ${order.advancePaid.toLocaleString()}`,
    `  *${isUrdu ? 'بقایا' : 'Balance'}: Rs ${balance.toLocaleString()}*`,
    '━━━━━━━━━━━━━━',
    isUrdu ? 'شکریہ! اللہ حافظ 🤲' : 'Thank you! 🤲',
  ];

  return getWhatsAppLink(customer.phone, lines.join('\n'));
}
