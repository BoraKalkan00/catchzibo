// Oyuncu karakteri: JS ile çizilir, böylece ten/göz/saç rengi ve kostüm her yerde aynı görünür.
// CZ.art('avatar.boy'), 'avatar.girl_run1' gibi anahtarlar buradan gelir.
CZ.LOOKS = {
  skin: [
    { id: 's1', c: '#f6d2ae', price: 0 }, { id: 's2', c: '#ecc29a', price: 20 }, { id: 's3', c: '#d9a57a', price: 20 },
    { id: 's4', c: '#b77e55', price: 20 }, { id: 's5', c: '#8d5a3b', price: 20 }, { id: 's6', c: '#5e3a26', price: 20 },
    { id: 'gob', c: '#8fd16a', price: 60 }],
  eyes: [
    { id: 'e1', c: '#33211f', price: 0 }, { id: 'e2', c: '#2f7fd6', price: 15 }, { id: 'e3', c: '#2fa35a', price: 15 },
    { id: 'e4', c: '#8a5631', price: 15 }, { id: 'e5', c: '#7b4bb3', price: 15 }, { id: 'e6', c: '#d8363a', price: 30 }],
  hair: [
    { id: 'h0', c: null, price: 0 }, { id: 'h1', c: '#3b2a20', price: 25 }, { id: 'h2', c: '#8a4a24', price: 25 },
    { id: 'h3', c: '#e0b04a', price: 25 }, { id: 'h4', c: '#c2362f', price: 25 }, { id: 'h5', c: '#2b2f3b', price: 25 },
    { id: 'h6', c: '#e8598c', price: 40 }, { id: 'h7', c: '#4fa3e8', price: 40 }, { id: 'h8', c: '#f4f6fa', price: 40 }],
  costume: [
    { id: 'none', price: 0 }, { id: 'raven', price: 150 }, { id: 'dragon', price: 250 }]
};

