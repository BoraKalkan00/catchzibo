// Oyuncu karakteri (Duolingo tarzı): yüz şekli, saç modeli ve rengi, göz, kaş, ağız, aksesuar, şapka, ten, kostüm.
// JS ile çizilir; önden (menüler) ve arkadan koşarken (kovalamaca, Altın Avı) aynı karakter görünür.
// CZ.art('avatar.boy'), 'avatar.girl_run1' gibi anahtarlar buradan gelir. Fiyatlar elmas.
CZ.LOOKS = {
  face: [{ id: 'round', price: 0 }, { id: 'oval', price: 0 }, { id: 'wide', price: 10 }, { id: 'square', price: 10 }],
  style: [
    { id: 'auto', price: 0 }, { id: 'short', price: 0 }, { id: 'bob', price: 0 }, { id: 'spiky', price: 20 }, { id: 'curly', price: 20 },
    { id: 'long', price: 25 }, { id: 'pony', price: 25 }, { id: 'buns', price: 30 }, { id: 'mohawk', price: 40 }, { id: 'bald', price: 15 }],
  hair: [
    { id: 'h0', c: null, price: 0 }, { id: 'h1', c: '#3b2a20', price: 15 }, { id: 'h2', c: '#8a4a24', price: 15 },
    { id: 'h3', c: '#e0b04a', price: 15 }, { id: 'h4', c: '#c2362f', price: 15 }, { id: 'h5', c: '#2b2f3b', price: 15 },
    { id: 'h6', c: '#e8598c', price: 30 }, { id: 'h7', c: '#4fa3e8', price: 30 }, { id: 'h8', c: '#f4f6fa', price: 30 }, { id: 'h9', c: '#59c26a', price: 30 }],
  eyestyle: [{ id: 'dot', price: 0 }, { id: 'big', price: 10 }, { id: 'happy', price: 10 }, { id: 'sleepy', price: 10 }, { id: 'lash', price: 15 }],
  eyes: [
    { id: 'e1', c: '#33211f', price: 0 }, { id: 'e2', c: '#2f7fd6', price: 10 }, { id: 'e3', c: '#2fa35a', price: 10 },
    { id: 'e4', c: '#8a5631', price: 10 }, { id: 'e5', c: '#7b4bb3', price: 10 }, { id: 'e6', c: '#d8363a', price: 25 }],
  brows: [{ id: 'none', price: 0 }, { id: 'soft', price: 0 }, { id: 'thick', price: 10 }, { id: 'angry', price: 10 }, { id: 'raised', price: 10 }],
  mouth: [{ id: 'smile', price: 0 }, { id: 'grin', price: 10 }, { id: 'open', price: 10 }, { id: 'tongue', price: 15 }, { id: 'smirk', price: 15 }],
  extra: [{ id: 'none', price: 0 }, { id: 'freckles', price: 10 }, { id: 'glasses', price: 20 }, { id: 'sun', price: 30 }, { id: 'mustache', price: 25 }],
  hat: [{ id: 'none', price: 0 }, { id: 'beanie', price: 0 }, { id: 'ears', price: 25 }, { id: 'crown', price: 120 }],
  skin: [
    { id: 's1', c: '#f6d2ae', price: 0 }, { id: 's2', c: '#ecc29a', price: 0 }, { id: 's3', c: '#d9a57a', price: 0 },
    { id: 's4', c: '#b77e55', price: 0 }, { id: 's5', c: '#8d5a3b', price: 0 }, { id: 's6', c: '#5e3a26', price: 0 },
    { id: 'gob', c: '#8fd16a', price: 60 }],
  costume: [{ id: 'none', price: 0 }, { id: 'raven', price: 150 }, { id: 'dragon', price: 250 }]
};
// Gardırop sekmeleri (sırasıyla)
CZ.LOOK_TABS = ['face', 'style', 'hair', 'eyestyle', 'eyes', 'brows', 'mouth', 'extra', 'hat', 'skin', 'costume'];

