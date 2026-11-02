// KARTOPU SAVAŞI: sokaktaki hediye paketlerine ve sandıklara kartopu at, altın topla.
// Her isabet hasar kadar altın verir; paket kırılınca canı kadar bonus altın gelir.
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
        btn(t('gold.adPlay'), () => fakeAd(el, () => startRound(el, false)), 'primary wide'));

    el.append(
      img('scene.town', 'scene-bg'),
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

  /* ---------- Tur ---------- */
  function startRound(el, free) {
    const d = data();
    // Ücretsiz tur başlar başlamaz bekleme yazılır: yarıda çıkmak hile olmasın.
    if (free) {
      d.goldNextAt = now() + G.cooldownMinutes * 60000;
      CZ.state.save();
    }
    el.replaceChildren();
    const weapon = weaponDef(d.weapon);
    Object.assign(g, {
      el, weapon, running: false, timeLeft: G.roundSeconds, last: performance.now(),
      earned: 0, crates: [], lastThrow: 0, timers: []
    });
    g.clock = h('div', { class: 'clock', text: G.roundSeconds });
    g.badge = goldBadge(0);
    g.bar = h('i', {});
    g.field = h('div', { class: 'gold-field', onPointerDown: onTap });
    g.thrower = img('avatar.' + (d.avatar || 'girl'), 'gold-thrower');
    g.hint = h('p', { class: 'play-hint coach', text: t('gold.tap') });
    g.field.append(img('scene.town', 'gold-bg'), h('i', { class: 'gold-street' }), g.thrower);
    el.append(
      h('div', { class: 'play-top' },
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': t('common.back'), onClick: () => { if (g.running) endRound(); else CZ.ui.go('gold'); }, text: '‹' }),
        h('div', { class: 'target-card gold-weapon' }, img(weapon.art, 'target-img'),
          h('div', {}, h('small', { text: t('gold.dmg', { n: weapon.dmg }) }), h('strong', { text: t('weapon.' + weapon.id) }))),
        g.badge,
        g.clock),
      h('div', { class: 'timebar' }, g.bar),
      g.field,
      g.hint);
    G.slots.forEach((slot, i) => spawn(i, i * 120));
    g.running = true;
    g.last = performance.now();
    g.interval = setInterval(tick, 100);
    CZ.audio.music('play');
    CZ.audio.sfx('drop');
  }

  function pickCrate() {
    const total = G.crates.reduce((s, c) => s + c.weight, 0);
    let r = Math.random() * total;
    for (const c of G.crates) { r -= c.weight; if (r <= 0) return c; }
    return G.crates[0];
  }

  function spawn(slotIndex, delay) {
    const id = setTimeout(() => {
      if (!g || !g.running) return;
      const def = pickCrate();
      const [x, y] = G.slots[slotIndex];
      const bar = h('i', {});
      const el = h('div', { class: 'crate crate-' + def.id, style: `left:${x * 100}%;top:${y * 100}%;width:${def.size * 100}%` },
        h('div', { class: 'crate-hp' }, bar),
        img(def.art, 'crate-img'));
      const crate = { def, hp: def.hp, el, bar, slotIndex, x, y, alive: true };
      g.field.append(el);
      g.crates.push(crate);
      el.animate([
        { transform: 'translate(-50%, -160%) scale(.6)', opacity: 0 },
        { transform: 'translate(-50%, -46%) scale(1.06, .92)', opacity: 1, offset: 0.75 },
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 }
      ], { duration: 320, easing: 'cubic-bezier(.4, 0, .9, .7)' });
      if (def.hops) crate.hopTimer = setInterval(() => hop(crate), 1300);
    }, delay || 0);
    g.timers.push(id);
  }

  // Altın sandık yerinde durmaz: oyuncu nişan almak zorunda kalır.
  function hop(crate) {
    if (!crate.alive || !g.running) return;
    const nx = Math.min(0.84, Math.max(0.16, crate.x + rand(-0.32, 0.32)));
    crate.x = nx;
    crate.el.style.left = nx * 100 + '%';
    crate.el.animate([
      { transform: 'translate(-50%, -50%)' },
      { transform: 'translate(-50%, -95%)', offset: 0.45 },
      { transform: 'translate(-50%, -50%)' }
    ], { duration: 420, easing: 'ease-out' });
  }

  function onTap(e) {
    if (!g.running) return;
    const nowMs = performance.now();
    if (nowMs - g.lastThrow < G.throwGapMs) return;
    const box = g.field.getBoundingClientRect();
    const px = e.clientX - box.left;
    const py = e.clientY - box.top;
    // En yakın canlı sandığı bul (parmak biraz kaysa da tutsun).
    let best = null;
    let bestDist = Infinity;
    g.crates.forEach(c => {
      if (!c.alive) return;
      const r = c.el.getBoundingClientRect();
      const cx = r.left + r.width / 2 - box.left;
      const cy = r.top + r.height / 2 - box.top;
      const dist = Math.hypot(px - cx, py - cy);
      if (dist < r.width * 0.75 && dist < bestDist) { best = c; bestDist = dist; }
    });
    if (!best) return;
    e.preventDefault();
    g.lastThrow = nowMs;
    if (g.hint) { g.hint.classList.remove('coach'); }
    throwAt(best, px, py, box);
  }

  function throwAt(crate, px, py, box) {
    const startX = box.width * 0.5;
    const startY = box.height * 0.93;
    const ball = h('i', { class: 'snowball' });
    ball.style.background = g.weapon.ball;
    ball.style.left = startX + 'px';
    ball.style.top = startY + 'px';
    g.field.append(ball);
    const dx = px - startX;
    const dy = py - startY;
    const lift = Math.min(140, Math.abs(dy) * 0.35 + 40);
    CZ.audio.sfx('throw');
    g.thrower.classList.remove('throw');
    void g.thrower.offsetWidth;
    g.thrower.classList.add('throw');
    const anim = ball.animate([
      { transform: 'translate(-50%, -50%) scale(1.25)' },
      { transform: `translate(calc(-50% + ${dx * 0.5}px), calc(-50% + ${dy * 0.5 - lift}px)) scale(1)`, offset: 0.5 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.8)` }
    ], { duration: 240, easing: 'linear' });
    anim.onfinish = () => {
      ball.remove();
      if (!g) return;
      splash(px, py);
      if (crate.alive) hit(crate, px, py);
    };
  }

  function splash(x, y) {
    for (let i = 0; i < 5; i++) {
      const a = Math.random() * Math.PI * 2;
      const bit = h('i', { class: 'puff' });
      bit.style.cssText = `left:${x}px;top:${y}px;--dx:${Math.cos(a) * rand(18, 40)}px;--dy:${Math.sin(a) * rand(12, 30)}px;--z:${rand(0.6, 1.2)}`;
      g.field.append(bit);
      setTimeout(() => bit.remove(), 420);
    }
  }

  function float(x, y, text, big) {
    const el = h('b', { class: 'gold-float' + (big ? ' big' : ''), text });
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    g.field.append(el);
    setTimeout(() => el.remove(), 900);
  }

  function addGold(n) {
    g.earned += n;
    data().gold = (data().gold || 0) + n;
    g.badge.count.textContent = g.earned;
    g.badge.classList.remove('bump');
    void g.badge.offsetWidth;
    g.badge.classList.add('bump');
  }

  function hit(crate, x, y) {
    const dmg = Math.min(crate.hp, g.weapon.dmg);
    crate.hp -= g.weapon.dmg;
    addGold(dmg);
    float(x, y - 20, '+' + dmg);
    CZ.audio.sfx('hit');
    CZ.audio.vibrate(8);
    crate.bar.style.width = Math.max(0, crate.hp / crate.def.hp * 100) + '%';
    crate.el.animate([
      { transform: 'translate(-50%, -50%) rotate(0deg)' },
      { transform: 'translate(-50%, -50%) rotate(-7deg) scale(1.05, .95)', offset: 0.3 },
      { transform: 'translate(-50%, -50%) rotate(5deg)', offset: 0.65 },
      { transform: 'translate(-50%, -50%) rotate(0deg)' }
    ], { duration: 200 });
    if (crate.hp <= 0) breakCrate(crate);
  }

  function breakCrate(crate) {
    crate.alive = false;
    clearInterval(crate.hopTimer);
    g.crates.splice(g.crates.indexOf(crate), 1);
    const r = crate.el.getBoundingClientRect();
    const box = g.field.getBoundingClientRect();
    const cx = r.left + r.width / 2 - box.left;
    const cy = r.top + r.height / 2 - box.top;
    addGold(crate.def.hp);
    float(cx, cy - 40, '+' + crate.def.hp + '!', true);
    CZ.audio.sfx('crack');
    CZ.audio.vibrate([30, 20, 40]);
    // Kapak uçar, altınlar saçılır.
    for (let i = 0; i < 9; i++) {
      const coin = img('ui.gold', 'coin-burst');
      coin.style.left = cx + 'px';
      coin.style.top = cy + 'px';
      g.field.append(coin);
      const a = rand(-Math.PI * 0.95, -Math.PI * 0.05);
      const dist = rand(50, 120);
      const anim = coin.animate([
        { transform: 'translate(-50%, -50%) scale(.5)', opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(a) * dist}px), calc(-50% + ${Math.sin(a) * dist}px)) scale(1)`, opacity: 1, offset: 0.55 },
        { transform: `translate(calc(-50% + ${Math.cos(a) * dist * 1.2}px), calc(-50% + ${Math.sin(a) * dist + 60}px)) scale(.7)`, opacity: 0 }
      ], { duration: 700, easing: 'ease-out' });
      anim.onfinish = () => coin.remove();
    }
    const out = crate.el.animate([
      { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
      { transform: 'translate(-50%, -50%) scale(1.25)', opacity: 0 }
    ], { duration: 220, fill: 'forwards' });
    out.onfinish = () => crate.el.remove();
    spawn(crate.slotIndex, 380);
  }

  function tick() {
    if (!g || !g.running) return;
    const nowMs = performance.now();
    const dt = Math.min(nowMs - g.last, 400) / 1000;
    g.last = nowMs;
    if (document.hidden) return;
    const before = Math.ceil(g.timeLeft);
    g.timeLeft -= dt;
    const shown = Math.max(0, Math.ceil(g.timeLeft));
    g.clock.textContent = shown;
    g.clock.classList.toggle('danger', g.timeLeft <= 5);
    g.bar.style.width = Math.max(0, g.timeLeft / G.roundSeconds * 100) + '%';
    g.bar.classList.toggle('danger', g.timeLeft <= 5);
    if (shown !== before && shown <= 5 && shown > 0) CZ.audio.sfx('tick');
    if (g.timeLeft <= 0) endRound();
  }

  function endRound() {
    if (!g.running) return;
    g.running = false;
    clearInterval(g.interval);
    g.crates.forEach(c => clearInterval(c.hopTimer));
    const d = data();
    const record = g.earned > (d.goldBest || 0);
    if (record) d.goldBest = g.earned;
    CZ.state.save();
    CZ.audio.music(null);
    CZ.audio.sfx('win');
    CZ.audio.vibrate([40, 30, 60]);
    const sheet = h('div', { class: 'sheet sheet-win' },
      h('h2', { text: t('gold.end') }),
      h('p', { class: 'reward' }, img('ui.gold', 'emerald-icon'), t('gold.earned', { n: g.earned })),
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
      if (g.running) {
        g.running = false;
        CZ.state.save();
      }
      clearInterval(g.interval);
      clearInterval(g.adTimer);
      (g.crates || []).forEach(c => clearInterval(c.hopTimer));
      (g.timers || []).forEach(clearTimeout);
      g = null;
    },
    isFree,
    waitText,
    get debug() { return g; }
  };
})();
