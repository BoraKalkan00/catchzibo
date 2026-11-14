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
    c.readyP = CZ.runner3d.load().then(() => {
      if (!c || c.el !== el) return;
      c.run = CZ.runner3d.start(c.stage, {
        mode: 'chase', lanes: 3, speed: 17, avatar: CZ.state.data.avatar || 'girl', loot: 'item.' + round.target,
        ziboTint: c.boss.tint, ziboFly: c.boss.fly, ziboCrown: c.boss.crown,
        pet: CZ.activePet(), perk: {}, goldMult: 1 + CZ.charPerk('gold'), sledBoost: CZ.charPerk('sled'), dmg: W.dmg, weaponId: W.id, weaponArt: W.art, ball: W.ball, sledLvl: CZ.upLevel('sled'),
        onDash(lvl) { if (!c || !c.running) return; const n = 3 + lvl; c.gap = Math.max(0, c.gap - n); floatText(t('run.sledGo') + ' -' + n + ' m', 'gold'); say('zibo.chase.dash'); },
        onTap: () => hook(),
        onGold(n) { c.gold += n; if (c.gold >= (c.goldSay || 25)) { c.goldSay = c.gold + 40; if (!speaking()) say('zibo.chase.gold'); } c.goldText.textContent = c.gold; c.goldText.parentNode.classList.remove('bump'); void c.goldText.offsetWidth; c.goldText.parentNode.classList.add('bump'); },
        onEmerald() {}, onPower() {}, onCrate() {},
        onDodge() { floatText(t('chase.nice'), 'gold'); },
        onSwipe(combo, near, gold) { swipeText(combo, near, gold); if (near && Math.random() < 0.35 && !speaking()) say('zibo.chase.nearMiss'); },
        onCrash() { hurt(); }, onEnd() {}
      });
      c.run.state.lane = 1; c.run.state.px = 0;
      return c.run.ready;
    });

    c.gapText = h('strong', { text: '' });
    c.goldText = h('b', { text: '0' });
    c.gapBar = h('i', {});
    c.hearts = h('div', { class: 'chase-hearts' });
    c.clock = h('div', { class: 'clock' + (E ? ' score-clock' : ''), text: E ? '0' : C.seconds });
    c.hookBtn = h('button', { class: 'hook-btn', type: 'button', onPointerDown: e => { e.stopPropagation(); hook(); } },
      img(W.art, 'hook-ico'), h('span', { text: t('chase.throw') }), h('i', { class: 'hook-cool' }));

    el.append(
      h('div', { class: 'play-top chase-top' },
        h('div', { class: 'chase-gap' }, h('small', { text: E ? t('endless.best', { n: CZ.state.data.bestRun || 0 }) : c.boss.id === 'zibo' ? t('chase.distance') : t('boss.ahead', { name: t('boss.' + c.boss.id) }) }), c.gapText, h('div', { class: 'chase-meter' }, c.gapBar)),
        c.hearts,
        c.clock),
      c.field);
    c.field.append(h('div', { class: 'chase-gold' }, img('ui.gold', 'mini-ico'), c.goldText), c.hookBtn);
    if (E && c.mult > 1) c.field.append(h('div', { class: 'mult-chip' }, 'x' + c.mult));

    drawHearts();
    layout();
    c.readyP.then(() => intro()).catch(() => CZ.ui.toast(t('run.noGl')));
  }

  function intro() {
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
    if (c.run) c.run.go();
    c.last = performance.now();
    c.loop = requestAnimationFrame(loop);
    c.nextSwitch = c.sim + byLevel(C.laneSwitchMs) * (c.boss.switchMul || 1);
    c.nextBomb = c.sim + 1500;
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
    if (!document.hidden) { c.sim += dt * 1000; step(dt, c.sim); }
    c.loop = requestAnimationFrame(loop);
  }

  // Görev çarpanı: bugün tamamlanan her görev skoru +1 katlar (Subway Surfers'taki gibi).
  function endlessMult() {
    try { return 1 + CZ.quests.today().list.filter(x => x.claimed).length; } catch (e) { return 1; }
  }
  function endlessStep(dt) {
    c.score += dt * 10 * (c.run ? c.run.state.speedMul || 1 : 1) * c.mult;
    // her 15 sn biraz hızlan (en çok 1.7 kat)
    if (c.run) c.run.state.speedMul = Math.min(1.7, 1 + Math.floor(c.sim / 15000) * 0.07);
    const sc = Math.floor(c.score);
    if (sc !== c.shown) { c.shown = sc; c.clock.textContent = sc; }
    if (!c.recordSaid && CZ.state.data.bestRun && sc > CZ.state.data.bestRun) { c.recordSaid = true; floatText(t('endless.record'), 'gold'); CZ.audio.sfx('star'); }
  }
  function endlessCatch() {
    c.catches += 1;
    const bonus = 100 * c.mult * c.catches;
    c.score += bonus;
    c.gold += 10 + c.catches * 5;
    c.goldText.textContent = c.gold;
    c.gap = C.startGap;
    c.ziboStun = 0;
    CZ.audio.sfx('win'); CZ.audio.vibrate([30, 20, 60]);
    floatText(t('endless.caught', { n: bonus }), 'gold');
    say('zibo.chase.again');
  }

  function step(dt, now) {
    if (!c.endless) c.timeLeft -= dt; else endlessStep(dt);
    c.frame += dt;
    // Oyuncu hep yaklaşır; sersemlikte durur. Kancadan sonra Zibo bir an kaçar.
    let close = c.stun > 0 ? 0 : c.endless ? C.closeRate * 0.35 : byLevel([C.closeRate, C.closeRate * 0.55]);
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
    c.nextBomb = now + byLevel(C.bombEveryMs) * rand(0.8, 1.2) * (c.boss.bombMul || 1);
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

  function floatText(text, kind) {
    const el = h('div', { class: 'run-float ' + (kind || ''), text });
    c.floats.append(el);
    setTimeout(() => el.remove(), 900);
  }

  function drawHearts() {
    c.hearts.replaceChildren(...Array.from({ length: C.lives }, (_, i) => h('i', { class: 'heart' + (i < c.lives ? '' : ' empty') }, CZ.icon('heart'))));
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
    if (c.revived < 1) return savePrompt();
    endlessScore();
  }
  function savePrompt() {
    let left = 4, done = false;
    const ring = h('b', { class: 'save-count', text: left });
    const go = () => { if (done) return; done = true; clearInterval(tm); box.remove(); endlessScore(); };
    const box = h('div', { class: 'save-me' },
      h('h2', { text: t('endless.saveMe') }), ring,
      btn(t('endless.revive'), () => { if (done) return; done = true; clearInterval(tm); box.remove(); adThen(() => { c.revived += 1; c.lives = 1; drawHearts(); c.continues -= 1; resume(); }); }, 'primary wide', 'ic:play'),
      btn(t('endless.skip'), go, 'small ghost-dark'));
    const tm = setInterval(() => { left -= 1; ring.textContent = left; if (left <= 0) go(); }, 1000);
    c.timers.push(tm);
    c.el.append(box);
  }
  function endlessScore() {
    const d = CZ.state.data;
    const sc = Math.floor(c.score);
    const record = sc > (d.bestRun || 0);
    if (record) d.bestRun = sc;
    d.runs = (d.runs || 0) + 1;
    d.runGold = (d.runGold || 0) + c.gold;
    CZ.state.save();
    if (CZ.quests) CZ.quests.track('chase');
    CZ.progress.addXp(Math.min(40, 5 + Math.floor(sc / 200)));
    let doubled = false;
    const goldP = h('p', { class: 'reward' }, img('ui.gold', 'emerald-icon'), h('b', { text: '+' + c.gold }));
    const sheet = h('div', { class: 'sheet sheet-lose endless-over' },
      h('small', { text: t(record ? 'endless.newBest' : 'endless.over') }),
      h('h2', { class: 'big-score', text: sc }),
      h('p', { text: t('endless.best', { n: d.bestRun || 0 }) + (c.mult > 1 ? '  ·  x' + c.mult : '') }),
      goldP,
      c.gold > 0 ? btn(t('endless.double', { n: c.gold }), e => {
        const b = e.currentTarget;
        if (doubled) return;
        adThen(() => { doubled = true; c.gold *= 2; goldP.querySelector('b').textContent = '+' + c.gold; b.remove(); CZ.audio.sfx('buy'); });
      }, 'ghost-dark wide', 'ic:play') : null,
      h('div', { class: 'sheet-row' },
        btn(t('win.toVillage'), () => CZ.ui.go('hub'), 'ghost-dark wide'),
        btn(t('endless.again'), () => CZ.ui.wipeTo('chase', { endless: true }), 'primary wide')));
    c.el.append(sheet);
    // Subway Surfers gibi: skor görünür görünmez reklam kendiliğinden açılır (her 2 oyunda bir).
    c.timers.push(setTimeout(() => { if (c && c.el.contains(sheet)) CZ.ads.gameOver(); }, 1200));
  }

  function escaped(reason) {
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

  function adThen(done) { c.adTimer = CZ.ads.show(done); }

  function leave() {
    if (!c) return;
    stop();
    if (c.gold) { CZ.state.data.gold = (CZ.state.data.gold || 0) + c.gold; CZ.state.save(); }
    clearInterval(c.adTimer);
    clearTimeout(c.sayTimer);
    c.timers.forEach(clearTimeout);
    if (c.run) c.run.destroy();
    c = null;
  }

  return { render, leave, music: null, get debug() { return c; } };
})();
