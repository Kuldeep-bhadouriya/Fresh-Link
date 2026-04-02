/* ============================================================
   FreshLink — shop.js (Updated with Images)
   ============================================================ */
'use strict';

let allProducts = [];
let filteredProducts = [];
let currentFilter = 'all';
let currentSort = '';
let displayedCount = 0;
const PAGE_SIZE = 12;
let isLoading = false;

document.addEventListener('DOMContentLoaded', () => {
  allProducts = SHOP_PRODUCT_LIST;
  applyFilterSort();
  setupInfiniteScroll();
});

/* ================= FILTER & SORT ================= */

function setFilter(cat, el) {
  currentFilter = cat;
  document.querySelectorAll('.pill').forEach(p => p.classList.remove('on'));
  if (el) el.classList.add('on');
  displayedCount = 0;
  applyFilterSort();
}

function doSort(val) {
  currentSort = val;
  displayedCount = 0;

  let filtered = currentFilter === 'all'
    ? [...SHOP_PRODUCT_LIST]
    : SHOP_PRODUCT_LIST.filter(p => p.category === currentFilter);

  if (val === 'pa') filtered.sort((a,b) => a.price - b.price);
  else if (val === 'pd') filtered.sort((a,b) => b.price - a.price);
  else if (val === 'rating') filtered.sort((a,b) => (b.rating||0) - (a.rating||0));

  filteredProducts = filtered;

  const countEl = document.getElementById('prodCount');
  if (countEl) countEl.textContent = filteredProducts.length + ' product' + (filteredProducts.length !== 1 ? 's' : '');

  const grid = document.getElementById('prodGrid');
  if (grid) {
    grid.innerHTML = '';
    displayedCount = 0;
    loadMoreProducts();
  }
}

function applyFilterSort() {
  filteredProducts = currentFilter === 'all'
    ? [...allProducts]
    : allProducts.filter(p => p.category === currentFilter);

  if (currentSort === 'pa') filteredProducts.sort((a,b) => a.price - b.price);
  else if (currentSort === 'pd') filteredProducts.sort((a,b) => b.price - a.price);

  const countEl = document.getElementById('prodCount');
  if (countEl) countEl.textContent = `${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''}`;

  const grid = document.getElementById('prodGrid') || document.getElementById('featuredGrid');
  if (grid) {
    grid.innerHTML = '';
    displayedCount = 0;
    loadMoreProducts();
  }
}

/* ================= LOAD PRODUCTS ================= */

function loadMoreProducts() {
  const grid = document.getElementById('prodGrid') || document.getElementById('featuredGrid');
  if (!grid || isLoading) return;

  const isFeatured = !!document.getElementById('featuredGrid');
  const limit = isFeatured ? 8 : PAGE_SIZE;

  isLoading = true;

  const slice = filteredProducts.slice(displayedCount, displayedCount + limit);

  slice.forEach(p => {
    const card = buildProductCard(p);
    grid.insertAdjacentHTML('beforeend', card);
  });

  displayedCount += slice.length;

  if (typeof lucide !== "undefined") lucide.createIcons();
  updateAllBadges();

  const sentinel = document.getElementById('sentinel');
  if (sentinel) {
    sentinel.style.display = displayedCount >= filteredProducts.length ? 'none' : 'block';
  }

  isLoading = false;
}

/* ================= PRODUCT CARD ================= */

function buildProductCard(p) {
  const cart = getCart();
  const cartItem = cart.find(x => x.id === p.id);

  const price = (p.discountPrice && p.discountPrice < p.price) ? p.discountPrice : p.price;
  const hasDiscount = p.discountPrice && p.discountPrice < p.price;

  const badgeHtml = p.badge
    ? `<span class="prod-badge badge-${p.badge}">${p.badge}</span>`
    : '';

  const priceHtml = hasDiscount
    ? `<span class="old-price">${fmt(p.price)}</span>${fmt(price)}<span>/${p.unit}</span>`
    : `${fmt(price)}<span>/${p.unit}</span>`;

  const addCtrlHtml = cartItem
    ? `<div class="qty-ctrl" id="qtyCtrl_${p.id}">
        <button class="qty-btn" onclick="changeQty('${p.id}',-1)">−</button>
        <span class="qty-num" id="qtyNum_${p.id}">${cartItem.qty}</span>
        <button class="qty-btn" onclick="changeQty('${p.id}',1)">+</button>
      </div>`
    : `<button class="add-btn" id="addBtn_${p.id}" onclick="handleAdd('${p.id}')">+</button>`;

  return `
    <article class="prod-card reveal">
      <div class="prod-card-img-wrap">
        <img src="${p.image}" alt="${p.name}" loading="lazy"
             onerror="this.src='../assets/images/default.jpg'" />
        ${badgeHtml}
      </div>

      <div class="prod-card-body">
        <div class="prod-card-farm">${p.farm}</div>
        <div class="prod-card-name">${p.name}</div>
        <div class="prod-card-desc">${p.desc}</div>

        <div class="prod-card-rating">
          <span class="stars">${renderStars(p.rating)}</span>
          <span>${p.rating}</span>
          <span>(${p.reviews})</span>
        </div>

        <div class="prod-card-footer">
          <div class="prod-price">${priceHtml}</div>
          <div id="ctrl_${p.id}">${addCtrlHtml}</div>
        </div>
      </div>
    </article>`;
}

