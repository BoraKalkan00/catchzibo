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
        img('scene.title', 'scene-bg'),
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
      }, img('avatar.' + kind, 'avatar-img'), h('span', { text: t('avatar.' + kind) }));

      el.append(
        snow(),
        h('div', { class: 'avatar-head' },
          h('h1', { text: t('avatar.title') }),
          h('p', { text: t('avatar.sub') })),
        h('div', { class: 'avatar-row' }, card('girl'), card('boy')));
    }
  };

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

      el.append(
        img('scene.town', 'scene-bg'),
        snow(),
        h('div', { class: 'hub-top' },
          h('div', { class: 'hub-me' },
            img('avatar.' + (state.data.avatar || 'girl'), 'hub-avatar'),
            CZ.progress.bar()),
          h('div', { class: 'hub-stats' },
            h('div', { class: 'emeralds' }, img('ui.star', 'emerald-icon'), h('span', { text: `${game.totalStars()}/${game.rounds().length * 3}` })),
            h('div', { class: 'emeralds gold-badge' }, img('ui.gold', 'emerald-icon'), h('span', { text: state.data.gold || 0 })),
            CZ.ui.emeralds())),
        zibo.el,
        h('div', { class: 'hub-center' },
          h('div', { class: 'hub-next' },
            btn(t('hub.enter'), () => CZ.ui.wipeTo('mansion'), 'primary big pulse'),
            h('span', { class: 'hub-progress', text: t('mansion.progress', { found: game.foundCount(), total: game.rounds().length }) }),
            h('button', { class: 'gold-hub-btn' + (CZ.screens.gold.isFree() ? ' ready' : ''), type: 'button', onClick: () => { CZ.audio.sfx('button'); CZ.ui.wipeTo('gold'); } },
              img('ui.snowball', 'gold-hub-icon'),
              h('span', {}, h('strong', { text: t('hub.gold') }),
                h('small', { text: CZ.screens.gold.isFree() ? t('hub.goldReady') : CZ.screens.gold.waitText() }))))),
        h('nav', { class: 'hub-nav' },
          nav(t('hub.village'), 'ui.house', 'house', CZ.house && CZ.house.attention()),
          nav(t('hub.hood'), 'ui.hood', 'hood'),
          nav(t('hub.book'), 'ui.book', 'book'),
          nav(t('hub.diary'), 'ui.diary', 'diary', game.diaryUnread()),
          nav(t('hub.settings'), 'ui.gear', 'settings')));
      // Günlük ödül ve seviye pencereleri merkeze girer girmez çıkar.
      this.popTimer = setTimeout(() => CZ.progress.showOnHub(el, () => CZ.ui.refresh()), 450);
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
        return h('section', { class: 'room-block' + (isOpen ? '' : ' room-locked') },
          h('div', { class: 'room-card' },
            img('scene.' + room.scene, 'room-thumb'),
            h('div', { class: 'room-info' },
              h('small', { text: t('mansion.eventN', { n: index + 1 }) }),
              h('h2', { text: t('room.' + room.id) }),
              h('p', { text: isOpen ? t('mansion.progress', { found: rFound, total: room.rounds.length })
                : game.dateLocked(room) ? t('mansion.opensOn', { date: game.formatDate(room.opens) })
                : t('mansion.roomLocked', { room: t('room.' + prev.id) }) }),
              isOpen ? h('div', { class: 'meter' }, h('i', { style: `width:${rFound / room.rounds.length * 100}%` })) : img('ui.lock', 'room-lock-icon'))),
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

  CZ.screens.book = {
    render(el) {
      const list = game.rounds();
      const card = r => {
        const has = state.isFound(r.id);
        return h('article', { class: 'book-card' + (has ? '' : ' unknown') },
          img('item.' + r.target, 'book-img'),
          h('div', {},
            h('h3', { text: has ? t(`item.${r.target}.name`) : t('book.unknown') }),
            h('p', { text: has ? t(`item.${r.target}.note`) : t('book.unknownNote') }),
            has ? h('small', { text: t('book.foundOn', { date: game.formatDate(state.round(r.id).found) }) }) : null,
            has && state.round(r.id).best !== undefined && !r.tutorial ? h('small', { class: 'book-best' }, img('ui.star', 'tile-star'), ` ${state.round(r.id).stars}/3 · ${t('book.best', { s: game.formatSeconds(state.round(r.id).best) })}`) : null));
      };
      el.append(
        header(t('book.title'), () => go('hub')),
        h('div', { class: 'scroll' },
          h('p', { class: 'section-note', text: t('book.count', { found: game.foundCount(), total: list.length }) }),
          h('div', { class: 'book-list' }, list.map(card))));
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
            img('avatar.' + (d.avatar || 'girl'), 'set-avatar-img'),
            btn(t('settings.change'), () => go('avatar', { returnTo: 'settings' }), 'small ghost-dark'))),
          row(t('settings.sound'), toggle('sound')),
          row(t('settings.music'), toggle('music')),
          row(t('settings.vibration'), toggle('vibration')),
          btn(t('settings.story'), () => go('story', { replay: true }), 'ghost-dark wide'),
          h('div', { class: 'test-box' },
            h('h2', { text: t('settings.test') }),
            h('p', { text: t('settings.testNote') }),
            btn(t('settings.nextDay'), () => {
              d.dayOffset += 1;
              state.save();
              game.ensureDiary();
              CZ.ui.toast(t('settings.nextDayDone'));
            }, 'ghost-dark wide'),
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
