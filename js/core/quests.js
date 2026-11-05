// GÜNLÜK GÖREVLER: her gün 3 görev, bütün oyun modlarını birbirine bağlar.
// İlk gün sabit (oyunu öğretir): temel at, Altın Avı oyna, gardıropta bir şey değiştir.
// 3'ü de bitince görev sandığı.
CZ.QUESTS = [
  { id: 'find', n: 2, reward: { emeralds: 15 } },
  { id: 'chase', n: 1, reward: { emeralds: 10 } },
  { id: 'perfect', n: 1, reward: { emeralds: 15 } },
  { id: 'goldRun', n: 2, reward: { gold: 60 } },
  { id: 'crate', n: 25, reward: { gold: 80 } },
  { id: 'dodge', n: 5, reward: { gold: 60 } },
  { id: 'wardrobe', n: 1, reward: { emeralds: 5 } }
];
CZ.QUEST_FIRST_DAY = [{ id: 'find', n: 2 }, { id: 'goldRun', n: 1 }, { id: 'wardrobe', n: 1 }];
CZ.QUEST_CHEST = { emeralds: 25, gold: 100 };

CZ.quests = (function () {
  const d = () => CZ.state.data;
  const def = id => CZ.QUESTS.find(q => q.id === id);

  function today() {
    const s = d();
    const day = CZ.state.today();
    if (!s.quests || s.quests.day !== day) {
      const first = !s.quests;
      let list;
      if (first) list = CZ.QUEST_FIRST_DAY.map(q => ({ id: q.id, n: q.n }));
      else {
        // Günün tarihine göre karışık ama aynı gün hep aynı.
        let seed = 0;
        for (const ch of day) seed = (seed * 33 + ch.charCodeAt(0)) >>> 0;
        const pool = CZ.QUESTS.filter(q => (q.id !== 'find' && q.id !== 'perfect' && q.id !== 'chase') || (CZ.game && CZ.game.nextOpen && CZ.game.nextOpen()));
        list = [];
        while (list.length < 3 && pool.length) {
          seed = (seed * 1103515245 + 12345) >>> 0;
          const q = pool.splice(seed % pool.length, 1)[0];
          list.push({ id: q.id, n: q.n });
        }
      }
      s.quests = { day, list: list.map(q => ({ id: q.id, n: q.n, have: 0, claimed: false })), chest: false };
      CZ.state.save();
    }
    return s.quests;
  }

  // Oyun içinden çağrılır: CZ.quests.track('crate', 1)
  function track(id, amount) {
    const q = today();
    let changed = false;
    q.list.forEach(item => {
      if (item.id === id && item.have < item.n) { item.have = Math.min(item.n, item.have + (amount || 1)); changed = true; }
    });
    if (changed) CZ.state.save();
  }

  const rewardOf = item => (def(item.id) || {}).reward || { gold: 30 };
  function give(r) {
    const s = d();
    if (r.gold) s.gold = (s.gold || 0) + r.gold;
    if (r.emeralds) s.emeralds = (s.emeralds || 0) + r.emeralds;
  }
  function claim(i) {
    const q = today();
    const item = q.list[i];
    if (!item || item.claimed || item.have < item.n) return null;
    item.claimed = true;
    const r = rewardOf(item);
    give(r);
    CZ.state.save();
    return r;
  }
  function claimChest() {
    const q = today();
    if (q.chest || !q.list.every(x => x.claimed)) return null;
    q.chest = true;
    give(CZ.QUEST_CHEST);
    CZ.state.save();
    return CZ.QUEST_CHEST;
  }
  const ready = () => { const q = today(); return q.list.some(x => !x.claimed && x.have >= x.n) || (!q.chest && q.list.every(x => x.claimed)); };
  const doneCount = () => today().list.filter(x => x.claimed).length;

  // Görev penceresi
  function open(root, onClose) {
    const { h, img, btn } = CZ.ui;
    const t = CZ.t;
    const wrap = h('div', { class: 'modal-wrap' });
    const chips = r => h('span', { class: 'q-reward' }, r.gold ? [img('ui.gold', 'chip-icon'), '+' + r.gold] : null, r.emeralds ? [img('ui.emerald', 'chip-icon'), '+' + r.emeralds] : null);
    const GO = { find: 'mansion', chase: 'mansion', perfect: 'mansion', goldRun: 'gold', crate: 'gold', dodge: 'gold', wardrobe: 'chars' };
    const draw = () => {
      const q = today();
      const all = q.list.every(x => x.claimed);
      wrap.replaceChildren(h('div', { class: 'modal quest-modal' },
        h('h2', { text: t('quest.title') }),
        h('p', { class: 'small-note', text: t('quest.sub') }),
        q.list.map((item, i) => {
          const done = item.have >= item.n;
          return h('div', { class: 'quest-row' + (item.claimed ? ' claimed' : done ? ' done' : '') },
            h('div', { class: 'quest-text' },
              h('strong', { text: t('quest.' + item.id, { n: item.n }) }),
              h('div', { class: 'quest-bar' }, h('i', { style: `width:${item.have / item.n * 100}%` })),
              h('small', { text: `${item.have}/${item.n}` })),
            item.claimed ? h('span', { class: 'quest-check', text: '✓' })
              : done ? h('button', { class: 'btn small primary pulse', type: 'button', onClick: e => { const r = claim(i); if (r) { if (r.gold) CZ.ui.fly(e.currentTarget, 'gold', r.gold); if (r.emeralds) CZ.ui.fly(e.currentTarget, 'emeralds', r.emeralds); } CZ.audio.sfx('buy'); CZ.audio.vibrate(30); draw(); } }, chips(rewardOf(item)))
                : h('button', { class: 'btn small ghost-dark', type: 'button', onClick: () => { wrap.remove(); CZ.ui.wipeTo(GO[item.id]); } }, t('quest.go'), chips(rewardOf(item))));
        }),
        h('div', { class: 'quest-chest' + (all && !q.chest ? ' ready' : '') },
          img('gold.chest_gold', 'quest-chest-img'),
          h('div', {}, h('strong', { text: t('quest.chest') }), chips(CZ.QUEST_CHEST)),
          q.chest ? h('span', { class: 'quest-check', text: '✓' })
            : btn(t('daily.claim'), () => {
              const box = wrap.querySelector('.quest-chest');
              if (!claimChest()) { CZ.audio.sfx('wrong'); return CZ.ui.toast(t('quest.chestLocked')); }
              CZ.ui.fly(box, 'gold', CZ.QUEST_CHEST.gold); CZ.ui.fly(box, 'emeralds', CZ.QUEST_CHEST.emeralds);
              CZ.audio.sfx('win'); CZ.audio.vibrate([40, 30, 80]); draw();
            }, all ? 'small primary pulse' : 'small ghost-dark')),
        btn(t('common.continue'), () => { wrap.remove(); if (onClose) onClose(); }, 'primary wide')));
    };
    draw();
    root.append(wrap);
  }

  return { today, track, claim, claimChest, ready, doneCount, open };
})();
