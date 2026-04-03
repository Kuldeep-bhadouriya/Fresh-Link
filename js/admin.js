/* ============================================================
   FreshLink — admin.js  (Launch Edition)
   Dashboard, product CRUD, Google Sheets sync.
   ============================================================ */
'use strict';

/* ── State ── */
let adminProducts = [];
let loginTries    = 0;
let lockedUntil   = 0;
let editingId     = null;
let currentView   = 'dash';
let syncStatus    = 'idle'; // idle | syncing | ok | error

/* ── Auth ── */
async function sha256(msg) {
  const buf  = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(msg));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

async function doAdminLogin() {
  console.log('doAdminLogin called');
  const now = Date.now();
  if (now < lockedUntil) {
    showLoginErr(`Too many attempts. Try again in ${Math.ceil((lockedUntil-now)/60000)} min.`, 'limit');
    return;
  }
  const user = document.getElementById('adminUser').value.trim();
  const pass = document.getElementById('adminPass').value;
  console.log('user:', user, 'pass length:', pass.length);
  const hash = await sha256(pass);
  console.log('hash:', hash);
  console.log('ADMIN_USER:', ADMIN_USER, 'ADMIN_PASS_HASH:', ADMIN_PASS_HASH);

  if (user === ADMIN_USER && hash === ADMIN_PASS_HASH) {
    console.log('Login successful');
    loginTries = 0;
    document.getElementById('adminLogin').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'flex';
    await initAdmin();
  } else {
    console.log('Login failed');
    loginTries++;
    if (loginTries >= MAX_LOGIN_TRIES) {
      lockedUntil = Date.now() + LOCKOUT_MS;
      showLoginErr(`Too many attempts. Locked for 5 minutes.`, 'limit');
    } else {
      showLoginErr(`Invalid credentials. ${MAX_LOGIN_TRIES - loginTries} attempts left.`);
    }
  }
}

function showLoginErr(msg, type = 'err') {
  const err   = document.getElementById('loginErr');
  const limit = document.getElementById('loginLimit');
  if (type === 'limit') { if(limit){limit.textContent=msg;limit.classList.add('show');} }
  else { if(err){err.textContent=msg;err.classList.add('show');} }
}

function adminLogout() {
  document.getElementById('adminLogin').style.display = 'flex';
  document.getElementById('adminDashboard').style.display = 'none';
}

/* ── Init ── */
async function initAdmin() {
  adminProducts = getProducts();
  // Try pulling from Google Sheets
  if (typeof GSheet !== 'undefined' && GSheet.isConnected()) {
    await syncFromSheet();
  }
  showAdminView('dash');
  updateGSheetStatus();
}

/* ── Navigation ── */
function showAdminView(view) {
  currentView = view;
  document.querySelectorAll('.admin-nav-item').forEach(el => el.classList.remove('active'));
  const navEl = document.getElementById('nav_' + view);
  if (navEl) navEl.classList.add('active');

  const views = ['dash','products','settings'];
  views.forEach(v => {
    const el = document.getElementById('view_' + v);
    if (el) el.style.display = v === view ? 'block' : 'none';
  });

  if (view === 'dash')     renderDash();
  if (view === 'products') renderProducts();
  if (view === 'settings') renderSettings();
}

/* ── Dashboard ── */
function renderDash() {
  const total = adminProducts.length;
  const vegs  = adminProducts.filter(p => p.category === 'vegetables').length;
  const fruits= adminProducts.filter(p => p.category === 'fruits').length;
  const organic=adminProducts.filter(p => p.badge === 'organic').length;

  setEl('stat_products', total);
  setEl('stat_veg', vegs);
  setEl('stat_fruit', fruits);
  setEl('stat_organic', organic);

  // Recent products
  const grid = document.getElementById('recentProds');
  if (!grid) return;
  grid.innerHTML = adminProducts.slice(0,6).map(p => `
    <div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.05)">
      <img src="${escHtml(p.image)}" style="width:40px;height:40px;border-radius:8px;object-fit:cover;background:#1a3020" onerror="this.src=''" />
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:600;color:#e2ead0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(p.name)}</div>
        <div style="font-size:11px;color:rgba(255,255,255,.35)">${p.category} · ${p.unit}</div>
      </div>
      <div style="font-size:14px;font-weight:700;color:#6bbf5c">₹${p.price}</div>
      <button class="abtn abtn-ghost abtn-sm" onclick="openEdit('${p.id}')">Edit</button>
    </div>`).join('');
}

