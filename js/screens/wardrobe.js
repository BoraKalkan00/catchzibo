// GARDIROP: Bitmoji tarzı karakter tasarımı.
// Sahiplik, fiyat, günün vitrini, kilitli (başarıyla açılan) eşyalar, kombinler, zar, Zibo'nun yorumları.
CZ.closet = (function () {
  const d = () => CZ.state.data;
  function store() {
    const s = d();
    if (!s.closet) {
      s.closet = { owned: [], presets: [null, null, null] };
      // Eski sürümden: alınmış kostümler korunur, eski görünüş sıfırlanır.
      const old = s.lookOwned || {};
      (old.costume || []).forEach(id => { if (id === 'raven' || id === 'dragon') s.closet.owned.push('costume.' + id); });
      s.look = {};
      delete s.lookOwned;
      CZ.state.save();
    }
    return s.closet;
  }
  const item = (cat, id) => CZ.CATALOG[cat].find(x => x.id === id);
  // Başarı koşulu: chase (yakalanan Zibo), house (ev seviyesi), goldBest (Altın Avı rekoru)
  function unlockState(it) {
    if (!it.unlock) return null;
    const s = d();
    const k = Object.keys(it.unlock)[0], need = it.unlock[k];
    const have = k === 'chase' ? (s.chaseWins || 0) : k === 'house' ? (s.house && CZ.house ? CZ.house.level(s.house) : 0) : (s.goldBest || 0);
    return { key: k, need, have, done: have >= need };
  }
  function owns(cat, id) {
    const it = item(cat, id);
    if (!it) return false;
    if (it.unlock) return unlockState(it).done;
    return CZ.RARITY[it.r] === 0 || store().owned.includes(cat + '.' + id);
  }
  // Günün vitrini: tarihe göre her gün 4 eşya %30 indirimli (bütün oyuncularda aynı).
  function shop() {
    const day = CZ.state.today();
    let seed = 0;
    for (const ch of day) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const kind = d().avatar || 'girl';
    const pool = [];
    Object.keys(CZ.CATALOG).forEach(cat => CZ.CATALOG[cat].forEach(it => {
      if (CZ.RARITY[it.r] > 0 && !it.unlock && (!it.g || it.g === kind)) pool.push({ cat, id: it.id });
    }));
    const out = [];
    while (out.length < 4 && pool.length) out.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
    return out;
  }
  const inShop = (cat, id) => shop().some(x => x.cat === cat && x.id === id);
  function price(cat, id) {
    const it = item(cat, id);
    const base = CZ.RARITY[it.r];
    return inShop(cat, id) ? Math.round(base * 0.7) : base;
  }
  function buy(cat, id) {
    const p = price(cat, id);
    if ((d().emeralds || 0) < p) return false;
    d().emeralds -= p;
    store().owned.push(cat + '.' + id);
    CZ.state.save();
    return true;
  }
  function equip(cat, id) {
    d().look = d().look || {};
    d().look[cat] = id;
    CZ.state.save();
  }
  // Zar: sadece sahip olunanlardan rastgele kombin
  function randomize() {
    const kind = d().avatar || 'girl';
    const L = Object.assign({}, d().look || {});
    ['hair', 'top', 'bottom', 'shoes', 'hat', 'glasses', 'neck', 'back', 'emote'].forEach(cat => {
      const list = CZ.CATALOG[cat].filter(it => (!it.g || it.g === kind) && owns(cat, it.id));
      if (list.length) L[cat] = list[Math.floor(Math.random() * list.length)].id;
    });
    ['hairColor', 'topColor', 'bottomColor', 'shoeColor'].forEach(k => {
      L[k] = Math.floor(Math.random() * (k === 'hairColor' ? CZ.PALETTE.hair.length : CZ.PALETTE.cloth.length));
    });
    if (Math.random() < 0.7) L.costume = 'none';
    d().look = L;
    CZ.state.save();
  }
  // Zibo'nun kombin yorumu
  function ziboLine() {
    const L = CZ.avatarArt.resolve(d().look, d().avatar || 'girl');
    if (L.costume === 'zibo') return 'ward.z.zibo';
    if (L.costume !== 'none') return 'ward.z.' + L.costume;
    if (L.hat === 'crown') return 'ward.z.crown';
    if (L.glasses === 'sun' || L.glasses === 'star') return 'ward.z.cool';
    if (L.hair === 'mohawk' || L.hair === 'spiky') return 'ward.z.punk';
    if (L.back === 'wings') return 'ward.z.wings';
    if (L.top === 'jersey') return 'ward.z.jersey';
    const pool = ['ward.z.a', 'ward.z.b', 'ward.z.c', 'ward.z.d', 'ward.z.e'];
    return pool[Math.floor(Math.random() * pool.length)];
  }
  const perk = () => CZ.COSTUME_PERKS[(d().look || {}).costume] || {};
  return { store, item, owns, unlockState, shop, inShop, price, buy, equip, randomize, ziboLine, perk };
})();

