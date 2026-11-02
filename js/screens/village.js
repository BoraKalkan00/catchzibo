// Oyuncunun köyü: bulunan eşyalar buraya döner, zümrütle süs alınır.
CZ.screens.village = {
  render(el) {
    const { h, img, btn, header, go } = CZ.ui;
    const t = CZ.t;
    const d = CZ.state.data;
    const returned = CZ.game.rounds().filter(r => CZ.state.isFound(r.id));
    // Yeni dönen eşya köye ilk girişte kutlanır.
    const welcome = d.newReturn;
    if (welcome) {
      d.newReturn = null;
      CZ.state.save();
      this.welcomeTimer = setTimeout(() => CZ.audio.sfx('buy'), 350);
    }

    const buy = item => {
      if (d.emeralds < item.price) return CZ.ui.toast(t('village.need'));
      d.emeralds -= item.price;
      d.decor.push(item.id);
      CZ.state.save();
      CZ.audio.sfx('buy');
      CZ.audio.vibrate(30);
      this.fresh = item.id;
      CZ.ui.refresh();
      CZ.ui.toast(t('village.bought'));
    };

    // Yeni süs yukarıdan düşer, kar tozu çıkarır.
    const fresh = this.fresh;
    this.fresh = null;

    const placed = CZ.SHOP.filter(item => d.decor.includes(item.id)).map(item => {
      const isNew = item.id === fresh;
      const pic = img('village.' + item.id, 'decor' + (isNew ? ' decor-new' : ''), t('decor.' + item.id));
      pic.style.cssText = `left:${item.x}%;top:${item.y}%;width:${item.size}%`;
      return pic;
    });
    const dust = [];
    if (fresh) {
      const spot = CZ.SHOP.find(item => item.id === fresh);
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * Math.PI * 2;
        const bit = h('i', { class: 'puff decor-puff' });
        bit.style.cssText = `left:${spot.x}%;top:${spot.y + spot.size * 0.35}%;--dx:${Math.cos(a) * 62}px;--dy:${Math.sin(a) * 30}px;--z:1.3;animation-delay:.28s`;
        dust.push(bit);
      }
    }

    const row = item => {
      const owned = d.decor.includes(item.id);
      return h('div', { class: 'shop-row' + (owned ? ' owned' : '') },
        img('village.' + item.id, 'shop-img'),
        h('strong', { text: t('decor.' + item.id) }),
        owned
          ? h('span', { class: 'owned-tag', text: t('village.owned') })
          : h('button', {
            class: 'buy' + (d.emeralds < item.price ? ' poor' : ''),
            type: 'button',
            'aria-label': t('village.buy') + ': ' + t('decor.' + item.id),
            onClick: () => buy(item)
          }, img('ui.emerald', 'emerald-icon'), String(item.price)));
    };

    el.append(
      header(t('village.title'), () => go('hub')),
      h('div', { class: 'scroll village-scroll' },
        h('div', { class: 'village-scene' }, img('scene.village', 'village-bg'), placed, dust),
        h('h2', { class: 'section-title', text: t('village.returned') }),
        returned.length
          ? h('div', { class: 'returned' }, returned.map(r => h('span', { class: 'returned-slot' + (r.id === welcome ? ' fresh' : '') },
            img('item.' + r.target, 'returned-img', t(`item.${r.target}.name`)),
            r.id === welcome ? h('b', { text: t('village.new') }) : null)))
          : h('p', { class: 'section-note', text: t('village.returnedEmpty') }),
        h('h2', { class: 'section-title', text: t('village.shop') }),
        h('div', { class: 'shop' }, CZ.SHOP.map(row)),
        btn(t('hub.enter'), () => go('mansion'), 'primary wide')));
  },
  leave() {
    clearTimeout(this.welcomeTimer);
  }
};
