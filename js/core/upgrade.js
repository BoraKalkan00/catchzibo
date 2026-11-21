// Ayrıntılı yükseltme kartı: şimdiki → sonraki resim, seviye, her sayının öncesi/sonrası, fiyat (eksikler kırmızı), süre, düğmeler.
(function () {
  const { h } = CZ.ui;
  const num = v => typeof v === 'number' ? v : parseFloat(String(v).replace(/[^\d.-]/g, ''));
  function card(o) {
    const t = CZ.t;
    const old = (o.parent || document.body).querySelector('.upg-wrap'); if (old) old.remove();
    const wrap = h('div', { class: 'modal-wrap upg-wrap', onClick: e => { if (e.target === wrap) close(); } });
    const close = () => { wrap.remove(); if (o.onClose) o.onClose(); };
    const pic = (src, lv, cls) => h('div', { class: 'upg-pic ' + (cls || '') },
      src ? h('img', { src, alt: '', onError: e => { e.target.style.visibility = 'hidden'; } }) : h('i', { class: 'upg-emoji', text: o.emoji || '🏠' }),
      h('span', { class: 'upg-lv', text: lv > 0 ? t('vil.lv', { n: lv }) : t('vil.notBuilt') }));
    const isMax = o.to == null;
    const top = h('div', { class: 'upg-pics' }, pic(o.imgFrom, o.from), isMax ? null : h('b', { class: 'upg-arrow', text: '➜' }), isMax ? null : pic(o.imgTo, o.to, 'next'));
    const rows = (o.rows || []).map(([label, a, b]) => {
      const up = !isMax && b != null && String(a) !== String(b);
      const diff = up && !isNaN(num(a)) && !isNaN(num(b)) ? num(b) - num(a) : null;
      return h('div', { class: 'upg-row' + (up ? ' up' : '') },
        h('span', { class: 'upg-k', text: label }),
        h('b', { class: 'upg-a', text: a == null || a === '' ? '—' : String(a) }),
        isMax ? null : h('b', { class: 'upg-b', text: b == null ? '—' : String(b) }),
        diff ? h('i', { class: 'upg-d', text: (diff > 0 ? '+' : '') + (Math.round(diff * 100) / 100) }) : null);
    });
    const cost = isMax ? [] : (o.cost || []).map(c => h('span', { class: 'upg-c' + (c.have != null && c.have < c.n ? ' lack' : '') },
      c.icon && c.icon.startsWith('ui.') ? CZ.ui.img(c.icon, 'mini-ico') : c.icon && /\.webp$/.test(c.icon) ? h('img', { class: 'mini-ico', src: c.icon, alt: '' }) : h('i', { text: c.icon || '' }),
      h('b', { text: String(c.n) }), c.have != null ? h('small', { text: ' / ' + Math.floor(c.have) }) : null));
    wrap.append(h('div', { class: 'modal upg-card' },
      h('b', { class: 'lg-title', text: o.title }),
      o.desc ? h('p', { class: 'upg-desc', text: o.desc }) : null,
      top,
      isMax ? h('p', { class: 'upg-max', text: t('upg.max') }) : null,
      rows.length ? h('div', { class: 'upg-table' }, h('div', { class: 'upg-row upg-head' }, h('span', {}), h('small', { text: t('upg.now') }), isMax ? null : h('small', { text: t('upg.next') })), ...rows) : null,
      cost.length ? h('div', { class: 'upg-costs' }, h('small', { text: t('upg.cost') }), ...cost) : null,
      !isMax && o.time ? h('p', { class: 'upg-time', text: '⏱ ' + o.time }) : null,
      o.note ? h('p', { class: 'small-note', text: o.note }) : null,
      ...(o.actions || []),
      CZ.ui.btn(t('common.close'), close, 'small ghost-dark')));
    (o.parent || document.body).append(wrap);
    return close;
  }
  CZ.upgradeCard = card;
})();
