// KAHRAMAN KOLEKSİYONU: parça (shard) topla, kahramanı aç, seviye atlat, yanına al.
// Rastgele ücretli kutu yok: parayla/zümrütle hep seçtiğin kahramanın parçası alınır.
CZ.HEROES = [
  // look: CZ.KK_LOOKS anahtarı; rar: 0 sıradan, 1 nadir, 2 efsanevi
  { id: 'mila', look: 'elf', rar: 0, role: 'guard' },
  { id: 'rudi', look: 'reindeer', rar: 0, role: 'wood' },
  { id: 'ela', look: 'girl', rar: 0, role: 'stone' },
  { id: 'buzbas', look: 'snowkid', rar: 1, role: 'freeze' },
  { id: 'demir', look: 'knight', rar: 1, role: 'fight' },
  { id: 'noel', look: 'santa', rar: 2, role: 'gift' }
];
CZ.heroes = (function () {
  const MAX = 10;
  const d = () => CZ.state.data;
  const def = id => CZ.HEROES.find(h => h.id === id);
  function all() {
    const D = d();
    if (!D.heroes) D.heroes = { mila: { lv: 1, sh: 0 } };
    CZ.HEROES.forEach(h => { if (!D.heroes[h.id]) D.heroes[h.id] = { lv: 0, sh: 0 }; });
    return D.heroes;
  }
  const st = id => all()[id];
  const owned = id => st(id).lv > 0;
  const lv = id => st(id).lv;
  // açmak için gereken parça: sıradan 10, nadir 25, efsanevi 50; seviye atlamak için artar
  const unlockNeed = id => [10, 25, 50][def(id).rar];
  const upNeed = id => { const L = lv(id), r = def(id).rar; return { sh: Math.round((6 + L * 4) * [1, 1.6, 2.4][r]), gold: Math.round(150 * L * [1, 1.5, 2.2][r]) }; };
  function add(id, n) { const s = st(id); s.sh += n; CZ.state.save(); }
  function canUnlock(id) { return !owned(id) && st(id).sh >= unlockNeed(id); }
  function unlock(id) { if (!canUnlock(id)) return false; const s = st(id); s.sh -= unlockNeed(id); s.lv = 1; CZ.state.save(); return true; }
  function canUp(id) { if (!owned(id) || lv(id) >= MAX) return false; const n = upNeed(id); return st(id).sh >= n.sh && (d().gold || 0) >= n.gold; }
  function up(id) { if (!canUp(id)) return false; const n = upNeed(id), s = st(id); s.sh -= n.sh; d().gold -= n.gold; s.lv++; CZ.state.save(); return true; }
  // yanındaki kahraman (Mila hep köyü korur, yanına alınamaz)
  function buddy() { const b = d().buddy; return b && owned(b) && b !== 'mila' ? b : null; }
  function setBuddy(id) { d().buddy = id; CZ.state.save(); }
  // rastgele parça (oyunda kazanılan ödül): nadir olan daha seyrek düşer, maksimum seviyedekiler düşmez
  function randomDrop(n) {
    const pool = [];
    CZ.HEROES.forEach(h => { if (h.id === 'mila' && lv('mila') >= MAX) return; if (lv(h.id) >= MAX) return; const w = [6, 3, 1][h.rar]; for (let k = 0; k < w; k++) pool.push(h.id); });
    if (!pool.length) return null;
    const id = pool[Math.floor(Math.random() * pool.length)];
    add(id, n); return id;
  }
  // yeni bir şey yapılabilir mi (rozet için)
  const hasNews = () => CZ.HEROES.some(h => canUnlock(h.id) || canUp(h.id));
  // köy savunmasına katkı (gece baskını): sahip olunan kahramanların seviyeleri
  const defense = () => CZ.HEROES.reduce((n, h) => n + (owned(h.id) ? lv(h.id) * (h.id === 'mila' ? 0.5 : 0.25) : 0), 0);
  const ports = {};
  function portrait(id) {
    if (ports[id]) return ports[id];
    try { ports[id] = CZ.kk.portrait(def(id).look, 'front'); } catch (e) { ports[id] = ''; }
    return ports[id];
  }
  return { MAX, def, all, st, owned, lv, unlockNeed, upNeed, add, canUnlock, unlock, canUp, up, buddy, setBuddy, randomDrop, hasNews, defense, portrait };
})();
