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
      goldChip());
  }

  // Bedel çipleri: eksik olan kırmızı.
  function costChips(H, cost) {
    const short = HS.shortOf(H, cost);
    return h('div', { class: 'cost' }, Object.keys(cost).map(k => {
      const c = h('span', { class: 'cost-chip' + (short[k] ? ' short' : '') });
      c.innerHTML = art.matIcon(k);
      c.append(String(cost[k]));
      return c;
    }));
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
    const list = Object.keys(plan.packs).map(k => `${plan.packs[k] * CZ.MATS.find(m => m.id === k).pack} ${t('mat.' + k)}`).join(', ');
    CZ.ui.confirmBox(t('house.topUp', { list, gold: plan.gold }), t('house.topUpYes'), t('common.cancel'), () => {
      Object.keys(plan.packs).forEach(k => { for (let i = 0; i < plan.packs[k]; i++) HS.buyMat(k); });
      doIt();
      onDone();
    });
    const yes = document.querySelector('.modal-wrap .btn.danger');
    if (yes) yes.classList.replace('danger', 'primary');
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
    render(el, params) {
      const H = HS.ensure();
      const tab = params.tab || this.tab || 'build';
      this.tab = tab;
      const fresh = H.fresh;
      H.fresh = null;
      const ghost = HS.nextShell(H);

      const view = html('house-view', art.exterior(H, { fresh, ghost }));
      if (fresh) {
        CZ.audio.sfx('build');
        CZ.audio.vibrate([20, 40, 20, 40, 60]);
        for (let i = 0; i < 10; i++) {
          const a = i / 10 * Math.PI * 2;
          view.append(h('i', { class: 'puff house-puff', style: `--dx:${Math.cos(a) * 90}px;--dy:${Math.sin(a) * 40}px;--z:1.4;animation-delay:.25s` }));
        }
        view.append(h('div', { class: 'level-float', text: t('house.grew') }));
      }

      const zibo = CZ.game.ziboActor();
      this.zibo = zibo;
      zibo.el.classList.add('house-actor');
      const zl = HS.ziboLine(H);
      this.sayTimer = setTimeout(() => zibo.say(zl, zl === 'house.z.strong' ? 'nervous' : zl === 'house.z.weak' ? 'laugh' : 'smug'), fresh ? 900 : 500);
      zibo.el.addEventListener('pointerdown', () => { CZ.audio.sfx('poke'); zibo.say(HS.ziboLine(H), 'mad'); });

      const mats = h('button', { class: 'mat-bar', type: 'button', onClick: () => { CZ.audio.sfx('button'); this.shop(el, H); } },
        CZ.MATS.map(m => { const s = h('span', { class: 'mat' }); s.innerHTML = art.matIcon(m.id); s.append(String(H.mats[m.id] || 0)); return s; }),
        h('b', { class: 'mat-plus', text: '+' }));

      const tabs = h('div', { class: 'tabs' }, ['build', 'rooms', 'paint'].map(id => h('button', {
        class: 'tab' + (id === tab ? ' on' : ''), type: 'button',
        onClick: () => { CZ.audio.sfx('button'); this.tab = id; CZ.ui.refresh(); }
      }, t('house.tab.' + id))));

      const panel = tab === 'build' ? this.buildPanel(H) : tab === 'rooms' ? this.roomsPanel(H) : this.paintPanel(H);

      el.append(
        topbar(t('house.title'), () => go('hub')),
        h('div', { class: 'house-top' }, stats(H),
          h('button', { class: 'hood-btn', type: 'button', onClick: () => { CZ.audio.sfx('button'); CZ.ui.wipeTo('hood'); } }, '🏘️ ', t('hood.title'))),
        h('div', { class: 'house-stage' }, view, zibo.el),
        mats, tabs,
        h('div', { class: 'scroll house-scroll' }, panel));
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
        const act = () => attempt(H, cost, () => HS.build(p.id), () => { this.tab = 'build'; CZ.ui.refresh(); });
        return h('div', { class: 'build-card' + (rank === 0 ? ' next' : '') + (!ok ? ' locked' : '') + (!cost ? ' maxed' : '') },
          h('div', { class: 'build-info' },
            h('strong', { text: t('part.' + p.id) }),
            h('small', { text: max > 1 ? t('house.lv', { n: lvl, max }) + (p.def ? ' · 🛡️ +' + p.def : '') : (lvl ? t('house.done') : t('part.' + p.id + '.sub')) }),
            rank === 0 ? h('em', { class: 'next-tag', text: t('house.nextStep') }) : null,
            cost && ok ? costChips(H, cost) : null,
            !ok ? h('small', { class: 'need', text: '🔒 ' + t('house.needFirst', { list: HS.missing(H, p.need).map(k => t(k)).join(', ') }) }) : null),
          cost && ok ? btn(label, act, rank === 0 ? 'primary small pulse' : 'primary small') : h('span', { class: 'max-tag', text: !cost ? '✓' : '' }));
      }));
    },

    roomsPanel(H) {
      return h('div', { class: 'build-list' }, CZ.HROOMS.map(r => {
        const owned = !!H.rooms[r.id];
        const ok = HS.needMet(H, r.need);
        const items = owned ? Object.keys(H.rooms[r.id].furn).length : 0;
        let action;
        if (owned) action = btn(t('house.enter'), () => CZ.ui.wipeTo('room', { id: r.id }), 'primary small');
        else if (ok && r.cost) action = btn(t('house.addRoom'), () => attempt(H, r.cost, () => HS.addRoom(r.id), () => { this.tab = 'rooms'; CZ.ui.refresh(); }), 'primary small');
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
      const group = kind => h('div', {},
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
      return h('div', {}, group('ext'), group('roof'));
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
      if (this.zibo) this.zibo.stop();
    }
  };

  /* ================= ODA İÇİ ================= */
  CZ.screens.room = {
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
    render(el, params) {
      const H = HS.ensure();
      const tab = params.tab || this.tab || 'map';
      this.tab = tab;
      const list = HS.ranking();
      const tabs = h('div', { class: 'tabs' }, ['map', 'rank'].map(id => h('button', {
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
          card.append(html('plot-art', art.exterior(n.house, {})),
            h('div', { class: 'plot-tag' }, h('b', { class: 'plot-lv', text: n.level }), h('span', { text: n.me ? t('hood.yourHouse') : t('hood.house', { name: n.pos }) })));
          return card;
        }));
      } else {
        const myRank = list.findIndex(x => x.me) + 1;
        body = h('div', {},
          h('p', { class: 'section-note rank-note', text: myRank === 1 ? t('hood.first') : t('hood.behind', { name: list[myRank - 2].name, n: list[myRank - 2].level - HS.level(H) }) }),
          h('ol', { class: 'rank-list' }, list.map((n, i) => h('li', {
            class: 'rank-row' + (n.me ? ' me' : ''),
            onClick: () => { if (!n.me) CZ.ui.wipeTo('visit', { id: n.id }); }
          }, h('b', { class: 'rank-n', text: i + 1 }), h('span', { class: 'rank-name', text: n.me ? t('hood.yourHouse') : t('hood.house', { name: n.pos }) }), h('em', { text: t('house.level') + ' ' + n.level })))));
      }
      el.append(topbar(t('hood.title'), () => go('house')), tabs, h('div', { class: 'scroll hood-scroll' }, body));
    }
  };

  CZ.screens.visit = {
    render(el, params) {
      const n = HS.neighbors().find(x => x.id === params.id);
      if (!n) return go('hood');
      const H = HS.ensure();
      const liked = H.likes[n.id] === CZ.state.today();
      el.append(
        topbar(t('hood.house', { name: n.pos }), () => go('hood')),
        h('div', { class: 'house-top' }, stats(n.house)),
        h('div', { class: 'house-stage visit' }, html('house-view', art.exterior(n.house, {}))),
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
