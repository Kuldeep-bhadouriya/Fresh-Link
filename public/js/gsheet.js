/* ============================================================
   FreshLink — gsheet.js
   Google Apps Script sync for products catalogue.
   Reads/writes to a Google Sheet as the "database".
   ============================================================ */
'use strict';

/* ──────────────────────────────────────────────────────────
   GOOGLE APPS SCRIPT CODE (paste this in your Sheet)
   Extensions → Apps Script → paste below → Deploy → Web App

function doGet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName('Products') || ss.getSheets()[0];
  const rows = sh.getDataRange().getValues();
  const headers = rows[0];
  const products = rows.slice(1).map(r => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = r[i]);
    obj.price = Number(obj.price) || 0;
    if (obj.discountPrice) obj.discountPrice = Number(obj.discountPrice);
    if (obj.rating) obj.rating = Number(obj.rating);
    if (obj.reviews) obj.reviews = Number(obj.reviews);
    return obj;
  }).filter(p => p.id);
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, products }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const data   = JSON.parse(e.postData.contents);
  const ss     = SpreadsheetApp.getActiveSpreadsheet();
  const sh     = ss.getSheetByName('Products') || ss.getSheets()[0];
  const headers= sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  sh.clearContents();
  sh.appendRow(headers);
  data.products.forEach(p => sh.appendRow(headers.map(h => p[h] ?? '')));
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
   ────────────────────────────────────────────────────────── */

const GSheet = {

  /* Pull products from Google Sheet */
  async pull() {
    if (!GSHEET_URL) return null;
    try {
      const res  = await fetch(GSHEET_URL + '?action=get', { method:'GET' });
      const json = await res.json();
      if (json.ok && Array.isArray(json.products) && json.products.length) {
        localStorage.setItem(LS_PRODUCTS, JSON.stringify(json.products));
        return json.products;
      }
    } catch(e) { console.warn('GSheet pull failed:', e.message); }
    return null;
  },

  /* Push products to Google Sheet */
  async push(products) {
    if (!GSHEET_URL) return false;
    try {
      const res  = await fetch(GSHEET_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products })
      });
      const json = await res.json();
      return json.ok;
    } catch(e) { console.warn('GSheet push failed:', e.message); return false; }
  },

  /* Load products: GSheet first, fallback to localStorage, then defaults */
  async loadProducts() {
    const fromSheet = await this.pull();
    if (fromSheet) return fromSheet;
    return getProducts(); // falls back to LS → DEFAULT_PRODUCTS
  },

  isConnected() { return !!GSHEET_URL; }
};
