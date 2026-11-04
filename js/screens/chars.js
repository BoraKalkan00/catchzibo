// KARAKTERLER: Subway Surfers gibi hazır karakter kadrosu (Gemini çizimleri).
// Erkek ve kız baştan açık; diğerleri malikanedeki odaları bitirince açılır.
// Çizimi henüz gelmeyen karakter "Yakında" görünür (CZ.CHAR_ART listesine eklenince açılır).
CZ.ROSTER = [
  { id: 'boy' },
  { id: 'girl' },
  { id: 'elf', room: 'living' },
  { id: 'snowkid', room: 'kitchen' },
  { id: 'reindeer', room: 'attic' },
  { id: 'knight', room: 'treasure' },
  { id: 'santa', room: 'throne' }
];
CZ.CHAR_ART = ['boy', 'girl', 'elf', 'snowkid', 'reindeer', 'knight'];               // assets/chars/<id>_front.webp ... olanlar
// Oda ödülü artık karakter: odayı bitiren o karakteri açar.
CZ.ROOM_PRIZES = {};
CZ.ROSTER.forEach(c => { if (c.room) CZ.ROOM_PRIZES[c.room] = c.id; });

CZ.chars = (function () {
  const hasArt = id => CZ.CHAR_ART.includes(id);
  function state(c) {
    if (!c.room) return 'open';
    const room = CZ.ROOMS.find(r => r.id === c.room);
    if (!room || !CZ.game.roomDone(room)) return 'locked';
    return hasArt(c.id) ? 'open' : 'soon';
  }
  const front = id => hasArt(id) ? CZ.art('char.' + id + '_front') : CZ.art('char.boy_front');
  return { state, hasArt, front };
})();
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
        owned ? (worn[this.part] === color ? h('b', { text: '✓' }) : null)
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
          : t('chars.finishRoom', { room: t('room.' + c.room) });
      return h('button', {
        class: 'char-card ' + st + (selected ? ' selected' : ''), type: 'button',
        onClick: () => {
          if (st === 'locked') { CZ.audio.sfx('wrong'); return CZ.ui.toast(label); }
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
      st !== 'open' ? h('span', { class: 'char-lock', text: st === 'soon' ? '✨' : '🔒' }) : null,
      h('span', { class: 'char-label', text: label }));
    };
    el.append(
      CZ.ui.header(t('chars.title'), () => { this.trying = null; CZ.ui.go(params && params.returnTo ? params.returnTo : 'hub'); }),
      preview,
      h('div', { class: 'scroll chars-body' }, colorPanel, h('div', { class: 'chars-grid' }, CZ.ROSTER.map(card))));
  }
};
