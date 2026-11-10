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

  function go(name, params) {
    params = params || {};
    if (active && active.screen.leave) active.screen.leave();
    const screen = CZ.screens[name];
    active = { name, params, screen };
    root.replaceChildren();
    const el = h('section', { class: 'screen screen-' + name });
    root.append(el);
    CZ.audio.music(screen.music === undefined ? 'menu' : screen.music);
    screen.render(el, params || {});
    window.scrollTo(0, 0);
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

  return {
    fly, h, img, btn, emeralds, header, snow, go, wipeTo, refresh, toast, confirmBox,
    mount: el => { root = el; watchRewards(el); },
    get current() { return active && active.name; }
  };
})();
