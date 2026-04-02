/* ============================================================
   FreshLink — cart.js  (Launch Edition)
   All cart read/write operations live here.
   ============================================================ */
'use strict';

/* ── Get products from LS or shop defaults ── */
function getProducts() {
  try {
    const s = localStorage.getItem(LS_PRODUCTS);
    const p = s ? JSON.parse(s) : null;
    if (Array.isArray(p) && p.length) return p;
  } catch(e) {}
  /* Fall back to shop's own list if available, otherwise DEFAULT_PRODUCTS */
  return (typeof SHOP_PRODUCT_LIST !== 'undefined') ? SHOP_PRODUCT_LIST : DEFAULT_PRODUCTS;
}

/* ── Cart CRUD ── */
function getCart() {
  try { return JSON.parse(localStorage.getItem(LS_CART)) || []; }
  catch(e) { return []; }
}

function saveCart(cart) {
  localStorage.setItem(LS_CART, JSON.stringify(cart));
  updateAllBadges();
}

function addToCart(id, qty = 1) {
  const products = getProducts();
  const p = products.find(x => String(x.id) === String(id));
  if (!p) {
    console.error("Product not found:", id);
    return;
  }

  const cart = getCart();
  const ex = cart.find(x => String(x.id) === String(id));

  if (ex) ex.qty += qty;
  else cart.push({ id: String(id), qty });

  saveCart(cart);
  showToast(`${p.name} added to cart!`);
  animateBadge();
}

function removeFromCart(id) {
  const cart = getCart().filter(x => x.id !== id);
  saveCart(cart);
}

function setQty(id, qty) {
  const cart = getCart();
  const item = cart.find(x => x.id === id);
  if (!item) return;
  if (qty <= 0) { removeFromCart(id); return; }
  item.qty = qty;
  saveCart(cart);
}

function getCartTotal() {
  const products = getProducts();
  return getCart().reduce((sum, item) => {
    const p = products.find(x => String(x.id) === String(item.id));
    if (!p) return sum;

    const price = (p.discountPrice && p.discountPrice < p.price)
      ? p.discountPrice
      : p.price;

    return sum + price * item.qty;
  }, 0);
}
function getCartCount() {
  return getCart().reduce((s, i) => s + i.qty, 0);
}

/* ── Badge updates ── */
function updateAllBadges() {
  const n = getCartCount();
  document.querySelectorAll('#cartBadge, .cart-badge').forEach(el => {
    el.textContent = n;
  });
}

function animateBadge() {
  document.querySelectorAll('#cartBadge, .cart-badge').forEach(el => {
    el.classList.add('pop');
    setTimeout(() => el.classList.remove('pop'), 400);
  });
}

/* ── Toast ── */
let toastTimer;
function showToast(msg, dur = 2500) {
  const t = document.getElementById('toast');
  if (!t) return;
  clearTimeout(toastTimer);
  t.textContent = msg;
  t.classList.add('show');
  toastTimer = setTimeout(() => t.classList.remove('show'), dur);
}

/* ── Star rating helper ── */
function renderStars(r) {
  const full = Math.floor(r);
  const half = r % 1 >= 0.5;
  let s = '';
  for (let i = 0; i < full; i++) s += '★';
  if (half) s += '½';
  for (let i = full + (half?1:0); i < 5; i++) s += '☆';
  return s;
}

/* ── Orders ── */
function getOrders() {
  try { return JSON.parse(localStorage.getItem(LS_ORDERS)) || []; }
  catch(e) { return []; }
}

function saveOrder(order) {
  const orders = getOrders();
  orders.unshift(order);
  localStorage.setItem(LS_ORDERS, JSON.stringify(orders.slice(0, 200)));
}

/* ── Init on load ── */
document.addEventListener('DOMContentLoaded', updateAllBadges);
