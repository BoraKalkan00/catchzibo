// Ana oyun: eşya yığını, kısa dokunma = kaldır, uzun basma = "bu benim".
CZ.screens.play = (function () {
  const { h, img, btn } = CZ.ui;
  const t = CZ.t;
  const cfg = CZ.CONFIG;
  let s = null; // aktif tur

  const rand = (a, b) => a + Math.random() * (b - a);
  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ---------- Yığını kurma ---------- */
  function pickDecoys(round) {
    const lookalikes = Math.round((round.count - 1) * round.share);
    const list = [];
    for (let i = 0; i < lookalikes; i++) list.push(round.similar[i % round.similar.length]);
    const pool = shuffle((s.roomDef.pool || CZ.ALL_ITEMS).filter(id => id !== round.target && !round.similar.includes(id)));
    while (list.length < round.count - 1) list.push(pool.pop());
    return shuffle(list);
  }

  // Eğitimde yerler sabit: hedefin üstünde tam iki eşya olur.
  function tutorialPile(round) {
    const [left, right, coverA, coverB] = ['mitten_blue', 'cane_green', 'stocking_green', 'stocking_red_striped'];
    return [
      { id: left, x: 0.22, y: 0.5, r: -14 },
      { id: right, x: 0.8, y: 0.84, r: 12 },
      { id: round.target, x: 0.5, y: 0.66, r: 0, target: true },
      { id: coverA, x: 0.42, y: 0.6, r: -10, cover: true },
      { id: coverB, x: 0.59, y: 0.71, r: 14, cover: true }
    ].map(o => Object.assign({ s: 1 }, o));
  }

  // Yığın merkezlerini birbirinden uzak seçer: hepsi ayrı ayrı "burada bir şey var" gibi görünsün.
  function heapCenters(count) {
    const box = s.room.getBoundingClientRect();
    const minGap = s.itemPx * 1.7;
    const centers = [];
    for (let tries = 0; centers.length < count && tries < 400; tries++) {
      const c = { x: rand(0.24, 0.76), y: rand(0.48, 0.84) };
      const ok = centers.every(o => Math.hypot((o.x - c.x) * box.width, (o.y - c.y) * box.height) >= minGap);
      if (ok || tries > 300) centers.push(c);
    }
    return centers;
  }

  // Odanın saklanma noktalarını (görsel koordinatı) ekrandaki oda koordinatına çevirir.
  // Görsel "cover" ile sığdığı için kenarlar kırpılabilir: görünmeyen ve Zibo'nun köşesindeki noktalar atılır.
  function sceneSpots() {
    const def = s.roomDef.spots;
    if (!def) return null;
    const box = s.room.getBoundingClientRect();
    const [artW, artH] = s.roomDef.fx.size;
    const k = artW / def.src[0];
    const scale = Math.max(box.width / artW, box.height / artH);
    const left = (box.width - artW * scale) / 2;
    const top = (box.height - artH * scale) / 2;
    const list = def.list.map(([x, y, sc]) => ({ x: (left + x * k * scale) / box.width, y: (top + y * k * scale) / box.height, s: sc }))
      .filter(p => p.x > 0.08 && p.x < 0.92 && p.y > 0.2 && p.y < 0.95 && !(p.x > 0.6 && p.y < 0.3));
    return list.length >= 6 ? list : null;
  }

  // Sahneye saklama: yığınlar ve tek eşyalar odanın gerçek yerlerine (raf, ağaç dibi, koltuk...) dağılır.
  function scenePile(round, spots) {
    const decoys = pickDecoys(round);
    const heaps = Math.max(1, Math.min(round.heaps || 1, 4));
    const spreadK = round.spread === undefined ? 0.55 : round.spread;
    const box = s.room.getBoundingClientRect();
    const baitIds = [];
    for (let i = 1; i < heaps; i++) {
      let at = decoys.findIndex(id => round.similar.includes(id));
      if (at < 0) at = 0;
      baitIds.push(decoys.splice(at, 1)[0]);
    }
    // Yığın yerleri: birbirinden uzak noktalar (önce büyük/yakın noktalar, orada yığın daha okunur).
    const pool = shuffle(spots.slice());
    const centers = [];
    const minGap = s.itemPx * 1.4;
    pool.slice().sort((a, b) => b.s - a.s + rand(-0.3, 0.3)).forEach(p => {
      if (centers.length < heaps && centers.every(c => Math.hypot((c.x - p.x) * box.width, (c.y - p.y) * box.height) >= minGap)) centers.push(p);
    });
    while (centers.length < heaps) centers.push(pool[centers.length % pool.length]);
    const rest = pool.filter(p => !centers.includes(p));
    const n = decoys.length;
    const coverCount = Math.min(n, Math.max(3 * heaps, Math.floor(n * 0.6)));
    const covers = [];
    for (let i = 0; i < coverCount; i++) {
      const c = centers[i % heaps];
      const sx = s.itemPx * spreadK * c.s / box.width, sy = s.itemPx * spreadK * c.s / box.height;
      covers.push({ x: c.x + rand(-sx, sx), y: c.y + rand(-sy, sy), s: c.s });
    }
    // Kalanlar diğer noktalara: nokta yetmezse aynı noktaya küçük kümeler olur.
    const singles = [];
    for (let i = 0; i < n - coverCount; i++) {
      const p = rest.length ? rest[i % rest.length] : pool[i % pool.length];
      const j = s.itemPx * 0.35 * p.s;
      singles.push({ x: p.x + rand(-j, j) / box.width, y: p.y + rand(-j, j) / box.height, s: p.s });
    }
    const wrap = (id, spot) => ({ id, x: spot.x, y: spot.y, r: rand(-24, 24), s: rand(0.92, 1.08) * spot.s });
    const mixed = shuffle(decoys.map((id, i) => wrap(id, i < coverCount ? covers[i] : singles[i - coverCount])));
    const t0 = centers[0];
    const target = { id: round.target, x: t0.x, y: t0.y, r: rand(-12, 12), s: t0.s, target: true };
    const baits = baitIds.map((id, i) => ({ id, x: centers[i + 1].x, y: centers[i + 1].y, r: rand(-12, 12), s: centers[i + 1].s, bait: true }));
    // Uzaktaki (küçük) eşyalar arkada çizilir; yığın sırası korunur: önce dipler, sonra örtücüler.
    const bottoms = shuffle([target].concat(baits));
    const lone = mixed.filter(o => !covers.some(c => c.x === o.x && c.y === o.y)).sort((a, b) => a.y - b.y);
    const coverItems = mixed.filter(o => !lone.includes(o));
    return lone.concat(bottoms, coverItems);
  }

  // Zorluğun kalbi: odada birden çok yığın olur. Biri gerçek (altında hedef), diğerleri tuzak
  // (altında hedefe benzeyen bir eşya). Oyuncu yığına bakarak hedefin yerini tahmin edemez.
  function randomPile(round) {
    const decoys = pickDecoys(round);
    const heaps = Math.max(1, round.heaps || 1);
    const spreadK = round.spread === undefined ? 0.55 : round.spread;

    // Tuzak yığınların dibine konacak "yem" eşyalar: mümkünse benzerlerden.
    const baitIds = [];
    for (let i = 1; i < heaps; i++) {
      let at = decoys.findIndex(id => round.similar.includes(id));
      if (at < 0) at = 0;
      baitIds.push(decoys.splice(at, 1)[0]);
    }

    const n = decoys.length;
    const below = Math.floor(n * 0.1);
    const perHeap = Math.max(3, Math.min(Math.floor((n - below) * 0.7 / heaps), 3 + Math.floor((n + baitIds.length) / (heaps > 1 ? 8 : 6))));
    const coverCount = Math.min(n - below, perHeap * heaps);
    const centers = heapCenters(heaps);
    const tx = centers[0].x;
    const ty = centers[0].y;

    // Odanın tamamına yayılır: üstte yalnız Zibo'nun köşesi boş kalır.
    const spots = [];
    const free = n - coverCount;
    const cols = free > 16 ? 5 : 4;
    const rows = Math.max(1, Math.ceil(free / cols));
    const cells = shuffle(Array.from({ length: cols * rows }, (_, i) => i));
    for (let i = 0; i < free; i++) {
      const col = cells[i] % cols;
      const row = Math.floor(cells[i] / cols);
      spots.push({
        x: 0.11 + (col + rand(0.1, 0.9)) / cols * 0.78,
        y: 0.34 + (row + rand(0.1, 0.9)) / rows * 0.6
      });
    }
    // Örtücüler her yığının merkezine dağılır. spread küçüldükçe dipteki eşya daha çok gömülür.
    const box = s.room.getBoundingClientRect();
    const spreadX = s.itemPx * spreadK / box.width;
    const spreadY = s.itemPx * spreadK / box.height;
    const covers = [];
    for (let i = 0; i < coverCount; i++) {
      const c = centers[i % heaps];
      covers.push({ x: c.x + rand(-spreadX, spreadX), y: c.y + rand(-spreadY, spreadY) });
    }

    const wrap = (id, spot) => ({ id, x: spot.x, y: spot.y, r: rand(-26, 26), s: rand(0.92, 1.1) });
    const under = decoys.slice(0, below).map((id, i) => wrap(id, spots[i]));
    const mixed = shuffle(decoys.slice(below).map((id, i) => {
      const isCover = i < coverCount;
      return wrap(id, isCover ? covers[i] : spots[below + i - coverCount]);
    }));
    const target = { id: round.target, x: tx, y: ty, r: rand(-12, 12), s: 1, target: true };
    const baits = baitIds.map((id, i) => ({ id, x: centers[i + 1].x, y: centers[i + 1].y, r: rand(-12, 12), s: 1, bait: true }));
    return under.concat(shuffle([target].concat(baits)), mixed);
  }

  function sizeItems() {
    const box = s.room.getBoundingClientRect();
    if (!box.width) return;
    const n = s.round.count;
    const crowd = n > 30 ? 0.68 : n > 24 ? 0.72 : n > 18 ? 0.78 : n > 10 ? 0.86 : 1;
    s.itemPx = Math.min(box.width * 0.31, box.height * 0.2) * crowd;
    s.room.style.setProperty('--item', s.itemPx + 'px');
    // Görsel odaya "cover" sığar: canlı katman da aynı ölçüye oturur.
    const [artW, artH] = s.roomDef.fx.size;
    const scale = Math.max(box.width / artW, box.height / artH);
    s.art.style.width = artW * scale + 'px';
    s.art.style.height = artH * scale + 'px';
    s.art.style.left = (box.width - artW * scale) / 2 + 'px';
    s.art.style.top = (box.height - artH * scale) / 2 + 'px';
  }

  function roomFx() {
    const fx = s.roomDef.fx;
    const [artW, artH] = fx.size;
    const pct = (x, y, w, h) => `left:${x / artW * 100}%;top:${y / artH * 100}%;` + (w ? `width:${w / artW * 100}%;height:${h / artH * 100}%;` : '');
    const parts = [];
    if (fx.fire) {
      const flame = img('scene.flame', 'fx-flame');
      flame.style.cssText = pct(fx.fire.x, fx.fire.y, fx.fire.w, fx.fire.h);
      parts.push(flame);
    }
    if (fx.snow) {
      const flakes = [];
      for (let i = 0; i < 12; i++) {
        flakes.push(h('i', { style: `left:${rand(0, 100)}%;width:${rand(2, 5)}px;height:${rand(2, 5)}px;animation-duration:${rand(3.5, 7)}s;animation-delay:-${rand(0, 7)}s` }));
      }
      const box = h('div', { class: 'fx-snow' }, flakes);
      box.style.cssText = pct(fx.snow.x, fx.snow.y, fx.snow.w, fx.snow.h);
      parts.push(box);
    }
    fx.lights.forEach(([x, y, color]) => {
      const dot = h('i', { class: 'fx-light' });
      dot.style.cssText = pct(x, y) + `background:${color};box-shadow:0 0 9px 3px ${color};animation-duration:${rand(1.1, 2.4)}s;animation-delay:-${rand(0, 2)}s`;
      parts.push(dot);
    });
    return parts;
  }

  function drawPile(plan) {
    // Hiçbir eşya ekrandan taşmasın: yarı boyu kadar kenardan içeride kalır.
    const rb = s.room.getBoundingClientRect();
    if (rb.width) plan.forEach(o => {
      const hx = (s.itemPx * (o.s || 1) * 0.55) / rb.width + 0.01, hy = (s.itemPx * (o.s || 1) * 0.55) / rb.height + 0.01;
      o.x = Math.min(1 - hx, Math.max(hx, o.x));
      o.y = Math.min(1 - hy, Math.max(Math.max(hy, 0.16), o.y));
    });
    s.items = plan.map((o, z) => {
      const el = img('item.' + o.id, 'pile-item');
      el.style.cssText = `left:${o.x * 100}%;top:${o.y * 100}%;z-index:${z + 1};--r:${o.r}deg;--s:${o.s}`;
      s.pile.append(el);
      return Object.assign({ el }, o);
    });
  }

  /* ---------- Dokunma ---------- */
  function pointAt(e) {
    const box = s.room.getBoundingClientRect();
    return { x: e.clientX - box.left, y: e.clientY - box.top, w: box.width, h: box.height };
  }

  function hitTest(p) {
    for (let i = s.items.length - 1; i >= 0; i--) {
      const it = s.items[i];
      const radius = s.itemPx * it.s * 0.47;
      const dx = p.x - it.x * p.w;
      const dy = p.y - it.y * p.h;
      if (dx * dx + dy * dy <= radius * radius) return it;
    }
    return null;
  }

  function onDown(e) {
    if (!s.running || s.press) return;
    if (pokeZibo(e)) return;
    const p = pointAt(e);
    const item = hitTest(p);
    if (!item) return;
    e.preventDefault();
    try { s.room.setPointerCapture(e.pointerId); } catch (err) { /* sentetik dokunuş */ }
    item.el.classList.add('pressed');
    item.el.style.setProperty('--hold', cfg.holdMs + 'ms');
    // Halka eşyanın çevresinde durur: parmak ortayı kapatsa da kenarı görünür.
    s.ring.style.left = item.x * p.w + 'px';
    s.ring.style.top = item.y * p.h + 'px';
    s.ring.style.setProperty('--hold', cfg.holdMs + 'ms');
    s.ring.classList.add('show');
    s.press = {
      id: e.pointerId, item, x: e.clientX, y: e.clientY,
      stopCharge: CZ.audio.charge(cfg.holdMs),
      buzz: [
        setTimeout(() => CZ.audio.vibrate(6), cfg.holdMs * 0.4),
        setTimeout(() => CZ.audio.vibrate(10), cfg.holdMs * 0.75)
      ],
      timer: setTimeout(() => {
        const held = s.press.item;
        endPress();
        claim(held);
      }, cfg.holdMs)
    };
  }

  function endPress() {
    if (!s.press) return;
    clearTimeout(s.press.timer);
    s.press.buzz.forEach(clearTimeout);
    s.press.stopCharge();
    s.press.item.el.classList.remove('pressed');
    s.ring.classList.remove('show');
    s.press = null;
  }

  function onMove(e) {
    if (!s.press || e.pointerId !== s.press.id) return;
    if (Math.hypot(e.clientX - s.press.x, e.clientY - s.press.y) > cfg.moveCancelPx) endPress();
  }

  function onUp(e) {
    if (!s.press || e.pointerId !== s.press.id) return;
    const item = s.press.item;
    endPress();
    if (s.running) lift(item);
  }

  function onCancel(e) {
    if (s.press && e.pointerId === s.press.id) endPress();
  }

  /* ---------- Hamleler ---------- */
  function later(fn, ms) {
    const id = setTimeout(fn, ms);
    s.timers.push(id);
    return id;
  }

  const baseTransform = it => `translate(-50%, -50%) rotate(${it.r}deg) scale(${it.s})`;

  // Eşya elle kaldırılmış gibi kalkar, kavisle yana savrulur, aşağı düşer.
  function fling(it, force) {
    const box = s.room.getBoundingClientRect();
    const side = it.x === 0.5 ? (Math.random() < 0.5 ? -1 : 1) : Math.sign(it.x - 0.5);
    const dx = side * rand(0.45, 0.8) * box.width * force;
    const up = rand(50, 110) * force;
    const down = rand(0.5, 0.9) * box.height;
    const spin = side * rand(120, 280);
    it.el.style.zIndex = 88;
    const anim = it.el.animate([
      { transform: baseTransform(it) },
      { transform: `translate(calc(-50% + ${dx * 0.4}px), calc(-50% - ${up}px)) rotate(${it.r + spin * 0.4}deg) scale(${it.s * 1.14})`, offset: 0.38, easing: 'cubic-bezier(.5, 0, .9, .6)' },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${down}px)) rotate(${it.r + spin}deg) scale(${it.s * 0.95})` }
    ], { duration: 560, easing: 'cubic-bezier(.15, .7, .4, 1)', fill: 'forwards' });
    anim.onfinish = () => it.el.remove();
  }

  function puff(it) {
    for (let i = 0; i < 6; i++) {
      const a = Math.random() * Math.PI * 2;
      const bit = h('i', { class: 'puff' });
      bit.style.cssText = `left:${it.x * 100}%;top:${it.y * 100}%;--dx:${Math.cos(a) * rand(26, 58)}px;--dy:${Math.sin(a) * rand(18, 46)}px;--z:${rand(0.7, 1.5)}`;
      s.room.append(bit);
      setTimeout(() => bit.remove(), 420);
    }
  }

  // Altındaki ve yanındaki eşyalar sarsılır: yığın "gerçek" gibi hissedilir.
  function jiggleNeighbours(it) {
    const box = s.room.getBoundingClientRect();
    let moved = 0;
    for (let i = s.items.length - 1; i >= 0 && moved < 6; i--) {
      const other = s.items[i];
      const dist = Math.hypot((other.x - it.x) * box.width, (other.y - it.y) * box.height);
      if (dist > s.itemPx * 1.05) continue;
      moved += 1;
      const tilt = rand(3, 7) * (i % 2 ? 1 : -1);
      other.el.animate([
        { transform: baseTransform(other) },
        { transform: `translate(-50%, calc(-50% - 5px)) rotate(${other.r + tilt}deg) scale(${other.s * 1.03})` },
        { transform: baseTransform(other) }
      ], { duration: 240, easing: 'ease-out' });
    }
  }

  function removeItem(item) {
    s.items.splice(s.items.indexOf(item), 1);
    fling(item, 1);
    puff(item);
    jiggleNeighbours(item);
  }

  // Art arda hızlı kaldırış: küçük "x3" yazısı, sesle aynı anda yükselir.
  function comboPop(item) {
    if (s.combo < 2) return;
    const bit = h('b', { class: 'combo-pop', text: 'x' + (s.combo + 1) });
    bit.style.left = item.x * 100 + '%';
    bit.style.top = item.y * 100 + '%';
    bit.style.fontSize = Math.min(38, 20 + s.combo * 2) + 'px';
    s.room.append(bit);
    setTimeout(() => bit.remove(), 620);
  }

  function roomShake(kind) {
    s.room.classList.remove('shake-soft', 'shake-hard');
    void s.room.offsetWidth;
    s.room.classList.add('shake-' + kind);
  }

  function flash(color) {
    const el = h('i', { class: 'flash-layer' });
    el.style.background = color;
    s.room.append(el);
    setTimeout(() => el.remove(), 420);
  }

  function lift(item) {
    if (item.target) {
      if (s.tutorial) {
        shake(item);
        return tutorialWarn(t('tut.wrongLift'));
      }
      item.el.classList.add('wrong-lift');
      return lose('lifted');
    }
    // Art arda hızlı kaldırışta nota basamak basamak yükselir.
    const now = performance.now();
    s.combo = now - s.lastLift < 900 ? s.combo + 1 : 0;
    s.lastLift = now;
    CZ.audio.sfx('lift', s.combo);
    CZ.audio.vibrate(8);
    removeItem(item);
    s.lifts += 1;
    comboPop(item);
    if (s.lifts === 3 && s.firstReal) {
      s.hintEl.classList.remove('coach');
      s.hintEl.textContent = t('play.howto');
    }
    if (s.tutorial) {
      clearTimeout(s.hintTimer);
      s.zibo.hop();
      return tutorialStep();
    }
    reactToLift();
  }

  // Zibo hedefe yaklaşıldığını bilir: rahatlığı gider, terlemeye başlar.
  function reactToLift() {
    const left = coveringCount();
    if (left === 0 && s.alarm < 2) {
      s.alarm = 2;
      s.zibo.mood('nervous', 'tremble');
      s.zibo.say(CZ.game.pickLine('exposed'));
      return;
    }
    if (left <= 1 && s.alarm < 1) {
      s.alarm = 1;
      s.zibo.mood('nervous');
      s.zibo.say(CZ.game.pickLine('nervous'));
      return;
    }
    s.zibo.hop();
    if (!s.alarm && s.lifts % 4 === 2 && !s.zibo.speaking()) s.zibo.say(CZ.game.pickLine('lift'), 'mad');
  }

  // Zibo'yu dürtmek serbest: oyunu etkilemez, yalnızca sinirini bozar.
  function pokeZibo(e) {
    const box = s.zibo.sprite.getBoundingClientRect();
    if (e.clientX < box.left || e.clientX > box.right || e.clientY < box.top || e.clientY > box.bottom) return false;
    s.pokes += 1;
    CZ.audio.sfx('poke');
    CZ.audio.vibrate(15);
    s.zibo.say(CZ.game.pickLine('poke'), 'mad');
    return true;
  }

  function claim(item) {
    if (item.target) return win(item);
    shake(item);
    if (s.tutorial) return tutorialWarn(t('tut.wrongHold'));
    // Yanlış eşya: tur bitmez, süre gider ve Zibo güler (eskiden anında kaybettiriyordu).
    s.timeLeft = Math.max(0.1, s.timeLeft - cfg.wrongPenalty);
    CZ.audio.sfx('wrong');
    CZ.audio.vibrate([40, 30, 40]);
    s.zibo.say(CZ.game.pickLine('wrong'), 'laugh');
    const tag = h('div', { class: 'penalty-pop', text: t('play.penalty', { n: cfg.wrongPenalty }) });
    tag.style.left = item.x * 100 + '%';
    tag.style.top = item.y * 100 + '%';
    s.room.append(tag);
    later(() => tag.remove(), 1000);
  }

  // Hedefin üstünde kaç eşya kaldı? Kaybedince "az kalmıştı" hissi için.
  function coveringCount() {
    const target = s.items.find(it => it.target);
    const index = s.items.indexOf(target);
    const box = s.room.getBoundingClientRect();
    return s.items.slice(index + 1).filter(it =>
      Math.hypot((it.x - target.x) * box.width, (it.y - target.y) * box.height) < s.itemPx * 0.85).length;
  }

  function loseDetail(reason) {
    const yours = h('figure', { class: 'good' }, img('item.' + s.round.target), h('figcaption', { text: t('lose.yours') }));
    if (reason === 'wrong') {
      return h('div', { class: 'lose-compare' },
        h('figure', { class: 'bad' }, img('item.' + s.wrongId), h('figcaption', { text: t('lose.youClaimed') })), yours);
    }
    if (reason === 'lifted') return h('p', { text: t('lose.liftedInfo') });
    const left = coveringCount();
    if (!left) return h('p', { text: t('lose.inSight') });
    return h('p', { text: t(left <= 3 ? 'lose.covering' : 'lose.coveringMany', { n: left }) });
  }

  function shake(item) {
    item.el.classList.remove('shake');
    void item.el.offsetWidth;
    item.el.classList.add('shake');
    setTimeout(() => item.el.classList.remove('shake'), 420);
  }

  // Eğitimde uyarı biraz görünür, sonra sıradaki adımın yönergesi geri gelir.
  function tutorialWarn(text) {
    hint(text);
    clearTimeout(s.hintTimer);
    s.hintTimer = setTimeout(() => { if (s && s.running) tutorialStep(); }, 3500);
  }

  /* ---------- Süre ---------- */
  function tick() {
    const now = performance.now();
    const dt = Math.min(now - s.last, 400) / 1000;
    s.last = now;
    if (!s.running || s.tutorial || document.hidden) return;
    const before = Math.ceil(s.timeLeft);
    s.timeLeft -= dt;
    s.tauntIn -= dt;
    drawTime();
    const shown = Math.ceil(s.timeLeft);
    if (shown !== before) {
      if (shown <= 10) {
        s.clock.classList.remove('beat');
        void s.clock.offsetWidth;
        s.clock.classList.add('beat');
      }
      if (shown === 10) {
        s.zibo.say('zibo.tick', 'laugh');
        CZ.audio.setTempo(1.25);
      }
      if (shown === 5) {
        if (!s.alarm) s.zibo.mood('smug', 'dance');
        CZ.audio.setTempo(1.45);
      }
      if (shown <= 10 && shown > 5) CZ.audio.sfx('tick');
      if (shown <= 5 && shown > 0) {
        CZ.audio.sfx('heart');
        CZ.audio.vibrate(Math.round(25 * s.buzz));
      }
    }
    if (s.tauntIn <= 0 && s.timeLeft > 11 && !s.zibo.speaking()) {
      s.tauntIn = cfg.tauntEverySeconds;
      if (!s.alarm) s.zibo.say(CZ.game.pickLine('taunt'), 'smug');
    }
    if (s.timeLeft <= 0) {
      s.timeLeft = 0;
      drawTime();
      lose('time');
    }
  }

  function drawTime() {
    s.clock.textContent = Math.ceil(s.timeLeft);
    s.clock.classList.toggle('danger', s.timeLeft <= 10);
    s.bar.style.width = Math.min(100, s.timeLeft / s.total * 100) + '%';
    s.bar.classList.toggle('danger', s.timeLeft <= 10);
    if (s.tutorial) return;
    s.danger.classList.toggle('show', s.timeLeft <= 10 && s.timeLeft > 0);
    s.danger.classList.toggle('fast', s.timeLeft <= 5);
  }

  /* ---------- Bitiş ---------- */
  function win(item) {
    // İlk buluşta Zibo eşyayı kapıp kaçar: kovalamaca başlar.
    const C = CZ.CHASE;
    if (!s.tutorial && C && C.enabled && (!C.onlyFirstFind || !CZ.state.isFound(s.round.id))) return snatch(item);
    s.running = false;
    const stars = s.tutorial ? 3 : CZ.game.starsFor(s.timeLeft, s.continues, s.total);
    const seconds = s.total - s.timeLeft;
    const before = CZ.state.round(s.round.id);
    const reward = CZ.game.reward(s.round.id, s.tutorial ? s.total : s.timeLeft, stars);
    s.result = { stars, seconds, newRecord: !!before.found && (before.best === undefined || seconds < before.best) };
    CZ.state.markFound(s.round.id, reward, stars, seconds);
    if (s.tutorial) {
      CZ.state.data.tutorialDone = true;
      CZ.state.save();
    }
    CZ.audio.vibrate([40, 30, 40, 30, 160]);
    CZ.audio.music(null);
    CZ.audio.sfx('win');
    s.hand.classList.remove('show');
    s.zibo.lock('tantrum', 'stomp');
    s.zibo.say(s.tutorial ? 'zibo.mine' : CZ.game.pickLine('found'));

    // 1) Bir an her şey durur, ekran parlar.
    flash('rgba(255, 255, 255, .85)');
    roomShake('hard');
    item.el.style.zIndex = 95;
    // 2) Kalan yığın patlar, eşya ortaya süzülür, "BU BENİM!" damgası iner.
    later(() => {
      s.items.filter(it => it !== item).forEach(it => fling(it, 1.5));
      s.rays.classList.add('show');
      item.el.classList.add('found');
      s.mine.classList.add('show');
      confetti();
    }, 110);
    // 3) Zümrütler sayaca uçar.
    later(() => flyEmeralds(reward), 750);
    // 4) Sonuç penceresi.
    later(() => showWin(reward), 1650);
  }

  function snatch(item) {
    s.running = false;
    endPress();
    const stars = CZ.game.starsFor(s.timeLeft, s.continues, s.total);
    const params = { roundId: s.round.id, stars, seconds: s.total - s.timeLeft, secondsLeft: s.timeLeft };
    CZ.audio.music(null);
    CZ.audio.sfx('win');
    CZ.audio.vibrate([40, 30, 80]);
    flash('rgba(255, 255, 255, .85)');
    roomShake('soft');
    item.el.style.zIndex = 95;
    item.el.classList.add('found');
    s.mine.classList.add('show');
    // Tam sevinirken Zibo atlar, eşyayı kapar.
    later(() => {
      s.mine.classList.remove('show');
      s.zibo.lock('laugh', 'dance');
      s.zibo.say('zibo.snatch');
      CZ.audio.sfx('poke');
      const room = s.room.getBoundingClientRect();
      const from = item.el.getBoundingClientRect();
      const to = s.zibo.sprite.getBoundingClientRect();
      const dx = to.left + to.width / 2 - (from.left + from.width / 2);
      const dy = to.top + to.height * 0.4 - (from.top + from.height / 2);
      item.el.classList.remove('found');
      item.el.animate([
        { transform: `${baseTransform(item)} scale(1.6)` },
        { transform: `translate(calc(-50% + ${dx * 0.5}px), calc(-50% + ${dy * 0.5 - 80}px)) scale(1.1) rotate(200deg)`, offset: 0.5 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.5) rotate(400deg)` }
      ], { duration: 520, easing: 'ease-in', fill: 'forwards' });
      void room;
    }, 700);
    later(() => {
      s.zibo.el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(140%)' }], { duration: 380, easing: 'ease-in', fill: 'forwards' });
      CZ.audio.sfx('throw');
    }, 1700);
    later(() => CZ.ui.wipeTo('chase', params), 2150);
  }

  function confetti() {
    const colors = ['#ffd95e', '#7df08a', '#ff6b6b', '#6fc3ff', '#ffffff', '#d68bff'];
    const box = s.room.getBoundingClientRect();
    for (let i = 0; i < 34; i++) {
      const bit = h('i', { class: 'confetti' });
      const w = rand(6, 11);
      bit.style.cssText = `background:${colors[i % colors.length]};width:${w}px;height:${w * rand(0.5, 1.6)}px;left:50%;top:31%;`;
      s.room.append(bit);
      const dx = rand(-0.55, 0.55) * box.width;
      const up = rand(70, 240);
      const anim = bit.animate([
        { transform: 'translate(0, 0) rotate(0deg)' },
        { transform: `translate(${dx * 0.7}px, ${-up}px) rotate(${rand(120, 360)}deg)`, offset: 0.3, easing: 'ease-in' },
        { transform: `translate(${dx}px, ${box.height * 0.8}px) rotate(${rand(500, 1100)}deg)` }
      ], { duration: rand(1300, 2100), easing: 'ease-out', fill: 'forwards' });
      anim.onfinish = () => bit.remove();
    }
  }

  function flyEmeralds(reward) {
    const room = s.room.getBoundingClientRect();
    const to = s.purse.getBoundingClientRect();
    const toX = to.left + 20 - room.left - room.width * 0.5;
    const toY = to.top + to.height / 2 - room.top - room.height * 0.31;
    const count = Math.min(10, reward);
    const start = CZ.state.data.emeralds - reward;
    for (let i = 0; i < count; i++) {
      const bit = img('ui.emerald', 'fly-emerald');
      s.room.append(bit);
      const spreadX = rand(-90, 90);
      const spreadY = rand(-70, 50);
      const anim = bit.animate([
        { transform: 'translate(0, 0) scale(.4)' },
        { transform: `translate(${spreadX}px, ${spreadY}px) scale(1.15)`, offset: 0.35, easing: 'cubic-bezier(.6, 0, .9, .5)' },
        { transform: `translate(${toX}px, ${toY}px) scale(.8)` }
      ], { duration: 620, delay: i * 45, fill: 'both' });
      anim.onfinish = () => {
        bit.remove();
        if (!s) return;
        const shown = Math.round(start + reward * (i + 1) / count);
        s.purseCount.textContent = shown;
        s.purse.classList.remove('bump');
        void s.purse.offsetWidth;
        s.purse.classList.add('bump');
        CZ.audio.sfx('coin', i);
        CZ.audio.vibrate(6);
      };
    }
  }

  function showWin(reward) {
    const next = CZ.game.nextOpen();
    const actions = next
        ? [btn(t('win.next'), () => CZ.ui.wipeTo('play', { roundId: next.id }), 'primary wide'),
          btn(t('win.toVillage'), () => CZ.ui.go('hub'), 'ghost-dark wide')]
        : [btn(t('win.toVillage'), () => CZ.ui.go('hub'), 'primary wide'),
          btn(t('win.toMansion'), () => CZ.ui.go('mansion'), 'ghost-dark wide')];
    const starRow = h('div', { class: 'star-row' }, [0, 1, 2].map(i => {
      const earned = i < s.result.stars;
      const star = img(earned ? 'ui.star' : 'ui.star_empty', 'star' + (earned ? ' pop' : ''));
      star.style.animationDelay = i * 0.17 + 's';
      if (earned) later(() => CZ.audio.sfx('coin', i * 4), 120 + i * 170);
      return star;
    }));
    // Oda ilk kez tamamen bitince kutlama yazısı (oda başına bir kez).
    const d = CZ.state.data;
    const roomId = s.roomDef.id;
    if (d.roomDoneSeen === true) d.roomDoneSeen = ['living'];
    if (!Array.isArray(d.roomDoneSeen)) d.roomDoneSeen = [];
    const firstClear = CZ.game.roomDone(s.roomDef) && !d.roomDoneSeen.includes(roomId);
    if (firstClear) {
      d.roomDoneSeen.push(roomId);
      CZ.state.save();
    }
    openSheet('win',
      starRow,
      h('h2', { text: t(`item.${s.round.target}.name`) }),
      h('p', { text: firstClear ? t(roomId === 'living' ? 'win.roomDone' : 'win.roomDone.' + roomId) : s.result.newRecord ? t('win.record', { s: CZ.game.formatSeconds(s.result.seconds) }) : t('win.home') }),
      h('p', { class: 'small-note', text: t(`item.${s.round.target}.note`) }),
      firstClear && CZ.ROOM_PRIZES[roomId] ? h('p', { class: 'reward prize' }, '🎁 ', t('win.prize', { item: t('char.' + CZ.ROOM_PRIZES[roomId]) })) : null,
      h('p', { class: 'reward', 'data-fly': 'emeralds', 'data-n': reward }, img('ui.emerald', 'emerald-icon'), t('win.reward', { n: reward })),
      h('div', { class: 'sheet-row' }, actions.slice().reverse()));
  }

  function lose(reason) {
    s.running = false;
    s.reason = reason;
    endPress();
    CZ.audio.music(null);
    CZ.audio.sfx('wrong');
    later(() => CZ.audio.sfx('lose'), 180);
    CZ.audio.vibrate([Math.round(120 * s.buzz), 60, Math.round(200 * s.buzz)]);
    flash('rgba(216, 54, 58, .5)');
    roomShake('hard');
    s.zibo.lock('laugh', 'dance');
    s.zibo.say(CZ.game.pickLine(reason === 'time' ? 'time' : reason));
    const canAd = s.continues < cfg.maxAdContinues;
    s.endTimer = setTimeout(() => openSheet('lose',
      h('h2', { text: t('lose.' + reason) }),
      loseDetail(reason),
      h('p', { class: 'small-note', text: t('lose.sub') }),
      canAd
        ? btn(reason === 'time' ? t('lose.ad', { s: cfg.adContinueSeconds }) : t('lose.adPlain'), showAd, 'primary wide')
        : h('p', { class: 'small-note', text: t('lose.noMoreAds') }),
      btn(t('lose.tomorrow'), () => {
        CZ.state.restUntilTomorrow(s.round.id);
        CZ.ui.go('mansion');
        CZ.ui.toast(t('lose.tomorrowToast'));
      }, canAd ? 'ghost-dark wide' : 'primary wide')), 600);
  }

  // Sahte reklam: gerçek reklam eklenince yalnız bu fonksiyon değişir.
  function showAd() {
    closeSheet();
    let left = cfg.adFakeSeconds;
    const count = h('p', { text: t('ad.wait', { s: left }) });
    const box = h('div', { class: 'fake-ad' },
      h('small', { text: t('ad.label') }),
      img('zibo.laugh', 'fake-ad-zibo'),
      h('h2', { text: t('title.name') }),
      h('p', { text: t('ad.fake') }),
      count);
    s.el.append(box);
    s.adTimer = setInterval(() => {
      left -= 1;
      if (left > 0) {
        count.textContent = t('ad.wait', { s: left });
        return;
      }
      clearInterval(s.adTimer);
      box.remove();
      resumeAfterAd();
    }, 1000);
  }

  function resumeAfterAd() {
    s.continues += 1;
    s.timeLeft = s.reason === 'time' ? cfg.adContinueSeconds : Math.max(s.timeLeft, cfg.adContinueSeconds);
    CZ.audio.setTempo(1);
    s.tauntIn = cfg.tauntEverySeconds;
    s.items.forEach(it => it.el.classList.remove('wrong-lift', 'shake'));
    drawTime();
    s.last = performance.now();
    s.running = true;
    s.alarm = 0;
    CZ.audio.music('play');
    s.zibo.unlock();
    s.zibo.say('zibo.catch', 'smug');
    reactToLift();
  }

  /* ---------- Alt pencere ---------- */
  function openSheet(kind, ...kids) {
    closeSheet();
    s.sheet = h('div', { class: 'sheet sheet-' + kind }, kids);
    s.el.append(s.sheet);
  }
  function closeSheet() {
    if (s.sheet) s.sheet.remove();
    s.sheet = null;
  }

  function askLeave() {
    if (!s.running) return;
    s.running = false;
    endPress();
    openSheet('leave',
      h('p', { text: t(s.tutorial || CZ.state.isFound(s.round.id) ? 'play.leaveFree' : 'play.leave') }),
      btn(t('play.leaveNo'), () => {
        closeSheet();
        s.last = performance.now();
        s.running = true;
      }, 'primary wide'),
      btn(t(s.tutorial ? 'play.leaveYesFree' : 'play.leaveYes'), () => {
        if (!s.tutorial && !CZ.state.isFound(s.round.id)) CZ.state.restUntilTomorrow(s.round.id);
        CZ.ui.go('mansion');
      }, 'ghost-dark wide'));
  }

  /* ---------- Eğitim ---------- */
  function hint(text) {
    s.hintEl.textContent = text;
    s.hintEl.classList.remove('flash');
    void s.hintEl.offsetWidth;
    s.hintEl.classList.add('flash');
  }

  function tutorialStep() {
    const covers = s.items.filter(it => it.cover);
    const target = s.items.find(it => it.target);
    const aim = covers.length ? covers[covers.length - 1] : target;
    s.hand.style.left = aim.x * 100 + '%';
    s.hand.style.top = aim.y * 100 + '%';
    s.hand.className = 'hand show ' + (covers.length ? 'tap' : 'hold');
    if (covers.length) hint(t(covers.length === 2 ? 'tut.lift' : 'tut.lift2'));
    else hint(t('tut.claim'));
  }

  /* ---------- Ekran ---------- */
  function render(el, params) {
    const round = CZ.game.round(params.roundId);
    const tutorial = !!round.tutorial && !CZ.state.data.tutorialDone;
    s = {
      el, round, tutorial, roomDef: CZ.game.roomOf(round.id),
      // Gerçek ilk tur: eğitimden sonra kuralı bir kez daha hatırlat.
      firstReal: round.id === 'r1' && !CZ.state.isFound(round.id),
      items: [], press: null, running: false, sheet: null,
      total: (!tutorial && round.seconds) || cfg.roundSeconds,
      buzz: round.buzz || 1,
      timeLeft: (!tutorial && round.seconds) || cfg.roundSeconds, last: performance.now(),
      continues: 0, lifts: 0, pokes: 0, alarm: 0, combo: 0, lastLift: 0, tauntIn: cfg.tauntEverySeconds, timers: []
    };

    s.targetImg = img('item.' + round.target, 'target-img');
    s.clock = h('div', { class: 'clock', 'aria-label': 'time' });
    s.bar = h('i', {});
    s.pile = h('div', { class: 'pile waiting' });
    s.rays = h('div', { class: 'rays' });
    s.danger = h('i', { class: 'room-danger' });
    s.art = h('div', { class: 'room-art' }, img('scene.' + s.roomDef.scene, 'room-bg'), roomFx());
    s.purseCount = h('span', { text: CZ.state.data.emeralds });
    s.purse = h('div', { class: 'emeralds room-purse' }, img('ui.emerald', 'emerald-icon'), s.purseCount);
    s.zibo = CZ.game.ziboActor();
    s.ring = h('div', { class: 'hold-ring' });
    s.ring.innerHTML = '<svg viewBox="0 0 100 100"><circle class="ring-bg" cx="50" cy="50" r="44"/><circle class="ring-fill" cx="50" cy="50" r="44" pathLength="100"/></svg>';
    s.hand = img('ui.hand', 'hand');
    s.mine = h('div', { class: 'mine-pop', text: t('play.mine') });
    s.hintEl = h('p', { class: 'play-hint' + (tutorial || s.firstReal ? ' coach' : ''), text: s.firstReal ? t('play.reminder') : t('play.howto') });
    s.room = h('div', {
      class: 'room',
      onPointerDown: onDown, onPointerMove: onMove, onPointerUp: onUp, onPointerCancel: onCancel,
      onContextMenu: e => e.preventDefault()
    }, s.art, h('i', { class: 'room-glow' }), s.danger, s.rays, s.pile, s.zibo.el, s.ring, s.hand, s.mine, s.purse);

    el.append(
      h('div', { class: 'play-top' },
        tutorial ? h('div', { class: 'close-spacer' })
          : h('button', { class: 'icon-btn', type: 'button', 'aria-label': t('common.back'), onClick: askLeave, text: '‹' }),
        h('div', { class: 'target-card' },
          s.targetImg,
          h('div', {},
            h('small', { text: t('play.find') }),
            h('strong', { text: t(`item.${round.target}.name`) }))),
        tutorial ? h('div', { class: 'clock tutorial-tag', text: t('play.tutorial') }) : s.clock),
      h('div', { class: 'timebar' + (tutorial ? ' hidden' : '') }, s.bar),
      s.room,
      s.hintEl);

    sizeItems();
    s.resize = new ResizeObserver(sizeItems);
    s.resize.observe(s.room);
    const spots = tutorial ? null : sceneSpots();
    drawPile(tutorial ? tutorialPile(round) : spots ? scenePile(round, spots) : randomPile(round));
    drawTime();
    s.interval = setInterval(tick, 100);
    showIntro();
  }

  // Tur başı: "bunu bul" der, eşya büyükçe görünür, sonra üstteki karta uçar. Süre ondan sonra başlar.
  function showIntro() {
    const pic = img('item.' + s.round.target, 'intro-item');
    const intro = h('div', { class: 'intro', onPointerDown: finish },
      h('small', { text: t(s.tutorial ? 'play.introYours' : 'play.introFind') }),
      pic,
      h('strong', { text: t(`item.${s.round.target}.name`) }),
      h('p', { text: s.firstReal ? t('tut.timer') : t('play.howto') }));
    s.el.append(intro);
    CZ.audio.sfx('intro');
    let done = false;
    s.introTimer = setTimeout(finish, s.tutorial ? 2200 : 1500);

    function finish() {
      if (done || !s) return;
      done = true;
      clearTimeout(s.introTimer);
      const from = pic.getBoundingClientRect();
      const to = s.targetImg.getBoundingClientRect();
      intro.classList.add('out');
      pic.style.transition = 'transform .32s cubic-bezier(.5, 0, .3, 1)';
      pic.style.transform = `translate(${to.left + to.width / 2 - from.left - from.width / 2}px, ${to.top + to.height / 2 - from.top - from.height / 2}px) scale(${to.width / from.width})`;
      s.introTimer = setTimeout(() => {
        intro.remove();
        start();
      }, 330);
    }
  }

  // Zibo yığını odaya boşaltır: eşyalar yukarıdan düşüp yerine oturur.
  function dropPile() {
    s.pile.classList.remove('waiting');
    s.items.forEach((it, i) => {
      it.el.animate([
        { transform: `translate(-50%, calc(-50% - ${rand(180, 340)}px)) rotate(${it.r + rand(-60, 60)}deg) scale(${it.s})`, opacity: 0 },
        { transform: `translate(-50%, calc(-50% + 6px)) rotate(${it.r}deg) scale(${it.s * 1.05}, ${it.s * 0.92})`, opacity: 1, offset: 0.78 },
        { transform: baseTransform(it), opacity: 1 }
      ], { duration: 300, delay: i * 11, easing: 'cubic-bezier(.4, 0, .9, .7)', fill: 'backwards' });
    });
  }

  function start() {
    dropPile();
    CZ.audio.sfx('drop');
    CZ.audio.music('play');
    s.last = performance.now();
    s.running = true;
    if (s.tutorial) tutorialStep();
    // Sıcak kakao: altınla alınır, sıradaki aramaya ek süre verir.
    const d = CZ.state.data;
    if (!s.tutorial && d.cocoa > 0 && CZ.GOLD) {
      d.cocoa -= 1;
      CZ.state.save();
      s.timeLeft += CZ.GOLD.cocoa.seconds;
      s.total += CZ.GOLD.cocoa.seconds;
      drawTime();
      CZ.ui.toast(t('play.cocoa', { s: CZ.GOLD.cocoa.seconds }));
    }
    const hello = s.tutorial ? 'zibo.catch' : (CZ.state.isFound(s.round.id) ? 'zibo.hello' : 'zibo.hello.' + s.round.id);
    s.zibo.say(CZ.i18n.keys('en').includes(hello) ? hello : 'zibo.hello', 'smug');
  }

  function leave() {
    if (!s) return;
    clearInterval(s.interval);
    clearInterval(s.adTimer);
    clearTimeout(s.endTimer);
    clearTimeout(s.hintTimer);
    clearTimeout(s.introTimer);
    s.timers.forEach(clearTimeout);
    endPress();
    s.zibo.stop();
    s.resize.disconnect();
    s = null;
  }

  return { render, leave, music: null, get debug() { return s; } };
})();
