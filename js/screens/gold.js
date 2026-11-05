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
  // Lobi (Subway tarzı): ortada karakterin, solda silahlar, sağda karakterler; ikisi de aşağı kaydırılır.
  let peekWeapon = null;
  function lobby(el) {
    const d = data();
    if (!d.weapons || !d.weapons.length) d.weapons = ['snowball'];
    const me = d.avatar || 'girl';
    const showW = weaponDef(peekWeapon || d.weapon);
    const ownedW = d.weapons.includes(showW.id);
    const wTile = w => {
      const owned = d.weapons.includes(w.id);
      return h('button', {
        class: 'rail-tile' + (w.id === showW.id ? ' on' : '') + (owned ? '' : ' locked'), type: 'button',
        onClick: () => {
          CZ.audio.sfx('button');
          if (owned) { peekWeapon = null; d.weapon = w.id; CZ.state.save(); } else peekWeapon = w.id;
          CZ.ui.refresh();
        }
      }, img(w.art, 'rail-img'),
      owned ? (d.weapon === w.id ? h('i', { class: 'rail-ok', text: '✓' }) : null)
        : h('small', { class: 'rail-price' }, img('ui.gold', 'mini-ico'), String(w.price)));
    };
    const cTile = c => {
      const st = CZ.chars.state(c);
      return h('button', {
        class: 'rail-tile char' + (c.id === me ? ' on' : '') + (st === 'open' ? '' : ' locked'), type: 'button',
        onClick: () => {
          if (st !== 'open') { CZ.audio.sfx('wrong'); return CZ.ui.toast(st === 'soon' ? t('chars.soonNote') : t('chars.finishRoom', { room: t('room.' + c.room) })); }
          CZ.audio.sfx('button'); d.avatar = c.id; CZ.state.save(); CZ.ui.refresh();
        }
      }, st === 'open' ? CZ.charArt.img(c.id, 'front', 'rail-img') : h('img', { class: 'rail-img', src: CZ.chars.front(c.id), alt: '' }),
      st !== 'open' ? h('i', { class: 'rail-lock', text: '🔒' }) : null);
    };
    const action = ownedW
      ? btn(t('gold.start'), () => startRound(el, true), 'primary big pulse wide lobby-go')
      : btn(t('gold.buyWeapon', { n: showW.price }), () => { buyWeapon(showW); peekWeapon = null; }, 'big wide lobby-buy', 'ui.gold');

    el.append(
      img('scene.road', 'scene-bg'),
      snow(),
      h('header', { class: 'topbar gold-top' },
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': t('common.back'), onClick: () => { CZ.audio.sfx('button'); peekWeapon = null; CZ.ui.go('hub'); }, text: '‹' }),
        h('h1', { text: t('hub.gold') }),
        goldBadge()),
      h('div', { class: 'lobby' },
        h('div', { class: 'rail left' }, h('small', { class: 'rail-head', text: t('gold.weapons') }), G.weapons.map(wTile)),
        h('div', { class: 'lobby-stage' },
          d.runBest ? h('p', { class: 'lobby-best' }, '🏆 ', t('run.best', { n: (d.runBest || 0).toLocaleString() })) : null,
          h('div', { class: 'lobby-hero' },
            CZ.charArt.img(me, 'front', 'lobby-char'),
            h('div', { class: 'lobby-wbadge' + (ownedW ? '' : ' peek') }, img(showW.art, 'lobby-weapon'))),
          h('div', { class: 'lobby-info' },
            h('strong', { text: t('weapon.' + showW.id) }),
            h('small', {}, t('gold.dmg', { n: showW.dmg }), ' · ', h('span', { class: 'dmg-bar' }, h('i', { style: `width:${showW.dmg / 9 * 100}%` }))))),
        h('div', { class: 'rail right' }, h('small', { class: 'rail-head', text: t('chars.title') }), CZ.ROSTER.map(cTile))),
      h('div', { class: 'lobby-bottom' }, action));
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

  function fakeAd(el, done) { g.adTimer = CZ.ads.show(done); }

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
    if (g.run) { g.run.destroy(); g.run = null; }
    (g.timers || []).forEach(clearTimeout);
    Object.assign(g, { el, weapon, earned: 0, gems: 0, xp: 0, running: false, timers: [], ended: false, adContinued: false, gemContinues: 0, lastM: -1 });
    g.badge = goldBadge(0);
    g.gemBadge = h('div', { class: 'emeralds run-gems' }, img('ui.emerald', 'emerald-icon'), g.gemCount = h('span', { class: 'emerald-count', text: '0' }));
    g.hearts = h('div', { class: 'run-hearts' });
    g.scoreEl = h('div', { class: 'run-score', text: '0' });
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
          h('div', { class: 'run-right' }, g.scoreEl, g.hearts, g.meters)),
        g.powers, g.floatBox, g.hint, g.count));
    drawHearts(G.runner.hearts + (perk().trapMul ? 1 : 0));
    g.count.textContent = '…';
    CZ.runner3d.load().then(() => {
      if (!g || g.el !== el) return;
      g.run = CZ.runner3d.start(g.stage, {
        avatar: d.avatar || 'girl', weaponArt: weapon.art, weaponId: weapon.id, ball: weapon.ball, dmg: weapon.dmg, perk: perk(),
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
        onSwipe(combo, near, gold) {
          if (near) floatText(t('run.nearMiss', { n: gold }), 'gold');
          else if (combo >= 3) floatText(t('run.combo', { n: combo }), 'gold');
          const dd = CZ.state.data;
          if (combo > (dd.bestCombo || 0)) { dd.bestCombo = combo; if (combo >= 5) floatText(t('run.comboRecord', { n: combo }), 'gold'); }
        },
        onCrash(left) { drawHearts(left); floatText(t('gold.ouch'), 'bad'); g.el.classList.add('run-hurt'); setTimeout(() => g && g.el.classList.remove('run-hurt'), 300); },
        onTick(s) {
          const m = Math.round(s.dist);
          if (m !== g.lastM) { g.lastM = m; g.meters.textContent = m + ' m'; g.scoreEl.textContent = Math.round(s.score || 0).toLocaleString(); }
          const p = (s.magnetT > 0 ? '🧲 ' + Math.ceil(s.magnetT) + ' ' : '') + (s.doubleT > 0 ? 'x2 ' + Math.ceil(s.doubleT) : '');
          if (p !== g.lastP) { g.lastP = p; g.powers.textContent = p; }
        },
        onEnd: askContinue
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

  // Subway Surfers gibi: düşünce "Devam?" — reklamla bir kez, sonra elmasla. 6 sn içinde seçmezsen biter.
  function askContinue(sum) {
    if (!g || g.ended) return;
    const d = data();
    const best = d.runBest || 0;
    const cost = G.runner.continueEmeralds * Math.pow(2, g.gemContinues || 0);
    const canAd = !g.adContinued;
    const left = best - sum.score;
    const ring = h('i', { class: 'cont-ring' });
    let timer = null;
    const close = () => { clearTimeout(timer); box.remove(); };
    const box = h('div', { class: 'cont-box' },
      h('div', { class: 'cont-card' },
        ring,
        h('h2', { text: t('run.continue') }),
        h('p', { class: 'cont-note', text: left > 0 ? t('run.toBest', { n: left.toLocaleString() }) : t('run.newBestNow') }),
        canAd ? btn(t('run.adContinue'), () => {
          close();
          g.adTimer = CZ.ads.show(() => { g.adContinued = true; revive(); });
        }, 'primary big wide cont-ad') : null,
        btn(t('run.gemContinue', { n: cost }) + ((d.emeralds || 0) < cost ? ' 🔒' : ''), e => {
          // Yetmiyorsa kesinlikle devam etmez: düğme kilitli görünür, basınca sallanır.
          if ((d.emeralds || 0) < cost) { CZ.audio.sfx('wrong'); CZ.audio.vibrate(30); e.currentTarget.classList.remove('shake'); void e.currentTarget.offsetWidth; e.currentTarget.classList.add('shake'); return CZ.ui.toast(t('run.gemShort', { n: d.emeralds || 0, c: cost })); }
          d.emeralds -= cost;
          g.gemContinues = (g.gemContinues || 0) + 1;
          CZ.state.save();
          close();
          revive();
        }, 'ghost-dark wide' + ((d.emeralds || 0) < cost ? ' gem-short' : ''), 'ui.emerald'),
        h('button', { class: 'cont-skip', type: 'button', text: t('run.noThanks'), onClick: () => { close(); finish(g.run.summary()); } })));
    g.el.append(box);
    timer = setTimeout(() => { if (box.isConnected) { close(); finish(g.run.summary()); } }, 6000);
    g.timers.push(timer);
  }

  function revive() {
    if (!g || !g.run) return;
    g.run.revive();
    drawHearts(1);
    CZ.audio.music('gold');
    floatText(t('run.go'), 'power');
  }

  function finish(sum) {
    if (!g || g.ended) return;
    g.ended = true;
    g.running = false;
    if (g.run) g.run.stop();
    const d = data();
    const record = sum.score > (d.runBest || 0);
    if (record) d.runBest = sum.score;
    if (g.earned > (d.goldBest || 0)) d.goldBest = g.earned;
    d.runBestM = Math.max(d.runBestM || 0, sum.meters);
    CZ.state.save();
    g.xp += sum.meters * 0.02;
    if (g.xp) CZ.progress.addXp(Math.round(g.xp));
    if (CZ.quests) CZ.quests.track('goldRun');
    CZ.audio.music(null);
    CZ.audio.sfx('win');
    CZ.audio.vibrate([40, 30, 60]);
    if (record) showRecord(sum, () => results(sum, true));
    else results(sum, false);
  }

  // Yeni rekor: turuncu ışınlı ekranda karakterin koşar, dokununca sonuçlara geçilir.
  function showRecord(sum, done) {
    const me = data().avatar || 'girl';
    const scr = h('div', { class: 'record-screen' },
      h('h2', { text: t('run.newBest') }),
      h('strong', { class: 'record-score', text: sum.score.toLocaleString() }),
      CZ.charArt.img(me, 'back1', 'record-hero'),
      h('p', { class: 'record-tap', text: t('run.tap') }));
    const run = CZ.charArt.url(me, 'back2');
    const hero = scr.querySelector('.record-hero');
    const a = hero.src;
    let f = 0;
    const iv = setInterval(() => { f++; hero.src = f % 2 ? run : a; }, 180);
    scr.addEventListener('pointerdown', () => { clearInterval(iv); scr.remove(); done(); }, { once: true });
    g.el.append(scr);
    CZ.audio.sfx('buy');
  }

  function results(sum, record) {
    const d = data();
    const me = d.avatar || 'girl';
    const goldVal = h('b', { text: g.earned });
    const doubleBtn = g.earned > 0 ? h('button', {
      class: 'double-btn', type: 'button',
      onClick: () => {
        doubleBtn.disabled = true;
        g.adTimer = CZ.ads.show(() => {
          d.gold = (d.gold || 0) + g.earned;
          g.earned *= 2;
          goldVal.textContent = g.earned;
          CZ.state.save();
          CZ.audio.sfx('buy');
          doubleBtn.remove();
          CZ.ui.toast(t('run.doubled'));
        });
      }
    }, h('span', { text: '+' + g.earned }), img('ui.gold', 'mini-ico'), h('em', { text: '▶ ' + t('run.ad') })) : null;
    const sheet = h('div', { class: 'run-results' },
      h('div', { class: 'res-top' },
        CZ.charArt.img(me, 'front', 'res-hero'),
        h('div', { class: 'res-boxes' },
          h('div', { class: 'res-box' }, h('small', { text: t('run.score') }), h('strong', { text: sum.score.toLocaleString() }),
            h('em', { text: record ? '🏆 ' + t('run.newBest') : t('run.best', { n: (d.runBest || 0).toLocaleString() }) })),
          h('div', { class: 'res-box' }, h('small', { text: t('run.coins') }), h('strong', {}, goldVal, img('ui.gold', 'mini-ico')), doubleBtn),
          h('div', { class: 'res-box small' }, h('small', { text: t('run.metersLabel') }), h('strong', { text: sum.meters + ' m' }),
            g.gems ? h('em', { text: '+' + g.gems + ' 💎' }) : null))),
      h('div', { class: 'res-actions' },
        btn('⌂', () => CZ.ui.go('hub'), 'ghost-dark res-home'),
        btn(t('gold.again'), () => CZ.ui.go('gold'), 'ghost-dark'),
        btn(t('run.play'), () => { const el = g.el; startRound(el, true); }, 'primary big res-play')));
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