CZ.avatarArt = (function () {
  const INK = '#33211f';
  const S = `stroke="${INK}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"`;
  const cache = {};

  function look() {
    const d = CZ.state.data;
    const l = d.look || {};
    const pick = (kind, id) => (CZ.LOOKS[kind].find(x => x.id === id) || CZ.LOOKS[kind][0]);
    return { skin: pick('skin', l.skin).c, eyes: pick('eyes', l.eyes).c, hair: pick('hair', l.hair).c, costume: pick('costume', l.costume).id };
  }

  // Kostüm renkleri
  const COST = {
    raven: { body: '#2b2f3b', dark: '#1a1d26', light: '#4a5163', accent: '#f2b632' },
    dragon: { body: '#3f9a52', dark: '#2a6e3a', light: '#f2d36b', accent: '#d8363a' }
  };

  /* ---------- ÖNDEN ---------- */
  function front(kind, L) {
    const girl = kind === 'girl';
    const coat = girl ? '#e8598c' : '#2f7fd6';
    const hair = L.hair || (girl ? '#8a4a24' : '#3b2a20');
    const C = COST[L.costume];
    const body = C ? C.body : coat;
    const o = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 400" width="320" height="400"><ellipse cx="160" cy="388" rx="84" ry="12" fill="#000" opacity=".2"/>'];
    if (L.costume === 'dragon') { // kuyruk yandan görünür
      o.push(`<path d="M214 330q70 10 76 -40q4 -20 -10 -30q4 30 -20 40q-24 10 -50 6z" fill="${C.body}" ${S}/><path d="M282 262l12 -14 4 18z" fill="${C.accent}" ${S}/>`);
    }
    if (L.costume === 'raven') { // kanatlar arkadan taşar
      o.push(`<path d="M100 226q-70 10 -80 90q30 -20 40 -10q10 -24 30 -20q4 -30 20 -36z" fill="${C.body}" ${S}/><path d="M220 226q70 10 80 90q-30 -20 -40 -10q-10 -24 -30 -20q-4 -30 -20 -36z" fill="${C.body}" ${S}/>`);
    }
    if (girl && !C) o.push(`<path d="M88 100 C70 170 76 214 100 226 L132 150Z" fill="${hair}" ${S}/><path d="M232 100 C250 170 244 214 220 226 L188 150Z" fill="${hair}" ${S}/>`);
    o.push(`<rect x="122" y="330" width="32" height="50" rx="8" fill="${C ? C.dark : '#3a3550'}" ${S}/><rect x="166" y="330" width="32" height="50" rx="8" fill="${C ? C.dark : '#3a3550'}" ${S}/>`);
    o.push(`<ellipse cx="136" cy="382" rx="24" ry="11" fill="${C ? (L.costume === 'dragon' ? C.dark : '#1a1d26') : '#7b3f35'}" ${S}/><ellipse cx="184" cy="382" rx="24" ry="11" fill="${C ? (L.costume === 'dragon' ? C.dark : '#1a1d26') : '#7b3f35'}" ${S}/>`);
    o.push(girl && !C ? `<path d="M100 216 Q160 196 220 216 L240 348 Q160 366 80 348Z" fill="${body}" ${S}/>` : `<path d="M100 216 Q160 196 220 216 L226 340 Q160 354 94 340Z" fill="${body}" ${S}/>`);
    if (L.costume === 'dragon') o.push(`<path d="M134 230h52v100q-26 10 -52 0z" fill="${C.light}" ${S}/><path d="M134 256h52M134 282h52M134 306h52" stroke="${INK}" stroke-width="3"/>`);
    if (L.costume === 'raven') o.push(`<path d="M120 250l10 14 10 -14 10 14 10 -14 10 14 10 -14 10 14 10 -14M110 290l12 14 12 -14 12 14 12 -14 12 14 12 -14 12 14 12 -14" fill="none" stroke="${C.light}" stroke-width="4"/>`);
    const sleeve = body;
    o.push(`<path d="M104 226 Q78 268 88 306" fill="none" stroke="${INK}" stroke-width="30" stroke-linecap="round"/><path d="M104 226 Q78 268 88 306" fill="none" stroke="${sleeve}" stroke-width="22" stroke-linecap="round"/>`);
    o.push(`<path d="M216 226 Q242 268 232 306" fill="none" stroke="${INK}" stroke-width="30" stroke-linecap="round"/><path d="M216 226 Q242 268 232 306" fill="none" stroke="${sleeve}" stroke-width="22" stroke-linecap="round"/>`);
    const mitt = C ? (L.costume === 'dragon' ? C.light : C.accent) : '#f2b632';
    o.push(`<circle cx="88" cy="312" r="14" fill="${mitt}" ${S}/><circle cx="232" cy="312" r="14" fill="${mitt}" ${S}/>`);
    if (!C) o.push('<circle cx="160" cy="250" r="6" fill="#fff"/><circle cx="160" cy="280" r="6" fill="#fff"/><circle cx="160" cy="310" r="6" fill="#fff"/>');
    // Kafa
    if (C) { // kapüşon
      o.push(`<path d="M76 140q-4 -96 84 -100q88 4 84 100q2 70 -84 82q-86 -12 -84 -82z" fill="${C.body}" ${S}/>`);
    }
    o.push(`<circle cx="160" cy="${C ? 140 : 132}" r="${C ? 58 : 72}" fill="${L.skin}" ${S}/>`);
    const fy = C ? 8 : 0;
    if (!C) o.push(`<path d="M104 204 Q160 230 216 204 Q218 222 206 226 Q160 244 114 226 Q102 222 104 204Z" fill="#2fa35a" ${S}/><rect x="192" y="220" width="22" height="52" rx="7" fill="#2fa35a" ${S}/>`);
    o.push(`<circle cx="134" cy="${136 + fy}" r="9" fill="#fff" stroke="${INK}" stroke-width="2"/><circle cx="186" cy="${136 + fy}" r="9" fill="#fff" stroke="${INK}" stroke-width="2"/>`);
    o.push(`<circle cx="135" cy="${137 + fy}" r="6.5" fill="${L.eyes}"/><circle cx="187" cy="${137 + fy}" r="6.5" fill="${L.eyes}"/><circle cx="137" cy="${134 + fy}" r="2.4" fill="#fff"/><circle cx="189" cy="${134 + fy}" r="2.4" fill="#fff"/>`);
    o.push(`<ellipse cx="116" cy="${160 + fy}" rx="11" ry="7" fill="#f09a9a" opacity=".6"/><ellipse cx="204" cy="${160 + fy}" rx="11" ry="7" fill="#f09a9a" opacity=".6"/>`);
    o.push(`<path d="M144 ${166 + fy} Q160 ${180 + fy} 176 ${166 + fy}" fill="none" ${S}/>`);
    if (L.costume === 'raven') {
      o.push(`<path d="M138 74q22 -6 44 0l-22 46z" fill="${C.accent}" ${S}/><path d="M138 74q22 8 44 0" fill="none" stroke="${INK}" stroke-width="3"/><circle cx="118" cy="64" r="8" fill="#fff" ${S}/><circle cx="202" cy="64" r="8" fill="#fff" ${S}/><circle cx="119" cy="65" r="4" fill="${INK}"/><circle cx="203" cy="65" r="4" fill="${INK}"/>`);
      o.push(`<path d="M120 40l-10 -24 22 16M160 34l0 -26 12 24M200 40l10 -24 -22 16" fill="${C.body}" ${S}/>`);
    } else if (L.costume === 'dragon') {
      o.push(`<path d="M106 58l-24 -40 40 22z" fill="${C.light}" ${S}/><path d="M214 58l24 -40 -40 22z" fill="${C.light}" ${S}/><path d="M140 44l20 -26 20 26z" fill="${C.accent}" ${S}/>`);
      o.push(`<circle cx="124" cy="72" r="9" fill="#ffd34d" ${S}/><circle cx="196" cy="72" r="9" fill="#ffd34d" ${S}/><path d="M124 66v12M196 66v12" stroke="${INK}" stroke-width="3"/><path d="M110 100q50 -18 100 0" fill="none" stroke="${C.dark}" stroke-width="5"/><path d="M128 104l6 8 6 -8M180 104l6 8 6 -8" fill="#fff" ${S}/>`);
    } else {
      // saç ve bere
      o.push(girl ? `<path d="M96 110 C100 66 220 66 224 110 C196 96 170 88 150 86 C134 100 112 108 96 110Z" fill="${hair}" ${S}/>` : `<path d="M96 112 C92 62 228 62 224 112 C210 92 190 84 170 92 C150 80 120 88 96 112Z" fill="${hair}" ${S}/>`);
      o.push(`<path d="M94 84 C96 34 224 34 226 84 Q160 66 94 84Z" fill="${coat}" ${S}/><rect x="86" y="78" width="148" height="20" rx="10" fill="#fff" ${S}/><circle cx="160" cy="30" r="14" fill="#fff" ${S}/>`);
    }
    o.push('</svg>');
    return o.join('');
  }

  /* ---------- ARKADAN, KOŞARKEN (iki kare) ---------- */
  function back(kind, step, L) {
    const girl = kind === 'girl';
    const coat = girl ? '#e8598c' : '#2f7fd6';
    const hair = L.hair || (girl ? '#8a4a24' : '#3b2a20');
    const C = COST[L.costume];
    const body = C ? C.body : coat;
    const up = step === 0;
    const o = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 400" width="320" height="400"><ellipse cx="160" cy="388" rx="70" ry="10" fill="#000" opacity=".2"/>'];
    const pants = C ? C.dark : '#3a3550';
    const shoe = C ? C.dark : '#7b3f35';
    const leg = (x, lifted) => lifted
      ? `<rect x="${x}" y="326" width="32" height="34" rx="8" fill="${pants}" ${S}/><ellipse cx="${x + 16}" cy="358" rx="19" ry="13" fill="${shoe}" ${S}/><ellipse cx="${x + 16}" cy="358" rx="11" ry="7" fill="#9c6a54"/>`
      : `<rect x="${x}" y="330" width="32" height="50" rx="8" fill="${pants}" ${S}/><ellipse cx="${x + 16}" cy="382" rx="22" ry="10" fill="${shoe}" ${S}/>`;
    o.push(leg(122, up), leg(166, !up));
    if (L.costume === 'dragon') { // kuyruk sallanır
      const sw = up ? 40 : -40;
      o.push(`<path d="M150 320q${sw / 2} 40 ${sw} 56q10 6 18 -2q-${sw / 2 + 10} -20 -6 -56z" fill="${C.body}" ${S}/><path d="M${150 + sw} 372l${sw > 0 ? 14 : -14} 4 -6 10z" fill="${C.accent}" ${S}/>`);
    }
    if (L.costume === 'raven') { // kanatlar çırpınır
      const fl = up ? -26 : 10;
      o.push(`<path d="M110 222q-78 ${fl} -94 ${86 + fl}q30 -14 40 -4q12 -22 30 -16q6 -26 24 -30z" fill="${C.body}" ${S}/><path d="M210 222q78 ${-fl} 94 ${86 - fl}q-30 -14 -40 -4q-12 -22 -30 -16q-6 -26 -24 -30z" fill="${C.body}" ${S}/>`);
    }
    o.push(girl && !C ? `<path d="M100 216 Q160 196 220 216 L240 348 Q160 366 80 348Z" fill="${body}" ${S}/>` : `<path d="M100 216 Q160 196 220 216 L226 340 Q160 354 94 340Z" fill="${body}" ${S}/>`);
    o.push('<path d="M160 230 L160 330" stroke="#000" stroke-opacity=".15" stroke-width="4"/>');
    if (L.costume === 'dragon') { // sırt dikenleri
      o.push(`<path d="M160 214l-14 18 14 6 -14 22 14 6 -14 22 14 6 -14 22h28l-14 -22 14 -6 -14 -22 14 -6 -14 -22 14 -6z" fill="${C.accent}" ${S}/>`);
    }
    if (L.costume === 'raven') {
      o.push(`<path d="M110 270l12 16 12 -16 12 16 12 -16 12 16 12 -16 12 16 12 -16 12 16 12 -16M104 310l14 16 14 -16 14 16 14 -16 14 16 14 -16 14 16 14 -16 14 16 14 -16" fill="none" stroke="${C.light}" stroke-width="4"/>`);
    }
    const arm = (side, fwd) => {
      const sx = side < 0 ? 104 : 216;
      const d = fwd ? `M${sx} 226 Q${sx + side * 20} 250 ${sx + side * 14} 276` : `M${sx} 226 Q${sx + side * 30} 276 ${sx + side * 22} 318`;
      const hx = sx + side * (fwd ? 14 : 22), hy = fwd ? 280 : 324;
      const mitt = C ? (L.costume === 'dragon' ? C.light : C.accent) : '#f2b632';
      return `<path d="${d}" fill="none" stroke="${INK}" stroke-width="30" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${body}" stroke-width="22" stroke-linecap="round"/><circle cx="${hx}" cy="${hy}" r="${fwd ? 13 : 14}" fill="${mitt}" ${S}/>`;
    };
    o.push(arm(-1, !up), arm(1, up));
    if (C) {
      o.push(`<path d="M76 140q-4 -96 84 -100q88 4 84 100q2 70 -84 82q-86 -12 -84 -82z" fill="${C.body}" ${S}/>`);
      if (L.costume === 'raven') o.push(`<path d="M120 40l-10 -24 22 16M160 34l0 -26 12 24M200 40l10 -24 -22 16" fill="${C.body}" ${S}/><path d="M110 120q50 30 100 0" fill="none" stroke="${C.light}" stroke-width="4"/>`);
      else o.push(`<path d="M106 58l-24 -40 40 22z" fill="${C.light}" ${S}/><path d="M214 58l24 -40 -40 22z" fill="${C.light}" ${S}/><path d="M160 40l-12 22h24zM160 80l-12 22h24zM160 120l-12 22h24z" fill="${C.accent}" ${S}/>`);
    } else {
      o.push(`<circle cx="160" cy="132" r="72" fill="${hair}" ${S}/>`);
      o.push(`<ellipse cx="88" cy="138" rx="10" ry="15" fill="${L.skin}" ${S}/><ellipse cx="232" cy="138" rx="10" ry="15" fill="${L.skin}" ${S}/>`);
      o.push('<path d="M126 120 Q140 150 132 186 M168 118 Q178 160 170 196 M196 124 Q204 150 198 178" fill="none" stroke="#000" stroke-opacity=".18" stroke-width="5" stroke-linecap="round"/>');
      if (girl) { const sw = up ? 12 : -12; o.push(`<path d="M140 180 Q${160 + sw} 250 ${150 + sw * 2} 286 Q${170 + sw * 2} 280 ${176 + sw} 246 Q180 210 182 180Z" fill="${hair}" ${S}/>`); }
      o.push(`<path d="M104 204 Q160 230 216 204 Q218 222 206 226 Q160 244 114 226 Q102 222 104 204Z" fill="#2fa35a" ${S}/>`);
      const tt = up ? 10 : -10;
      o.push(`<path d="M150 226 L${140 + tt} 282 L${164 + tt} 286 L172 228Z" fill="#2fa35a" ${S}/>`);
      o.push(`<path d="M94 84 C96 34 224 34 226 84 Q160 66 94 84Z" fill="${coat}" ${S}/><rect x="86" y="78" width="148" height="20" rx="10" fill="#fff" ${S}/><circle cx="${160 - tt * 0.6}" cy="30" r="14" fill="#fff" ${S}/>`);
    }
    o.push('</svg>');
    return o.join('');
  }

  // 'avatar.boy', 'avatar.girl_run2' → data: adresi. Aynı görünüş için önbellekten.
  function url(name, lookOverride) {
    const L = lookOverride || look();
    const [kind, frame] = name.split('_');
    const key = name + '|' + L.skin + L.eyes + L.hair + L.costume;
    if (cache[key]) return cache[key];
    const svg = frame ? back(kind, frame === 'run1' ? 0 : 1, L) : front(kind, L);
    cache[key] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    return cache[key];
  }

  // Komşu botlar için rastgele ama sabit bir görünüş.
  function botLook(seed) {
    const r = n => Math.abs(Math.sin(seed * 9301 + n * 49297)) % 1;
    const pick = (kind, n) => CZ.LOOKS[kind][Math.floor(r(n) * CZ.LOOKS[kind].length)].c;
    const cs = r(7);
    return { skin: pick('skin', 1) || '#f6d2ae', eyes: pick('eyes', 2), hair: pick('hair', 3), costume: cs < 0.18 ? 'raven' : cs < 0.32 ? 'dragon' : 'none' };
  }

  return { url, look, botLook };
})();
