/* ============================================================
   FreshLink — checkout.js  (Launch Edition)
   No-backend: WhatsApp-only order flow.
   ============================================================ */
'use strict';

let selectedPayment = 'COD';

document.addEventListener('DOMContentLoaded', () => {
  renderOrderSummary();
  selectPayment('COD');
});

function renderOrderSummary() {
  const products = getProducts();
  const cart = getCart();
  const container = document.getElementById('orderItems');
  const subtotalEl = document.getElementById('orderSubtotal');
  const deliveryEl = document.getElementById('orderDelivery');
  const totalEl   = document.getElementById('orderTotal');

  if (!cart.length) {
    if (container) container.innerHTML = '<p style="color:var(--mist);font-size:14px;padding:12px 0">Your cart is empty.</p>';
    return;
  }

  let sub = 0;
  const rows = cart.map(item => {
    const p = products.find(x => x.id === item.id);
    if (!p) return '';
    const price = (p.discountPrice && p.discountPrice < p.price) ? p.discountPrice : p.price;
    sub += price * item.qty;
    return `<div class="order-item-row">
      <img class="order-item-img" src="${escHtml(p.image)}" alt="${escHtml(p.name)}" loading="lazy" onerror="this.style.display='none'" />
      <span class="order-item-name">${escHtml(p.name)} × ${item.qty}</span>
      <span class="order-item-price">${fmt(price * item.qty)}</span>
    </div>`;
  }).join('');

  const delivery = sub >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_CHARGE;
  const total = sub + delivery;

  if (container)   container.innerHTML = rows;
  if (subtotalEl)  subtotalEl.textContent = fmt(sub);
  if (deliveryEl)  deliveryEl.textContent = delivery === 0 ? 'FREE 🎉' : fmt(delivery);
  if (totalEl)     totalEl.textContent    = fmt(total);
}

function selectPayment(method) {
  selectedPayment = method;
  document.querySelectorAll('.pay-opt').forEach(el => el.classList.remove('selected'));
  const opt = document.getElementById('opt' + method);
  if (opt) opt.classList.add('selected');
  document.querySelectorAll('.pay-opt .pay-opt-radio').forEach(r => r.style.background = '');
  if (opt) { const r = opt.querySelector('.pay-opt-radio'); if (r) r.style.background = 'var(--leaf)'; }
}

function placeOrder() {
  const fname   = document.getElementById('fname')?.value.trim();
  const lname   = document.getElementById('lname')?.value.trim() || '';
  const phone   = document.getElementById('phone')?.value.trim();
  const address = document.getElementById('address')?.value.trim();
  const city    = document.getElementById('city')?.value.trim();
  const pin     = document.getElementById('pin')?.value.trim();

  if (!fname)                       { flashField('fname',   'First name is required');          return; }
  if (!phone || phone.length < 10)  { flashField('phone',   'Valid 10-digit phone required');    return; }
  if (!address)                     { flashField('address', 'Delivery address is required');     return; }
  if (!city)                        { flashField('city',    'City is required');                 return; }
  if (!pin || pin.length < 6)       { flashField('pin',     'Valid 6-digit PIN required');       return; }

  const cart = getCart();
  if (!cart.length) { showToast('Your cart is empty!'); return; }

  const products = getProducts();
  let sub = 0;
  const items = cart.map(item => {
    const p = products.find(x => x.id === item.id);
    if (!p) return null;
    const price = (p.discountPrice && p.discountPrice < p.price) ? p.discountPrice : p.price;
    sub += price * item.qty;
    return { id: p.id, name: p.name, emoji: p.emoji || '', price, qty: item.qty, unit: p.unit };
  }).filter(Boolean);

  const delivery = sub >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_CHARGE;
  const total    = sub + delivery;
  const orderId  = genOrderId();

  // Build WhatsApp message
  const itemLines = items.map(i =>
    `  ${i.emoji} *${i.name}* × ${i.qty} ${i.unit} = ${fmt(i.price * i.qty)}`
  ).join('\n');

  const payLabel = selectedPayment === 'COD' ? '💵 Cash on Delivery' : '📲 UPI';

  const msg =
`🌿 *New FreshLink Order*
━━━━━━━━━━━━━━━━━━
🆔 Order: *${orderId}*

👤 *Customer Details*
Name: ${fname} ${lname}
📞 Phone: ${phone}
📍 Address: ${address}
🏙️ City: ${city} — ${pin}

🛒 *Items Ordered*
${itemLines}

━━━━━━━━━━━━━━━━━━
💰 Subtotal: ${fmt(sub)}
🚚 Delivery: ${delivery === 0 ? 'FREE' : fmt(delivery)}
✅ *Total: ${fmt(total)}*
💳 Payment: ${payLabel}
━━━━━━━━━━━━━━━━━━
_Placed via freshlink.in_`;

  localStorage.removeItem(LS_CART);
  updateAllBadges();

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  showToast('Redirecting to WhatsApp… 🚀');
  setTimeout(() => {
    window.open(url, '_blank', 'noopener,noreferrer');
    window.location.href = 'index.html';
  }, 900);
}

function flashField(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('error');
  el.focus();
  showToast('⚠️ ' + msg);
  setTimeout(() => el.classList.remove('error'), 2800);
}
