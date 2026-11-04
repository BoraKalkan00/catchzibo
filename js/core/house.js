// EVİM: ev durumu, bedeller, seviye, savunma, Zibo baskını, komşu botları.
// Çizim (izometrik dış görünüş ve oda içi) js/core/houseart.js içinde.
CZ.house = (function () {
  const d = () => CZ.state.data;
  const MAT_IDS = CZ.MATS.map(m => m.id);

  function blank() {
    const mats = {};
    MAT_IDS.forEach(id => { mats[id] = 0; });
    return {
      start: null, mats, parts: {}, rooms: {},
      paint: { ext: 'brick', roof: 'red' },
      owned: { ext: ['brick'], roof: ['red'], wall: ['cream'], floor: ['wood'] },
      lastRaid: null, raids: [], likes: {}, fresh: null
    };
  }

  function ensure() {
    const s = d();
    if (s.house && s.house.job && Date.now() >= s.house.job.end) applyJob(s.house);
    if (!s.house) {
      s.house = blank();
      s.house.start = CZ.state.today();
      Object.assign(s.house.mats, CZ.HOUSE_START);
      CZ.state.save();
    }
    return s.house;
  }

  const lv = (H, id) => H.parts[id] || 0;
  const partDef = id => CZ.PARTS.find(p => p.id === id);
  const roomDef = id => CZ.HROOMS.find(r => r.id === id);

  function needMet(H, need) {
    if (!need) return true;
    return Object.keys(need).every(k => k === 'room' ? !!H.rooms[need.room] : lv(H, k) >= need[k]);
  }
  function missing(H, need) {
    if (!need) return [];
    return Object.keys(need).filter(k => k === 'room' ? !H.rooms[need.room] : lv(H, k) < need[k])
      .map(k => k === 'room' ? 'room.' + need.room : 'part.' + k);
  }

  function nextCost(H, id) {
    const p = partDef(id);
    return p.levels[lv(H, id)] || null;
  }

  // Eksik olanlar: { brick: 5, gold: 40 } gibi.
  function shortOf(H, cost) {
    const out = {};
    Object.keys(cost || {}).forEach(k => {
      const have = k === 'gold' ? (d().gold || 0) : (H.mats[k] || 0);
      if (have < cost[k]) out[k] = cost[k] - have;
    });
    return out;
  }
  const canPay = (H, cost) => Object.keys(shortOf(H, cost)).length === 0;
  function pay(H, cost) {
    Object.keys(cost).forEach(k => {
      if (k === 'gold') d().gold -= cost[k];
      else H.mats[k] -= cost[k];
    });
  }

  function buyMat(id) {
    const H = ensure();
    const m = CZ.MATS.find(x => x.id === id);
    if ((d().gold || 0) < m.price) return false;
    d().gold -= m.price;
    H.mats[id] = (H.mats[id] || 0) + m.pack;
    CZ.state.save();
    return true;
  }

  // Bir parçayı yap ya da bir üst seviyeye çıkar.
  function build(id) {
    const H = ensure();
    const p = partDef(id);
    const cost = nextCost(H, id);
    if (!cost) return 'max';
    if (!needMet(H, p.need)) return 'need';
    if (!canPay(H, cost)) return 'short';
    if (H.job) return 'busy';
    pay(H, cost);
    startJob(H, id);
    if (CZ.quests) CZ.quests.track('build');
    return 'ok';
  }

  /* ---------- İşçi: süreli inşaat ---------- */
  function startJob(H, id) {
    const lvlIndex = id.startsWith('room.') ? 0 : lv(H, id);
    const mins = (CZ.BUILD_TIME[id] || [1])[Math.min(lvlIndex, (CZ.BUILD_TIME[id] || [1]).length - 1)];
    const now = Date.now();
    H.job = { id, start: now, end: now + mins * 60000 };
    CZ.state.save();
    if (CZ.notify) CZ.notify.schedule();
  }
  function applyJob(H) {
    const id = H.job.id;
    H.job = null;
    if (id.startsWith('room.')) {
      H.rooms[id.slice(5)] = { wall: 'cream', floor: 'wood', furn: {} };
      if (CZ.progress) CZ.progress.addXp(20);
    } else {
      H.parts[id] = lv(H, id) + 1;
      if (id === 'roof' && !H.rooms.living) H.rooms.living = { wall: 'cream', floor: 'wood', furn: {} };
      if (CZ.progress) CZ.progress.addXp(8);
    }
    H.fresh = id;
    CZ.state.save();
  }
  // Süresi dolan işi bitir. Bittiyse true.
  function tick() {
    const H = d().house;
    if (H && H.job && Date.now() >= H.job.end) { applyJob(H); return true; }
    return false;
  }
  const jobLeft = H => H.job ? Math.max(0, H.job.end - Date.now()) : 0;
  const speedCost = H => Math.max(1, Math.ceil(jobLeft(H) / 60000 / CZ.SPEEDUP_MIN_PER_EMERALD));
  function speedUp() {
    const H = ensure();
    if (!H.job) return 'none';
    const cost = speedCost(H);
    if ((d().emeralds || 0) < cost) return 'short';
    d().emeralds -= cost;
    applyJob(H);
    return 'ok';
  }

  function addRoom(id) {
    const H = ensure();
    const r = roomDef(id);
    if (H.rooms[id]) return 'max';
    if (!needMet(H, r.need)) return 'need';
    if (r.cost && !canPay(H, r.cost)) return 'short';
    if (H.job) return 'busy';
    if (r.cost) pay(H, r.cost);
    startJob(H, 'room.' + id);
    if (CZ.quests) CZ.quests.track('build');
    return 'ok';
  }

  function furnCost(H, roomId, f) {
    const tier = (H.rooms[roomId].furn[f] || 0);
    const price = CZ.FURN[f][tier];
    return price === undefined ? null : { gold: price };
  }
  function buyFurn(roomId, f) {
    const H = ensure();
    const cost = furnCost(H, roomId, f);
    if (!cost) return 'max';
    if (!canPay(H, cost)) return 'short';
    pay(H, cost);
    H.rooms[roomId].furn[f] = (H.rooms[roomId].furn[f] || 0) + 1;
    H.freshFurn = roomId + '.' + f;
    if (CZ.quests) CZ.quests.track('furn');
    CZ.state.save();
    if (CZ.progress) CZ.progress.addXp(4);
    return 'ok';
  }

  // Boyalar: kind = ext | roof | wall | floor. Oda boyası için roomId de verilir.
  function paint(kind, id, roomId) {
    const H = ensure();
    const def = CZ.PAINTS[kind].find(p => p.id === id);
    const owned = H.owned[kind];
    if (!owned.includes(id)) {
      if ((d().gold || 0) < def.price) return 'short';
      d().gold -= def.price;
      owned.push(id);
    }
    if (kind === 'ext' || kind === 'roof') H.paint[kind] = id;
    else H.rooms[roomId][kind] = id;
    CZ.state.save();
    return 'ok';
  }

  /* ---------- Seviye ve savunma ---------- */
  function level(H) {
    let n = 0;
    CZ.PARTS.forEach(p => { n += lv(H, p.id); });
    Object.keys(H.rooms).forEach(id => {
      n += 5;
      const f = H.rooms[id].furn || {};
      Object.keys(f).forEach(k => { n += f[k]; });
    });
    ['ext', 'roof', 'wall', 'floor'].forEach(k => { n += Math.max(0, (H.owned[k] || []).length - 1); });
    return n;
  }
  function defense(H) {
    let n = 0;
    CZ.PARTS.forEach(p => { if (p.def) n += p.def * lv(H, p.id); });
    return n;
  }
  const maxDefense = () => CZ.PARTS.reduce((s, p) => s + (p.def ? p.def * p.levels.length : 0), 0);

  // Kabuk (ilk ev) sırası: oyuncuya "sıradaki adım" olarak gösterilir.
  const SHELL = ['found', 'wall1', 'wall2', 'wall3', 'wall4', 'door', 'win', 'roof'];
  function nextShell(H) {
    return SHELL.find(id => lv(H, id) < 1) || null;
  }

  function daysSince(dateStr) {
    if (!dateStr) return 0;
    const a = new Date(dateStr + 'T00:00:00');
    const b = new Date(CZ.state.today() + 'T00:00:00');
    return Math.max(0, Math.round((b - a) / 86400000));
  }

  /* ---------- Zibo baskını ---------- */
  // Günde bir kez, ev kapısı varsa ve ev ilk günü değilse: gece Zibo gelir.
  function checkRaid() {
    const H = d().house;
    if (!H || lv(H, 'door') < 1) return null;
    const today = CZ.state.today();
    if (H.lastRaid === today || H.start === today) return null;
    const R = CZ.RAID;
    const lvl = level(H);
    const day = daysSince(H.start);
    const attack = Math.min(R.attackMax, R.attackBase + day * R.attackPerDay + lvl * R.attackPerLevel) + (Math.random() * 2 - 1) * R.spread;
    const def = defense(H);
    const gold = d().gold || 0;
    let res;
    if (def >= attack) {
      res = { date: today, won: true, gold: R.bounty + Math.round(lvl / 2), attack: Math.round(attack), def };
      d().gold = gold + res.gold;
    } else {
      const steal = gold < R.minGold ? 0 : Math.min(Math.round(gold * R.stealShare), R.stealBase + lvl * R.stealPerLevel);
      // Zibo en zayıf yerden girer: kapı, pencere ya da çit.
      const weak = ['door', 'win', 'fence'].sort((a, b) => lv(H, a) - lv(H, b))[0];
      res = { date: today, won: false, gold: steal, attack: Math.round(attack), def, weak };
      d().gold = gold - steal;
    }
    H.lastRaid = today;
    H.raids.unshift(res);
    H.raids = H.raids.slice(0, 7);
    H.raidSeen = false;
    CZ.state.save();
    return res;
  }

  // Merkezde gösterilen baskın raporu.
  function raidBox(root, onDone) {
    const H = d().house;
    if (!H) return false;
    if (!(H.raids[0] && H.raidSeen === false)) {
      if (!checkRaid()) return false;
    }
    const r = H.raids[0];
    H.raidSeen = true;
    CZ.state.save();
    const { h, img, btn } = CZ.ui;
    const t = CZ.t;
    const wrap = h('div', { class: 'modal-wrap raid-wrap' },
      h('div', { class: 'modal raid-modal ' + (r.won ? 'won' : 'lost') },
        h('small', { text: t('raid.night') }),
        h('h2', { text: r.won ? t('raid.wonTitle') : t('raid.lostTitle') }),
        img(r.won ? 'zibo.tantrum' : 'zibo.runLoot', 'raid-zibo'),
        h('p', { class: 'raid-line', text: '“' + t(r.won ? 'raid.wonZibo' : 'raid.lostZibo.' + (r.weak || 'door')) + '”' }),
        h('div', { class: 'raid-bars' },
          h('span', {}, '⚔️ ', t('raid.attack'), ' ', h('b', { text: r.attack })),
          h('span', {}, '🛡️ ', t('raid.defense'), ' ', h('b', { text: r.def }))),
        h('div', { class: 'chips' }, h('span', { class: 'chip' + (r.won ? '' : ' minus') }, img('ui.gold', 'chip-icon'), (r.won ? '+' : '−') + r.gold)),
        !r.won && r.gold ? h('p', { class: 'small-note', text: t('raid.revengeTip', { n: Math.ceil(r.gold * 0.6) }) }) : null,
        h('div', { class: 'row' },
          btn(t('common.continue'), () => { wrap.remove(); if (onDone) onDone(); }, 'ghost-dark'),
          btn(t('raid.fix'), () => { wrap.remove(); CZ.ui.wipeTo('house'); }, 'primary'))));
    root.append(wrap);
    CZ.audio.sfx(r.won ? 'win' : 'lose');
    CZ.audio.vibrate(r.won ? [30, 30, 80] : [120, 60, 120]);
    return true;
  }

  // İntikam: son baskında çalınan altının %60'ı, kovalamacada Zibo yakalanınca geri gelir (bir kez).
  function revenge() {
    const H = d().house;
    const r = H && H.raids && H.raids[0];
    if (!r || r.won || r.revenged || !r.gold) return 0;
    if (daysSince(r.date) > 2) return 0;
    const back = Math.ceil(r.gold * 0.6);
    r.revenged = true;
    d().gold = (d().gold || 0) + back;
    CZ.state.save();
    return back;
  }

  // Kunduz Usta'nın ev ekranındaki sözü ve pozu: evin durumuna göre.
  function ustaLine(H, fresh) {
    const name = id => id.startsWith('room.') ? CZ.t(id) : CZ.t('part.' + id);
    if (fresh) return { key: 'usta.done', pose: 'cheer', p: { name: name(fresh) } };
    if (H.job) return { key: 'usta.working', pose: 'hammer', p: { name: name(H.job.id) } };
    if (!lv(H, 'found')) return { key: 'usta.hello', pose: 'wave' };
    const next = nextShell(H);
    if (next) return canPay(H, nextCost(H, next)) ? { key: 'usta.next', pose: 'talk', p: { name: name(next) } } : { key: 'usta.mats', pose: 'think', p: { name: name(next) } };
    const share = defense(H) / maxDefense();
    if (H.raids && H.raids[0] && !H.raids[0].won && H.raids[0].date === CZ.state.today()) return { key: 'usta.raided', pose: 'worried' };
    if (share < 0.25) return { key: 'usta.weak', pose: 'worried' };
    if (share < 0.5) return { key: 'usta.meh', pose: 'think' };
    if (share < 0.8) return { key: 'usta.ok', pose: 'talk' };
    return { key: 'usta.strong', pose: 'cheer' };
  }

  // Zibo'nun ev ekranındaki laf sokması: savunmaya göre.
  function ziboLine(H) {
    if (!lv(H, 'found')) return 'house.z.empty';
    if (nextShell(H)) return 'house.z.building';
    const share = defense(H) / maxDefense();
    if (share < 0.25) return 'house.z.weak';
    if (share < 0.5) return 'house.z.meh';
    if (share < 0.8) return 'house.z.ok';
    return 'house.z.strong';
  }

  /* ---------- Komşular (botlar) ---------- */
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Hedef seviyeye kadar bir evi otomatik kurar (botlar için).
  function grow(target, seed) {
    const H = blank();
    const r = rng(seed);
    const pickPaint = kind => {
      const list = CZ.PAINTS[kind];
      return list[Math.floor(r() * list.length)].id;
    };
    const order = ['found', 'wall1', 'wall2', 'wall3', 'wall4', 'door', 'win', 'roof', 'fence', 'garden', 'chimney'];
    for (const id of order) {
      if (level(H) >= target) break;
      H.parts[id] = 1;
      if (id === 'roof') H.rooms.living = { wall: pickPaint('wall'), floor: pickPaint('floor'), furn: {} };
    }
    const ext = pickPaint('ext'), roof = pickPaint('roof');
    if (level(H) >= 8) {
      H.paint.ext = ext; H.paint.roof = roof;
      if (ext !== 'brick') H.owned.ext.push(ext);
      if (roof !== 'red') H.owned.roof.push(roof);
    }
    let guard = 0;
    while (level(H) < target && guard++ < 500) {
      const roll = r();
      if (roll < 0.45) {
        const p = CZ.PARTS[Math.floor(r() * CZ.PARTS.length)];
        if (lv(H, p.id) < p.levels.length && needMet(H, p.need)) H.parts[p.id] = lv(H, p.id) + 1;
      } else if (roll < 0.6) {
        const next = CZ.HROOMS.find(x => !H.rooms[x.id] && needMet(H, x.need));
        if (next) H.rooms[next.id] = { wall: pickPaint('wall'), floor: pickPaint('floor'), furn: {} };
      } else {
        const ids = Object.keys(H.rooms);
        if (!ids.length) continue;
        const room = H.rooms[ids[Math.floor(r() * ids.length)]];
        const list = roomDef(ids.find(k => H.rooms[k] === room)).furn;
        const f = list[Math.floor(r() * list.length)];
        if ((room.furn[f] || 0) < 3) room.furn[f] = (room.furn[f] || 0) + 1;
      }
    }
    return H;
  }

  function neighbors() {
    const H = ensure();
    const day = daysSince(H.start);
    return CZ.NEIGHBORS.map(n => {
      const target = Math.round(n.base + n.rate * day);
      const house = grow(target, n.seed * 1000 + Math.min(day, 400));
      const r = rng(n.seed);
      const kind = r() < 0.5 ? 'boy' : 'girl';
      // Altın Avı rekoru: her komşunun kendi yeteneği var, günler geçtikçe biraz artar.
      const goldBest = Math.round(50 + n.seed * 2.2 + Math.min(day, 30) * 2.5 + r() * 30);
      return { id: n.id, name: CZ.t('hood.name.' + n.id), pos: CZ.t('hood.pos.' + n.id), level: level(house), house, bot: true,
        kind, look: CZ.avatarArt.botLook(n.seed, kind), goldBest };
    });
  }

  // type: 'level' (ev seviyesi) ya da 'gold' (Altın Avı rekoru)
  function ranking(type) {
    const H = ensure();
    const me = { id: 'me', name: CZ.t('hood.you'), level: level(H), house: H, me: true, kind: d().avatar || 'girl', goldBest: d().goldBest || 0 };
    const key = type === 'gold' ? 'goldBest' : 'level';
    return neighbors().concat([me]).sort((a, b) => b[key] - a[key]);
  }

  // Ev ismi: 1000 elmas. Mahallede de görünür.
  const NAME_PRICE = 1000;
  function setName(name) {
    const H = ensure();
    const clean = String(name || '').replace(/[<>]/g, '').trim().slice(0, 22);
    if (!clean) return 'empty';
    if (!H.name) {
      if ((d().emeralds || 0) < NAME_PRICE) return 'short';
      d().emeralds -= NAME_PRICE;
    }
    H.name = clean;
    CZ.state.save();
    return 'ok';
  }
  const title = H => (H && H.name) || null;

  function like(id) {
    const H = ensure();
    const today = CZ.state.today();
    if (H.likes[id] === today) return false;
    H.likes[id] = today;
    d().gold = (d().gold || 0) + 5;
    CZ.state.save();
    if (CZ.quests) CZ.quests.track('like');
    return true;
  }

  // Merkezdeki "Evim" düğmesinde nokta: yapılabilecek bir adım var mı?
  function attention() {
    const H = d().house;
    if (!H) return true;
    if (H.job) return Date.now() >= H.job.end;
    const id = nextShell(H);
    if (id) return canPay(H, nextCost(H, id));
    return false;
  }

  return {
    attention, ensure, lv, partDef, roomDef, needMet, missing, nextCost, shortOf, canPay, buyMat, build, addRoom,
    furnCost, buyFurn, paint, level, defense, maxDefense, nextShell, SHELL, checkRaid, raidBox, ziboLine,
    ustaLine, tick, jobLeft, speedCost, speedUp, revenge, neighbors, ranking, like, grow, daysSince, setName, title, NAME_PRICE
  };
})();
