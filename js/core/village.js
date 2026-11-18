// KÖY: Clash of Clans tarzı altın yutucu. Binalar seviye atlar, her seviye pahalılaşır ve uzar.
// Köy Meydanı diğer binaların tavanını belirler. Maden ve fırın sen yokken altın üretir.
// Kule baskınlarda savunma verir, kasa altının bir kısmını Zibo'dan saklar.
// Ahır, demirci ve gözcü kulesi Hazine Vadisi'ni güçlendirir.
CZ.VB = [
  { id: 'hall', max: 10, base: 1500, mul: 2.1, tbase: 10 },
  { id: 'mine', max: 15, base: 400, mul: 1.62, tbase: 1 },
  { id: 'bakery', max: 15, base: 250, mul: 1.6, tbase: 1 },
  { id: 'vault', max: 15, base: 600, mul: 1.6, tbase: 2 },
  { id: 'tower', max: 15, base: 500, mul: 1.62, tbase: 2 },
  { id: 'stable', max: 12, base: 800, mul: 1.7, tbase: 3 },
  { id: 'forge', max: 12, base: 900, mul: 1.7, tbase: 3 },
  { id: 'lookout', max: 10, base: 700, mul: 1.75, tbase: 3 },
  { id: 'tree', max: 25, base: 1000, mul: 1.45, tbase: 1 }
];
CZ.village = (function () {
  const d = () => CZ.state.data;
  const def = id => CZ.VB.find(b => b.id === id);
  function ensure() {
    const D = d();
    if (!D.vil) D.vil = { lv: { hall: 1, mine: 1, bakery: 1, vault: 1, tower: 0, stable: 1, forge: 0, lookout: 0, tree: 1 }, job: null, store: { mine: 0, bakery: 0 }, at: Date.now(), builders: 1 };
    return D.vil;
  }
  const lv = id => ensure().lv[id] || 0;
  // Köy Meydanı tavanı: diğer binalar en çok meydan × 2 (en az 2) seviyeye çıkar
  const cap = id => id === 'hall' ? def(id).max : Math.min(def(id).max, Math.max(2, lv('hall') * 2));
  const price = (id, L) => { const b = def(id); return Math.round(b.base * Math.pow(b.mul, L) / 10) * 10; };
  const minutes = (id, L) => Math.min(720, Math.round(def(id).tbase * Math.pow(1.55, L)));
  // Üretim (saatte) ve depo
  const rate = id => { const L = lv(id); if (!L) return 0; return Math.round((id === 'mine' ? 60 : 40) * L * (1 + L * 0.15)); };
  const storeCap = () => Math.round(400 * Math.pow(lv('vault') + 1, 1.55));
  const protect = () => lv('vault') ? Math.round(300 * Math.pow(lv('vault'), 1.5)) : 0;
  const defense = () => lv('tower') * 3;
  // Vadi etkileri
  const bonus = () => ({
    speed: 1 + lv('stable') * 0.04,
    magnet: lv('stable') * 0.25,
    dmg: Math.floor(lv('forge') / 2),
    cool: 1 - lv('forge') * 0.03,
    time: lv('lookout') * 10,
    boxes: lv('lookout')
  });
  function tick() {
    const V = ensure();
    const now = Date.now();
    const hrs = Math.max(0, (now - (V.at || now)) / 3600000);
    V.at = now;
    ['mine', 'bakery'].forEach(id => {
      const capEach = Math.round(storeCap() * (id === 'mine' ? 0.6 : 0.4));
      V.store[id] = Math.min(capEach, (V.store[id] || 0) + rate(id) * hrs);
    });
    if (V.job && now >= V.job.end) finish(V);
  }
  function finish(V) {
    V.lv[V.job.id] = V.job.to;
    V.done = V.job.id;
    V.job = null;
    CZ.state.save();
  }
  function collect(id) {
    tick();
    const V = ensure();
    const n = Math.floor(V.store[id] || 0);
    if (n <= 0) return 0;
    V.store[id] -= n;
    // altın yalnız goblinlerden gelir: maden taş, fırın (oduncu) odun üretir
    const res = id === 'mine' ? 'stone' : 'wood';
    d()[res] = (d()[res] || 0) + n;
    CZ.state.save();
    return n;
  }
  function upgrade(id) {
    tick();
    const V = ensure();
    if (V.job) return 'busy';
    const L = lv(id);
    if (L >= cap(id)) return 'cap';
    const p = price(id, L);
    if ((d().gold || 0) < p) return 'short';
    d().gold -= p;
    const m = minutes(id, L);
    V.job = { id, to: L + 1, start: Date.now(), end: Date.now() + m * 60000, ads: 0 };
    if (m <= 0) finish(V);
    CZ.state.save();
    return 'ok';
  }
  // Kaynaklar dünyadaki daireye akıtıldıysa bedava başlat (fiyat orada ödendi)
  function startJob(id) {
    tick();
    const V = ensure();
    if (V.job) return 'busy';
    const L = lv(id);
    if (L >= cap(id)) return 'cap';
    const m = minutes(id, L);
    V.job = { id, to: L + 1, start: Date.now(), end: Date.now() + m * 60000, ads: 0 };
    CZ.state.save();
    return 'ok';
  }
  const left = () => { const V = ensure(); return V.job ? Math.max(0, V.job.end - Date.now()) : 0; };
  const gemCost = () => Math.max(1, Math.ceil(left() / 60000 / 6));
  function rush() {
    const V = ensure();
    if (!V.job) return 'none';
    const c = gemCost();
    if ((d().emeralds || 0) < c) return 'short';
    d().emeralds -= c;
    finish(V);
    return 'ok';
  }
  function adRush() {
    const V = ensure();
    if (!V.job || V.job.ads >= 3) return 'none';
    V.job.ads++;
    V.job.end -= 30 * 60000;
    if (Date.now() >= V.job.end) finish(V);
    CZ.state.save();
    return 'ok';
  }
  const fmt = ms => { const s = Math.ceil(ms / 1000), p2 = n => String(n).padStart(2, '0'); return s >= 3600 ? Math.floor(s / 3600) + ':' + p2(Math.floor(s % 3600 / 60)) + ':' + p2(s % 60) : Math.floor(s / 60) + ':' + p2(s % 60); };
  const power = () => CZ.VB.reduce((n, b) => n + lv(b.id) * (b.id === 'hall' ? 5 : 1), 0);
  const ready = () => { tick(); const V = ensure(); return Math.floor(V.store.mine + V.store.bakery) >= 50 || (!V.job && CZ.VB.some(b => lv(b.id) < cap(b.id) && price(b.id, lv(b.id)) <= (d().gold || 0))); };
  return { ensure, startJob, lv, cap, price, minutes, rate, storeCap, protect, defense, bonus, tick, collect, upgrade, left, gemCost, rush, adRush, fmt, power, ready, def };
})();