/* ── Products Table ── */
function renderProducts(filter = '') {
  const tbody = document.getElementById('prodTableBody');
  if (!tbody) return;
  const list = filter
    ? adminProducts.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()) || p.category.includes(filter))
    : adminProducts;

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:rgba(255,255,255,.25)">No products found</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(p => `
    <tr>
      <td><img src="${escHtml(p.image)}" class="prod-thumb" onerror="this.style.opacity='.3'" /></td>
      <td>
        <div style="font-weight:600;color:#e2ead0">${escHtml(p.name)}</div>
        <div style="font-size:11px;color:rgba(255,255,255,.3);margin-top:2px">${escHtml(p.farm)}</div>
      </td>
      <td><span style="text-transform:capitalize;color:rgba(255,255,255,.5)">${p.category}</span></td>
      <td style="font-weight:700;color:#6bbf5c">₹${p.price}<span style="font-weight:400;font-size:11px;color:rgba(255,255,255,.3)">/${p.unit}</span></td>
      <td>${p.badge ? `<span class="badge-pill badge-${p.badge}">${p.badge}</span>` : '<span class="badge-pill badge-none">—</span>'}</td>
      <td style="font-size:13px">⭐ ${p.rating} <span style="color:rgba(255,255,255,.3)">(${p.reviews})</span></td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="abtn abtn-ghost abtn-sm" onclick="openEdit('${p.id}')">✏️ Edit</button>
          <button class="abtn abtn-danger abtn-sm" onclick="deleteProduct('${p.id}')">🗑</button>
        </div>
      </td>
    </tr>`).join('');
}

/* ── Add / Edit Product ── */
function openAddProduct() {
  editingId = null;
  document.getElementById('modalTitle').textContent = '➕ Add Product';
  clearProductForm();
  openModal('productModal');
}

function openEdit(id) {
  const p = adminProducts.find(x => x.id === id);
  if (!p) return;
  editingId = id;
  document.getElementById('modalTitle').textContent = '✏️ Edit Product';
  fillProductForm(p);
  openModal('productModal');
}

function fillProductForm(p) {
  setVal('pId',   p.id);
  setVal('pName', p.name);
  setVal('pEmoji',p.emoji || '');
  setVal('pCategory', p.category);
  setVal('pPrice', p.price);
  setVal('pDiscountPrice', p.discountPrice || '');
  setVal('pUnit', p.unit);
  setVal('pFarm', p.farm);
  setVal('pBadge', p.badge || '');
  setVal('pRating', p.rating);
  setVal('pReviews', p.reviews);
  setVal('pDesc', p.desc);
  setVal('pImage', p.image);
  updateImagePreview(p.image);
}

function clearProductForm() {
  ['pId','pName','pEmoji','pCategory','pPrice','pDiscountPrice','pUnit','pFarm','pBadge','pRating','pReviews','pDesc','pImage'].forEach(id => setVal(id,''));
  setVal('pCategory','vegetables');
  setVal('pUnit','kg');
  updateImagePreview('');
}

function updateImagePreview(url) {
  const img = document.getElementById('imgPreview');
  if (!img) return;
  if (url) { img.src = url; img.style.display = 'block'; }
  else img.style.display = 'none';
}

async function saveProduct() {
  const name = getVal('pName').trim();
  const price = parseFloat(getVal('pPrice'));
  if (!name) { adminToast('Product name is required'); return; }
  if (isNaN(price) || price <= 0) { adminToast('Valid price is required'); return; }

  const discPrice = parseFloat(getVal('pDiscountPrice'));
  const product = {
    id:            editingId || ('p_' + Date.now()),
    name,
    emoji:         getVal('pEmoji') || '🥬',
    category:      getVal('pCategory') || 'vegetables',
    price,
    discountPrice: (!isNaN(discPrice) && discPrice > 0 && discPrice < price) ? discPrice : undefined,
    unit:          getVal('pUnit') || 'kg',
    farm:          getVal('pFarm') || 'Local Farm',
    badge:         getVal('pBadge') || null,
    rating:        parseFloat(getVal('pRating')) || 4.5,
    reviews:       parseInt(getVal('pReviews')) || 0,
    desc:          getVal('pDesc') || '',
    image:         getVal('pImage') || ''
  };

  if (editingId) {
    const idx = adminProducts.findIndex(x => x.id === editingId);
    if (idx >= 0) adminProducts[idx] = product;
  } else {
    adminProducts.push(product);
  }

  saveProductsLocal();
  closeModal('productModal');
  renderDash();
  renderProducts();
  adminToast(editingId ? '✅ Product updated!' : '✅ Product added!');

  // Push to Google Sheets
  if (typeof GSheet !== 'undefined' && GSheet.isConnected()) {
    await syncToSheet();
  }
}

function deleteProduct(id) {
  const p = adminProducts.find(x => x.id === id);
  if (!p) return;
  if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
  adminProducts = adminProducts.filter(x => x.id !== id);
  saveProductsLocal();
  renderDash();
  renderProducts();
  adminToast('🗑 Product deleted');
  if (typeof GSheet !== 'undefined' && GSheet.isConnected()) syncToSheet();
}

/* ── Google Sheets Sync ── */
async function syncFromSheet() {
  setSyncStatus('syncing');
  try {
    const res = await GSheet.pull();
    if (res) {
      adminProducts = res;
      saveProductsLocal();
      setSyncStatus('ok');
      adminToast('✅ Synced from Google Sheets');
      if (currentView === 'products') renderProducts();
      if (currentView === 'dash') renderDash();
    } else { setSyncStatus('error'); }
  } catch(e) { setSyncStatus('error'); }
}

async function syncToSheet() {
  setSyncStatus('syncing');
  try {
    const ok = await GSheet.push(adminProducts);
    setSyncStatus(ok ? 'ok' : 'error');
    if (ok) adminToast('☁️ Saved to Google Sheets');
    else adminToast('⚠️ Sheet sync failed — saved locally');
  } catch(e) { setSyncStatus('error'); }
}

function setSyncStatus(status) {
  syncStatus = status;
  updateGSheetStatus();
}

function updateGSheetStatus() {
  const dot  = document.getElementById('gsheetDot');
  const text = document.getElementById('gsheetText');
  if (!dot || !text) return;

  const connected = typeof GSheet !== 'undefined' && GSheet.isConnected();
  if (!connected) {
    dot.className  = 'gsheet-dot disconnected';
    text.textContent = 'Not connected — localStorage only';
    return;
  }
  const map = {
    idle:    ['connected','Connected to Google Sheets'],
    syncing: ['syncing','Syncing…'],
    ok:      ['connected','Synced ✓'],
    error:   ['disconnected','Sync error — check URL']
  };
  const [cls, label] = map[syncStatus] || map.idle;
  dot.className    = 'gsheet-dot ' + cls;
  text.textContent = label;
}

/* ── Settings view ── */
function renderSettings() {
  const urlEl = document.getElementById('settingGsheetUrl');
  if (urlEl) urlEl.value = GSHEET_URL || '';
}

function saveSettings() {
  const url = getVal('settingGsheetUrl').trim();
  // In a real deployment, GSHEET_URL would be in config.js.
  // Here we store it in localStorage so admin can set it without editing files.
  localStorage.setItem('fl_gsheet_url', url);
  // Monkey-patch the global
  window.GSHEET_URL = url;
  updateGSheetStatus();
  adminToast('✅ Settings saved! Reload to apply Sheet URL.');
}

/* ── Helpers ── */
function saveProductsLocal() { localStorage.setItem(LS_PRODUCTS, JSON.stringify(adminProducts)); }
function setEl(id, val) { const el = document.getElementById(id); if(el) el.textContent = val; }
function getVal(id) { const el = document.getElementById(id); return el ? el.value : ''; }
function setVal(id, val) { const el = document.getElementById(id); if(el) el.value = val ?? ''; }
function openModal(id) { const el = document.getElementById(id); if(el) el.classList.add('show'); }
function closeModal(id) { const el = document.getElementById(id); if(el) el.classList.remove('show'); }
let adminToastTimer;
function adminToast(msg) {
  const t = document.getElementById('adminToast');
  if (!t) return;
  clearTimeout(adminToastTimer);
  t.textContent = msg; t.style.opacity = '1'; t.style.transform = 'translateY(0)';
  adminToastTimer = setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(10px)'; }, 3000);
}

/* ── On load ── */
document.addEventListener('DOMContentLoaded', () => {
  if (typeof lucide !== 'undefined') lucide.createIcons();
  // Load GSHEET_URL from localStorage if set by admin previously
  const savedUrl = localStorage.getItem('fl_gsheet_url');
  if (savedUrl) window.GSHEET_URL = savedUrl;

  document.getElementById('adminPass').addEventListener('keydown', e => {
    if (e.key === 'Enter') doAdminLogin();
  });
});
