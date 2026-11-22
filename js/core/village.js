// KÖY: Clash of Clans tarzı altın yutucu. Binalar seviye atlar, her seviye pahalılaşır ve uzar.
// Köy Meydanı diğer binaların tavanını belirler. Maden ve fırın sen yokken altın üretir.
// Kule baskınlarda savunma verir, kasa altının bir kısmını Zibo'dan saklar.
// Ahır, demirci ve gözcü kulesi Hazine Vadisi'ni güçlendirir.
CZ.VB = [
  { id: 'hall', max: 10, base: 1500, mul: 2.1, tbase: 10 },
  { id: 'goldmine', max: 10, base: 800, mul: 1.75, tbase: 2 },
  { id: 'elf', max: 6, base: 1500, mul: 2.4, tbase: 4 },
  { id: 'cookie', max: 5, base: 900, mul: 2.6, tbase: 3 },
  { id: 'gate', max: 6, base: 700, mul: 2.3, tbase: 2 },
  { id: 'jail', max: 5, base: 1200, mul: 2.6, tbase: 3 },
  { id: 'mine', max: 10, base: 400, mul: 1.75, tbase: 1 },
  { id: 'bakery', max: 10, base: 250, mul: 1.75, tbase: 1 },
  { id: 'vault', max: 8, base: 600, mul: 1.9, tbase: 2 },
  { id: 'tower', max: 10, base: 500, mul: 1.75, tbase: 2 },
  { id: 'stable', max: 6, base: 800, mul: 2.3, tbase: 3 },
  { id: 'forge', max: 8, base: 900, mul: 2, tbase: 3 },
  { id: 'lookout', max: 5, base: 700, mul: 2.6, tbase: 3 },
  { id: 'tree', max: 15, base: 1000, mul: 1.6, tbase: 1 },
  { id: 'house', max: 10, base: 500, mul: 1.8, tbase: 2 },     // (22 Kas) Barınak: hayatta kalanların yatakları
  { id: 'canteen', max: 10, base: 450, mul: 1.8, tbase: 2 }    // (22 Kas) Yemekhane: ekmek üretir, köylüler akşam burada yer
];
CZ.village = (function () {
  const PRODS = ['goldmine', 'elf', 'mine', 'bakery'];   // sen yokken üreten binalar
  // (22 Kas) bina içi EŞYALAR (3 eşya × 5 seviye) + atanmış SAKİNLER üretimi artırır
  const furn = id => { const V = ensure(); if (!V.furn) V.furn = {}; return V.furn[id] || (V.furn[id] = [0, 0, 0]); };
  const fmul = id => 1 + 0.04 * (PRODS.includes(id) ? furn(id).reduce((a, b) => a + b, 0) : 0) + (CZ.vilResB ? CZ.vilResB(id) : 0);
  const d = () => CZ.state.data;
  const def = id => CZ.VB.find(b => b.id === id);
  function ensure() {
    const D = d();
    if (!D.vil) D.vil = { lv: { hall: 1, goldmine: 0, mine: 1, bakery: 1, vault: 1, tower: 0, stable: 1, forge: 0, lookout: 0, tree: 1 }, job: null, store: { mine: 0, bakery: 0, goldmine: 0 }, at: Date.now(), builders: 1 };
    const V = D.vil;
    if (V.lv.goldmine == null) V.lv.goldmine = 0;
    if (V.store.goldmine == null) V.store.goldmine = 0;
    if (V.lv.elf == null) V.lv.elf = 0;
    if (V.lv.cookie == null) V.lv.cookie = 0;
    if (V.lv.gate == null) V.lv.gate = 0;
    if (V.lv.jail == null) V.lv.jail = 0;
    if (V.store.elf == null) V.store.elf = 0;
    if (V.lv.house == null) V.lv.house = 1; if (V.lv.canteen == null) V.lv.canteen = 1;
    CZ.VB.forEach(b => { if (V.lv[b.id] > b.max) V.lv[b.id] = b.max; });   // eski kayıtlarda yeni tavanı aşan seviye
    return V;
  }
  const lv = id => ensure().lv[id] || 0;
  // Köy Meydanı tavanı: diğer binalar en çok meydan × 2 (en az 2) seviyeye çıkar
  // Köy Meydanı tavanı: diğer binalar meydan seviyesiyle orantılı açılır (Meydan 10 → hepsi en üst seviye)
  const cap = id => id === 'hall' ? def(id).max : Math.max(1, Math.min(def(id).max, Math.ceil(def(id).max * (lv('hall') + 1) / 11)));
  const price = (id, L) => { const b = def(id); return Math.round(b.base * Math.pow(b.mul, L) / 10) * 10; };
  const minutes = (id, L) => Math.min(720, Math.round(def(id).tbase * Math.pow(1.55, L)));
  // Üretim (saatte) ve depo
  const rate = id => { const L = lv(id); if (!L) return 0; const r = 240 * L * (1 + L * 0.15) * fmul(id); return Math.round(id === 'goldmine' ? r * 0.35 : id === 'elf' ? Math.max(1, r * 0.006) : r); };
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
    boxes: lv('lookout'),
    hp: lv('cookie') * 3,
    slow: 1 - lv('gate') * 0.05,
    loot: 1 + lv('jail') * 0.1,
    run: 1 + lv('cookie') * 0.05
  });
  function tick() {
    const V = ensure();
    const now = Date.now();
    const hrs = Math.min(12, Math.max(0, (now - (V.at || now)) / 3600000));   // (22 Kas) çevrimdışı gelir en fazla 12 saat
    V.at = now;
    PRODS.forEach(id => {
      const capEach = id === 'elf' ? 12 * lv('elf') : Math.round(storeCap() * (id === 'mine' ? 0.6 : id === 'goldmine' ? 0.3 : 0.4));
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
    const res = id === 'mine' ? 'stone' : id === 'goldmine' ? 'gold' : id === 'elf' ? 'emeralds' : 'wood';
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
  const ready = () => { tick(); const V = ensure(); return Math.floor(V.store.mine + V.store.bakery + V.store.goldmine) >= 50 || V.store.elf >= 5 || (!V.job && CZ.VB.some(b => lv(b.id) < cap(b.id) && price(b.id, lv(b.id)) <= (d().gold || 0))); };
  // Bir binanın L seviyesindeki gerçek sayıları (oyunda kullanılan formüllerin aynısı)
  const rateAt = (id, L) => { if (!L) return 0; const r = 240 * L * (1 + L * 0.15) * fmul(id); return Math.round(id === 'goldmine' ? r * 0.35 : id === 'elf' ? Math.max(1, r * 0.006) : r); };
  function stats(id, L) {
    const R = [];
    switch (id) {
      case 'hall': R.push(['st.cap10', Math.ceil(10 * (L + 1) / 11)], ['st.cap5', Math.ceil(5 * (L + 1) / 11)]); break;
      case 'goldmine': R.push(['st.goldH', rateAt(id, L)]); break;
      case 'mine': R.push(['st.stoneH', rateAt(id, L)]); break;
      case 'bakery': R.push(['st.woodH', rateAt(id, L)]); break;
      case 'elf': R.push(['st.gemH', rateAt(id, L)], ['st.gemCap', 12 * L]); break;
      case 'vault': R.push(['st.protect', L ? Math.round(300 * Math.pow(L, 1.5)) : 0], ['st.store', Math.round(400 * Math.pow(L + 1, 1.55))]); break;
      case 'tower': R.push(['st.def', L * 3]); break;
      case 'stable': R.push(['st.mount', '+' + L * 4 + '%'], ['st.magnet', '+' + (L * 0.25).toFixed(2) + ' m']); break;
      case 'forge': R.push(['st.dmgP', '+' + Math.floor(L / 2)], ['st.cool', '-' + L * 3 + '%']); break;
      case 'lookout': R.push(['st.time', '+' + L * 10 + ' s'], ['st.boxes', '+' + L]); break;
      case 'cookie': R.push(['st.hp', '+' + L * 3], ['st.run', '+' + L * 5 + '%']); break;
      case 'gate': R.push(['st.slow', L * 5 + '%']); break;
      case 'jail': R.push(['st.loot', '+' + L * 10 + '%']); break;
      case 'tree': R.push(['st.glory', L]); break;
      case 'house': R.push(['st.beds', 2 + L * 2], ['st.comfort', L]); break;
      case 'canteen': R.push(['st.breadM', L * 2], ['st.seats', 2 + L * 2]); break;
    }
    return R;
  }
  return { PRODS, furn, fmul, stats, rateAt, ensure, startJob, lv, cap, price, minutes, rate, storeCap, protect, defense, bonus, tick, collect, upgrade, left, gemCost, rush, adRush, fmt, power, ready, def };
})();
