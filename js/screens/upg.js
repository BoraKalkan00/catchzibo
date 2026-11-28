// (28 Kas) GÜÇ YÜKSELTMELERİ (Subway Surfers gibi): altınla güçlerin süresini uzat.
CZ.PUPS = [
  { id: 'magnet', ic: '🧲', base: 8 }, { id: 'double', ic: '✖️2', base: 10 },
  { id: 'boots', ic: '👟', base: 10 }, { id: 'sleigh', ic: '🛷', base: 9.5 }
];
CZ.PUP_MAX = 6;
CZ.PUP_PRICE = [300, 700, 1500, 3000, 6000, 12000];
CZ.pupLv = k => ((CZ.state.data.pup || {})[k]) || 0;
CZ.pupMul = k => 1 + 0.18 * CZ.pupLv(k);
CZ.screens.upg = {
  music: 'home',
  render(el) {
    const { h, img, btn } = CZ.ui; const t = CZ.t; const d = CZ.state.data;
    const gold = h('b', { text: String(d.gold || 0) });
    const list = h('div', { class: 'upg-list' });
    const draw = () => {
      gold.textContent = d.gold || 0;
      list.replaceChildren(...CZ.PUPS.map(p => {
        const lv = CZ.pupLv(p.id), price = CZ.PUP_PRICE[lv];
        return h('div', { class: 'upg-row' },
          h('span', { class: 'upg-ic', text: p.ic }),
          h('div', { class: 'upg-txt' },
            h('strong', { text: t('run.power.' + p.id).replace(/!$/, '') }),
            h('small', { text: t('upg.sec', { n: (p.base * CZ.pupMul(p.id)).toFixed(1) }) }),
            h('div', { class: 'up-dots' }, Array.from({ length: CZ.PUP_MAX }, (_, i) => h('i', { class: i < lv ? 'on' : '' })))),
          lv >= CZ.PUP_MAX ? h('b', { class: 'up-max', text: t('up.max') }) : btn(String(price), () => {
            if ((d.gold || 0) < price) { CZ.audio.sfx('wrong'); return CZ.ui.toast(t('chars.goldShort', { n: price - (d.gold || 0) })); }
            d.gold -= price; d.pup = d.pup || {}; d.pup[p.id] = lv + 1; CZ.state.save();
            CZ.audio.sfx('win'); CZ.audio.vibrate([30, 20, 50]); draw();
          }, 'primary small', 'ui.gold'));
      }));
    };
    el.append(CZ.ui.header(t('home.upg'), () => CZ.ui.go('home')),
      h('div', { class: 'upg-gold' }, img('ui.gold', 'emerald-icon'), gold),
      h('p', { class: 'upg-note', text: t('upg.note') }),
      h('div', { class: 'scroll' }, list, sledRow()));
    function sledRow() {   // (28 Kas) kızak rengi
      const SK = [['red', 0], ['blue', 800], ['gold', 2500], ['black', 5000]];
      const box = h('div', { class: 'upg-row sled-row' });
      const draw2 = () => box.replaceChildren(h('span', { class: 'upg-ic', text: '🛷' }), h('div', { class: 'upg-txt' }, h('strong', { text: t('upg.sled') }),
        h('div', { class: 'sled-cols' }, SK.map(([id, price]) => {
          const own = id === 'red' || (d.sledOwn || []).includes(id), on = (d.sledSkin || 'red') === id;
          return h('button', { class: 'sled-col sc-' + id + (on ? ' on' : ''), type: 'button', onClick: () => {
            if (!own) { if ((d.gold || 0) < price) { CZ.audio.sfx('wrong'); return CZ.ui.toast(t('chars.goldShort', { n: price - (d.gold || 0) })); } d.gold -= price; d.sledOwn = (d.sledOwn || []).concat(id); CZ.audio.sfx('win'); }
            d.sledSkin = id; CZ.state.save(); draw2(); gold.textContent = d.gold;
          } }, h('i'), own ? null : h('small', { text: String(price) }));
        }))));
      draw2(); return box;
    }
    draw();
  }
};
