// GÜNLÜK ÖDÜL ve SEVİYE: oyuncuyu her gün geri getiren iki şey.
// Günlük: art arda girdikçe ödül büyür, 7. gün büyük sandık. Bir gün kaçarsa seri 1. günden başlar.
// Seviye: her eşya, kırılan kutu ve yakalanan Zibo XP verir. Seviye atlayınca ödül ve Zibo'dan yeni söz.
CZ.progress = (function () {
  const P = CZ.PROGRESS;
  const d = () => CZ.state.data;
  let pending = [];   // gösterilmeyi bekleyen seviye atlamaları

  /* ---------- Seviye ---------- */
  const need = level => P.xpBase + (level - 1) * P.xpStep;   // bu seviyeden sonrakine geçmek için gereken XP

  function ensure() {
    const s = d();
    if (!s.level) s.level = 1;
    if (!s.xp) s.xp = 0;
    if (!s.daily) s.daily = { last: null, streak: 0 };
  }

  function rewardFor(level) {
    const r = { gold: P.levelGold * level, emeralds: P.levelEmeralds };
    if (level % 5 === 0) r.cocoa = 1;
    return r;
  }

  function give(r) {
    const s = d();
    if (r.gold) s.gold = (s.gold || 0) + r.gold;
    if (r.emeralds) s.emeralds = (s.emeralds || 0) + r.emeralds;
    if (r.cocoa) s.cocoa = Math.min(CZ.GOLD.cocoa.max, (s.cocoa || 0) + r.cocoa);
  }

  function addXp(n) {
    ensure();
    const s = d();
    s.xp += n;
    while (s.xp >= need(s.level)) {
      s.xp -= need(s.level);
      s.level += 1;
      const r = rewardFor(s.level);
      give(r);
      pending.push({ level: s.level, reward: r });
    }
    CZ.state.save();
    if (pending.length && CZ.ui.current !== 'hub') CZ.ui.toast(CZ.t('level.toast', { n: s.level }));
  }

  /* ---------- Günlük ödül ---------- */
  function daysBetween(a, b) {
    return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000);
  }

  // Bugün alınabilecek ödül hangi gün? Alındıysa null.
  function dailyToday() {
    ensure();
    const s = d();
    const today = CZ.state.today();
    if (s.daily.last === today) return null;
    const kept = s.daily.last && daysBetween(s.daily.last, today) === 1;
    const day = kept ? (s.daily.streak % 7) + 1 : 1;
    return { day, broken: !!s.daily.last && !kept && s.daily.streak > 0 };
  }

  function claimDaily() {
    const info = dailyToday();
    if (!info) return null;
    const s = d();
    const r = P.daily[info.day - 1];
    give(r);
    s.daily = { last: CZ.state.today(), streak: info.day };
    CZ.state.save();
    addXp(P.xp.daily);
    return r;
  }

  /* ---------- Pencereler ---------- */
  const { h, img, btn } = CZ.ui;
  const t = (k, p) => CZ.t(k, p);

  function rewardChips(r) {
    const chips = [];
    if (r.gold) chips.push(h('span', { class: 'chip' }, img('ui.gold', 'chip-icon'), '+' + r.gold));
    if (r.emeralds) chips.push(h('span', { class: 'chip' }, img('ui.emerald', 'chip-icon'), '+' + r.emeralds));
    if (r.cocoa) chips.push(h('span', { class: 'chip' }, img('item.mug_red', 'chip-icon'), '+' + r.cocoa));
    return h('div', { class: 'chips' }, chips);
  }

  function dailyBox(root, onDone) {
    const info = dailyToday();
    if (!info) return false;
    const tiles = P.daily.map((r, i) => {
      const day = i + 1;
      const state = day < info.day ? 'got' : day === info.day ? 'today' : 'later';
      const icon = r.big ? 'gold.chest_gold' : r.cocoa ? 'item.mug_red' : r.emeralds ? 'ui.emerald' : 'ui.gold';
      return h('div', { class: 'day-tile ' + state + (r.big ? ' big' : '') },
        h('small', { text: t('daily.day', { n: day }) }),
        img(icon, 'day-icon'),
        h('b', { text: r.big ? t('daily.chest') : '+' + (r.gold || r.emeralds || r.cocoa) }));
    });
    const wrap = h('div', { class: 'modal-wrap daily-wrap' },
      h('div', { class: 'modal daily-modal' },
        h('h2', { text: t('daily.title') }),
        h('p', { class: 'small-note', text: info.broken ? t('daily.broken') : t('daily.sub') }),
        h('div', { class: 'day-grid' }, tiles),
        btn(t('daily.claim'), () => {
          const tile = wrap.querySelector('.day-tile.today');
          const r = claimDaily();
          if (r && r.gold) CZ.ui.fly(tile, 'gold', r.gold);
          if (r && r.emeralds) CZ.ui.fly(tile, 'emeralds', r.emeralds);
          CZ.audio.sfx(r && r.big ? 'win' : 'buy');
          CZ.audio.vibrate([30, 30, 60]);
          wrap.querySelector('.day-tile.today').classList.add('claimed');
          setTimeout(() => { wrap.remove(); if (onDone) onDone(r); }, 650);
        }, 'primary big wide pulse')));
    root.append(wrap);
    return true;
  }

  function levelBox(root, onDone) {
    const next = pending.shift();
    if (!next) return false;
    const lines = CZ.PROGRESS.ziboLines;
    const line = lines[(next.level - 2) % lines.length];
    const wrap = h('div', { class: 'modal-wrap level-wrap' },
      h('div', { class: 'modal level-modal' },
        h('small', { text: t('level.up') }),
        h('div', { class: 'level-num', text: next.level }),
        img('zibo.laugh', 'level-zibo'),
        h('p', { class: 'level-line', text: '“' + t(line) + '”' }),
        rewardChips(next.reward),
        btn(t('common.continue'), () => {
          const chips = wrap.querySelector('.chips');
          if (next.reward.gold) CZ.ui.fly(chips, 'gold', next.reward.gold);
          if (next.reward.emeralds) CZ.ui.fly(chips, 'emeralds', next.reward.emeralds);
          wrap.remove(); if (!levelBox(root, onDone) && onDone) onDone();
        }, 'primary wide')));
    root.append(wrap);
    CZ.audio.sfx('win');
    CZ.audio.vibrate([40, 30, 40, 30, 120]);
    return true;
  }

  // Merkezde: önce günlük ödül, sonra bekleyen seviye atlamaları.
  function showOnHub(root, refresh) {
    const shown = dailyBox(root, () => { if (!levelBox(root, refresh)) refresh(); });
    if (shown || levelBox(root, refresh)) return;

  }

  function bar() {
    ensure();
    const s = d();
    return h('div', { class: 'level-bar' },
      h('b', { class: 'level-badge', text: s.level }),
      h('div', { class: 'xp-track' }, h('i', { style: `width:${Math.min(100, s.xp / need(s.level) * 100)}%` })),
      h('small', { text: `${s.xp}/${need(s.level)} XP` }));
  }

  return { addXp, need, dailyToday, claimDaily, showOnHub, bar, rewardFor, get pending() { return pending.length; } };
})();
