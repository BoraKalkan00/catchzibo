// KARAKTERLER: Subway Surfers gibi hazır karakter kadrosu (Gemini çizimleri).
// Erkek ve kız baştan açık; diğerleri malikanedeki odaları bitirince açılır.
// Çizimi henüz gelmeyen karakter "Yakında" görünür (CZ.CHAR_ART listesine eklenince açılır).
CZ.ROSTER = [
  { id: 'boy' },
  { id: 'girl' },
  { id: 'elf', room: 'living', gems: 60 },
  { id: 'snowkid', room: 'kitchen', gems: 90 },
  { id: 'reindeer', room: 'attic', gems: 130 },
  { id: 'knight', room: 'treasure', gems: 180 },
  { id: 'santa', room: 'throne', gems: 250 }
];
CZ.CHAR_ART = ['boy', 'girl', 'elf', 'snowkid', 'reindeer', 'knight', 'santa'];               // assets/chars/<id>_front.webp ... olanlar
// Oda ödülü artık karakter: odayı bitiren o karakteri açar.
CZ.ROOM_PRIZES = {};
CZ.ROSTER.forEach(c => { if (c.room) CZ.ROOM_PRIZES[c.room] = c.id; });

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
  function buy(c, done) {
    const d = CZ.state.data;
    CZ.ui.confirmBox(CZ.t('chars.buyAsk', { room: CZ.t('room.' + c.room), n: c.gems }), String(c.gems), CZ.t('common.no'), () => {
      if ((d.emeralds || 0) < c.gems) { CZ.audio.sfx('wrong'); return CZ.ui.toast(CZ.t('chars.gemShort', { n: c.gems - (d.emeralds || 0) })); }
      d.emeralds -= c.gems;
      d.boughtChars = (d.boughtChars || []).concat(c.id);
      d.avatar = c.id;
      CZ.state.save();
      CZ.audio.sfx('win'); CZ.audio.vibrate([30, 20, 60]);
      if (done) done();
    }, 'primary');
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
      label ? h('span', { class: 'char-label', text: label }) : h('span', { class: 'char-label price' }, CZ.ui.img('ui.emerald', 'mini-ico'), String(c.gems)));
    };
    el.append(
      CZ.ui.header(t('chars.title'), () => { this.trying = null; CZ.ui.go(params && params.returnTo ? params.returnTo : 'hub'); }),
      preview,
      levelPanel,
      h('div', { class: 'scroll chars-body' }, colorPanel, h('div', { class: 'chars-grid' }, CZ.ROSTER.map(card))));
  }
};