/* ================= CART ================= */

function handleAdd(id) {
  addToCart(id, 1);

  const ctrl = document.getElementById('ctrl_' + id);
  if (!ctrl) return;

  ctrl.innerHTML = `
    <div class="qty-ctrl">
      <button onclick="changeQty('${id}',-1)">−</button>
      <span id="qtyNum_${id}">1</span>
      <button onclick="changeQty('${id}',1)">+</button>
    </div>`;
}

function changeQty(id, delta) {
  const cart = getCart();
  const item = cart.find(x => x.id === id);
  if (!item) return;

  const newQty = item.qty + delta;

  if (newQty <= 0) {
    removeFromCart(id);
    document.getElementById('ctrl_' + id).innerHTML =
      `<button onclick="handleAdd('${id}')">+</button>`;
    return;
  }

  setQty(id, newQty);
  document.getElementById('qtyNum_' + id).textContent = newQty;
}

/* ================= SCROLL ================= */

function setupInfiniteScroll() {
  const sentinel = document.getElementById('sentinel');
  if (!sentinel) return;

  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && displayedCount < filteredProducts.length) {
      loadMoreProducts();
    }
  }, { rootMargin: '200px' });

  obs.observe(sentinel);
}

/* ================= PRODUCTS DATA ================= */

/* These are the shop's own products. We save them into localStorage
   under LS_PRODUCTS so that cart.js / cart.html can find them by the
   same IDs when rendering the cart and order summary. */
const SHOP_PRODUCT_LIST = [
  {
    id: "tomato",
    name: "Desi Tomatoes",
    image: "../assets/images/tomato.jpg",
    farm: "local Farms",
    desc: "Fresh juicy tomatoes.",
    price: 45,
    unit: "kg",
    rating: 4.8,
    reviews: 214,
    category: "vegetable",
    badge: "organic"
  },
  {
    id: "spinach",
    name: "Fresh Spinach",
    image: "../assets/images/spinach.jpg",
    farm: "local Farms",
    desc: "Fresh green spinach.",
    price: 25,
    unit: "bunch",
    rating: 4.7,
    reviews: 180,
    category: "vegetable",
    badge: "organic"
  },
  {
    id: "carrot",
    name: "Organic Carrots",
    image: "../assets/images/carrot.jpg",
    farm: "local Farms",
    desc: "Crunchy organic carrots.",
    price: 30,
    unit: "kg",
    rating: 4.6,
    reviews: 162,
    category: "vegetable",
    badge: "organic"
  },
  {
    id: "brinjal",
    name: "Brinjal",
    image: "../assets/images/brinjal.jpg",
    farm: "local Farms",
    desc: "Fresh brinjals.",
    price: 35,
    unit: "kg",
    rating: 4.5,
    reviews: 98,
    category: "vegetable"
  },
  {
    id: "potato",
    name: "Potato",
    image: "../assets/images/potato.jpg",
    farm: "local Farms",
    desc: "Farm potatoes.",
    price: 20,
    unit: "kg",
    rating: 4.5,
    reviews: 120,
    category: "vegetable"
  }
];

/* Seed localStorage so cart.js getProducts() returns the correct list */
(function seedProducts() {
  try {
    const stored = localStorage.getItem(LS_PRODUCTS);
    const parsed = stored ? JSON.parse(stored) : null;
    /* Only overwrite if nothing is stored, or if the stored list still
       uses the old DEFAULT_PRODUCTS IDs (p1, p2 …) instead of ours */
    const hasOldIds = parsed && parsed.length && /^p\d+$/.test(parsed[0].id);
    if (!parsed || !parsed.length || hasOldIds) {
      localStorage.setItem(LS_PRODUCTS, JSON.stringify(SHOP_PRODUCT_LIST));
    }
  } catch(e) {
    localStorage.setItem(LS_PRODUCTS, JSON.stringify(SHOP_PRODUCT_LIST));
  }
}());