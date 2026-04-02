/* ============================================================
   FreshLink — ui.js  (Launch Edition)
   Navbar scroll, cursor (desktop), scroll progress,
   reveal animations, mobile nav, scroll-to-top.
   ============================================================ */
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initCursor();
  initScrollProgress();
  initReveal();
  initScrollTop();
  initMobileNav();
  initDeliveryBanner();
});

/* ── Navbar ── */
function initNavbar() {
  const nav = document.getElementById('nav');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ── Custom Cursor (desktop only) ── */
function initCursor() {
  const cur = document.getElementById('cur');
  const ring = document.getElementById('cur-ring');
  if (!cur || !ring) return;
  // Only on non-touch devices
  if (window.matchMedia('(pointer: coarse)').matches) return;

  let mx = 0, my = 0, rx = 0, ry = 0;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

  function loop() {
    cur.style.transform = `translate(${mx - 4}px, ${my - 4}px)`;
    rx += (mx - rx) * 0.14;
    ry += (my - ry) * 0.14;
    ring.style.transform = `translate(${rx - 15}px, ${ry - 15}px)`;
    requestAnimationFrame(loop);
  }
  loop();

  document.addEventListener('mousedown', () => { cur.style.transform += ' scale(1.6)'; });
  document.addEventListener('mouseup',   () => { });
}

/* ── Scroll Progress ── */
function initScrollProgress() {
  const bar = document.getElementById('prog');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
  }, { passive: true });
}

/* ── Reveal on scroll ── */
function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

/* ── Scroll to Top ── */
function initScrollTop() {
  const btn = document.getElementById('scrollTopBtn');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('show', window.scrollY > 400);
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ── Mobile Nav ── */
function initMobileNav() {
  const hamBtn = document.getElementById('hamBtn');
  const mobileNav = document.getElementById('mobileNav');
  if (!hamBtn || !mobileNav) return;

  hamBtn.addEventListener('click', () => {
    const open = mobileNav.classList.toggle('open');
    hamBtn.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  // Close on link click
  mobileNav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      hamBtn.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

/* ── Delivery Banner ── */
function initDeliveryBanner() {
  const banner = document.getElementById('deliveryBanner');
  const closeBtn = document.getElementById('closeBanner');
  if (!banner) return;
  if (sessionStorage.getItem('bannerClosed')) {
    banner.style.display = 'none';
    return;
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      banner.style.display = 'none';
      sessionStorage.setItem('bannerClosed', '1');
    });
  }
}
