/* Emberfall Raiders website: embers, reveal-on-scroll, hero slideshow, co-op lobby demo, gallery. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (window.EFSprites) window.EFSprites.renderAll();

  // ---------- nav ----------
  const nav = $('.nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    const btn = $('.menu-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        const open = nav.classList.toggle('open');
        btn.setAttribute('aria-expanded', String(open));
      });
      $$('.nav-links a').forEach((a) => a.addEventListener('click', () => { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }));
    }
  }

  // ---------- embers (canvas) ----------
  const cv = $('#embers');
  if (cv && !reduced) {
    const ctx = cv.getContext('2d');
    let W = 0, H = 0, dpr = 1, parts = [];
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(90, (W * H) / 16000));
      parts = Array.from({ length: n }, () => spawn(true));
    };
    const spawn = (anywhere) => ({
      x: Math.random() * W,
      y: anywhere ? Math.random() * H : H + 10,
      r: 0.8 + Math.random() * 2.4,
      v: 14 + Math.random() * 46,
      p: Math.random() * Math.PI * 2,
      w: 0.4 + Math.random() * 1.2,
      hue: Math.random() > 0.5 ? '255,160,64' : '255,214,122',
    });
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, W, H);
      for (const e of parts) {
        e.y -= e.v * dt;
        e.p += dt * e.w;
        e.x += Math.sin(e.p) * 12 * dt;
        if (e.y < -10) Object.assign(e, spawn(false));
        const a = Math.max(0, Math.min(1, e.y / H)) * 0.9 + 0.1;
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,112,40,${0.12 * a})`;
        ctx.arc(e.x, e.y, e.r * 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = `rgba(${e.hue},${0.85 * a})`;
        ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(tick);
    };
    resize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(tick);
  }

  // ---------- reveal on scroll ----------
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }) : null;
  $$('.reveal').forEach((el) => (io ? io.observe(el) : el.classList.add('in')));

  // ---------- counters ----------
  const counters = $$('[data-count]');
  const countIo = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      countIo.unobserve(e.target);
      const el = e.target, end = Number(el.getAttribute('data-count'));
      if (reduced || !end) continue;
      const t0 = performance.now();
      const step = (t) => {
        const k = Math.min(1, (t - t0) / 1200);
        el.textContent = String(Math.round(end * (1 - Math.pow(1 - k, 3))));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  }, { threshold: 0.5 }) : null;
  counters.forEach((el) => countIo && countIo.observe(el));

  // ---------- hero phone slideshow ----------
  const slides = $$('.phone .screen img');
  if (slides.length > 1 && !reduced) {
    let i = 0;
    setInterval(() => {
      slides[i].classList.remove('on');
      i = (i + 1) % slides.length;
      slides[i].classList.add('on');
    }, 3200);
  }

  // ---------- parallax sprites ----------
  const stage = $('.stage');
  if (stage && !reduced && window.matchMedia('(pointer: fine)').matches) {
    const items = $$('.float-sprite', stage);
    window.addEventListener('pointermove', (ev) => {
      const nx = ev.clientX / window.innerWidth - 0.5, ny = ev.clientY / window.innerHeight - 0.5;
      items.forEach((el) => {
        const d = Number(el.getAttribute('data-depth') || 20);
        el.style.transform = `translate3d(${(-nx * d).toFixed(1)}px, ${(-ny * d).toFixed(1)}px, 0)`;
      });
    }, { passive: true });
  }

  // ---------- co-op lobby demo ----------
  const lobby = $('.lobby');
  if (lobby) {
    const digits = $$('.code span', lobby);
    const party = $('.party', lobby);
    const ready = $('.ready-count', lobby);
    const crew = [
      { cls: 'ranger', name: 'Mira', hero: 'Ranger', best: 14 },
      { cls: 'mage', name: 'Kael', hero: 'Mage', best: 22 },
      { cls: 'knight', name: 'Bram', hero: 'Knight', best: 9 },
    ];
    const rollCode = () => {
      const code = String(10000 + Math.floor(Math.random() * 90000));
      digits.forEach((d, k) => {
        let n = 0;
        const iv = setInterval(() => {
          d.textContent = String(Math.floor(Math.random() * 10));
          if (++n > 8 + k * 3) { clearInterval(iv); d.textContent = code[k]; }
        }, 55);
      });
      $$('.code-text', lobby).forEach((el) => { setTimeout(() => (el.textContent = code), 800); });
    };
    const reset = () => {
      $$('.member', party).forEach((m, k) => {
        if (k === 0) return;
        m.className = 'member wait';
        m.innerHTML = 'Waiting for adventurer...';
      });
      if (ready) ready.textContent = '1';
    };
    let started = false;
    const run = () => {
      reset();
      rollCode();
      crew.forEach((c, k) => {
        setTimeout(() => {
          const m = $$('.member', party)[k + 1];
          m.className = 'member join';
          m.innerHTML = `<span data-sprite="${c.cls}"></span><div><b>${c.name}</b><span>${c.hero} · Best stage ${c.best}</span></div>`;
          if (window.EFSprites) window.EFSprites.renderAll(m);
          if (ready) ready.textContent = String(k + 2);
        }, 1600 + k * 1300);
      });
    };
    const lobbyIo = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting) && !started) {
        started = true;
        run();
        if (!reduced) setInterval(run, 9000);
      }
    }, { threshold: 0.4 }) : null;
    if (lobbyIo) lobbyIo.observe(lobby); else run();
  }

  // ---------- gallery ----------
  const gal = $('.gallery');
  if (gal) {
    const by = (dir) => gal.scrollBy({ left: dir * 280, behavior: reduced ? 'auto' : 'smooth' });
    const prev = $('[data-gal="prev"]'), next = $('[data-gal="next"]');
    if (prev) prev.addEventListener('click', () => by(-1));
    if (next) next.addEventListener('click', () => by(1));
    const box = $('.lightbox'), boxImg = box && $('img', box);
    if (box && boxImg) {
      $$('.shot', gal).forEach((s) => s.addEventListener('click', () => {
        const img = $('img', s);
        boxImg.src = img.currentSrc || img.src;
        boxImg.alt = img.alt;
        box.classList.add('open');
        box.focus();
      }));
      const close = () => box.classList.remove('open');
      box.addEventListener('click', close);
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    }
  }

  $$('[data-year]').forEach((el) => (el.textContent = String(new Date().getFullYear())));
})();
