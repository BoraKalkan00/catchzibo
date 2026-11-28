// Ekran yöneticisi ve küçük arayüz yardımcıları.
CZ.screens = {};

CZ.ui = (function () {
  let root = null;
  let active = null;

  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'style') el.style.cssText = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
      else el.setAttribute(k, v === true ? '' : v);
    });
    kids.flat(Infinity).forEach(kid => {
      if (kid === null || kid === undefined || kid === false) return;
      el.append(kid.nodeType ? kid : String(kid));
    });
    return el;
  }

  function img(key, cls, alt) {
    return h('img', { src: CZ.art(key), class: cls, alt: alt || '', draggable: 'false' });
  }

  function btn(label, onClick, cls, iconKey) {
    return h('button', {
      class: 'btn ' + (cls || ''),
      type: 'button',
      onClick: e => { CZ.audio.sfx('button'); onClick(e); }
    }, iconKey ? (String(iconKey).startsWith('ic:') ? CZ.icon(iconKey.slice(3), 'btn-icon') : img(iconKey, 'btn-icon')) : null, h('span', { text: label }));
  }

  function emeralds() {
    return h('div', { class: 'emeralds', 'aria-label': CZ.t('common.emeralds') },
      img('ui.emerald', 'emerald-icon'), h('span', { class: 'emerald-count', text: CZ.state.data.emeralds }));
  }

  function header(title, onBack) {
    return h('header', { class: 'topbar' },
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': CZ.t('common.back'), onClick: () => { CZ.audio.sfx('button'); onBack(); }, text: '‹' }),
      h('h1', { text: title }),
      emeralds());
  }

  function snow(count) {
    const box = h('div', { class: 'snow', 'aria-hidden': 'true' });
    for (let i = 0; i < (count || 14); i++) {
      const size = 3 + Math.random() * 5;
      box.append(h('i', {
        style: `left:${Math.random() * 100}%;width:${size}px;height:${size}px;animation-duration:${6 + Math.random() * 8}s;animation-delay:-${Math.random() * 12}s;opacity:${0.4 + Math.random() * 0.5}`
      }));
    }
    return box;
  }

  // Temalı yükleme ekranı: koşan Zibo, kar, ipucu ve dolan çubuk. done() ile kapanır.
  function loading(parent, opts) {
    opts = opts || {};
    const tips = ['tip.1', 'tip.2', 'tip.3', 'tip.4', 'tip.5', 'tip.6'];
    const bar = h('i');
    // (22 Kas) Sinematik slayt: her yüklemede 2 sahne. 1. sahne yavaş yakınlaşır, sonra ışık süpürmesi + çapraz geçişle 2. sahne itilerek gelir.
    // Yeni sahne eklemek: assets/ld/<ad>_v.webp (dikey) + <ad>_h.webp (yatay) koy, LD_SC listesine adını yaz.
    const SC = CZ.LD_SC || ['gece_baskini', 'koy_sabahi', 'zibo_soygun', 'altin_maden'];
    loading.i = ((loading.i == null ? Math.floor(Math.random() * SC.length) : loading.i) + 2) % SC.length;
    const sc = SC[loading.i], sc2 = SC[(loading.i + 1) % SC.length];
    const mk = (n, cls) => h('picture', { class: 'ld-bg ' + cls },
      h('source', { media: '(orientation: landscape)', srcset: 'assets/ld/' + n + '_h.webp' }),
      h('img', { src: 'assets/ld/' + n + '_v.webp', alt: '', draggable: 'false' }));
    const pic = h('div', { class: 'ld-stage' }, mk(sc, 'ld-a'), mk(sc2, 'ld-b'), h('i', { class: 'ld-sweep' }));
    const box = h('div', { class: 'loading-screen ld-cine ld-' + sc },
      pic, h('div', { class: 'ld-shade' }),
      snow(14),
      h('div', { class: 'ld-logo' }, h('img', { src: 'assets/ui/logo.webp', alt: CZ.t('title.name'), draggable: 'false' })),
      h('div', { class: 'ld-gap' }),
      h('div', { class: 'ld-bar' }, bar),
      h('p', { class: 'ld-tip', text: CZ.t(tips[Math.floor(Math.random() * tips.length)]) }),
      h('b', { class: 'ld-pct', text: '0%' }));
    (parent || document.getElementById('app')).append(box);
    let p = 0, closed = false;
    const pctEl = box.querySelector('.ld-pct'), tipEl = box.querySelector('.ld-tip'); let ti = Math.floor(Math.random() * tips.length), tt = 0;
    const tm = setInterval(() => { p = Math.min(0.95, p + (1 - p) * 0.05); bar.style.width = p * 100 + '%'; if (pctEl) pctEl.textContent = Math.round(p * 100) + '%';
      if ((tt += 60) >= 2600) { tt = 0; ti = (ti + 1) % tips.length; if (tipEl) { tipEl.classList.remove('ld-tip-in'); void tipEl.offsetWidth; tipEl.textContent = CZ.t(tips[ti]); tipEl.classList.add('ld-tip-in'); } } }, 60);   // (21 Kas) ipuçları döner, yüzde görünür
    const t0 = performance.now();
    const swT = setTimeout(() => box.classList.add('ld-two'), opts.swap || 1300);
    return {
      done() {
        if (closed) return; closed = true;
        clearInterval(tm); bar.style.width = '100%'; box.classList.add('ld-two'); clearTimeout(swT); if (pctEl) pctEl.textContent = '100%';
        const wait = Math.max(0, (opts.min || 2300) - (performance.now() - t0));
        setTimeout(() => { box.classList.add('out'); setTimeout(() => box.remove(), 350); }, wait);
      }
    };
  }

  const GAME = ['play', 'chase'];
  function go(name, params) {
    if (name === 'hub' || name === 'title' || name === 'valley' || name === 'village') name = 'home';   // (28 Kas) oyun = sadece koşu; eski köy kapalı   // (23 Kas) eski menü/başlık ekranı artık yok: her 'eve dön' köye döner
    params = params || {};
    const from = active && active.name;
    if (active && active.screen.leave) active.screen.leave();
    const screen = CZ.screens[name];
    active = { name, params, screen };
    root.replaceChildren();
    const el = h('section', { class: 'screen screen-' + name });
    root.append(el);
    CZ.audio.music(screen.music === undefined ? 'menu' : screen.music);
    screen.render(el, params || {});
    window.scrollTo(0, 0);
    // Oyundan menüye dönüş: geçiş reklamı (Subway Surfers gibi, oyuncu basmadan)
    if (CZ.ads && CZ.ads.onExit) {
      if (GAME.includes(name)) CZ.ads.playing();
      else if (from && (GAME.includes(from) || from === 'gold')) CZ.ads.onExit();
    }
  }

  // Daire kapanıp açılan geçiş: malikaneye girerken ve tura başlarken.
  function wipeTo(name, params) {
    const cover = h('div', { class: 'wipe' });
    root.append(cover);
    setTimeout(() => {
      go(name, params);
      cover.classList.add('out');
      root.append(cover);
      setTimeout(() => cover.remove(), 300);
    }, 240);
  }

  // Dil değişince mevcut ekranı yeniden çizer.
  const refresh = () => go(active.name, active.params);

  function toast(text) {
    const el = h('div', { class: 'toast', role: 'status', text });
    root.append(el);
    setTimeout(() => el.remove(), 2200);
  }

  function confirmBox(text, yes, no, onYes, yesCls) {
    const box = h('div', { class: 'modal-wrap' },
      h('div', { class: 'modal' },
        h('p', { text }),
        h('div', { class: 'row' },
          btn(no, () => box.remove(), 'ghost'),
          btn(yes, () => { box.remove(); onYes(); }, yesCls || 'danger'))));
    root.append(box);
  }

  // Ödül uçuşu: kazanılan altın/zümrüt simgeleri ekrandaki sayaca uçar, sayaç zıplar.
  function fly(from, kind, amount) {
    if (!from || !amount) return;
    const r0 = from.getBoundingClientRect();
    const sel = kind === 'gold' ? '.gold-badge' : '.emeralds:not(.gold-badge)';
    const target = [...document.querySelectorAll(sel)].find(el => el.offsetParent && el.getBoundingClientRect().top < window.innerHeight * 0.95);
    const r1 = target ? target.getBoundingClientRect() : { left: window.innerWidth - 60, top: 20, width: 40, height: 30 };
    const x0 = r0.left + r0.width / 2, y0 = r0.top + r0.height / 2;
    const x1 = r1.left + 18, y1 = r1.top + r1.height / 2;
    const count = Math.max(3, Math.min(10, Math.ceil(amount / 6)));
    for (let i = 0; i < count; i++) {
      const icon = img(kind === 'gold' ? 'ui.gold' : 'ui.emerald', 'fly-icon');
      document.body.append(icon);
      const sx = x0 + (Math.random() - 0.5) * 80, sy = y0 + (Math.random() - 0.5) * 40;
      const mx = (sx + x1) / 2 + (Math.random() - 0.5) * 120, my = Math.min(sy, y1) - 60 - Math.random() * 60;
      const anim = icon.animate([
        { transform: `translate(${x0 - 14}px, ${y0 - 14}px) scale(.3)`, opacity: 0 },
        { transform: `translate(${sx - 14}px, ${sy - 14}px) scale(1.2)`, opacity: 1, offset: 0.18 },
        { transform: `translate(${mx - 14}px, ${my - 14}px) scale(1)`, opacity: 1, offset: 0.6 },
        { transform: `translate(${x1 - 14}px, ${y1 - 14}px) scale(.7)`, opacity: 1 }
      ], { duration: 820 + i * 70, easing: 'cubic-bezier(.4,0,.6,1)', delay: i * 45 });
      anim.onfinish = () => {
        icon.remove();
        CZ.audio.sfx('coin', i);
        if (target) {
          target.classList.remove('bump'); void target.offsetWidth; target.classList.add('bump');
          const num = target.querySelector('span');
          if (num && i === count - 1) num.textContent = kind === 'gold' ? (CZ.state.data.gold || 0) : CZ.state.data.emeralds;
        }
      };
    }
  }
  // Ekrana [data-fly] ile eklenen ödüller kendiliğinden uçar.
  function watchRewards(rootEl) {
    new MutationObserver(list => list.forEach(m => m.addedNodes.forEach(node => {
      if (node.nodeType !== 1) return;
      const els = node.matches && node.matches('[data-fly]') ? [node] : [...node.querySelectorAll('[data-fly]')];
      els.forEach(el => {
        if (el.dataset.flown) return;
        el.dataset.flown = '1';
        setTimeout(() => fly(el, el.dataset.fly, Number(el.dataset.n) || 10), 450);
      });
    }))).observe(rootEl, { childList: true, subtree: true });
  }

  // Açılır pencereler kapanırken bir an küçülüp kaybolsun (bütün .modal-wrap ve .pause-menu'ler için)
  (function () {
    const rm = Element.prototype.remove;
    Element.prototype.remove = function () {
      if (this.isConnected && this.classList && (this.classList.contains('modal-wrap') || this.classList.contains('pause-menu')) && !this.classList.contains('closing') && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.classList.add('closing'); this.style.pointerEvents = 'none'; setTimeout(() => rm.call(this), 160); return;
      }
      return rm.call(this);
    };
  })();
  return {
    fly, h, img, btn, emeralds, header, snow, go, wipeTo, refresh, toast, confirmBox, loading,
    mount: el => { root = el; watchRewards(el); },
    get current() { return active && active.name; }
  };
})();
