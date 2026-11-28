CZ.LD_SC = ['zibo_soygun', 'zibo_soygun'];   // (28 Kas) yükleme: Zibo hazineyi kaçırıyor (koşu oyununun hikâyesi)
// (28 Kas) ANA EKRAN: oyun tek şey — Zibo'yu kovala (sonsuz koşu). Subway Surfers sadeliği:
// üstte altın / elmas / ses, logo, seviye çubuğu; ortada canlı 3D karakter; solda 3 küçük düğme (görevler, günlük ödül, kutu);
// altta kocaman OYNA, altında karakterler + ayarlar. Ekrana dokunmak da oynatır.
// (28 Kas) GÜNLÜK HARF AVI: her gün Z-İ-B-O harflerini koşularda topla → 500 altın + gizemli kutu
CZ.letters = {
  W: ['Z', 'İ', 'B', 'O'],
  st() { const d = CZ.state.data, day = CZ.state.today(); if (!d.letters || d.letters.day !== day) d.letters = { day, got: [] }; return d.letters; },
  next() { const L = this.st(); return this.W.find(c => !L.got.includes(c)) || null; },
  got(ch) { const L = this.st(); if (!L.got.includes(ch)) L.got.push(ch); const done = L.got.length >= this.W.length && !L.paid; if (done) { L.paid = true; const d = CZ.state.data; d.gold = (d.gold || 0) + 500; d.boxes = (d.boxes || 0) + 1; } CZ.state.save(); return { n: L.got.length, done }; }
};
CZ.mbox = {
  // Gizemli kutu: 500+ puanlık koşudan ve görev seti bitince kazanılır. Açınca rastgele ödül.
  count: () => CZ.state.data.boxes || 0,
  add(n) { const d = CZ.state.data; d.boxes = (d.boxes || 0) + (n || 1); CZ.state.save(); },
  roll() {
    const r = Math.random();
    if (r < 0.04) return { gems: 25 };
    if (r < 0.2) return { gems: 5 + Math.floor(Math.random() * 6) };
    if (r < 0.3) return { gold: 1000 };
    return { gold: 100 + Math.floor(Math.random() * 10) * 40 };
  },
  open(onDone) {
    const { h, img, btn } = CZ.ui; const t = CZ.t; const d = CZ.state.data;
    if (!(d.boxes > 0)) return;
    d.boxes -= 1;
    const r = this.roll();
    if (r.gold) d.gold = (d.gold || 0) + r.gold;
    if (r.gems) d.emeralds = (d.emeralds || 0) + r.gems;
    CZ.state.save();
    const prize = h('div', { class: 'mb-prize' }, img(r.gold ? 'ui.gold' : 'ui.emerald', 'mb-ic'), h('b', { text: '+' + (r.gold || r.gems) }));
    const box = h('div', { class: 'mb-box' }, h('i', { class: 'mb-lid' }), h('i', { class: 'mb-body' }));
    const wrap = h('div', { class: 'modal-wrap' }, h('div', { class: 'modal mb-modal' }, h('h2', { text: t('box.title') }), box, prize,
      btn(t('common.continue'), () => { wrap.remove(); if (onDone) onDone(); }, 'primary wide')));
    (document.getElementById('app') || document.body).append(wrap);
    CZ.audio.sfx('charge');
    setTimeout(() => { box.classList.add('open'); prize.classList.add('on'); CZ.audio.sfx(r.gems >= 25 || r.gold >= 1000 ? 'win' : 'buy'); CZ.audio.vibrate([30, 20, 60]); }, 1300);
  }
};

