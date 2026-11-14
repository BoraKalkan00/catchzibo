// KARAKTERLER: Subway Surfers gibi hazır karakter kadrosu (Gemini çizimleri).
// Erkek ve kız baştan açık; diğerleri malikanedeki odaları bitirince açılır.
// Çizimi henüz gelmeyen karakter "Yakında" görünür (CZ.CHAR_ART listesine eklenince açılır).
CZ.ROSTER = [
  { id: 'boy' },
  { id: 'girl' },
  // Subway Surfers ekonomisi: koşu başına ~100-200 altın, karakter binlerce altın (uzun hedef).
  { id: 'elf', room: 'living', gems: 300, gold: 3000 },
  { id: 'snowkid', room: 'kitchen', gems: 600, gold: 6000 },
  { id: 'reindeer', room: 'attic', gems: 900, gold: 9000 },
  { id: 'knight', room: 'treasure', gems: 1400, gold: 14000 },
  { id: 'santa', room: 'throne', gems: 2000, gold: 20000 }
];
CZ.CHAR_ART = ['boy', 'girl', 'elf', 'snowkid', 'reindeer', 'knight', 'santa'];               // assets/chars/<id>_front.webp ... olanlar
// Oda ödülü artık karakter: odayı bitiren o karakteri açar.
CZ.ROOM_PRIZES = {};
CZ.ROSTER.forEach(c => { if (c.room) CZ.ROOM_PRIZES[c.room] = c.id; });

// Altınla elmas al: 1000 altın = 100 elmas (her şey ikisiyle de alınabilsin).
CZ.EXCHANGE = { gold: 1000, gems: 100 };
CZ.exchange = function (done) {
  const { h, btn, img } = CZ.ui;
  const t = CZ.t, d = CZ.state.data, X = CZ.EXCHANGE;
  const max = Math.floor((d.gold || 0) / X.gold);
  const deal = n => {
    if (n < 1 || (d.gold || 0) < n * X.gold) { CZ.audio.sfx('wrong'); return CZ.ui.toast(t('chars.goldShort', { n: n * X.gold - (d.gold || 0) })); }
    d.gold -= n * X.gold; d.emeralds = (d.emeralds || 0) + n * X.gems; CZ.state.save();
    CZ.audio.sfx('buy'); CZ.ui.toast(t('swap.done', { n: n * X.gems }));
    box.remove(); if (done) done();
  };
  const box = h('div', { class: 'modal-wrap' },
    h('div', { class: 'modal swap' },
      h('h3', { text: t('swap.title') }),
      h('div', { class: 'swap-rate' }, img('ui.gold', 'emerald-icon'), h('b', { text: String(X.gold) }), h('span', { text: '→' }), img('ui.emerald', 'emerald-icon'), h('b', { text: String(X.gems) })),
      h('p', { text: t('swap.have', { g: d.gold || 0, e: d.emeralds || 0 }) }),
      btn(t('swap.one', { g: X.gold, e: X.gems }), () => deal(1), 'primary wide'),
      max > 1 ? btn(t('swap.all', { g: max * X.gold, e: max * X.gems }), () => deal(max), 'ghost-dark wide') : null,
      btn(t('common.cancel'), () => box.remove(), 'small ghost')));
  (document.getElementById('app') || document.body).append(box);
};

