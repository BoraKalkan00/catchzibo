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
CZ.CHAR_ART = ['boy', 'girl'];               // assets/chars/<id>_front.webp ... olanlar
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
  render(el, params) {
    const { h, img } = CZ.ui;
    const t = CZ.t;
    const d = CZ.state.data;
    const me = d.avatar || 'girl';
    const preview = h('div', { class: 'chars-stage' },
      h('img', { class: 'chars-hero', src: CZ.art('char.' + me + '_wave'), alt: '' }),
      h('div', { class: 'chars-name' }, h('strong', { text: t('char.' + me) }), h('small', { text: t('chars.selected') })));
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
          CZ.state.save();
          CZ.audio.sfx('buy');
          if (CZ.quests) CZ.quests.track('wardrobe');
          if (params && params.returnTo) return CZ.ui.go(params.returnTo);
          CZ.ui.refresh();
        }
      },
      h('img', { class: 'char-img', src: CZ.chars.front(c.id), alt: '' }),
      st !== 'open' ? h('span', { class: 'char-lock', text: st === 'soon' ? '✨' : '🔒' }) : null,
      h('span', { class: 'char-label', text: label }));
    };
    el.append(
      CZ.ui.header(t('chars.title'), () => CZ.ui.go(params && params.returnTo ? params.returnTo : 'hub')),
      preview,
      h('div', { class: 'scroll chars-grid' }, CZ.ROSTER.map(card)));
  }
};
