// MAĞAZA + KIŞ BİLETİ (Battle Pass) + uygulama içi satın alma.
// Telefonda Google Play Faturalandırma (cordova-plugin-purchase). Play Console'da ürünler açılana kadar
// fiyatlar varsayılan TL olarak görünür ve satın alma "yakında" der. Tarayıcıda test için sahte satın alma (CZ.DEV).
CZ.PRODUCTS = [
  { id: 'gold_s', kind: 'gold', n: 2500, price: '₺29,99' },
  { id: 'gold_m', kind: 'gold', n: 8000, price: '₺79,99', tag: 'popular' },
  { id: 'gold_l', kind: 'gold', n: 25000, price: '₺199,99' },
  { id: 'gold_xl', kind: 'gold', n: 65000, price: '₺449,99', tag: 'best' },
  { id: 'gems_s', kind: 'gems', n: 100, price: '₺24,99' },
  { id: 'gems_m', kind: 'gems', n: 550, price: '₺99,99', tag: 'popular' },
  { id: 'gems_l', kind: 'gems', n: 1500, price: '₺249,99', tag: 'best' },
  { id: 'starter', kind: 'starter', once: true, gold: 10000, gems: 200, mount: 'mammoth', price: '₺49,99' },
  { id: 'noads', kind: 'noads', once: true, price: '₺89,99' },
  { id: 'pass', kind: 'pass', price: '₺99,99' }
];
// Kış Bileti: 30 kademe. Bedava sıra herkese, altın sıra bileti alana.
CZ.PASS = {
  xpPerTier: 150,
  tiers: Array.from({ length: 30 }, (_, i) => {
    const n = i + 1;
    const free = n % 5 === 0 ? { gems: 10 + n } : n % 2 ? { gold: 150 + n * 20 } : { gems: 5 };
    let prem = n % 3 === 0 ? { gems: 20 + n * 2 } : { gold: 500 + n * 120 };
    if (n === 10) prem = { mount: 'goldbear' };
    if (n === 20) prem = { gold: 15000 };
    if (n === 30) prem = { mount: 'icewolf', gems: 300 };
    return { n, free, prem };
  })
};
CZ.iap = (function () {
  const has = () => window.CdvPurchase && window.CdvPurchase.store && window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
  let inited = false, pendingCb = {};
  function init() {
    if (inited || !has()) return; inited = true;
    const { store, ProductType, Platform } = window.CdvPurchase;
    CZ.PRODUCTS.forEach(p => store.register({ id: p.id, type: p.once || p.kind === 'pass' ? ProductType.NON_CONSUMABLE : ProductType.CONSUMABLE, platform: Platform.GOOGLE_PLAY }));
    store.when().approved(tr => tr.verify()).verified(rc => rc.finish()).finished(tr => {
      (tr.products || []).forEach(pp => { grant(pp.id); if (pendingCb[pp.id]) { pendingCb[pp.id](true); delete pendingCb[pp.id]; } });
    });
    store.initialize([Platform.GOOGLE_PLAY]).catch(() => {});
  }
  function priceOf(id) {
    const p = CZ.PRODUCTS.find(x => x.id === id);
    if (has()) { try { const sp = window.CdvPurchase.store.get(id); const o = sp && sp.pricing; if (o && o.price) return o.price; } catch (e) { /* yedek fiyat */ } }
    return p ? p.price : '';
  }
  function buy(id, cb) {
    if (has()) {
      const sp = window.CdvPurchase.store.get(id);
      const offer = sp && sp.getOffer && sp.getOffer();
      if (!offer) { CZ.ui.toast(CZ.t('shop.soon')); return cb && cb(false); }
      pendingCb[id] = cb;
      offer.order().then(err => { if (err) { delete pendingCb[id]; if (cb) cb(false); } });
      return;
    }
    if (CZ.DEV) { CZ.ui.confirmBox(CZ.t('shop.testBuy'), 'OK', CZ.t('common.no'), () => { grant(id); if (cb) cb(true); }, 'primary'); return; }
    CZ.ui.toast(CZ.t('shop.soon'));
    if (cb) cb(false);
  }
  // Satın alınan ürünü ver (Google onayından sonra)
  function grant(id) {
    const d = CZ.state.data, p = CZ.PRODUCTS.find(x => x.id === id);
    if (!p) return;
    d.bought = d.bought || {};
    if (p.once && d.bought[id] && id !== 'pass') return;
    d.bought[id] = (d.bought[id] || 0) + 1;
    if (p.kind === 'gold') d.gold = (d.gold || 0) + p.n;
    if (p.kind === 'gems') d.emeralds = (d.emeralds || 0) + p.n;
    if (p.kind === 'starter') { d.gold = (d.gold || 0) + p.gold; d.emeralds = (d.emeralds || 0) + p.gems; d.mounts = d.mounts || ['brown']; if (!d.mounts.includes(p.mount)) d.mounts.push(p.mount); d.mount = p.mount; }
    if (p.kind === 'noads') d.noAds = true;
    if (p.kind === 'pass') { CZ.pass.ensure(); d.pass.prem = true; }
    CZ.state.save();
    CZ.audio.sfx('win');
  }
  document.addEventListener('deviceready', init);
  setTimeout(init, 1500);
  return { buy, priceOf, grant, init };
})();

