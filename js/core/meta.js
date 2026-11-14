// OYUNCUYU GERİ GETİREN SİSTEMLER
//  1) Haftalık lig: oyuncu + Zibo ailesi (açıkça oyun karakteri) + meydan okuma linkiyle gelen gerçek arkadaşlar
//  2) Noel takvimi: 1-25 Aralık her gün bir kutu, 25'inde Noel Kız
//  3) Arkadaşına meydan oku: skor linki; açan kişi ligine arkadaş olarak ekler
//  4) Görev setleri: 3 görev bitince kalıcı skor çarpanı +1 (en çok x30) — Subway Surfers gibi
//  5) Karakter güçleri: her karakterin koşuda da işe yarayan gücü
(function () {
  const d = () => CZ.state.data;
  const t = (k, p) => CZ.t(k, p);
  CZ.now = () => (CZ.FAKE_DATE ? new Date(CZ.FAKE_DATE) : new Date());
  const ymd = dt => dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
  function seeded(seed) { let x = seed >>> 0 || 1; return () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; }; }
  const hash = str => { let h = 2166136261; for (const ch of String(str)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0; return h; };
  function give(r) {
    const s = d();
    if (r.gold) s.gold = (s.gold || 0) + r.gold;
    if (r.emeralds) s.emeralds = (s.emeralds || 0) + r.emeralds;
    if (r.char && !(s.boughtChars || []).includes(r.char)) s.boughtChars = (s.boughtChars || []).concat(r.char);
    CZ.state.save();
  }
  const fmt = n => Math.round(n).toLocaleString();

  /* ===================== 4) GÖREV SETLERİ ===================== */
  // Her set 3 görev; zorluk set numarasıyla artar. Set bitince kalıcı çarpan +1.
  const MISSION_POOL = [
    { id: 'runs', base: 3 },        // N koşu yap
    { id: 'score1', base: 900 },    // tek koşuda N puan
    { id: 'gold1', base: 120 },     // tek koşuda N altın
    { id: 'goldT', base: 400 },     // toplam N altın topla
    { id: 'catch', base: 3 },       // Zibo'yu toplam N kez yakala
    { id: 'catch1', base: 2 },      // tek koşuda N kez yakala
    { id: 'jump', base: 25 },       // N kez zıpla
    { id: 'roll', base: 20 },       // N kez takla at
    { id: 'hit', base: 10 },        // silahla Zibo'yu N kez vur
    { id: 'sled', base: 3 },        // kızağı N kez kullan
    { id: 'time1', base: 60 }       // tek koşuda N saniye hayatta kal
  ];
  CZ.MULT_MAX = 30;
  const ONE_RUN = ['score1', 'gold1', 'catch1', 'time1'];
  const missions = {
    state() {
      const s = d();
      if (!s.mis) s.mis = { set: 0, mult: 1, list: null };
      if (!s.mis.list) {
        const k = s.mis.set;
        const rnd = seeded(hash('mis' + k) + 7);
        const pool = MISSION_POOL.slice();
        const list = [];
        while (list.length < 3) {
          const m = pool.splice(Math.floor(rnd() * pool.length), 1)[0];
          const scale = 1 + k * 0.35;
          let n = m.base * scale;
          n = n >= 100 ? Math.round(n / 50) * 50 : n >= 20 ? Math.round(n / 5) * 5 : Math.max(1, Math.round(n));
          list.push({ id: m.id, n, have: 0 });
        }
        s.mis.list = list;
        CZ.state.save();
      }
      return s.mis;
    },
    mult() { return Math.min(CZ.MULT_MAX, this.state().mult); },
    // toplamlı görev ilerlemesi
    add(id, amount) {
      const m = this.state();
      m.list.forEach(x => { if (x.id === id && x.have < x.n) x.have = Math.min(x.n, x.have + (amount || 1)); });
    },
    // tek koşuluk görevler: en iyi değer
    best(id, value) {
      const m = this.state();
      m.list.forEach(x => { if (x.id === id) x.have = Math.min(x.n, Math.max(x.have, Math.floor(value))); });
    },
    done() { return this.state().list.every(x => x.have >= x.n); },
    // set bitti mi? bittiyse ödül + çarpan, yeni set. Dönen: ödül ya da null
    finish() {
      const m = this.state();
      if (!m.list.every(x => x.have >= x.n)) { CZ.state.save(); return null; }
      const r = { gold: 250 + m.set * 75, emeralds: 10 + m.set * 2, mult: Math.min(CZ.MULT_MAX, m.mult + 1) };
      m.mult = r.mult; m.set += 1; m.list = null;
      give(r);
      this.state();
      return r;
    },
    text(x) { return t('mis.' + x.id, { n: fmt(x.n) }); },
    // küçük panel (oyun sonu ve görev penceresi için)
    panel(justDone) {
      const { h } = CZ.ui;
      const m = this.state();
      return h('div', { class: 'mis-panel' },
        h('div', { class: 'mis-head' }, CZ.icon('target'), h('b', { text: t('mis.title', { n: m.set + 1 }) }), h('span', { class: 'mult-chip-sm', text: 'x' + m.mult })),
        m.list.map(x => h('div', { class: 'mis-row' + (x.have >= x.n ? ' done' : '') },
          x.have >= x.n ? CZ.icon('check', 'mis-check') : h('i', { class: 'mis-dot' }),
          h('span', { class: 'mis-txt', text: this.text(x) }),
          h('small', { text: ONE_RUN.includes(x.id) && x.have < x.n ? fmt(x.have) + '/' + fmt(x.n) : fmt(Math.min(x.have, x.n)) + '/' + fmt(x.n) }))),
        justDone ? h('div', { class: 'mis-reward' }, t('mis.setDone', { m: justDone.mult, g: justDone.gold, e: justDone.emeralds })) : h('small', { class: 'mis-hint', text: t('mis.hint') }));
    }
  };
  CZ.missions = missions;

  /* ===================== 5) KARAKTER GÜÇLERİ (koşuda) ===================== */
  // Odaya özel güçlerin koşudaki karşılığı; diğerleri zaten koşuda çalışıyor.
  CZ.RUN_PERKS = {
    boy: { type: 'gold', per: 0.05 },        // altın +%5 / seviye
    girl: { type: 'score', per: 0.05 },      // puan +%5 / seviye
    elf: { type: 'catchBonus', per: 0.15 },  // yakalama bonusu +%15 / seviye
    snowkid: { type: 'head', per: 2 },       // Zibo'ya 2 m daha yakın başla / seviye
    reindeer: { type: 'sled', per: 0.08 },   // kızak %8 hızlı dolar / seviye
    knight: { type: 'power', per: 0.4 },     // silah gücü +0,4 / seviye
    santa: { type: 'gemCatch', per: 0.5 }    // her yakalamada elmas: 1 + 0,5 / seviye
  };
  CZ.runPerk = type => {
    const id = d().avatar || 'girl';
    const p = CZ.RUN_PERKS[id];
    return p && p.type === type ? p.per * CZ.charLevel(id) : 0;
  };
  CZ.runPerkText = id => {
    const p = CZ.RUN_PERKS[id];
    if (!p) return '';
    const v = p.per * CZ.charLevel(id);
    const pct = ['gold', 'score', 'catchBonus', 'sled'].includes(p.type);
    const n = pct ? Math.round(v * 100) : p.type === 'gemCatch' ? Math.floor(1 + v) : Math.round(v * 10) / 10;
    return t('rperk.' + p.type, { n });
  };

  /* ===================== 1) HAFTALIK LİG ===================== */
  const RIVALS = [
    { id: 'zibo', f: 0.55 }, { id: 'buzbo', f: 0.8 }, { id: 'ucubo', f: 1.05 }, { id: 'patlabo', f: 1.4 }, { id: 'kralbo', f: 2.0 }
  ];
  CZ.LEAGUE_PRIZES = [{ gold: 1500, emeralds: 60 }, { gold: 900, emeralds: 35 }, { gold: 600, emeralds: 20 }, { gold: 300, emeralds: 10 }];
  const weekKeyOf = dt => { const x = new Date(dt); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return ymd(x); };
  const league = {
    week() { return weekKeyOf(CZ.now()); },
    state() {
      const s = d();
      if (!s.league) s.league = { week: this.week(), best: 0, friends: {}, base: 0 };
      if (s.league.week !== this.week()) {
        // yeni hafta: geçen haftanın sonucu ödül için saklanır
        const old = s.league;
        s.leaguePrev = old.best > 0 ? { week: old.week, rank: this.rankOf(old), claimed: false } : null;
        s.league = { week: this.week(), best: 0, friends: old.friends || {}, base: 0 };
        CZ.state.save();
      }
      // rakiplerin ölçüsü: haftanın başında oyuncunun seviyesine göre sabitlenir (adil yarış)
      if (!s.league.base) { s.league.base = Math.max(1200, Math.round((s.bestRun || 0) * 0.8)); CZ.state.save(); }
      return s.league;
    },
    // haftanın ne kadarı geçti (0..1)
    progress(L) {
      const start = new Date(L.week + 'T00:00:00');
      return Math.max(0.05, Math.min(1, (CZ.now() - start) / (7 * 86400000)));
    },
    rivals(L) {
      const p = this.progress(L);
      return RIVALS.map((r, i) => {
        const rnd = seeded(hash(L.week + r.id));
        const curve = Math.pow(p, 0.6) * (0.9 + rnd() * 0.2);
        return { id: r.id, name: t('boss.' + r.id), score: Math.round(L.base * r.f * curve / 10) * 10, goblin: true };
      });
    },
    rows(L) {
      L = L || this.state();
      const me = { id: 'me', name: d().name || t('league.you'), score: L.best, me: true, avatar: d().avatar || 'girl' };
      const fr = Object.keys(L.friends || {}).map(n => ({ id: 'f:' + n, name: n, score: L.friends[n].score, friend: true, avatar: L.friends[n].avatar }));
      return [me].concat(this.rivals(L), fr).sort((a, b) => b.score - a.score || (a.me ? -1 : 1));
    },
    rankOf(L) { return this.rows(L).findIndex(r => r.me) + 1; },
    submit(score) {
      const L = this.state();
      const before = this.rankOf(L);
      if (score > L.best) { L.best = score; CZ.state.save(); }
      return { before, after: this.rankOf(L) };
    },
    daysLeft() {
      const L = this.state();
      const end = new Date(L.week + 'T00:00:00'); end.setDate(end.getDate() + 7);
      return Math.max(0, Math.ceil((end - CZ.now()) / 86400000));
    },
    prizeFor(rank) { return CZ.LEAGUE_PRIZES[Math.min(rank, CZ.LEAGUE_PRIZES.length) - 1]; },
    // geçen haftanın ödülü bekliyorsa göster
    claimPrev(root, done) {
      const s = d();
      this.state();
      const P = s.leaguePrev;
      if (!P || P.claimed) return false;
      const r = this.prizeFor(P.rank);
      P.claimed = true; give(r);
      const { h, btn, img } = CZ.ui;
      const box = h('div', { class: 'modal-wrap' }, h('div', { class: 'modal league-prize' },
        CZ.icon('trophy', 'league-big-ic'),
        h('h2', { text: t('league.lastWeek', { n: P.rank }) }),
        h('p', { class: 'reward' }, img('ui.gold', 'emerald-icon'), '+' + r.gold, '  ', img('ui.emerald', 'emerald-icon'), '+' + r.emeralds),
        btn(t('daily.claim'), () => { box.remove(); CZ.audio.sfx('win'); if (done) done(); }, 'primary wide')));
      root.append(box);
      return true;
    },
    open(root) {
      const { h, btn, img } = CZ.ui;
      const L = this.state();
      const rows = this.rows(L);
      const av = r => r.goblin ? h('span', { class: 'lg-av gob lg-' + r.id }, h('img', { src: CZ.art('zibo.smug'), alt: '' }))
        : h('span', { class: 'lg-av' }, h('img', { src: CZ.chars ? CZ.chars.front(r.avatar || 'girl') : '', alt: '' }));
      const wrap = h('div', { class: 'modal-wrap' });
      wrap.append(h('div', { class: 'modal league-modal' },
        h('div', { class: 'lg-top' }, CZ.icon('trophy', 'lg-ic'), h('div', {}, h('b', { class: 'lg-title', text: t('league.title') }), h('small', { text: t('league.left', { n: this.daysLeft() }) }))),
        h('p', { class: 'small-note', text: t('league.sub') }),
        h('div', { class: 'lg-list' }, rows.map((r, i) => h('div', { class: 'lg-row' + (r.me ? ' me' : '') + (r.friend ? ' friend' : '') },
          h('b', { class: 'lg-rank', text: i + 1 }), av(r),
          h('span', { class: 'lg-name' }, r.name, r.goblin ? h('small', { text: t('league.goblin') }) : r.friend ? h('small', { text: t('league.friend') }) : null),
          h('b', { class: 'lg-score', text: fmt(r.score) }),
          i < CZ.LEAGUE_PRIZES.length - 1 ? h('span', { class: 'lg-prize' }, img('ui.gold', 'mini-ico'), String(this.prizeFor(i + 1).gold)) : null))),
        h('p', { class: 'small-note', text: t('league.prizes') }),
        btn(t('chal.btn'), () => { wrap.remove(); challenge.send(L.best || d().bestRun || 0); }, 'ghost-dark wide', 'ic:target'),
        btn(t('endless.play'), () => { wrap.remove(); CZ.ui.wipeTo('chase', { endless: true }); }, 'primary wide'),
        btn(t('common.close'), () => wrap.remove(), 'small ghost')));
      root.append(wrap);
    }
  };
  CZ.league = league;

  /* ===================== 3) ARKADAŞINA MEYDAN OKU ===================== */
  CZ.GAME_URL = 'https://borakalkan00.github.io/catchzibo/';
  const b64 = s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unb64 = s => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));
  const cleanName = n => String(n || '').replace(/[<>&"'\\/]/g, '').trim().slice(0, 14);
  const challenge = {
    link(score) {
      const s = d();
      return CZ.GAME_URL + '?c=' + b64(JSON.stringify({ n: s.name || '', s: Math.floor(score), a: s.avatar || 'girl' }));
    },
    // adı yoksa önce sor
    askName(then) {
      const s = d();
      if (s.name) return then();
      const { h, btn } = CZ.ui;
      const input = h('input', { class: 'name-input', type: 'text', maxlength: '14', placeholder: t('name.ph') });
      const box = h('div', { class: 'modal-wrap top-wrap' }, h('div', { class: 'modal name-modal' },
        h('b', { class: 'lg-title', text: t('name.title') }), h('p', { class: 'small-note', text: t('name.sub') }), input,
        btn(t('common.continue'), () => {
          const n = cleanName(input.value);
          if (n.length < 2) { CZ.audio.sfx('wrong'); return CZ.ui.toast(t('name.short')); }
          s.name = n; CZ.state.save(); box.remove(); then();
        }, 'primary wide'),
        btn(t('common.cancel'), () => box.remove(), 'small ghost')));
      (document.getElementById('app') || document.body).append(box);
      setTimeout(() => input.focus(), 50);
    },
    send(score) {
      this.askName(() => {
        const url = this.link(score);
        const text = t('chal.text', { n: fmt(score), name: d().name });
        if (CZ.share && CZ.share.share) CZ.share.share({ big: fmt(score), label: t('share.label'), avatar: d().avatar, url, text });
      });
    },
    // açılışta linkten gelen meydan okumayı yakala
    read() {
      const m = location.search.match(/[?&]c=([A-Za-z0-9_-]+)/);
      if (!m) return null;
      try {
        const o = JSON.parse(unb64(m[1]));
        const name = cleanName(o.n) || t('league.friend');
        const score = Math.max(0, Math.min(9999999, parseInt(o.s, 10) || 0));
        const avatar = CZ.LOOK3D && CZ.LOOK3D[o.a] ? o.a : 'girl';
        const L = league.state();
        L.friends = L.friends || {};
        if (!L.friends[name] || L.friends[name].score < score) L.friends[name] = { score, avatar };
        d().chalTarget = { name, score };
        CZ.state.save();
        try { history.replaceState(null, '', location.pathname); } catch (e) { /* yoksa olsun */ }
        return { name, score, avatar };
      } catch (e) { return null; }
    },
    // koşudaki hedefler: lig satırları, oyuncunun önündekiler
    targets() {
      const L = league.state();
      return league.rows(L).filter(r => !r.me && r.score > 0).map(r => ({ name: r.name, score: r.score })).sort((a, b) => a.score - b.score);
    },
    popup(root, c) {
      const { h, btn } = CZ.ui;
      const box = h('div', { class: 'modal-wrap' }, h('div', { class: 'modal chal-modal' },
        h('img', { class: 'chal-img', src: CZ.chars.front(c.avatar), alt: '' }),
        h('b', { class: 'lg-title', text: t('chal.got', { name: c.name }) }),
        h('p', { class: 'chal-score', text: fmt(c.score) }),
        h('p', { class: 'small-note', text: t('chal.gotSub') }),
        btn(t('chal.accept'), () => { box.remove(); CZ.ui.wipeTo('chase', { endless: true }); }, 'primary wide'),
        btn(t('common.close'), () => box.remove(), 'small ghost')));
      root.append(box);
    }
  };
  CZ.challenge = challenge;

  /* ===================== 2) NOEL TAKVİMİ ===================== */
  const ADVENT = [];
  for (let i = 1; i <= 25; i++) {
    let r;
    if (i === 25) r = { char: 'santa', gold: 3000, emeralds: 150 };
    else if (i % 7 === 0) r = { emeralds: 40 + i * 2 };
    else if (i % 6 === 0) r = { gold: 600 + i * 20, emeralds: 15 };
    else if (i % 3 === 0) r = { emeralds: 15 + i };
    else r = { gold: 150 + i * 25 };
    ADVENT.push(r);
  }
  CZ.ADVENT = ADVENT;
  const advent = {
    // bugün Aralık'ın kaçı (1-25), Aralık değilse 0; Aralık 26-31 = 26 (son kutular reklamla açılabilir)
    day() {
      const n = CZ.now();
      if (n.getMonth() !== 11) return 0;
      return Math.min(26, n.getDate());
    },
    daysUntil() {
      const n = CZ.now();
      const y = n.getMonth() === 11 && n.getDate() > 25 ? n.getFullYear() + 1 : n.getFullYear();
      const start = new Date(y, 11, 1);
      return Math.max(0, Math.ceil((start - new Date(n.getFullYear(), n.getMonth(), n.getDate())) / 86400000));
    },
    opened() { const s = d(); const y = CZ.now().getFullYear(); if (!s.advent || s.advent.y !== y) s.advent = { y, open: [] }; return s.advent.open; },
    status(i) {
      const day = this.day();
      if (this.opened().includes(i)) return 'open';
      if (!day || i > day) return 'locked';
      if (i === day) return 'today';
      return 'missed';
    },
    ready() { const day = this.day(); return day > 0 && day <= 25 && !this.opened().includes(day); },
    take(i) {
      const r = ADVENT[i - 1];
      const rr = Object.assign({}, r);
      if (r.char && (d().boughtChars || []).includes(r.char)) { delete rr.char; rr.gold = (rr.gold || 0) + 5000; }
      give(rr);
      this.opened().push(i);
      CZ.state.save();
      return rr;
    },
    open(root, onClose) {
      const { h, btn, img } = CZ.ui;
      const wrap = h('div', { class: 'modal-wrap' });
      const draw = () => {
        const day = this.day();
        const chips = r => [r.char ? h('span', { class: 'adv-char', text: t('char.' + r.char) }) : null, r.gold ? h('span', {}, img('ui.gold', 'mini-ico'), String(r.gold)) : null, r.emeralds ? h('span', {}, img('ui.emerald', 'mini-ico'), String(r.emeralds)) : null];
        const box = i => {
          const st = this.status(i);
          const r = ADVENT[i - 1];
          return h('button', {
            class: 'adv-box ' + st + (i === 25 ? ' big' : ''), type: 'button',
            onClick: e => {
              if (st === 'locked') { CZ.audio.sfx('wrong'); return CZ.ui.toast(day ? t('adv.notYet', { n: i - day }) : t('adv.soon', { n: this.daysUntil() })); }
              if (st === 'open') return;
              const el = e.currentTarget;
              const go = () => { const got = this.take(i); if (got.gold) CZ.ui.fly(el, 'gold', got.gold); if (got.emeralds) CZ.ui.fly(el, 'emeralds', got.emeralds); CZ.audio.sfx('win'); CZ.audio.vibrate([30, 20, 60]); if (got.char) CZ.ui.toast(t('adv.charGot', { c: t('char.' + got.char) })); draw(); };
              if (st === 'missed') return CZ.ads.show(go);
              go();
            }
          },
          h('b', { class: 'adv-n', text: i }),
          st === 'open' ? CZ.icon('check', 'adv-ic') : st === 'locked' ? CZ.icon('gift', 'adv-ic locked') : CZ.icon('gift', 'adv-ic'),
          st === 'missed' ? h('small', { class: 'adv-ad' }, CZ.icon('play'), t('adv.ad')) : h('small', { class: 'adv-r' }, chips(r)));
        };
        wrap.replaceChildren(h('div', { class: 'modal advent-modal' },
          h('h2', { text: t('adv.title') }),
          h('p', { class: 'small-note', text: day ? (day > 25 ? t('adv.over') : t('adv.sub')) : t('adv.soon', { n: this.daysUntil() }) }),
          h('div', { class: 'adv-grid' }, Array.from({ length: 25 }, (_, k) => box(k + 1))),
          btn(t('common.continue'), () => { wrap.remove(); if (onClose) onClose(); }, 'primary wide')));
      };
      draw();
      root.append(wrap);
    }
  };
  CZ.advent = advent;
})();