CZ.chars = (function () {
  const hasArt = id => CZ.CHAR_ART.includes(id);
  function state(c) {
    if (!c.room) return 'open';
    if ((CZ.state.data.boughtChars || []).includes(c.id)) return hasArt(c.id) ? 'open' : 'soon';
    const room = CZ.ROOMS.find(r => r.id === c.room);
    if (!room || !CZ.game.roomDone(room)) return 'locked';
    return hasArt(c.id) ? 'open' : 'soon';
  }
  const front = id => hasArt(id) ? CZ.art('char.' + id + '_front') : CZ.art('char.boy_front');
  // Odayı bitirmeyi beklemek istemeyen elmasla hemen açar.
  // Kilitli karakter: odayı bitir (bedava) ya da altınla / elmasla hemen al.
  function buy(c, done) {
    const d = CZ.state.data;
    const { h, btn, img } = CZ.ui;
    const t = CZ.t;
    const got = () => {
      d.boughtChars = (d.boughtChars || []).concat(c.id);
      d.avatar = c.id;
      CZ.state.save();
      CZ.audio.sfx('win'); CZ.audio.vibrate([30, 20, 60]);
      box.remove();
      if (done) done();
    };
    const box = h('div', { class: 'modal-wrap' },
      h('div', { class: 'modal char-buy' },
        h('img', { class: 'char-buy-img', src: front(c.id), alt: '' }),
        h('h3', { text: t('char.' + c.id) }),
        h('p', { text: t('chars.buyAsk', { room: t('room.' + c.room), n: c.gems }) }),
        btn(String(c.gold), () => {
          if ((d.gold || 0) < c.gold) { CZ.audio.sfx('wrong'); return CZ.ui.toast(t('chars.goldShort', { n: c.gold - (d.gold || 0) })); }
          d.gold -= c.gold; got();
        }, 'primary wide', 'ui.gold'),
        btn(String(c.gems), () => {
          if ((d.emeralds || 0) < c.gems) { CZ.audio.sfx('wrong'); CZ.ui.toast(t('chars.gemShort', { n: c.gems - (d.emeralds || 0) })); box.remove(); return CZ.exchange(); }
          d.emeralds -= c.gems; got();
        }, 'ghost-dark wide', 'ui.emerald'),
        btn(t('common.cancel'), () => box.remove(), 'small ghost')));
    (document.getElementById('app') || document.body).append(box);
  }
  return { state, hasArt, front, buy };
})();
// KARAKTER SEVİYELERİ: her karakterin tek bir yeteneği var, 1→10 seviye altınla yükselir.
CZ.CHAR_PERKS = {
  boy: { type: 'gold', per: 0.05 },      // koşuda altın +%5 / seviye
  girl: { type: 'time', per: 0.5 },      // odada +0,5 sn / seviye
  elf: { type: 'lens', per: 0.2 },       // eşya parlaması +0,2 sn / seviye (büyüteç olmadan da)
  snowkid: { type: 'head', per: 2 },     // kovalamacaya Zibo'ya 2 m daha yakın başla / seviye
  reindeer: { type: 'sled', per: 0.08 }, // kızak %8 daha hızlı dolar / seviye
  knight: { type: 'power', per: 0.4 },   // silah gücü +0,4 / seviye
  santa: { type: 'gems', per: 0.08 }     // zümrüt ödülü +%8 / seviye
};
CZ.CHAR_MAX = 10;
CZ.charLevel = id => Math.min(CZ.CHAR_MAX, ((CZ.state.data.charLv || {})[id]) || 1);
CZ.charUpPrice = lvl => Math.round(100 * Math.pow(1.6, lvl - 1) / 10) * 10;
// Seçili karakterin bu türdeki bonusu (yoksa 0).
CZ.charPerk = type => {
  const id = CZ.state.data.avatar || 'girl';
  const p = CZ.CHAR_PERKS[id];
  return p && p.type === type ? p.per * CZ.charLevel(id) : 0;
};
CZ.perkText = id => {
  const p = CZ.CHAR_PERKS[id];
  const v = p.per * CZ.charLevel(id);
  const n = p.type === 'gold' || p.type === 'sled' || p.type === 'gems' ? Math.round(v * 100) : Math.round(v * 10) / 10;
  return CZ.t('perk.' + p.type, { n });
};

// Kostüm bonusları eski gardıroptandı; karakterlerin bonusu şimdilik yok.
if (CZ.closet) CZ.closet.perk = () => ({});