CZ.pass = (function () {
  const season = () => { const n = new Date(); return n.getFullYear() + '-' + (n.getMonth() + 1); };   // her ay yeni sezon
  function ensure() {
    const d = CZ.state.data;
    if (!d.pass || d.pass.season !== season()) d.pass = { season: season(), xp: 0, prem: false, got: {}, gotP: {} };
    return d.pass;
  }
  const tier = () => Math.min(CZ.PASS.tiers.length, Math.floor(ensure().xp / CZ.PASS.xpPerTier));
  function addXp(n) {
    const P = ensure(); const before = tier();
    P.xp += Math.round(n);
    CZ.state.save();
    if (tier() > before && CZ.ui.toast) CZ.ui.toast(CZ.t('pass.tierUp', { n: tier() }));
  }
  const ready = () => { const P = ensure(); const T = tier(); return CZ.PASS.tiers.some(x => x.n <= T && (!P.got[x.n] || (P.prem && !P.gotP[x.n]))); };
  function give(r) {
    const d = CZ.state.data;
    if (r.gold) d.gold = (d.gold || 0) + r.gold;
    if (r.gems) d.emeralds = (d.emeralds || 0) + r.gems;
    if (r.mount) { d.mounts = d.mounts || ['brown']; if (!d.mounts.includes(r.mount)) d.mounts.push(r.mount); }
    CZ.state.save();
  }
  function claim(n, prem) {
    const P = ensure();
    if (n > tier()) return;
    const tt = CZ.PASS.tiers[n - 1];
    if (prem) { if (!P.prem || P.gotP[n]) return; P.gotP[n] = true; give(tt.prem); }
    else { if (P.got[n]) return; P.got[n] = true; give(tt.free); }
    CZ.state.save(); CZ.audio.sfx('buy');
  }
  const daysLeft = () => { const n = new Date(); const e = new Date(n.getFullYear(), n.getMonth() + 1, 1); return Math.max(1, Math.ceil((e - n) / 86400000)); };
  return { ensure, tier, addXp, ready, claim, daysLeft };
})();

