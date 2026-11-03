// GARDIROP: elmasla görünüş. Küçük paketler: ten, göz, saç rengi. Büyük paketler: kostüm.
CZ.screens.wardrobe = {
  render(el, params) {
    const { h, img, btn } = CZ.ui;
    const t = CZ.t;
    const d = CZ.state.data;
    if (!d.look) d.look = {};
    if (!d.lookOwned) d.lookOwned = { skin: ['s1'], eyes: ['e1'], hair: ['h0'], costume: ['none'] };
    const tab = params.tab || this.tab || 'costume';
    this.tab = tab;
    const kind = d.avatar || 'girl';
    const preview = this.preview || null;
    this.preview = null;
    // Önizleme: satın almadan önce denenebilir.
    const L = Object.assign({}, d.look, preview || {});
    const show = l => {
      const pick = (k, id) => (CZ.LOOKS[k].find(x => x.id === id) || CZ.LOOKS[k][0]);
      return { skin: pick('skin', l.skin).c, eyes: pick('eyes', l.eyes).c, hair: pick('hair', l.hair).c, costume: pick('costume', l.costume).id };
    };
    const P = show(L);
    const front = h('img', { class: 'ward-front', src: CZ.avatarArt.url(kind, P), alt: '' });
    const backImg = h('img', { class: 'ward-back', src: CZ.avatarArt.url(kind + '_run1', P), alt: '' });
    let f = 0;
    clearInterval(this.anim);
    this.anim = setInterval(() => { f = 1 - f; backImg.src = CZ.avatarArt.url(kind + (f ? '_run2' : '_run1'), P); }, 160);

    const items = CZ.LOOKS[tab].map(item => {
      const owned = d.lookOwned[tab].includes(item.id);
      const on = (d.look[tab] || CZ.LOOKS[tab][0].id) === item.id;
      const trying = preview && preview[tab] === item.id;
      let face;
      if (tab === 'costume') {
        face = h('img', { class: 'ward-cost', src: CZ.avatarArt.url(kind, show(Object.assign({}, d.look, { costume: item.id }))), alt: '' });
      } else {
        face = h('i', { style: `--c:${item.c || (kind === 'girl' ? '#8a4a24' : '#3b2a20')}` });
      }
      return h('button', {
        class: 'ward-item' + (on ? ' on' : '') + (trying ? ' trying' : '') + (tab === 'costume' ? ' big' : ''), type: 'button',
        onClick: () => {
          CZ.audio.sfx('button');
          if (owned) { d.look[tab] = item.id; CZ.state.save(); CZ.ui.refresh(); return; }
          this.preview = { [tab]: item.id };
          CZ.ui.refresh();
        }
      }, face,
      tab === 'costume' ? h('span', { class: 'ward-name', text: t('look.' + item.id) }) : null,
      owned ? null : h('small', {}, img('ui.emerald', 'swatch-gold'), String(item.price)));
    });

    let buyBar = null;
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

    el.append(
      CZ.ui.header(t('look.title'), () => CZ.ui.go(params.returnTo || 'hub')),
      h('div', { class: 'ward-stage' }, front, backImg),
      buyBar || '',
      h('div', { class: 'tabs' }, ['costume', 'hair', 'eyes', 'skin'].map(id => h('button', {
        class: 'tab' + (id === tab ? ' on' : ''), type: 'button',
        onClick: () => { CZ.audio.sfx('button'); this.tab = id; CZ.ui.refresh(); }
      }, t('look.tab.' + id)))),
      h('div', { class: 'scroll ward-scroll' },
        h('p', { class: 'section-note', text: t(tab === 'costume' ? 'look.bigNote' : 'look.smallNote') }),
        h('div', { class: 'ward-grid' + (tab === 'costume' ? ' big' : '') }, items),
        btn(t('look.kind'), () => CZ.ui.go('avatar', { returnTo: 'wardrobe' }), 'ghost wide')));
  },
  leave() { clearInterval(this.anim); }
};