CZ.screens.chars = {
  music: 'home',
  part: 'jacket',
  trying: null,
  render(el, params) {
    const { h, img, btn } = CZ.ui;
    const t = CZ.t;
    const d = CZ.state.data;
    const me = d.avatar || 'girl';
    const CA = CZ.charArt;
    const canColor = !!CZ.PART_RULES[me];
    const worn = Object.assign({}, CZ.PART_ORIG[me] || {}, CA.colorsOf(me));
    const look = this.trying ? Object.assign({}, worn, { [this.trying.part]: this.trying.color }) : worn;
    const preview = h('div', { class: 'chars-stage' },
      h('div', { class: 'emeralds gold-badge chars-gold' }, img('ui.gold', 'emerald-icon'), h('span', { class: 'emerald-count', text: d.gold || 0 })),
      h('button', { class: 'swap-btn', type: 'button', onClick: () => { CZ.audio.sfx('button'); CZ.exchange(() => CZ.ui.refresh()); } }, img('ui.gold', 'mini-ico'), h('span', { text: '→' }), img('ui.emerald', 'mini-ico')),
      CA.img(me, 'wave', 'chars-hero', look),
      h('div', { class: 'chars-name' }, h('strong', { text: t('char.' + me) }), h('small', { text: t('chars.selected') })));
    // Seviye paneli
    const lvl = CZ.charLevel(me);
    const upPrice = CZ.charUpPrice(lvl);
    const levelPanel = h('div', { class: 'char-level' },
      h('div', { class: 'char-lv-badge', text: t('perk.lv', { n: lvl }) }),
      h('div', { class: 'char-lv-text' },
        h('strong', { text: CZ.perkText(me) }),
        h('div', { class: 'up-dots' }, Array.from({ length: CZ.CHAR_MAX }, (_, i) => h('i', { class: i < lvl ? 'on' : '' })))),
      lvl >= CZ.CHAR_MAX ? h('b', { class: 'up-max', text: t('up.max') })
        : btn(String(upPrice), () => {
          if ((d.gold || 0) < upPrice) { CZ.audio.sfx('wrong'); return CZ.ui.toast(t('perk.short', { n: upPrice - (d.gold || 0) })); }
          d.gold -= upPrice;
          d.charLv = d.charLv || {};
          d.charLv[me] = lvl + 1;
          CZ.state.save();
          CZ.audio.sfx('win'); CZ.audio.vibrate([30, 20, 50]);
          CZ.ui.refresh();
          CZ.ui.toast(t('perk.up', { n: lvl + 1 }));
        }, 'primary small', 'ui.gold'));

    // Renk paneli: mont / bere / atkı
    let colorPanel = null;
    if (canColor) {
      const orig = CZ.PART_ORIG[me][this.part];
      const list = [orig].concat(Object.keys(CZ.COLOR_PRICES[this.part]).filter(c => c !== orig));
      const sw = color => {
        const isOrig = color === orig;
        const owned = isOrig || CA.owns(this.part, color);
        const on = look[this.part] === color;
        const price = CZ.COLOR_PRICES[this.part][color];
        return h('button', {
          class: 'swatch' + (on ? ' on' : '') + (owned ? ' owned' : ''), type: 'button',
          onClick: () => {
            CZ.audio.sfx('button');
            if (owned) { this.trying = null; CA.equip(me, this.part, color); if (CZ.quests) CZ.quests.track('wardrobe'); }
            else this.trying = { part: this.part, color };
            CZ.ui.refresh();
          }
        },
        h('i', { style: 'background:#' + CZ.COLORS[color].hex.toString(16).padStart(6, '0') }),
        owned ? (worn[this.part] === color ? CZ.icon('check', 'swatch-ok') : null)
          : h('small', { class: 'swatch-price' }, img(price.gold ? 'ui.gold' : 'ui.emerald', 'mini-ico'), String(price.gold || price.emeralds)));
      };
      const tabs = h('div', { class: 'part-tabs' }, ['jacket', 'hat', 'scarf'].map(p => h('button', {
        class: 'part-tab' + (p === this.part ? ' on' : ''), type: 'button',
        onClick: () => { this.part = p; this.trying = null; CZ.audio.sfx('button'); CZ.ui.refresh(); }
      }, t('part.color.' + p))));
      let buyBar = null;
      if (this.trying) {
        const { part, color } = this.trying;
        const price = CZ.COLOR_PRICES[part][color];
        buyBar = h('div', { class: 'buy-bar' },
          h('span', { text: t('color.' + color) + ' ' + t('part.color.' + part) }),
          btn(String(price.gold || price.emeralds), () => {
            const r = CA.buy(part, color);
            if (r !== 'ok') { CZ.audio.sfx('wrong'); return CZ.ui.toast(t(r === 'gold' ? 'gold.need' : 'gold.gemNeed')); }
            CA.equip(me, part, color);
            this.trying = null;
            CZ.audio.sfx('buy');
            CZ.audio.vibrate(30);
            if (CZ.quests) CZ.quests.track('wardrobe');
            CZ.ui.toast(t('chars.bought'));
            CZ.ui.refresh();
          }, 'primary small', price.gold ? 'ui.gold' : 'ui.emerald'),
          btn('✕', () => { this.trying = null; CZ.ui.refresh(); }, 'ghost-dark small'));
      }
      colorPanel = h('div', { class: 'color-panel' }, tabs, h('div', { class: 'swatches' }, list.map(sw)), buyBar);
    }

    const card = c => {
      const st = CZ.chars.state(c);
      const selected = c.id === me;
      const label = st === 'open' ? t('char.' + c.id)
        : st === 'soon' ? t('chars.soon')
          : null;
      return h('button', {
        class: 'char-card ' + st + (selected ? ' selected' : ''), type: 'button',
        onClick: () => {
          if (st === 'locked') { CZ.audio.sfx('button'); return CZ.chars.buy(c, () => CZ.ui.refresh()); }
          if (st === 'soon') { CZ.audio.sfx('button'); return CZ.ui.toast(t('chars.soonNote')); }
          if (selected) return;
          d.avatar = c.id;
          this.trying = null;
          CZ.state.save();
          CZ.audio.sfx('buy');
          if (CZ.quests) CZ.quests.track('wardrobe');
          if (params && params.returnTo) return CZ.ui.go(params.returnTo);
          CZ.ui.refresh();
        }
      },
      st === 'open' && CZ.chars.hasArt(c.id) ? CA.img(c.id, 'front', 'char-img') : h('img', { class: 'char-img', src: CZ.chars.front(c.id), alt: '' }),
      st !== 'open' ? (st === 'soon' ? h('span', { class: 'char-lock', text: '…' }) : CZ.icon('lock', 'char-lock')) : null,
      st === 'open' ? h('span', { class: 'char-lv-mini', text: t('perk.lv', { n: CZ.charLevel(c.id) }) }) : null,
      label ? h('span', { class: 'char-label', text: label }) : h('span', { class: 'char-label price' }, CZ.ui.img('ui.gold', 'mini-ico'), c.gold >= 1000 ? (c.gold / 1000) + 'K' : String(c.gold)));
    };
    el.append(
      CZ.ui.header(t('chars.title'), () => { this.trying = null; CZ.ui.go(params && params.returnTo ? params.returnTo : 'hub'); }),
      preview,
      levelPanel,
      h('div', { class: 'scroll chars-body' }, colorPanel, h('div', { class: 'chars-grid' }, CZ.ROSTER.map(card))));
  }
};
