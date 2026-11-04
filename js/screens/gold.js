// ALTIN AVI: lobi (silahlar, dükkân) + 3D sonsuz koşu (runner3d.js).
// Altınlar yolda dizi halinde, sandıklar kartopuyla kırılır, nadiren elmas çıkar.
CZ.screens.gold = (function () {
  const { h, img, btn, snow } = CZ.ui;
  const t = CZ.t;
  const G = CZ.GOLD;
  let g = null;

  const rand = (a, b) => a + Math.random() * (b - a);
  const data = () => CZ.state.data;
  const weaponDef = id => G.weapons.find(w => w.id === id) || G.weapons[0];
  const now = () => Date.now();
  const isFree = () => now() >= (data().goldNextAt || 0);

  function waitText() {
    const ms = Math.max(0, (data().goldNextAt || 0) - now());
    const m = Math.ceil(ms / 60000);
    return t('gold.minutes', { m });
  }

  function goldBadge(value) {
    const count = h('span', { class: 'emerald-count', text: value === undefined ? data().gold : value });
    const el = h('div', { class: 'emeralds gold-badge' }, img('ui.gold', 'emerald-icon'), count);
    el.count = count;
    return el;
  }

  /* ---------- Lobi: silah seç, dükkân, başla ---------- */
  function lobby(el) {
    const d = data();
    if (!d.weapons || !d.weapons.length) d.weapons = ['snowball'];
    const weaponCard = w => {
      const owned = d.weapons.includes(w.id);
      const selected = d.weapon === w.id;
      const action = owned
        ? (selected
          ? h('span', { class: 'gold-tag', text: t('gold.owned') })
          : btn(t('gold.pick'), () => { d.weapon = w.id; CZ.state.save(); CZ.ui.refresh(); }, 'small ghost-dark'))
        : btn(String(w.price), () => buyWeapon(w), 'small gold-buy', 'ui.gold');
      return h('div', { class: 'gold-card' + (selected ? ' selected' : '') + (owned ? '' : ' locked') },
        img(w.art, 'gold-card-img'),
        h('strong', { text: t('weapon.' + w.id) }),
        h('small', { text: t('gold.dmg', { n: w.dmg }) }),
        action);
    };
    const cocoaFull = d.cocoa >= G.cocoa.max;
    const startRow = isFree()
      ? btn(t('gold.start'), () => startRound(el, true), 'primary big pulse wide')
      : h('div', { class: 'gold-wait' },
        h('p', { text: t('gold.wait', { t: waitText() }) }),
        btn(t('gold.adPlay'), () => fakeAd(el, () => startRound(el, false)), 'primary wide'),
        btn(t('gold.gemPlay', { n: G.skipEmeralds }), () => {
          if ((d.emeralds || 0) < G.skipEmeralds) { CZ.audio.sfx('wrong'); return CZ.ui.toast(t('gold.gemNeed')); }
          d.emeralds -= G.skipEmeralds;
          CZ.state.save();
          startRound(el, false);
        }, 'ghost wide', 'ui.emerald'));

    el.append(
      img('scene.road', 'scene-bg'),
      snow(),
      h('header', { class: 'topbar gold-top' },
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': t('common.back'), onClick: () => { CZ.audio.sfx('button'); CZ.ui.go('hub'); }, text: '‹' }),
        h('h1', { text: t('hub.gold') }),
        goldBadge()),
      h('div', { class: 'scroll gold-lobby' },
        h('p', { class: 'gold-sub', text: t('gold.sub') }),
        d.goldBest ? h('p', { class: 'gold-best', text: t('gold.best', { n: d.goldBest }) }) : null,
        startRow,
        h('h2', { class: 'gold-head', text: t('gold.weapons') }),
        h('div', { class: 'gold-grid' }, G.weapons.map(weaponCard)),
        h('div', { class: 'gold-card cocoa' },
          img('item.mug_red', 'gold-card-img'),
          h('div', { class: 'cocoa-text' },
            h('strong', { text: t('gold.cocoa') }),
            h('small', { text: t('gold.cocoaNote', { s: G.cocoa.seconds, n: d.cocoa || 0, max: G.cocoa.max }) })),
          cocoaFull
            ? h('span', { class: 'gold-tag', text: t('gold.cocoaFull') })
            : btn(String(G.cocoa.price), buyCocoa, 'small gold-buy', 'ui.gold'))));
  }

  function spend(price) {
    const d = data();
    if ((d.gold || 0) < price) {
      CZ.audio.sfx('wrong');
      CZ.ui.toast(t('gold.need'));
      return false;
    }
    d.gold -= price;
    return true;
  }

  function buyWeapon(w) {
    if (!spend(w.price)) return;
    const d = data();
    d.weapons.push(w.id);
    d.weapon = w.id;
    CZ.state.save();
    CZ.audio.sfx('buy');
    CZ.audio.vibrate(30);
    CZ.ui.refresh();
    CZ.ui.toast(t('gold.bought'));
  }

  function buyCocoa() {
    if (!spend(G.cocoa.price)) return;
    const d = data();
    d.cocoa = Math.min(G.cocoa.max, (d.cocoa || 0) + 1);
    CZ.state.save();
    CZ.audio.sfx('buy');
    CZ.ui.refresh();
  }

  // Sahte reklam: gerçek reklam eklenince yalnız bu fonksiyon değişir.
  function fakeAd(el, done) {
    let left = 3;
    const count = h('p', { text: t('ad.wait', { s: left }) });
    const box = h('div', { class: 'fake-ad' },
      h('small', { text: t('ad.label') }),
      img('zibo.laugh', 'fake-ad-zibo'),
      h('h2', { text: t('title.name') }),
      h('p', { text: t('ad.fake') }),
      count);
    el.append(box);
    const timer = setInterval(() => {
      left -= 1;
      if (left > 0) { count.textContent = t('ad.wait', { s: left }); return; }
      clearInterval(timer);
      box.remove();
      done();
    }, 1000);
    g.adTimer = timer;
  }

  /* ---------- Tur: 3D koşu (js/screens/runner3d.js) ---------- */
  function startRound(el, free) {
    const d = data();
    // Ücretsiz tur başlar başlamaz bekleme yazılır: yarıda çıkmak hile olmasın.
    if (free) {
      d.goldNextAt = now() + G.cooldownMinutes * 60000;
      CZ.state.save();
    }
    el.replaceChildren();
    const weapon = weaponDef(d.weapon);
    Object.assign(g, { el, weapon, earned: 0, gems: 0, xp: 0, running: false, timers: [] });
    g.badge = goldBadge(0);
    g.gemBadge = h('div', { class: 'emeralds run-gems' }, img('ui.emerald', 'emerald-icon'), g.gemCount = h('span', { class: 'emerald-count', text: '0' }));
    g.hearts = h('div', { class: 'run-hearts' });
    g.meters = h('div', { class: 'run-meters', text: '0 m' });
    g.powers = h('div', { class: 'run-powers' });
    g.stage = h('div', { class: 'run-stage' });
    g.hint = h('div', { class: 'run-hint' },
      h('div', {}, h('b', { text: '⇆' }), h('span', { text: t('run.hintLane') })),
      h('div', {}, h('b', { text: '⇡' }), h('span', { text: t('run.hintJump') })),
      h('div', {}, h('b', { text: '⇣' }), h('span', { text: t('run.hintSlide') })),
      h('div', {}, h('b', { text: '●' }), h('span', { text: t('run.hintTap') })));
    g.count = h('div', { class: 'run-count' });
    g.floatBox = h('div', { class: 'run-floats' });
    el.append(
      h('div', { class: 'run-wrap' },
        g.stage,
        h('div', { class: 'run-top' },
          h('button', { class: 'icon-btn', type: 'button', 'aria-label': t('common.back'), onClick: () => { if (g.run && g.running) finish(g.run.summary()); else CZ.ui.go('gold'); }, text: '‹' }),
          h('div', { class: 'run-stats' }, g.badge, g.gemBadge),
          h('div', { class: 'run-right' }, g.hearts, g.meters)),
        g.powers, g.floatBox, g.hint, g.count));
    drawHearts(G.runner.hearts + (perk().trapMul ? 1 : 0));
    g.count.textContent = '…';
    CZ.runner3d.load().then(() => {
      if (!g || g.el !== el) return;
      g.run = CZ.runner3d.start(g.stage, {
        avatar: d.avatar || 'girl', weaponArt: weapon.art, ball: weapon.ball, dmg: weapon.dmg, perk: perk(),
        onGold(n, big) {
          g.earned += n;
          d.gold = (d.gold || 0) + n;
          g.badge.count.textContent = g.earned;
          if (big) { floatText('+' + n, 'gold'); g.xp += CZ.PROGRESS.xp.crate * 4; }
          g.badge.classList.remove('bump'); void g.badge.offsetWidth; g.badge.classList.add('bump');
        },
        onEmerald(n) {
          g.gems += n;
          d.emeralds = (d.emeralds || 0) + n;
          g.gemCount.textContent = g.gems;
          floatText('+' + n + ' 💎', 'gem');
          CZ.state.save();
        },
        onPower(kind) { floatText(t('run.power.' + kind), 'power'); },
        onCrate() { if (CZ.quests) CZ.quests.track('crate'); },
        onDodge() { if (CZ.quests) CZ.quests.track('dodge'); },
        onCrash(left) { drawHearts(left); floatText(t('gold.ouch'), 'bad'); g.el.classList.add('run-hurt'); setTimeout(() => g && g.el.classList.remove('run-hurt'), 300); },
        onTick(s) {
          const m = Math.round(s.dist);
          if (m !== g.lastM) { g.lastM = m; g.meters.textContent = m + ' m'; }
          const p = (s.magnetT > 0 ? '🧲 ' + Math.ceil(s.magnetT) + ' ' : '') + (s.doubleT > 0 ? 'x2 ' + Math.ceil(s.doubleT) : '');
          if (p !== g.lastP) { g.lastP = p; g.powers.textContent = p; }
        },
        onEnd: finish
      });
      g.run.ready.then(() => countdown());
    }).catch(() => {
      g.count.textContent = '';
      CZ.ui.toast(t('run.noGl'));
    });
    CZ.audio.music('gold');
  }

  function perk() { return (CZ.closet && CZ.closet.perk()) || {}; }

  function drawHearts(n) {
    g.hearts.replaceChildren(...Array.from({ length: Math.max(0, n) }, () => h('span', { text: '❤️' })));
  }

  function countdown() {
    let n = 3;
    const tick = () => {
      if (!g || !g.run) return;
      if (n === 0) {
        g.count.textContent = t('run.go');
        g.count.className = 'run-count go';
        g.running = true;
        g.run.go();
        g.timers.push(setTimeout(() => { if (g) g.count.textContent = ''; }, 600));
        g.timers.push(setTimeout(() => { if (g) g.hint.classList.add('hide'); }, 4500));
        return;
      }
      g.count.textContent = n;
      g.count.className = 'run-count';
      void g.count.offsetWidth;
      g.count.classList.add('pop');
      CZ.audio.sfx('tick');
      n -= 1;
      g.timers.push(setTimeout(tick, 700));
    };
    tick();
  }

  function floatText(text, kind) {
    const el = h('div', { class: 'run-float ' + kind, text });
    g.floatBox.append(el);
    setTimeout(() => el.remove(), 900);
  }

  function finish(sum) {
    if (!g || g.ended) return;
    g.ended = true;
    g.running = false;
    if (g.run) g.run.stop();
    const d = data();
    const record = g.earned > (d.goldBest || 0);
    if (record) d.goldBest = g.earned;
    d.runBestM = Math.max(d.runBestM || 0, sum.meters);
    CZ.state.save();
    g.xp += sum.meters * 0.02;
    if (g.xp) CZ.progress.addXp(Math.round(g.xp));
    if (CZ.quests) CZ.quests.track('goldRun');
    CZ.audio.music(null);
    CZ.audio.sfx('win');
    CZ.audio.vibrate([40, 30, 60]);
    const sheet = h('div', { class: 'sheet sheet-win' },
      h('h2', { text: t('run.end') }),
      h('p', { class: 'run-sum', text: t('run.meters', { m: sum.meters }) }),
      h('p', { class: 'reward', 'data-fly': 'gold', 'data-n': g.earned }, img('ui.gold', 'emerald-icon'), t('gold.earned', { n: g.earned })),
      g.gems ? h('p', { class: 'reward' }, img('ui.emerald', 'emerald-icon'), '+' + g.gems) : null,
      record ? h('p', { class: 'gold-record', text: t('gold.record') }) : null,
      h('p', { class: 'small-note', text: t('gold.total', { n: d.gold }) }),
      h('div', { class: 'sheet-row' },
        btn(t('gold.home'), () => CZ.ui.go('hub'), 'ghost-dark wide'),
        btn(t('gold.again'), () => CZ.ui.go('gold'), 'primary wide')));
    g.el.append(sheet);
  }

  return {
    music: 'menu',
    render(el) {
      g = { timers: [] };
      lobby(el);
    },
    leave() {
      if (!g) return;
      if (g.running) CZ.state.save();
      clearInterval(g.adTimer);
      (g.timers || []).forEach(clearTimeout);
      if (g.run) g.run.destroy();
      g = null;
    },
    isFree,
    waitText,
    get debug() { return g; }
  };
})();
