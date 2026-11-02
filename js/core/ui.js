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
    }, iconKey ? img(iconKey, 'btn-icon') : null, h('span', { text: label }));
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

  function confirmBox(text, yes, no, onYes) {
    const box = h('div', { class: 'modal-wrap' },
      h('div', { class: 'modal' },
        h('p', { text }),
        h('div', { class: 'row' },
          btn(no, () => box.remove(), 'ghost'),
          btn(yes, () => { box.remove(); onYes(); }, 'danger'))));
    root.append(box);
  }

  return {
    h, img, btn, emeralds, header, snow, go, wipeTo, refresh, toast, confirmBox,
    mount: el => { root = el; },
    get current() { return active && active.name; }
  };
})();
