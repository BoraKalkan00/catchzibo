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
  CZ.chaseDbg = () => c;   // test botu için
  function render(el, params) {
    const E = !!params.endless;
    const round = E ? CZ.game.rounds()[0] : CZ.game.round(params.roundId);
    const boss = E ? { id: 'zibo' } : CZ.ZIBO_FAMILY[CZ.game.roomOf(round.id).id] || { id: 'zibo' };
    c = {
      boss, endless: E, score: 0, catches: 0, revived: 0, mult: E ? endlessMult() : 1,
      el, round, params,
      gap: C.startGap * (boss.gapMul || 1) - CZ.charPerk('head'), timeLeft: C.seconds, lives: C.lives,
      lane: 1, ziboLane: 1, running: false, last: performance.now(), sim: 0,
      hookReady: 0, burst: 0, stun: 0, continues: 0, gold: 0,
      timers: [], bombs: [], frame: 0
    };

    // 3D sokak: Altın Avı ile aynı motor (runner3d), 3 şerit.
    c.stage = h('div', { class: 'run-stage chase-stage' });
    c.bubble = h('div', { class: 'bubble chase-bubble' }, h('em', { class: 'bubble-goblin' }), h('span', { class: 'bubble-line' }));
    c.floats = h('div', { class: 'run-floats' });
    c.field = h('div', { class: 'chase-field3d' }, c.stage, c.bubble, c.floats);
    const W = c.W = CZ.GOLD.weapons.find(w => w.id === CZ.state.data.weapon) || CZ.GOLD.weapons[0];
    // (28 Kas) yükleme ekranı yalnız ilk koşuda (modeller inmişse 'Tekrar koş' anında başlar)
    const loading = CZ.ui.loading && !(window.THREE && CZ.kk && CZ.kk.ready()) ? CZ.ui.loading(el, { min: 1200 }) : null;
    c.readyP = CZ.runner3d.load().then(() => {
      if (loading) loading.done();
      if (!c || c.el !== el) return;
      c.run = CZ.runner3d.start(c.stage, {
        mode: 'chase', lanes: 3, speed: 17, endless: E, avatar: CZ.state.data.avatar || 'girl', loot: 'item.' + round.target,
        ziboTint: c.boss.tint, ziboFly: c.boss.fly, ziboCrown: c.boss.crown,
        pet: CZ.activePet(), perk: {}, goldMult: 1 + CZ.charPerk('gold'), sledBoost: CZ.charPerk('sled'), dmg: W.dmg, weaponId: W.id, weaponArt: W.art, ball: W.ball, sledLvl: CZ.upLevel('sled'),
        onAct(k) { if (c && c.tut) tutAct(k); if (c && c.act && c.running && k !== 'move') c.act[k] = (c.act[k] || 0) + 1; },
        onDash(lvl) { if (!c || !c.running) return; if (c.act) c.act.sled += 1; const n = 3 + lvl; c.gap = Math.max(0, c.gap - n); floatText(t('run.sledGo') + ' -' + n + ' m', 'gold'); say('zibo.chase.dash'); },
        onTap: () => hook(),
        bestDist: E ? (CZ.state.data.bestDist || 0) : 0, bestText: t('run.signBest'),
        letter: () => E && CZ.letters ? CZ.letters.next() : null,
        onLetter(ch) { if (!CZ.letters) return; const r = CZ.letters.got(ch); floatText(t('let.got', { ch, n: r.n }), 'gold', true); if (r.done) { floatText(t('let.done'), 'gold', true); CZ.audio.sfx('win'); } },   // (28 Kas) ekrana dokun = kartopu at (tek parmak)
        onSledReady() { const d = CZ.state.data; if ((d.sledTips || 0) < 3) { d.sledTips = (d.sledTips || 0) + 1; CZ.state.save(); tutTip('tut.sled', '🛷'); } },
        onGold(n) { c.gold += n; if (c.gold >= (c.goldSay || 25)) { c.goldSay = c.gold + 40; if (!speaking()) say('zibo.chase.gold'); } c.goldText.textContent = c.gold; c.goldText.parentNode.classList.remove('bump'); void c.goldText.offsetWidth; c.goldText.parentNode.classList.add('bump'); },
        onEmerald() {}, onCrate() {},
        onPower(kind) { floatText(t('run.power.' + kind), 'power', true); if (kind === 'sleigh') say('zibo.chase.sleigh'); },
        onFly(on) { if (on) { CZ.audio.setTempo(1.45); } else { CZ.audio.setTempo(1.3); floatText(t('run.landed'), 'gold'); } },
        onTick(st) { if (c && c.powerHud) drawPowers(st); },
        onDodge() { floatText(t('chase.nice'), 'gold'); },
        onSwipe(combo, near, gold) { swipeText(combo, near, gold); if (near && Math.random() < 0.35 && !speaking()) say('zibo.chase.nearMiss'); },
        onCrash() { hurt(); }, onEnd() {}
      });
      c.run.state.lane = 1; c.run.state.px = 0;
      return c.run.ready;
    });

    if (E) { c.powerHud = h('div', { class: 'power-hud' }); c.powerChips = {}; }
    function drawTarget() {
      if (!c.targetEl) return;
      const tg = c.targets && c.targets[0];
      c.targetEl.style.display = tg ? '' : 'none';
      if (tg) c.targetEl.textContent = t('chal.next', { name: tg.name, n: tg.score.toLocaleString() });
    }
    c.drawTarget = drawTarget;
    c.gapText = h('strong', { text: '' });
    c.goldText = h('b', { text: '0' });
    c.gapBar = h('i', {});
    c.hearts = h('div', { class: 'chase-hearts' + (E ? ' hide' : '') });
    c.clock = h('div', { class: 'clock' + (E ? ' score-clock' : ''), text: E ? '0' : C.seconds });
    c.hookBtn = h('button', { class: 'hook-btn', type: 'button', onPointerDown: e => { e.stopPropagation(); hook(); } },
      img(W.art, 'hook-ico'), h('span', { text: t('chase.throw') }), h('i', { class: 'hook-cool' }));

    el.append(
      h('div', { class: 'play-top chase-top' },
        E ? h('div', { class: 'chase-gap endless-best' }, h('small', { text: t('endless.best', { n: CZ.state.data.bestRun || 0 }) })) : h('div', { class: 'chase-gap' }, h('small', { text: E ? t('endless.best', { n: CZ.state.data.bestRun || 0 }) : c.boss.id === 'zibo' ? t('chase.distance') : t('boss.ahead', { name: t('boss.' + c.boss.id) }) }), c.gapText, h('div', { class: 'chase-meter' }, c.gapBar)),
        c.hearts,
        c.clock),
      c.field);
    c.field.append(h('div', { class: 'chase-gold' }, img('ui.gold', 'mini-ico'), c.goldText), c.hookBtn);
    c.pauseBtn = h('button', { class: 'pause-btn', type: 'button', 'aria-label': t('pause.title'), onPointerDown: e => { e.stopPropagation(); pause(); } }, h('i'), h('i'));
    c.field.append(c.pauseBtn);
    // bildirim gelince / uygulama arka plana geçince otomatik durur
    c.onHide = () => { if (document.hidden) pause(); };
    c.onBlur = () => pause();
    document.addEventListener('visibilitychange', c.onHide);
    window.addEventListener('blur', c.onBlur);
    if (E) {   // (28 Kas) sade HUD: üst şerit yok; sol üstte büyük skor + rekor, sağ üstte altın + duraklat
      el.classList.add('endless'); if (CZ.state.data.hand === 'l') el.classList.add('lefty');
      c.bestEl = h('small', { class: 'hud-best', text: '🏆 ' + (CZ.state.data.bestRun || 0) });
      c.field.append(h('div', { class: 'run-hud' }, c.clock, c.bestEl));
      // (28 Kas) Zibo göstergesi: ne kadar uzakta, kartopu atınca yaklaşır, 0 olunca yakalarsın
      c.speedEl = h('div', { class: 'speed-lines' }); c.field.append(c.speedEl);   // (28 Kas) hız çizgileri
      c.zmFill = h('i'); c.zmText = h('b', { text: '' });
      c.field.append(h('div', { class: 'zibo-meter' }, h('img', { src: 'assets/zibo/png/laugh.webp', alt: '' }), h('div', { class: 'zm-bar' }, c.zmFill), c.zmText));
    }
    if (E && c.mult > 1) c.field.append(h('div', { class: 'mult-chip' }, 'x' + c.mult));
    if (E) c.field.append(c.powerHud);
    if (E) {
      c.gap = Math.max(8, C.startGap - CZ.runPerk('head'));
      c.targets = CZ.challenge ? CZ.challenge.targets().filter(x => x.score > 0) : [];
      c.targetEl = h('div', { class: 'target-chip' });
      drawTarget();   // (28 Kas) 'Sıradaki: Zibo 590' kaldırıldı (anlaşılmıyordu)
      const me = CZ.state.data.avatar || 'girl';
      const perk = CZ.runPerkText ? CZ.runPerkText(me) : '';

      c.act = { jump: 0, roll: 0, hit: 0, sled: 0 };
      c.tut = !CZ.state.data.runTut; c.tutI = 0;
    }

    drawHearts();
    layout();
    c.readyP.then(() => intro()).catch(() => CZ.ui.toast(t('run.noGl')));
  }

  function intro() {
    // (28 Kas) ilk koşudan önce 4 sn'lik hikâye: Zibo altını çaldı, peşinden koş (dokununca geçer)
    if (c.endless && !CZ.state.data.storyRun) {
      CZ.state.data.storyRun = true; CZ.state.save();
      const box = h('div', { class: 'story-card' },
        h('img', { src: 'assets/ld/zibo_soygun_v.webp', alt: '' }),
        h('div', { class: 'story-txt' }, h('strong', { text: t('story.run1') }), h('p', { text: t('story.run2') }), h('small', { text: t('story.tap') })));
      c.el.append(box); CZ.audio.sfx('intro');
      let gone = false;
      const go = () => { if (gone) return; gone = true; box.classList.add('out'); setTimeout(() => box.remove(), 350); start(); };
      c.timers.push(setTimeout(go, 4200));
      box.addEventListener('pointerdown', go, { once: true });
      return;
    }
    if (c.endless) return start();
    const box = h('div', { class: 'intro chase-intro' },
      h('small', { text: c.boss.id === 'zibo' ? t('chase.introTop') : t('boss.' + c.boss.id + '.tag') }),
      img('item.' + c.round.target, 'intro-item'),
      h('strong', { text: c.boss.id === 'zibo' ? t('chase.introTitle') : t('boss.runs', { name: t('boss.' + c.boss.id) }) }),
      h('p', { text: t('chase.introHow') }));
    c.el.append(box);
    CZ.audio.sfx('intro');
    const id = setTimeout(() => {
      box.classList.add('out');
      setTimeout(() => box.remove(), 300);
      start();
    }, 1400);
    c.timers.push(id);
    box.addEventListener('pointerdown', () => { clearTimeout(id); box.remove(); start(); }, { once: true });
  }

  function start() {
    if (!c || c.running) return;
    c.running = true;
    if (c.run) c.run.go(true);
    c.last = performance.now();
    c.loop = requestAnimationFrame(loop);
    if (c.endless) { if (c.run) c.run.state.invT = 2.4; countdown(() => {}, true); }
    c.nextSwitch = c.sim + byLevel(C.laneSwitchMs) * (c.boss.switchMul || 1);
    c.nextBomb = c.sim + (c.endless ? 25000 : 1500);
    CZ.audio.music('play');
    CZ.audio.setTempo(1.3);
    say(c.boss.id === 'zibo' ? 'zibo.chase.start' : 'zibo.boss.' + c.boss.id);
  }

  /* ---------- Döngü ---------- */
  function loop(now) {
    if (!c || !c.running) return;
    // Oyun saati: 3D motorla aynı sınır (50 ms). Yavaş telefonda bomba görüntüsü ile patlama ayrışmaz.
    const dt = Math.min(now - c.last, 50) / 1000;
    c.last = now;
    if (!document.hidden && !c.paused) { c.sim += dt * 1000; step(dt, c.sim); }
    c.loop = requestAnimationFrame(loop);
  }

  // Görev çarpanı: bugün tamamlanan her görev skoru +1 katlar (Subway Surfers'taki gibi).
  // Kalıcı çarpan: görev setleri bitince artar (Subway Surfers gibi), en çok x30.
  function endlessMult() {
    try { return CZ.missions.mult(); } catch (e) { return 1; }
  }
  // (28 Kas) İlk koşu öğreticisi ETKİLEŞİMLİ: engel gelir, oyun ağır çekime girer, doğru hareketi yapınca devam eder.
  const TUT = [[1.2, 'wall', 'tut.swipe', '⇆', 'move'], [5, 'low', 'tut.jump', '⇧', 'jump'], [9, 'high', 'tut.roll', '⇩', 'roll']];
  function tutTip(key, ic, stay) {
    if (c.tipEl) c.tipEl.remove();
    const tip = c.tipEl = h('div', { class: 'tut-tip' + (stay ? ' stay' : '') }, h('b', { class: 'tut-ic', text: ic }), h('span', { text: t(key) }));
    c.field.append(tip);
    if (!stay) { setTimeout(() => tip.classList.add('out'), 3200); setTimeout(() => tip.remove(), 3700); }
    return tip;
  }
  function tutStep() {
    if (!c.tut || !c.run) return;
    c.nextBomb = c.sim + 25000;
    const R = c.run, st = R.state;
    if (c.tutCur) {
      const z = c.tutCur.o.mesh.position.z;
      if (!c.tutCur.slow && z > -9) { c.tutCur.slow = true; tutTip(c.tutCur.key, c.tutCur.ic, true); }
      if (c.tutCur.slow && !c.tutCur.ok) st.tutSlow = z > -4.5 ? 0.0001 : 0.1;
      if (c.tutCur.ok || z > 3) {
        st.tutSlow = 0; if (c.tipEl) { c.tipEl.classList.add('out'); const el = c.tipEl; setTimeout(() => el.remove(), 400); c.tipEl = null; }
        if (c.tutCur.ok) floatText(t('chase.nice'), 'gold');
        c.tutCur = null; c.tutAt = c.alive + 2.2;
      }
      return;
    }
    if (c.tutI < TUT.length && c.alive >= Math.max(TUT[c.tutI][0], c.tutAt || 0)) {
      const [, kind, key, ic, need] = TUT[c.tutI++];
      c.tutCur = { o: R.tutSpawn(kind), key, ic, need };
      return;
    }
    if (c.tutI >= TUT.length && !c.tutEnd) { c.tutEnd = true; c.tutAt = c.alive; tutTip('tut.throw', '●'); setTimeout(() => { if (c && c.running) tutTip('tut.done', '★'); }, 3800); }
    if (c.tutEnd && c.alive > (c.tutAt || 0) + 8) { c.tut = false; CZ.state.data.runTut = true; CZ.state.save(); }
  }
  function tutAct(k) { if (c && c.tutCur && c.tutCur.slow && (k === c.tutCur.need)) { c.tutCur.ok = true; } }
  function endlessStep(dt) {
    const rs = c.run ? c.run.state : {};
    c.score += dt * 10 * ((rs.speed || 18) / 18) * (rs.doubleT > 0 ? 2 : 1) * c.mult * (1 + CZ.runPerk('score'));
    c.alive = (c.alive || 0) + dt;
    tutStep();
    if (c.speedEl) { const sp = rs.speed || 15, k = Math.max(0, Math.min(1, (sp - 22) / 10)) + (rs.dashT > 0 || rs.flyT > 0 ? 0.6 : 0); c.speedEl.style.opacity = Math.min(0.85, k).toFixed(2); }
    // her 15 sn biraz hızlan (en çok 1.7 kat)
    const sc = Math.floor(c.score);
    if (sc !== c.shown) { c.shown = sc; c.clock.textContent = sc; }
    const best = CZ.state.data.bestRun || 0;
    if (!c.recordSaid && best && sc > best) { c.recordSaid = true; floatText(t('endless.record'), 'gold', true); CZ.audio.sfx('star'); CZ.audio.vibrate([30, 20, 60]); c.field.classList.add('record'); setTimeout(() => c && c.field.classList.remove('record'), 1600); if (c.bestEl) { c.bestEl.textContent = '🏆 ' + t('run.newBest'); c.bestEl.classList.add('hot'); } }
    else if (c.bestEl && best && !c.recordSaid) { const left = best - sc; const near = left > 0 && left < Math.max(60, best * 0.15); c.bestEl.textContent = near ? t('run.toBest', { n: left }) : '🏆 ' + best; c.bestEl.classList.toggle('hot', near); }   // (28 Kas) rekora yaklaşınca sayaç
    // ligdeki / arkadaşlardaki hedefleri geçtikçe haber ver
    if (c.targets && c.targets.length && sc > c.targets[0].score) {
      const tg = c.targets.shift();
      floatText(t('chal.passed', { name: tg.name }), 'gold', true); CZ.audio.sfx('star'); CZ.audio.vibrate(20);
      c.drawTarget();
    }
  }
  function endlessCatch() {
    c.catches += 1;
    const bonus = Math.round(100 * c.mult * c.catches * (1 + CZ.runPerk('catchBonus')));
    c.score += bonus;
    c.gold += 10 + c.catches * 5;
    // Noel Kız: her yakalamada elmas
    const gems = CZ.runPerk('gemCatch') ? Math.floor(1 + CZ.runPerk('gemCatch')) : 0;
    if (gems) { c.gems = (c.gems || 0) + gems; CZ.state.data.emeralds = (CZ.state.data.emeralds || 0) + gems; CZ.state.save(); }
    c.goldText.textContent = c.gold;
    c.gap = Math.max(8, C.startGap - CZ.runPerk('head'));
    c.ziboStun = 0;
    if (c.run && c.run.catchBurst) c.run.catchBurst();
    CZ.audio.sfx('win'); CZ.audio.vibrate([30, 20, 60]);
    floatText(t('endless.caught', { n: bonus }) + (gems ? '  +' + gems + ' 💎' : ''), 'gold', true);
    say('zibo.chase.again');
  }

  function step(dt, now) {
    if (!c.endless) c.timeLeft -= dt; else endlessStep(dt);
    c.frame += dt;
    // Oyuncu hep yaklaşır; sersemlikte durur. Kancadan sonra Zibo bir an kaçar.
    let close = c.stun > 0 ? 0 : c.endless ? C.closeRate * (c.run && c.run.state.flyT > 0 ? 2.4 : 0.35) : byLevel([C.closeRate, C.closeRate * 0.55]);
    if (c.burst > 0) { close -= C.hookBurst; c.burst -= dt; }
    c.stun = Math.max(0, c.stun - dt);
    c.gap = Math.max(0, Math.min(C.startGap * 1.4, c.gap - close * dt));
    c.hookReady = Math.max(0, c.hookReady - dt);

    if (c.run) c.lane = c.run.state.lane;
    c.ziboStun = Math.max(0, (c.ziboStun || 0) - dt);
    // Tilki: ara ara Zibo'ya atılır, onu sendeletip yaklaştırır
    const pet = CZ.activePet();
    if (pet && pet.id === 'fox' && c.run) {
      c.foxIn = (c.foxIn == null ? CZ.petFx.foxEvery(pet.lvl) : c.foxIn) - dt;
      if (c.foxIn <= 0) {
        c.foxIn = CZ.petFx.foxEvery(pet.lvl);
        c.run.petDash(() => {
          if (!c || !c.running) return;
          const n = CZ.petFx.foxPull(pet.lvl);
          c.gap = Math.max(0, c.gap - n); c.ziboStun = 0.5;
          floatText(t('pet.foxBite', { n }), 'gold');
        });
      }
    }
    if (now >= c.nextSwitch && c.ziboStun <= 0) switchLane();
    if (now >= c.nextBomb) throwBomb(now);
    c.bombs.slice().forEach(b => { if (now >= b.at) explode(b); });

    layout();
    const shown = Math.max(0, Math.ceil(c.timeLeft));
    if (c.endless) { if (c.gap <= 0) endlessCatch(); return; }
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
    if (c.run) c.run.setZibo(c.ziboLane, -(3 + c.gap * 0.17));
    c.gapText.textContent = t('chase.meters', { n: Math.ceil(c.gap) });
    if (c.zmFill) { c.zmFill.style.width = Math.max(4, 100 - c.gap / C.startGap * 100) + '%'; c.zmText.textContent = Math.ceil(c.gap) + ' m'; c.zmFill.parentNode.parentNode.classList.toggle('near', c.gap < 12); }
    c.gapBar.style.width = Math.max(0, 100 - c.gap / C.startGap * 100) + '%';
    c.hookBtn.classList.toggle('cool', c.hookReady > 0);
    c.hookBtn.style.setProperty('--cool', c.hookReady / C.hookCooldown);
    c.hookBtn.classList.toggle('aim', c.hookReady <= 0 && c.lane === c.ziboLane);
  }

  function switchLane() {
    const options = [0, 1, 2].filter(l => l !== c.ziboLane && Math.abs(l - c.ziboLane) <= (Math.random() < 0.25 ? 2 : 1));
    c.ziboLane = options[Math.floor(Math.random() * options.length)];
    c.nextSwitch = c.sim + byLevel(C.laneSwitchMs) * rand(0.75, 1.25) * (c.boss.switchMul || 1);
    if (Math.random() < 0.35 && !speaking()) say(pick(['zibo.chase.slow', 'zibo.chase.tongue', 'zibo.chase.mine']));
  }

  /* ---------- Bombalar ---------- */
  function throwBomb(now) {
    c.nextBomb = now + (c.endless ? Math.max(4200, 8500 - (c.alive || 0) * 25) * rand(0.85, 1.2) : byLevel(C.bombEveryMs) * rand(0.8, 1.2) * (c.boss.bombMul || 1));   // (28 Kas) sonsuz koşuda bomba seyrek, zamanla sıklaşır
    // kızakla uçarken Zibo bomba atmaz (yerdeki bombalar seni tutamaz, sadece görüşü kapatır)
    if (c.run && c.run.state.flyT > 0) return;
    if (c.run) c.run.ziboThrow();
    // Çoğunlukla oyuncunun şeridine atar: kaçmak zorunda kalsın.
    // Adil olsun: bomba, o anda pankart ya da kızak gelecek şeride düşmez (zıplayarak kaçılabilsin),
    // ve her zaman engelsiz, bombasız en az bir şerit kalır.
    const sec = C.warnMs / 1000;
    const busy = l => c.run ? c.run.obstacleAt(l, sec) : [];
    const ok = l => !busy(l).some(k => k === 'high' || k === 'wall' || k === 'train') && !c.bombs.some(b => b.lane === l);
    const cands = [0, 1, 2].filter(ok);
    if (!cands.length) { c.nextBomb = now + 700; return; }
    let lanes = [cands.includes(c.lane) && Math.random() < 0.7 ? c.lane : cands[Math.floor(Math.random() * cands.length)]];
    if ((c.boss.double && Math.random() < 0.8) || (level() >= C.doubleBombLevel && Math.random() < 0.45)) {
      const other = cands.filter(l => l !== lanes[0]);
      const second = other[Math.floor(Math.random() * other.length)];
      const clear = [0, 1, 2].filter(l => l !== lanes[0] && l !== second && busy(l).length === 0 && !c.bombs.some(x => x.lane === l));
      if (second !== undefined && clear.length) lanes.push(second);
    }
    lanes.forEach(lane => {
      const b = { lane, at: now + C.warnMs };
      c.bombs.push(b);
      // Bip sesi düşme anına yaklaştıkça sıklaşır.
      const beep = gap => {
        if (!c || !c.running || !c.bombs.includes(b)) return;
        CZ.audio.sfx('tick');
        const left = b.at - c.sim;
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
    if (b.lane === c.lane && c.stun <= 0 && c.run && c.run.airborne()) {
      floatText(t('chase.nice'), 'gold');
      CZ.audio.vibrate(15);
    } else if (b.lane === c.lane && c.stun <= 0) {
      CZ.audio.sfx('wrong');
      CZ.audio.vibrate([80, 40, 120]);
      if (c.run) c.run.hurt();
      if (c.boss.freeze) freeze(); else hurt();
    } else {
      CZ.audio.vibrate(15);
    }
  }

  // Buzbo'nun buzu: can almaz ama donarsın, Buzbo uzaklaşır.
  function freeze() {
    if (!c || !c.running || c.stun > 0) return;
    c.gap = Math.min(C.startGap * 1.4, c.gap + C.bombHit * 1.2);
    c.stun = 1.1;
    floatText(t('boss.frozen'), 'bad');
    say('zibo.boss.buzbo.hit');
    c.field.classList.add('frozen');
    setTimeout(() => c && c.field.classList.remove('frozen'), 1100);
  }

  // Bomba ya da engel: bir can gider, Zibo biraz açılır.
  function hurt() {
    if (!c || !c.running || c.stun > 0) return;
    // Sonsuz koşu: Subway Surfers gibi tek çarpma oyunu bitirir (kurtarma reklamı / elmas)
    // (28 Kas) Subway Surfers gibi: ilk çarpma tökezletir (Zibo güler, 8 sn dikkat), 8 sn içinde ikinci çarpma biter.
    if (c.endless) {
      if (!(c.stumbleUntil > c.sim)) {
        c.stumbleUntil = c.sim + 8000; c.stun = 0.5;
        CZ.audio.vibrate([60, 30, 60]); floatText(t('run.stumble'), 'bad'); say('zibo.chase.hit');
        c.field.classList.add('stumble'); clearTimeout(c.stT); c.stT = setTimeout(() => c && c.field.classList.remove('stumble'), 8000);
        return;
      }
      c.field.classList.remove('stumble');
      c.lives = 0; CZ.audio.vibrate([80, 40, 120]); return escaped('lives');
    }
    c.lives -= 1;
    c.gap = Math.min(C.startGap * 1.4, c.gap + C.bombHit);
    c.stun = 0.6;
    drawHearts();
    floatText(t('gold.ouch'), 'bad');
    say('zibo.chase.hit');
    if (c.lives <= 0) escaped('lives');
  }

  /* ---------- Kontroller ---------- */
  function move(dir) {
    if (!c || !c.running || !c.run) return;
    c.run.move(dir);
    c.lane = c.run.state.lane;
    CZ.audio.vibrate(6);
    layout();
  }

  // Silah gücü: kartopu 1 → yıldırım 9. Güçlü silah Zibo'yu daha çok yaklaştırır.
  const pull = () => Math.round(byLevel([C.hookPull + 1, C.hookPull - 2]) + (c.W.dmg - 1) * 0.6 + CZ.charPerk('power'));

  // Kanca: Zibo aynı şeritteyse çeker ama tamamen değil; sonra Zibo hızlanır.
  function hook() {
    if (!c || !c.running || c.hookReady > 0) return;
    c.hookReady = C.hookCooldown;
    const hit = c.lane === c.ziboLane;
    if (c.run) c.run.throwAt(hit, () => {
      if (!c || !c.running) return;
      // İsabet: Zibo sendeler ve gözle görülür şekilde geri düşer.
      c.gap = Math.max(0, c.gap - pull());
      c.ziboStun = 0.45 + c.W.dmg * 0.06;
      if (c.act) c.act.hit += 1;
      say(pick(['zibo.chase.ouch', 'zibo.chase.hooked']));
      floatText(t('chase.pulled', { n: pull() }), 'gold');
      layout();
    });
    if (!hit) floatText(t('chase.miss'), 'bad');
    layout();
  }

  function swipeText(combo, near, gold) {
    if (near) floatText(t('chase.nice'), 'gold');
    else if (combo >= 3) floatText(t('run.combo', { n: combo }), 'gold');
    const d = CZ.state.data;
    if (combo > (d.bestCombo || 0)) { d.bestCombo = combo; if (combo >= 5) floatText(t('run.comboRecord', { n: combo }), 'gold'); }
  }

  function floatText(text, kind, must) {
    if (c.endless && !must) return;
    const el = h('div', { class: 'run-float ' + (kind || ''), text });
    c.floats.append(el);
    setTimeout(() => el.remove(), 900);
  }

  // Aktif güçler: simge + kalan süre çubuğu
  const POWER_MAX = { magnetT: 8, doubleT: 10, superT: 10, flyT: 9.5 };
  const POWER_KEY = { magnetT: 'magnet', doubleT: 'double', superT: 'boots', flyT: 'sleigh' };
  function drawPowers(st) {
    Object.keys(POWER_MAX).forEach(k => {
      const left = st[k] || 0;
      let chip = c.powerChips[k];
      if (left > 0.05) {
        if (!chip) {
          chip = c.powerChips[k] = h('div', { class: 'pw-chip pw-' + POWER_KEY[k] }, h('b', { text: t('run.power.' + POWER_KEY[k]).replace(/!$/, '') }), h('i', {}, h('u', {})));
          c.powerHud.append(chip);
        }
        chip.querySelector('u').style.width = Math.min(100, left / POWER_MAX[k] * 100) + '%';
      } else if (chip) { chip.remove(); delete c.powerChips[k]; }
    });
  }
  function drawHearts() {
    c.hearts.replaceChildren(...Array.from({ length: C.lives }, (_, i) => h('i', { class: 'heart' + (i < c.lives ? '' : ' empty') }, CZ.icon('heart'))));
  }

  /* ---------- Zibo konuşur ---------- */
  const pick = list => list[Math.floor(Math.random() * list.length)];
  const speaking = () => c.bubble.classList.contains('show');
  function say(key) {
    if (c.endless) return;
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
    const back = 0;
    if (CZ.quests) CZ.quests.track('chase');
    CZ.audio.sfx('win');
    CZ.audio.vibrate([40, 30, 40, 30, 160]);
    if (c.run) c.run.caught();
    c.hookBtn.style.display = 'none';
    say('zibo.chase.caught');
    const mine = h('div', { class: 'mine-pop good show', text: t('chase.caught') });
    c.field.append(mine);
    if (c.run) { c.run.state.running = false; }
    const roomDef = CZ.game.roomOf(p.roundId);
    if (d.roomDoneSeen === true) d.roomDoneSeen = ['living'];
    if (!Array.isArray(d.roomDoneSeen)) d.roomDoneSeen = [];
    const firstClear = CZ.game.roomDone(roomDef) && !d.roomDoneSeen.includes(roomDef.id);
    if (firstClear) { d.roomDoneSeen.push(roomDef.id); CZ.state.save(); }
    const id = setTimeout(() => {
      const next = CZ.game.nextAfter(c.round.id);
      const actions = next
        ? [btn(t('win.toVillage'), () => CZ.ui.go('hub'), 'ghost-dark wide'),
          btn(t('win.next'), () => CZ.ui.wipeTo('play', { roundId: next.id }), 'primary wide')]
        : [btn(t('win.toMansion'), () => CZ.ui.go('mansion'), 'ghost-dark wide'),
          btn(t('win.toVillage'), () => CZ.ui.go('hub'), 'primary wide')];
      const starRow = h('div', { class: 'star-row' }, [0, 1, 2].map(i => img(i < p.stars ? 'ui.star' : 'ui.star_empty', 'star' + (i < p.stars ? ' pop' : ''))));
      c.el.append(h('div', { class: 'sheet sheet-win' },
        starRow,
        h('h2', { text: t(`item.${c.round.target}.name`) }),
        h('p', { text: firstClear ? t(roomDef.id === 'living' ? 'win.roomDone' : 'win.roomDone.' + roomDef.id) : t('chase.winNote') }),
        firstClear && CZ.ROOM_PRIZES[roomDef.id] ? h('p', { class: 'reward prize' }, CZ.icon('gift'), t('win.prize', { item: t('char.' + CZ.ROOM_PRIZES[roomDef.id]) })) : null,
        c.gold ? h('p', { class: 'reward', 'data-fly': 'gold', 'data-n': c.gold }, img('ui.gold', 'emerald-icon'), '+' + c.gold) : null,
        h('p', { class: 'reward', 'data-fly': 'emeralds', 'data-n': base + pocket }, img('ui.emerald', 'emerald-icon'), t('chase.reward', { n: base, p: pocket })),
        back ? h('p', { class: 'reward revenge', 'data-fly': 'gold', 'data-n': back }, img('ui.gold', 'emerald-icon'), t('raid.revenge', { n: back })) : null,
        CZ.game.dailyPrizeEl(c.round.id),
        h('div', { class: 'sheet-row' }, actions)));
      // oda bitti: doğal mola, geçiş reklamı kendiliğinden (sıklık CZ.ads içinde)
      c.timers.push(setTimeout(() => CZ.ads.gameOver(), 1500));
      void before;
    }, 2300);
    c.timers.push(id);
  }

  // Oyun bitti: önce "kurtar" (reklamla devam, 4 sn), sonra skor; skordan hemen sonra geçiş reklamı kendiliğinden gelir.
  function endlessOver() {
    stop();
    CZ.audio.sfx('lose');
    CZ.audio.vibrate([120, 60, 200]);
    if (c.run) c.run.ziboPose('tongue');
    say('zibo.chase.escaped');
    if (c.run && c.run.deathFx) c.run.deathFx();
    c.field.classList.add('dying');
    // (28 Kas) ilk 30 saniyede ölünce 'Kurtar beni' reklamı çıkmaz, direkt skor (oyuncuyu reklama boğma)
    const tm = setTimeout(() => { if (!c) return; c.field.classList.remove('dying'); if ((c.alive || 0) < 30) endlessScore(); else savePrompt(); }, 1300);
    c.timers.push(tm);
    return;
    endlessScore();
  }
  // Kurtar beni: reklamla (koşu başına 1 kez) ya da elmasla (10, 20, 40...). 5 sn içinde seçilmezse skor.
  function savePrompt() {
    let left = 7, done = false;
    const d = CZ.state.data;
    const gemCost = 10 * Math.pow(2, c.gemRevives || 0);
    const ring = h('b', { class: 'save-count', text: left });
    const close = () => { done = true; clearInterval(tm); box.remove(); };
    const go = () => { if (done) return; close(); endlessScore(); };
    const back = () => { c.lives = 1; c.stumbleUntil = 0; c.field.classList.remove('stumble'); c.continues -= 1; if (c.run) c.run.revive(); resume(); CZ.audio.sfx('buy'); };
    const box = h('div', { class: 'save-me' },
      h('h2', { text: t('endless.saveMe') }), ring,
      h('p', { class: 'save-score', text: Math.floor(c.score).toLocaleString() }),
      c.revived < 1 ? btn(t('endless.revive'), () => { if (done) return; close(); adThen(() => { c.revived += 1; back(); }); }, 'primary wide', 'ic:play') : null,
      (d.emeralds || 0) < gemCost ? null : btn(t('endless.reviveGems', { n: gemCost }), () => {   /* (28 Kas) elmas yetmezse düğme hiç çıkmasın */
        if (done) return;
        if ((d.emeralds || 0) < gemCost) { CZ.audio.sfx('wrong'); return CZ.ui.toast(t('chars.gemShort', { n: gemCost - (d.emeralds || 0) })); }
        close(); d.emeralds -= gemCost; c.gemRevives = (c.gemRevives || 0) + 1; CZ.state.save(); back();
      }, 'ghost-dark wide', 'ui.emerald'),
      btn(t('endless.skip'), go, 'small ghost-dark'));
    const tm = setInterval(() => { left -= 1; ring.textContent = left; if (left <= 0) go(); }, 1000);
    c.timers.push(tm);
    c.el.append(box);
  }
  // (28 Kas) skor paylaş: görsel kart (logo + skor) üret, telefonun paylaş menüsüyle gönder
  function shareScore(sc) {
    const cv = document.createElement('canvas'); cv.width = 1080; cv.height = 1350; const x = cv.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 1350); g.addColorStop(0, '#1b2a6b'); g.addColorStop(1, '#0d1430'); x.fillStyle = g; x.fillRect(0, 0, 1080, 1350);
    const done = () => {
      x.textAlign = 'center'; x.fillStyle = '#ffe27a'; x.font = '900 70px sans-serif'; x.fillText(t('share.top'), 540, 600);
      x.fillStyle = '#fff'; x.font = '900 260px sans-serif'; x.fillText(String(sc), 540, 870);
      x.fillStyle = '#cfe0ff'; x.font = '800 56px sans-serif'; x.fillText(t('share.beat'), 540, 1000);
      x.fillStyle = '#ffb703'; x.font = '900 50px sans-serif'; x.fillText('borakalkan00.github.io/catchzibo', 540, 1240);
      cv.toBlob(b => {
        const txt = t('share.text', { n: sc }) + ' https://borakalkan00.github.io/catchzibo/';
        let file = null; try { file = new File([b], 'zibo-skor.png', { type: 'image/png' }); } catch (e) {}
        if (file && navigator.canShare && navigator.canShare({ files: [file] })) navigator.share({ files: [file], text: txt }).catch(() => {});
        else if (navigator.share) navigator.share({ text: txt }).catch(() => {});
        else { try { navigator.clipboard.writeText(txt); CZ.ui.toast(t('share.copied')); } catch (e) {} }
      });
    };
    const im = new Image(); im.onload = () => { const w = 760, hh = w * im.height / im.width; x.drawImage(im, 160, 80, w, Math.min(hh, 440)); done(); }; im.onerror = done; im.src = 'assets/ui/logo.webp';
  }
  function endlessScore() {
    const d = CZ.state.data;
    const sc = Math.floor(c.score);
    const record = sc > (d.bestRun || 0);
    if (record) { d.bestRun = sc; if (c.run) d.bestDist = Math.round(c.run.state.dist); }
    d.runs = (d.runs || 0) + 1;
    if ((c.alive || 0) > 12) d.runTut = true;
    d.runGold = (d.runGold || 0) + c.gold;
    c.boxWon = sc >= 500; if (c.boxWon && CZ.mbox) CZ.mbox.add(1);   // (28 Kas) 500+ puan = gizemli kutu
    CZ.state.save();
    if (CZ.quests) CZ.quests.track('chase');
    CZ.progress.addXp(Math.min(40, 5 + Math.floor(sc / 200)));
    // Görev seti ilerlemesi
    const M = CZ.missions;
    M.add('runs', 1); M.add('goldT', c.gold); M.add('catch', c.catches);
    M.add('jump', c.act.jump); M.add('roll', c.act.roll); M.add('hit', c.act.hit); M.add('sled', c.act.sled);
    M.best('score1', sc); M.best('gold1', c.gold); M.best('catch1', c.catches); M.best('time1', c.alive || 0);
    const setDone = M.finish();
    // Haftalık lig
    const lg = CZ.league.submit(sc);
    let doubled = false;
    const goldP = h('p', { class: 'reward' }, img('ui.gold', 'emerald-icon'), h('b', { text: '+' + c.gold }));
    const sheet = h('div', { class: 'sheet sheet-lose endless-over' },
      h('small', { text: t(record ? 'endless.newBest' : 'endless.over') }),
      h('h2', { class: 'big-score', text: sc }),
      h('p', { text: t('endless.best', { n: d.bestRun || 0 }) + (c.mult > 1 ? '  ·  x' + c.mult : '') }),
      !record && d.bestRun && d.bestRun - sc < d.bestRun * 0.2 ? h('p', { class: 'near-best', text: t('run.almost', { n: d.bestRun - sc }) }) : null,
      goldP,
      // (28 Kas) sade bitiş: lig satırı ve görev paneli kaldırıldı (görevler ana ekranda)
      setDone ? h('p', { class: 'rank-up' }, CZ.icon('trophy'), t('home.setDone')) : null,
      c.boxWon ? h('p', { class: 'rank-up' }, '📦 ', t('box.won')) : null,
      c.gold > 0 ? btn(t('endless.double', { n: c.gold }), e => {
        const b = e.currentTarget;
        if (doubled) return;
        adThen(() => { doubled = true; c.gold *= 2; goldP.querySelector('b').textContent = '+' + c.gold; b.remove(); CZ.audio.sfx('buy'); });
      }, 'ghost-dark wide', 'ic:play') : null,
      btn(t('share.btn'), () => shareScore(sc), 'small ghost-dark', 'ic:share'),
      h('div', { class: 'sheet-row' },
        btn(t('win.toVillage'), () => CZ.ui.go('hub'), 'ghost-dark wide'),
        btn(t('endless.again'), () => CZ.ui.wipeTo('chase', { endless: true }), 'primary wide')));
    c.el.append(sheet);
    if (setDone) { CZ.audio.sfx('win'); CZ.audio.vibrate([40, 30, 80]); }
    // Subway Surfers gibi: skor görünür görünmez reklam kendiliğinden açılır (her 2 oyunda bir).
    c.timers.push(setTimeout(() => { if (c && c.el.contains(sheet)) CZ.ads.gameOver(null, { record }); }, 1200));
  }

  function escaped(reason) {
    if (CZ.pass && c && c.endless) CZ.pass.addXp(Math.min(60, Math.floor((c.score || 0) / 40)));
    if (c.endless) return endlessOver();
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
        if (!canGems) { CZ.audio.sfx('wrong'); return CZ.ui.toast(t('run.gemShort', { n: d.emeralds || 0, c: C.continueEmeralds })); }
        d.emeralds -= C.continueEmeralds;
        CZ.state.save();
        sheet.remove();
        resume();
      }, (canAd ? 'ghost-dark' : 'primary') + ' wide' + (canGems ? '' : ' disabled')),
      btn(t('lose.retryFree'), () => CZ.ui.wipeTo('chase', c.params), 'ghost-dark wide', 'ic:play'),
      btn(t('lose.later'), () => CZ.ui.go('mansion'), 'small ghost-dark'));
    c.el.append(sheet);
    c.timers.push(setTimeout(() => { if (c && c.el.contains(sheet)) CZ.ads.gameOver(); }, 1500));
  }

  function resume() {
    c.continues += 1;
    c.timeLeft = Math.max(c.timeLeft, 0) + C.continueSeconds;
    c.lives = Math.max(c.lives, 1);
    drawHearts();
    if (c.run) { c.run.ziboPose(null); c.run.go(); }
    c.running = true;
    c.last = performance.now();
    c.nextBomb = c.sim + 1200;
    c.nextSwitch = c.sim + 900;
    CZ.audio.music('play');
    CZ.audio.setTempo(1.3);
    c.loop = requestAnimationFrame(loop);
    say('zibo.chase.again');
  }

  /* ---------- Duraklatma ---------- */
  function pause() {
    if (!c || !c.running || c.paused || c.counting) return;
    c.paused = true;
    if (c.run) c.run.pause(true);
    CZ.audio.duck(0.15, 9999);
    const box = c.pauseBox = h('div', { class: 'pause-menu' },
      h('div', { class: 'pause-card' },
        h('b', { class: 'lg-title', text: t('pause.title') }),
        c.endless ? h('p', { class: 'pause-score', text: Math.floor(c.score).toLocaleString() }) : null,
        btn(t('pause.resume'), () => { box.remove(); countdown(() => {}); }, 'primary wide', 'ic:play'),
        CZ.audioPanel(),
        btn(t('pause.quit'), () => CZ.ui.confirmBox(t('pause.quitAsk'), t('pause.quit'), t('common.no'), () => { box.remove(); c.paused = false; if (c.endless) { c.lives = 0; escaped('lives'); } else CZ.ui.go('hub'); }, 'danger'), 'small ghost-dark')));
    c.el.append(box);
  }
  // 3-2-1: duraklatmadan dönüşte (ve sonsuz koşu başında) oyun bu sayımla başlar
  function countdown(done, first) {
    if (!c) return;
    c.counting = true;
    c.paused = true;
    if (c.run) c.run.pause(!first);
    const n = h('b', { class: 'cd-num' });
    const box = h('div', { class: 'countdown' }, n);
    c.el.append(box);
    let k = 3;
    const tickNum = () => {
      if (!c) return;
      if (k === 0) {
        box.remove(); c.counting = false; c.paused = false; c.last = performance.now();
        if (c.run) c.run.pause(false);
        CZ.audio.duck(0.55, 0.01); CZ.audio.sfx('star');
        return done();
      }
      n.textContent = k; n.classList.remove('pop'); void n.offsetWidth; n.classList.add('pop');
      CZ.audio.sfx('tick');
      k -= 1;
      c.timers.push(setTimeout(tickNum, 650));
    };
    tickNum();
  }
  // Android geri tuşu: oyundaysan durdurur
  function onBack() { if (c && c.running && !c.paused) { pause(); return true; } return false; }

  function adThen(done) { c.adTimer = CZ.ads.show(done); }

  function leave() {
    if (!c) return;
    document.removeEventListener('visibilitychange', c.onHide);
    window.removeEventListener('blur', c.onBlur);
    stop();
    if (c.gold) { CZ.state.data.gold = (CZ.state.data.gold || 0) + c.gold; CZ.state.save(); }
    clearInterval(c.adTimer);
    clearTimeout(c.sayTimer);
    c.timers.forEach(clearTimeout);
    if (c.run) c.run.destroy();
    c = null;
  }

  return { render, leave, onBack, music: null, get debug() { return c; }, devEnd() { if (c && c.running) { c.lives = 0; escaped('lives'); } } };
})();
