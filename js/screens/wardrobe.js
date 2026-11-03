// GARDIROP (Duolingo tarzı karakter tasarımı): yüz, saç modeli, saç rengi, göz, kaş, ağız, aksesuar, şapka, ten, kostüm.
// Bedava seçenekler hemen giyilir; elmaslı olanlar önce denenir, sonra alınır.
CZ.screens.wardrobe = {
  render(el, params) {
    const { h, img, btn } = CZ.ui;
    const t = CZ.t;
    const d = CZ.state.data;
    if (!d.look) d.look = {};
    if (!d.lookOwned) d.lookOwned = {};
    CZ.LOOK_TABS.forEach(k => { if (!d.lookOwned[k]) d.lookOwned[k] = []; });
    const owns = (k, item) => item.price === 0 || d.lookOwned[k].includes(item.id);
    const tab = params.tab || this.tab || 'style';
    this.tab = tab;
    const kind = d.avatar || 'girl';
    const preview = this.preview || null;
    this.preview = null;
    const L = Object.assign({}, d.look, preview || {});
    const front = h('img', { class: 'ward-front', src: CZ.avatarArt.url(kind, L), alt: '' });
    const backImg = h('img', { class: 'ward-back', src: CZ.avatarArt.url(kind + '_run1', L), alt: '' });
    let f = 0;
    clearInterval(this.anim);
    this.anim = setInterval(() => { f = 1 - f; backImg.src = CZ.avatarArt.url(kind + (f ? '_run2' : '_run1'), L); }, 160);

    const colorTab = ['hair', 'eyes', 'skin'].includes(tab);
    const items = CZ.LOOKS[tab].map(item => {
      const owned = owns(tab, item);
      const current = d.look[tab] || CZ.LOOKS[tab][0].id;
      const on = current === item.id;
      const trying = preview && preview[tab] === item.id;
      let face;
      if (colorTab) {
        const fallback = tab === 'hair' ? (kind === 'girl' ? '#8a4a24' : '#3b2a20') : '#ccc';
        face = h('i', { class: 'ward-swatch', style: `--c:${item.c || fallback}` });
      } else {
        // Küçük önizleme: o seçenekle karakterin kendisi
        const look = Object.assign({}, d.look, { [tab]: item.id }, tab === 'style' ? { hat: 'none' } : {});
        face = h('img', { class: 'ward-cost' + (tab === 'costume' ? '' : ' head'), src: CZ.avatarArt.url(kind, look), alt: '' });
      }
      return h('button', {
        class: 'ward-item' + (on ? ' on' : '') + (trying ? ' trying' : '') + (colorTab ? '' : ' big'), type: 'button',
        'aria-label': colorTab ? t('look.tab.' + tab) : t('look.' + tab + '.' + item.id),
        onClick: () => {
          CZ.audio.sfx('button');
          if (owned) { d.look[tab] = item.id; CZ.state.save(); CZ.ui.refresh(); return; }
          this.preview = { [tab]: item.id };
          CZ.ui.refresh();
        }
      }, face,
      colorTab ? null : h('span', { class: 'ward-name', text: t('look.' + tab + '.' + item.id) }),
      owned ? null : h('small', {}, img('ui.emerald', 'swatch-gold'), String(item.price)));
    });

    let buyBar = '';
    if (preview) {
      const id = preview[tab];
      const item = CZ.LOOKS[tab].find(x => x.id === id);
      buyBar = h('div', { class: 'ward-buy' },
        h('span', { text: t('look.try') }),
        btn(t('common.cancel'), () => CZ.ui.refresh(), 'small ghost'),
        h('button', {
          class: 'btn small primary', type: 'button',
          onClick: () => {
            if ((d.emeralds || 0) < item.price) { CZ.audio.sfx('wrong'); return CZ.ui.toast(t('look.need')); }
            d.emeralds -= item.price;
            d.lookOwned[tab].push(id);
            d.look[tab] = id;
            CZ.state.save();
            CZ.audio.sfx('win');
            CZ.audio.vibrate([30, 30, 80]);
            CZ.ui.refresh();
            CZ.ui.toast(t('look.bought'));
          }
        }, img('ui.emerald', 'btn-icon'), String(item.price)));
    }

    const tabBar = h('div', { class: 'tabs ward-tabs' }, CZ.LOOK_TABS.map(id => h('button', {
      class: 'tab' + (id === tab ? ' on' : ''), type: 'button',
      onClick: () => { CZ.audio.sfx('button'); this.tab = id; this.scrollX = tabBar.scrollLeft; CZ.ui.refresh(); }
    }, t('look.tab.' + id))));

    el.append(
      CZ.ui.header(t('look.title'), () => CZ.ui.go(params.returnTo || 'hub')),
      h('div', { class: 'ward-stage' }, front, backImg),
      buyBar,
      tabBar,
      h('div', { class: 'scroll ward-scroll' },
        h('p', { class: 'section-note', text: t(tab === 'costume' ? 'look.bigNote' : 'look.smallNote') }),
        h('div', { class: 'ward-grid' + (colorTab ? '' : ' big') }, items),
        btn(t('look.kind'), () => CZ.ui.go('avatar', { returnTo: 'wardrobe' }), 'ghost wide')));
    // Sekme çubuğu kaydırılmışsa yerinde kalsın.
    tabBar.scrollLeft = this.scrollX || 0;
    const on = tabBar.querySelector('.tab.on');
    if (on && !this.scrollX) on.scrollIntoView({ inline: 'center', block: 'nearest' });
  },
  leave() { clearInterval(this.anim); }
};
