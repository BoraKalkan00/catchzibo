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

    // 3D sokak: Altın Avı ile aynı motor (runner3d), 3 şerit.
    c.stage = h('div', { class: 'run-stage chase-stage' });
    c.bubble = h('div', { class: 'bubble chase-bubble' }, h('em', { class: 'bubble-goblin' }), h('span', { class: 'bubble-line' }));
    c.floats = h('div', { class: 'run-floats' });
    c.field = h('div', { class: 'chase-field3d' }, c.stage, c.bubble, c.floats);
    c.readyP = CZ.runner3d.load().then(() => {
      if (!c || c.el !== el) return;
      c.run = CZ.runner3d.start(c.stage, {
        mode: 'chase', lanes: 3, speed: 17, avatar: CZ.state.data.avatar || 'girl', loot: 'item.' + round.target,
        onTap: () => hook(), onSwipeUp: () => hook(),
        onGold() {}, onEmerald() {}, onPower() {}, onCrate() {}, onDodge() {}, onCrash() {}, onEnd() {}
      });
      c.run.state.lane = 1; c.run.state.px = 0;
      return c.run.ready;
    });

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
    c.readyP.then(() => intro()).catch(() => CZ.ui.toast(t('run.noGl')));
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
    if (c.run) c.run.go();
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

    if (c.run) c.lane = c.run.state.lane;
    if (now >= c.nextSwitch) switchLane();
    if (now >= c.nextBomb) throwBomb(now);
    c.bombs.slice().forEach(b => { if (now >= b.at) explode(b); });

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
    if (c.run) c.run.setZibo(c.ziboLane, -(3.6 + c.gap * 0.22));
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
    if (c.run) c.run.ziboThrow();
    // Çoğunlukla oyuncunun şeridine atar: kaçmak zorunda kalsın.
    let lanes = [Math.random() < 0.7 ? c.lane : Math.floor(Math.random() * 3)];
    if (level() >= C.doubleBombLevel && Math.random() < 0.45) {
      const other = [0, 1, 2].filter(l => l !== lanes[0]);
      lanes.push(other[Math.floor(Math.random() * 2)]);
    }
    lanes.forEach(lane => {
      const b = { lane, at: now + C.warnMs };
      c.bombs.push(b);
      // Bip sesi düşme anına yaklaştıkça sıklaşır.
      const beep = gap => {
        if (!c || !c.running || !c.bombs.includes(b)) return;
        CZ.audio.sfx('tick');
        const left = b.at - performance.now();
        if (left > 120) b.beep = setTimeout(() => beep(Math.max(90, gap * 0.72)), Math.min(gap, left - 60));
      };
      beep(380);
      if (c.run) c.run.bomb(lane, C.warnMs / 1000);
    });
  }

  function explode(b) {
    c.bombs.splice(c.bombs.indexOf(b), 1);
    clearTimeout(b.beep);
    CZ.audio.sfx('crack');
    if (b.lane === c.lane && c.stun <= 0) {
      c.lives -= 1;
      c.gap = Math.min(C.startGap * 1.4, c.gap + C.bombHit);
      c.stun = 0.6;
      drawHearts();
      CZ.audio.sfx('wrong');
      CZ.audio.vibrate([80, 40, 120]);
      if (c.run) c.run.hurt();
      floatText(t('gold.ouch'), 'bad');
      say('zibo.chase.hit');
      if (c.lives <= 0) escaped('lives');
    } else {
      CZ.audio.vibrate(15);
    }
  }

  /* ---------- Kontroller ---------- */
  function move(dir) {
    if (!c || !c.running || !c.run) return;
    c.run.move(dir);
    c.lane = c.run.state.lane;
    CZ.audio.vibrate(6);
    layout();
  }

  // Kanca: Zibo aynı şeritteyse çeker ama tamamen değil; sonra Zibo hızlanır.
  function hook() {
    if (!c || !c.running || c.hookReady > 0) return;
    c.hookReady = C.hookCooldown;
    const hit = c.lane === c.ziboLane;
    if (c.run) c.run.hook(hit);
    CZ.audio.sfx('lift', 4);
    if (hit) {
      c.gap = Math.max(0, c.gap - C.hookPull);
      c.burst = 1;
      CZ.audio.vibrate([20, 30, 40]);
      say(pick(['zibo.chase.ouch', 'zibo.chase.hooked']));
      floatText(t('chase.pulled', { n: C.hookPull }), 'gold');
    } else {
      floatText(t('chase.miss'), 'bad');
    }
    layout();
  }

  function floatText(text, kind) {
    const el = h('div', { class: 'run-float ' + (kind || ''), text });
    c.floats.append(el);
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
    c.bombs.forEach(b => clearTimeout(b.beep));
    c.bombs = [];
    if (c.run) c.run.stop();
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
    // İntikam: Zibo dün gece altın çaldıysa, yakalayınca bir kısmı geri gelir.
    const back = CZ.house ? CZ.house.revenge() : 0;
    if (CZ.quests) CZ.quests.track('chase');
    CZ.audio.sfx('win');
    CZ.audio.vibrate([40, 30, 40, 30, 160]);
    if (c.run) c.run.caught();
    say('zibo.chase.caught');
    const mine = h('div', { class: 'mine-pop good show', text: '🎉 ' + t('chase.caught') });
    c.field.append(mine);
    if (c.run) { c.run.state.running = false; }
    const roomDef = CZ.game.roomOf(p.roundId);
    if (d.roomDoneSeen === true) d.roomDoneSeen = ['living'];
    if (!Array.isArray(d.roomDoneSeen)) d.roomDoneSeen = [];
    const firstClear = CZ.game.roomDone(roomDef) && !d.roomDoneSeen.includes(roomDef.id);
    if (firstClear) { d.roomDoneSeen.push(roomDef.id); CZ.state.save(); }
    const id = setTimeout(() => {
      const next = CZ.game.nextOpen();
      const actions = next
        ? [btn(t('win.toVillage'), () => CZ.ui.go('house'), 'ghost-dark wide'),
          btn(t('win.next'), () => CZ.ui.wipeTo('play', { roundId: next.id }), 'primary wide')]
        : [btn(t('win.toMansion'), () => CZ.ui.go('mansion'), 'ghost-dark wide'),
          btn(t('win.toVillage'), () => CZ.ui.go('house'), 'primary wide')];
      const starRow = h('div', { class: 'star-row' }, [0, 1, 2].map(i => img(i < p.stars ? 'ui.star' : 'ui.star_empty', 'star' + (i < p.stars ? ' pop' : ''))));
      c.el.append(h('div', { class: 'sheet sheet-win' },
        starRow,
        h('h2', { text: t(`item.${c.round.target}.name`) }),
        h('p', { text: firstClear ? t(roomDef.id === 'living' ? 'win.roomDone' : 'win.roomDone.' + roomDef.id) : t('chase.winNote') }),
        firstClear && CZ.ROOM_PRIZES[roomDef.id] ? h('p', { class: 'reward prize' }, '🎁 ', t('win.prize', { item: t('look.' + CZ.ROOM_PRIZES[roomDef.id][0] + '.' + CZ.ROOM_PRIZES[roomDef.id][1]) })) : null,
        h('p', { class: 'reward', 'data-fly': 'emeralds', 'data-n': base + pocket }, img('ui.emerald', 'emerald-icon'), t('chase.reward', { n: base, p: pocket })),
        back ? h('p', { class: 'reward revenge', 'data-fly': 'gold', 'data-n': back }, img('ui.gold', 'emerald-icon'), t('raid.revenge', { n: back })) : null,
        h('div', { class: 'sheet-row' }, actions)));
      void before;
    }, 1300);
    c.timers.push(id);
  }

  function escaped(reason) {
    stop();
    CZ.audio.sfx('lose');
    CZ.audio.vibrate([120, 60, 200]);
    if (c.run) c.run.ziboPose('tongue');
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
    if (c.run) { c.run.ziboPose(null); c.run.go(); }
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
    if (c.run) c.run.destroy();
    c = null;
  }

  return { render, leave, music: null, get debug() { return c; } };
})();
