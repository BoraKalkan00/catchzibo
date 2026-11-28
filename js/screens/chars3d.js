// (28 Kas) KARAKTERLER — Subway Surfers gibi: 16 gerçek 3D karakter.
// Üstte seçilen karakter canlı 3D döner (parmakla çevrilir, oklarla gezilir), altta kartlar (3D portre).
// Kilitli karakterler RENKLİ görünür (merak uyandırsın), fiyatı altında yazar. Fiyatlar koşu başına ~200-300 altına göre.
CZ.ROSTER = [
  { id: 'girl' }, { id: 'boy' },
  { id: 'elf', gold: 1500 }, { id: 'snowkid', gold: 2500 }, { id: 'reindeer', gold: 3500 }, { id: 'mila', gold: 5000 },
  { id: 'hero_rudi', gold: 6500 }, { id: 'santa', gold: 8000 }, { id: 'hero_ela', gold: 10000 }, { id: 'hero_demir', gold: 12000 },
  { id: 'knight', gold: 15000 }, { id: 'hero_buzbas', gold: 18000 }, { id: 'hero_noel', gold: 22000 }, { id: 'goblin', gold: 26000 },
  { id: 'chief', gold: 30000 }, { id: 'zibo', gold: 40000 }
];
CZ.ROSTER.forEach(c => { if (c.gold) c.gems = Math.round(c.gold / 10); });
Object.assign(CZ.RUN_PERKS, {
  mila: { type: 'score', per: 0.06 }, hero_rudi: { type: 'sled', per: 0.1 }, hero_ela: { type: 'gold', per: 0.07 },
  hero_demir: { type: 'power', per: 0.5 }, hero_buzbas: { type: 'head', per: 3 }, hero_noel: { type: 'gemCatch', per: 0.7 },
  goblin: { type: 'gold', per: 0.09 }, chief: { type: 'power', per: 0.6 }, zibo: { type: 'catchBonus', per: 0.3 }
});
CZ.ROSTER.forEach(c => { if (!CZ.CHAR_PERKS[c.id] && CZ.RUN_PERKS[c.id]) CZ.CHAR_PERKS[c.id] = CZ.RUN_PERKS[c.id]; });
CZ.chars.state = c => (!c.gold || (CZ.state.data.boughtChars || []).includes(c.id)) ? 'open' : 'locked';
CZ.chars.hasArt = () => true;

CZ.screens.chars = {
  music: 'home',
  render(el, params) {
    const { h, img, btn } = CZ.ui;
    const t = CZ.t, d = CZ.state.data;
    const S = this;
    if (!CZ.ROSTER.some(c => c.id === d.avatar)) d.avatar = 'girl';
    S.view = S.view && CZ.ROSTER.some(c => c.id === S.view) ? S.view : d.avatar;
    const back = () => CZ.ui.go(params && params.returnTo ? params.returnTo : 'home');
    const goldEl = h('span', { class: 'emerald-count', text: d.gold || 0 });
    const gemEl = h('span', { class: 'emerald-count', text: d.emeralds || 0 });
    const stage = h('div', { class: 'c3-stage' });
    const nameEl = h('h2', { class: 'c3-name' });
    const perkEl = h('p', { class: 'c3-perk' });
    const actEl = h('div', { class: 'c3-act' });
    const grid = h('div', { class: 'c3-grid' });
    const idx = () => CZ.ROSTER.findIndex(c => c.id === S.view);
    const show = id => { S.view = id; CZ.audio.sfx('button'); drawInfo(); drawGrid(); if (S.p3) S.p3.set(id); };
    const arrow = dir => h('button', { class: 'c3-arrow ' + (dir < 0 ? 'l' : 'r'), type: 'button', 'aria-label': dir < 0 ? '<' : '>', onClick: () => { const n = CZ.ROSTER.length; show(CZ.ROSTER[(idx() + dir + n) % n].id); } }, dir < 0 ? '‹' : '›');

    function drawInfo() {
      const c = CZ.ROSTER[idx()];
      const st = CZ.chars.state(c);
      nameEl.textContent = t('char.' + c.id);
      const lvl = CZ.charLevel(c.id);
      perkEl.textContent = (st === 'open' ? t('perk.lv', { n: lvl }) + ' · ' : '') + (CZ.runPerkText(c.id) || '');
      actEl.replaceChildren();
      if (st === 'locked') {
        actEl.append(
          btn(String(c.gold), () => {
            if ((d.gold || 0) < c.gold) { CZ.audio.sfx('wrong'); return CZ.ui.toast(t('chars.goldShort', { n: c.gold - (d.gold || 0) })); }
            d.gold -= c.gold; unlock(c);
          }, 'primary', 'ui.gold'),
          btn(String(c.gems), () => {
            if ((d.emeralds || 0) < c.gems) { CZ.audio.sfx('wrong'); return CZ.ui.toast(t('chars.gemShort', { n: c.gems - (d.emeralds || 0) })); }
            d.emeralds -= c.gems; unlock(c);
          }, 'ghost-dark', 'ui.emerald'));
      } else {
        const sel = d.avatar === c.id;
        actEl.append(btn(sel ? t('chars.selected') : t('chars.pick'), () => {
          if (sel) return;
          d.avatar = c.id; CZ.state.save(); CZ.audio.sfx('buy'); drawInfo(); drawGrid();
        }, sel ? 'ghost-dark' : 'primary'));
        if (lvl < CZ.CHAR_MAX) {
          const up = CZ.charUpPrice(lvl);
          actEl.append(btn(t('chars.up') + ' ' + up, () => {
            if ((d.gold || 0) < up) { CZ.audio.sfx('wrong'); return CZ.ui.toast(t('perk.short', { n: up - (d.gold || 0) })); }
            d.gold -= up; d.charLv = d.charLv || {}; d.charLv[c.id] = lvl + 1; CZ.state.save();
            CZ.audio.sfx('win'); CZ.audio.vibrate([30, 20, 50]); CZ.ui.toast(t('perk.up', { n: lvl + 1 })); drawInfo(); goldEl.textContent = d.gold;
          }, 'ghost-dark', 'ui.gold'));
        }
      }
      goldEl.textContent = d.gold || 0; gemEl.textContent = d.emeralds || 0;
    }
    function unlock(c) {
      d.boughtChars = (d.boughtChars || []).concat(c.id); d.avatar = c.id; CZ.state.save();
      CZ.audio.sfx('win'); CZ.audio.vibrate([30, 20, 60]);
      CZ.ui.toast(t('chars.got', { name: t('char.' + c.id) }));
      if (S.p3) S.p3.cheer();
      drawInfo(); drawGrid();
    }
    const ports = S.ports || (S.ports = {});
    function drawGrid() {
      grid.replaceChildren(...CZ.ROSTER.map(c => {
        const st = CZ.chars.state(c);
        return h('button', { class: 'c3-card ' + st + (c.id === S.view ? ' on' : '') + (c.id === d.avatar ? ' sel' : ''), type: 'button', onClick: () => show(c.id) },
          ports[c.id] ? h('img', { src: ports[c.id], alt: '' }) : h('i', { class: 'c3-wait' }),
          st === 'locked' ? h('span', { class: 'c3-price' }, img('ui.gold', 'mini-ico'), c.gold >= 1000 ? (c.gold / 1000) + 'K' : String(c.gold)) : h('span', { class: 'c3-nm', text: t('char.' + c.id) }),
          c.id === d.avatar ? CZ.icon('check', 'c3-ok') : null);
      }));
    }
    el.append(
      CZ.ui.header(t('chars.title'), back),
      h('div', { class: 'c3-top' },
        h('div', { class: 'emeralds gold-badge' }, img('ui.gold', 'emerald-icon'), goldEl)),
      h('div', { class: 'c3-show' }, stage, arrow(-1), arrow(1)),
      h('div', { class: 'c3-info' }, nameEl, perkEl, actEl),
      h('div', { class: 'scroll c3-body' }, grid));
    drawInfo(); drawGrid();
    // 3D: önizleme + portreler (Three ve modeller yüklenince)
    CZ.runner3d.load().then(() => CZ.kk.needMX(CZ.ROSTER.map(c => c.id))).then(() => {
      if (!stage.isConnected) return;
      S.p3 = preview3d(stage, S.view);
      let i = 0;
      const next = () => {
        if (!stage.isConnected || i >= CZ.ROSTER.length) return;
        const c = CZ.ROSTER[i++];
        if (!ports[c.id]) { try { ports[c.id] = CZ.kk.portrait(c.id, 'front'); } catch (e) { } drawGrid(); }
        setTimeout(next, 30);
      };
      next();
    });
  },
  leave() { if (this.p3) { this.p3.stop(); this.p3 = null; } }
};

