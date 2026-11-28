// (28 Kas) YENİ ANA EKRAN: oyun artık tek şey — Zibo'yu kovala (sonsuz koşu). Subway Surfers sadeliği:
// logo, rekor, altın, kocaman OYNA, altta 2 küçük düğme (karakterler, ayarlar). Ekrana dokunmak da oynatır.
CZ.screens.home = {
  render(el) {
    const { h, img } = CZ.ui; const t = CZ.t; const d = CZ.state.data;
    const play = () => { if (this.go) return; this.go = true; CZ.audio.sfx('button'); CZ.ui.wipeTo('chase', { endless: true }); };
    this.go = false;
    const gold = (d.gold || 0) + (d.runGold || 0) * 0;
    el.append(
      h('div', { class: 'hm-bg' }, img('scene.hub_bg', 'hm-bg-img')),
      h('div', { class: 'hm-shade' }),
      h('div', { class: 'hm-top' },
        h('div', { class: 'hm-chip' }, img('ui.gold', 'hm-ic'), h('b', { text: String(gold) })),
        h('div', { class: 'hm-chip' }, CZ.icon ? CZ.icon('trophy') : '', h('b', { text: String(d.bestRun || 0) }))),
      h('div', { class: 'hm-logo' }, h('img', { src: 'assets/ui/logo.webp', alt: t('title.name'), draggable: 'false' })),
      this.stage = h('div', { class: 'hm-mid hm-stage' }),
      h('div', { class: 'hm-bot' },
        h('button', { class: 'hm-play', type: 'button', onClick: e => { e.stopPropagation(); play(); } }, t('title.play')),
        h('p', { class: 'hm-hint', text: t('home.hint') }),
        h('div', { class: 'hm-row' },
          h('button', { class: 'hm-small', type: 'button', onClick: e => { e.stopPropagation(); CZ.audio.sfx('button'); CZ.ui.go('chars', { returnTo: 'home' }); } }, t('chars.title')),
          h('button', { class: 'hm-small', type: 'button', onClick: e => { e.stopPropagation(); CZ.audio.sfx('button'); CZ.ui.go('settings'); } }, t('settings.title')))));
    el.addEventListener('pointerdown', e => { if (!e.target.closest('button, .hm-stage')) play(); });
    // (28 Kas) seçili karakter ana ekranda canlı 3D bekler (Subway gibi); dokununca sevinir
    const st = this.stage;
    CZ.runner3d.load().then(() => CZ.kk.needMX([d.avatar || 'girl'])).then(() => {
      if (!st.isConnected) return;
      this.p3 = CZ.preview3d(st, d.avatar || 'girl', { still: true, dist: 6.2, look: 0.95 });
      st.addEventListener('click', () => { if (this.p3) { this.p3.cheer(); CZ.audio.sfx('poke'); } });
    }).catch(() => {});
  },
  leave() { if (this.p3) { this.p3.stop(); this.p3 = null; }
  }
};
