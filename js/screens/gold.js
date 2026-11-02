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

  /* ---------- Tur: sokakta yürü, kutular sağdan, soldan ve önden gelir ---------- */
  const ROAD_TOP = 0.36;            // ufuk çizgisi (alanın yüzdesi)
  const lerp = (x, y, k) => x + (y - x) * k;

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
      earned: 0, crates: [], props: [], lastThrow: 0, timers: [], combo: 0, nextSpawn: 0, walk: 0
    });
    g.clock = h('div', { class: 'clock', text: G.roundSeconds });
    g.badge = goldBadge(0);
    g.bar = h('i', {});
    g.comboEl = h('div', { class: 'gold-combo' });
    g.road = h('div', { class: 'chase-road gold-road' });
    g.road.innerHTML = '<svg viewBox="0 0 100 100" preserveAspectRatio="none">'
      + '<defs><linearGradient id="grg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9cde0"/><stop offset="1" stop-color="#eef5fb"/></linearGradient></defs>'
      + '<polygon points="46,0 54,0 88,100 12,100" fill="url(#grg)"/>'
      + '<line class="lane-dash" x1="50" y1="0" x2="50" y2="100"/>'
      + '</svg>';
    g.thrower = img('avatar.' + (d.avatar || 'girl'), 'gold-thrower walking');
    g.field = h('div', { class: 'gold-field runner', onPointerDown: onTap },
      img('scene.town', 'chase-sky'), g.road, g.comboEl, g.thrower);
    g.hint = h('p', { class: 'play-hint coach', text: t('gold.tap') });
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
    measure();
    g.resize = new ResizeObserver(measure);
    g.resize.observe(g.field);
    g.running = true;
    g.last = performance.now();
    g.nextSpawn = g.last + 300;
    g.loop = requestAnimationFrame(loop);
    CZ.audio.music('play');
    CZ.audio.sfx('drop');
  }

  // Alan boyutu bir kez ölçülür; her karede ölçüm yapmak telefonu yorar.
  function measure() {
    if (!g || !g.field) return;
    const r = g.field.getBoundingClientRect();
    g.W = r.width;
    g.H = r.height;
    g.left = r.left;
    g.top = r.top;
  }

  function pickCrate() {
    const total = G.crates.reduce((sum, c) => sum + c.weight, 0);
    let r = Math.random() * total;
    for (const c of G.crates) { r -= c.weight; if (r <= 0) return c; }
    return G.crates[0];
  }

  // Kutular ufukta doğar; yaklaştıkça büyür. side: -1 sol kaldırım, 0 yolun ortası, 1 sağ kaldırım.
  function spawn() {
    if (g.crates.filter(c => c.alive).length >= G.maxCrates) return;
    const def = pickCrate();
    const sides = [-1, 0, 1].filter(sd => !g.crates.some(c => c.alive && c.side === sd && c.z < 0.35));
    if (!sides.length) return;
    const side = sides[Math.floor(Math.random() * sides.length)];
    const bar = h('i', {});
    const el = h('div', { class: 'crate runner-crate crate-' + def.id },
      h('div', { class: 'crate-hp' }, bar),
      img(def.art, 'crate-img'));
    g.field.insertBefore(el, g.thrower);
    g.crates.push({ def, hp: def.hp, el, bar, side, sx: side, z: 0, alive: true });
  }

  // Derinliğe göre ekrandaki yer ve boyut.
  function place(c) {
    const k = Math.pow(c.z, 1.35);
    const y = lerp(ROAD_TOP + 0.02, 0.9, k);
    const f = (y - ROAD_TOP) / (1 - ROAD_TOP);
    const half = 0.04 + f * 0.34;
    const x = 0.5 + c.sx * half * 1.35;
    const size = lerp(0.07, 0.36, k) * g.W;
    c.px = x * g.W;
    c.py = y * g.H;
    c.size = size;
    c.el.style.width = size + 'px';
    c.el.style.transform = `translate3d(${c.px - size / 2}px, ${c.py - size}px, 0)`;
    c.el.style.zIndex = 10 + Math.round(c.z * 50);
  }

  function loop(t) {
    if (!g || !g.running) return;
    const dt = Math.min(t - g.last, 60) / 1000;
    g.last = t;
    if (!document.hidden) step(dt, t);
    g.loop = requestAnimationFrame(loop);
  }

  function step(dt, t) {
    g.timeLeft -= dt;
    if (t >= g.nextSpawn) {
      spawn();
      g.nextSpawn = t + rand(G.spawnEveryMs[0], G.spawnEveryMs[1]);
    }
    // Yol kenarındaki ağaç ve lambalar yanından akar: yürüyormuş hissi.
    if (t >= (g.nextProp || 0)) {
      g.nextProp = t + 520;
      const art = Math.random() < 0.6 ? 'village.tree' : 'village.lamp';
      const el = img(art, 'runner-prop');
      g.field.insertBefore(el, g.road.nextSibling);
      g.props.push({ el, side: Math.random() < 0.5 ? -1 : 1, z: 0 });
    }
    g.props.slice().forEach(pr => {
      pr.z += G.walkSpeed * dt;
      if (pr.z >= 1.1) { pr.el.remove(); g.props.splice(g.props.indexOf(pr), 1); return; }
      const k = Math.pow(pr.z, 1.35);
      const y = lerp(ROAD_TOP + 0.02, 0.95, k);
      const f = (y - ROAD_TOP) / (1 - ROAD_TOP);
      const x = 0.5 + pr.side * (0.04 + f * 0.34) * 2.1;
      const size = lerp(0.06, 0.5, k) * g.W;
      pr.el.style.width = size + 'px';
      pr.el.style.transform = `translate3d(${x * g.W - size / 2}px, ${y * g.H - size}px, 0)`;
    });
    g.crates.slice().forEach(c => {
      if (!c.alive) return;
      c.z += G.walkSpeed * dt;
      // Altın sandık şerit değiştirir: nişan almak zorlaşır.
      if (c.def.hops) c.sx = Math.sin(t / 420) * 1.0;
      if (c.z >= 1.08) return pass(c);
      place(c);
    });
    const shown = Math.max(0, Math.ceil(g.timeLeft));
    if (shown !== g.shown) {
      g.shown = shown;
      g.clock.textContent = shown;
      g.clock.classList.toggle('danger', g.timeLeft <= 5);
      g.bar.style.width = Math.max(0, g.timeLeft / G.roundSeconds * 100) + '%';
      g.bar.classList.toggle('danger', g.timeLeft <= 5);
      if (shown <= 5 && shown > 0) CZ.audio.sfx('tick');
    }
    if (g.timeLeft <= 0) endRound();
  }

  // Kırılmadan geçip giden kutu seriyi bozar.
  function pass(c) {
    c.alive = false;
    g.crates.splice(g.crates.indexOf(c), 1);
    c.el.remove();
    if (g.combo >= 3) {
      showCombo(t('gold.comboLost'), true);
      CZ.audio.sfx('wrong');
    }
    g.combo = 0;
  }

  const multiplier = () => Math.min(G.comboMax, 1 + Math.floor(g.combo / G.comboStep));

  function showCombo(text, lost) {
    g.comboEl.textContent = text;
    g.comboEl.className = 'gold-combo show' + (lost ? ' lost' : '');
    clearTimeout(g.comboTimer);
    g.comboTimer = setTimeout(() => { if (g && g.comboEl) g.comboEl.className = 'gold-combo'; }, 900);
  }

  function onTap(e) {
    if (!g.running) return;
    const nowMs = performance.now();
    if (nowMs - g.lastThrow < G.throwGapMs) return;
    const px = e.clientX - g.left;
    const py = e.clientY - g.top;
    // En yakın canlı kutu (parmak biraz kaysa da tutsun, yakın olan öncelikli).
    let best = null;
    let bestScore = Infinity;
    g.crates.forEach(c => {
      if (!c.alive) return;
      const cx = c.px;
      const cy = c.py - c.size / 2;
      const dist = Math.hypot(px - cx, py - cy);
      const reach = Math.max(c.size * 0.85, 44);
      if (dist < reach && dist - c.z * 30 < bestScore) { best = c; bestScore = dist - c.z * 30; }
    });
    if (!best) return;
    e.preventDefault();
    g.lastThrow = nowMs;
    if (g.hint) g.hint.classList.remove('coach');
    throwAt(best);
  }

  function throwAt(crate) {
    const startX = g.W * 0.5;
    const startY = g.H * 0.86;
    const ball = h('i', { class: 'snowball' });
    ball.style.background = g.weapon.ball;
    g.field.append(ball);
    // Top uçarken kutu yaklaşır: varış noktası biraz ileriye hesaplanır.
    const lead = Math.min(1.08, crate.z + G.walkSpeed * 0.2);
    const k = Math.pow(lead, 1.35);
    const ty = lerp(ROAD_TOP + 0.02, 0.9, k) * g.H - lerp(0.07, 0.36, k) * g.W / 2;
    const f = (ty / g.H - ROAD_TOP) / (1 - ROAD_TOP);
    const tx = (0.5 + crate.sx * (0.04 + f * 0.34) * 1.35) * g.W;
    const dx = tx - startX;
    const dy = ty - startY;
    const lift = Math.min(150, Math.abs(dy) * 0.4 + 40);
    CZ.audio.sfx('throw');
    g.thrower.classList.remove('throw');
    void g.thrower.offsetWidth;
    g.thrower.classList.add('throw');
    const anim = ball.animate([
      { transform: `translate3d(${startX}px, ${startY}px, 0) scale(1.3)` },
      { transform: `translate3d(${startX + dx * 0.5}px, ${startY + dy * 0.5 - lift}px, 0) scale(1)`, offset: 0.5 },
      { transform: `translate3d(${tx}px, ${ty}px, 0) scale(${lerp(0.5, 1, k)})` }
    ], { duration: 200, easing: 'linear' });
    anim.onfinish = () => {
      ball.remove();
      if (!g || !g.running) return;
      splash(tx, ty);
      if (crate.alive) hit(crate, tx, ty);
    };
  }

  function splash(x, y) {
    for (let i = 0; i < 4; i++) {
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
    crate.el.classList.remove('hit');
    void crate.el.offsetWidth;
    crate.el.classList.add('hit');
    if (crate.hp <= 0) breakCrate(crate);
  }

  function breakCrate(crate) {
    crate.alive = false;
    g.crates.splice(g.crates.indexOf(crate), 1);
    const cx = crate.px;
    const cy = crate.py - crate.size / 2;
    g.combo += 1;
    const mult = multiplier();
    const bonus = crate.def.hp * mult;
    addGold(bonus);
    float(cx, cy - 40, '+' + bonus + (mult > 1 ? ' x' + mult : '') + '!', true);
    if (g.combo >= G.comboStep && g.combo % G.comboStep === 0) {
      showCombo(t('gold.combo', { n: mult }));
      CZ.audio.sfx('buy');
    }
    CZ.audio.sfx('crack');
    CZ.audio.vibrate([30, 20, 40]);
    g.xp = (g.xp || 0) + CZ.PROGRESS.xp.crate;
    // Altınlar saçılır (az sayıda: telefon ısınmasın).
    for (let i = 0; i < 6; i++) {
      const coin = img('ui.gold', 'coin-burst');
      g.field.append(coin);
      const a = rand(-Math.PI * 0.95, -Math.PI * 0.05);
      const dist = rand(50, 110);
      const anim = coin.animate([
        { transform: `translate3d(${cx - 13}px, ${cy - 13}px, 0) scale(.5)`, opacity: 1 },
        { transform: `translate3d(${cx - 13 + Math.cos(a) * dist}px, ${cy - 13 + Math.sin(a) * dist}px, 0) scale(1)`, opacity: 1, offset: 0.55 },
        { transform: `translate3d(${cx - 13 + Math.cos(a) * dist * 1.2}px, ${cy - 13 + Math.sin(a) * dist + 60}px, 0) scale(.7)`, opacity: 0 }
      ], { duration: 650, easing: 'ease-out' });
      anim.onfinish = () => coin.remove();
    }
    crate.el.classList.add('broken');
    setTimeout(() => crate.el.remove(), 220);
  }

  function endRound() {
    if (!g.running) return;
    g.running = false;
    cancelAnimationFrame(g.loop);
    g.thrower.classList.remove('walking');
    g.field.classList.add('stopped');
    const d = data();
    const record = g.earned > (d.goldBest || 0);
    if (record) d.goldBest = g.earned;
    CZ.state.save();
    if (g.xp) CZ.progress.addXp(g.xp);
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
      cancelAnimationFrame(g.loop);
      clearInterval(g.adTimer);
      clearTimeout(g.comboTimer);
      if (g.resize) g.resize.disconnect();
      (g.timers || []).forEach(clearTimeout);
      g = null;
    },
    isFree,
    waitText,
    get debug() { return g; }
  };
})();