// Canlı 3D önizleme: karakter yavaşça döner, parmakla çevrilir.
function preview3d(host, id, opt) {
  opt = opt || {};
  const T = window.THREE;
  const r = new T.WebGLRenderer({ antialias: true, alpha: true });
  r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  host.append(r.domElement);
  const sc = new T.Scene();
  const cam = new T.PerspectiveCamera(26, 1, 0.1, 100);
  cam.position.set(0, 1.0, opt.dist || 4.1); cam.lookAt(0, opt.look || 0.78, 0);
  sc.add(new T.HemisphereLight(0xffffff, 0x8a90a8, 0.85));
  const dl = new T.DirectionalLight(0xffffff, 0.75); dl.position.set(2.5, 4, 5); sc.add(dl);
  const disc = new T.Mesh(new T.CylinderGeometry(0.8, 0.8, 0.06, 40), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18 }));
  disc.position.y = -0.04; sc.add(disc);
  let o = null, rot = Math.PI, drag = null, raf = 0, last = 0, cheerT = 0;
  const set = k => { if (o) sc.remove(o.root); o = CZ.kk.hero(T, k); sc.add(o.root); cheerT = 1.6; };
  set(id);
  const size = () => { const w = host.clientWidth || 300, hh = host.clientHeight || 300; r.setSize(w, hh, false); cam.aspect = w / hh; cam.updateProjectionMatrix(); };
  size();
  const ro = new ResizeObserver(size); ro.observe(host);
  host.addEventListener('pointerdown', e => { drag = e.clientX; });
  window.addEventListener('pointerup', () => { drag = null; });
  host.addEventListener('pointermove', e => { if (drag == null) return; rot += (e.clientX - drag) * 0.012; drag = e.clientX; });
  const loop = now => {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    if (drag == null) rot = opt.still ? rot + (Math.PI - 0.25 + Math.sin(now / 1400) * 0.25 - rot) * Math.min(1, dt * 2) : rot + dt * 0.5;
    cheerT = Math.max(0, cheerT - dt);
    if (o) { o.root.rotation.y = rot; o.update(dt, cheerT > 0 ? { cheer: true } : { idle: true, speed: 0 }); }
    r.render(sc, cam);
  };
  raf = requestAnimationFrame(loop);
  return { set, cheer() { cheerT = 2; }, stop() { cancelAnimationFrame(raf); ro.disconnect(); r.dispose(); r.forceContextLoss(); r.domElement.remove(); } };
}

CZ.preview3d = preview3d;
