// SİPARİŞ PANOSU + ATÖLYE
// Köylüler istek bırakır (odun, taş, tahta, tuğla, demir). Teslim edince altın, itibar, bazen zümrüt.
// Atölye: ham kaynağı işler (5 odun = 1 tahta ...). İşlenmiş malzeme üst seviye kuleler ve siparişler için gerekir.
CZ.orders = (function () {
  const NPCS = ['baker', 'lumber', 'girl', 'smith'];
  const VAL = { wood: 2, stone: 2.5, plank: 12, brick: 14, iron: 30 };
  const RECIPES = { plank: { wood: 5 }, brick: { stone: 5 }, iron: { stone: 8, wood: 6 } };
  const WAIT = 8 * 60000;   // teslimden sonra yeni sipariş gelene kadar
  const d = () => CZ.state.data;
  function ensure() {
    const D = d(); if (!D.ord) D.ord = { slots: [null, null, null], rep: 0, done: 0 };
    D.ord.slots.forEach((s, i) => { if (!s || (s.wait && Date.now() >= s.wait)) D.ord.slots[i] = make(i); });
    return D.ord;
  }
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  function make(i) {
    const rep = d().ord ? d().ord.rep : 0, m = 1 + rep * 0.12;
    const pool = ['wood', 'stone', 'plank'].concat(rep >= 2 ? ['brick'] : [], rep >= 5 ? ['iron'] : []);
    const kinds = pool.sort(() => Math.random() - 0.5).slice(0, Math.min(pool.length, rnd(1, rep >= 3 ? 3 : 2)));
    const need = {};
    kinds.forEach(k => { need[k] = Math.max(1, Math.round((k === 'wood' || k === 'stone' ? rnd(15, 30) : k === 'iron' ? rnd(1, 3) : rnd(2, 5)) * m)); });
    const val = Object.keys(need).reduce((s, k) => s + need[k] * VAL[k], 0);
    return { npc: NPCS[(i + rnd(0, 3)) % 4], need, gold: Math.round(val * 1.7 / 5) * 5, gems: Math.random() < 0.18 + rep * 0.01 ? rnd(1, 2) : 0 };
  }
  const can = o => o && !o.wait && Object.keys(o.need).every(k => (d()[k] || 0) >= o.need[k]);
  function deliver(i) {
    const O = ensure(), o = O.slots[i]; if (!can(o)) return null;
    Object.keys(o.need).forEach(k => { d()[k] -= o.need[k]; });
    d().gold = (d().gold || 0) + o.gold; if (o.gems) d().emeralds = (d().emeralds || 0) + o.gems;
    O.done++; if (O.done % 3 === 0) O.rep++;   // her 3 siparişte itibar seviyesi
    if (CZ.pass) CZ.pass.addXp(15);
    O.slots[i] = { wait: Date.now() + WAIT, npc: o.npc };
    CZ.state.save(); return o;
  }
  function skip(i) { const O = ensure(); O.slots[i] = make(i); CZ.state.save(); }   // reklamla bekleme biter / siparişi değiştir
  function trash(i) { const O = ensure(); const o = O.slots[i]; O.slots[i] = { wait: Date.now() + WAIT, npc: o && o.npc }; CZ.state.save(); }
  function craft(k, n) {
    const R = RECIPES[k]; n = n || 1;
    if (!Object.keys(R).every(r => (d()[r] || 0) >= R[r] * n)) return false;
    Object.keys(R).forEach(r => { d()[r] -= R[r] * n; }); d()[k] = (d()[k] || 0) + n; CZ.state.save(); return true;
  }
  const maxCraft = k => Math.min(...Object.keys(RECIPES[k]).map(r => Math.floor((d()[r] || 0) / RECIPES[k][r])));
  const ready = () => ensure().slots.some(can);
  return { ensure, can, deliver, skip, trash, craft, maxCraft, ready, RECIPES, NPCS };
})();
