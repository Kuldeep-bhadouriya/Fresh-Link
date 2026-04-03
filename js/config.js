/* ============================================================
   FreshLink — config.js  (Launch Edition)
   ============================================================ */
'use strict';

const STORE_NAME      = 'FreshLink';
const MP_CITIES       = ['Bhopal','Indore','Jabalpur','Gwalior','Ujjain','Sagar','Rewa','Satna','Dewas','Ratlam'];
const WHATSAPP_NUMBER = '919424740903';
const UPI_ID          = 'yourbusiness@okicici';
const UPI_NAME        = 'FreshLink Store';

/* Admin */
const ADMIN_USER      = 'freshlink';
const ADMIN_PASS_HASH = 'a0882111c05e913ee928b9352340afce1ef45839a587e08485df2540d3197207';
const MAX_LOGIN_TRIES = 5;
const LOCKOUT_MS      = 5 * 60 * 1000;

/* ── Google Sheets sync ── */
/* HOW TO CONNECT:
   1. Open Google Sheets → Extensions → Apps Script
   2. Paste the doGet / doPost handler (see admin panel for instructions)
   3. Deploy → Web App → "Anyone" access
   4. Paste your Web App URL below
*/
const GSHEET_URL = ''; // e.g. 'https://script.google.com/macros/s/AKfy.../exec'

/* Storage keys */
const LS_PRODUCTS = 'fl_products_v3';
const LS_CART     = 'fl_cart_v1';
const LS_ORDERS   = 'fl_orders_v1';

/* Delivery */
const FREE_DELIVERY_ABOVE = 299;
const DELIVERY_CHARGE     = 29;
const DELIVERY_HOURS      = 48;

/* ── Helpers ── */
function fmt(n)   { return '₹' + Number(n).toLocaleString('en-IN'); }
function escHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function genOrderId(){ return 'FL' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2,5).toUpperCase(); }

