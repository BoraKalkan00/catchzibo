// YARDIMCI HAYVANLAR: bir tanesi yanına gelir. Altınla alınır, 1→5 seviye.
//  penguen: odada eşyanın yerini koklar (belli aralıkla eşya parlar)
//  baykuş:  gece modunda feneri büyütür + odada ek süre
//  tilki:   kovalamacada belli aralıkla Zibo'ya atılır, onu yaklaştırır
CZ.PETS = [
  { id: 'penguin', price: 800, upBase: 300 },
  { id: 'owl', price: 1200, upBase: 400 },
  { id: 'fox', price: 1600, upBase: 500 }
];
CZ.PET_MAX = 5;
CZ.petArt = (id, pose) => 'assets/pets/' + id + '_' + pose + '.webp';
CZ.petOwned = id => ((CZ.state.data.pets || {})[id] || 0) > 0;
CZ.petLevel = id => (CZ.state.data.pets || {})[id] || 0;
// Seçili yardımcı (yoksa null) ve seviyesi
CZ.activePet = () => {
  const id = CZ.state.data.pet;
  return id && CZ.petOwned(id) ? { id, lvl: CZ.petLevel(id) } : null;
};
CZ.petUpPrice = (p, lvl) => Math.round(p.upBase * Math.pow(1.8, lvl - 1) / 10) * 10;
// Etki değerleri
CZ.petFx = {
  sniffEvery: lvl => Math.max(4, 9 - lvl),          // penguen: kaç saniyede bir koklar
  owlLight: lvl => 1 + lvl * 0.12,                   // baykuş: fener çapı çarpanı
  owlTime: lvl => lvl * 0.5,                         // baykuş: odada ek saniye
  foxEvery: lvl => Math.max(3.5, 8 - lvl * 0.8),     // tilki: kaç saniyede bir atılır
  foxPull: lvl => 3 + lvl                            // tilki: kaç metre yaklaştırır
};

// Odada köşede duran yardımcı (play.js kullanır)
CZ.petInRoom = function (room) {
  const pet = CZ.activePet();
  if (!pet) return null;
  const el = CZ.ui.h('img', { class: 'room-pet', src: CZ.petArt(pet.id, 'front'), alt: '', draggable: 'false' });
  room.append(el);
  return {
    pet,
    el,
    cheer() {
      el.src = CZ.petArt(pet.id, 'happy');
      el.classList.remove('cheer'); void el.offsetWidth; el.classList.add('cheer');
      setTimeout(() => { el.src = CZ.petArt(pet.id, 'front'); }, 900);
    }
  };
};

CZ.screens.pets = (function () {
  const { h, img, btn } = CZ.ui;
  const t = CZ.t;
  function render(el) {
    const d = CZ.state.data;
    d.pets = d.pets || {};
    const card = p => {
      const lvl = CZ.petLevel(p.id);
      const owned = lvl > 0;
      const active = d.pet === p.id;
      let action;
      if (!owned) {
        action = btn(String(p.price), () => {
          if ((d.gold || 0) < p.price) { CZ.audio.sfx('wrong'); return CZ.ui.toast(t('perk.short', { n: p.price - (d.gold || 0) })); }
          d.gold -= p.price; d.pets[p.id] = 1; d.pet = p.id; CZ.state.save();
          CZ.audio.sfx('win'); CZ.audio.vibrate([30, 20, 60]);
          CZ.ui.refresh();
        }, 'gold small', 'ui.gold');
      } else if (lvl < CZ.PET_MAX) {
        const price = CZ.petUpPrice(p, lvl);
        action = btn(String(price), () => {
          if ((d.gold || 0) < price) { CZ.audio.sfx('wrong'); return CZ.ui.toast(t('perk.short', { n: price - (d.gold || 0) })); }
          d.gold -= price; d.pets[p.id] = lvl + 1; CZ.state.save();
          CZ.audio.sfx('win'); CZ.ui.refresh(); CZ.ui.toast(t('perk.up', { n: lvl + 1 }));
        }, 'primary small', 'ic:up');
      } else action = h('b', { class: 'up-max', text: t('up.max') });
      return h('div', { class: 'pet-card' + (active ? ' active' : '') + (owned ? '' : ' locked') },
        h('button', { class: 'pet-pic', type: 'button', onClick: () => {
          if (!owned) return;
          d.pet = active ? null : p.id; CZ.state.save(); CZ.audio.sfx('buy'); CZ.ui.refresh();
        } }, h('img', { src: CZ.petArt(p.id, active ? 'happy' : 'front'), alt: '', draggable: 'false' }),
          owned ? h('span', { class: 'char-lv-mini', text: t('perk.lv', { n: lvl }) }) : null,
          active ? CZ.icon('check', 'pet-on') : null),
        h('div', { class: 'pet-text' },
          h('strong', { text: t('pet.' + p.id) }),
          h('small', { text: t('pet.' + p.id + '.desc') }),
          owned ? h('div', { class: 'up-dots' }, Array.from({ length: CZ.PET_MAX }, (_, i) => h('i', { class: i < lvl ? 'on' : '' }))) : null,
          owned ? h('em', { class: 'pet-hint', text: active ? t('pet.with') : t('pet.tapToTake') }) : null),
        action);
    };
    el.append(
      CZ.ui.header(t('pet.title'), () => CZ.ui.go('hub')),
      h('div', { class: 'scroll pets-list' },
        h('div', { class: 'gold-line' }, img('ui.gold', 'mini-ico'), String(d.gold || 0)),
        CZ.PETS.map(card)));
  }
  return { render };
})();