CZ.avatarArt = (function () {
  const INK = '#33211f';
  const S = `stroke="${INK}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"`;
  const S3 = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
  const cache = {};

  // id'lerden çizim bilgisine: { face:'round', hair:'#..', ... }
  function resolve(ids, kind) {
    const l = ids || {};
    const get = k => CZ.LOOKS[k].find(x => x.id === l[k]) || CZ.LOOKS[k][0];
    let style = get('style').id;
    if (style === 'auto') style = kind === 'girl' ? 'bob' : 'short';
    return {
      face: get('face').id, style, hair: get('hair').c || (kind === 'girl' ? '#8a4a24' : '#3b2a20'),
      eyestyle: get('eyestyle').id, eyes: get('eyes').c, brows: get('brows').id, mouth: get('mouth').id,
      extra: get('extra').id, hat: get('hat').id, skin: get('skin').c, costume: get('costume').id
    };
  }
  const mine = () => CZ.state.data.look || {};

  const COST = {
    raven: { body: '#2b2f3b', dark: '#1a1d26', light: '#4a5163', accent: '#f2b632' },
    dragon: { body: '#3f9a52', dark: '#2a6e3a', light: '#f2d36b', accent: '#d8363a' }
  };

  /* ---------- Kafa ---------- */
  // Yüz şekli: saç ve şapka yuvarlak kafaya göre çizilir, sonra bu ölçüyle şekle uydurulur.
  const SHAPE = { round: [1, 1], oval: [0.89, 1.06], wide: [1.11, 0.92], square: [0.95, 0.98] };
  const fit = (face, svg) => {
    const [sx, sy] = SHAPE[face] || SHAPE.round;
    return sx === 1 && sy === 1 ? svg : `<g transform="translate(160 132) scale(${sx} ${sy}) translate(-160 -132)">${svg}</g>`;
  };
  function headShape(face, fill) {
    if (face === 'square') return `<rect x="92" y="62" width="136" height="140" rx="40" fill="${fill}" ${S}/>`;
    const [sx, sy] = SHAPE[face] || SHAPE.round;
    return `<ellipse cx="160" cy="132" rx="${72 * sx}" ry="${72 * sy}" fill="${fill}" ${S}/>`;
  }
  const earX = face => 160 + 72 * (SHAPE[face] || SHAPE.round)[0];

  // Saç: önden (kafanın arkası + üstü), arkadan (tüm saç).
  function hairFrontBack(style, c) { // kafanın arkasında kalan uzun kısımlar
    if (style === 'bob') return `<path d="M88 100 C70 170 76 214 100 226 L132 150Z" fill="${c}" ${S}/><path d="M232 100 C250 170 244 214 220 226 L188 150Z" fill="${c}" ${S}/>`;
    if (style === 'long') return `<path d="M86 104 C66 200 74 252 98 266 L222 266 C246 252 254 200 234 104 Z" fill="${c}" ${S}/>`;
    if (style === 'pony') return `<path d="M214 92 C262 104 268 170 240 214 C236 182 228 150 206 124Z" fill="${c}" ${S}/>`;
    if (style === 'buns') return `<circle cx="104" cy="70" r="24" fill="${c}" ${S}/><circle cx="216" cy="70" r="24" fill="${c}" ${S}/>`;
    if (style === 'curly') return [[90, 110], [84, 140], [92, 168], [230, 110], [236, 140], [228, 168]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="16" fill="${c}" ${S}/>`).join('');
    return '';
  }
  function hairFrontTop(style, c) { // kafanın üstünde
    switch (style) {
      case 'short': return `<path d="M96 112 C92 62 228 62 224 112 C210 92 190 84 170 92 C150 80 120 88 96 112Z" fill="${c}" ${S}/>`;
      case 'bob': return `<path d="M96 110 C100 66 220 66 224 110 C196 96 170 88 150 86 C134 100 112 108 96 110Z" fill="${c}" ${S}/>`;
      case 'spiky': return `<path d="M92 118 L96 72 L114 86 L122 48 L142 76 L160 36 L178 76 L198 48 L206 86 L224 72 L228 118 C210 96 190 90 160 94 C130 90 110 96 92 118Z" fill="${c}" ${S}/>`;
      case 'curly': return `<path d="M90 122 C86 60 234 60 230 122 C200 100 120 100 90 122Z" fill="${c}" ${S}/>` + [[100, 84], [122, 64], [148, 54], [174, 54], [200, 64], [220, 84]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="18" fill="${c}" ${S}/>`).join('');
      case 'long': return `<path d="M94 118 C94 60 226 60 226 118 C206 92 178 84 160 98 C142 84 114 92 94 118Z" fill="${c}" ${S}/>`;
      case 'pony': return `<path d="M94 112 C96 62 224 62 226 112 C200 94 176 86 160 90 C140 86 116 96 94 112Z" fill="${c}" ${S}/>`;
      case 'buns': return `<path d="M96 110 C100 64 220 64 224 110 C190 92 130 92 96 110Z" fill="${c}" ${S}/>`;
      case 'mohawk': return `<path d="M144 108 L138 68 L150 34 L160 54 L170 30 L182 66 L176 108 C166 102 154 102 144 108Z" fill="${c}" ${S}/>`;
      default: return '';
    }
  }
  function hairBack(style, c, skin, up) { // arkadan bakınca
    const strands = '<path d="M126 120 Q140 150 132 186 M168 118 Q178 160 170 196 M196 124 Q204 150 198 178" fill="none" stroke="#000" stroke-opacity=".18" stroke-width="5" stroke-linecap="round"/>';
    const cap = `<circle cx="160" cy="132" r="72" fill="${c}" ${S}/>` + strands;
    const sw = up ? 12 : -12;
    switch (style) {
      case 'bald': return `<circle cx="160" cy="132" r="72" fill="${skin}" ${S}/>`;
      case 'mohawk': return `<circle cx="160" cy="132" r="72" fill="${skin}" ${S}/><path d="M144 196 L144 70 L150 34 L160 54 L170 30 L176 70 L176 196 C168 204 152 204 144 196Z" fill="${c}" ${S}/>`;
      case 'spiky': return `<path d="M88 132 L92 72 L114 86 L122 48 L142 76 L160 36 L178 76 L198 48 L206 86 L228 72 L232 132 A72 72 0 0 1 88 132Z" fill="${c}" ${S}/>` + strands;
      case 'curly': return cap + [[96, 90], [118, 66], [146, 56], [174, 56], [202, 66], [224, 90], [90, 130], [230, 130]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="18" fill="${c}" ${S}/>`).join('');
      case 'buns': return cap + `<circle cx="104" cy="70" r="24" fill="${c}" ${S}/><circle cx="216" cy="70" r="24" fill="${c}" ${S}/>`;
      default: return cap;
    }
  }
  function hairBackOver(style, c, up) { // sırtın üstüne düşen saç (gövdeden sonra çizilir)
    const sw = up ? 12 : -12;
    if (style === 'long') return `<path d="M92 140 C84 220 94 256 108 266 L212 266 C226 256 236 220 228 140Z" fill="${c}" ${S}/><path d="M140 180v80M180 180v80" stroke="#000" stroke-opacity=".15" stroke-width="5"/>`;
    if (style === 'pony' || style === 'bob') return `<path d="M140 180 Q${160 + sw} 250 ${150 + sw * 2} 286 Q${170 + sw * 2} 280 ${176 + sw} 246 Q180 210 182 180Z" fill="${c}" ${S}/>`;
    return '';
  }

  // Şapka (önden / arkadan aynı çizilir; kostümde gizlenir)
  function hatSvg(hat, coat, up) {
    const pom = up === undefined ? 160 : 160 - (up ? 6 : -6);
    if (hat === 'beanie') return `<path d="M94 84 C96 34 224 34 226 84 Q160 66 94 84Z" fill="${coat}" ${S}/><rect x="86" y="78" width="148" height="20" rx="10" fill="#fff" ${S}/><circle cx="${pom}" cy="30" r="14" fill="#fff" ${S}/>`;
    if (hat === 'ears') return `<path d="M84 140 C84 40 236 40 236 140" fill="none" stroke="${INK}" stroke-width="12"/><path d="M84 140 C84 40 236 40 236 140" fill="none" stroke="${coat}" stroke-width="6"/><circle cx="84" cy="144" r="22" fill="#f4f6fa" ${S}/><circle cx="236" cy="144" r="22" fill="#f4f6fa" ${S}/>`;
    if (hat === 'crown') return `<path d="M110 76 L106 30 L134 52 L160 22 L186 52 L214 30 L210 76Z" fill="#f2c94c" ${S}/><circle cx="160" cy="48" r="6" fill="#d8363a" ${S3}/><circle cx="128" cy="60" r="4" fill="#4fa3e8"/><circle cx="192" cy="60" r="4" fill="#59c26a"/>`;
    return '';
  }

  // Yüz parçaları
  function eyesSvg(st, c, skin) {
    const one = (x, side) => {
      const y = 136;
      switch (st) {
        case 'big': return `<circle cx="${x}" cy="${y}" r="12" fill="#fff" stroke="${INK}" stroke-width="2"/><circle cx="${x + 1}" cy="${y + 1}" r="9" fill="${c}"/><circle cx="${x + 4}" cy="${y - 3}" r="3.4" fill="#fff"/><circle cx="${x - 2}" cy="${y + 4}" r="1.6" fill="#fff"/>`;
        case 'happy': return `<path d="M${x - 10} ${y + 3} Q${x} ${y - 10} ${x + 10} ${y + 3}" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`;
        case 'sleepy': return `<circle cx="${x}" cy="${y}" r="9" fill="#fff" stroke="${INK}" stroke-width="2"/><circle cx="${x + 1}" cy="${y + 2}" r="6" fill="${c}"/><path d="M${x - 10} ${y} A10 10 0 0 1 ${x + 10} ${y}Z" fill="${skin}" stroke="${INK}" stroke-width="2.5"/>`;
        case 'lash': return `<circle cx="${x}" cy="${y}" r="9" fill="#fff" stroke="${INK}" stroke-width="2"/><circle cx="${x + 1}" cy="${y + 1}" r="6.5" fill="${c}"/><circle cx="${x + 3}" cy="${y - 2}" r="2.4" fill="#fff"/><path d="M${x + side * 8} ${y - 6}l${side * 6} -5M${x + side * 3} ${y - 9}l${side * 3} -6" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>`;
        default: return `<circle cx="${x}" cy="${y}" r="9" fill="#fff" stroke="${INK}" stroke-width="2"/><circle cx="${x + 1}" cy="${y + 1}" r="6.5" fill="${c}"/><circle cx="${x + 3}" cy="${y - 2}" r="2.4" fill="#fff"/>`;
      }
    };
    return one(134, -1) + one(186, 1);
  }
  function browsSvg(b, c) {
    if (b === 'soft') return `<path d="M122 118 Q134 112 146 118M174 118 Q186 112 198 118" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`;
    if (b === 'thick') return `<path d="M120 118 Q134 108 148 116M172 116 Q186 108 200 118" fill="none" stroke="${c}" stroke-width="8" stroke-linecap="round"/>`;
    if (b === 'angry') return `<path d="M122 112 L148 122M198 112 L172 122" stroke="${c}" stroke-width="6" stroke-linecap="round"/>`;
    if (b === 'raised') return `<path d="M122 112 Q134 100 146 110M174 110 Q186 100 198 112" fill="none" stroke="${c}" stroke-width="4.5" stroke-linecap="round"/>`;
    return '';
  }
  function mouthSvg(m) {
    if (m === 'grin') return `<path d="M140 164 Q160 194 180 164Z" fill="#fff" ${S3}/><path d="M144 168h32" stroke="${INK}" stroke-width="1.5"/>`;
    if (m === 'open') return `<ellipse cx="160" cy="172" rx="9" ry="11" fill="#8f2b2b" ${S3}/><ellipse cx="160" cy="178" rx="5" ry="4" fill="#f37a8a"/>`;
    if (m === 'tongue') return `<path d="M142 166 Q160 182 178 166" fill="none" ${S3}/><path d="M154 174 q6 14 12 0z" fill="#f37a8a" ${S3}/>`;
    if (m === 'smirk') return `<path d="M146 172 Q166 178 178 162" fill="none" ${S3}/>`;
    return `<path d="M144 166 Q160 180 176 166" fill="none" ${S}/>`;
  }
  function extraSvg(e) {
    if (e === 'freckles') return [[112, 154], [120, 160], [106, 162], [208, 154], [200, 160], [214, 162]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="#b4673e"/>`).join('');
    if (e === 'glasses') return `<circle cx="134" cy="136" r="17" fill="#fff" fill-opacity=".15" stroke="${INK}" stroke-width="4"/><circle cx="186" cy="136" r="17" fill="#fff" fill-opacity=".15" stroke="${INK}" stroke-width="4"/><path d="M151 134 Q160 128 169 134M117 132 L94 124M203 132 L226 124" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`;
    if (e === 'sun') return `<rect x="112" y="124" width="42" height="24" rx="10" fill="#1d2230" ${S3}/><rect x="166" y="124" width="42" height="24" rx="10" fill="#1d2230" ${S3}/><path d="M154 132h12M112 130 L94 124M208 130 L226 124" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><path d="M120 130l10 -2M174 130l10 -2" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>`;
    if (e === 'mustache') return `<path d="M160 160 C150 150 128 154 124 168 C136 164 148 168 160 164 C172 168 184 164 196 168 C192 154 170 150 160 160Z" fill="#3b2a20" ${S3}/>`;
    return '';
  }

  /* ---------- ÖNDEN ---------- */
  function front(kind, L) {
    const girl = kind === 'girl';
    const coat = girl ? '#e8598c' : '#2f7fd6';
    const C = COST[L.costume];
    const body = C ? C.body : coat;
    const o = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 400" width="320" height="400">', '<ellipse cx="160" cy="388" rx="84" ry="12" fill="#000" opacity=".2"/>'];
    if (L.costume === 'dragon') o.push(`<path d="M214 330q70 10 76 -40q4 -20 -10 -30q4 30 -20 40q-24 10 -50 6z" fill="${C.body}" ${S}/><path d="M282 262l12 -14 4 18z" fill="${C.accent}" ${S}/>`);
    if (L.costume === 'raven') o.push(`<path d="M100 226q-70 10 -80 90q30 -20 40 -10q10 -24 30 -20q4 -30 20 -36z" fill="${C.body}" ${S}/><path d="M220 226q70 10 80 90q-30 -20 -40 -10q-10 -24 -30 -20q-4 -30 -20 -36z" fill="${C.body}" ${S}/>`);
    if (!C) o.push(fit(L.face, hairFrontBack(L.style, L.hair)));
    const dark = C ? C.dark : '#3a3550';
    const shoe = C ? (L.costume === 'dragon' ? C.dark : '#1a1d26') : '#7b3f35';
    o.push(`<rect x="122" y="330" width="32" height="50" rx="8" fill="${dark}" ${S}/><rect x="166" y="330" width="32" height="50" rx="8" fill="${dark}" ${S}/>`);
    o.push(`<ellipse cx="136" cy="382" rx="24" ry="11" fill="${shoe}" ${S}/><ellipse cx="184" cy="382" rx="24" ry="11" fill="${shoe}" ${S}/>`);
    o.push(girl && !C ? `<path d="M100 216 Q160 196 220 216 L240 348 Q160 366 80 348Z" fill="${body}" ${S}/>` : `<path d="M100 216 Q160 196 220 216 L226 340 Q160 354 94 340Z" fill="${body}" ${S}/>`);
    if (L.costume === 'dragon') o.push(`<path d="M134 230h52v100q-26 10 -52 0z" fill="${C.light}" ${S}/><path d="M134 256h52M134 282h52M134 306h52" stroke="${INK}" stroke-width="3"/>`);
    if (L.costume === 'raven') o.push(`<path d="M120 250l10 14 10 -14 10 14 10 -14 10 14 10 -14 10 14 10 -14M110 290l12 14 12 -14 12 14 12 -14 12 14 12 -14 12 14 12 -14" fill="none" stroke="${C.light}" stroke-width="4"/>`);
    o.push(`<path d="M104 226 Q78 268 88 306" fill="none" stroke="${INK}" stroke-width="30" stroke-linecap="round"/><path d="M104 226 Q78 268 88 306" fill="none" stroke="${body}" stroke-width="22" stroke-linecap="round"/>`);
    o.push(`<path d="M216 226 Q242 268 232 306" fill="none" stroke="${INK}" stroke-width="30" stroke-linecap="round"/><path d="M216 226 Q242 268 232 306" fill="none" stroke="${body}" stroke-width="22" stroke-linecap="round"/>`);
    const mitt = C ? (L.costume === 'dragon' ? C.light : C.accent) : '#f2b632';
    o.push(`<circle cx="88" cy="312" r="14" fill="${mitt}" ${S}/><circle cx="232" cy="312" r="14" fill="${mitt}" ${S}/>`);
    if (!C) o.push('<circle cx="160" cy="250" r="6" fill="#fff"/><circle cx="160" cy="280" r="6" fill="#fff"/><circle cx="160" cy="310" r="6" fill="#fff"/>');
    if (C) o.push(`<path d="M76 140q-4 -96 84 -100q88 4 84 100q2 70 -84 82q-86 -12 -84 -82z" fill="${C.body}" ${S}/>`);
    // kulaklar + kafa
    if (!C) { const ex = earX(L.face); o.push(`<ellipse cx="${320 - ex}" cy="142" rx="10" ry="14" fill="${L.skin}" ${S}/><ellipse cx="${ex}" cy="142" rx="10" ry="14" fill="${L.skin}" ${S}/>`); }
    o.push(C ? `<circle cx="160" cy="140" r="58" fill="${L.skin}" ${S}/>` : headShape(L.face, L.skin));
    if (!C) o.push(`<path d="M104 204 Q160 230 216 204 Q218 222 206 226 Q160 244 114 226 Q102 222 104 204Z" fill="#2fa35a" ${S}/><rect x="192" y="220" width="22" height="52" rx="7" fill="#2fa35a" ${S}/>`);
    const face = [
      `<ellipse cx="116" cy="158" rx="11" ry="7" fill="#f09a9a" opacity=".6"/><ellipse cx="204" cy="158" rx="11" ry="7" fill="#f09a9a" opacity=".6"/>`,
      eyesSvg(L.eyestyle, L.eyes, L.skin), browsSvg(L.brows, C ? INK : L.hair), mouthSvg(L.mouth), extraSvg(L.extra)
    ].join('');
    o.push(C ? `<g transform="translate(0 6)">${face}</g>` : face);
    if (L.costume === 'raven') {
      o.push(`<path d="M138 74q22 -6 44 0l-22 46z" fill="${C.accent}" ${S}/><path d="M138 74q22 8 44 0" fill="none" stroke="${INK}" stroke-width="3"/><circle cx="118" cy="64" r="8" fill="#fff" ${S}/><circle cx="202" cy="64" r="8" fill="#fff" ${S}/><circle cx="119" cy="65" r="4" fill="${INK}"/><circle cx="203" cy="65" r="4" fill="${INK}"/>`);
      o.push(`<path d="M120 40l-10 -24 22 16M160 34l0 -26 12 24M200 40l10 -24 -22 16" fill="${C.body}" ${S}/>`);
    } else if (L.costume === 'dragon') {
      o.push(`<path d="M106 58l-24 -40 40 22z" fill="${C.light}" ${S}/><path d="M214 58l24 -40 -40 22z" fill="${C.light}" ${S}/><path d="M140 44l20 -26 20 26z" fill="${C.accent}" ${S}/>`);
      o.push(`<circle cx="124" cy="72" r="9" fill="#ffd34d" ${S}/><circle cx="196" cy="72" r="9" fill="#ffd34d" ${S}/><path d="M124 66v12M196 66v12" stroke="${INK}" stroke-width="3"/><path d="M128 104l6 8 6 -8M180 104l6 8 6 -8" fill="#fff" ${S}/>`);
    } else {
      o.push(fit(L.face, (L.hat === 'beanie' && ['spiky', 'mohawk', 'buns', 'curly'].includes(L.style) ? hairFrontTop('short', L.hair) : hairFrontTop(L.style, L.hair)) + hatSvg(L.hat, coat)));
    }
    o.push('</svg>');
    return o.join('');
  }

  /* ---------- ARKADAN, KOŞARKEN (iki kare) ---------- */
  function back(kind, step, L) {
    const girl = kind === 'girl';
    const coat = girl ? '#e8598c' : '#2f7fd6';
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
    if (L.costume === 'dragon') {
      const sw = up ? 40 : -40;
      o.push(`<path d="M150 320q${sw / 2} 40 ${sw} 56q10 6 18 -2q-${sw / 2 + 10} -20 -6 -56z" fill="${C.body}" ${S}/><path d="M${150 + sw} 372l${sw > 0 ? 14 : -14} 4 -6 10z" fill="${C.accent}" ${S}/>`);
    }
    if (L.costume === 'raven') {
      const fl = up ? -26 : 10;
      o.push(`<path d="M110 222q-78 ${fl} -94 ${86 + fl}q30 -14 40 -4q12 -22 30 -16q6 -26 24 -30z" fill="${C.body}" ${S}/><path d="M210 222q78 ${-fl} 94 ${86 - fl}q-30 -14 -40 -4q-12 -22 -30 -16q-6 -26 -24 -30z" fill="${C.body}" ${S}/>`);
    }
    o.push(girl && !C ? `<path d="M100 216 Q160 196 220 216 L240 348 Q160 366 80 348Z" fill="${body}" ${S}/>` : `<path d="M100 216 Q160 196 220 216 L226 340 Q160 354 94 340Z" fill="${body}" ${S}/>`);
    o.push('<path d="M160 230 L160 330" stroke="#000" stroke-opacity=".15" stroke-width="4"/>');
    if (L.costume === 'dragon') o.push(`<path d="M160 214l-14 18 14 6 -14 22 14 6 -14 22 14 6 -14 22h28l-14 -22 14 -6 -14 -22 14 -6 -14 -22 14 -6z" fill="${C.accent}" ${S}/>`);
    if (L.costume === 'raven') o.push(`<path d="M110 270l12 16 12 -16 12 16 12 -16 12 16 12 -16 12 16 12 -16 12 16 12 -16M104 310l14 16 14 -16 14 16 14 -16 14 16 14 -16 14 16 14 -16 14 16 14 -16" fill="none" stroke="${C.light}" stroke-width="4"/>`);
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
      const ex = earX(L.face);
      o.push(`<ellipse cx="${320 - ex}" cy="140" rx="10" ry="15" fill="${L.skin}" ${S}/><ellipse cx="${ex}" cy="140" rx="10" ry="15" fill="${L.skin}" ${S}/>`);
      const hidden = L.hat === 'beanie' && ['spiky', 'mohawk', 'buns', 'curly'].includes(L.style) ? 'short' : L.style;
      o.push(fit(L.face, hairBack(hidden, L.hair, L.skin, up)));
      o.push(`<path d="M104 204 Q160 230 216 204 Q218 222 206 226 Q160 244 114 226 Q102 222 104 204Z" fill="#2fa35a" ${S}/>`);
      const tt = up ? 10 : -10;
      o.push(`<path d="M150 226 L${140 + tt} 282 L${164 + tt} 286 L172 228Z" fill="#2fa35a" ${S}/>`);
      o.push(fit(L.face, hairBackOver(L.style, L.hair, up)));
      o.push(fit(L.face, hatSvg(L.hat, coat, up)));
    }
    o.push('</svg>');
    return o.join('');
  }

  // 'avatar.boy', 'avatar.girl_run2' → data: adresi. ids verilmezse oyuncunun görünüşü.
  function url(name, ids) {
    const [kind, frame] = name.split('_');
    const L = resolve(ids || mine(), kind);
    const key = name + '|' + Object.values(L).join(',');
    if (cache[key]) return cache[key];
    const svg = frame ? back(kind, frame === 'run1' ? 0 : 1, L) : front(kind, L);
    cache[key] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    return cache[key];
  }

  // Komşu botlar için rastgele ama sabit bir görünüş (id'ler).
  function botLook(seed) {
    const r = n => { const x = Math.sin(seed * 9301 + n * 49297) * 10000; return x - Math.floor(x); };
    const ids = {};
    CZ.LOOK_TABS.forEach((k, i) => {
      if (k === 'costume') return;
      const list = CZ.LOOKS[k];
      ids[k] = list[Math.floor(r(i + 1) * list.length)].id;
    });
    const cs = r(31);
    ids.costume = cs < 0.18 ? 'raven' : cs < 0.32 ? 'dragon' : 'none';
    if (r(37) < 0.5) ids.hat = 'beanie';
    return ids;
  }

  return { url, resolve, botLook };
})();
