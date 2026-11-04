// ALTIN AVI: 4 şeritli karlı yolda koş, hediyeleri ve sandıkları vur, Zibo'nun tuzaklarından kaç.
// Altın yalnız kutu kırılınca gelir; tuzağa çarparsan altın kaybedersin.
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

  /* ---------- Tur: 4 şeritli yol. Kutuları vur, Zibo'nun tuzaklarından kaç ---------- */
  const ROAD_TOP = 0.36;            // ufuk çizgisi (alanın yüzdesi)
  const lerp = (x, y, k) => x + (y - x) * k;
  // Derinlik (0 ufuk, 1 dibe) → ekrandaki y ve yolun yarı genişliği.
  const depthY = k => lerp(ROAD_TOP + 0.02, 0.9, k);
  const halfAt = y => 0.06 + (y - ROAD_TOP) / (1 - ROAD_TOP) * 0.42;
  const laneX = (lane, y) => 0.5 + (lane - (G.lanes - 1) / 2) * (2 / G.lanes) * halfAt(y);

  function startRound(el, free) {
    const d = data();
    // Ücretsiz tur başlar başlamaz bekleme yazılır: yarıda çıkmak hile olmasın.
    if (free) {
      d.goldNextAt = now() + G.cooldownMinutes * 60000;
      CZ.state.save();
    }
    el.replaceChildren();
    const weapon = weaponDef(d.weapon);
    const avatar = d.avatar || 'girl';
    Object.assign(g, {
      el, weapon, avatar, perk: CZ.closet ? CZ.closet.perk() : {}, running: false, timeLeft: G.roundSeconds + ((CZ.closet && CZ.closet.perk().bonusSeconds) || 0), last: performance.now(), clockT: 0,
      earned: 0, crates: [], traps: [], props: [], lastThrow: 0, timers: [], combo: 0, nextSpawn: 0,
      lane: 1, stun: 0, ziboLane: 2, ziboNext: 0, nextTrap: 0, frame: 0, nextDust: 0
    });
    ['_run1', '_run2'].forEach(f => { new Image().src = CZ.art('avatar.' + avatar + f); });
    g.clock = h('div', { class: 'clock', text: G.roundSeconds });
    g.badge = goldBadge(0);
    g.bar = h('i', {});
    g.comboEl = h('div', { class: 'gold-combo' });
    g.road = h('div', { class: 'chase-road gold-road' });
    let dashes = '';
    for (let i = 1; i < G.lanes; i++) {
      const off = (i - G.lanes / 2) * (2 / G.lanes);
      dashes += `<line class="lane-dash" x1="${50 + off * 6}" y1="0" x2="${50 + off * 48}" y2="100"/>`;
    }
    g.road.innerHTML = '<svg viewBox="0 0 100 100" preserveAspectRatio="none">'
      + '<defs><linearGradient id="grg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9cde0"/><stop offset="1" stop-color="#eef5fb"/></linearGradient></defs>'
      + '<polygon points="44,0 56,0 98,100 2,100" fill="url(#grg)" class="road-fill"/>' + dashes + '</svg>';
    // Oyuncu: arkadan koşar, silahı elinde.
    g.meImg = img('avatar.' + avatar + '_run1', 'me-body');
    g.meWeapon = img(weapon.art, 'me-weapon');
    g.me = h('div', { class: 'runner-me' }, g.meImg, g.meWeapon, h('div', { class: 'me-stars', text: '💫' }));
    // Zibo yolun ucunda koşar, arkasına tuzak bırakır.
    g.zibo = img('zibo.run1', 'runner-zibo');
    g.flash = h('div', { class: 'hurt-flash' });
    g.field = h('div', { class: 'gold-field runner', onPointerDown: onDown, onPointerUp: onUp },
      img('scene.road', 'road-bg'), g.road, g.zibo, g.comboEl, g.me, g.flash);
    g.hint = h('p', { class: 'play-hint coach', text: t('gold.tap') });
    const move = dir => h('button', { class: 'btn ghost lane-btn', type: 'button', onPointerDown: e => { e.preventDefault(); moveLane(dir); }, text: dir < 0 ? '◀' : '▶' });
    el.append(
      h('div', { class: 'play-top' },
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': t('common.back'), onClick: () => { if (g.running) endRound(); else CZ.ui.go('gold'); }, text: '‹' }),
        h('div', { class: 'target-card gold-weapon' }, img(weapon.art, 'target-img'),
          h('div', {}, h('small', { text: t('gold.dmg', { n: weapon.dmg }) }), h('strong', { text: t('weapon.' + weapon.id) }))),
        g.badge,
        g.clock),
      h('div', { class: 'timebar' }, g.bar),
      g.field,
      h('div', { class: 'chase-controls gold-controls' }, move(-1), g.hint, move(1)));
    measure();
    g.resize = new ResizeObserver(measure);
    g.resize.observe(g.field);
    placeMe();
    g.running = true;
    g.last = performance.now();
    g.nextSpawn = g.last + 300;
    g.nextTrap = g.last + (G.trapsFromSecond + (g.perk.trapDelay || 0)) * 1000;
    g.ziboNext = g.last + 1500;
    g.loop = requestAnimationFrame(loop);
    CZ.audio.music('gold');
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
    if (g.me) placeMe();
  }

  function placeMe() {
    const x = laneX(g.lane, 0.97) * g.W;
    g.meX = x;
    g.me.style.transform = `translate3d(${x - g.W * 0.125}px, 0, 0)`;
  }

  function moveLane(dir) {
    if (!g || !g.running) return;
    const next = Math.max(0, Math.min(G.lanes - 1, g.lane + dir));
    if (next === g.lane) return;
    g.lane = next;
    placeMe();
    CZ.audio.sfx('button');
    g.me.classList.remove('lean-l', 'lean-r');
    void g.me.offsetWidth;
    g.me.classList.add(dir < 0 ? 'lean-l' : 'lean-r');
  }

  function pickFrom(list) {
    const total = list.reduce((sum, c) => sum + c.weight, 0);
    let r = Math.random() * total;
    for (const c of list) { r -= c.weight; if (r <= 0) return c; }
    return list[0];
  }

  function freeLanes(exclude) {
    const all = [];
    for (let i = 0; i < G.lanes; i++) all.push(i);
    return all.filter(l => l !== exclude && !g.crates.concat(g.traps).some(c => c.alive && Math.round(c.sx) === l && c.z < 0.3));
  }

  // Kutular ufukta doğar; yaklaştıkça büyür.
  function spawn() {
    if (g.crates.filter(c => c.alive).length >= G.maxCrates) return;
    const lanes = freeLanes();
    if (!lanes.length) return;
    const def = pickFrom(G.crates);
    const lane = lanes[Math.floor(Math.random() * lanes.length)];
    const bar = h('i', {});
    const el = h('div', { class: 'crate runner-crate crate-' + def.id },
      h('div', { class: 'crate-hp' }, bar),
      img(def.art, 'crate-img'));
    g.field.insertBefore(el, g.me);
    g.crates.push({ def, hp: def.hp, el, bar, sx: lane, z: 0, alive: true });
  }

  // Zibo kendi şeridine tuzak bırakır.
  function dropTrap() {
    const def = pickFrom(G.traps);
    const el = h('div', { class: 'crate runner-crate trap trap-' + def.id }, img(def.art, 'crate-img'));
    g.field.insertBefore(el, g.me);
    g.traps.push({ def, el, sx: g.ziboLane, z: 0.04, alive: true, trap: true, hp: 1 });
    g.poseUntil = performance.now() + 380;
    g.zibo.classList.remove('drop');
    void g.zibo.offsetWidth;
    g.zibo.classList.add('drop');
  }

  // Derinliğe göre ekrandaki yer ve boyut.
  function place(c, scale) {
    const k = Math.pow(c.z, 1.35);
    const y = depthY(k);
    const size = lerp(0.06, 0.3, k) * g.W * (scale || 1);
    c.px = laneX(c.sx, y) * g.W;
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
    g.frame += dt;
    g.stun = Math.max(0, g.stun - dt);
    g.me.classList.toggle('stunned', g.stun > 0);
    // Koşu kareleri: bacaklar sırayla.
    const f = 'avatar.' + g.avatar + (Math.floor(g.frame * 6.6) % 2 ? '_run2' : '_run1');
    if (g.meImg.dataset.f !== f) { g.meImg.dataset.f = f; g.meImg.src = CZ.art(f); }
    const zf = t < (g.poseUntil || 0) ? 'zibo.throw' : Math.floor(g.frame * 6) % 2 ? 'zibo.run2' : 'zibo.run1';
    if (g.zibo.dataset.f !== zf) { g.zibo.dataset.f = zf; g.zibo.src = CZ.art(zf); }
    // Ayak tozu
    if (t >= g.nextDust) {
      g.nextDust = t + 260;
      const p = h('i', { class: 'puff dust' });
      p.style.cssText = `left:${g.meX + rand(-10, 10)}px;top:${g.H * 0.97}px;--dx:${rand(-24, 24)}px;--dy:${rand(4, 14)}px;--z:${rand(0.6, 1)}`;
      g.field.append(p);
      setTimeout(() => p.remove(), 420);
    }
    // Zibo şerit değiştirir ve tuzak bırakır.
    if (t >= g.ziboNext) {
      const opts = freeLanes(g.ziboLane);
      if (opts.length) g.ziboLane = opts[Math.floor(Math.random() * opts.length)];
      g.ziboNext = t + rand(900, 1600);
    }
    g.ziboX = lerp(g.ziboX === undefined ? laneX(g.ziboLane, ROAD_TOP + 0.05) : g.ziboX, laneX(g.ziboLane, ROAD_TOP + 0.05), Math.min(1, dt * 6));
    const zs = 0.09 * g.W;
    g.zibo.style.width = zs + 'px';
    g.zibo.style.transform = `translate3d(${g.ziboX * g.W - zs / 2}px, ${(ROAD_TOP + 0.05) * g.H - zs * 1.25}px, 0)`;
    if (t >= g.nextTrap) {
      dropTrap();
      g.nextTrap = t + rand(G.trapEveryMs[0], G.trapEveryMs[1]);
    }
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
      const x = 0.5 + pr.side * (halfAt(y) + 0.07 + k * 0.22);
      const size = lerp(0.06, 0.5, k) * g.W;
      pr.el.style.width = size + 'px';
      pr.el.style.transform = `translate3d(${x * g.W - size / 2}px, ${y * g.H - size}px, 0)`;
    });
    g.crates.slice().forEach(c => {
      if (!c.alive) return;
      c.z += G.walkSpeed * dt;
      // Altın sandık şerit değiştirir: nişan almak zorlaşır.
      if (c.def.hops) c.sx = (G.lanes - 1) / 2 + Math.sin(t / 420) * (G.lanes - 1) / 2;
      if (c.z >= 1.08) return pass(c);
      place(c);
    });
    g.traps.slice().forEach(c => {
      if (!c.alive) return;
      c.z += G.walkSpeed * dt;
      if (!c.done && c.z >= 0.94) {
        c.done = true;
        if (c.sx === g.lane) trapHit(c);
        else { CZ.audio.sfx('throw'); float(c.px, c.py - c.size, CZ.t('gold.dodge')); if (CZ.quests) CZ.quests.track('dodge'); }
      }
      if (c.z >= 1.1) { c.alive = false; c.el.remove(); g.traps.splice(g.traps.indexOf(c), 1); return; }
      place(c, 0.85);
    });
    const shown = Math.max(0, Math.ceil(g.timeLeft));
    if (shown !== g.shown) {
      g.shown = shown;
      g.clock.textContent = shown;
      g.clock.classList.toggle('danger', g.timeLeft <= 5);
      g.bar.style.width = Math.min(100, Math.max(0, g.timeLeft / G.roundSeconds * 100)) + '%';
      g.bar.classList.toggle('danger', g.timeLeft <= 5);
      if (shown <= 5 && shown > 0) CZ.audio.sfx('tick');
    }
    if (g.timeLeft <= 0) endRound();
  }

  function shake(hard) {
    g.field.classList.remove('shake', 'shake-hard');
    void g.field.offsetWidth;
    g.field.classList.add(hard ? 'shake-hard' : 'shake');
  }

  // Tuzağa çarptın: altın kaybı, kısa sersemleme, seri bozulur.
  function trapHit(c, shot) {
    const lose = Math.min(Math.ceil(c.def.lose * (g.perk.trapMul || 1)), g.earned);
    if (lose > 0) loseGold(lose);
    float(shot ? c.px : g.meX, shot ? c.py - c.size : g.H * 0.7, lose > 0 ? '−' + lose : t('gold.ouch'), true, true);
    g.stun = c.def.stun;
    g.combo = 0;
    shake(true);
    g.flash.classList.remove('on');
    void g.flash.offsetWidth;
    g.flash.classList.add('on');
    CZ.audio.sfx(c.def.id === 'bomb' ? 'crack' : 'wrong');
    CZ.audio.vibrate([60, 40, 90]);
    if (c.def.id === 'bomb' || shot) boom(c.px, c.py - c.size / 2);
    showCombo(t('gold.trap.' + c.def.id), true);
  }

  function boom(x, y) {
    const ring = h('i', { class: 'boom-ring' });
    ring.style.cssText = `left:${x}px;top:${y}px`;
    g.field.append(ring);
    setTimeout(() => ring.remove(), 500);
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

  // Dokunuş: kutuya yakınsa at; değilse kaydırma başlangıcı.
  function onDown(e) {
    if (!g.running) return;
    g.swipe = { x: e.clientX, y: e.clientY, at: performance.now() };
    const nowMs = performance.now();
    if (g.stun > 0) return;
    if (nowMs - g.lastThrow < G.throwGapMs) return;
    const px = e.clientX - g.left;
    const py = e.clientY - g.top;
    let best = null;
    let bestScore = Infinity;
    g.crates.concat(g.traps.filter(c => c.def.shootable && !c.done)).forEach(c => {
      if (!c.alive) return;
      const dist = Math.hypot(px - c.px, py - (c.py - c.size / 2));
      const reach = Math.max(c.size * 0.85, 44);
      if (dist < reach && dist - c.z * 30 < bestScore) { best = c; bestScore = dist - c.z * 30; }
    });
    if (!best) return;
    e.preventDefault();
    g.swipe = null;
    g.lastThrow = nowMs;
    if (g.hint) g.hint.classList.remove('coach');
    throwAt(best);
  }

  function onUp(e) {
    if (!g || !g.running || !g.swipe) return;
    const dx = e.clientX - g.swipe.x;
    if (Math.abs(dx) > 34 && Math.abs(dx) > Math.abs(e.clientY - g.swipe.y)) moveLane(dx < 0 ? -1 : 1);
    g.swipe = null;
  }

  function throwAt(target) {
    const startX = g.meX + g.W * 0.06;
    const startY = g.H * 0.8;
    const ball = h('i', { class: 'snowball w-' + g.weapon.id });
    ball.style.background = g.weapon.ball;
    g.field.append(ball);
    // Top uçarken hedef yaklaşır: varış noktası biraz ileriye hesaplanır.
    const lead = Math.min(1.08, target.z + G.walkSpeed * 0.2);
    const k = Math.pow(lead, 1.35);
    const y = depthY(k);
    const ty = y * g.H - lerp(0.06, 0.3, k) * g.W / 2;
    const tx = laneX(target.sx, y) * g.W;
    const dx = tx - startX;
    const dy = ty - startY;
    const lift = Math.min(150, Math.abs(dy) * 0.4 + 40);
    CZ.audio.sfx('throw');
    g.me.classList.remove('throw');
    void g.me.offsetWidth;
    g.me.classList.add('throw');
    const anim = ball.animate([
      { transform: `translate3d(${startX}px, ${startY}px, 0) scale(1.3)` },
      { transform: `translate3d(${startX + dx * 0.5}px, ${startY + dy * 0.5 - lift}px, 0) scale(1)`, offset: 0.5 },
      { transform: `translate3d(${tx}px, ${ty}px, 0) scale(${lerp(0.5, 1, k)})` }
    ], { duration: 200, easing: 'linear' });
    anim.onfinish = () => {
      ball.remove();
      if (!g || !g.running) return;
      splash(tx, ty, g.weapon.ball);
      if (!target.alive) return;
      if (target.trap) {
        // Sahte sandık! Vurunca patlar.
        target.done = true;
        target.alive = false;
        target.el.remove();
        g.traps.splice(g.traps.indexOf(target), 1);
        trapHit(target, true);
        return;
      }
      hit(target, tx, ty);
    };
  }

  function splash(x, y, color) {
    for (let i = 0; i < 6; i++) {
      const a = Math.random() * Math.PI * 2;
      const bit = h('i', { class: 'puff' });
      bit.style.cssText = `left:${x}px;top:${y}px;background:${color};--dx:${Math.cos(a) * rand(18, 46)}px;--dy:${Math.sin(a) * rand(12, 34)}px;--z:${rand(0.6, 1.3)}`;
      g.field.append(bit);
      setTimeout(() => bit.remove(), 420);
    }
  }

  function float(x, y, text, big, bad) {
    const el = h('b', { class: 'gold-float' + (big ? ' big' : '') + (bad ? ' bad' : ''), text });
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
  function loseGold(n) {
    g.earned -= n;
    data().gold = Math.max(0, (data().gold || 0) - n);
    g.badge.count.textContent = g.earned;
  }

  // İsabet: altın vermez (yalnız kırılınca gelir), ama kutu sarsılır ve parlar.
  function hit(crate, x, y) {
    crate.hp -= g.weapon.dmg;
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
    const bonus = Math.round(crate.def.gold * mult * (g.perk.goldMul || 1) + (g.perk.goldMul && Math.random() < 0.3 ? 1 : 0));
    addGold(bonus);
    float(cx, cy - 40, '+' + bonus + (mult > 1 ? ' x' + mult : '') + '!', true);
    if (g.combo >= G.comboStep && g.combo % G.comboStep === 0) {
      showCombo(t('gold.combo', { n: mult }));
      CZ.audio.sfx('buy');
    }
    CZ.audio.sfx('crack');
    CZ.audio.vibrate([30, 20, 40]);
    if (crate.def.gold >= 5) shake(crate.def.gold >= 12);
    boom(cx, cy);
    g.xp = (g.xp || 0) + CZ.PROGRESS.xp.crate;
    if (CZ.quests) CZ.quests.track('crate');
    // Altınlar saçılır (az sayıda: telefon ısınmasın).
    const coins = Math.min(8, 3 + crate.def.gold);
    for (let i = 0; i < coins; i++) {
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
    g.me.classList.add('stopped');
    g.field.classList.add('stopped');
    const d = data();
    const record = g.earned > (d.goldBest || 0);
    if (record) d.goldBest = g.earned;
    CZ.state.save();
    if (g.xp) CZ.progress.addXp(Math.round(g.xp));
    if (CZ.quests) CZ.quests.track('goldRun');
    CZ.audio.music(null);
    CZ.audio.sfx('win');
    CZ.audio.vibrate([40, 30, 60]);
    const sheet = h('div', { class: 'sheet sheet-win' },
      h('h2', { text: t('gold.end') }),
      h('p', { class: 'reward', 'data-fly': 'gold', 'data-n': g.earned }, img('ui.gold', 'emerald-icon'), t('gold.earned', { n: g.earned })),
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
