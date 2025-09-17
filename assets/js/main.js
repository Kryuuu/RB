// Rumah BUMN — interaksi dasar

(function () {
  const qs = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // Tahun footer
  const yearEl = qs('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Header behavior
  const header = qs('.site-header');
  const toggle = qs('.nav-toggle');
  const menu = qs('.menu');
  const backdrop = qs('.backdrop');

  function setMenu(open) {
    if (!menu || !toggle) return;
    menu.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    if (backdrop) backdrop.hidden = !open;
  }

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const open = !menu.classList.contains('open');
      setMenu(open);
    });
  }
  if (backdrop) {
    backdrop.addEventListener('click', () => setMenu(false));
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMenu(false);
  });

  function updateScrolled() {
    const s = window.scrollY > 8;
    if (header) header.classList.toggle('scrolled', s);
  }
  updateScrolled();
  window.addEventListener('scroll', updateScrolled, { passive: true });

  // Set active nav by URL
  function setActiveNav() {
    if (!menu) return;
    const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const links = qsa('a', menu);
    links.forEach((a) => {
      const href = (a.getAttribute('href') || '').toLowerCase();
      const isActive = href === path || (path === '' && href.endsWith('index.html'));
      a.classList.toggle('active', isActive);
      if (isActive) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }
  setActiveNav();

  // Validasi sederhana form + notifikasi sukses
  function setupForm(formId, successId) {
    const form = qs('#' + formId);
    const notice = qs('#' + successId);
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;
      qsa('.field', form).forEach((wrap) => {
        const input = wrap.querySelector('input, textarea, select');
        if (!input) return;
        if (!input.checkValidity()) {
          wrap.classList.add('invalid');
          valid = false;
        } else {
          wrap.classList.remove('invalid');
        }
      });
      if (!valid) return;
      // loading state + fake async submit
      const btn = qs('button[type="submit"]', form);
      const oldTxt = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.classList.add('loading'); btn.textContent = 'Mengirim...'; }
      const done = () => {
        if (notice) {
          notice.classList.remove('hidden');
          notice.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        if (btn) { btn.disabled = false; btn.classList.remove('loading'); btn.textContent = oldTxt; }
        form.reset();
        try { showToast('Form berhasil dikirim', 'success'); } catch (_) {}
      };
      // Simulasi request 1.2s
      setTimeout(done, 1200);
    });
  }
  setupForm('formUmkm', 'umkmSuccess');
  setupForm('formMagang', 'magangSuccess');

  // Carousel generik
  function setupCarousel(root) {
    const slidesWrap = qs('.slides', root);
    const slides = qsa('.slide', slidesWrap);
    const dotsWrap = qs('.dots', root);
    const prevBtn = qs('.prev', root);
    const nextBtn = qs('.next', root);
    if (!slides.length) return;
    let index = 0;
    let timer = null;
    const interval = Number(root.getAttribute('data-interval') || 4500);

    function go(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach((s, j) => s.classList.toggle('active', j === index));
      const dots = qsa('button', dotsWrap);
      dots.forEach((d, j) => d.setAttribute('aria-selected', String(j === index)));
    }

    // build dots
    if (dotsWrap) {
      slides.forEach((_, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', `Ke slide ${i + 1}`);
        b.addEventListener('click', () => { stop(); go(i); start(); });
        dotsWrap.appendChild(b);
      });
    }
    go(0);

    function next() { go(index + 1); }
    function prev() { go(index - 1); }

    function start() { timer = setInterval(next, interval); }
    function stop() { if (timer) clearInterval(timer); }

    start();
    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    if (prevBtn) prevBtn.addEventListener('click', () => { stop(); prev(); start(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { stop(); next(); start(); });
  }

  qsa('[data-carousel]').forEach(setupCarousel);

  // Katalog: filter sederhana
  const search = qs('#search');
  const filterKategori = qs('#filterKategori');
  const grid = qs('#catalogGrid');
  const resultCount = qs('#resultCount');
  const filtersForm = qs('#filtersForm');
  if (filtersForm) filtersForm.addEventListener('submit', (e) => e.preventDefault());
  function applyFilter() {
    if (!grid) return;
    const q = (search?.value || '').toLowerCase().trim();
    const k = filterKategori?.value || '';
    let visible = 0;
    qsa('.card', grid).forEach((card) => {
      const title = qs('h3', card)?.textContent?.toLowerCase() || '';
      const body = qs('p', card)?.textContent?.toLowerCase() || '';
      const kk = card.getAttribute('data-kategori') || '';
      const matchText = !q || title.includes(q) || body.includes(q);
      const matchCat = !k || kk === k;
      const show = (matchText && matchCat);
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });
    if (resultCount) resultCount.textContent = visible + ' hasil';
  }
  if (search) {
    const sb = search.closest('.searchbar');
    const clr = sb?.querySelector('.clear');
    const updateHasValue = () => sb && sb.setAttribute('data-has-value', search.value ? '1' : '0');
    search.addEventListener('input', () => { updateHasValue(); applyFilter(); });
    updateHasValue();
    if (clr) clr.addEventListener('click', () => { search.value = ''; updateHasValue(); applyFilter(); search.focus(); });
  }
  if (grid) {
    const chips = qsa('.chip-group .chip');
    chips.forEach((c) => {
      c.setAttribute('aria-pressed', c.classList.contains('active') ? 'true' : 'false');
      c.addEventListener('click', () => {
        chips.forEach((x) => { x.classList.remove('active'); x.setAttribute('aria-pressed', 'false'); });
        c.classList.add('active');
        c.setAttribute('aria-pressed', 'true');
        if (filterKategori) filterKategori.value = c.getAttribute('data-kat') || '';
        applyFilter();
      });
    });
  }
  // initial count
  applyFilter();

  // Image fade-in for cards and train items
  function prepareFadeImages(sel) {
    qsa(sel).forEach((img) => {
      img.classList.add('img-fade');
      const mark = () => img.classList.add('is-loaded');
      if (img.complete && img.naturalWidth > 0) mark();
      else img.addEventListener('load', mark, { once: true });
    });
  }
  prepareFadeImages('.card img, .slider-train .item img');

  // Header nav indicator (desktop)
  function setupNavIndicator() {
    const nav = menu;
    if (!nav) return;
    const indicator = document.createElement('span');
    indicator.className = 'nav-indicator';
    nav.appendChild(indicator);
    let active = nav.querySelector('a.active') || nav.querySelector('a');
    function moveTo(el) {
      if (!el) return;
      const navRect = nav.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const left = elRect.left - navRect.left;
      const width = elRect.width;
      indicator.style.setProperty('--_l', `${left}px`);
      indicator.style.setProperty('--_w', `${width}px`);
      indicator.style.opacity = '1';
    }
    moveTo(active);
    qsa('a', nav).forEach((a) => {
      a.addEventListener('mouseenter', () => moveTo(a));
      a.addEventListener('focus', () => moveTo(a));
      a.addEventListener('click', () => { active = a; moveTo(a); if (window.innerWidth <= 760) setMenu(false); });
    });
    nav.addEventListener('mouseleave', () => moveTo(active));
    window.addEventListener('resize', () => moveTo(active));
  }
  setupNavIndicator();
  
  // Slider kereta (horizontal, auto-scroll)
  function setupTrain(root) {
    const track = root.querySelector('.track');
    if (!track) return;
    if (track.dataset.cloned === '1') return; // prevent double clone
    // Clone children for seamless loop
    track.innerHTML += track.innerHTML;
    track.dataset.cloned = '1';
    // Speed control via CSS var (seconds)
    const speed = Number(root.getAttribute('data-speed') || 28);
    root.style.setProperty('--_dur', speed + 's');
    // Respect reduced motion
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) root.classList.add('no-motion');
  }
  qsa('[data-train]').forEach(setupTrain);

  // Reveal on scroll (adds .is-in to .reveal-up)
  function setupReveal() {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const candidates = [
      '.hero-content', '.section-head', '.card', '.stats .stat', '.filters', '.slider-train .item'
    ];
    const els = candidates.flatMap((sel) => qsa(sel));
    els.forEach((el) => el.classList.add('reveal-up'));
    if (reduce) { els.forEach((el) => el.classList.add('is-in')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
    els.forEach((el) => io.observe(el));
  }
  setupReveal();

  // FAQ accordion
  (function setupAccordion() {
    qsa('[data-accordion]').forEach((root) => {
      qsa('.item', root).forEach((item) => {
        const head = item.querySelector('.head');
        const panel = item.querySelector('.panel');
        if (!head || !panel) return;
        head.addEventListener('click', () => {
          const open = item.classList.toggle('open');
          const h = open ? panel.scrollHeight + 'px' : '0px';
          panel.style.maxHeight = h;
          head.setAttribute('aria-expanded', String(open));
        });
      });
    });
  })();

  // Quick View modal for catalog items
  (function setupQuickView() {
    const grid = qs('#catalogGrid');
    if (!grid) return;
    function buildModal() {
      let m = qs('.modal');
      if (m) return m;
      m = document.createElement('div');
      m.className = 'modal';
      m.innerHTML = '<div class="box" role="dialog" aria-modal="true"><header><strong>Detail</strong><button class="close" aria-label="Tutup">×</button></header><div class="content"><img alt=""><div class="body"><h3></h3><p class="muted"></p></div></div></div>';
      document.body.appendChild(m);
      const close = () => m.classList.remove('open');
      m.addEventListener('click', (e) => { if (e.target === m) close(); });
      m.querySelector('.close').addEventListener('click', close);
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
      return m;
    }
    const modal = buildModal();
    grid.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-quickview]');
      if (!trigger) return;
      const card = trigger.closest('.card');
      if (!card) return;
      const img = card.querySelector('img');
      const title = card.querySelector('h3');
      const desc = card.querySelector('p');
      modal.querySelector('img').src = img ? img.src : '';
      modal.querySelector('img').alt = img ? (img.alt || title?.textContent || 'Produk') : 'Produk';
      modal.querySelector('h3').textContent = title ? title.textContent : 'Produk';
      modal.querySelector('p').textContent = desc ? desc.textContent : '';
      modal.classList.add('open');
    });
  })();

  // Subtle tilt interaction for cards and train items
  function setupTilt(sel, maxTilt = 6) {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    qsa(sel).forEach((el) => {
      let raf = null;
      function onMove(ev) {
        const rect = el.getBoundingClientRect();
        const x = (ev.clientX - rect.left) / rect.width; // 0..1
        const y = (ev.clientY - rect.top) / rect.height; // 0..1
        const tiltX = (0.5 - y) * maxTilt; // invert for natural tilt
        const tiltY = (x - 0.5) * maxTilt;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          el.style.setProperty('--tiltX', tiltX.toFixed(2) + 'deg');
          el.style.setProperty('--tiltY', tiltY.toFixed(2) + 'deg');
        });
      }
      function onLeave() {
        if (raf) cancelAnimationFrame(raf);
        el.style.setProperty('--tiltX', '0deg');
        el.style.setProperty('--tiltY', '0deg');
      }
      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseleave', onLeave);
    });
  }
  setupTilt('.card, .slider-train .item');

  // Animated counters for About stats (random scramble then count-up)
  function setupStatCounters() {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nums = qsa('.stats .num');
    if (!nums.length) return;
    if (reduce) return; // respect reduced motion

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        if (el.dataset.animated === '1') return;
        animateNum(el);
        el.dataset.animated = '1';
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -20% 0px', threshold: 0.2 });

    nums.forEach((el) => io.observe(el));

    function animateNum(el) {
      const original = (el.textContent || '').trim();
      const suffix = (original.match(/[^\d.]+$/) || [''])[0];
      const digits = original.replace(/[^\d]/g, '');
      if (!digits) return;
      const target = parseInt(digits, 10);
      const len = String(target).length;
      const format = (el.getAttribute('data-counter-format') || 'long'); // 'long' | 'short'
      const scramble = (el.getAttribute('data-counter-scramble') || '1') === '1';
      const customDur = parseInt(el.getAttribute('data-counter-duration') || '0', 10);
      const duration = customDur > 0 ? customDur : Math.max(900, Math.min(2000, 600 + len * 250));
      const scrambleEnd = scramble ? 0.4 : 0; // first 40% scramble, then count-up

      const start = performance.now();
      function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
      const formatShort = (n) => {
        if (n >= 1_000_000) return (n/1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + 'M';
        if (n >= 1_000) return (n/1_000).toFixed(n % 1_000 === 0 ? 0 : 1) + 'K';
        return String(n);
      };

      function render(n) {
        const val = format === 'short' ? formatShort(n) : n.toLocaleString('id-ID');
        el.textContent = val + suffix;
      }

      function tick(now) {
        const t = Math.min(1, (now - start) / duration);
        const p = easeOutCubic(t);
        let display = 0;
        if (scramble && p < scrambleEnd) {
          const min = Math.pow(10, len - 1);
          const max = Math.pow(10, len) - 1;
          display = Math.floor(min + Math.random() * (max - min));
        } else {
          const p2 = scramble ? (p - scrambleEnd) / (1 - scrambleEnd) : p;
          display = Math.floor(target * p2);
          const jitter = Math.min(3, target - display);
          display += Math.floor(Math.random() * (jitter + 1));
        }
        if (display >= target || p >= 1) { render(target); return; }
        render(display);
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
  }
  setupStatCounters();

  // Theme toggle (light/dark) with persistence
  (function setupThemeToggle() {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
    const apply = (mode) => {
      const b = document.body;
      if (mode === 'dark' || (mode === 'system' && prefersDark.matches)) b.classList.add('theme-dark');
      else b.classList.remove('theme-dark');
      localStorage.setItem('theme', mode);
      updateIcon(mode);
    };
    function updateIcon(mode) {
      const btn = qs('.theme-toggle');
      if (!btn) return;
      const darkOn = document.body.classList.contains('theme-dark');
      btn.setAttribute('aria-label', darkOn ? 'Matikan mode gelap' : 'Nyalakan mode gelap');
      btn.textContent = darkOn ? '☾' : '☀';
    }
    // Default to dark if not set
    const saved = localStorage.getItem('theme') || 'dark';
    apply(saved);
    if (prefersDark && prefersDark.addEventListener) prefersDark.addEventListener('change', () => apply(localStorage.getItem('theme') || 'system'));
    // inject button
    const nav = qs('.menu') || qs('.nav');
    if (nav) {
      const btn = document.createElement('button');
      btn.className = 'theme-toggle';
      btn.type = 'button';
      btn.addEventListener('click', () => {
        const cur = localStorage.getItem('theme') || 'system';
        const next = document.body.classList.contains('theme-dark') ? 'light' : 'dark';
        apply(next);
      });
      nav.appendChild(btn);
      updateIcon(saved);
    }
  })();

  // Toast notifications
  function showToast(message, type = 'success') {
    let wrap = qs('.toast-wrap');
    if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toast-wrap'; document.body.appendChild(wrap); }
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.textContent = message;
    wrap.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(6px)'; el.style.transition = 'opacity .2s ease, transform .2s ease'; }, 2200);
    setTimeout(() => { el.remove(); if (!wrap.children.length) wrap.remove(); }, 2600);
  }

  // Enhance forms: realtime validation + toast on success
  (function enhanceForms() {
    function wireRealtime(form) {
      const fields = qsa('.field', form);
      fields.forEach((wrap) => {
        const input = wrap.querySelector('input, textarea, select');
        if (!input) return;
        const check = () => { if (!input.checkValidity()) wrap.classList.add('invalid'); else wrap.classList.remove('invalid'); };
        input.addEventListener('input', check);
        input.addEventListener('blur', check);
        input.addEventListener('change', check);
      });
    }
    ['formUmkm', 'formMagang'].forEach((id) => {
      const form = qs('#' + id);
      if (!form) return;
      wireRealtime(form);
      form.addEventListener('submit', () => { showToast('Form berhasil dikirim', 'success'); });
    });
  })();

  // Back to top button
  (function setupBackToTop() {
    const btn = document.createElement('button');
    btn.className = 'back-to-top';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Kembali ke atas');
    btn.textContent = '↑';
    document.body.appendChild(btn);
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function onScroll() { const show = window.scrollY > 200; btn.classList.toggle('show', show); }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    btn.addEventListener('click', () => {
      if (reduce) window.scrollTo(0,0); else window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  })();

  // Skeleton while images load (cards + train + general imgs with fade)
  (function enhanceImageLoading() {
    function prepareFadeImages(sel) {
      qsa(sel).forEach((img) => {
        if (!img.classList.contains('img-fade')) img.classList.add('img-fade');
        if (!img.complete || img.naturalWidth === 0) img.classList.add('skeleton');
        const mark = () => { img.classList.add('is-loaded'); img.classList.remove('skeleton'); };
        if (img.complete && img.naturalWidth > 0) mark();
        else img.addEventListener('load', mark, { once: true });
      });
    }
    prepareFadeImages('.card img, .slider-train .item img');
  })();

  // 3D background elements (monochrome, lightweight)
  (function setup3DBackground() {
    if (qs('.bg-3d')) return;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.matchMedia && window.matchMedia('(max-width: 760px)').matches;
    const body = document.body;
    const opts = window.RB3D_OPTS || {};
    const disableOnMobile = opts.disableOnMobile !== false; // default true
    const onlyOn = Array.isArray(opts.onlyOn) ? opts.onlyOn : null; // ['index.html']
    const except = Array.isArray(opts.except) ? opts.except : null;
    const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if (body.classList.contains('no-3d') || body.getAttribute('data-3d') === 'off') return;
    if (reduce) return;
    if (disableOnMobile && isMobile) return;
    if (onlyOn && !onlyOn.includes(page)) return;
    if (except && except.includes(page)) return;
    const root = document.createElement('div');
    root.className = 'bg-3d';
    const layer = document.createElement('div');
    layer.className = 'layer';
    root.appendChild(layer);
    if (document.body.firstChild) document.body.insertBefore(root, document.body.firstChild); else document.body.appendChild(root);

    const W = window.innerWidth;
    const baseCount = Math.min(14, Math.max(8, Math.floor(W / 140)));
    const strong = (opts.intensity || 'soft') === 'strong';
    const count = strong ? Math.round(baseCount * 1.4) : baseCount;
    const rnd = (a, b) => a + Math.random() * (b - a);
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const types = ['ring', 'square', 'stripe'];

    for (let i = 0; i < count; i++) {
      const t = pick(types);
      const el = document.createElement('div');
      el.className = 'shape ' + t;
      const x = rnd(-5, 100); // vw
      const y = rnd(-5, 100); // vh
      const size = Math.round(rnd(strong ? 100 : 80, strong ? 280 : 220));
      const z = Math.round(rnd(-900, strong ? -120 : -180));
      const rotX = Math.round(rnd(-30, 30));
      const rotY = Math.round(rnd(-45, 45));
      const amp = Math.round(rnd(6, 18));
      const dur = rnd(strong ? 12 : 16, strong ? 24 : 28).toFixed(2) + 's';
      const delay = rnd(0, 8).toFixed(2) + 's';
      el.style.setProperty('--tx', x.toFixed(2) + 'vw');
      el.style.setProperty('--ty', y.toFixed(2) + 'vh');
      el.style.setProperty('--tz', z + 'px');
      el.style.setProperty('--rotX', rotX + 'deg');
      el.style.setProperty('--rotY', rotY + 'deg');
      el.style.setProperty('--size', size + 'px');
      el.style.setProperty('--amp', amp + 'px');
      el.style.setProperty('--dur', dur);
      el.style.setProperty('--delay', delay);
      layer.appendChild(el);
    }

    // Parallax by pointer
    if (!reduce) {
      let raf = null;
      let mx = 0, my = 0;
      const onMove = (e) => {
        const w = window.innerWidth, h = window.innerHeight;
        const cx = (e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? w / 2);
        const cy = (e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? h / 2);
        const nx = (cx / w - 0.5) * 2; // -1..1
        const ny = (cy / h - 0.5) * 2; // -1..1
        mx = nx * 0.5; my = ny * 0.5;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          layer.style.setProperty('--mx', mx.toFixed(3));
          layer.style.setProperty('--my', my.toFixed(3));
        });
      };
      window.addEventListener('mousemove', onMove, { passive: true });
      window.addEventListener('touchmove', onMove, { passive: true });
    }
  })();
})();
