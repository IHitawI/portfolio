(() => {
  const SITE = window.SITE || {};
  const WORKS = window.WORKS || [];
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    }
    n.append(...kids.filter(Boolean));
    return n;
  };

  // **bold** inside plain text, everything else stays text
  const rich = (str) => {
    const frag = document.createDocumentFragment();
    String(str).split(/(\*\*[^*]+\*\*)/).forEach((part) => {
      if (/^\*\*[^*]+\*\*$/.test(part)) frag.append(el('strong', { text: part.slice(2, -2) }));
      else if (part) frag.append(part);
    });
    return frag;
  };

  /* ---------- Texts ---------- */
  const binds = {
    name: SITE.name,
    role: SITE.role,
    eyebrow: SITE.eyebrow,
    heroText: SITE.heroText,
    ctaTitle: SITE.cta && SITE.cta.title,
    ctaText: SITE.cta && SITE.cta.text,
    discord: SITE.contacts && SITE.contacts.discord,
  };
  $$('[data-bind]').forEach((n) => {
    const key = n.dataset.bind;
    if (key === 'heroTitle') {
      n.replaceChildren(...(SITE.heroTitle || []).map((t) => el('span', { text: t })));
    } else if (key === 'about') {
      n.replaceChildren(...(SITE.about || []).map((t) => el('p', {}, rich(t))));
    } else if (binds[key] != null) {
      n.textContent = binds[key];
    }
  });
  $$('[data-bind-src]').forEach((n) => { if (SITE[n.dataset.bindSrc]) n.src = SITE[n.dataset.bindSrc]; });
  if (SITE.name && SITE.role) document.title = `${SITE.name} — ${SITE.role}`;

  /* ---------- Contacts ---------- */
  const toast = $('.toast');
  let toastTimer;
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-on'), 3200);
  };
  const contacts = SITE.contacts || {};
  $$('.js-discord').forEach((b) => b.addEventListener('click', async () => {
    if (contacts.discordUrl) { window.open(contacts.discordUrl, '_blank', 'noopener'); return; }
    try {
      await navigator.clipboard.writeText(contacts.discord);
      showToast(`Discord username “${contacts.discord}” copied — add me as a friend`);
    } catch (e) {
      showToast(`My Discord: ${contacts.discord}`);
    }
  }));

  /* ---------- Works ---------- */
  const cats = SITE.categories || {};
  // untitled works get "Skin 01"-style names in list order; new works go to the end so numbers stay stable
  const counters = {};
  WORKS.forEach((w) => {
    counters[w.category] = (counters[w.category] || 0) + 1;
    if (!w.title) w.title = `${(SITE.itemNames || {})[w.category] || 'Work'} ${String(counters[w.category]).padStart(2, '0')}`;
    if (!w.lines) w.lines = (SITE.defaultLines || {})[w.category] || [];
  });
  const used = Object.keys(cats).filter((c) => WORKS.some((w) => w.category === c));
  const chips = $('.chips');
  const grid = $('.works');
  const empty = $('.empty');
  let filter = 'all';

  const chipFor = (key, label) => el('button', {
    class: 'chip', type: 'button', role: 'tab',
    'aria-selected': String(key === filter), 'data-key': key, text: label,
    onclick: () => { filter = key; renderChips(); renderWorks(); },
  });
  const renderChips = () => {
    chips.replaceChildren(chipFor('all', 'All'), ...used.map((c) => chipFor(c, cats[c])));
  };

  const renderWorks = () => {
    const list = WORKS.filter((w) => filter === 'all' || w.category === filter);
    empty.hidden = list.length > 0;
    grid.replaceChildren(...list.map((w, i) => {
      const card = el('button', {
        class: 'work', type: 'button', style: `animation-delay:${i * 60}ms`,
        'aria-label': `Open ${w.title}`, onclick: () => openViewer(w),
      },
      el('span', { class: 'corner-pix', 'aria-hidden': 'true' }),
      el('img', { class: 'work__img pixel-img', src: w.image, alt: w.title, loading: 'lazy' }),
      el('span', { class: 'work__info' },
        el('h3', { class: 'work__title', text: w.title }),
        el('span', { class: 'rule', 'aria-hidden': 'true' }),
        el('p', { class: 'work__lines' }, ...(w.lines || []).flatMap((l, j) => j ? [el('br'), l] : [l]))),
      el('span', { class: 'work__open', 'aria-hidden': 'true', text: '↗' }));
      return card;
    }));
  };
  if (!used.length) chips.hidden = true;
  renderChips();
  renderWorks();

  /* ---------- Viewer ---------- */
  const viewer = $('.viewer');
  const vImg = $('.viewer__img');
  const dots = $('.viewer__dots');
  let shots = [];
  let idx = 0;
  const show = (i) => {
    idx = (i + shots.length) % shots.length;
    vImg.src = shots[idx];
    $$('button', dots).forEach((d, j) => d.setAttribute('aria-current', String(j === idx)));
  };
  const openViewer = (w) => {
    shots = [w.image, ...(w.gallery || [])].filter(Boolean);
    vImg.alt = w.title;
    $('.viewer__title').textContent = w.title;
    $('.viewer__text').replaceChildren(...[...(w.lines || []), ...(w.description || [])].map((t) => el('p', {}, rich(t))));
    dots.replaceChildren(...(shots.length > 1 ? shots.map((_, j) => el('button', { type: 'button', 'aria-label': `Image ${j + 1}`, onclick: () => show(j) })) : []));
    $$('.viewer__nav').forEach((b) => { b.hidden = shots.length < 2; });
    show(0);
    viewer.showModal();
  };
  $('.viewer__close').addEventListener('click', () => viewer.close());
  $('.viewer__prev').addEventListener('click', () => show(idx - 1));
  $('.viewer__next').addEventListener('click', () => show(idx + 1));
  viewer.addEventListener('click', (e) => { if (e.target === viewer) viewer.close(); });
  viewer.addEventListener('keydown', (e) => {
    if (shots.length < 2) return;
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
  });

  /* ---------- Pricing ---------- */
  $('.pricing').replaceChildren(...(SITE.pricing || []).map((p) => {
    const icons = el('span', { class: 'price__icons', 'aria-hidden': 'true' });
    (p.icons || []).forEach((src, i) => {
      if (i) icons.append('+');
      icons.append(el('img', { class: 'pixel-img', src, alt: '' }));
    });
    return el('article', { class: 'price' },
      el('span', { class: 'corner-pix', 'aria-hidden': 'true' }),
      el('div', { class: 'price__top' }, icons, el('h3', { class: 'price__title', text: p.title })),
      el('p', { class: 'price__amount' }, p.prefix ? el('small', { text: p.prefix }) : null, p.price),
      el('span', { class: 'rule', 'aria-hidden': 'true' }),
      el('p', { class: 'price__sub', text: p.subtitle }),
      el('p', { class: 'price__text', text: p.text }));
  }));

  const ICONS = {
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    revisions: '<path d="M20 12a8 8 0 0 1-14 5.3M4 12a8 8 0 0 1 14-5.3"/><path d="M18 3v4h-4M6 21v-4h4"/>',
    paypal: '<path d="M7 21 9.5 4h6a4 4 0 0 1 0 8H11l-1.3 9z"/>',
    check: '<path d="m5 12 5 5 9-10"/>',
  };
  $('.perks').replaceChildren(...(SITE.perks || []).map((p) => {
    const li = el('li');
    li.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[p.icon] || ICONS.check}</svg>`;
    li.append(p.text);
    return li;
  }));

  /* ---------- Pixel decor ---------- */
  // deterministic scatter so the layout doesn't jump between visits
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const palette = ['var(--block-1)', 'var(--block-2)', 'var(--block-3)'];
  const accent = ['var(--pix-plum)', 'var(--gold)'];

  const decorate = (host, { blocks, sparks, side }) => {
    const frag = document.createDocumentFragment();
    const unit = 28;
    // blocky terrain along the bottom
    for (let i = 0; i < blocks; i++) {
      const col = side === 'both' ? (i % 2 ? 100 - rnd() * 22 : rnd() * 22) : 52 + rnd() * 48;
      const h = 1 + Math.floor(rnd() * 5);
      for (let j = 0; j < h; j++) {
        frag.append(el('i', { style: `left:${col}%;bottom:${j * unit}px;width:${unit}px;height:${unit}px;background:${palette[Math.floor(rnd() * 3)]};opacity:${0.55 + rnd() * 0.45}` }));
      }
    }
    // small floating pixels
    for (let i = 0; i < sparks; i++) {
      const s = [6, 10, 14][Math.floor(rnd() * 3)];
      const left = side === 'both' ? (i % 2 ? 80 + rnd() * 18 : rnd() * 18) : 45 + rnd() * 50;
      frag.append(el('i', { style: `left:${left}%;top:${8 + rnd() * 60}%;width:${s}px;height:${s}px;background:${accent[Math.floor(rnd() * 2)]};opacity:${0.25 + rnd() * 0.5}` }));
    }
    host.append(frag);
  };
  decorate($('.hero__bg'), { blocks: 26, sparks: 14, side: 'right' });
  decorate($('.cta__bg'), { blocks: 20, sparks: 10, side: 'both' });

  /* ---------- Theme & header ---------- */
  const root = document.documentElement;
  $('.theme-toggle').addEventListener('click', () => {
    const dark = root.dataset.theme === 'dark';
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
  });
  const header = $('.header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