CZ.screens.home = {
  music: 'home',
  render(el) {
    const { h, img } = CZ.ui; const t = CZ.t; const d = CZ.state.data;
    const play = () => { if (this.go) return; this.go = true; CZ.audio.sfx('button'); CZ.ui.wipeTo('chase', { endless: true }); };
    this.go = false;
    const refresh = () => CZ.ui.refresh ? CZ.ui.refresh() : CZ.ui.go('home');
    const v = CZ.audio.vol ? CZ.audio.vol() : { all: 1 };
    const muted = (v.all || 0) < 0.01;
    const sideBtn = (cls, icon, label, badge, onClick) => h('button', { class: 'hm-side ' + cls, type: 'button', onClick: e => { e.stopPropagation(); CZ.audio.sfx('button'); onClick(); } },
      typeof icon === 'string' ? h('span', { class: 'hm-emo', text: icon }) : icon, h('small', { text: label }), badge ? h('em', { text: badge }) : null);
    const m = CZ.missions.state();
    const misLeft = m.list.filter(x => x.have < x.n).length;
    const dailyReady = !!CZ.progress.dailyToday();
    el.append(
      h('div', { class: 'hm-bg' }, img('scene.hub_bg', 'hm-bg-img')),
      h('div', { class: 'hm-shade' }),
      h('div', { class: 'hm-top' },
        h('div', { class: 'hm-chips' },
          h('div', { class: 'hm-chip' }, img('ui.gold', 'hm-ic'), h('b', { text: String(d.gold || 0) })),
          h('div', { class: 'hm-chip' }, img('ui.emerald', 'hm-ic'), h('b', { text: String(d.emeralds || 0) }))),
        h('div', { class: 'hm-chips' },
          h('div', { class: 'hm-chip' }, CZ.icon('trophy'), h('b', { text: String(d.bestRun || 0) })),
          h('button', { class: 'hm-chip hm-sound', type: 'button', 'aria-label': 'ses', onClick: e => {
            e.stopPropagation(); const now = CZ.audio.vol().all || 0;
            if (now > 0.01) { d.volBefore = now; CZ.audio.setVolume('all', 0); } else CZ.audio.setVolume('all', d.volBefore || 1);
            CZ.state.save(); refresh();
          } }, h('b', { text: muted ? '🔇' : '🔊' })))),
      h('div', { class: 'hm-logo' }, h('img', { src: 'assets/ui/logo.webp', alt: t('title.name'), draggable: 'false' })),
      h('div', { class: 'hm-level' }, CZ.progress.bar()),
      h('div', { class: 'hm-letters', title: t('let.title') }, h('small', { text: t('let.title') }), CZ.letters.W.map(ch => h('b', { class: CZ.letters.st().got.includes(ch) ? 'on' : '', text: ch }))),
      this.stage = h('div', { class: 'hm-mid hm-stage' }),
      h('div', { class: 'hm-left' },
        sideBtn('mis', CZ.icon('target'), t('home.missions'), misLeft ? String(misLeft) : '', () => {
          const wrap = h('div', { class: 'modal-wrap' }, h('div', { class: 'modal mis-modal' }, CZ.missions.panel(),
            CZ.ui.btn(t('common.continue'), () => wrap.remove(), 'primary wide')));
          (document.getElementById('app') || document.body).append(wrap);
        }),
        dailyReady ? sideBtn('gift glow', '🎁', t('home.daily'), '!', () => CZ.progress.showOnHub(el, refresh)) : null,
        CZ.mbox.count() > 0 ? sideBtn('box glow', '📦', t('box.short'), String(CZ.mbox.count()), () => CZ.mbox.open(refresh)) : null),
      h('div', { class: 'hm-bot' },
        h('button', { class: 'hm-play', type: 'button', onClick: e => { e.stopPropagation(); play(); } }, t('title.play'), h('small', { text: t('lvl.play', { n: d.level || 1 }) })),
        h('p', { class: 'hm-hint', text: t(CZ.PC || matchMedia('(pointer: fine)').matches ? 'home.hintPc' : 'home.hint') }),
        h('div', { class: 'hm-row' },
          h('button', { class: 'hm-small', type: 'button', onClick: e => { e.stopPropagation(); CZ.audio.sfx('button'); CZ.ui.go('chars', { returnTo: 'home' }); } }, t('chars.title')),
          h('button', { class: 'hm-small', type: 'button', onClick: e => { e.stopPropagation(); CZ.audio.sfx('button'); CZ.ui.go('upg'); } }, t('home.upg')),
          h('button', { class: 'hm-small', type: 'button', onClick: e => { e.stopPropagation(); CZ.audio.sfx('button'); CZ.ui.go('settings'); } }, t('settings.title')))));
    el.addEventListener('pointerdown', e => { if (!e.target.closest('button, .hm-stage, .modal-wrap')) play(); });
    const onKey = e => { if ((e.key === 'Enter' || e.key === ' ') && !document.querySelector('.modal-wrap')) { e.preventDefault(); play(); } };   // (28 Kas) PC: Enter/Boşluk = oyna
    window.addEventListener('keydown', onKey); this.offKey = () => window.removeEventListener('keydown', onKey);
    // günlük ödül / seviye atlama: girişte kendiliğinden açılır
    setTimeout(() => { if (el.isConnected && !document.querySelector('.modal-wrap')) CZ.progress.showOnHub(el, refresh); }, 600);
    // seçili karakter ana ekranda canlı 3D bekler (Subway gibi); dokununca sevinir
    const st = this.stage;
    CZ.runner3d.load().then(() => CZ.kk.needMX([d.avatar || 'girl'])).then(() => {
      if (!st.isConnected) return;
      this.p3 = CZ.preview3d(st, d.avatar || 'girl', { still: true, dist: 6.2, look: 0.95 });
      st.addEventListener('click', () => { if (this.p3) { this.p3.cheer(); CZ.audio.sfx('poke'); } });
    }).catch(() => {});
  },
  leave() { if (this.p3) { this.p3.stop(); this.p3 = null; } if (this.offKey) this.offKey(); }
};