// Ekranlar: Mağaza ve Kış Bileti (açılır pencere)
CZ.shopUi = (function () {
  const { h, img, btn } = CZ.ui;
  const t = CZ.t;
  const rewardChip = r => h('span', { class: 'pass-rw' },
    r.mount ? [h('b', { text: '🐾' }), h('small', { text: t('mount.' + r.mount) })] : r.gems ? [img('ui.emerald', 'mini-ico'), h('b', { text: String(r.gems) })] : [img('ui.gold', 'mini-ico'), h('b', { text: String(r.gold) })]);
  function wrapModal(cls, kids, onClose) {
    const w = h('div', { class: 'modal-wrap shop-wrap', onClick: e => { if (e.target === w) close(); } });
    const close = () => { w.remove(); if (onClose) onClose(); };
    w.append(h('div', { class: 'modal ' + cls }, ...kids, btn(t('common.close'), close, 'small ghost-dark')));
    document.getElementById('app').append(w);
    return { w, close };
  }
  // Günlük bedava: reklam izle → 300 altın (günde 3)
  function freeLeft() { const d = CZ.state.data; const today = CZ.state.today(); if (d.freeAdDay !== today) { d.freeAdDay = today; d.freeAds = 0; } return 3 - (d.freeAds || 0); }
  function open(onClose, tab) {
    if (CZ.PC) { CZ.ui.toast(CZ.t('pc.noShop')); if (onClose) onClose(); return; }
    const d = CZ.state.data;
    const body = h('div', { class: 'shop-body' });
    const tabs = h('div', { class: 'shop-tabs' });
    let cur = tab || 'offers';
    const draw = () => {
      tabs.replaceChildren(...['offers', 'gold', 'gems'].map(k => h('button', { type: 'button', class: 'shop-tab' + (cur === k ? ' on' : ''), text: t('shop.' + k), onClick: () => { cur = k; draw(); } })));
      const card = p => {
        const owned = p.once && d.bought && d.bought[p.id];
        const ico = p.kind === 'gems' ? 'ui.emerald' : 'ui.gold';
        return h('div', { class: 'shop-card ' + p.kind + (p.tag ? ' tag-' + p.tag : '') },
          p.tag ? h('i', { class: 'shop-tag', text: t('shop.tag.' + p.tag) }) : null,
          p.kind === 'gold' || p.kind === 'gems' ? [img(ico, 'shop-ico'), h('b', { class: 'shop-n', text: p.n.toLocaleString() })]
            : [h('b', { class: 'shop-name', text: t('shop.p.' + p.id) }), h('small', { text: t('shop.d.' + p.id) })],
          owned ? h('b', { class: 'up-max', text: t('shop.owned') }) : btn(CZ.iap.priceOf(p.id), () => CZ.iap.buy(p.id, ok => { if (ok) { CZ.ui.toast(t('shop.thanks')); draw(); refreshMoney(); } }), 'primary'));
      };
      const kids = [];
      if (cur === 'offers') {
        const left = freeLeft();
        kids.push(h('div', { class: 'shop-card free' }, img('ui.gold', 'shop-ico'), h('b', { class: 'shop-n', text: '300' }), h('small', { text: t('shop.freeLeft', { n: left }) }),
          left > 0 ? btn(t('shop.watch'), () => CZ.ads.show(() => { d.freeAds = (d.freeAds || 0) + 1; d.gold = (d.gold || 0) + 300; CZ.state.save(); CZ.audio.sfx('buy'); draw(); refreshMoney(); }), 'ghost-dark', 'ic:play') : h('small', { text: t('shop.tomorrow') })));
        CZ.PRODUCTS.filter(p => p.kind === 'starter' || p.kind === 'noads').forEach(p => kids.push(card(p)));
        kids.push(h('div', { class: 'shop-card pass-ad' }, h('b', { class: 'shop-name', text: t('pass.title') }), h('small', { text: t('pass.pitch') }), btn(t('pass.open'), () => { closeIt(); openPass(onClose); }, 'primary')));
      } else CZ.PRODUCTS.filter(p => p.kind === cur).forEach(p => kids.push(card(p)));
      body.replaceChildren(...kids);
    };
    const money = h('div', { class: 'shop-money' });
    const refreshMoney = () => money.replaceChildren(h('span', {}, img('ui.gold', 'mini-ico'), String(d.gold || 0)), h('span', {}, img('ui.emerald', 'mini-ico'), String(d.emeralds || 0)));
    refreshMoney(); draw();
    const { close: closeIt } = wrapModal('shop-modal', [h('b', { class: 'lg-title', text: t('shop.title') }), money, tabs, body], onClose);
  }
  function openPass(onClose) {
    const P = CZ.pass.ensure(), T = CZ.pass.tier();
    const list = h('div', { class: 'pass-list' }, CZ.PASS.tiers.map(x => {
      const open2 = x.n <= T;
      const fb = P.got[x.n] ? h('b', { class: 'pass-ok', text: '✓' }) : open2 ? btn(t('pass.claim'), () => { CZ.pass.claim(x.n, false); redraw(); }, 'small primary') : null;
      const pb = P.gotP[x.n] ? h('b', { class: 'pass-ok', text: '✓' }) : open2 && P.prem ? btn(t('pass.claim'), () => { CZ.pass.claim(x.n, true); redraw(); }, 'small primary') : h('b', { class: 'pass-lock', text: '🔒' });
      return h('div', { class: 'pass-row' + (open2 ? ' open' : '') },
        h('div', { class: 'pass-cell' }, rewardChip(x.free), fb),
        h('b', { class: 'pass-n', text: String(x.n) }),
        h('div', { class: 'pass-cell prem' }, rewardChip(x.prem), pb));
    }));
    const k = (P.xp % CZ.PASS.xpPerTier) / CZ.PASS.xpPerTier;
    const head = h('div', { class: 'pass-head' },
      h('small', { text: t('pass.left', { n: CZ.pass.daysLeft() }) }),
      h('div', { class: 'pass-bar' }, h('i', { style: `width:${T >= 30 ? 100 : k * 100}%` }), h('span', { text: t('pass.tier', { n: T }) })),
      h('div', { class: 'pass-cols' }, h('b', { text: t('pass.free') }), h('b', { class: 'prem', text: t('pass.premium') })),
      P.prem ? null : btn(t('pass.buy') + ' · ' + CZ.iap.priceOf('pass'), () => CZ.iap.buy('pass', ok => { if (ok) { close(); openPass(onClose); } }), 'primary wide'));
    const { close } = wrapModal('pass-modal', [h('b', { class: 'lg-title', text: t('pass.title') }), head, list], onClose);
    const redraw = () => { close(); openPass(onClose); };
    setTimeout(() => { const row = list.children[Math.max(0, T - 2)]; if (row) row.scrollIntoView({ block: 'center' }); }, 50);
  }
  return { open, openPass };
})();