CZ.screens.wardrobe = {
  render(el, params) {
    const { h, img, btn } = CZ.ui;
    const t = CZ.t;
    const d = CZ.state.data;
    const C = CZ.closet;
    C.store();
    if (!d.look) d.look = {};
    const kind = d.avatar || 'girl';
    const group = params.group || this.group || 'hair';
    this.group = group;
    const gdef = CZ.WARD_GROUPS.find(x => x.id === group) || { id: 'shop', parts: [] };
    const part = gdef.parts.includes(this.part) ? this.part : gdef.parts[0];
    this.part = part;
    const preview = this.preview || null;
    this.preview = null;
    const L = Object.assign({}, d.look, preview || {});
    const R = CZ.avatarArt.resolve(L, kind);

    // Sahne: önden (hareketiyle) + arkadan koşu
    const front = h('img', { class: 'ward-front', src: CZ.avatarArt.url(kind, L, R.emote), alt: '' });
    const backImg = h('img', { class: 'ward-back', src: CZ.avatarArt.url(kind + '_run1', L), alt: '' });
    let f = 0;
    clearInterval(this.anim);
    this.anim = setInterval(() => { f = 1 - f; backImg.src = CZ.avatarArt.url(kind + (f ? '_run2' : '_run1'), L); }, 170);
    const zibo = h('div', { class: 'ward-zibo' }, img('zibo.smug', 'ward-zibo-img'), h('p', { class: 'ward-bubble', text: t(C.ziboLine()) }));

    // Bir eşya kutusu
    const tile = (cat, it, opts) => {
      const o = opts || {};
      const owned = C.owns(cat, it.id);
      const on = (R[cat] || '') === it.id && !preview;
      const trying = preview && preview[cat] === it.id;
      const look = Object.assign({}, d.look, { [cat]: it.id });
      const headCats = ['face', 'eyes', 'brows', 'nose', 'mouth', 'beard', 'makeup', 'hair', 'hat', 'glasses', 'earrings'];
      const pic = h('img', { class: 'ward-pic' + (headCats.includes(cat) ? ' head' : ''), src: CZ.avatarArt.url(kind, look, cat === 'emote' ? it.id : ''), alt: '', loading: 'lazy' });
      const lock = it.unlock ? C.unlockState(it) : null;
      const cost = owned ? null : lock ? h('small', { class: 'lock' }, '🔒 ' + t('ward.unlock.' + lock.key, { n: lock.need, have: lock.have })) : h('small', {}, img('ui.emerald', 'swatch-gold'), String(C.price(cat, it.id)));
      return h('button', {
        class: `ward-item rar-${it.r}` + (on ? ' on' : '') + (trying ? ' trying' : '') + (o.shop ? ' shop' : ''), type: 'button',
        onClick: () => {
          CZ.audio.sfx('button');
          if (owned) { C.equip(cat, it.id); CZ.ui.refresh(); return; }
          this.preview = { [cat]: it.id };
          if (o.shop) { this.group = 'shop'; }
          CZ.ui.refresh();
        }
      }, pic,
      h('span', { class: 'ward-name', text: t('look.' + cat + '.' + it.id) }),
      o.shop ? h('em', { class: 'sale', text: '-30%' }) : null,
      cost);
    };

    let content;
    if (group === 'shop') {
      const list = C.shop();
      content = h('div', {},
        h('p', { class: 'section-note', text: t('ward.shopNote') }),
        h('div', { class: 'ward-grid big' }, list.map(x => tile(x.cat, C.item(x.cat, x.id), { shop: true }))));
    } else {
      const color = CZ.COLOR_OF[part];
      const palette = color ? (part === 'skin' ? CZ.PALETTE.skin : part === 'hair' ? CZ.PALETTE.hair : part === 'eyes' ? CZ.PALETTE.eyes : CZ.PALETTE.cloth) : null;
      const curColor = color ? (L[color] !== undefined ? L[color] : CZ.LOOK_DEFAULT[kind][color]) : null;
      const swatches = palette ? h('div', { class: 'ward-colors' }, palette.map((c, i) => {
        // Goblin yeşili ten: efsanevi değil ama 60 elmas
        const gob = part === 'skin' && i === 8 && !C.store().owned.includes('skin.gob');
        return h('button', {
          class: 'ward-color' + (i === curColor ? ' on' : ''), type: 'button', style: `--c:${c}`,
          onClick: () => {
            if (gob) {
              if ((d.emeralds || 0) < 60) { CZ.audio.sfx('wrong'); return CZ.ui.toast(t('look.need')); }
              d.emeralds -= 60; C.store().owned.push('skin.gob');
            }
            CZ.audio.sfx('button'); d.look[color] = i; CZ.state.save(); CZ.ui.refresh();
          }
        }, gob ? h('small', {}, '💎60') : null);
      })) : null;
      const items = part === 'skin' ? [] : CZ.CATALOG[part].filter(it => !it.g || it.g === kind);
      const perks = part === 'costume' ? h('p', { class: 'section-note perk-note', text: t('ward.perkNote') }) : null;
      content = h('div', {},
        h('div', { class: 'ward-parts' }, gdef.parts.map(p => h('button', {
          class: 'chip-btn' + (p === part ? ' on' : ''), type: 'button',
          onClick: () => { CZ.audio.sfx('button'); this.part = p; CZ.ui.refresh(); }
        }, t('ward.part.' + p)))),
        swatches, perks,
        items.length ? h('div', { class: 'ward-grid' + (['top', 'bottom', 'shoes', 'costume', 'back', 'body', 'height', 'emote'].includes(part) ? ' big' : '') }, items.map(it => tile(part, it))) : null);
    }

    // Satın alma çubuğu (deneme)
    let buyBar = '';
    if (preview) {
      const cat = Object.keys(preview)[0], id = preview[cat];
      const it = C.item(cat, id);
      const lock = it.unlock ? C.unlockState(it) : null;
      buyBar = h('div', { class: 'ward-buy rar-' + it.r },
        h('span', {}, h('b', { text: t('look.' + cat + '.' + id) }), h('small', { text: t('ward.rarity.' + it.r) })),
        btn(t('common.cancel'), () => CZ.ui.refresh(), 'small ghost'),
        lock ? h('span', { class: 'lock', text: '🔒 ' + t('ward.unlock.' + lock.key, { n: lock.need, have: lock.have }) })
          : h('button', {
            class: 'btn small primary', type: 'button',
            onClick: () => {
              if (!C.buy(cat, id)) { CZ.audio.sfx('wrong'); return CZ.ui.toast(t('look.need')); }
              C.equip(cat, id);
              CZ.audio.sfx('win'); CZ.audio.vibrate([30, 30, 80]);
              CZ.ui.refresh(); CZ.ui.toast(t('look.bought'));
            }
          }, img('ui.emerald', 'btn-icon'), String(C.price(cat, id))));
    }

    // Kombinler
    const presets = () => {
      const st = C.store();
      const wrap = h('div', { class: 'modal-wrap' });
      const draw = () => wrap.replaceChildren(h('div', { class: 'modal presets' },
        h('h2', { text: t('ward.presets') }),
        h('div', { class: 'preset-row' }, st.presets.map((p, i) => h('div', { class: 'preset' },
          p ? h('img', { src: CZ.avatarArt.url(kind, p), alt: '' }) : h('div', { class: 'preset-empty', text: '+' }),
          h('div', { class: 'row' },
            p ? btn(t('ward.wear'), () => { d.look = Object.assign({}, p); CZ.state.save(); wrap.remove(); CZ.ui.refresh(); }, 'small primary') : null,
            btn(t('ward.save'), () => { st.presets[i] = Object.assign({}, d.look); CZ.state.save(); CZ.audio.sfx('buy'); draw(); }, 'small ghost-dark'))))),
        btn(t('common.continue'), () => wrap.remove(), 'primary wide')));
      draw();
      document.getElementById('app').append(wrap);
    };

    const groups = CZ.WARD_GROUPS.map(x => x.id).concat(['shop']);
    el.append(
      CZ.ui.header(t('look.title'), () => CZ.ui.go(params.returnTo || 'hub')),
      h('div', { class: 'ward-stage' }, front, backImg, zibo),
      h('div', { class: 'ward-actions' },
        h('button', { class: 'ward-act', type: 'button', onClick: () => { CZ.audio.sfx('poke'); C.randomize(); CZ.ui.refresh(); } }, '🎲 ', t('ward.random')),
        h('button', { class: 'ward-act', type: 'button', onClick: () => { CZ.audio.sfx('button'); presets(); } }, '👕 ', t('ward.presets')),
        h('button', { class: 'ward-act', type: 'button', onClick: () => CZ.ui.go('avatar', { returnTo: 'wardrobe' }) }, kind === 'girl' ? '👧 ↔ 👦' : '👦 ↔ 👧')),
      buyBar,
      h('div', { class: 'tabs ward-tabs' }, groups.map(id => h('button', {
        class: 'tab' + (id === group ? ' on' : '') + (id === 'shop' ? ' shop-tab' : ''), type: 'button',
        onClick: () => { CZ.audio.sfx('button'); this.group = id; this.part = null; CZ.ui.refresh(); }
      }, t('ward.group.' + id)))),
      h('div', { class: 'scroll ward-scroll' }, content));
  },
  leave() { clearInterval(this.anim); }
};
