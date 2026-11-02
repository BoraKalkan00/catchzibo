// KOVALAMACA: Zibo eşyanı kapıp kaçtı! 3 şeritli karlı yolda peşinden koş.
// Sola/sağa kaydır (ya da ekranın sol/sağ yarısına dokun) = şerit değiştir. Kanca = aynı şeritteyken Zibo'yu çeker.
// Zibo bomba atar: şerit kırmızı yanıp bip'ler, sonra patlar. Mesafe 0 olunca yakaladın.
CZ.screens.chase = (function () {
  const { h, img, btn } = CZ.ui;
  const t = CZ.t;
  const C = CZ.CHASE;
  let c = null;

  const rand = (a, b) => a + Math.random() * (b - a);
  const lerp = (a, b, k) => a + (b - a) * k;
  const LANE_X = [0.2, 0.5, 0.8];   // oyuncunun sırasında şerit merkezleri
  const ROAD_TOP = 0.3;              // yolun ekrandaki başladığı yer (ufuk)

  function level() {
    return Math.min(C.maxLevel, CZ.state.data.chaseWins || 0);
  }
  // Seviyeye göre aradaki değeri seç: 0 = kolay, maxLevel = zor.
  const byLevel = ([easy, hard]) => lerp(easy, hard, level() / C.maxLevel);

  /* ---------- Ekran ---------- */
  function render(el, params) {
    const round = CZ.game.round(params.roundId);
    c = {
      el, round, params,
      gap: C.startGap, timeLeft: C.seconds, lives: C.lives,
      lane: 1, ziboLane: 1, running: false, last: performance.now(),
      hookReady: 0, burst: 0, stun: 0, continues: 0,
      timers: [], bombs: [], frame: 0
    };

    // Yol: üstte dar (uzak), altta geniş. Şerit merkezleri altta %20 / %50 / %80.
    c.road = h('div', { class: 'chase-road' });
    c.road.innerHTML = '<svg viewBox="0 0 100 100" preserveAspectRatio="none">'
      + '<polygon points="46,0 54,0 95,100 5,100" fill="url(#rg)"/>'
      + '<defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c3d6e6"/><stop offset="1" stop-color="#f4f9fd"/></linearGradient></defs>'
      + '<line class="lane-dash" x1="48.67" y1="0" x2="35" y2="100"/><line class="lane-dash" x1="51.33" y1="0" x2="65" y2="100"/>'
      + '<line x1="46" y1="0" x2="5" y2="100" stroke="#9fb6cc" stroke-width=".8" vector-effect="non-scaling-stroke"/><line x1="54" y1="0" x2="95" y2="100" stroke="#9fb6cc" stroke-width=".8" vector-effect="non-scaling-stroke"/>'
      + '</svg>';
    c.warns = [0, 1, 2].map(i => h('i', { class: 'lane-warn w' + i }));
    c.player = img('avatar.' + (CZ.state.data.avatar || 'girl') + '_run1', 'chase-player');
    ['_run1', '_run2'].forEach(f => { new Image().src = CZ.art('avatar.' + (CZ.state.data.avatar || 'girl') + f); });
    c.ziboImg = img('zibo.run1', 'chase-zibo-img');
    c.loot = img('item.' + round.target, 'chase-loot');
    c.bubble = h('div', { class: 'bubble chase-bubble' }, h('em', { class: 'bubble-goblin' }), h('span', { class: 'bubble-line' }));
    c.zibo = h('div', { class: 'chase-zibo' }, c.bubble, c.loot, c.ziboImg);
    c.chain = h('i', { class: 'chase-chain' });
    c.field = h('div', { class: 'chase-field', onPointerDown: onDown, onPointerUp: onUp, onPointerCancel: () => { c.touch = null; } },
      img('scene.town', 'chase-sky'), c.road, ...c.warns, c.chain, c.zibo, c.player);

    c.gapText = h('strong', { text: '' });
    c.gapBar = h('i', {});
    c.hearts = h('div', { class: 'chase-hearts' });
    c.clock = h('div', { class: 'clock', text: C.seconds });
    c.hookBtn = h('button', { class: 'hook-btn', type: 'button', onPointerDown: e => { e.stopPropagation(); hook(); } },
      img('ui.hook', 'hook-ico'), h('span', { text: t('chase.hook') }), h('i', { class: 'hook-cool' }));

    el.append(
      h('div', { class: 'play-top chase-top' },
        h('div', { class: 'chase-gap' }, h('small', { text: t('chase.distance') }), c.gapText, h('div', { class: 'chase-meter' }, c.gapBar)),
        c.hearts,
        c.clock),
      c.field,
      h('div', { class: 'chase-controls' },
        btn('◀', () => move(-1), 'ghost lane-btn'),
        c.hookBtn,
        btn('▶', () => move(1), 'ghost lane-btn')));

    drawHearts();
    layout();
    intro();
  }

  function intro() {
    const box = h('div', { class: 'intro chase-intro' },
      h('small', { text: t('chase.introTop') }),
      img('item.' + c.round.target, 'intro-item'),
      h('strong', { text: t('chase.introTitle') }),
      h('p', { text: t('chase.introHow') }));
    c.el.append(box);
    CZ.audio.sfx('intro');
    const id = setTimeout(() => {
      box.classList.add('out');
      setTimeout(() => box.remove(), 300);
      start();
    }, 2300);
    c.timers.push(id);
    box.addEventListener('pointerdown', () => { clearTimeout(id); box.remove(); start(); }, { once: true });
  }

  function start() {
    if (!c || c.running) return;
    c.running = true;
    c.last = performance.now();
    c.loop = requestAnimationFrame(loop);
    c.nextSwitch = performance.now() + byLevel(C.laneSwitchMs);
    c.nextBomb = performance.now() + 1500;
    CZ.audio.music('play');
    CZ.audio.setTempo(1.3);
    say('zibo.chase.start');
  }

  /* ---------- Döngü ---------- */
  function loop(now) {
    if (!c || !c.running) return;
    const dt = Math.min(now - c.last, 60) / 1000;
    c.last = now;
    if (!document.hidden) step(dt, now);
    c.loop = requestAnimationFrame(loop);
  }

  function step(dt, now) {
    c.timeLeft -= dt;
    c.frame += dt;
    // Oyuncu hep yaklaşır; sersemlikte durur. Kancadan sonra Zibo bir an kaçar.
    let close = c.stun > 0 ? 0 : C.closeRate;
    if (c.burst > 0) { close -= C.hookBurst; c.burst -= dt; }
    c.stun = Math.max(0, c.stun - dt);
    c.gap = Math.max(0, Math.min(C.startGap * 1.4, c.gap - close * dt));
    c.hookReady = Math.max(0, c.hookReady - dt);

    if (now >= c.nextSwitch) switchLane();
    if (now >= c.nextBomb) throwBomb(now);
    c.bombs.slice().forEach(b => { if (now >= b.at) explode(b); });

    // Koşu karesi: bacaklar sırayla.
    const runFrame = Math.floor(c.frame * 6) % 2 ? 'zibo.run2' : 'zibo.run1';
    if (c.ziboImg.dataset.f !== runFrame) { c.ziboImg.dataset.f = runFrame; c.ziboImg.src = CZ.art(runFrame); }
    const me = 'avatar.' + (CZ.state.data.avatar || 'girl') + (Math.floor(c.frame * 6.6) % 2 ? '_run2' : '_run1');
    if (c.player.dataset.f !== me) { c.player.dataset.f = me; c.player.src = CZ.art(me); }

    layout();
    const shown = Math.max(0, Math.ceil(c.timeLeft));
    if (shown !== c.shown) {
      c.shown = shown;
      c.clock.textContent = shown;
      c.clock.classList.toggle('danger', shown <= 8);
      if (shown <= 5 && shown > 0) CZ.audio.sfx('tick');
    }
    if (c.gap <= 0) return caught();
    if (c.timeLeft <= 0) return escaped('time');
  }

  // Perspektif: Zibo uzaktayken yolun üst kısmında ve küçük, yaklaştıkça büyür ve aşağı iner.
  function layout() {
    const near = 1 - Math.min(1, c.gap / C.startGap);
    const y = lerp(0.3, 0.6, near);
    const scale = lerp(0.55, 1.0, near);
    // Zibo'nun şeridi yolun o yükseklikteki genişliğine göre: uzakta yol dar.
    const f = Math.max(0, (y - ROAD_TOP) / (1 - ROAD_TOP));
    const half = 0.04 + f * 0.41;
    const x = 0.5 + (c.ziboLane - 1) * half * (2 / 3);
    c.zibo.style.left = x * 100 + '%';
    c.zibo.style.top = y * 100 + '%';
    c.zibo.style.setProperty('--s', scale);
    c.player.style.left = LANE_X[c.lane] * 100 + '%';
    c.gapText.textContent = t('chase.meters', { n: Math.ceil(c.gap) });
    c.gapBar.style.width = Math.max(0, 100 - c.gap / C.startGap * 100) + '%';
    c.hookBtn.classList.toggle('cool', c.hookReady > 0);
    c.hookBtn.style.setProperty('--cool', c.hookReady / C.hookCooldown);
    c.hookBtn.classList.toggle('aim', c.hookReady <= 0 && c.lane === c.ziboLane);
  }

  function switchLane() {
    const options = [0, 1, 2].filter(l => l !== c.ziboLane && Math.abs(l - c.ziboLane) <= (Math.random() < 0.25 ? 2 : 1));
    c.ziboLane = options[Math.floor(Math.random() * options.length)];
    c.nextSwitch = performance.now() + byLevel(C.laneSwitchMs) * rand(0.75, 1.25);
    if (Math.random() < 0.35 && !speaking()) say(pick(['zibo.chase.slow', 'zibo.chase.tongue', 'zibo.chase.mine']));
  }

  /* ---------- Bombalar ---------- */
  function throwBomb(now) {
    c.nextBomb = now + byLevel(C.bombEveryMs) * rand(0.8, 1.2);
    // Çoğunlukla oyuncunun şeridine atar: kaçmak zorunda kalsın.
    let lanes = [Math.random() < 0.7 ? c.lane : Math.floor(Math.random() * 3)];
    if (level() >= C.doubleBombLevel && Math.random() < 0.45) {
      const other = [0, 1, 2].filter(l => l !== lanes[0]);
      lanes.push(other[Math.floor(Math.random() * 2)]);
    }
    lanes.forEach(lane => {
      const b = { lane, at: now + C.warnMs };
      c.bombs.push(b);
      const warn = c.warns[lane];
      warn.classList.add('on');
      // Bip sesi düşme anına yaklaştıkça sıklaşır.
      const beep = gap => {
        if (!c || !c.running || !c.bombs.includes(b)) return;
        CZ.audio.sfx('tick');
        const left = b.at - performance.now();
        if (left > 120) b.beep = setTimeout(() => beep(Math.max(90, gap * 0.72)), Math.min(gap, left - 60));
      };
      beep(380);
      // Bomba Zibo'dan şeride uçar.
      const box = c.field.getBoundingClientRect();
      const from = c.zibo.getBoundingClientRect();
      const bomb = h('i', { class: 'bomb' });
      c.field.append(bomb);
      const sx = from.left + from.width / 2 - box.left;
      const sy = from.top + from.height * 0.3 - box.top;
      const ex = LANE_X[lane] * box.width;
      const ey = box.height * 0.84;
      bomb.style.left = sx + 'px';
      bomb.style.top = sy + 'px';
      b.el = bomb;
      bomb.animate([
        { transform: 'translate(-50%, -50%) scale(.5)' },
        { transform: `translate(calc(-50% + ${(ex - sx) * 0.5}px), calc(-50% + ${(ey - sy) * 0.5 - 120}px)) scale(1)`, offset: 0.5 },
        { transform: `translate(calc(-50% + ${ex - sx}px), calc(-50% + ${ey - sy}px)) scale(1.3)` }
      ], { duration: C.warnMs, easing: 'linear', fill: 'forwards' });
    });
    c.ziboImg.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-14deg)' }, { transform: 'rotate(0)' }], { duration: 300 });
  }

  function explode(b) {
    c.bombs.splice(c.bombs.indexOf(b), 1);
    clearTimeout(b.beep);
    if (!c.bombs.some(o => o.lane === b.lane)) c.warns[b.lane].classList.remove('on');
    if (b.el) b.el.remove();
    const box = c.field.getBoundingClientRect();
    const boom = h('i', { class: 'boom' });
    boom.style.left = LANE_X[b.lane] * 100 + '%';
    boom.style.top = '84%';
    c.field.append(boom);
    setTimeout(() => boom.remove(), 500);
    CZ.audio.sfx('crack');
    if (b.lane === c.lane && c.stun <= 0) {
      c.lives -= 1;
      c.gap = Math.min(C.startGap * 1.4, c.gap + C.bombHit);
      c.stun = 0.6;
      drawHearts();
      CZ.audio.sfx('wrong');
      CZ.audio.vibrate([80, 40, 120]);
      c.field.classList.remove('shake-hard');
      void c.field.offsetWidth;
      c.field.classList.add('shake-hard');
      c.player.classList.add('hurt');
      setTimeout(() => c && c.player.classList.remove('hurt'), 600);
      say('zibo.chase.hit');
      if (c.lives <= 0) escaped('lives');
    } else {
      CZ.audio.vibrate(15);
    }
    void box;
  }

  /* ---------- Kontroller ---------- */
  function move(dir) {
    if (!c || !c.running) return;
    const next = Math.max(0, Math.min(2, c.lane + dir));
    if (next === c.lane) return;
    c.lane = next;
    CZ.audio.sfx('throw');
    CZ.audio.vibrate(6);
    layout();
  }

  function onDown(e) {
    c.touch = { x: e.clientX, y: e.clientY, at: performance.now() };
  }
  function onUp(e) {
    if (!c.touch) return;
    const dx = e.clientX - c.touch.x;
    const dy = e.clientY - c.touch.y;
    c.touch = null;
    if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) return move(dx > 0 ? 1 : -1);
    if (Math.abs(dy) > 40 && dy < 0) return hook();          // yukarı kaydır = kanca
    const box = c.field.getBoundingClientRect();
    move(e.clientX - box.left < box.width / 2 ? -1 : 1);       // dokunma: sol/sağ yarı
  }

  // Kanca: Zibo aynı şeritteyse çeker ama tamamen değil; sonra Zibo hızlanır.
  function hook() {
    if (!c || !c.running || c.hookReady > 0) return;
    c.hookReady = C.hookCooldown;
    const hit = c.lane === c.ziboLane;
    const box = c.field.getBoundingClientRect();
    const zr = c.zibo.getBoundingClientRect();
    const px = LANE_X[c.lane] * box.width;
    const py = box.height * 0.82;
    const tx = hit ? zr.left + zr.width / 2 - box.left : px;
    const ty = hit ? zr.top + zr.height * 0.55 - box.top : box.height * 0.3;
    const len = Math.hypot(tx - px, ty - py);
    const ang = Math.atan2(ty - py, tx - px) * 180 / Math.PI;
    c.chain.style.left = px + 'px';
    c.chain.style.top = py + 'px';
    c.chain.style.width = len + 'px';
    c.chain.style.transform = `rotate(${ang}deg)`;
    c.chain.classList.remove('fire');
    void c.chain.offsetWidth;
    c.chain.classList.add('fire');
    CZ.audio.sfx('lift', 4);
    if (hit) {
      c.gap = Math.max(0, c.gap - C.hookPull);
      c.burst = 1;
      CZ.audio.vibrate([20, 30, 40]);
      c.zibo.animate([{ transform: 'translate(-50%, -100%) scale(var(--s)) rotate(0)' }, { transform: 'translate(-50%, -100%) scale(var(--s)) rotate(10deg)' }, { transform: 'translate(-50%, -100%) scale(var(--s)) rotate(0)' }], { duration: 300 });
      say(pick(['zibo.chase.ouch', 'zibo.chase.hooked']));
      floatText(tx, ty, t('chase.pulled', { n: C.hookPull }));
    } else {
      floatText(px, box.height * 0.5, t('chase.miss'));
    }
    layout();
  }

  function floatText(x, y, text) {
    const el = h('b', { class: 'gold-float', text });
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    c.field.append(el);
    setTimeout(() => el.remove(), 900);
  }

  function drawHearts() {
    c.hearts.replaceChildren(...Array.from({ length: C.lives }, (_, i) => h('i', { class: 'heart' + (i < c.lives ? '' : ' empty'), text: '♥' })));
  }

  /* ---------- Zibo konuşur ---------- */
  const pick = list => list[Math.floor(Math.random() * list.length)];
  const speaking = () => c.bubble.classList.contains('show');
  function say(key) {
    const gib = CZ.game.gibberish(key);
    c.bubble.querySelector('em').textContent = gib;
    c.bubble.querySelector('span').textContent = t(key);
    c.bubble.classList.add('show');
    CZ.audio.speak(gib);
    clearTimeout(c.sayTimer);
    c.sayTimer = setTimeout(() => c && c.bubble.classList.remove('show'), 1700);
  }

  /* ---------- Sonuç ---------- */
  function stop() {
    c.running = false;
    cancelAnimationFrame(c.loop);
    c.bombs.forEach(b => { clearTimeout(b.beep); if (b.el) b.el.remove(); });
    c.bombs = [];
    c.warns.forEach(w => w.classList.remove('on'));
    CZ.audio.setTempo(1);
    CZ.audio.music(null);
  }

  function caught() {
    stop();
    const d = CZ.state.data;
    const p = c.params;
    const pocket = C.pocketBase + level() * 2 + Math.floor(Math.max(0, c.timeLeft) / 3);
    const before = CZ.state.round(p.roundId);
    const base = CZ.game.reward(p.roundId, p.secondsLeft, p.stars);
    CZ.state.markFound(p.roundId, base + pocket, p.stars, p.seconds);
    d.chaseWins = (d.chaseWins || 0) + 1;
    CZ.state.save();
    CZ.progress.addXp(CZ.PROGRESS.xp.chase);
    CZ.audio.sfx('win');
    CZ.audio.vibrate([40, 30, 40, 30, 160]);
    c.ziboImg.src = CZ.art('zibo.tantrum');
    c.ziboImg.dataset.f = 'tantrum';
    c.zibo.classList.add('caught');
    say('zibo.chase.caught');
    const mine = h('div', { class: 'mine-pop show', text: t('chase.caught') });
    c.field.append(mine);
    const roomDef = CZ.game.roomOf(p.roundId);
    if (d.roomDoneSeen === true) d.roomDoneSeen = ['living'];
    if (!Array.isArray(d.roomDoneSeen)) d.roomDoneSeen = [];
    const firstClear = CZ.game.roomDone(roomDef) && !d.roomDoneSeen.includes(roomDef.id);
    if (firstClear) { d.roomDoneSeen.push(roomDef.id); CZ.state.save(); }
    const id = setTimeout(() => {
      const next = CZ.game.nextOpen();
      const actions = next
        ? [btn(t('win.toVillage'), () => CZ.ui.go('village'), 'ghost-dark wide'),
          btn(t('win.next'), () => CZ.ui.wipeTo('play', { roundId: next.id }), 'primary wide')]
        : [btn(t('win.toMansion'), () => CZ.ui.go('mansion'), 'ghost-dark wide'),
          btn(t('win.toVillage'), () => CZ.ui.go('village'), 'primary wide')];
      const starRow = h('div', { class: 'star-row' }, [0, 1, 2].map(i => img(i < p.stars ? 'ui.star' : 'ui.star_empty', 'star' + (i < p.stars ? ' pop' : ''))));
      c.el.append(h('div', { class: 'sheet sheet-win' },
        starRow,
        h('h2', { text: t(`item.${c.round.target}.name`) }),
        h('p', { text: firstClear ? t(roomDef.id === 'living' ? 'win.roomDone' : 'win.roomDone.' + roomDef.id) : t('chase.winNote') }),
        h('p', { class: 'reward' }, img('ui.emerald', 'emerald-icon'), t('chase.reward', { n: base, p: pocket })),
        h('div', { class: 'sheet-row' }, actions)));
      void before;
    }, 1300);
    c.timers.push(id);
  }

  function escaped(reason) {
    stop();
    CZ.audio.sfx('lose');
    CZ.audio.vibrate([120, 60, 200]);
    c.ziboImg.src = CZ.art('zibo.tongue');
    c.ziboImg.dataset.f = 'tongue';
    say('zibo.chase.escaped');
    const d = CZ.state.data;
    const canAd = c.continues < 1;
    const canGems = (d.emeralds || 0) >= C.continueEmeralds;
    const sheet = h('div', { class: 'sheet sheet-lose' },
      h('h2', { text: t(reason === 'lives' ? 'chase.outLives' : 'chase.outTime') }),
      h('p', { text: t('chase.escapedNote') }),
      canAd ? btn(t('chase.adMore', { s: C.continueSeconds }), () => { sheet.remove(); adThen(resume); }, 'primary wide') : null,
      btn(t('chase.gemMore', { n: C.continueEmeralds, s: C.continueSeconds }), () => {
        if (!canGems) return CZ.ui.toast(t('village.need'));
        d.emeralds -= C.continueEmeralds;
        CZ.state.save();
        sheet.remove();
        resume();
      }, (canAd ? 'ghost-dark' : 'primary') + ' wide' + (canGems ? '' : ' disabled')),
      btn(t('lose.tomorrow'), () => {
        CZ.state.restUntilTomorrow(c.params.roundId);
        CZ.ui.go('mansion');
        CZ.ui.toast(t('lose.tomorrowToast'));
      }, 'ghost-dark wide'));
    c.el.append(sheet);
  }

  function resume() {
    c.continues += 1;
    c.timeLeft = Math.max(c.timeLeft, 0) + C.continueSeconds;
    c.lives = Math.max(c.lives, 1);
    drawHearts();
    c.ziboImg.src = CZ.art('zibo.run1');
    c.running = true;
    c.last = performance.now();
    c.nextBomb = performance.now() + 1200;
    c.nextSwitch = performance.now() + 900;
    CZ.audio.music('play');
    CZ.audio.setTempo(1.3);
    c.loop = requestAnimationFrame(loop);
    say('zibo.chase.again');
  }

  function adThen(done) {
    let left = 3;
    const count = h('p', { text: t('ad.wait', { s: left }) });
    const box = h('div', { class: 'fake-ad' }, h('small', { text: t('ad.label') }), img('zibo.laugh', 'fake-ad-zibo'), h('h2', { text: t('title.name') }), h('p', { text: t('ad.fake') }), count);
    c.el.append(box);
    c.adTimer = setInterval(() => {
      left -= 1;
      if (left > 0) { count.textContent = t('ad.wait', { s: left }); return; }
      clearInterval(c.adTimer);
      box.remove();
      done();
    }, 1000);
  }

  function leave() {
    if (!c) return;
    stop();
    clearInterval(c.adTimer);
    clearTimeout(c.sayTimer);
    c.timers.forEach(clearTimeout);
    c = null;
  }

  return { render, leave, music: null, get debug() { return c; } };
})();
