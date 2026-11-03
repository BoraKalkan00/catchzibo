// KARAKTER ÇİZİCİ (Bitmoji tarzı, 2D, gölgeli). Önden (menü, ev, mahalle) ve arkadan koşarken (kovalamaca, Altın Avı).
// Kız ve erkek yüz hatları, vücut ve saç modelleri farklı. Katalog: js/data/looks.js
CZ.avatarArt = (function () {
  const INK = '#2c1e1c';
  const cx = 160;
  const cache = {};
  const st = (w, extra) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"${extra || ''}`;
  const S4 = st(4), S3 = st(3), S2 = st(2);

  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    const f = v => Math.max(0, Math.min(255, Math.round(k >= 1 ? v + (255 - v) * (k - 1) : v * k)));
    return '#' + ((1 << 24) + (f(n >> 16) << 16) + (f((n >> 8) & 255) << 8) + f(n & 255)).toString(16).slice(1);
  }
  const P = CZ.PALETTE;

  /* ---------- Görünüşü tamamla ---------- */
  function resolve(raw, kind) {
    const girl = kind === 'girl';
    const def = CZ.LOOK_DEFAULT[girl ? 'girl' : 'boy'];
    const L = Object.assign({}, def, raw || {});
    // Cinsiyete uymayan parça varsayılana döner (kız saçı erkekte vb.).
    Object.keys(CZ.CATALOG).forEach(cat => {
      const item = CZ.CATALOG[cat].find(x => x.id === L[cat]);
      if (!item || (item.g && item.g !== kind)) L[cat] = def[cat];
    });
    L.girl = girl;
    L.skinC = P.skin[L.skin] || P.skin[1];
    L.hairC = P.hair[L.hairColor] || P.hair[1];
    L.eyeC = P.eyes[L.eyeColor] || P.eyes[0];
    L.topC = P.cloth[L.topColor] || P.cloth[1];
    L.botC = P.cloth[L.bottomColor] || P.cloth[1];
    L.shoeC = P.cloth[L.shoeColor] || P.cloth[7];
    if (L.costume === 'santa') L.hat = 'santa';
    return L;
  }

  /* ---------- Ölçüler ---------- */
  const FACES = { round: [60, 46, 62], oval: [55, 38, 68], heart: [60, 30, 64], square: [58, 50, 60], long: [52, 40, 72] };
  function geo(L) {
    const Hm = { short: 0.9, mid: 1, tall: 1.08 }[L.height] || 1;
    const Bm = { slim: 0.86, mid: 1, broad: 1.18 }[L.body] || 1;
    const ankle = 374;
    const hip = ankle - 78 * Hm;
    const sh = hip - 86 * Hm;
    const hy = sh - 72;
    const f = FACES[L.face] || FACES.round;
    const w = f[0], j = f[1] + (L.girl ? -5 : 5), c = f[2] + (L.girl ? 2 : -1);
    return {
      Hm, Bm, ankle, hip, sh, hy, w, j, c,
      sw: (L.girl ? 41 : 48) * Bm, ww: (L.girl ? 32 : 40) * Bm, hw: (L.girl ? 44 : 41) * Bm,
      aw: (L.top === 'puffer' && L.costume === 'none' ? 27 : 22) * Bm
    };
  }
  const headPath = (g, y) => {
    const { w, j, c } = g, t = 66, cy = y === undefined ? g.hy : y;
    return `M${cx} ${cy - t}C${cx + w * 0.62} ${cy - t} ${cx + w} ${cy - t * 0.55} ${cx + w} ${cy - 8}C${cx + w} ${cy + 18} ${cx + j + 10} ${cy + c * 0.55} ${cx + j} ${cy + c * 0.74}C${cx + j * 0.55} ${cy + c * 0.96} ${cx + 14} ${cy + c} ${cx} ${cy + c}C${cx - 14} ${cy + c} ${cx - j * 0.55} ${cy + c * 0.96} ${cx - j} ${cy + c * 0.74}C${cx - j - 10} ${cy + c * 0.55} ${cx - w} ${cy + 18} ${cx - w} ${cy - 8}C${cx - w} ${cy - t * 0.55} ${cx - w * 0.62} ${cy - t} ${cx} ${cy - t}Z`;
  };
  // Saç ve şapka 58 genişliğindeki kafaya göre çizilir; yüz şekline göre genişletilir.
  const onHead = (g, svg) => `<g transform="translate(${cx} ${g.hy}) scale(${(g.w / 58).toFixed(3)} 1)">${svg}</g>`;

  /* ================= SAÇ ================= */
  // Dönen değerler: back (kafanın arkasında), front (alnın üstünde), tall (şapka altında gizlenecek tepe)
  function hairFront(style, c) {
    const hl = shade(c, 1.35), dk = shade(c, 0.72);
    const tex = d => `<path d="${d}" fill="none" stroke="${hl}" stroke-width="3" stroke-linecap="round" opacity=".7"/>`;
    const lockL = `M-62 6C-68 40-66 70-60 92L-46 92C-50 60-52 30-46 0Z`, lockR = `M62 6C68 40 66 70 60 92L46 92C50 60 52 30 46 0Z`;
    const longBack = wavy => wavy
      ? `<path d="M-66 -24C-84 20-70 50-80 80C-88 110-70 130-78 160L78 160C70 130 88 110 80 80C70 50 84 20 66 -24Z" fill="${dk}" ${S4}/>`
      : `<path d="M-66 -24C-80 50-78 120-66 158L66 158C78 120 80 50 66 -24Z" fill="${dk}" ${S4}/>`;
    switch (style) {
      case 'crop': return { front: `<path d="M-60 -2C-64 -52-34 -82 0 -82C34 -82 64 -52 60 -2L56 -18Q42 -36 22 -34Q8 -42-6 -34Q-24 -42-40 -30Q-52 -24-56 -14Z" fill="${c}" ${S4}/>` + tex('M-30 -66q14 -6 26 0M8 -70q16 -2 26 8') };
      case 'buzz': return { front: `<path d="M-59 -6C-60 -52-32 -73 0 -73C32 -73 60 -52 59 -6L54 -22Q0 -46-54 -22Z" fill="${c}" opacity=".9" ${S3}/>` + '<g fill="#000" opacity=".15">' + [[-30, -60], [-10, -66], [12, -64], [32, -56], [-44, -42], [44, -40], [0, -52], [-20, -48], [22, -48]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6"/>`).join('') + '</g>' };
      case 'sidepart': return { front: `<path d="M-61 -2C-66 -56-32 -86 4 -84C40 -82 64 -54 60 -4L54 -24C40 -44 10 -50-14 -46C-34 -42-50 -28-56 -10Z" fill="${c}" ${S4}/><path d="M-18 -82Q-22 -64-14 -46" fill="none" stroke="${dk}" stroke-width="3"/>` + tex('M-2 -76q22 -2 36 14M-42 -60q8 -10 18 -14') };
      case 'quiff': return { front: `<path d="M-60 -4C-64 -50-42 -78-14 -82C-2 -104 36 -108 52 -88C66 -70 64 -40 60 -4L54 -24Q30 -44 6 -42Q-26 -44-44 -30Q-54 -22-56 -12Z" fill="${c}" ${S4}/>` + tex('M-6 -88q20 -14 44 0M10 -78q16 -6 30 4') };
      case 'spiky': return { front: `<path d="M-60 0L-66 -40L-50 -36L-52 -72L-30 -58L-22 -94L-6 -66L8 -100L18 -66L36 -92L38 -58L60 -70L52 -36L66 -40L60 0L54 -22Q0 -46-54 -22Z" fill="${c}" ${S4}/>` + tex('M-14 -70l10 -12M14 -70l8 -14') };
      case 'curlytop': return { front: `<path d="M-60 -2C-64 -46-36 -70 0 -70C36 -70 64 -46 60 -2L56 -20Q0 -40-56 -20Z" fill="${c}" ${S4}/>` + [[-44, -58, 15], [-24, -76, 17], [0, -82, 17], [24, -76, 17], [44, -58, 15], [56, -36, 11], [-56, -36, 11], [-10, -60, 13], [14, -62, 13]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" ${S3}/>`).join('') };
      case 'afro': return { back: `<circle cx="0" cy="-34" r="92" fill="${c}" ${S4}/>` + [[-60, -90], [0, -118], [60, -90], [-84, -30], [84, -30]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="24" fill="${c}"/>`).join(''), front: `<path d="M-62 0C-66 -60 66 -60 62 0L56 -16Q0 -48-56 -16Z" fill="${c}" ${S3}/>` };
      case 'surfer': return { back: `<path d="M-66 -10C-76 40-66 72-52 86L52 86C66 72 76 40 66 -10Z" fill="${dk}" ${S4}/>`, front: `<path d="M-62 6C-68 -56-30 -84 6 -82C42 -80 68 -52 62 6L56 -12C34 -38 4 -44-20 -32C-36 -24-48 -10-56 8Z" fill="${c}" ${S4}/><path d="${lockL}" fill="${c}" ${S3}/>` + tex('M-24 -60q24 -14 50 -4') };
      case 'manbun': return { tall: `<circle cx="0" cy="-92" r="17" fill="${c}" ${S4}/>`, front: `<path d="M-60 -2C-64 -54-32 -80 0 -80C32 -80 64 -54 60 -2L54 -22Q0 -52-54 -22Z" fill="${c}" ${S4}/>` + tex('M-30 -66q30 -12 60 0') };
      case 'mohawk': return { front: `<path d="M-59 -6C-60 -52-32 -72 0 -72C32 -72 60 -52 59 -6L54 -22Q0 -46-54 -22Z" fill="${c}" opacity=".35"/>`, tall: `<path d="M-15 -58L-20 -96L-6 -84L0 -110L8 -84L20 -98L15 -58Q0 -64-15 -58Z" fill="${c}" ${S4}/>` };
      case 'bald': return { front: '<path d="M-26 -58q16 -8 30 -4" stroke="#fff" stroke-width="5" opacity=".35" fill="none" stroke-linecap="round"/>' };
      case 'long': return { back: longBack(false), front: `<path d="M-62 8C-70 -58-30 -86 0 -82C30 -86 70 -58 62 8L46 -18C32 -40 14 -52 2 -56C-10 -52-30 -40-46 -18Z" fill="${c}" ${S4}/><path d="${lockL}" fill="${c}" ${S3}/><path d="${lockR}" fill="${c}" ${S3}/>` + tex('M-40 -56q14 -18 34 -22M14 -74q22 4 34 22') };
      case 'wavy': return { back: longBack(true), front: `<path d="M-62 8C-70 -58-30 -86 0 -82C30 -86 70 -58 62 8L46 -18C32 -40 14 -52 2 -56C-10 -52-30 -40-46 -18Z" fill="${c}" ${S4}/><path d="M-62 6C-72 30-56 50-66 70C-70 84-60 92-56 96L-46 92C-54 74-42 56-50 36C-54 22-48 10-46 0Z" fill="${c}" ${S3}/><path d="M62 6C72 30 56 50 66 70C70 84 60 92 56 96L46 92C54 74 42 56 50 36C54 22 48 10 46 0Z" fill="${c}" ${S3}/>` + tex('M-40 -56q14 -18 34 -22M14 -74q22 4 34 22') };
      case 'bob': return { back: `<path d="M-68 -14C-76 40-70 70-54 78L54 78C70 70 76 40 68 -14Z" fill="${dk}" ${S4}/>`, front: `<path d="M-66 34C-72 -58-30 -84 0 -84C30 -84 72 -58 66 34L56 34C58 4 56 -18 50 -28L-50 -28C-56 -18-58 4-56 34Z" fill="${c}" ${S4}/>` + tex('M-36 -62q36 -16 70 0') };
      case 'pixie': return { front: `<path d="M-60 2C-64 -54-30 -82 4 -82C40 -80 64 -52 60 -4L56 -22C30 -42 0 -34-20 -22C-36 -14-46 -4-52 12Z" fill="${c}" ${S4}/>` + tex('M-10 -70q24 -6 44 10') };
      case 'pony': return { back: `<path d="M24 -74C78 -86 98 -20 80 44C72 12 62 -18 40 -40Z" fill="${dk}" ${S4}/>`, front: `<path d="M-60 -2C-64 -56-30 -84 0 -84C30 -84 64 -56 60 -2L54 -22Q0 -52-54 -22Z" fill="${c}" ${S4}/>` + tex('M-34 -66q34 -14 66 2') };
      case 'buns': return { tall: `<circle cx="-46" cy="-74" r="22" fill="${c}" ${S4}/><circle cx="46" cy="-74" r="22" fill="${c}" ${S4}/>`, front: `<path d="M-60 -2C-64 -56-30 -84 0 -84C30 -84 64 -56 60 -2L54 -22Q0 -52-54 -22Z" fill="${c}" ${S4}/>` + tex('M-30 -66q30 -12 60 0') };
      case 'braids': {
        const braid = x => Array.from({ length: 6 }, (_, i) => `<ellipse cx="${x}" cy="${14 + i * 20}" rx="11" ry="12" fill="${c}" ${S3}/>`).join('') + `<path d="M${x - 6} 134l6 16 6 -16z" fill="${c}" ${S3}/>`;
        return { front: `<path d="M-62 8C-70 -58-30 -86 0 -82C30 -86 70 -58 62 8L50 -16C36 -40 14 -52 2 -56C-10 -52-36 -40-50 -16Z" fill="${c}" ${S4}/>` + braid(-60) + braid(60) };
      }
      case 'curly': return { back: [[-64, -30], [-74, 10], [-70, 50], [64, -30], [74, 10], [70, 50], [-40, -80], [0, -96], [40, -80], [-54, 76], [54, 76]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="28" fill="${dk}" ${S3}/>`).join(''), front: [[-48, -44], [-30, -66], [-6, -76], [18, -74], [40, -62], [54, -40], [-58, -16], [58, -16]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="17" fill="${c}" ${S3}/>`).join('') };
      case 'side': return { back: longBack(false), front: `<path d="M-62 10C-70 -60-20 -88 10 -84C44 -80 70 -50 62 20L64 72C58 32 54 2 46 -16C20 -40-10 -36-40 -10C-52 2-58 22-62 52Z" fill="${c}" ${S4}/>` + tex('M-30 -60q30 -20 60 -6') };
      case 'twintails': return { back: `<path d="M-56 -50C-104 -30-100 40-84 90C-78 50-70 20-50 -20Z" fill="${dk}" ${S4}/><path d="M56 -50C104 -30 100 40 84 90C78 50 70 20 50 -20Z" fill="${dk}" ${S4}/>`, front: `<path d="M-62 4C-68 -58-30 -86 0 -84C30 -86 68 -58 62 4L52 -18Q38 -36 20 -30Q8 -40-4 -32Q-24 -40-40 -28Q-52 -18-52 -18Z" fill="${c}" ${S4}/><circle cx="-56" cy="-50" r="7" fill="#e8598c" ${S2}/><circle cx="56" cy="-50" r="7" fill="#e8598c" ${S2}/>` };
      default: return {};
    }
  }

  // Arkadan saç (kafanın tamamını kaplar)
  function hairBackView(style, c, up) {
    const dk = shade(c, 0.85), hl = shade(c, 1.3);
    const cap = `<path d="M-62 0C-66 -58-32 -82 0 -82C32 -82 66 -58 62 0C62 22 52 36 38 42Q0 50-38 42C-52 36-62 22-62 0Z" fill="${c}" ${S4}/>`;
    const strands = `<path d="M-30 -60q-4 40 2 90M0 -76v110M30 -60q4 40-2 90" fill="none" stroke="${dk}" stroke-width="4" stroke-linecap="round" opacity=".6"/>`;
    const sw = up ? 10 : -10;
    const longB = wavy => `<path d="M-64 -10C-70 -64-32 -84 0 -84C32 -84 70 -64 64 -10C${wavy ? '80 60 64 100 76 160' : '74 60 76 130 66 160'}L-66 160C${wavy ? '-76 100-64 60-80' : '-76 130-74 60-64'} -10Z" fill="${c}" ${S4}/>` + `<path d="M-30 -50q-6 80 0 200M0 -70v220M30 -50q6 80 0 200" fill="none" stroke="${dk}" stroke-width="4" opacity=".6"/>`;
    switch (style) {
      case 'buzz': return `<path d="M-60 -2C-62 -56-32 -76 0 -76C32 -76 62 -56 60 -2C60 18 50 30 36 34Q0 40-36 34C-50 30-60 18-60 -2Z" fill="${c}" opacity=".9" ${S3}/>`;
      case 'bald': return '';
      case 'mohawk': return `<path d="M-14 -96L0 -110L14 -96L14 38Q0 44-14 38Z" fill="${c}" ${S4}/>`;
      case 'spiky': return cap + `<path d="M-60 -10L-66 -40L-50 -36L-52 -72L-30 -58L-22 -94L-6 -66L8 -100L18 -66L36 -92L38 -58L60 -70L52 -36L66 -40L60 -10Z" fill="${c}" ${S4}/>` + strands;
      case 'curlytop': case 'curly': return cap + [[-50, -50], [-26, -74], [0, -82], [26, -74], [50, -50], [-58, -10], [58, -10], [-40, 26], [0, 34], [40, 26]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${style === 'curly' ? 26 : 16}" fill="${c}" ${S3}/>`).join('') + (style === 'curly' ? [[-66, 60], [66, 60], [-30, 70], [30, 70]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="24" fill="${c}" ${S3}/>`).join('') : '');
      case 'afro': return `<circle cx="0" cy="-30" r="94" fill="${c}" ${S4}/>` + `<path d="M-50 -60q50 -40 100 0" stroke="${hl}" stroke-width="4" fill="none" opacity=".5"/>`;
      case 'surfer': return `<path d="M-64 -4C-68 -60-32 -84 0 -84C32 -84 68 -60 64 -4C70 40 62 72 52 88L-52 88C-62 72-70 40-64 -4Z" fill="${c}" ${S4}/>` + strands;
      case 'manbun': return cap + strands + `<circle cx="0" cy="-70" r="18" fill="${c}" ${S4}/>`;
      case 'long': return longB(false);
      case 'wavy': return longB(true);
      case 'side': return longB(false);
      case 'bob': return `<path d="M-68 -10C-70 -64-32 -84 0 -84C32 -84 70 -64 68 -10C72 40 68 70 56 80L-56 80C-68 70-72 40-68 -10Z" fill="${c}" ${S4}/>` + strands;
      case 'pony': return cap + strands + `<path d="M-14 -40C${-20 + sw} 20 ${-10 + sw * 2} 90 ${sw * 2} 130C${16 + sw * 2} 90 ${20 + sw} 20 14 -40Z" fill="${c}" ${S4}/><rect x="-12" y="-46" width="24" height="10" rx="4" fill="#e8598c" ${S2}/>`;
      case 'buns': return cap + strands + `<circle cx="-46" cy="-74" r="22" fill="${c}" ${S4}/><circle cx="46" cy="-74" r="22" fill="${c}" ${S4}/>`;
      case 'braids': {
        const braid = x => Array.from({ length: 6 }, (_, i) => `<ellipse cx="${x + (i * sw) / 8}" cy="${30 + i * 20}" rx="11" ry="12" fill="${c}" ${S3}/>`).join('');
        return cap + strands + braid(-30) + braid(30);
      }
      case 'twintails': return cap + strands + `<path d="M-56 -50C${-104 + sw} -30 ${-100 + sw} 40 ${-84 + sw} 90C-78 50-70 20-50 -20Z" fill="${c}" ${S4}/><path d="M56 -50C${104 + sw} -30 ${100 + sw} 40 ${84 + sw} 90C78 50 70 20 50 -20Z" fill="${c}" ${S4}/>`;
      default: return cap + strands; // crop, sidepart, quiff, pixie
    }
  }

  /* ================= ŞAPKA ================= */
  // back: kafanın arkasında; front: üstte. hide: saçı gizler (başörtüsü).
  function hatSvg(hat, col, view) {
    const c2 = shade(col, 0.8);
    switch (hat) {
      case 'beanie': return { front: `<path d="M-64 -30C-66 -86-30 -106 0 -106C30 -106 66 -86 64 -30Z" fill="${col}" ${S4}/><path d="M-40 -96v58M-20 -102v64M0 -104v66M20 -102v64M40 -96v58" stroke="${c2}" stroke-width="3"/><rect x="-68" y="-42" width="136" height="20" rx="10" fill="${c2}" ${S4}/><circle cx="0" cy="-110" r="14" fill="#f4f6fa" ${S4}/>` };
      case 'cap': return view === 'back'
        ? { front: `<path d="M-62 -30C-64 -90 64 -90 62 -30Z" fill="${col}" ${S4}/><path d="M-14 -40h28v-10h-28z" fill="#f4f6fa" ${S3}/>` }
        : { front: `<path d="M-62 -30C-64 -90 64 -90 62 -30Z" fill="${col}" ${S4}/><path d="M-66 -32Q0 -46 66 -32Q74 -16 0 -14Q-74 -16-66 -32Z" fill="${c2}" ${S4}/><circle cx="0" cy="-60" r="9" fill="#f4f6fa" ${S3}/>` };
      case 'backcap': return view === 'back'
        ? { front: `<path d="M-62 -30C-64 -90 64 -90 62 -30Z" fill="${col}" ${S4}/><path d="M-50 -34Q0 -48 50 -34Q56 -20 0 -18Q-56 -20-50 -34Z" fill="${c2}" ${S4}/>` }
        : { front: `<path d="M-62 -30C-64 -90 64 -90 62 -30Z" fill="${col}" ${S4}/><path d="M-12 -38h24v-12h-24z" fill="#f4f6fa" ${S3}/><path d="M-30 -86Q0 -100 30 -86L24 -78Q0 -88-24 -78Z" fill="${c2}" ${S3}/>` };
      case 'hijab': return {
        back: `<path d="M-80 -6C-84 -110 84 -110 80 -6C84 56 64 96 30 112L-30 112C-64 96-84 56-80 -6Z" fill="${col}" ${S4}/>`,
        front: `<path d="M-58 -16C-60 -76 60 -76 58 -16Q0 -46-58 -16Z" fill="${col}" ${S4}/><path d="M-50 -30Q0 -56 50 -30" stroke="${c2}" stroke-width="3" fill="none"/>`, hide: true
      };
      case 'catears': return { front: `<path d="M-60 -40Q0 -90 60 -40" fill="none" stroke="${INK}" stroke-width="10"/><path d="M-60 -40Q0 -90 60 -40" fill="none" stroke="${col}" stroke-width="5"/><path d="M-56 -56L-62 -104L-26 -76Z" fill="${col}" ${S4}/><path d="M56 -56L62 -104L26 -76Z" fill="${col}" ${S4}/><path d="M-52 -64L-54 -90L-36 -74Z" fill="#f7a8c0"/><path d="M52 -64L54 -90L36 -74Z" fill="#f7a8c0"/>` };
      case 'headphones': return { front: `<path d="M-64 0C-70 -100 70 -100 64 0" fill="none" stroke="${INK}" stroke-width="14"/><path d="M-64 0C-70 -100 70 -100 64 0" fill="none" stroke="${col}" stroke-width="8"/><rect x="-80" y="-14" width="22" height="36" rx="10" fill="${col}" ${S4}/><rect x="58" y="-14" width="22" height="36" rx="10" fill="${col}" ${S4}/>` };
      case 'santa': return { front: `<path d="M-62 -34C-60 -100 40 -120 80 -70C90 -56 92 -36 86 -20C78 -40 66 -56 50 -60C56 -48 60 -40 62 -34Z" fill="#d8363a" ${S4}/><rect x="-68" y="-46" width="136" height="22" rx="11" fill="#f4f6fa" ${S4}/><circle cx="88" cy="-16" r="13" fill="#f4f6fa" ${S4}/>` };
      case 'crown': return { front: `<path d="M-44 -66L-50 -114L-22 -90L0 -122L22 -90L50 -114L44 -66Z" fill="#f2c94c" ${S4}/><circle cx="0" cy="-94" r="7" fill="#d8363a" ${S3}/><circle cx="-30" cy="-80" r="5" fill="#3f8fd6" ${S2}/><circle cx="30" cy="-80" r="5" fill="#3aa66a" ${S2}/><path d="M-44 -70h88" stroke="#c99a2e" stroke-width="5"/>` };
      default: return {};
    }
  }

  /* ================= YÜZ ================= */
  function eyes(L, g) {
    const ey = g.hy + 4, ex = L.girl ? 23 : 24, c = L.eyeC, lid = L.skinC;
    const one = (x, side, id) => {
      const almond = (k) => `M${x - 13 * k} ${ey}Q${x} ${ey - 12 * k} ${x + 13 * k} ${ey}Q${x} ${ey + 9 * k} ${x - 13 * k} ${ey}Z`;
      const iris = r => `<g clip-path="url(#${id})"><circle cx="${x + side}" cy="${ey + 1}" r="${r}" fill="${c}"/><circle cx="${x + side}" cy="${ey + 1}" r="${r * 0.48}" fill="#1a1210"/><circle cx="${x + side + 2.6}" cy="${ey - 2.2}" r="${r * 0.32}" fill="#fff"/></g>`;
      const lash = L.girl ? `<path d="M${x + side * 12} ${ey - 3}l${side * 6} -5M${x + side * 8} ${ey - 7}l${side * 4} -6" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>` : '';
      const lidLine = k => `<path d="M${x - 14 * k} ${ey + 1}Q${x} ${ey - 14 * k} ${x + 14 * k} ${ey + 1}" fill="none" stroke="${INK}" stroke-width="${L.girl ? 3.8 : 3.2}" stroke-linecap="round"/>`;
      switch (L.eyes) {
        case 'round': return `<clipPath id="${id}"><circle cx="${x}" cy="${ey}" r="11"/></clipPath><circle cx="${x}" cy="${ey}" r="11" fill="#fff" ${S2}/>` + iris(7.5) + `<path d="M${x - 11} ${ey - 2}Q${x} ${ey - 14} ${x + 11} ${ey - 2}" fill="none" stroke="${INK}" stroke-width="3"/>` + lash;
        case 'hooded': return `<clipPath id="${id}"><path d="${almond(1)}"/></clipPath><path d="${almond(1)}" fill="#fff" ${S2}/>` + iris(7) + `<path d="M${x - 14} ${ey - 1}Q${x} ${ey - 13} ${x + 14} ${ey - 1}L${x + 13} ${ey - 3}Q${x} ${ey - 4} ${x - 13} ${ey - 3}Z" fill="${shade(lid, 0.92)}"/><path d="M${x - 13} ${ey - 3}Q${x} ${ey - 5} ${x + 13} ${ey - 3}" fill="none" stroke="${INK}" stroke-width="3"/>` + lash;
        case 'wide': return `<clipPath id="${id}"><path d="${almond(1.25)}"/></clipPath><path d="${almond(1.25)}" fill="#fff" ${S2}/>` + iris(8.5) + lidLine(1.25) + lash;
        case 'sleepy': return `<clipPath id="${id}"><path d="M${x - 13} ${ey}L${x + 13} ${ey}Q${x} ${ey + 9} ${x - 13} ${ey}Z"/></clipPath><path d="M${x - 13} ${ey}L${x + 13} ${ey}Q${x} ${ey + 9} ${x - 13} ${ey}Z" fill="#fff" ${S2}/>` + iris(7) + `<path d="M${x - 14} ${ey}H${x + 14}" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/>`;
        case 'happy': return `<path d="M${x - 12} ${ey + 3}Q${x} ${ey - 10} ${x + 12} ${ey + 3}" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>` + lash;
        case 'starry': return `<clipPath id="${id}"><path d="${almond(1.15)}"/></clipPath><path d="${almond(1.15)}" fill="#fff" ${S2}/><g clip-path="url(#${id})"><circle cx="${x + side}" cy="${ey + 1}" r="8.5" fill="${c}"/><path d="M${x + side} ${ey - 6}l2.2 4.6 5 .6-3.6 3.4 1 5-4.6-2.4-4.6 2.4 1-5-3.6-3.4 5-.6z" fill="#fff"/></g>` + lidLine(1.15) + lash;
        default: return `<clipPath id="${id}"><path d="${almond(1)}"/></clipPath><path d="${almond(1)}" fill="#fff" ${S2}/>` + iris(7) + lidLine(1) + lash;
      }
    };
    return one(cx - ex, -1, 'e1') + one(cx + ex, 1, 'e2');
  }
  function brows(L, g) {
    const by = g.hy - 16, ex = L.girl ? 23 : 24;
    const col = L.hair === 'bald' || L.hair === 'buzz' ? shade(L.hairC, 0.8) : shade(L.hairC, 0.8);
    const pair = (fn, w) => `<path d="${fn(-1)}${fn(1)}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;
    switch (L.brows) {
      case 'thick': return pair(s => `M${cx + s * (ex - 13)} ${by + 2}Q${cx + s * ex} ${by - 7} ${cx + s * (ex + 14)} ${by}`, 7.5);
      case 'thin': return pair(s => `M${cx + s * (ex - 12)} ${by + 2}Q${cx + s * (ex + 2)} ${by - 9} ${cx + s * (ex + 14)} ${by + 1}`, 2.6);
      case 'straight': return pair(s => `M${cx + s * (ex - 12)} ${by - 1}H${cx + s * (ex + 13)}`, 5);
      case 'angry': return pair(s => `M${cx + s * (ex - 13)} ${by + 4}L${cx + s * (ex + 13)} ${by - 5}`, 6);
      case 'raised': return pair(s => `M${cx + s * (ex - 12)} ${by - 2}Q${cx + s * ex} ${by - 14} ${cx + s * (ex + 13)} ${by - 4}`, 4.6);
      default: return pair(s => `M${cx + s * (ex - 13)} ${by + 1}Q${cx + s * ex} ${by - 6} ${cx + s * (ex + 14)} ${by}`, L.girl ? 3.6 : 5);
    }
  }
  function nose(L, g) {
    const ny = g.hy + 24, sk = shade(L.skinC, 0.78);
    const k = L.girl ? 0.85 : 1;
    switch (L.nose) {
      case 'small': return `<path d="M${cx - 4 * k} ${ny}Q${cx} ${ny + 4} ${cx + 4 * k} ${ny}" fill="none" stroke="${sk}" stroke-width="3" stroke-linecap="round"/>`;
      case 'wide': return `<path d="M${cx - 12 * k} ${ny - 2}Q${cx - 14 * k} ${ny + 6} ${cx - 6} ${ny + 5}Q${cx} ${ny + 8} ${cx + 6} ${ny + 5}Q${cx + 14 * k} ${ny + 6} ${cx + 12 * k} ${ny - 2}" fill="none" stroke="${sk}" stroke-width="3" stroke-linecap="round"/>`;
      case 'pointy': return `<path d="M${cx + 1} ${ny - 18}L${cx + 8 * k} ${ny + 1}Q${cx + 3} ${ny + 5} ${cx - 4} ${ny + 2}" fill="none" stroke="${sk}" stroke-width="3" stroke-linecap="round"/>`;
      case 'round': return `<ellipse cx="${cx}" cy="${ny}" rx="${8 * k}" ry="${6.5 * k}" fill="${shade(L.skinC, 0.9)}"/><path d="M${cx - 8 * k} ${ny + 3}Q${cx} ${ny + 9} ${cx + 8 * k} ${ny + 3}" fill="none" stroke="${sk}" stroke-width="2.6" stroke-linecap="round"/>`;
      default: return `<path d="M${cx - 7 * k} ${ny + 1}Q${cx - 9 * k} ${ny + 7} ${cx - 3} ${ny + 6}Q${cx} ${ny + 8} ${cx + 3} ${ny + 6}Q${cx + 9 * k} ${ny + 7} ${cx + 7 * k} ${ny + 1}" fill="none" stroke="${sk}" stroke-width="3" stroke-linecap="round"/>`;
    }
  }
  function mouth(L, g) {
    const my = g.hy + 42, lip = L.makeup === 'lipstick' ? '#d8363a' : (L.girl ? '#c8606a' : INK);
    const lw = L.girl ? 3.6 : 3.4;
    switch (L.mouth) {
      case 'grin': return `<path d="M${cx - 16} ${my - 3}Q${cx} ${my + 17} ${cx + 16} ${my - 3}Q${cx} ${my + 2} ${cx - 16} ${my - 3}Z" fill="#fff" stroke="${lip}" stroke-width="${lw}" stroke-linejoin="round"/><path d="M${cx - 12} ${my + 2}Q${cx} ${my + 6} ${cx + 12} ${my + 2}" stroke="#d9d0c8" stroke-width="1.5" fill="none"/>`;
      case 'neutral': return `<path d="M${cx - 10} ${my + 2}Q${cx} ${my + 4} ${cx + 10} ${my + 2}" fill="none" stroke="${lip}" stroke-width="${lw}" stroke-linecap="round"/>`;
      case 'smirk': return `<path d="M${cx - 11} ${my + 3}Q${cx + 4} ${my + 8} ${cx + 15} ${my - 4}" fill="none" stroke="${lip}" stroke-width="${lw}" stroke-linecap="round"/>`;
      case 'laugh': return `<path d="M${cx - 17} ${my - 4}Q${cx} ${my + 26} ${cx + 17} ${my - 4}Z" fill="#7a2328" stroke="${lip}" stroke-width="${lw}" stroke-linejoin="round"/><path d="M${cx - 14} ${my - 2}H${cx + 14}V${my + 3}H${cx - 14}Z" fill="#fff"/><ellipse cx="${cx}" cy="${my + 14}" rx="8" ry="5" fill="#f37a8a"/>`;
      case 'tongue': return `<path d="M${cx - 14} ${my}Q${cx} ${my + 13} ${cx + 14} ${my}" fill="none" stroke="${lip}" stroke-width="${lw}" stroke-linecap="round"/><path d="M${cx - 6} ${my + 6}q6 16 12 0z" fill="#f37a8a" ${S2}/>`;
      default: return `<path d="M${cx - 14} ${my}Q${cx} ${my + 13} ${cx + 14} ${my}" fill="${L.girl ? 'rgba(200,96,106,.25)' : 'none'}" stroke="${lip}" stroke-width="${lw}" stroke-linecap="round"/>`;
    }
  }
  function faceExtras(L, g) {
    const hy = g.hy;
    let s = `<ellipse cx="${cx - 34}" cy="${hy + 28}" rx="11" ry="6" fill="#f09a9a" opacity="${L.makeup === 'blush' ? 0.7 : 0.3}"/><ellipse cx="${cx + 34}" cy="${hy + 28}" rx="11" ry="6" fill="#f09a9a" opacity="${L.makeup === 'blush' ? 0.7 : 0.3}"/>`;
    if (L.makeup === 'freckles') s += [[-38, 22], [-30, 27], [-42, 29], [-33, 33], [38, 22], [30, 27], [42, 29], [33, 33], [-6, 24], [6, 24]].map(([x, y]) => `<circle cx="${cx + x}" cy="${hy + y}" r="1.8" fill="#a8603a"/>`).join('');
    if (L.makeup === 'mole') s += `<circle cx="${cx + 22}" cy="${hy + 38}" r="2.4" fill="#4a2f1f"/>`;
    if (L.makeup === 'liner') s += `<path d="M${cx - 37} ${hy + 3}l-8 -4M${cx + 37} ${hy + 3}l8 -4" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/>`;
    if (L.makeup === 'zibo') s += `<path d="M${cx - 48} ${hy + 22}l16 2M${cx - 48} ${hy + 30}l16 0M${cx + 48} ${hy + 22}l-16 2M${cx + 48} ${hy + 30}l-16 0" stroke="#3aa66a" stroke-width="4" stroke-linecap="round"/>`;
    return s;
  }
  function beard(L, g) {
    const { hy, j, c } = g, col = L.hairC;
    switch (L.beard) {
      case 'stubble': return `<path d="M${cx - j - 6} ${hy + 20}C${cx - j} ${hy + c * 0.8} ${cx - 20} ${hy + c} ${cx} ${hy + c}C${cx + 20} ${hy + c} ${cx + j} ${hy + c * 0.8} ${cx + j + 6} ${hy + 20}Q${cx} ${hy + 50} ${cx - j - 6} ${hy + 20}Z" fill="${col}" opacity=".22"/>`;
      case 'mustache': return `<path d="M${cx} ${hy + 33}C${cx - 8} ${hy + 27} ${cx - 24} ${hy + 30} ${cx - 25} ${hy + 40}C${cx - 16} ${hy + 36} ${cx - 8} ${hy + 38} ${cx} ${hy + 36}C${cx + 8} ${hy + 38} ${cx + 16} ${hy + 36} ${cx + 25} ${hy + 40}C${cx + 24} ${hy + 30} ${cx + 8} ${hy + 27} ${cx} ${hy + 33}Z" fill="${col}" ${S2}/>`;
      case 'goatee': return `<path d="M${cx - 14} ${hy + 52}Q${cx} ${hy + 48} ${cx + 14} ${hy + 52}Q${cx + 12} ${hy + c + 6} ${cx} ${hy + c + 8}Q${cx - 12} ${hy + c + 6} ${cx - 14} ${hy + 52}Z" fill="${col}" ${S2}/>` + `<path d="M${cx} ${hy + 33}C${cx - 8} ${hy + 28} ${cx - 20} ${hy + 31} ${cx - 20} ${hy + 39}Q${cx} ${hy + 33} ${cx + 20} ${hy + 39}C${cx + 20} ${hy + 31} ${cx + 8} ${hy + 28} ${cx} ${hy + 33}Z" fill="${col}"/>`;
      case 'full': return `<path d="M${cx - g.w + 2} ${hy + 4}C${cx - g.w} ${hy + 40} ${cx - 30} ${hy + c + 14} ${cx} ${hy + c + 14}C${cx + 30} ${hy + c + 14} ${cx + g.w} ${hy + 40} ${cx + g.w - 2} ${hy + 4}C${cx + g.w - 10} ${hy + 30} ${cx + 30} ${hy + 30} ${cx + 18} ${hy + 34}C${cx + 6} ${hy + 30} ${cx - 6} ${hy + 30} ${cx - 18} ${hy + 34}C${cx - 30} ${hy + 30} ${cx - g.w + 10} ${hy + 30} ${cx - g.w + 2} ${hy + 4}Z" fill="${col}" ${S3}/>`;
      default: return '';
    }
  }
  function glasses(L, g) {
    const ey = g.hy + 4, ex = L.girl ? 23 : 24, w = g.w;
    const temples = `<path d="M${cx - ex - 17} ${ey - 2}L${cx - w + 2} ${ey - 6}M${cx + ex + 17} ${ey - 2}L${cx + w - 2} ${ey - 6}" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`;
    switch (L.glasses) {
      case 'round': return `<circle cx="${cx - ex}" cy="${ey}" r="17" fill="#fff" fill-opacity=".12" stroke="${INK}" stroke-width="3.6"/><circle cx="${cx + ex}" cy="${ey}" r="17" fill="#fff" fill-opacity=".12" stroke="${INK}" stroke-width="3.6"/><path d="M${cx - ex + 17} ${ey - 2}Q${cx} ${ey - 8} ${cx + ex - 17} ${ey - 2}" fill="none" stroke="${INK}" stroke-width="3.5"/>` + temples;
      case 'square': return `<rect x="${cx - ex - 18}" y="${ey - 13}" width="36" height="27" rx="6" fill="#fff" fill-opacity=".12" stroke="${INK}" stroke-width="4.5"/><rect x="${cx + ex - 18}" y="${ey - 13}" width="36" height="27" rx="6" fill="#fff" fill-opacity=".12" stroke="${INK}" stroke-width="4.5"/><path d="M${cx - ex + 18} ${ey - 4}H${cx + ex - 18}" stroke="${INK}" stroke-width="4"/>` + temples;
      case 'sun': return `<path d="M${cx - ex - 19} ${ey - 10}H${cx - 5}Q${cx - 6} ${ey + 14} ${cx - ex} ${ey + 14}Q${cx - ex - 20} ${ey + 12} ${cx - ex - 19} ${ey - 10}Z" fill="#1d2230" ${S3}/><path d="M${cx + ex + 19} ${ey - 10}H${cx + 5}Q${cx + 6} ${ey + 14} ${cx + ex} ${ey + 14}Q${cx + ex + 20} ${ey + 12} ${cx + ex + 19} ${ey - 10}Z" fill="#1d2230" ${S3}/><path d="M${cx - 5} ${ey - 8}H${cx + 5}" stroke="${INK}" stroke-width="3.5"/><path d="M${cx - ex - 10} ${ey - 4}l8 -2M${cx + ex - 4} ${ey - 4}l8 -2" stroke="#fff" stroke-width="3" opacity=".6" stroke-linecap="round"/>` + temples;
      case 'star': { const star = x => `<path d="M${x} ${ey - 20}l6 12 13 2-9.5 9 2.3 13-11.8-6.3-11.8 6.3 2.3-13-9.5-9 13-2z" fill="#f2c94c" fill-opacity=".85" ${S3}/>`; return star(cx - ex) + star(cx + ex) + `<path d="M${cx - 8} ${ey}H${cx + 8}" stroke="${INK}" stroke-width="3.5"/>`; }
      case 'ski': return `<path d="M${cx - w + 2} ${ey - 2}H${cx + w - 2}" stroke="${INK}" stroke-width="9"/><path d="M${cx - w + 2} ${ey - 2}H${cx + w - 2}" stroke="#3f8fd6" stroke-width="5"/><rect x="${cx - 46}" y="${ey - 16}" width="92" height="30" rx="14" fill="#f08a2c" ${S4}/><path d="M${cx - 30} ${ey - 8}q20 -6 34 2" stroke="#fff" stroke-width="3" fill="none" opacity=".7"/>`;
      default: return '';
    }
  }
  function earrings(L, g) {
    const ex = cx + g.w + 1, y = g.hy + 18;
    if (L.earrings === 'studs') return `<circle cx="${320 - ex}" cy="${y}" r="3.6" fill="#f2c94c" ${S2}/><circle cx="${ex}" cy="${y}" r="3.6" fill="#f2c94c" ${S2}/>`;
    if (L.earrings === 'hoops') return `<circle cx="${320 - ex}" cy="${y + 8}" r="8" fill="none" stroke="#f2c94c" stroke-width="3"/><circle cx="${ex}" cy="${y + 8}" r="8" fill="none" stroke="#f2c94c" stroke-width="3"/>`;
    return '';
  }

  /* ================= KIYAFET ================= */
  const COST = {
    raven: { body: '#2b2f3b', dark: '#1a1d26', light: '#4a5163', belly: '#4a5163', accent: '#f2b632' },
    dragon: { body: '#3f9a52', dark: '#2a6e3a', light: '#f2d36b', belly: '#f2d36b', accent: '#d8363a' },
    zibo: { body: '#8fd16a', dark: '#5f9e44', light: '#c6eaa8', belly: '#c6eaa8', accent: '#2fa35a' },
    santa: { body: '#d8363a', dark: '#2b2f3b', light: '#f4f6fa', belly: '#d8363a', accent: '#f2c94c' }
  };
  function torsoPath(g, back) {
    const { sh, hip, sw, ww, hw } = g;
    const nk = back ? 20 : 15;
    return `M${cx - nk} ${sh - 4}C${cx - 28} ${sh - 2} ${cx - sw + 6} ${sh + 1} ${cx - sw} ${sh + 14}L${cx - ww} ${hip - 26}C${cx - ww - 2} ${hip - 10} ${cx - hw} ${hip - 4} ${cx - hw} ${hip + 10}L${cx + hw} ${hip + 10}C${cx + hw} ${hip - 4} ${cx + ww + 2} ${hip - 10} ${cx + ww} ${hip - 26}L${cx + sw} ${sh + 14}C${cx + sw - 6} ${sh + 1} ${cx + 28} ${sh - 2} ${cx + nk} ${sh - 4}Z`;
  }
  function topLook(L) {
    if (L.costume !== 'none') { const C = COST[L.costume]; return { col: C.body, long: true }; }
    return { col: L.topC, long: !['tshirt', 'jersey'].includes(L.top) };
  }
  // Önden üst giysi detayları
  function topDetails(L, g, back) {
    const { sh, hip, sw, ww } = g;
    const col = topLook(L).col, dk = shade(col, 0.8), lt = shade(col, 1.3);
    if (L.costume !== 'none') {
      const C = COST[L.costume];
      if (L.costume === 'santa') return `<path d="M${cx - 6} ${sh}V${hip + 10}H${cx + 6}V${sh}Z" fill="#f4f6fa" ${S3}/><rect x="${cx - g.ww - 4}" y="${hip - 18}" width="${(g.ww + 4) * 2}" height="14" fill="#2b2f3b" ${S3}/><rect x="${cx - 9}" y="${hip - 20}" width="18" height="18" rx="3" fill="none" stroke="#f2c94c" stroke-width="4"/>`;
      if (back) {
        if (L.costume === 'dragon') return `<path d="M${cx} ${sh - 4}l-12 18 12 6-12 20 12 6-12 20 12 6-12 20h24l-12-20 12-6-12-20 12-6-12-20 12-6z" fill="${C.accent}" ${S3}/>`;
        if (L.costume === 'raven') return `<path d="M${cx - 34} ${sh + 50}l10 14 10-14 10 14 10-14 10 14 10-14M${cx - 38} ${sh + 80}l11 14 11-14 11 14 11-14 11 14 11-14" fill="none" stroke="${C.light}" stroke-width="4"/>`;
        return '';
      }
      let s = `<path d="M${cx - ww + 8} ${sh + 30}Q${cx} ${sh + 20} ${cx + ww - 8} ${sh + 30}L${cx + ww - 10} ${hip}Q${cx} ${hip + 10} ${cx - ww + 10} ${hip}Z" fill="${C.belly}" ${S3}/>`;
      if (L.costume === 'dragon') s += `<path d="M${cx - ww + 10} ${sh + 52}H${cx + ww - 10}M${cx - ww + 10} ${sh + 72}H${cx + ww - 10}" stroke="${INK}" stroke-width="2.5"/>`;
      if (L.costume === 'raven') s += `<path d="M${cx - 24} ${sh + 46}l8 10 8-10 8 10 8-10 8 10 8-10" fill="none" stroke="${C.body}" stroke-width="3.5"/>`;
      return s;
    }
    switch (L.top) {
      case 'tshirt': return back ? '' : `<path d="M${cx - 15} ${sh - 4}Q${cx} ${sh + 10} ${cx + 15} ${sh - 4}" fill="none" stroke="${dk}" stroke-width="4"/><path d="M${cx + 10} ${sh + 34}l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z" fill="${lt}"/>`;
      case 'hoodie': return back
        ? `<path d="M${cx - 34} ${sh - 2}Q${cx} ${sh - 16} ${cx + 34} ${sh - 2}Q${cx + 36} ${sh + 46} ${cx} ${sh + 54}Q${cx - 36} ${sh + 46} ${cx - 34} ${sh - 2}Z" fill="${dk}" ${S3}/>`
        : `<path d="M${cx - 32} ${sh + 2}Q${cx} ${sh - 20} ${cx + 32} ${sh + 2}" fill="none" stroke="${INK}" stroke-width="15" stroke-linecap="round"/><path d="M${cx - 32} ${sh + 2}Q${cx} ${sh - 20} ${cx + 32} ${sh + 2}" fill="none" stroke="${dk}" stroke-width="9" stroke-linecap="round"/><path d="M${cx - 7} ${sh + 4}v26M${cx + 7} ${sh + 4}v26" stroke="#f4f6fa" stroke-width="3" stroke-linecap="round"/><path d="M${cx - 26} ${hip - 32}H${cx + 26}L${cx + 32} ${hip - 4}H${cx - 32}Z" fill="${dk}" ${S3}/>`;
      case 'sweater': return `<path d="M${cx - g.sw + 4} ${sh + 32}H${cx + g.sw - 4}" stroke="${lt}" stroke-width="10"/><path d="M${cx - g.sw + 6} ${sh + 32}l8 -5 8 5 8 -5 8 5 8 -5 8 5 8 -5 8 5 8 -5 8 5 8 -5" fill="none" stroke="${dk}" stroke-width="2.5" transform="translate(0 0)"/>` + (back ? '' : `<path d="M${cx - 16} ${sh - 4}Q${cx} ${sh + 8} ${cx + 16} ${sh - 4}" fill="none" stroke="${dk}" stroke-width="7"/>`) + `<path d="M${cx - g.hw} ${hip + 2}H${cx + g.hw}" stroke="${dk}" stroke-width="8"/>`;
      case 'puffer': { let s = ''; for (let y = sh + 26; y < hip; y += 22) s += `<path d="M${cx - g.ww - 6} ${y}Q${cx} ${y + 6} ${cx + g.ww + 6} ${y}" fill="none" stroke="${dk}" stroke-width="3"/>`; return s + (back ? `<rect x="${cx - 22}" y="${sh - 10}" width="44" height="16" rx="7" fill="${dk}" ${S3}/>` : `<path d="M${cx - 20} ${sh - 12}H${cx + 20}L${cx + 16} ${sh + 6}H${cx - 16}Z" fill="${dk}" ${S3}/><path d="M${cx} ${sh + 6}V${hip + 8}" stroke="${dk}" stroke-width="3"/>`); }
      case 'shirt': return back ? `<path d="M${cx - g.sw + 6} ${sh + 22}Q${cx} ${sh + 30} ${cx + g.sw - 6} ${sh + 22}" fill="none" stroke="${dk}" stroke-width="2.5"/>` : `<path d="M${cx - 15} ${sh - 4}L${cx} ${sh + 14}L${cx + 15} ${sh - 4}L${cx + 22} ${sh + 10}L${cx} ${sh + 16}L${cx - 22} ${sh + 10}Z" fill="${lt}" ${S3}/><path d="M${cx} ${sh + 16}V${hip + 8}" stroke="${dk}" stroke-width="2.5"/>` + [24, 44, 64].map(y => `<circle cx="${cx + 5}" cy="${sh + y}" r="2.4" fill="${dk}"/>`).join('') + `<rect x="${cx - 30}" y="${sh + 28}" width="16" height="14" rx="2" fill="none" stroke="${dk}" stroke-width="2.5"/>`;
      case 'jersey': return (back ? `<text x="${cx}" y="${sh + 74}" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="44" fill="#f4f6fa" stroke="${INK}" stroke-width="2">10</text>` : `<path d="M${cx - 15} ${sh - 4}L${cx} ${sh + 14}L${cx + 15} ${sh - 4}" fill="none" stroke="#f4f6fa" stroke-width="5"/><text x="${cx}" y="${sh + 58}" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="24" fill="#f4f6fa" stroke="${INK}" stroke-width="1.5">10</text>`) + `<path d="M${cx - g.ww + 2} ${sh + 30}V${hip}M${cx + g.ww - 2} ${sh + 30}V${hip}" stroke="#f4f6fa" stroke-width="5"/>`;
      case 'xmas': return `<path d="M${cx - g.sw + 4} ${sh + 30}H${cx + g.sw - 4}M${cx - g.hw} ${hip - 6}H${cx + g.hw}" stroke="#f4f6fa" stroke-width="12"/><path d="M${cx - g.sw + 6} ${sh + 30}l7 -5 7 5 7 -5 7 5 7 -5 7 5 7 -5 7 5 7 -5 7 5 7 -5 7 5" fill="none" stroke="#2fa35a" stroke-width="3"/>` + (back ? '' : `<path d="M${cx} ${sh + 46}v20M${cx - 10} ${sh + 56}h20M${cx - 7} ${sh + 49}l14 14M${cx + 7} ${sh + 49}l-14 14" stroke="#f4f6fa" stroke-width="3.5" stroke-linecap="round"/><path d="M${cx - 16} ${sh - 4}Q${cx} ${sh + 8} ${cx + 16} ${sh - 4}" fill="none" stroke="#2fa35a" stroke-width="7"/>`);
      case 'leather': return back ? `<path d="M${cx - g.sw + 6} ${sh + 20}Q${cx} ${sh + 28} ${cx + g.sw - 6} ${sh + 20}" fill="none" stroke="${lt}" stroke-width="2.5"/>` : `<path d="M${cx - 15} ${sh - 4}L${cx - 4} ${hip + 8}H${cx + 4}L${cx + 15} ${sh - 4}Z" fill="#f4f6fa" ${S3}/><path d="M${cx - 15} ${sh - 4}L${cx - 30} ${sh + 14}L${cx - 14} ${sh + 30}M${cx + 15} ${sh - 4}L${cx + 30} ${sh + 14}L${cx + 14} ${sh + 30}" fill="${dk}" ${S3}/><path d="M${cx + 22} ${sh + 46}h14" stroke="#c9ced8" stroke-width="3"/>`;
      default: return '';
    }
  }
  function neckWear(L, g, back, up) {
    const { sh } = g;
    if (L.costume !== 'none' && L.costume !== 'zibo') return '';
    const neck = L.costume === 'zibo' ? 'scarf' : L.neck;
    if (neck === 'scarf') {
      const tt = up ? 8 : -8;
      return `<path d="M${cx - 30} ${sh - 10}Q${cx} ${sh + 10} ${cx + 30} ${sh - 10}Q${cx + 32} ${sh + 4} ${cx + 24} ${sh + 8}Q${cx} ${sh + 22} ${cx - 24} ${sh + 8}Q${cx - 32} ${sh + 4} ${cx - 30} ${sh - 10}Z" fill="#2fa35a" ${S3}/>` +
        (back ? `<path d="M${cx - 8} ${sh + 10}L${cx - 14 + tt} ${sh + 60}L${cx + 8 + tt} ${sh + 62}L${cx + 10} ${sh + 12}Z" fill="#2fa35a" ${S3}/>` : `<path d="M${cx + 12} ${sh + 10}L${cx + 14} ${sh + 56}L${cx + 30} ${sh + 52}L${cx + 26} ${sh + 6}Z" fill="#2fa35a" ${S3}/>`);
    }
    if (back) return '';
    if (neck === 'chain') return `<path d="M${cx - 16} ${sh - 2}Q${cx} ${sh + 30} ${cx + 16} ${sh - 2}" fill="none" stroke="#f2c94c" stroke-width="4" stroke-dasharray="5 2"/>`;
    if (neck === 'medal') return `<path d="M${cx - 16} ${sh - 4}L${cx} ${sh + 30}L${cx + 16} ${sh - 4}" fill="none" stroke="#d8363a" stroke-width="6"/><circle cx="${cx}" cy="${sh + 38}" r="12" fill="#f2c94c" ${S3}/><path d="M${cx} ${sh + 31}l2 4.5 5 .5-3.7 3.3 1 5-4.3-2.5-4.3 2.5 1-5-3.7-3.3 5-.5z" fill="#fff6c4"/>`;
    return '';
  }
  function backItem(L, g, view, up) {
    const { sh, hip, sw } = g;
    if (L.back === 'wings') {
      const fl = view === 'back' ? (up ? -14 : 8) : 0;
      const wing = s => `<path d="M${cx + s * 18} ${sh + 20}C${cx + s * 70} ${sh - 40 + fl} ${cx + s * 120} ${sh - 10 + fl} ${cx + s * 118} ${sh + 30 + fl}C${cx + s * 110} ${sh + 70} ${cx + s * 70} ${sh + 90} ${cx + s * 24} ${sh + 70}Z" fill="#f4f6fa" ${S3}/><path d="M${cx + s * 40} ${sh + 40}C${cx + s * 70} ${sh + 20 + fl} ${cx + s * 96} ${sh + 26 + fl} ${cx + s * 106} ${sh + 40 + fl}M${cx + s * 40} ${sh + 58}C${cx + s * 66} ${sh + 48} ${cx + s * 86} ${sh + 56} ${cx + s * 94} ${sh + 66}" fill="none" stroke="#c9d3e0" stroke-width="3"/>`;
      return { under: wing(-1) + wing(1) };
    }
    if (L.back === 'cape') {
      const sw2 = view === 'back' ? (up ? 10 : -10) : 0;
      const cape = `<path d="M${cx - sw + 4} ${sh + 4}Q${cx} ${sh - 4} ${cx + sw - 4} ${sh + 4}L${cx + sw + 18 + sw2} ${hip + 50}Q${cx + sw2} ${hip + 62} ${cx - sw - 18 + sw2} ${hip + 50}Z" fill="#c2362f" ${S4}/>`;
      return view === 'back' ? { over: cape } : { under: cape, over: `<circle cx="${cx - 16}" cy="${sh + 4}" r="5" fill="#f2c94c" ${S2}/><circle cx="${cx + 16}" cy="${sh + 4}" r="5" fill="#f2c94c" ${S2}/>` };
    }
    if (L.back === 'backpack') {
      if (view === 'back') return { over: `<rect x="${cx - 34}" y="${sh + 16}" width="68" height="76" rx="18" fill="#f08a2c" ${S4}/><rect x="${cx - 24}" y="${sh + 56}" width="48" height="28" rx="8" fill="#d06a1a" ${S3}/><path d="M${cx - 30} ${sh + 30}H${cx + 30}" stroke="#d06a1a" stroke-width="3"/>` };
      return { over: `<path d="M${cx - sw + 10} ${sh + 4}V${sh + 70}M${cx + sw - 10} ${sh + 4}V${sh + 70}" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M${cx - sw + 10} ${sh + 4}V${sh + 70}M${cx + sw - 10} ${sh + 4}V${sh + 70}" stroke="#f08a2c" stroke-width="5" stroke-linecap="round"/>` };
    }
    return {};
  }
  function legs(L, g, view, step) {
    const { hip, ankle, hw, Bm } = g;
    const C = L.costume !== 'none' ? COST[L.costume] : null;
    const pant = C ? (L.costume === 'santa' ? '#d8363a' : C.body) : L.botC;
    const pd = shade(pant, 0.82);
    const knee = hip + (ankle - hip) * 0.5;
    const shoeCol = C ? (L.costume === 'santa' ? '#2b2f3b' : C.dark) : L.shoeC;
    let s = '';
    const leg = (side, lift) => {
      const a = lift ? ankle - 26 : ankle;
      const top = hip - 4, inner = cx + side * 3, outer = cx + side * hw;
      const outerB = cx + side * hw * 0.86, innerB = cx + side * 8;
      const midX = (innerB + outerB) / 2;
      let out = '';
      const skinLeg = (fromY) => `<path d="M${cx + side * 8} ${fromY}L${cx + side * hw * 0.8} ${fromY}L${outerB - side * 3} ${a}L${innerB + side * 3} ${a}Z" fill="${L.skinC}" ${S3}/>`;
      if (!C && L.bottom === 'shorts') {
        out += skinLeg(knee - 6);
        out += `<path d="M${inner} ${top}L${outer} ${top}L${cx + side * (hw + 2)} ${knee}L${cx + side * 6} ${knee}Z" fill="${pant}" ${S4}/>`;
      } else if (!C && L.bottom === 'skirt') {
        out += skinLeg(knee - 10);
      } else {
        out += `<path d="M${inner} ${top}L${outer} ${top}L${outerB} ${a}L${innerB} ${a}Z" fill="${pant}" ${S4}/>`;
        if (!C && L.bottom === 'jeans') out += `<path d="M${cx + side * hw * 0.55} ${top + 8}L${midX} ${a - 4}" stroke="${pd}" stroke-width="2.5"/>`;
        if (!C && L.bottom === 'joggers') out += `<rect x="${Math.min(innerB, outerB)}" y="${a - 10}" width="${Math.abs(outerB - innerB)}" height="10" fill="${pd}" ${S3}/><path d="M${cx + side * hw * 0.92} ${top + 6}L${outerB} ${a - 12}" stroke="#f4f6fa" stroke-width="3"/>`;
        if (!C && L.bottom === 'cargo') out += `<rect x="${cx + side * hw * 0.98 - (side > 0 ? 18 : 0)}" y="${knee - 22}" width="18" height="22" rx="3" fill="${pd}" ${S3}/>`;
      }
      // ayakkabı
      const fx = midX, fy = a;
      const sh = L.shoes;
      if (lift && view === 'back') {
        out += `<ellipse cx="${fx}" cy="${fy + 2}" rx="${17 * Bm + 2}" ry="12" fill="${shoeCol}" ${S4}/><ellipse cx="${fx}" cy="${fy + 3}" rx="${11 * Bm}" ry="7" fill="${C ? shade(shoeCol, 1.3) : '#f4f6fa'}"/>`;
      } else if (C || sh === 'boots' || sh === 'snow') {
        const fur = sh === 'snow' && !C ? `<rect x="${fx - 17}" y="${fy - 22}" width="34" height="10" rx="5" fill="#f4f6fa" ${S3}/>` : '';
        out += `<path d="M${fx - 15} ${fy - 20}H${fx + 15}V${fy}Q${fx + 24} ${fy + 2} ${fx + 24} ${fy + 10}H${fx - 18}Q${fx - 20} ${fy} ${fx - 15} ${fy - 4}Z" fill="${shoeCol}" ${S4}/>` + fur;
      } else {
        const sole = sh === 'gold' ? '#fff3a8' : '#f4f6fa';
        const body = sh === 'gold' ? '#f2c94c' : shoeCol;
        out += `<path d="M${fx - 17} ${fy - 6}Q${fx - 14} ${fy - 14} ${fx} ${fy - 13}Q${fx + 18} ${fy - 10} ${fx + 24} ${fy + 2}V${fy + 8}H${fx - 19}Z" fill="${body}" ${S4}/><path d="M${fx - 19} ${fy + 4}H${fx + 24}" stroke="${sole}" stroke-width="5"/>`;
        if (sh === 'hightops') out += `<rect x="${fx - 16}" y="${fy - 24}" width="26" height="14" rx="4" fill="${body}" ${S3}/><path d="M${fx - 10} ${fy - 18}h14M${fx - 10} ${fy - 12}h14" stroke="#f4f6fa" stroke-width="2"/>`;
        if (sh === 'sneakers') out += `<path d="M${fx - 6} ${fy - 8}l14 6" stroke="#f4f6fa" stroke-width="3.5" stroke-linecap="round"/>`;
      }
      return out;
    };
    if (view === 'back') { s += leg(-1, step === 0) + leg(1, step === 1); }
    else s += leg(-1, false) + leg(1, false);
    if (!C && L.bottom === 'skirt') s += `<path d="M${cx - g.ww - 2} ${hip - 8}H${cx + g.ww + 2}L${cx + hw + 16} ${knee}Q${cx} ${knee + 8} ${cx - hw - 16} ${knee}Z" fill="${pant}" ${S4}/><path d="M${cx - 18} ${hip}L${cx - 24} ${knee}M${cx + 18} ${hip}L${cx + 24} ${knee}" stroke="${pd}" stroke-width="2.5"/>`;
    return s;
  }
  // Kol: omuzdan bileğe. pose: 'down' (önden duruş), 'fwd'/'back' (arkadan koşu)
  function arm(L, g, side, pose) {
    const { sh, hip, sw, aw } = g;
    const t = topLook(L);
    const sx = cx + side * (sw - 7), sy = sh + 14;
    let ex, ey, wx, wy;
    if (pose === 'fwd') { ex = cx + side * (sw + 14); ey = sh + 46; wx = cx + side * (sw + 6); wy = sh + 70; }
    else if (pose === 'backswing') { ex = cx + side * (sw + 16); ey = sh + 50; wx = cx + side * (sw + 22); wy = hip + 6; }
    else { ex = cx + side * (sw + 12); ey = sh + (hip - sh) * 0.52; wx = cx + side * (sw + 10); wy = hip + 8; }
    const d = `M${sx} ${sy}Q${ex} ${ey - 8} ${ex} ${ey}T${wx} ${wy}`;
    const C = L.costume !== 'none' ? COST[L.costume] : null;
    let s = '';
    if (t.long) {
      s += `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${aw + 7}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${t.col}" stroke-width="${aw}" stroke-linecap="round"/>`;
      if (L.costume === 'santa') s += `<circle cx="${wx}" cy="${wy - 4}" r="${aw / 2 + 1}" fill="#f4f6fa" ${S3}/>`;
    } else {
      const d1 = `M${sx} ${sy}Q${ex} ${ey - 8} ${ex} ${ey}`;
      s += `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${aw - 2}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${L.skinC}" stroke-width="${aw - 9}" stroke-linecap="round"/>`;
      s += `<path d="${d1}" fill="none" stroke="${INK}" stroke-width="${aw + 7}" stroke-linecap="round"/><path d="${d1}" fill="none" stroke="${t.col}" stroke-width="${aw}" stroke-linecap="round"/>`;
    }
    const hand = C ? (L.costume === 'santa' ? '#2b2f3b' : C.light) : L.skinC;
    s += `<circle cx="${wx}" cy="${wy}" r="${10.5 * g.Bm}" fill="${hand}" ${S3}/>`;
    return s;
  }

  // Kostüm başlığı (kapüşon) — saçı ve şapkayı gizler
  function hood(L, g, view) {
    const C = COST[L.costume];
    if (!C || L.costume === 'santa') return null;
    const hy = g.hy;
    const back = `<path d="M${cx - 86} ${hy}C${cx - 90} ${hy - 112} ${cx + 90} ${hy - 112} ${cx + 86} ${hy}C${cx + 88} ${hy + 70} ${cx + 52} ${hy + 96} ${cx} ${hy + 98}C${cx - 52} ${hy + 96} ${cx - 88} ${hy + 70} ${cx - 86} ${hy}Z" fill="${C.body}" ${S4}/>`;
    let top = '';
    if (L.costume === 'raven') top = `<path d="M${cx - 40} ${hy - 86}l-12 -26 26 18M${cx} ${hy - 96}l0 -28 14 26M${cx + 40} ${hy - 86}l12 -26 -26 18" fill="${C.body}" ${S4}/>` + (view === 'back' ? '' : `<path d="M${cx - 22} ${hy - 82}q22 -8 44 0l-22 40z" fill="${C.accent}" ${S4}/><circle cx="${cx - 44}" cy="${hy - 70}" r="8" fill="#fff" ${S3}/><circle cx="${cx + 44}" cy="${hy - 70}" r="8" fill="#fff" ${S3}/><circle cx="${cx - 43}" cy="${hy - 69}" r="4" fill="${INK}"/><circle cx="${cx + 45}" cy="${hy - 69}" r="4" fill="${INK}"/>`);
    if (L.costume === 'dragon') top = `<path d="M${cx - 54} ${hy - 76}l-26 -40 42 24z" fill="${C.light}" ${S4}/><path d="M${cx + 54} ${hy - 76}l26 -40 -42 24z" fill="${C.light}" ${S4}/><path d="M${cx - 16} ${hy - 96}l16 -24 16 24z" fill="${C.accent}" ${S4}/>` + (view === 'back' ? '' : `<circle cx="${cx - 34}" cy="${hy - 76}" r="9" fill="#ffd34d" ${S3}/><circle cx="${cx + 34}" cy="${hy - 76}" r="9" fill="#ffd34d" ${S3}/><path d="M${cx - 34} ${hy - 82}v12M${cx + 34} ${hy - 82}v12" stroke="${INK}" stroke-width="3"/>`);
    if (L.costume === 'zibo') top = `<path d="M${cx - 80} ${hy - 30}C${cx - 120} ${hy - 50} ${cx - 140} ${hy - 30} ${cx - 150} ${hy - 20}C${cx - 120} ${hy - 6} ${cx - 100} ${hy} ${cx - 84} ${hy + 6}Z" fill="${C.body}" ${S4}/><path d="M${cx + 80} ${hy - 30}C${cx + 120} ${hy - 50} ${cx + 140} ${hy - 30} ${cx + 150} ${hy - 20}C${cx + 120} ${hy - 6} ${cx + 100} ${hy} ${cx + 84} ${hy + 6}Z" fill="${C.body}" ${S4}/>` + `<path d="M${cx - 70} ${hy - 64}C${cx - 60} ${hy - 130} ${cx + 50} ${hy - 150} ${cx + 96} ${hy - 96}C${cx + 104} ${hy - 84} ${cx + 106} ${hy - 66} ${cx + 100} ${hy - 52}C${cx + 92} ${hy - 70} ${cx + 80} ${hy - 82} ${cx + 64} ${hy - 86}C${cx + 70} ${hy - 76} ${cx + 72} ${hy - 70} ${cx + 72} ${hy - 64}Z" fill="#d8363a" ${S4}/><rect x="${cx - 78}" y="${hy - 78}" width="156" height="22" rx="11" fill="#f4f6fa" ${S4}/><circle cx="${cx + 100}" cy="${hy - 48}" r="12" fill="#f4f6fa" ${S4}/>`;
    const rim = view === 'back' ? '' : `<path d="${headPath(g)}" fill="none" stroke="${INK}" stroke-width="20"/><path d="${headPath(g)}" fill="none" stroke="${shade(C.body, 0.85)}" stroke-width="13"/>`;
    return { back, rim, top };
  }

  /* ================= ÖNDEN TAM KARAKTER ================= */
  function front(L, emote) {
    const g = geo(L);
    const hc = hood(L, g, 'front');
    const hairs = hc ? {} : hairFront(L.hair, L.hairC);
    const hat = hc ? {} : hatSvg(L.hat, shade(L.topC, 0.95), 'front');
    const bi = backItem(L, g, 'front');
    const o = [];
    o.push(`<ellipse cx="${cx}" cy="${g.ankle + 14}" rx="${70 * g.Bm}" ry="10" fill="#000" opacity=".18"/>`);
    o.push('<g class="bd">');
    if (bi.under) o.push(bi.under);
    if (hc) o.push(hc.back);
    if (hat.back) o.push(onHead(g, hat.back));
    if (hairs.back && !hat.hide) o.push(onHead(g, hairs.back));
    o.push(legs(L, g, 'front'));
    // gövde
    const col = topLook(L).col;
    o.push(`<rect x="${cx - 13}" y="${g.sh - 26}" width="26" height="30" fill="${shade(L.skinC, 0.88)}" ${S3}/>`);
    o.push(`<path d="${torsoPath(g)}" fill="${col}" ${S4}/>`);
    o.push(`<path d="${torsoPath(g)}" fill="url(#tg)"/>`);
    o.push(topDetails(L, g, false));
    o.push(neckWear(L, g, false));
    if (bi.over) o.push(bi.over);
    o.push(`<g class="al">${arm(L, g, -1, 'down')}</g><g class="ar">${arm(L, g, 1, 'down')}</g>`);
    // kafa
    o.push('<g class="hd">');
    const earX = cx + g.w + 1;
    if (!hc && !hat.hide) o.push(`<ellipse cx="${320 - earX}" cy="${g.hy + 4}" rx="9" ry="13" fill="${L.skinC}" ${S3}/><ellipse cx="${earX}" cy="${g.hy + 4}" rx="9" ry="13" fill="${L.skinC}" ${S3}/><path d="M${320 - earX + 2} ${g.hy - 2}q-4 6 0 12M${earX - 2} ${g.hy - 2}q4 6 0 12" stroke="${shade(L.skinC, 0.75)}" stroke-width="2.5" fill="none"/>`);
    o.push(`<path d="${headPath(g)}" fill="${L.skinC}" ${S4}/><path d="${headPath(g)}" fill="url(#fg)"/>`);
    if (hc) o.push(hc.rim);
    o.push(faceExtras(L, g), beard(L, g), eyes(L, g), brows(L, g), nose(L, g), mouth(L, g));
    if (!hc && !hat.hide) o.push(earrings(L, g));
    o.push(glasses(L, g));
    if (hc) o.push(hc.top);
    else {
      if (hat.front) {
        o.push(onHead(g, `<clipPath id="hc"><rect x="-120" y="-36" width="240" height="300"/></clipPath><g clip-path="url(#hc)">${hairs.front || ''}</g>`));
        o.push(onHead(g, hat.front));
      } else o.push(onHead(g, (hairs.tall || '') + (hairs.front || '')));
    }
    o.push('</g></g>');
    return wrap(o.join(''), L, g, emote);
  }

  /* ================= ARKADAN, KOŞARKEN ================= */
  function back(L, step) {
    const g = geo(L);
    const up = step === 0;
    const hc = hood(L, g, 'back');
    const hat = hc ? {} : hatSvg(L.hat, shade(L.topC, 0.95), 'back');
    const bi = backItem(L, g, 'back', up);
    const o = [];
    o.push(`<ellipse cx="${cx}" cy="${g.ankle + 14}" rx="${60 * g.Bm}" ry="9" fill="#000" opacity=".18"/>`);
    if (bi.under) o.push(bi.under);
    o.push(legs(L, g, 'back', step));
    if (L.costume === 'dragon') { const sw = up ? 40 : -40; o.push(`<path d="M${cx - 10} ${g.hip}q${sw / 2} 40 ${sw} 56q10 6 18 -2q-${sw / 2 + 10} -20 -6 -56z" fill="${COST.dragon.body}" ${S4}/>`); }
    // kollar (gövdenin arkasında kalan kısım için önce)
    o.push(arm(L, g, -1, up ? 'backswing' : 'fwd'), arm(L, g, 1, up ? 'fwd' : 'backswing'));
    const col = topLook(L).col;
    o.push(`<path d="${torsoPath(g, true)}" fill="${col}" ${S4}/><path d="${torsoPath(g, true)}" fill="url(#tg)"/>`);
    o.push(topDetails(L, g, true));
    if (bi.over) o.push(bi.over);
    o.push(neckWear(L, g, true, up));
    // kafa (arkadan)
    const earX = cx + g.w + 1;
    if (hc) {
      o.push(hc.back, hc.top);
    } else {
      if (!hat.hide) o.push(`<ellipse cx="${320 - earX}" cy="${g.hy + 4}" rx="9" ry="13" fill="${L.skinC}" ${S3}/><ellipse cx="${earX}" cy="${g.hy + 4}" rx="9" ry="13" fill="${L.skinC}" ${S3}/>`);
      o.push(`<path d="${headPath(g)}" fill="${L.skinC}" ${S4}/>`);
      if (hat.back) o.push(onHead(g, hat.back));
      else o.push(onHead(g, hairBackView(L.hair, L.hairC, up)));
      if (hat.front && !hat.hide) o.push(onHead(g, hat.front));
    }
    return wrap(o.join(''), L, g);
  }

  // Ortak: gradyanlar ve hareket (emote) animasyonları
  function wrap(body, L, g, emote) {
    const defs = `<defs><radialGradient id="fg" cx=".36" cy=".32" r=".85"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".14"/></radialGradient><linearGradient id="tg" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".12"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></linearGradient></defs>`;
    let css = '';
    const sR = `${cx + g.sw - 7}px ${g.sh + 14}px`, sL = `${cx - g.sw + 7}px ${g.sh + 14}px`, hipO = `${cx}px ${g.hip}px`, neckO = `${cx}px ${g.sh}px`;
    const base = '.al,.ar,.bd,.hd{transform-box:view-box}';
    switch (emote) {
      case 'idle': css = `${base}.bd{transform-origin:${hipO};animation:b 2.6s ease-in-out infinite}@keyframes b{50%{transform:translateY(2px) scaleY(.99)}}`; break;
      case 'wave': css = `${base}.ar{transform-origin:${sR};animation:w 1.1s ease-in-out infinite}@keyframes w{0%,100%{transform:rotate(-150deg)}50%{transform:rotate(-118deg)}}.hd{transform-origin:${neckO};transform:rotate(3deg)}`; break;
      case 'cheer': css = `${base}.ar{transform-origin:${sR};transform:rotate(-160deg)}.al{transform-origin:${sL};transform:rotate(160deg)}.bd{animation:j .6s ease-in-out infinite}@keyframes j{50%{transform:translateY(-10px)}}`; break;
      case 'dance': css = `${base}.bd{transform-origin:${hipO};animation:d 1s ease-in-out infinite}@keyframes d{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(6deg)}}.ar{transform-origin:${sR};animation:r1 .5s ease-in-out infinite alternate}.al{transform-origin:${sL};animation:r2 .5s ease-in-out infinite alternate}@keyframes r1{from{transform:rotate(-40deg)}to{transform:rotate(-150deg)}}@keyframes r2{from{transform:rotate(150deg)}to{transform:rotate(40deg)}}`; break;
      case 'dab': css = `${base}.al{transform-origin:${sL};transform:rotate(125deg)}.ar{transform-origin:${sR};transform:rotate(-70deg)}.hd{transform-origin:${neckO};transform:rotate(-16deg) translate(8px,6px)}.bd{animation:p 1.4s ease-in-out infinite}@keyframes p{50%{transform:scale(1.02)}}`; break;
      case 'zibo': css = `${base}.bd{transform-origin:${hipO};animation:z .3s steps(2) infinite}@keyframes z{50%{transform:translateX(-8px) rotate(-4deg)}}.ar{transform-origin:${sR};transform:rotate(-100deg)}.al{transform-origin:${sL};transform:rotate(100deg)}`; break;
      default: break;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 400" width="320" height="400">${defs}${css ? `<style>${css}</style>` : ''}${body}</svg>`;
  }

  /* ---------- Dışarıya ---------- */
  const mine = () => CZ.state.data.look || {};
  // name: 'boy', 'girl', 'boy_run1'. Sonda '@wave' gibi hareket olabilir.
  function url(name, raw, emote) {
    let [n, em] = name.split('@');
    const [kind, frame] = n.split('_');
    const L = resolve(raw || mine(), kind);
    const e = em || emote || '';
    const key = n + '|' + e + '|' + JSON.stringify(L);
    if (cache[key]) return cache[key];
    const svg = frame ? back(L, frame === 'run1' ? 0 : 1) : front(L, e);
    cache[key] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    return cache[key];
  }

  // Komşu botları için rastgele ama her gün aynı görünüş
  function botLook(seed, kind) {
    const r = n => { const x = Math.sin(seed * 9301 + n * 49297) * 10000; return x - Math.floor(x); };
    const L = {};
    let i = 1;
    Object.keys(CZ.CATALOG).forEach(cat => {
      const list = CZ.CATALOG[cat].filter(x => !x.unlock && (!x.g || x.g === kind));
      L[cat] = list[Math.floor(r(i++) * list.length)].id;
    });
    ['skin', 'hairColor', 'eyeColor', 'topColor', 'bottomColor', 'shoeColor'].forEach(k => {
      const pal = k === 'skin' ? P.skin.slice(0, 8) : k === 'hairColor' ? P.hair : k === 'eyeColor' ? P.eyes : P.cloth;
      L[k] = Math.floor(r(i++) * pal.length);
    });
    if (r(99) < 0.75) L.costume = 'none';
    if (r(98) < 0.5) L.hat = 'none';
    if (r(97) < 0.6) L.glasses = 'none';
    if (r(96) < 0.6) L.back = 'none';
    if (kind === 'girl' || r(95) < 0.7) L.beard = 'none';
    return L;
  }

  return { url, resolve, botLook };
})();
