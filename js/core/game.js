// Oyun kuralları ve ekranların paylaştığı parçalar.
CZ.game = (function () {
  // Tüm odaların turları tek sırada: bir oda bitince sıradakinin ilk turu açılır.
  const rounds = () => CZ.ROOMS.reduce((all, room) => all.concat(room.rounds), []);
  const isDaily = id => typeof id === 'string' && id.startsWith('d.');
  const round = id => isDaily(id) ? dailyRound(id) : rounds().find(r => r.id === id);
  const roomOf = id => {
    if (isDaily(id)) { const dr = dailyRound(id); return CZ.ROOMS.find(room => room.id === (dr && dr.room)) || CZ.ROOMS[0]; }
    return CZ.ROOMS.find(room => room.rounds.some(r => r.id === id)) || CZ.ROOMS[0];
  };

  /* ---------- GÜNÜN SOYGUNU ----------
     Her gün Zibo bitmiş odalara geri döner ve 3 eşya çalar. Eşyalar ve yerleri tarihten üretilir:
     herkes aynı gün aynı soygunu görür, ertesi gün yenisi gelir. Sonsuz içerik, ek çizim yok. */
  function seeded(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  const dailyUnlocked = () => foundCount() >= ((CZ.UNLOCK && CZ.UNLOCK.daily) || 3);
  function dailyRounds(day) {
    day = day || CZ.state.today();
    const rooms = CZ.ROOMS.filter(room => room.rounds.some(r => !r.tutorial && CZ.state.isFound(r.id)));
    if (!rooms.length) return [];
    const rnd = seeded('zibo-' + day);
    const out = [];
    const used = new Set();
    for (let k = 0; k < 3; k++) {
      const room = rooms[Math.floor(rnd() * rooms.length)];
      const pool = room.rounds.filter(r => !r.tutorial && !used.has(r.target));
      const base = pool[Math.floor(rnd() * pool.length)] || room.rounds[1];
      used.add(base.target);
      const hard = k === 2 ? 1 : 0;
      out.push(Object.assign({}, base, {
        id: 'd.' + day + '.' + k, daily: true, room: room.id, k,
        count: base.count + 4 + hard * 6,
        heaps: (base.heaps || 2) + hard,
        seconds: Math.max(22, (base.seconds || 30) - k),
        buzz: (base.buzz || 1) + 0.1 * k,
        similar: base.similar.slice().sort(() => rnd() - 0.5)
      }));
    }
    return out;
  }
  function dailyRound(id) {
    const [, day, k] = id.split('.').length === 3 ? id.split('.') : [null, id.slice(2, 12), id.slice(13)];
    return dailyRounds(day)[+k];
  }
  // Bugünün soygunu: sıradaki bulunmamış eşya (yoksa null).
  const dailyNext = () => dailyRounds().find(r => !CZ.state.isFound(r.id)) || null;
  const dailyDone = () => dailyRounds().filter(r => CZ.state.isFound(r.id)).length;
  // Üç eşya bitince seri bir artar; 7. günde büyük sandık.
  function dailyComplete() {
    const d = CZ.state.data;
    const day = CZ.state.today();
    if (d.dailyLast === day) return null;
    d.dailyStreak = d.dailyLast === dateBefore(day) ? (d.dailyStreak || 0) + 1 : 1;
    d.dailyLast = day;
    const big = d.dailyStreak % 7 === 0;
    const prize = big ? { gold: 1500, emeralds: 60 } : { gold: 150 + 50 * Math.min(6, d.dailyStreak), emeralds: 10 };
    d.gold = (d.gold || 0) + prize.gold;
    d.emeralds = (d.emeralds || 0) + prize.emeralds;
    CZ.state.save();
    return Object.assign({ streak: d.dailyStreak, big }, prize);
  }
  function dateBefore(day) {
    const dt = new Date(day + 'T12:00:00');
    dt.setDate(dt.getDate() - 1);
    const p = n => String(n).padStart(2, '0');
    return dt.getFullYear() + '-' + p(dt.getMonth() + 1) + '-' + p(dt.getDate());
  }
  // Seri bugün ya da dün devam ettiyse geçerli; kaçırılan gün seriyi bozar.
  const dailyStreak = () => {
    const d = CZ.state.data;
    const day = CZ.state.today();
    return d.dailyLast === day || d.dailyLast === dateBefore(day) ? (d.dailyStreak || 0) : 0;
  };
  // Kazanma ekranına eklenecek "Günün soygunu tamam!" kutusu (3. eşya bulununca bir kez).
  function dailyPrizeEl(id) {
    if (!isDaily(id) || dailyDone() < 3) return null;
    const prize = dailyComplete();
    if (!prize) return null;
    const { h, img } = CZ.ui;
    CZ.audio.sfx('win');
    return h('div', { class: 'daily-prize' + (prize.big ? ' big' : '') },
      h('strong', { text: '🔥 ' + CZ.t('heist.streak', { n: prize.streak }) }),
      h('span', { text: CZ.t(prize.big ? 'heist.bigChest' : 'heist.done') }),
      h('p', { class: 'reward' }, img('ui.gold', 'emerald-icon'), '+' + prize.gold, ' ', img('ui.emerald', 'emerald-icon'), '+' + prize.emeralds));
  }
  // Bir turdan sonra nereye? Günün soygunundaysan sıradaki günlük eşya.
  const nextAfter = id => isDaily(id) ? dailyNext() : nextOpen();
  const roomDone = room => room.rounds.every(r => CZ.state.isFound(r.id));
  // Oda kilidi: önceki oda tamamen bulunmadan açılmaz.
  // Yılbaşı takvimi açıksa oda tarihinden önce açılmaz.
  const dateLocked = room => !!(CZ.CONFIG.roomDates && room.opens && CZ.state.today() < room.opens);
  const roomOpen = room => {
    const index = CZ.ROOMS.indexOf(room);
    if (dateLocked(room)) return false;
    return index <= 0 || roomDone(CZ.ROOMS[index - 1]);
  };

  // found: bulundu · resting: yarına kaldı · open: oynanabilir · locked: sırası gelmedi
  function status(id) {
    if (CZ.state.isFound(id)) return 'found';
    if (isDaily(id)) return 'open';
    if (CZ.state.isResting(id)) return 'resting';
    const room = roomOf(id);
    if (!roomOpen(room)) return 'locked';
    const list = room.rounds;
    const index = list.findIndex(r => r.id === id);
    const earlierDone = list.slice(0, index).every(r => CZ.state.isFound(r.id) || CZ.state.isResting(r.id));
    return earlierDone ? 'open' : 'locked';
  }

  const nextOpen = () => rounds().find(r => status(r.id) === 'open') || null;
  const foundCount = () => rounds().filter(r => CZ.state.isFound(r.id)).length;

  // Reklamla devam edilen denemede en fazla 1 yıldız: yıldız gerçek ustalık olsun.
  function starsFor(secondsLeft, continues, total) {
    if (continues > 0) return 1;
    const [three, two] = CZ.CONFIG.stars;
    const ratio = secondsLeft / (total || CZ.CONFIG.roundSeconds);
    return ratio >= three ? 3 : ratio >= two ? 2 : 1;
  }

  function reward(id, secondsLeft, stars) {
    const mult = 1 + (CZ.charPerk ? CZ.charPerk('gems') : 0);
    return Math.round(baseReward(id, secondsLeft, stars) * mult) + (isDaily(id) ? 4 : 0);
  }
  function baseReward(id, secondsLeft, stars) {
    if (CZ.state.isFound(id)) {
      const gained = Math.max(0, stars - (CZ.state.round(id).stars || 0));
      return CZ.CONFIG.rewardReplay + gained * CZ.CONFIG.rewardNewStar;
    }
    return CZ.CONFIG.rewardBase + Math.floor(Math.max(0, secondsLeft) / CZ.CONFIG.rewardPerSeconds);
  }

  const totalStars = () => rounds().reduce((sum, r) => sum + (CZ.state.round(r.id).stars || 0), 0);

  // Zibo ana ekranda ne der? Duruma göre.
  function hubLine() {
    const d = CZ.state.data;
    const today = CZ.state.today();
    const back = d.lastVisit && d.lastVisit < today;
    d.lastVisit = today;
    CZ.state.save();
    if (foundCount() === rounds().length) return 'zibo.hub.done';
    if (back) return 'zibo.hub.back';
    if (rounds().some(r => status(r.id) === 'resting')) return 'zibo.hub.resting';
    return foundCount() >= 4 ? 'zibo.hub.worried' : 'zibo.hub.start';
  }

  // Günlük sayfasından paylaşılabilir kare görsel üretir. Olmazsa null döner, yazıyla paylaşılır.
  async function diaryCard(pageText) {
    try {
      await document.fonts.load('600 54px Fredoka');
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1080;
      const c = canvas.getContext('2d');
      c.fillStyle = '#14233c';
      c.fillRect(0, 0, 1080, 1080);
      c.fillStyle = '#fdf3df';
      c.fillRect(70, 70, 940, 780);
      c.fillStyle = '#6fc24a';
      c.fillRect(70, 70, 26, 780);
      c.fillStyle = '#3f8c28';
      c.font = '600 44px Fredoka, sans-serif';
      c.fillText(CZ.t('diary.title'), 140, 160);
      c.fillStyle = '#33211f';
      c.font = 'italic 500 58px Fredoka, sans-serif';
      let y = 270;
      let line = '';
      // Japonca/Korece gibi boşluksuz yazılarda harf harf sar.
      const spaced = pageText.includes(' ');
      const sep = spaced ? ' ' : '';
      (spaced ? pageText.split(' ') : [...pageText]).forEach(word => {
        const test = line ? line + sep + word : word;
        if (c.measureText(test).width > 800) {
          c.fillText(line, 140, y);
          y += 76;
          line = word;
        } else {
          line = test;
        }
      });
      c.fillText(line, 140, y);
      const zibo = new Image();
      zibo.src = CZ.art('zibo.smug');
      await zibo.decode();
      c.drawImage(zibo, 730, 640, 320, 400);
      c.fillStyle = '#a6ee7a';
      c.font = '700 76px Fredoka, sans-serif';
      c.fillText(CZ.t('title.name'), 90, 985);
      const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
      return blob ? new File([blob], 'zibo-diary.png', { type: 'image/png' }) : null;
    } catch (e) {
      return null;
    }
  }

  async function shareDiary(pageText, text) {
    const file = await diaryCard(pageText);
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      return navigator.share({ files: [file], text }).catch(() => {});
    }
    return share(text);
  }

  function share(text) {
    if (navigator.share) {
      return navigator.share({ text }).catch(() => {});
    }
    if (navigator.clipboard) {
      return navigator.clipboard.writeText(text).then(() => CZ.ui.toast(CZ.t('common.copied'))).catch(() => {});
    }
    return Promise.resolve();
  }

  // Oyuncuyu ilk açılışta sıradaki adıma götürür.
  function next() {
    const d = CZ.state.data;
    if (!d.avatar) return CZ.ui.go('avatar');
    if (!d.storySeen) return CZ.ui.go('story');
    if (!d.tutorialDone) return CZ.ui.go('play', { roundId: rounds()[0].id });
    return CZ.ui.go('hub');
  }

  /* ---------- Günlük ---------- */
  function ensureDiary() {
    const d = CZ.state.data;
    const today = CZ.state.today();
    if (d.diary.some(e => e.date === today)) return;
    const dayNumber = Math.floor(new Date(today + 'T12:00:00').getTime() / 86400000);
    d.diary.unshift({ date: today, index: dayNumber % CZ.DIARY_COUNT });
    CZ.state.save();
  }
  const diaryUnread = () => CZ.state.data.diaryRead !== CZ.state.today();

  // Oyunun açılışında tüm Zibo pozlarını hazır et, poz değişirken görüntü titremesin.
  function preloadZibo() {
    ['idle', 'blink', 'smug', 'laugh', 'mad', 'nervous', 'tantrum', 'tongue', 'run1', 'run2', 'dizzy', 'throw', 'sack'].forEach(p => { new Image().src = CZ.art('zibo.' + p); });
  }

  const formatSeconds = n => n.toLocaleString(CZ.i18n.current, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  function formatDate(str) {
    return new Date(str + 'T12:00:00').toLocaleDateString(CZ.i18n.current, { day: 'numeric', month: 'long', year: 'numeric' });
  }

  /* ---------- Zibo'nun konuşması ---------- */
  function gibberish(key) {
    let hash = 0;
    for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    const words = 2 + hash % 3;
    const out = [];
    for (let i = 0; i < words; i++) out.push(CZ.GOBLIN[(hash >>> (i * 4)) % CZ.GOBLIN.length]);
    const text = out.join(' ');
    return text.charAt(0).toUpperCase() + text.slice(1) + '!';
  }

  // Aynı sözü üst üste söylemesin: havuzdan sırayla, karışık çeker.
  const linePools = {};
  function pickLine(pool) {
    if (!linePools[pool] || !linePools[pool].length) {
      const fresh = CZ.ZIBO_LINES[pool].slice().sort(() => Math.random() - 0.5);
      linePools[pool] = fresh;
    }
    return linePools[pool].pop();
  }

  // Zibo: nefes alır, göz kırpar, ruh hali vardır (mood), balonla konuşur.
  function ziboActor() {
    const { h, img } = CZ.ui;
    const sprite = img('zibo.idle', 'zibo-sprite', 'Zibo');
    const goblin = h('em', { class: 'bubble-goblin' });
    const line = h('span', { class: 'bubble-line' });
    const bubble = h('div', { class: 'bubble', role: 'status' }, goblin, line);
    const el = h('div', { class: 'zibo' }, bubble, sprite);
    let hideTimer = null;
    let moodTimer = null;
    let blinkTimer = null;
    let mood = 'idle';
    let shown = 'idle';
    let locked = false;

    function show(name) {
      shown = name;
      sprite.src = CZ.art('zibo.' + name);
    }
    function scheduleBlink() {
      blinkTimer = setTimeout(() => {
        if (shown === 'idle') {
          show('blink');
          setTimeout(() => { if (shown === 'blink') show('idle'); }, 130);
        }
        scheduleBlink();
      }, 1600 + Math.random() * 3200);
    }
    function setAnim(name) {
      el.classList.remove('dance', 'stomp', 'tremble');
      if (name) el.classList.add(name);
    }
    function setMood(name, anim) {
      mood = name;
      setAnim(anim);
      if (!locked) show(name);
    }
    // Son söz: tur bitti, başka poza geçmesin.
    function lock(name, anim) {
      locked = true;
      clearTimeout(moodTimer);
      mood = name;
      show(name);
      setAnim(anim);
    }
    function unlock() {
      locked = false;
      setMood('idle');
    }
    function hop() {
      sprite.animate([
        { transform: 'translateY(0) scale(1, 1)' },
        { transform: 'translateY(0) scale(1.1, .9)', offset: 0.18 },
        { transform: 'translateY(-16px) scale(.95, 1.06)', offset: 0.5 },
        { transform: 'translateY(0) scale(1.08, .93)', offset: 0.82 },
        { transform: 'translateY(0) scale(1, 1)' }
      ], { duration: 320, easing: 'ease-out' });
    }
    function say(key, poseName) {
      const gib = gibberish(key);
      const text = CZ.t(key);
      goblin.textContent = gib;
      line.textContent = text;
      bubble.classList.add('show');
      CZ.audio.speak(gib);
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => bubble.classList.remove('show'), 1800 + text.length * 45);
      if (locked) return;
      hop();
      if (poseName) {
        show(poseName);
        clearTimeout(moodTimer);
        moodTimer = setTimeout(() => { if (!locked) show(mood); }, 1900);
      }
    }
    const speaking = () => bubble.classList.contains('show');
    // Canlılık: Zibo boş durmaz. Arada dil çıkarır, etrafa bakınır, sırıtır, zıplar.
    let fidgetTimer = null;
    function fidget() {
      fidgetTimer = setTimeout(() => {
        if (!locked && mood === 'idle' && shown === 'idle' && !speaking() && !document.hidden) {
          const pick = Math.random();
          if (pick < 0.3) {
            show('laugh');
            sprite.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-6deg)' }, { transform: 'rotate(5deg)' }, { transform: 'rotate(0)' }], { duration: 700 });
            setTimeout(() => { if (!locked && shown === 'laugh') show(mood); }, 950);
          } else if (pick < 0.55) {
            sprite.animate([
              { transform: 'rotate(0) translateX(0)' },
              { transform: 'rotate(-8deg) translateX(-4%)', offset: 0.3 },
              { transform: 'rotate(-8deg) translateX(-4%)', offset: 0.45 },
              { transform: 'rotate(8deg) translateX(4%)', offset: 0.7 },
              { transform: 'rotate(0) translateX(0)' }
            ], { duration: 1400, easing: 'ease-in-out' });
          } else if (pick < 0.68) {
            show('taunt');
            sprite.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.06, .95)' }, { transform: 'scale(1)' }], { duration: 300, iterations: 3 });
            setTimeout(() => { if (!locked && shown === 'taunt') show(mood); }, 1000);
          } else if (pick < 0.8) {
            setAnim('dance');
            setTimeout(() => { if (!locked) setAnim(null); }, 1400);
          } else if (pick < 0.9) {
            show('smug');
            hop();
            setTimeout(() => { if (!locked && shown === 'smug') show(mood); }, 1100);
          } else {
            hop();
            setTimeout(hop, 340);
          }
        }
        fidget();
      }, 2600 + Math.random() * 3000);
    }
    scheduleBlink();
    fidget();
    return {
      el, sprite, say, hop, lock, unlock, speaking, show,
      mood: setMood,
      stop() {
        clearTimeout(hideTimer);
        clearTimeout(moodTimer);
        clearTimeout(blinkTimer);
        clearTimeout(fidgetTimer);
      }
    };
  }

  return { isDaily, dailyRounds, dailyNext, dailyDone, dailyComplete, dailyPrizeEl, dailyStreak, dailyUnlocked, nextAfter, rounds, round, roomOf, roomDone, roomOpen, dateLocked, status, nextOpen, foundCount, reward, starsFor, totalStars, hubLine, share, shareDiary, diaryCard, next, ensureDiary, diaryUnread, formatDate, formatSeconds, gibberish, pickLine, ziboActor, preloadZibo };
})();