/* ── Default catalogue ── */
const DEFAULT_PRODUCTS = [
  { id:'p1',  name:'Desi Tomatoes',       emoji:'🍅', category:'vegetables', price:45,  unit:'kg',    farm:'Ramesh Farms, Nashik',       badge:'organic', rating:4.8, reviews:214, desc:'Vine-ripened desi tomatoes, naturally sweet and tangy. Perfect for curries.',      image:'https://images.unsplash.com/photo-1518977672816-cce934cb48e4?auto=format&fm=webp&fit=crop&w=400&q=75' },
  { id:'p2',  name:'Fresh Spinach',        emoji:'🥬', category:'vegetables', price:25,  unit:'bunch', farm:'GreenLeaf Farms, Pune',       badge:'organic', rating:4.7, reviews:180, desc:'Tender baby spinach, hand-picked at peak freshness.',                               image:'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fm=webp&fit=crop&w=400&q=75' },
  { id:'p3',  name:'Organic Carrots',      emoji:'🥕', category:'vegetables', price:30,  unit:'kg',    farm:'SoilPure Farms, Ooty',        badge:'organic', rating:4.6, reviews:162, desc:'Crunchy and sweet organic carrots, pesticide-free.',                                 image:'https://images.unsplash.com/photo-1447175008436-054170c2e979?auto=format&fm=webp&fit=crop&w=400&q=75' },
  { id:'p4',  name:'Brinjal (Baingan)',    emoji:'🍆', category:'vegetables', price:35,  unit:'kg',    farm:'Krishna Farms, Nagpur',       badge:null,      rating:4.5, reviews:98,  desc:'Plump, glossy brinjals ideal for bhartha and curries.',                              image:'https://images.unsplash.com/photo-1582281298055-e25b84a30b0b?auto=format&fm=webp&fit=crop&w=400&q=75' },
  { id:'p5',  name:'Fresh Capsicum',       emoji:'🫑', category:'vegetables', price:60,  unit:'kg',    farm:'ColorBurst Farms, Nashik',    badge:'new',     rating:4.4, reviews:74,  desc:'Crisp green capsicum with a mild, slightly sweet flavour.',                          image:'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fm=webp&fit=crop&w=400&q=75' },
  { id:'p6',  name:'Cauliflower',          emoji:'🥦', category:'vegetables', price:40,  unit:'piece', farm:'WhiteField Farms, UP',        badge:null,      rating:4.3, reviews:88,  desc:'Firm, white cauliflower heads, freshly harvested.',                                   image:'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?auto=format&fm=webp&fit=crop&w=400&q=75' },
  { id:'p7',  name:'Baby Potatoes',        emoji:'🥔', category:'vegetables', price:28,  unit:'kg',    farm:'HillTop Farms, Himachal',     badge:null,      rating:4.6, reviews:201, desc:'Small, creamy baby potatoes. Great for roasting or dum aloo.',                       image:'https://images.unsplash.com/photo-1590165482129-1b8b27698780?auto=format&fm=webp&fit=crop&w=400&q=75' },
  { id:'p8',  name:'Curry Leaves',         emoji:'🌿', category:'vegetables', price:15,  unit:'bunch', farm:'HerbGarden, Kerala',          badge:'organic', rating:4.9, reviews:310, desc:'Aromatic curry leaves picked fresh every morning.',                                   image:'https://images.unsplash.com/photo-1611241007898-7cc5f09d0cf5?auto=format&fm=webp&fit=crop&w=400&q=75' },
  { id:'v9',  name:'Red Onion',            emoji:'🧅', category:'vegetables', price:32,  unit:'kg',    farm:'Lasalgaon Mandi, Nashik',     badge:null,      rating:4.7, reviews:289, desc:'Pungent, firm red onions — essential for every Indian kitchen.',                     image:'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fm=webp&fit=crop&w=400&q=75' },
  { id:'v10', name:'Aloo (Potato)',         emoji:'🥔', category:'vegetables', price:22,  unit:'kg',    farm:'HillTop Farms, Agra',         badge:null,      rating:4.8, reviews:412, desc:'Smooth-skinned, starchy potatoes. Ideal for sabzi, fry, or biryani.',                image:'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?auto=format&fm=webp&fit=crop&w=400&q=75' },
  { id:'v11', name:'Green Peas',            emoji:'🫛', category:'vegetables', price:55,  unit:'kg',    farm:'FrostField, Punjab',          badge:'organic', rating:4.6, reviews:134, desc:'Plump, sweet green peas — perfect for pulao and matar paneer.',                      image:'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?auto=format&fm=webp&fit=crop&w=400&q=75' },
  { id:'v12', name:'Bitter Gourd (Karela)', emoji:'🥒', category:'vegetables', price:38,  unit:'kg',    farm:'Vinayak Farms, MP',           badge:null,      rating:4.2, reviews:76,  desc:'Farm-fresh karela, packed with nutrients and natural bitterness.',                    image:'https://images.unsplash.com/photo-1635236066823-62e06b67aafc?auto=format&fm=webp&fit=crop&w=400&q=75' },
  { id:'v13', name:'Drumstick (Sahjan)',    emoji:'🌿', category:'vegetables', price:42,  unit:'bunch', farm:'SouthGrow, Tamil Nadu',       badge:'organic', rating:4.5, reviews:91,  desc:'Tender drumsticks rich in iron — great for sambar and curries.',                      image:'https://images.unsplash.com/photo-1598030344100-3bde793c2c1f?auto=format&fm=webp&fit=crop&w=400&q=75' },
  { id:'v15', name:'Lady Finger (Bhindi)',  emoji:'🌱', category:'vegetables', price:48,  unit:'kg',    farm:'SunKissed Farms, Rajasthan',  badge:null,      rating:4.7, reviews:183, desc:'Tender young bhindi, crisp and fibre-rich. Perfect for stir fry.',                    image:'https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fm=webp&fit=crop&w=400&q=75' },
  { id:'v16', name:'Bottle Gourd (Lauki)',  emoji:'🥦', category:'vegetables', price:18,  unit:'kg',    farm:'Gangetic Plains, UP',         badge:null,      rating:4.4, reviews:102, desc:'Mild, hydrating lauki — great for kofta, halwa, and dal.',                            image:'https://images.unsplash.com/photo-1567306301408-9b74779a11af?auto=format&fm=webp&fit=crop&w=400&q=75' },
  { id:'v17', name:'Methi (Fenugreek)',     emoji:'🌿', category:'vegetables', price:20,  unit:'bunch', farm:'HerbGarden, Rajasthan',       badge:'organic', rating:4.6, reviews:147, desc:'Aromatic fenugreek leaves — adds depth to parathas and dals.',                        image:'https://images.unsplash.com/photo-1615485020942-9e4e3b80b8b6?auto=format&fm=webp&fit=crop&w=400&q=75' },
  { id:'v19', name:'Corn (Bhutta)',         emoji:'🌽', category:'vegetables', price:15,  unit:'piece', farm:'Cornfield Farms, MP',         badge:'new',     rating:4.8, reviews:219, desc:'Golden sweet corn, perfect for roasting and chaats.',                                  image:'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fm=webp&fit=crop&w=400&q=75' },
  { id:'v20', name:'Radish (Mooli)',        emoji:'🌶', category:'vegetables', price:18,  unit:'bunch', farm:'WinterHarvest, Himachal',     badge:null,      rating:4.4, reviews:62,  desc:'Crunchy white radish — great raw in salads or stuffed parathas.',                     image:'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fm=webp&fit=crop&w=400&q=75' },
  { id:'p9',  name:'Alphonso Mangoes',      emoji:'🥭', category:'fruits',     price:350, unit:'dozen', farm:'Hapus Heaven, Ratnagiri',     badge:'organic', rating:4.9, reviews:445, desc:'The king of mangoes — GI-tagged Alphonso from Ratnagiri.',                            image:'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fm=webp&fit=crop&w=400&q=75' },
  { id:'p10', name:'Nashik Grapes',         emoji:'🍇', category:'fruits',     price:80,  unit:'kg',    farm:'VineHouse, Nashik',           badge:null,      rating:4.7, reviews:192, desc:'Seedless grapes bursting with natural sweetness.',                                    image:'https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fm=webp&fit=crop&w=400&q=75' },
  { id:'p11', name:'Kashmiri Apples',       emoji:'🍎', category:'fruits',     price:160, unit:'kg',    farm:'Valley Fresh, Srinagar',      badge:'new',     rating:4.8, reviews:276, desc:'Crisp and juicy apples from the valleys of Kashmir.',                                 image:'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fm=webp&fit=crop&w=400&q=75' },
  { id:'p12', name:'Bananas',               emoji:'🍌', category:'fruits',     price:40,  unit:'dozen', farm:'SunBunch Farms, Jalgaon',     badge:null,      rating:4.5, reviews:320, desc:'Ripe, naturally sweet Robusta bananas, energy-packed.',                               image:'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fm=webp&fit=crop&w=400&q=75' },
  { id:'p13', name:'Strawberries',          emoji:'🍓', category:'fruits',     price:120, unit:'250g',  farm:'BerryPatch, Mahabaleshwar',   badge:'sale',    rating:4.8, reviews:188, desc:'Freshly picked strawberries from misty Mahabaleshwar farms.',                         image:'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fm=webp&fit=crop&w=400&q=75' },
  { id:'p14', name:'Pomegranate',           emoji:'🍑', category:'fruits',     price:90,  unit:'kg',    farm:'RubyFarms, Solapur',          badge:'organic', rating:4.6, reviews:144, desc:'Juicy, deep-red pomegranates, naturally sweet and antioxidant-rich.',                 image:'https://images.unsplash.com/photo-1541344999736-83bbe40a8f4b?auto=format&fm=webp&fit=crop&w=400&q=75' },
  { id:'p15', name:'Watermelon',            emoji:'🍉', category:'fruits',     price:25,  unit:'kg',    farm:'SunField Farms, Karnataka',   badge:null,      rating:4.4, reviews:99,  desc:'Large, ripe watermelons — perfect summer refreshment.',                               image:'https://images.unsplash.com/photo-1589984662646-e7b2e4962f18?auto=format&fm=webp&fit=crop&w=400&q=75' },
  { id:'p16', name:'Lemon',                 emoji:'🍋', category:'fruits',     price:30,  unit:'500g',  farm:'CitrusFarm, Vidarbha',        badge:null,      rating:4.3, reviews:211, desc:'Thin-skinned, juicy lemons loaded with vitamin C.',                                   image:'https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fm=webp&fit=crop&w=400&q=75' }
];
