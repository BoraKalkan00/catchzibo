// EVİM, ODA, MAHALLE, KOMŞU ZİYARETİ ekranları.
(function () {
  const { h, img, btn, go } = CZ.ui;
  const t = (k, p) => CZ.t(k, p);
  const HS = CZ.house;
  const art = CZ.houseArt;
  const d = () => CZ.state.data;

  const html = (cls, markup) => { const el = h('div', { class: cls }); el.innerHTML = markup; return el; };
  const goldChip = () => h('div', { class: 'emeralds gold-badge' }, img('ui.gold', 'emerald-icon'), h('span', { class: 'emerald-count', text: d().gold || 0 }));

  function topbar(title, onBack) {
    return h('header', { class: 'topbar' },
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': t('common.back'), onClick: () => { CZ.audio.sfx('button'); onBack(); }, text: '‹' }),
      h('h1', { text: title }),
      h('div', { class: 'top-money' }, goldChip(), CZ.ui.emeralds()));
  }

  // Bedel çipleri: eksik olan kırmızı.
  function costChips(H, cost) {
    const short = HS.shortOf(H, cost);
    return h('div', { class: 'cost' }, Object.keys(cost).map(k => {
      const c = h('span', { class: 'cost-chip' + (short[k] ? ' short' : '') });
      c.innerHTML = art.matIcon(k);
      c.append(String(cost[k]));
      return c;
    }), goldEq(H, cost));
  }
  // Malzeme eksikse altın karşılığı: "= 🪙 60" (malzemeyi Usta bu fiyata getirir).
  function goldEq(H, cost) {
    const short = HS.shortOf(H, cost);
    if (!Object.keys(short).some(k => k !== 'gold')) return null;
    const plan = topUp(H, cost);
    return h('span', { class: 'cost-eq' }, '= ', img('ui.gold', 'mini-ico'), String(plan.gold + (cost.gold || 0)));
  }

  // Eksik malzemeyi altınla tamamla: kaç paket, kaç altın.
  function topUp(H, cost) {
    const short = HS.shortOf(H, cost);
    let gold = 0;
    const packs = {};
    Object.keys(short).forEach(k => {
      if (k === 'gold') return;
      const m = CZ.MATS.find(x => x.id === k);
      packs[k] = Math.ceil(short[k] / m.pack);
      gold += packs[k] * m.price;
    });
    const needGold = gold + (cost.gold || 0);
    return { packs, gold, ok: (d().gold || 0) >= needGold, onlyGoldShort: !!short.gold && Object.keys(short).length === 1 };
  }

  // Bir işlemi dene; malzeme eksikse "altınla tamamla" sor.
  function attempt(H, cost, doIt, onDone) {
    if (HS.canPay(H, cost)) { doIt(); onDone(); return; }
    const plan = topUp(H, cost);
    if (!plan.ok || plan.onlyGoldShort) {
      CZ.audio.sfx('wrong');
      CZ.ui.toast(t('house.noGold'));
      return;
    }
    // Usta malzemeyi pazardan getirir: ne alındığı, fiyatı ve kalan altın açıkça görünür.
    const total = plan.gold + (cost.gold || 0);
    const have = d().gold || 0;
    const chips = Object.keys(plan.packs).map(k => {
      const n = plan.packs[k] * CZ.MATS.find(m => m.id === k).pack;
      const c = h('span', { class: 'buy-chip' }); c.innerHTML = art.matIcon(k); c.append(' ' + n + ' ' + t('mat.' + k));
      return c;
    });
    const box = h('div', { class: 'modal-wrap buy-wrap' },
      h('div', { class: 'modal buy-modal' },
        h('img', { class: 'buy-usta', src: CZ.art('usta.talk'), alt: '' }),
        h('p', { class: 'buy-title', text: t('house.topUp2') }),
        h('div', { class: 'buy-chips' }, chips),
        h('p', { class: 'buy-bal' }, img('ui.gold', 'mini-ico'), ' ' + t('house.balance', { a: have, b: have - total })),
        h('button', {
          class: 'btn primary big wide buy-yes', type: 'button',
          onClick: () => {
            box.remove();
            CZ.audio.sfx('buy');
            Object.keys(plan.packs).forEach(k => { for (let i = 0; i < plan.packs[k]; i++) HS.buyMat(k); });
            doIt();
            onDone();
          }
        }, img('ui.gold', 'btn-icon'), h('span', { text: total + ' · ' + t('house.topUpYes') })),
        h('button', { class: 'buy-no', type: 'button', text: t('house.notNow'), onClick: () => { CZ.audio.sfx('button'); box.remove(); } })));
    document.getElementById('app').append(box);
  }

  function stats(H) {
    const def = HS.defense(H), max = HS.maxDefense();
    return h('div', { class: 'house-stats' },
      h('div', { class: 'house-level' }, h('small', { text: t('house.level') }), h('b', { text: HS.level(H) })),
      h('div', { class: 'house-def' },
        h('small', { text: '🛡️ ' + t('house.defense') + ' ' + def + '/' + max }),
        h('div', { class: 'def-track' }, h('i', { style: `width:${Math.round(def / max * 100)}%` }))));
  }

  /* ================= EVİM ================= */
  CZ.screens.house = {
    music: 'home',
    render(el, params) {
      const H = HS.ensure();
      const tab = params.tab || this.tab || 'build';
      this.tab = tab;
      const fresh = H.fresh;
      H.fresh = null;
      const job = H.job;
      const ghost = job ? (HS.SHELL.includes(job.id) ? job.id : null) : HS.nextShell(H);

      const view = html('house-view' + (job ? ' building' : ''), art.view(H, { fresh, ghost, owner: CZ.charArt.url(d().avatar || 'girl', 'front') }));
      if (fresh) {
        CZ.audio.sfx('build');
        CZ.audio.vibrate([20, 40, 20, 40, 60]);
        for (let i = 0; i < 10; i++) {
          const a = i / 10 * Math.PI * 2;
          view.append(h('i', { class: 'puff house-puff', style: `--dx:${Math.cos(a) * 90}px;--dy:${Math.sin(a) * 40}px;--z:1.4;animation-delay:.25s` }));
        }
        view.append(h('div', { class: 'level-float', text: t('house.grew') }));
      }

      // Kunduz Usta: büyük ve hep görünür konuşma balonu. Rehber ipuçları da burada.
      const tip = this.tipKey(H);
      const ul = tip && !fresh ? { key: 'tut.' + tip, pose: tip === 'raid' ? 'worried' : tip === 'wait' ? 'hammer' : tip === 'mats' ? 'think' : 'talk' } : HS.ustaLine(H, fresh);
      if (tip && !fresh) { const seen = d().houseTut || (d().houseTut = []); if (!seen.includes(tip) && tip !== 'start') { seen.push(tip); CZ.state.save(); } }
      const ustaImg = h('img', { class: 'usta-img', src: CZ.art('usta.' + ul.pose), alt: '' });
      const ustaText = h('p', { class: 'usta-text', text: t(ul.key, ul.p || {}) });
      const usta = h('div', { class: 'usta-box' },
        h('div', { class: 'usta-bubble' }, h('em', { text: t('usta.name') }), ustaText), ustaImg);
      usta.addEventListener('pointerdown', () => {
        CZ.audio.sfx('poke');
        const line = HS.ustaLine(H);
        ustaText.textContent = t(line.key, line.p || {});
        ustaImg.src = CZ.art('usta.' + ['talk', 'wave', 'think'][Math.floor(Math.random() * 3)]);
        ustaImg.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-10px)' }, { transform: 'translateY(0)' }], { duration: 320 });
      });
      this.zibo = null;
      const zibo = { el: usta };

      const mats = h('button', { class: 'mat-bar', type: 'button', onClick: () => { CZ.audio.sfx('button'); this.shop(el, H); } },
        CZ.MATS.map(m => { const s = h('span', { class: 'mat' }); s.innerHTML = art.matIcon(m.id); s.append(String(H.mats[m.id] || 0)); s.append(h('small', { class: 'mat-price', text: m.pack + '=' + m.price + '🪙' })); return s; }),
        h('b', { class: 'mat-plus', text: '+' }));

      // Clash of Clans / Hay Day gibi: ev ekranı kaplar, listeler alttaki düğmelerden açılan pencerede.
      // Yenileme (aynı params) değilse pencere kapalı başlar; yenilemede açık pencere kıpırdamaz.
      const isRefresh = this.lastParams === params;
      this.lastParams = params;
      if (!isRefresh) this.sheet = false;
      const open = id => { CZ.audio.sfx('button'); this.tab = id; this.sheet = true; CZ.ui.refresh(); };
      const ICON = { build: '🔨', rooms: '🛋️', paint: '🎨' };
      const tabs = h('div', { class: 'house-dock' }, ['build', 'rooms', 'paint'].map(id => h('button', {
        class: 'dock-btn', type: 'button', onClick: () => open(id)
      }, h('b', { text: ICON[id] }), h('span', { text: t('house.tab.' + id) }))));
      view.addEventListener('click', () => open('build'));
      let sheet = null;
      if (this.sheet) {
        const panel = tab === 'build' ? this.buildPanel(H) : tab === 'rooms' ? this.roomsPanel(H) : this.paintPanel(H);
        const close = () => { this.sheet = false; CZ.audio.sfx('button'); sheet.classList.add('out'); setTimeout(() => CZ.ui.refresh(), 180); };
        sheet = h('div', { class: 'house-sheet' + (isRefresh && this.sheetShown ? ' still' : '') },
          h('div', { class: 'sheet-back', onClick: close }),
          h('div', { class: 'sheet-panel' },
            h('div', { class: 'sheet-head' },
              h('div', { class: 'sheet-tabs' }, ['build', 'rooms', 'paint'].map(id => h('button', {
                class: 'tab' + (id === tab ? ' on' : ''), type: 'button',
                onClick: () => { CZ.audio.sfx('button'); this.tab = id; CZ.ui.refresh(); }
              }, ICON[id] + ' ' + t('house.tab.' + id)))),
              h('button', { class: 'sheet-x', type: 'button', text: '✕', onClick: close })),
            h('div', { class: 'scroll house-scroll' }, panel)));
      }

      el.append(
        topbar(HS.title(H) || t('house.title'), () => go('hub')),
        h('div', { class: 'house-top' }, stats(H),
          h('button', { class: 'hood-btn', type: 'button', onClick: () => { CZ.audio.sfx('button'); CZ.ui.wipeTo('hood'); } }, '🏘️ ', t('hood.title'))),
        h('div', { class: 'house-stage' }, view, zibo.el),
        job ? this.jobBar(H) : this.nextButton(H),
        mats, tabs, sheet || '');
      this.sheetShown = !!sheet;
    },

    // Hangi ipucu sırada (bir kez gösterilir; 'start' temel atılana kadar kalır)
    tipKey(H) {
      const seen = d().houseTut || [];
      let key = null;
      if (!HS.lv(H, 'found') && !H.job) key = 'start';
      else if (H.job && !seen.includes('wait')) key = 'wait';
      else if (HS.lv(H, 'found') && !H.job && !seen.includes('mats') && HS.nextShell(H) && !HS.canPay(H, HS.nextCost(H, HS.nextShell(H)))) key = 'mats';
      else if (HS.lv(H, 'door') && !seen.includes('raid')) key = 'raid';
      else if (H.rooms.living && !seen.includes('rooms')) key = 'rooms';
      return key && (key === 'start' || !seen.includes(key)) ? key : null;
    },

    // Evin altındaki tek büyük düğme: sıradaki iş (Clash of Clans gibi düşünmeden bas)
    nextButton(H) {
      const id = HS.nextShell(H);
      let partId = id;
      if (!partId) {
        // Kabuk bitti: savunmanın en zayıf yerini öner
        const def = CZ.PARTS.filter(p => p.def && HS.nextCost(H, p.id) && HS.needMet(H, p.need));
        def.sort((a, b) => HS.lv(H, a.id) - HS.lv(H, b.id));
        partId = def[0] && def[0].id;
      }
      if (!partId) return '';
      const cost = HS.nextCost(H, partId);
      const lvl = HS.lv(H, partId);
      const short = HS.shortOf(H, cost);
      const chips = h('span', { class: 'next-cost' }, Object.keys(cost).map(k => { const c = h('i', { class: short[k] ? 'short' : '' }); c.innerHTML = art.matIcon(k); c.append(String(cost[k])); return c; }), goldEq(H, cost), '⏱ ' + this.mins(partId, lvl));
      const label = (lvl ? t('house.upgradeX', { name: t('part.' + partId) }) : t('house.buildX', { name: t('part.' + partId) }));
      return h('button', {
        class: 'next-btn pulse', type: 'button',
        onClick: () => attempt(H, cost, () => { HS.build(partId); CZ.audio.sfx('build'); CZ.ui.toast(t('house.started')); }, () => CZ.ui.refresh())
      }, h('b', { text: '🔨 ' + label }), chips);
    },

    // Kısa rehber: her ipucu bir kez, sırası gelince.
    coach(H) {
      const seen = d().houseTut || (d().houseTut = []);
      let key = null;
      if (!HS.lv(H, 'found') && !H.job) key = 'start';
      else if (H.job && !seen.includes('wait')) key = 'wait';
      else if (HS.lv(H, 'found') && !H.job && !seen.includes('mats')) key = 'mats';
      else if (HS.lv(H, 'door') && !seen.includes('raid')) key = 'raid';
      else if (H.rooms.living && !seen.includes('rooms')) key = 'rooms';
      if (!key || seen.includes(key)) return null;
      const card = h('div', { class: 'coach-card' },
        h('img', { class: 'coach-zibo', src: CZ.art(key === 'raid' ? 'usta.worried' : key === 'wait' ? 'usta.hammer' : key === 'mats' ? 'usta.think' : 'usta.talk'), alt: '' }),
        h('p', { text: t('tut.' + key) }),
        key === 'start' ? null : h('button', { class: 'btn small primary', type: 'button', onClick: () => { seen.push(key); CZ.state.save(); card.remove(); } }, t('tut.ok')));
      return card;
    },

    // İşçi çubuğu: ne yapılıyor, ne kadar kaldı, elmasla bitir.
    jobBar(H) {
      const job = H.job;
      const name = job.id.startsWith('room.') ? t(job.id) : t('part.' + job.id);
      const left = h('b', {});
      const fill = h('i', {});
      const cost = h('span', {});
      const upd = () => {
        const ms = HS.jobLeft(H);
        if (ms <= 0) { clearInterval(this.jobTimer); HS.tick(); CZ.ui.refresh(); return; }
        const sec = Math.ceil(ms / 1000);
        const hh = Math.floor(sec / 3600), mm = Math.floor(sec % 3600 / 60), ss = sec % 60;
        left.textContent = (hh ? hh + ':' + String(mm).padStart(2, '0') : mm) + ':' + String(ss).padStart(2, '0');
        fill.style.width = Math.min(100, (Date.now() - job.start) / (job.end - job.start) * 100) + '%';
        cost.textContent = HS.speedCost(H);
      };
      upd();
      clearInterval(this.jobTimer);
      this.jobTimer = setInterval(upd, 1000);
      return h('div', { class: 'job-bar' },
        h('img', { class: 'job-usta', src: CZ.art('usta.hammer'), alt: '' }),
        h('div', { class: 'job-info' }, h('small', { text: t('house.building', { name }) }), left, h('div', { class: 'job-track' }, fill)),
        h('button', {
          class: 'btn small primary', type: 'button',
          onClick: () => {
            const spent = HS.speedCost(H);
            const r = HS.speedUp();
            if (r === 'short') { CZ.audio.sfx('wrong'); return CZ.ui.toast(t('look.need')); }
            CZ.ui.toast(t('house.spent', { n: spent }));
            CZ.ui.refresh();
          }
        }, img('ui.emerald', 'btn-icon'), cost, ' ', t('house.finish')),
        HS.adsLeft(H) ? h('button', {
          class: 'btn small ad-speed', type: 'button',
          onClick: () => {
            this.adTimer = CZ.ads.show(() => {
              HS.adSpeed();
              CZ.audio.sfx('buy');
              CZ.ui.toast(t('house.adSped', { m: CZ.SPEEDUP_AD.minutes }));
              CZ.ui.refresh();
            });
          }
        }, '▶ -' + CZ.SPEEDUP_AD.minutes + ' ' + t('house.min'), h('small', { text: ' (' + HS.adsLeft(H) + ')' })) : null);
    },

    buildPanel(H) {
      const next = HS.nextShell(H);
      const cards = CZ.PARTS.map(p => {
        const lvl = HS.lv(H, p.id);
        const cost = HS.nextCost(H, p.id);
        const ok = HS.needMet(H, p.need);
        const rank = p.id === next ? 0 : !cost ? 4 : !ok ? 3 : lvl === 0 ? 1 : 2;
        return { p, lvl, cost, ok, rank };
      }).sort((a, b) => a.rank - b.rank);
      return h('div', { class: 'build-list' }, cards.map(({ p, lvl, cost, ok, rank }) => {
        const max = p.levels.length;
        const label = lvl === 0 ? t('house.build') : t('house.upgrade');
        const act = () => attempt(H, cost, () => { HS.build(p.id); CZ.audio.sfx('build'); CZ.ui.toast(t('house.started')); }, () => { this.tab = 'build'; CZ.ui.refresh(); });
        return h('div', { class: 'build-card' + (rank === 0 ? ' next' : '') + (!ok ? ' locked' : '') + (!cost ? ' maxed' : '') },
          h('div', { class: 'build-info' },
            h('strong', { text: t('part.' + p.id) }),
            h('small', { text: max > 1 ? t('house.lv', { n: lvl, max }) + (p.def ? ' · 🛡️ +' + p.def : '') : (lvl ? t('house.done') : t('part.' + p.id + '.sub')) }),
            rank === 0 ? h('em', { class: 'next-tag', text: t('house.nextStep') }) : null,
            cost && ok ? costChips(H, cost) : null,
            !ok ? h('small', { class: 'need', text: '🔒 ' + t('house.needFirst', { list: HS.missing(H, p.need).map(k => t(k)).join(', ') }) }) : null),
          H.job && H.job.id === p.id ? h('span', { class: 'max-tag busy', text: '🔨' })
            : cost && ok ? (H.job ? h('button', { class: 'btn small ghost-dark', type: 'button', onClick: () => CZ.ui.toast(t('house.busy')) }, '⏳ ' + this.mins(p.id, lvl))
              : btn(label + ' · ' + this.mins(p.id, lvl), act, rank === 0 ? 'primary small pulse' : 'primary small'))
            : h('span', { class: 'max-tag', text: !cost ? '✓' : '' }));
      }));
    },

    // Süre yazısı: 5 dk, 2 sa
    mins(id, lvl) {
      const list = CZ.BUILD_TIME[id] || [1];
      const m = list[Math.min(lvl || 0, list.length - 1)];
      return m >= 60 ? t('time.h', { n: Math.round(m / 60 * 10) / 10 }) : t('time.m', { n: m });
    },

    roomsPanel(H) {
      return h('div', { class: 'build-list' }, CZ.HROOMS.map(r => {
        const owned = !!H.rooms[r.id];
        const ok = HS.needMet(H, r.need);
        const items = owned ? Object.keys(H.rooms[r.id].furn).length : 0;
        let action;
        if (owned) action = btn(t('house.enter'), () => CZ.ui.wipeTo('room', { id: r.id }), 'primary small');
        else if (H.job && H.job.id === 'room.' + r.id) action = h('span', { class: 'max-tag busy', text: '🔨' });
        else if (ok && r.cost && H.job) action = h('button', { class: 'btn small ghost-dark', type: 'button', onClick: () => CZ.ui.toast(t('house.busy')) }, '⏳ ' + this.mins('room.' + r.id, 0));
        else if (ok && r.cost) action = btn(t('house.addRoom') + ' · ' + this.mins('room.' + r.id, 0), () => attempt(H, r.cost, () => { HS.addRoom(r.id); CZ.audio.sfx('build'); CZ.ui.toast(t('house.started')); }, () => { this.tab = 'rooms'; CZ.ui.refresh(); }), 'primary small');
        else action = h('span', { class: 'max-tag', text: '🔒' });
        return h('div', { class: 'build-card' + (!ok && !owned ? ' locked' : '') },
          h('div', { class: 'build-info' },
            h('strong', { text: t('room.' + r.id) }),
            h('small', { text: owned ? t('house.furnCount', { n: items, max: r.furn.length }) : r.free ? t('house.roomFree') : t('house.roomSub') }),
            !owned && ok && r.cost ? costChips(H, r.cost) : null,
            !owned && !ok ? h('small', { class: 'need', text: '🔒 ' + t('house.needFirst', { list: HS.missing(H, r.need).map(k => t(k)).join(', ') }) }) : null),
          action);
      }));
    },

    paintPanel(H) {
      const group = kind => kind === 'ext' ? null :  h('div', {},
        h('h2', { class: 'section-title', text: t('paint.' + kind) }),
        h('div', { class: 'swatches' }, CZ.PAINTS[kind].map(p => {
          const owned = H.owned[kind].includes(p.id);
          const on = H.paint[kind] === p.id;
          return h('button', {
            class: 'swatch' + (on ? ' on' : ''), type: 'button', style: `--c:${p.c}`, 'aria-label': t('color.' + p.id),
            onClick: () => {
              if (on) return;
              const r = HS.paint(kind, p.id);
              if (r === 'short') { CZ.audio.sfx('wrong'); return CZ.ui.toast(t('house.noGold')); }
              CZ.audio.sfx(owned ? 'button' : 'buy');
              CZ.ui.refresh();
            }
          }, h('i'), owned ? null : h('small', {}, img('ui.gold', 'swatch-gold'), String(p.price)));
        })));
      const named = !!H.name;
      return h('div', {},
        h('h2', { class: 'section-title', text: t('house.name') }),
        h('div', { class: 'build-card' },
          h('div', { class: 'build-info' }, h('strong', { text: H.name || t('house.noName') }), h('small', { text: named ? t('house.renameFree') : t('house.nameSub', { n: HS.NAME_PRICE }) })),
          h('button', { class: 'btn small primary', type: 'button', onClick: () => this.nameBox(H) }, named ? '✏️' : img('ui.emerald', 'btn-icon'), named ? '' : String(HS.NAME_PRICE))),
        group('ext'), group('roof'));
    },

    nameBox(H) {
      if (!H.name && (d().emeralds || 0) < HS.NAME_PRICE) { CZ.audio.sfx('wrong'); return CZ.ui.toast(t('house.nameNeed', { n: HS.NAME_PRICE })); }
      const input = h('input', { class: 'name-input', type: 'text', maxlength: '22', placeholder: t('house.namePh') });
      input.value = H.name || '';
      const wrap = h('div', { class: 'modal-wrap' },
        h('div', { class: 'modal' },
          h('h2', { text: t('house.name') }),
          input,
          h('div', { class: 'row' },
            btn(t('common.cancel'), () => wrap.remove(), 'ghost-dark'),
            btn(t('house.nameSave'), () => {
              const r = HS.setName(input.value);
              if (r !== 'ok') { CZ.audio.sfx('wrong'); return; }
              wrap.remove(); CZ.audio.sfx('win'); CZ.ui.refresh();
            }, 'primary'))));
      document.querySelector('#app').append(wrap);
      setTimeout(() => input.focus(), 50);
    },

    // Malzeme dükkanı
    shop(root, H) {
      const wrap = h('div', { class: 'modal-wrap' });
      const draw = () => {
        wrap.replaceChildren(h('div', { class: 'modal mat-shop' },
          h('h2', { text: t('mat.shop') }),
          h('p', { class: 'small-note', text: t('mat.sub', { gold: d().gold || 0 }) }),
          CZ.MATS.map(m => {
            const row = h('div', { class: 'mat-row' });
            const ic = h('span', { class: 'mat-row-icon' }); ic.innerHTML = art.matIcon(m.id);
            row.append(ic,
              h('div', { class: 'mat-row-text' }, h('strong', { text: `${m.pack} ${t('mat.' + m.id)}` }), h('small', { text: t('mat.have', { n: H.mats[m.id] || 0 }) })),
              h('button', {
                class: 'btn small gold-buy' + ((d().gold || 0) < m.price ? ' disabled' : ''), type: 'button',
                onClick: () => {
                  if (!HS.buyMat(m.id)) { CZ.audio.sfx('wrong'); return CZ.ui.toast(t('house.noGold')); }
                  CZ.audio.sfx('coin'); draw();
                }
              }, img('ui.gold', 'btn-icon'), String(m.price)));
            return row;
          }),
          btn(t('common.continue'), () => { wrap.remove(); CZ.ui.refresh(); }, 'primary wide')));
      };
      draw();
      root.append(wrap);
    },

    leave() {
      clearTimeout(this.sayTimer);
      clearTimeout(this.hideTimer);
      clearInterval(this.jobTimer);
      clearInterval(this.adTimer);
      if (this.zibo) this.zibo.stop();
    }
  };

  /* ================= ODA İÇİ ================= */
  CZ.screens.room = {
    music: 'home',
    render(el, params) {
      const H = HS.ensure();
      const ids = CZ.HROOMS.map(r => r.id).filter(id => H.rooms[id]);
      const id = ids.includes(params.id) ? params.id : ids[0];
      if (!id) return go('house');
      const room = H.rooms[id];
      const def = HS.roomDef(id);
      const fresh = H.freshFurn && H.freshFurn.startsWith(id + '.') ? H.freshFurn.split('.')[1] : null;
      H.freshFurn = null;
      const trophies = CZ.game.rounds().filter(r => CZ.state.isFound(r.id)).map(r => CZ.art('item.' + r.target));
      const stage = html('room-stage', art.interior(H, id, { fresh, trophies }));
      if (fresh) { CZ.audio.sfx('buy'); CZ.audio.vibrate(30); }

      // Eşya düğmeleri sahnenin üstünde
      def.furn.forEach(f => {
        const [x, y] = art.SLOTS[id][f];
        const tier = room.furn[f] || 0;
        const b = h('button', {
          class: 'furn-hot' + (tier ? ' owned' : ''), type: 'button', style: `left:${x / 4}%;top:${(y - 30) / 3}%`,
          'aria-label': t('furn.' + f),
          onClick: () => { CZ.audio.sfx('button'); this.sheet(el, H, id, f); }
        }, tier ? '★'.repeat(tier) : '+');
        stage.append(b);
      });

      const step = dir => {
        const i = (ids.indexOf(id) + dir + ids.length) % ids.length;
        go('room', { id: ids[i] });
      };
      const swatches = kind => h('div', { class: 'swatches mini' }, CZ.PAINTS[kind].map(p => {
        const owned = H.owned[kind].includes(p.id);
        const on = room[kind] === p.id;
        return h('button', {
          class: 'swatch' + (on ? ' on' : '') + (kind === 'floor' ? ' floor' : ''), type: 'button', style: `--c:${p.c}`, 'aria-label': t('color.' + p.id),
          onClick: () => {
            if (on) return;
            const r = HS.paint(kind, p.id, id);
            if (r === 'short') { CZ.audio.sfx('wrong'); return CZ.ui.toast(t('house.noGold')); }
            CZ.audio.sfx(owned ? 'button' : 'buy');
            CZ.ui.refresh();
          }
        }, h('i'), owned ? null : h('small', {}, img('ui.gold', 'swatch-gold'), String(p.price)));
      }));

      el.append(
        topbar(t('room.' + id), () => go('house', { tab: 'rooms' })),
        h('div', { class: 'room-nav' },
          ids.length > 1 ? h('button', { class: 'icon-btn', type: 'button', onClick: () => step(-1), text: '‹' }) : h('i'),
          h('span', { text: t('house.furnCount', { n: Object.keys(room.furn).length, max: def.furn.length }) + ' · ' + t('house.level') + ' ' + HS.level(H) }),
          ids.length > 1 ? h('button', { class: 'icon-btn', type: 'button', onClick: () => step(1), text: '›' }) : h('i')),
        stage,
        h('div', { class: 'scroll room-scroll' },
          h('p', { class: 'section-note', text: t('room.tip') }),
          h('h2', { class: 'section-title', text: t('paint.wall') }), swatches('wall'),
          h('h2', { class: 'section-title', text: t('paint.floor') }), swatches('floor')));
    },

    sheet(root, H, id, f) {
      const tier = H.rooms[id].furn[f] || 0;
      const cost = HS.furnCost(H, id, f);
      const ic = h('div', { class: 'furn-big' });
      ic.innerHTML = art.furnIcon(f, Math.min(3, tier + (cost ? 1 : 0)));
      const wrap = h('div', { class: 'modal-wrap' },
        h('div', { class: 'modal furn-modal' },
          h('h2', { text: t('furn.' + f) }),
          ic,
          h('p', { class: 'stars-line', text: [1, 2, 3].map(i => i <= tier ? '★' : '☆').join(' ') }),
          h('p', { class: 'small-note', text: !cost ? t('furn.max') : tier ? t('furn.next') : t('furn.buySub') }),
          h('div', { class: 'row' },
            btn(t('common.cancel'), () => wrap.remove(), 'ghost-dark'),
            cost ? h('button', {
              class: 'btn gold-buy' + ((d().gold || 0) < cost.gold ? ' disabled' : ''), type: 'button',
              onClick: () => {
                if (HS.buyFurn(id, f) !== 'ok') { CZ.audio.sfx('wrong'); return CZ.ui.toast(t('house.noGold')); }
                wrap.remove(); CZ.ui.refresh();
              }
            }, img('ui.gold', 'btn-icon'), String(cost.gold)) : null)));
      root.append(wrap);
    }
  };

  /* ================= MAHALLE ================= */
  CZ.screens.hood = {
    music: 'home',
    render(el, params) {
      const H = HS.ensure();
      const tab = params.tab || this.tab || 'map';
      this.tab = tab;
      const list = HS.ranking(tab === 'gold' ? 'gold' : 'level');
      const tabs = h('div', { class: 'tabs' }, ['map', 'rank', 'gold'].map(id => h('button', {
        class: 'tab' + (id === tab ? ' on' : ''), type: 'button',
        onClick: () => { CZ.audio.sfx('button'); this.tab = id; CZ.ui.refresh(); }
      }, t('hood.tab.' + id))));
      let body;
      if (tab === 'map') {
        // Haritada sıra sabit: komşular yerinde durur, sen ortadasın.
        const order = ['mia', 'leo', 'me', 'elif', 'can', 'yuki', 'noah'].map(k => list.find(x => x.id === k));
        body = h('div', { class: 'hood-map' }, order.map((n, i) => {
          const card = h('button', {
            class: 'plot' + (n.me ? ' me' : ''), type: 'button', style: `animation-delay:${i * 0.05}s`,
            onClick: () => { CZ.audio.sfx('button'); n.me ? CZ.ui.wipeTo('house') : CZ.ui.wipeTo('visit', { id: n.id }); }
          });
          const pic = !n.me && CZ.NEIGHBOR_HOUSE[n.id];
          card.append(pic ? h('div', { class: 'plot-art plot-pic' }, h('img', { src: 'assets/village/house_' + pic + '.webp', alt: '' })) : html('plot-art', art.view(n.house, { owner: n.me ? CZ.charArt.url(n.kind, 'front') : CZ.avatarArt.url(n.kind, n.look, 'idle') })),
            h('div', { class: 'plot-tag' }, h('b', { class: 'plot-lv', text: n.level }), h('span', { text: n.me ? (HS.title(n.house) || t('hood.yourHouse')) : t('hood.house', { name: n.pos }) })));
          return card;
        }));
      } else if (tab === 'gold') {
        const myRank = list.findIndex(x => x.me) + 1;
        body = h('div', {},
          h('p', { class: 'section-note rank-note', text: myRank === 1 ? t('hood.goldFirst') : t('hood.goldBehind', { name: list[myRank - 2].name, n: list[myRank - 2].goldBest }) }),
          h('ol', { class: 'rank-list' }, list.map((n, i) => h('li', { class: 'rank-row' + (n.me ? ' me' : '') },
            h('b', { class: 'rank-n', text: i + 1 }),
            h('img', { class: 'rank-av', src: n.me ? CZ.charArt.url(n.kind, 'front') : CZ.avatarArt.url(n.kind, n.look), alt: '' }),
            h('span', { class: 'rank-name', text: n.me ? t('hood.you') : n.name }),
            h('em', {}, img('ui.gold', 'swatch-gold'), ' ' + n.goldBest)))),
          btn(t('hood.goPlay'), () => CZ.ui.wipeTo('gold'), 'primary wide'));
      } else {
        const myRank = list.findIndex(x => x.me) + 1;
        body = h('div', {},
          h('p', { class: 'section-note rank-note', text: myRank === 1 ? t('hood.first') : t('hood.behind', { name: list[myRank - 2].name, n: list[myRank - 2].level - HS.level(H) }) }),
          h('ol', { class: 'rank-list' }, list.map((n, i) => h('li', {
            class: 'rank-row' + (n.me ? ' me' : ''),
            onClick: () => { if (!n.me) CZ.ui.wipeTo('visit', { id: n.id }); }
          }, h('b', { class: 'rank-n', text: i + 1 }), h('img', { class: 'rank-av', src: n.me ? CZ.charArt.url(n.kind, 'front') : CZ.avatarArt.url(n.kind, n.look), alt: '' }), h('span', { class: 'rank-name', text: n.me ? (HS.title(n.house) || t('hood.yourHouse')) : t('hood.house', { name: n.pos }) }), h('em', { text: t('house.level') + ' ' + n.level })))));
      }
      el.append(topbar(t('hood.title'), () => go('house')), tabs, h('div', { class: 'scroll hood-scroll' }, body));
    }
  };

  CZ.screens.visit = {
    music: 'home',
    render(el, params) {
      const n = HS.neighbors().find(x => x.id === params.id);
      if (!n) return go('hood');
      const H = HS.ensure();
      const liked = H.likes[n.id] === CZ.state.today();
      el.append(
        topbar(t('hood.house', { name: n.pos }), () => go('hood')),
        h('div', { class: 'house-top' }, stats(n.house)),
        h('div', { class: 'house-stage visit' }, html('house-view', art.exterior(n.house, { owner: CZ.avatarArt.url(n.kind, n.look, n.look.emote) }))),
        h('div', { class: 'scroll visit-scroll' },
          h('p', { class: 'section-note', text: HS.level(n.house) > HS.level(H) ? t('hood.visitBigger', { name: n.pos }) : t('hood.visitSmaller', { name: n.pos }) }),
          h('div', { class: 'visit-actions' },
            btn(liked ? t('hood.liked') : t('hood.like'), () => {
              if (!HS.like(n.id)) return;
              CZ.audio.sfx('coin');
              CZ.ui.toast(t('hood.likeGift'));
              CZ.ui.refresh();
            }, liked ? 'ghost' : 'primary'),
            btn(t('hood.back'), () => CZ.ui.wipeTo('house'), 'ghost'))));
    }
  };
})();
