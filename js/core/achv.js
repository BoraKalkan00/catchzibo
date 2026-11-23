// Başarımlar: oyun içinde rozet + küçük zümrüt ödülü. PC'de (Steam) aynı kimliklerle Steam başarımı açılır.
// Kimlikler Steamworks panelinde AYNEN bu isimlerle tanımlanmalı (store/steam_achievements.md).
CZ.achv = (function () {
  const d = () => CZ.state.data;
  const c = k => ((d().chc || {})[k]) || 0;
  const hall = () => { try { return CZ.village.lv('hall'); } catch (e) { return 0; } };
  const heroes = () => { try { return CZ.heroes.all().filter(h => CZ.heroes.owned(h.id || h)).length; } catch (e) { return 0; } };
  const orders = () => ((d().orders || {}).done) || 0;
  const vills = () => (((d().surv || {}).list) || []).length;
  // [kimlik, ikon, ilerleme(), hedef, zümrüt]
  const L = [
    ['NIGHT_1', '🌙', () => d().bestNight || 0, 1, 2],
    ['NIGHT_5', '🌘', () => d().bestNight || 0, 5, 3],
    ['NIGHT_10', '🌑', () => d().bestNight || 0, 10, 5],
    ['NIGHT_25', '🔥', () => d().bestNight || 0, 25, 10],
    ['NIGHT_50', '👑', () => d().bestNight || 0, 50, 20],
    ['KILL_100', '⚔️', () => c('kill'), 100, 3],
    ['KILL_1000', '🗡️', () => c('kill'), 1000, 8],
    ['KILL_5000', '💀', () => c('kill'), 5000, 15],
    ['ZIBO_1', '🎯', () => d().ziboJail || 0, 1, 5],
    ['ZIBO_5', '⛓️', () => d().ziboJail || 0, 5, 10],
    ['COMBO_10', '💥', () => d().cmbBest || 0, 10, 3],
    ['COMBO_25', '⚡', () => d().cmbBest || 0, 25, 8],
    ['TREE_500', '🪵', () => c('tree'), 500, 4],
    ['ROCK_500', '🪨', () => c('rock'), 500, 4],
    ['BUILD_10', '🔨', () => c('build'), 10, 3],
    ['BUILD_50', '🏗️', () => c('build'), 50, 8],
    ['VILL_1', '🧑‍🌾', () => c('surv'), 1, 2],
    ['VILL_8', '🏘️', () => vills(), 8, 8],
    ['HALL_3', '🏛️', hall, 3, 4],
    ['HALL_6', '🏰', hall, 6, 10],
    ['HALL_10', '🌟', hall, 10, 25],
    ['LOOT_50', '🎁', () => c('loot'), 50, 4],
    ['RUSH_10', '🏃', () => c('rush'), 10, 4],
    ['HERO_3', '🦸', heroes, 3, 6],
    ['ORDER_10', '📜', orders, 10, 4],
    ['ORDER_50', '📦', orders, 50, 10],
    ['PHOTO_1', '📷', () => c('photo'), 1, 2],
    ['RICH', '💰', () => d().gold || 0, 10000, 6]
  ];
  const got = () => d().achv || (d().achv = {});
  const list = () => L.map(([id, ic, f, n, gem]) => { let v = 0; try { v = Math.min(n, Math.floor(f() || 0)); } catch (e) { /* */ } return { id, ic, v, n, gem, done: !!got()[id] }; });
  function steam(id) { try { if (window.CZ_DESKTOP && window.CZ_DESKTOP.achieve) window.CZ_DESKTOP.achieve(id); } catch (e) { /* Steam yok */ } }
  let q = [], showing = false;
  function pop() {
    if (showing || !q.length) return; showing = true; const a = q.shift(), t = CZ.i18n.t;
    const el = CZ.ui.h('div', { class: 'achv-pop' }, CZ.ui.h('i', { text: a.ic }),
      CZ.ui.h('div', {}, CZ.ui.h('small', { text: '🏆 ' + t('achv.got') }), CZ.ui.h('b', { text: a.id ? t('achv.n.' + a.id) : t('achv.many', { n: a.many }) })),
      CZ.ui.h('em', { text: '+' + a.gem + ' 💎' }));
    document.body.append(el); try { CZ.audio.sfx('star'); CZ.audio.vibrate([30, 30, 60]); } catch (e) { /* */ }
    setTimeout(() => { el.classList.add('out'); setTimeout(() => { el.remove(); showing = false; pop(); }, 400); }, 3200);
  }
  // seyrek çağrılır (2 sn'de bir); yeni açılanları kaydeder, ödülü verir, gösterir
  function check() {
    const G = got(), nw = [];
    list().forEach(a => { if (!a.done && a.v >= a.n) { G[a.id] = Date.now(); d().emeralds = (d().emeralds || 0) + a.gem; nw.push(a); steam(a.id); } });
    const any = nw.length > 0;
    /* eski kayıtla birden çok başarım birden açılırsa tek tek değil, tek kartta göster */
    if (nw.length > 2) q.push({ ic: '🏆', id: null, many: nw.length, gem: nw.reduce((s, a) => s + a.gem, 0) }); else nw.forEach(a => q.push(a));
    if (any) { CZ.state.save(); pop(); }
    return any;
  }
  // Steam'e sonradan bağlanınca (ya da Steam ilk açılışta hazır değilse) eski başarımları da gönder
  function sync() { Object.keys(got()).forEach(steam); }
  function count() { return Object.keys(got()).length; }
  function open(parent) {
    const t = CZ.i18n.t, h = CZ.ui.h, A = list();
    const wrapEl = h('div', { class: 'modal-wrap achv-wrap' });
    const close = () => wrapEl.remove();
    wrapEl.addEventListener('pointerdown', e => { if (e.target === wrapEl) close(); });
    wrapEl.append(h('div', { class: 'pause-card achv-card' },
      h('b', { class: 'lg-title', text: '🏆 ' + t('achv.title') }), h('small', { class: 'achv-sum', text: t('achv.sum', { a: count(), b: L.length }) }),
      h('div', { class: 'achv-list' }, ...A.sort((x, y) => (y.done - x.done) || (y.v / y.n - x.v / x.n)).map(a => h('div', { class: 'achv-it' + (a.done ? ' on' : '') },
        h('i', { text: a.ic }), h('div', {}, h('b', { text: t('achv.n.' + a.id) }), h('small', { text: t('achv.d.' + a.id, { n: a.n }) }),
          a.done ? null : h('span', { class: 'achv-bar' }, h('span', { style: 'width:' + Math.round(a.v / a.n * 100) + '%' }))),
        h('em', { text: a.done ? '✓' : a.v + '/' + a.n })))),
      CZ.ui.btn(t('common.close'), close, 'small ghost-dark')));
    (parent || document.body).append(wrapEl);
  }
  return { list, check, sync, count, open, IDS: L.map(a => a[0]) };
})();
