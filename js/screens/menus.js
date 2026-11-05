// Başlık, avatar, merkez, malikane, kitap, günlük, ayarlar.
(function () {
  const { h, img, btn, header, snow, go } = CZ.ui;
  const t = CZ.t;
  const state = CZ.state;
  const game = CZ.game;

  CZ.screens.title = {
    render(el) {
      // Harfler tek tek zıplayarak gelir.
      const letters = [...t('title.name')].map((ch, i) => h('span', {
        class: ch === ' ' ? 'space' : '',
        style: `animation-delay:${0.15 + i * 0.05}s`,
        text: ch === ' ' ? ' ' : ch
      }));
      const zibo = game.ziboActor();
      this.zibo = zibo;
      zibo.el.classList.add('title-actor');
      zibo.el.addEventListener('pointerdown', () => {
        CZ.audio.sfx('poke');
        CZ.audio.vibrate(15);
        zibo.say(game.pickLine('poke'), 'mad');
      });
      el.append(
        h('div', { class: 'hub-bg title-bg' }, img('scene.hub_bg', 'hub-bg-img')),
        snow(),
        h('div', { class: 'title-box' },
          h('h1', { class: 'logo', 'aria-label': t('title.name') }, letters),
          h('p', { class: 'tagline', text: t('title.tag') })),
        zibo.el,
        h('div', { class: 'title-actions' },
          btn(t('title.play'), () => game.next(), 'primary big pulse')));
      this.helloTimer = setTimeout(() => zibo.say('zibo.catch', 'smug'), 1100);
    },
    leave() {
      clearTimeout(this.helloTimer);
      if (this.zibo) this.zibo.stop();
    }
  };

  CZ.screens.avatar = {
    render(el, params) {
      const pick = kind => {
        state.data.avatar = kind;
        state.save();
        if (params.returnTo) go(params.returnTo);
        else game.next();
      };
      const card = kind => h('button', {
        class: 'avatar-card' + (state.data.avatar === kind ? ' selected' : ''),
        type: 'button',
        onClick: () => { CZ.audio.sfx('button'); pick(kind); }
      }, img('char.' + kind + '_front', 'avatar-img'), h('span', { text: t('avatar.' + kind) }));

      el.append(
        snow(),
        h('div', { class: 'avatar-head' },
          h('h1', { text: t('avatar.title') }),
          h('p', { text: t('avatar.sub') })),
        h('div', { class: 'avatar-row' }, card('girl'), card('boy')));
    }
  };

  // Reklam izle → az altın (günde 5 kez). Sayaç her gün sıfırlanır.
  function adRewardBar() {
    const d = state.data;
    const today = state.today();
    if (!d.adGold || d.adGold.day !== today) d.adGold = { day: today, n: 0 };
    const left = CZ.AD_REWARD.perDay - d.adGold.n;
    if (left <= 0 || game.foundCount() < (CZ.UNLOCK.gold || 0)) return null;
    return h('button', {
      class: 'ad-reward', type: 'button',
      onClick: () => CZ.ads.show(() => {
        d.adGold.n += 1;
        d.gold = (d.gold || 0) + CZ.AD_REWARD.gold;
        state.save();
        CZ.audio.sfx('buy');
        CZ.ui.toast(t('hub.adGot', { n: CZ.AD_REWARD.gold }));
        CZ.ui.refresh();
      })
    }, h('span', { class: 'ad-play', text: '▶' }), h('b', { text: t('hub.adReward') }),
      h('span', { class: 'ad-gold' }, '+' + CZ.AD_REWARD.gold, img('ui.gold', 'mini-ico')), h('small', { text: left + '/' + CZ.AD_REWARD.perDay }));
  }

  CZ.screens.hub = {
    render(el) {
      game.ensureDiary();
      const nav = (label, icon, target, dot) => h('button', {
        class: 'nav-btn',
        type: 'button',
        onClick: () => { CZ.audio.sfx('button'); go(target); }
      }, img(icon, 'nav-icon'), h('span', { text: label }), dot ? h('i', { class: 'dot' }) : null);

      const zibo = game.ziboActor();
      this.zibo = zibo;
      zibo.el.classList.add('hub-actor');
      zibo.el.addEventListener('pointerdown', () => {
        CZ.audio.sfx('poke');
        CZ.audio.vibrate(15);
        zibo.say(game.pickLine('poke'), 'mad');
      });
      const line = game.hubLine();
      this.helloTimer = setTimeout(() => zibo.say(line, line === 'zibo.hub.worried' ? 'nervous' : 'smug'), 500);

      const goldFree = CZ.screens.gold.isFree();
      const H = CZ.house.ensure();
      CZ.house.tick();
      const q = CZ.quests.today();
      const houseArt = h('div', { class: 'tile-art house-mini' });
      houseArt.innerHTML = CZ.houseArt.view(H, {});
      // Yeni oyuncu her şeyi birden görmesin: bölümler buldukça açılır.
      const found = game.foundCount();
      const open = key => found >= (CZ.UNLOCK[key] || 0);
      const tile = (cls, art, title, sub, onClick, hot, key) => {
        if (key && !open(key)) {
          const need = CZ.UNLOCK[key] - found;
          return h('button', { class: 'hub-tile locked ' + cls, type: 'button', onClick: () => { CZ.audio.sfx('wrong'); CZ.ui.toast(t('hub.unlockIn', { n: need })); } },
            img('ui.lock', 'tile-icon'), h('strong', { text: title }), h('small', { text: t('hub.unlockIn', { n: need }) }));
        }
        return h('button', { class: 'hub-tile ' + cls + (hot ? ' hot' : ''), type: 'button', onClick: () => { CZ.audio.sfx('button'); onClick(); } },
          art, h('strong', { text: title }), h('small', { text: sub }), hot ? h('i', { class: 'dot' }) : null);
      };
      el.append(
        h('div', { class: 'hub-bg' }, img('scene.hub_bg', 'hub-bg-img')),
        snow(10),
        h('button', { class: 'mansion-hot', type: 'button', 'aria-label': t('hub.enter'), onClick: () => { CZ.audio.sfx('button'); CZ.ui.wipeTo('mansion'); } }),
        h('div', { class: 'hub-top glass-bar' },
          h('div', { class: 'hub-me' },
            h('button', { class: 'hub-avatar-btn', type: 'button', 'aria-label': t('chars.title'), onClick: () => { CZ.audio.sfx('button'); go('chars'); } }, CZ.charArt.img(state.data.avatar || 'girl', 'front', 'hub-avatar')),
            CZ.progress.bar()),
          h('div', { class: 'hub-stats' },
            h('div', { class: 'emeralds gold-badge' }, img('ui.gold', 'emerald-icon'), h('span', { text: state.data.gold || 0 })),
            CZ.ui.emeralds(),
            h('button', { class: 'hub-gear', type: 'button', 'aria-label': t('hub.settings'), onClick: () => { CZ.audio.sfx('button'); go('settings'); } }, img('ui.gear', 'hub-gear-img')))),
        zibo.el,
        h('div', { class: 'hub-main' },
          h('button', { class: 'play-big', type: 'button', onClick: () => { CZ.audio.sfx('button'); CZ.ui.wipeTo('mansion'); } },
            h('b', { text: t('hub.enter') }),
            h('small', { text: t('mansion.progress', { found: game.foundCount(), total: game.rounds().length }) })),
          adRewardBar(),
          h('div', { class: 'hub-tiles' },
            tile('gold-tile' + (goldFree ? ' ready' : ''), img('ui.gold', 'tile-icon'), t('hub.gold'), goldFree ? t('hub.goldReady') : CZ.screens.gold.waitText(), () => CZ.ui.wipeTo('gold'), goldFree, 'gold'),
            tile('house-tile', houseArt, CZ.house.title(H) || t('house.title'), H.job ? '🔨 ' + t('hub.houseBuilding') : t('house.level') + ' ' + CZ.house.level(H), () => CZ.ui.wipeTo('house'), CZ.house.attention(), 'house'),
            tile('quest-tile', h('div', { class: 'tile-art quest-art' }, h('span', { text: '📋' }), h('div', { class: 'quest-dots' }, q.list.map(x => h('i', { class: x.claimed ? 'on' : x.have >= x.n ? 'ready' : '' })), h('i', { class: 'chest' + (q.chest ? ' on' : '') }))),
              t('quest.short'), `${q.list.filter(x => x.claimed).length}/3`, () => CZ.quests.open(document.getElementById('app'), () => CZ.ui.refresh()), CZ.quests.ready(), 'quests'))),
        h('nav', { class: 'hub-nav glass-bar' },
          open('house') ? nav(t('hub.village'), 'ui.house', 'house') : null,
          nav(t('chars.title'), 'ui.wardrobe', 'chars'),
          open('hood') ? nav(t('hub.hood'), 'ui.hood', 'hood') : null,
          open('book') ? nav(t('hub.bookShort'), 'ui.book', 'book') : null,
          open('diary') ? nav(t('hub.diaryShort'), 'ui.diary', 'diary', game.diaryUnread()) : null));
      // Günlük ödül ve seviye pencereleri merkeze girer girmez çıkar.
      // İlk girişte pencere açılmaz: oyuncu önce merkezi görsün.
      state.data.hubVisits = (state.data.hubVisits || 0) + 1;
      state.save();
      if (state.data.hubVisits > 1) this.popTimer = setTimeout(() => CZ.progress.showOnHub(el, () => CZ.ui.refresh()), 450);
      if (state.data.tutorialDone && CZ.house && state.data.house) CZ.notify.askOnce();
    },
    // Evim (küçük resim + durum) ve günlük görevler kartı
    cards() {
      const H = CZ.house.ensure();
      CZ.house.tick();
      const lvl = CZ.house.level(H);
      const job = H.job;
      const status = job ? '🔨 ' + t('hub.houseBuilding') : CZ.house.attention() ? '👉 ' + t('hub.houseNext') : t('house.level') + ' ' + lvl;
      const houseArt = h('div', { class: 'hub-house-art' });
      houseArt.innerHTML = CZ.houseArt.view(H, { owner: CZ.charArt.url(state.data.avatar || 'girl', 'front') });
      const q = CZ.quests.today();
      const done = q.list.filter(x => x.claimed).length;
      return h('div', { class: 'hub-cards' },
        h('button', { class: 'hub-card house-card', type: 'button', onClick: () => { CZ.audio.sfx('button'); CZ.ui.wipeTo('house'); } },
          houseArt,
          h('div', { class: 'hub-card-text' }, h('strong', { text: CZ.house.title(H) || t('house.title') }), h('small', { text: status }))),
        h('button', { class: 'hub-card quest-card' + (CZ.quests.ready() ? ' ready' : ''), type: 'button', onClick: () => { CZ.audio.sfx('button'); CZ.quests.open(document.getElementById('app'), () => CZ.ui.refresh()); } },
          h('b', { class: 'quest-icon', text: '📋' }),
          h('div', { class: 'hub-card-text' }, h('strong', { text: t('quest.title') }),
            h('div', { class: 'quest-dots' }, q.list.map(x => h('i', { class: x.claimed ? 'on' : x.have >= x.n ? 'ready' : '' })), h('i', { class: 'chest' + (q.chest ? ' on' : '') }))),
          CZ.quests.ready() ? h('i', { class: 'dot' }) : null));
    },
    leave() {
      clearTimeout(this.helloTimer);
      clearTimeout(this.popTimer);
      if (this.zibo) this.zibo.stop();
    }
  };

  CZ.screens.mansion = {
    render(el) {
      const list = game.rounds();
      const found = game.foundCount();
      // Bugünlük oynanacak bir şey kalmadıysa yarına kaç saat kaldığını söyle.
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const hoursLeft = Math.max(1, Math.ceil((midnight - Date.now()) / 3600000));
      const openRooms = CZ.ROOMS.filter(game.roomOpen);
      const openList = openRooms.reduce((all, room) => all.concat(room.rounds), []);
      const openFound = openList.filter(r => state.isFound(r.id)).length;
      const blocked = openFound < openList.length && !game.nextOpen();
      const tile = (r, index) => {
        const st = game.status(r.id);
        const open = () => {
          if (st === 'resting') return CZ.ui.toast(t('mansion.resting'));
          if (st === 'locked') return CZ.ui.toast(t('mansion.locked'));
          CZ.ui.wipeTo('play', { roundId: r.id });
        };
        const art = img('item.' + r.target, 'tile-img ' + (st === 'found' ? '' : 'mystery'));
        return h('button', { class: 'tile tile-' + st, style: `animation-delay:${index * 0.04}s`, type: 'button', onClick: () => { CZ.audio.sfx('button'); open(); } },
          art,
          st === 'found' ? h('span', { class: 'tile-stars' }, [0, 1, 2].map(i => img(i < (state.round(r.id).stars || 0) ? 'ui.star' : 'ui.star_empty', 'tile-star'))) : null,
          st === 'locked' ? img('ui.lock', 'tile-lock') : null,
          st === 'resting' ? h('span', { class: 'tile-badge wait', text: t('mansion.tomorrow') }) : null);
      };
      const roomBlock = (room, index) => {
        const rFound = room.rounds.filter(r => state.isFound(r.id)).length;
        const isOpen = game.roomOpen(room);
        const prev = CZ.ROOMS[index - 1];
        // Oda ödülü: karakterin o eşyayla küçük resmi
        const prize = (room, done) => {
          const pz = CZ.ROOM_PRIZES[room.id];
          if (!pz) return null;
          return h('div', { class: 'room-prize' + (done ? ' won' : '') },
            h('img', { src: CZ.chars.front(pz), alt: '', class: CZ.chars.hasArt(pz) ? '' : 'mystery' }),
            h('span', {}, h('small', { text: done ? t('mansion.prizeWon') : t('mansion.prize') }), h('b', { text: t('char.' + pz) })));
        };
        return h('section', { class: 'room-block' + (isOpen ? '' : ' room-locked') },
          h('div', { class: 'room-card' },
            img('scene.' + room.scene, 'room-thumb'),
            h('div', { class: 'room-info' },
              h('small', { text: t('mansion.eventN', { n: index + 1 }) }),
              h('h2', { text: t('room.' + room.id) }),
              h('p', { text: isOpen ? t('mansion.progress', { found: rFound, total: room.rounds.length })
                : game.dateLocked(room) ? t('mansion.opensOn', { date: game.formatDate(room.opens) })
                : t('mansion.roomLocked', { room: t('room.' + prev.id) }) }),
              isOpen ? h('div', { class: 'meter' }, h('i', { style: `width:${rFound / room.rounds.length * 100}%` })) : img('ui.lock', 'room-lock-icon'),
              prize(room, rFound === room.rounds.length))),
          isOpen ? h('div', { class: 'tile-grid' }, room.rounds.map(tile)) : null);
      };
      const allFound = found === list.length;
      const nextLocked = CZ.ROOMS.find(room => !game.roomOpen(room));
      const note = blocked ? t('mansion.comeBack', { h: hoursLeft })
        : openFound < openList.length ? t('mansion.pick')
        : !allFound && nextLocked && game.dateLocked(nextLocked) ? t('mansion.nextDate', { date: game.formatDate(nextLocked.opens) })
        : !allFound ? t('mansion.nextRoom')
        : game.totalStars() < list.length * 3 ? t('mansion.moreStars', { n: list.length * 3 - game.totalStars() })
        : t('mansion.done');
      // En son açılan oda en üstte: oyuncu yeni odayı hemen görsün.
      const blocks = CZ.ROOMS.map(roomBlock);
      const lastOpen = openRooms.length - 1;
      const ordered = [blocks[lastOpen]].concat(blocks.filter((b, i) => i !== lastOpen));
      el.append(
        header(t('mansion.title'), () => go('hub')),
        h('div', { class: 'scroll' },
          h('p', { class: 'section-note', text: note }),
          ordered));
    }
  };

  // Koleksiyon albümü: oda oda ızgara. Bulunmayan eşya karanlık siluet; odayı bitirince ödül karakteri.
  CZ.screens.book = {
    render(el) {
      const list = game.rounds();
      const tile = r => {
        const has = state.isFound(r.id);
        const st = state.round(r.id).stars || 0;
        return h('button', {
          class: 'album-tile' + (has ? ' has' : ''), type: 'button',
          onClick: () => {
            CZ.audio.sfx('button');
            if (!has) return CZ.ui.toast(t('book.unknownNote'));
            CZ.ui.toast(t(`item.${r.target}.name`) + ' — ' + t(`item.${r.target}.note`));
          }
        }, img('item.' + r.target, 'album-img'),
        has && !r.tutorial ? h('span', { class: 'album-stars' }, [0, 1, 2].map(i => h('i', { class: i < st ? 'on' : '', text: '★' }))) : null);
      };
      const section = room => {
        const got = room.rounds.filter(r => state.isFound(r.id)).length;
        const done = got === room.rounds.length;
        const prize = CZ.ROOM_PRIZES[room.id];
        return h('section', { class: 'album-room' + (done ? ' done' : '') },
          h('div', { class: 'album-head' },
            h('img', { class: 'album-thumb', src: CZ.art('scene.' + room.scene), alt: '' }),
            h('div', { class: 'album-title' },
              h('strong', { text: t('room.' + room.id) }),
              h('div', { class: 'album-bar' }, h('i', { style: `width:${got / room.rounds.length * 100}%` })),
              h('small', { text: got + '/' + room.rounds.length })),
            prize ? h('div', { class: 'album-prize' + (done ? ' won' : '') },
              h('img', { src: CZ.chars.front(prize), alt: '', class: done && CZ.chars.hasArt(prize) ? '' : 'mystery' }),
              h('small', { text: done ? '✓' : '🎁' })) : null),
          h('div', { class: 'album-grid' }, room.rounds.map(tile)));
      };
      el.append(
        header(t('book.title'), () => go('hub')),
        h('div', { class: 'scroll album' },
          h('p', { class: 'section-note', text: t('book.count', { found: game.foundCount(), total: list.length }) }),
          CZ.ROOMS.map(section)));
    }
  };

  CZ.screens.diary = {
    render(el) {
      game.ensureDiary();
      const firstToday = state.data.diaryRead !== state.today();
      state.data.diaryRead = state.today();
      if (firstToday) state.data.emeralds += CZ.CONFIG.diaryGift;
      state.save();
      if (firstToday) {
        this.giftTimer = setTimeout(() => {
          CZ.audio.sfx('buy');
          CZ.ui.toast(t('diary.gift', { n: CZ.CONFIG.diaryGift }));
        }, 450);
      }
      const page = (entry, i) => {
        const text = t('diary.' + entry.index);
        return h('article', { class: 'diary-page' },
          h('small', { text: i === 0 ? t('diary.today') : game.formatDate(entry.date) }),
          h('p', { text }),
          btn(t('diary.share'), () => game.shareDiary(text, t('diary.shareText', { text })), 'small ghost-dark diary-share'));
      };
      el.append(
        header(t('diary.title'), () => go('hub')),
        h('div', { class: 'scroll' },
          h('p', { class: 'section-note', text: t('diary.note') }),
          h('div', { class: 'diary-list' }, state.data.diary.map(page)),
          img('zibo.idle', 'diary-zibo', 'Zibo')));
    },
    leave() {
      clearTimeout(this.giftTimer);
    }
  };

  CZ.screens.settings = {
    render(el) {
      const d = state.data;
      const row = (label, control) => h('div', { class: 'set-row' }, h('span', { text: label }), control);
      const toggle = key => h('button', {
        class: 'toggle' + (d[key] ? ' on' : ''),
        type: 'button',
        role: 'switch',
        'aria-checked': String(d[key]),
        onClick: () => { d[key] = !d[key]; state.save(); CZ.ui.refresh(); },
        text: d[key] ? t('settings.on') : t('settings.off')
      });
      el.append(
        header(t('settings.title'), () => go('hub')),
        h('div', { class: 'scroll settings' },
          h('div', { class: 'set-row set-lang' },
            h('span', { text: t('settings.language') }),
            h('div', { class: 'lang-grid' }, CZ.i18n.list.map(l => h('button', {
              class: 'lang-btn' + (l.code === CZ.i18n.current ? ' active' : ''),
              type: 'button',
              lang: l.code,
              onClick: () => { CZ.audio.sfx('button'); CZ.applyLanguage(l.code); CZ.ui.refresh(); },
              text: l.name
            })))),
          row(t('settings.avatar'), h('div', { class: 'set-avatar' },
            CZ.charArt.img(d.avatar || 'girl', 'front', 'set-avatar-img'),
            btn(t('settings.change'), () => go('chars', { returnTo: 'settings' }), 'small ghost-dark'))),
          row(t('settings.sound'), toggle('sound')),
          row(t('settings.music'), toggle('music')),
          row(t('settings.vibration'), toggle('vibration')),
          CZ.notify.available() ? row(t('settings.notify'), h('button', {
            class: 'toggle' + (d.notify !== false ? ' on' : ''), type: 'button', role: 'switch', 'aria-checked': String(d.notify !== false),
            onClick: () => { d.notify = d.notify === false; d.notifyAsked = false; state.save(); if (d.notify) CZ.notify.askOnce(); CZ.notify.schedule(); CZ.ui.refresh(); },
            text: d.notify !== false ? t('settings.on') : t('settings.off')
          })) : null,
          btn(t('settings.story'), () => go('story', { replay: true }), 'ghost-dark wide'),
          h('a', { class: 'privacy-link', href: 'privacy.html', target: '_blank', rel: 'noopener', text: t('settings.privacy') }),
          !CZ.DEV ? null : h('div', { class: 'test-box' },
            h('h2', { text: t('settings.test') }),
            h('p', { text: t('settings.testNote') }),
            btn(t('settings.nextDay'), () => {
              d.dayOffset += 1;
              state.save();
              game.ensureDiary();
              CZ.ui.toast(t('settings.nextDayDone'));
            }, 'ghost-dark wide'),
            CZ.notify.available() ? btn(t('settings.testNotify'), async () => {
              CZ.ui.toast(await CZ.notify.test() ? t('settings.testNotifyOk') : t('settings.testNotifyNo'));
            }, 'ghost-dark wide') : null,
            btn(t('settings.addEmeralds'), () => {
              d.emeralds += 100;
              state.save();
              CZ.ui.refresh();
            }, 'ghost-dark wide'),
            btn(t('settings.reset'), () => CZ.ui.confirmBox(t('settings.resetAsk'), t('settings.resetYes'), t('common.cancel'), () => {
              state.reset();
              go('title');
            }), 'danger wide'))));
    }
  };
})();
