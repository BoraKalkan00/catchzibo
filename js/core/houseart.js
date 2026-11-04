// Ev çizimi: üstten-yandan (izometrik) dış görünüş ve önden oda içi. Hepsi SVG metni.
// Tek seferlik çizilir (her karede değil), telefonu ısıtmaz.
CZ.houseArt = (function () {
  const INK = '#33211f';
  const ST = `stroke="${INK}" stroke-width="2" stroke-linejoin="round"`;
  const paintC = (kind, id) => (CZ.PAINTS[kind].find(p => p.id === id) || CZ.PAINTS[kind][0]).c;

  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    const f = v => Math.max(0, Math.min(255, Math.round(k >= 1 ? v + (255 - v) * (k - 1) : v * k)));
    const r = f(n >> 16), g = f((n >> 8) & 255), b = f(n & 255);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /* ================= İZOMETRİK DIŞ GÖRÜNÜŞ ================= */
  let U = 22, OX = 200, OY = 120;
  const P = (x, y, z) => [OX + (x - y) * U * 0.866, OY + (x + y) * U * 0.5 - z * U];
  const pt = p => p[0].toFixed(1) + ' ' + p[1].toFixed(1);
  const path = (pts, fill, extra) => `<path d="M${pts.map(pt).join('L')}Z" fill="${fill}" ${extra === undefined ? ST : extra}/>`;
  const line = (a, b) => `M${pt(a)}L${pt(b)}`;

  // Bir yüzey üzerindeki (u, v) noktası: 'y' yüzeyi için u = x, 'x' yüzeyi için u = y. v = yükseklik.
  const onFace = (axis, c) => axis === 'y' ? (u, v) => P(u, c, v) : (u, v) => P(c, u, v);
  const quad = (F, u0, u1, v0, v1) => [F(u0, v0), F(u1, v0), F(u1, v1), F(u0, v1)];
  const ell = (F, cu, cv, ru, rv, n) => Array.from({ length: n || 14 }, (_, i) => {
    const a = i / (n || 14) * Math.PI * 2;
    return F(cu + Math.cos(a) * ru, cv + Math.sin(a) * rv);
  });

  // Duvar dokusu: tuğla boyada tuğla derzleri, diğer boyalarda yatay tahta kaplama çizgileri.
  function texture(F, u0, u1, v0, v1, brick) {
    let dd = '';
    if (brick) {
      let row = 0;
      for (let v = v0; v < v1 - 0.01; v += 0.22, row++) {
        if (v > v0) dd += line(F(u0, v), F(u1, v));
        const top = Math.min(v1, v + 0.22);
        for (let u = u0 + (row % 2 ? 0.25 : 0.5); u < u1 - 0.05; u += 0.5) dd += line(F(u, v), F(u, top));
      }
      return `<path d="${dd}" stroke="#000" stroke-opacity=".2" stroke-width="1" fill="none"/>`;
    }
    for (let v = v0 + 0.3; v < v1 - 0.05; v += 0.3) dd += line(F(u0, v), F(u1, v));
    return `<path d="${dd}" stroke="#000" stroke-opacity=".1" stroke-width="1" fill="none"/>`;
  }

  // İnce kutu (duvar parçası, temel, baca...). Görünen yüzler: üst, +y (sol-ön), +x (sağ-ön).
  function box(x0, x1, y0, y1, z0, z1, color, opts) {
    const o = opts || {};
    const top = [P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)];
    const fy = [P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)];
    const fx = [P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)];
    let s = path(fy, shade(color, 1.0)) + path(fx, shade(color, 0.78));
    if (o.tex) {
      s += texture(onFace('y', y1), x0, x1, z0, z1, o.brick);
      s += texture(onFace('x', x1), y0, y1, z0, z1, o.brick);
    }
    if (!o.noTop) s += path(top, o.topColor || shade(color, 1.15));
    return s;
  }

  // Penceresi, kapısı olan bir yüz için ayrıntılar.
  function windowOn(F, u0, u1, v0, v1, lvl) {
    let s = path(quad(F, u0 - 0.08, u1 + 0.08, v0 - 0.08, v1 + 0.08), '#f7f1e3');
    s += path(quad(F, u0, u1, v0, v1), '#ffd772', `stroke="${INK}" stroke-width="1.5"`);
    s += path(quad(F, u0, u1, (v0 + v1) / 2 + 0.05, v1), '#ffe7a3', 'stroke="none"');
    const mu = (u0 + u1) / 2, mv = (v0 + v1) / 2;
    s += `<path d="${line(F(mu, v0), F(mu, v1))}${line(F(u0, mv), F(u1, mv))}" stroke="${INK}" stroke-width="1.6"/>`;
    if (lvl >= 2) { // kepenkler
      s += path(quad(F, u0 - 0.36, u0 - 0.1, v0, v1), '#6d8f4e');
      s += path(quad(F, u1 + 0.1, u1 + 0.36, v0, v1), '#6d8f4e');
    }
    if (lvl >= 3) { // demir parmaklık
      let dd = '';
      for (let i = 1; i < 5; i++) { const u = u0 + (u1 - u0) * i / 5; dd += line(F(u, v0 - 0.05), F(u, v1 + 0.05)); }
      s += `<path d="${dd}" stroke="${lvl >= 4 ? '#c99a2e' : '#4a4f5c'}" stroke-width="2.4" stroke-linecap="round"/>`;
    }
    if (lvl >= 4) s += path(quad(F, u0 - 0.12, u1 + 0.12, v1 + 0.04, v1 + 0.16), '#8b93a3');
    return s;
  }

  function doorOn(F, u0, u1, v0, v1, lvl) {
    const wood = ['#8a5631', '#7a4a2a', '#5f3a22'][Math.min(2, lvl - 1)] || '#5f3a22';
    const steel = lvl >= 4;
    const base = steel ? (lvl >= 5 ? '#9aa3b2' : '#7d8696') : wood;
    let s = path(quad(F, u0 - 0.1, u1 + 0.1, v0, v1 + 0.1), '#e9dfc9');
    s += path(quad(F, u0, u1, v0, v1), base);
    let dd = '';
    if (!steel) for (let i = 1; i < 4; i++) { const u = u0 + (u1 - u0) * i / 4; dd += line(F(u, v0), F(u, v1)); }
    s += `<path d="${dd}" stroke="#000" stroke-opacity=".25" stroke-width="1"/>`;
    if (lvl >= 2) { // demir bantlar
      [0.25, 0.72].forEach(f => { s += path(quad(F, u0, u1, v0 + (v1 - v0) * f, v0 + (v1 - v0) * f + 0.12), steel ? '#5d6472' : '#4a4f5c', 'stroke="none"'); });
    }
    if (lvl >= 3) { // perçinler
      for (let i = 0; i < 4; i++) for (const f of [0.31, 0.78]) {
        const p = F(u0 + 0.12 + i * (u1 - u0 - 0.24) / 3, v0 + (v1 - v0) * f);
        s += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="1.4" fill="#d9dde4"/>`;
      }
    }
    if (lvl >= 5) { // kasa kapısı çarkı
      s += path(ell(F, (u0 + u1) / 2, (v0 + v1) / 2, 0.28, 0.28, 16), '#e0a92c', `stroke="${INK}" stroke-width="1.5"`);
      s += path(ell(F, (u0 + u1) / 2, (v0 + v1) / 2, 0.1, 0.1, 10), '#7d8696', 'stroke="none"');
    } else {
      const k = F(u1 - 0.16, (v0 + v1) / 2);
      s += `<circle cx="${k[0].toFixed(1)}" cy="${k[1].toFixed(1)}" r="2.4" fill="#f2c94c" stroke="${INK}" stroke-width="1"/>`;
    }
    if (lvl >= 4) s += path(quad(F, u0 - 0.1, u1 + 0.1, v1 + 0.1, v1 + 0.22), '#5d6472');
    return s;
  }

  // Duvar sağlamlığı: köşe taşları, taş kaide, metal üst bant.
  function wallTrim(F, u0, u1, v0, v1, lvl) {
    let s = '';
    if (lvl >= 1) {
      for (let v = v0 + 0.1, i = 0; v < v1 - 0.2; v += 0.36, i++) {
        const w = i % 2 ? 0.22 : 0.34;
        s += path(quad(F, u0, u0 + w, v, v + 0.3), '#d8d2c4', `stroke="${INK}" stroke-width="1"`);
        s += path(quad(F, u1 - w, u1, v, v + 0.3), '#d8d2c4', `stroke="${INK}" stroke-width="1"`);
      }
    }
    if (lvl >= 2) s += path(quad(F, u0, u1, v0, v0 + 0.45), '#9a958b', `stroke="${INK}" stroke-width="1.4"`);
    if (lvl >= 3) s += path(quad(F, u0, u1, v1 - 0.18, v1), '#5d6472', `stroke="${INK}" stroke-width="1.4"`);
    return s;
  }

  // Beşik çatı. axis 'x': mahya x boyunca. Görünen: arka eğim, sağ alın üçgeni, ön eğim.
  function roof(b, color, lvl, extra) {
    const o = 0.35, H = b.z1 - 0.12, R = b.z1 + b.rise;
    let s = '';
    const tiles = (pts, along) => {
      // eğim boyunca kiremit sıraları
      let dd = '';
      const [a, bb, c, dP] = pts; // a-b saçak, d-c mahya
      for (let i = 1; i < 6; i++) {
        const f = i / 6;
        const l = [a[0] + (dP[0] - a[0]) * f, a[1] + (dP[1] - a[1]) * f];
        const r = [bb[0] + (c[0] - bb[0]) * f, bb[1] + (c[1] - bb[1]) * f];
        dd += `M${pt(l)}L${pt(r)}`;
      }
      return `<path d="${dd}" stroke="#000" stroke-opacity=".22" stroke-width="1.2" fill="none"/>`;
    };
    if (b.axis === 'x') {
      const ym = (b.y0 + b.y1) / 2;
      const back = [P(b.x0 - o, b.y0 - o, H), P(b.x1 + o, b.y0 - o, H), P(b.x1 + o, ym, R), P(b.x0 - o, ym, R)];
      const front = [P(b.x0 - o, b.y1 + o, H), P(b.x1 + o, b.y1 + o, H), P(b.x1 + o, ym, R), P(b.x0 - o, ym, R)];
      const gable = [P(b.x1, b.y0, b.z1), P(b.x1, b.y1, b.z1), P(b.x1, ym, R - 0.2)];
      s += path(back, shade(color, 1.12)) + tiles(back);
      s += path(gable, shade(b.wall, 0.78));
      if (extra && extra.chimney) s += extra.chimney;
      s += path(front, color) + tiles(front);
      if (lvl >= 2) { // karlı saçak ve mahya
        s += path([P(b.x0 - o, ym, R + 0.06), P(b.x1 + o, ym, R + 0.06), P(b.x1 + o, ym + 0.45, R - 0.28), P(b.x0 - o, ym + 0.45, R - 0.28)], '#f4f8fd', `stroke="${INK}" stroke-width="1.4"`);
        s += path([P(b.x0 - o, b.y1 + o, H), P(b.x1 + o, b.y1 + o, H), P(b.x1 + o, b.y1 + o - 0.25, H + 0.2), P(b.x0 - o, b.y1 + o - 0.25, H + 0.2)], '#f4f8fd', `stroke="${INK}" stroke-width="1.2"`);
      }
      if (lvl >= 3) { // altın mahya ve rüzgar gülü
        s += `<path d="${line(P(b.x0 - o, ym, R + 0.08), P(b.x1 + o, ym, R + 0.08))}" stroke="#e0a92c" stroke-width="3.5" stroke-linecap="round"/>`;
        const v = P((b.x0 + b.x1) / 2, ym, R);
        s += `<path d="M${v[0]} ${v[1]}v-18" stroke="${INK}" stroke-width="2"/><path d="M${v[0]} ${v[1] - 18}l12 3-12 3z" fill="#e0a92c" ${ST}/><circle cx="${v[0]}" cy="${v[1] - 18}" r="2.5" fill="#e0a92c"/>`;
      }
      return { svg: s, eave: [P(b.x0 - o, b.y1 + o, H), P(b.x1 + o, b.y1 + o, H)], gableEdge: [P(b.x1 + o, b.y1 + o, H), P(b.x1 + o, ym, R), P(b.x1 + o, b.y0 - o, H)] };
    }
    // axis 'y': mahya y boyunca (arka kanat)
    const xm = (b.x0 + b.x1) / 2;
    const left = [P(b.x0 - o, b.y0 - o, H), P(b.x0 - o, b.y1 + o, H), P(xm, b.y1 + o, R), P(xm, b.y0 - o, R)];
    const right = [P(b.x1 + o, b.y0 - o, H), P(b.x1 + o, b.y1 + o, H), P(xm, b.y1 + o, R), P(xm, b.y0 - o, R)];
    const gable = [P(b.x0, b.y1, b.z1), P(b.x1, b.y1, b.z1), P(xm, b.y1, R - 0.2)];
    s += path(left, shade(color, 1.12)) + tiles(left);
    s += path(gable, b.wall);
    s += path(right, shade(color, 0.86)) + tiles(right);
    return { svg: s, eave: [P(b.x1 + o, b.y0 - o, H), P(b.x1 + o, b.y1 + o, H)], gableEdge: [] };
  }

  // Kanat (ek oda): tam kutu + pencere + çatı.
  function wing(b, wallC, brick, roofC, roofLvl, lights) {
    let s = box(b.x0, b.x1, b.y0, b.y1, b.z0, b.z1, wallC, { tex: true, brick, noTop: true });
    const Fy = onFace('y', b.y1), Fx = onFace('x', b.x1);
    if (b.winY) s += windowOn(Fy, b.winY[0], b.winY[1], b.z0 + 0.8, b.z0 + 1.6, 1);
    if (b.winX) s += windowOn(Fx, b.winX[0], b.winX[1], b.z0 + 0.8, b.z0 + 1.6, 1);
    const r = roof(b, roofC, roofLvl);
    s += r.svg;
    if (lights) lights.push(r.eave);
    return s;
  }

  // Bahçe süsleri (yüzeye dik "kart" gibi çizilir).
  let ownerUrl = null;
  function sprite(kind, x, y) {
    const [cx, cy] = P(x, y, 0);
    if (kind === 'owner') { const hgt = U * 2.6; return `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${U * 0.6}" ry="${U * 0.2}" fill="#000" opacity=".18"/><image href="${ownerUrl}" x="${(cx - hgt * 0.4).toFixed(1)}" y="${(cy - hgt).toFixed(1)}" width="${(hgt * 0.8).toFixed(1)}" height="${hgt.toFixed(1)}"/>`; }
    const T = (sx, sy) => `translate(${cx.toFixed(1)} ${cy.toFixed(1)}) scale(${sx || 1})`;
    if (kind === 'bush') return `<g transform="${T()}"><ellipse cx="0" cy="0" rx="15" ry="5" fill="#000" opacity=".15"/><circle cx="-7" cy="-9" r="9" fill="#3f8f4a" ${ST}/><circle cx="7" cy="-10" r="10" fill="#4aa457" ${ST}/><circle cx="0" cy="-17" r="9" fill="#58b765" ${ST}/><circle cx="-3" cy="-14" r="2" fill="#e8483e"/><circle cx="6" cy="-8" r="2" fill="#e8483e"/></g>`;
    if (kind === 'pot') return `<g transform="${T()}"><path d="M-7 -12h14l-3 12h-8z" fill="#c26a3d" ${ST}/><circle cx="-4" cy="-16" r="4.5" fill="#f37aa7" ${ST}/><circle cx="4" cy="-17" r="4.5" fill="#ffd34d" ${ST}/><circle cx="0" cy="-21" r="4.5" fill="#fff" ${ST}/></g>`;
    if (kind === 'snowman') return `<g transform="${T()}"><ellipse cx="0" cy="0" rx="14" ry="5" fill="#000" opacity=".15"/><circle cx="0" cy="-12" r="12" fill="#fff" ${ST}/><circle cx="0" cy="-30" r="8.5" fill="#fff" ${ST}/><path d="M-1 -30l9 2-9 2z" fill="#f08a2c"/><circle cx="-3" cy="-33" r="1.3" fill="${INK}"/><circle cx="3" cy="-33" r="1.3" fill="${INK}"/><path d="M-7 -38h14v-3h-3v-8h-8v8h-3z" fill="#2b2f3b" ${ST}/><path d="M-9 -23q9 4 18 0" stroke="#c2362f" stroke-width="4" fill="none"/></g>`;
    if (kind === 'tree') return `<g transform="${T()}"><ellipse cx="0" cy="0" rx="16" ry="5" fill="#000" opacity=".15"/><rect x="-3" y="-8" width="6" height="8" fill="#6b4226"/><path d="M0 -58l-14 22h6l-11 17h7l-12 13h48l-12-13h7l-11-17h6z" fill="#2f7d45" ${ST}/><path d="M0 -64l3 6 6 1-5 4 1 6-5-3-5 3 1-6-5-4 6-1z" fill="#ffd34d" ${ST}/><circle cx="-6" cy="-30" r="2.4" fill="#e8483e"/><circle cx="7" cy="-22" r="2.4" fill="#4fa3e8"/><circle cx="-9" cy="-14" r="2.4" fill="#ffd34d"/><circle cx="5" cy="-40" r="2.4" fill="#f37aa7"/></g>`;
    if (kind === 'lamp') return `<g transform="${T()}"><circle cx="0" cy="-44" r="16" fill="#ffd772" opacity=".28" class="tw"/><rect x="-1.8" y="-40" width="3.6" height="40" fill="#2b2f3b"/><path d="M-6 -48h12l-2 9h-8z" fill="#ffd772" ${ST}/><path d="M-7 -48l7-5 7 5z" fill="#2b2f3b" ${ST}/></g>`;
    return '';
  }

  // Çit: arka kenarlar evden önce, ön kenarlar evden sonra çizilir.
  function fenceEdge(a, b, axis, lvl, gate) {
    let s = '';
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = Math.round(len / (lvl >= 3 ? 1.6 : 0.8));
    const at = f => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
    const inGate = f => {
      if (!gate) return false;
      const p = at(f);
      return p[0] > gate[0] && p[0] < gate[1];
    };
    if (lvl >= 3) {
      // taş duvar parçaları
      for (let i = 0; i < n; i++) {
        const f0 = i / n, f1 = (i + 1) / n;
        if (inGate((f0 + f1) / 2)) continue;
        const p0 = at(f0), p1 = at(f1);
        const t = 0.18;
        const xs = axis === 'x' ? [p0[0], p1[0]] : [p0[0] - t, p0[0] + t];
        const ys = axis === 'x' ? [p0[1] - t, p0[1] + t] : [p0[1], p1[1]];
        s += box(Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys), 0, 0.75, '#a9a59c', { tex: true, brick: true, topColor: '#f4f8fd' });
        if (lvl >= 4) {
          const top = P((xs[0] + xs[1]) / 2, (ys[0] + ys[1]) / 2, 0.75);
          s += `<path d="M${top[0] - 5} ${top[1]}l2 -9 2 9 2 -9 2 9" stroke="#2b2f3b" stroke-width="1.8" fill="none"/>`;
        }
      }
      return s;
    }
    const h = lvl >= 2 ? 0.95 : 0.6;
    let posts = '', rails = '';
    for (let i = 0; i <= n; i++) {
      const f = i / n;
      if (inGate(f)) continue;
      const p = at(f);
      const g = P(p[0], p[1], 0), t2 = P(p[0], p[1], h);
      posts += `<path d="M${pt(g)}L${pt(t2)}" stroke="${INK}" stroke-width="${lvl >= 2 ? 6.5 : 5}" stroke-linecap="round"/><path d="M${pt(g)}L${pt(t2)}" stroke="${lvl >= 2 ? '#c99566' : '#b98a5a'}" stroke-width="${lvl >= 2 ? 3.5 : 2.4}" stroke-linecap="round"/>`;
      if (i < n && !inGate((i + 0.5) / n)) {
        const q = at((i + 1) / n);
        for (const z of (lvl >= 2 ? [0.3, 0.7] : [0.25, 0.5])) rails += `M${pt(P(p[0], p[1], z))}L${pt(P(q[0], q[1], z))}`;
      }
    }
    s += `<path d="${rails}" stroke="${INK}" stroke-width="4" fill="none"/><path d="${rails}" stroke="#d3a777" stroke-width="2" fill="none"/>` + posts;
    return s;
  }

  // Ana fonksiyon: evin tüm dış görünüşü. opts.ghost = sıradaki parça hayaleti; opts.fresh = yeni parça zıplasın.
  function exterior(H, opts) {
    const o = opts || {};
    U = o.unit || 21; OX = 200; OY = 118;
    ownerUrl = o.owner || null;
    const lv = id => H.parts[id] || 0;
    const ext = paintC('ext', H.paint.ext), roofC = paintC('roof', H.paint.roof);
    const brick = H.paint.ext === 'brick';
    const fresh = o.fresh;
    const wrap = (id, s) => s ? (fresh === id ? `<g class="pop">${s}</g>` : s) : '';
    const play = !!H.rooms.play;
    const Z0 = 0.3, ZH = play ? 5.1 : 2.8;
    const lights = [];
    const FX0 = -3.8, FX1 = 9.0, FY0 = -3.8, FY1 = 6.4;
    let out = '';

    // Zemin: havada duran karlı ada (toprak kenarlı), çam ağaçları ve taşlar — boş arsa bile canlı görünsün.
    const A0 = FX0 - 0.7, A1 = FX1 + 0.7, B0 = FY0 - 0.7, B1 = FY1 + 0.7, DEP = 2.4;
    out += path([P(A0, B1, 0), P(A1, B1, 0), P(A1, B1, -DEP), P(A0, B1, -DEP * 0.6)], '#7a5638', `stroke="${INK}" stroke-width="2"`);
    out += path([P(A1, B0, 0), P(A1, B1, 0), P(A1, B1, -DEP), P(A1, B0, -DEP * 0.6)], '#5e412a', `stroke="${INK}" stroke-width="2"`);
    out += path([P(A0, B1, 0), P(A1, B1, 0), P(A1, B1, -0.28), P(A0, B1, -0.22)], '#ffffff', 'stroke="none"');
    out += path([P(A1, B0, 0), P(A1, B1, 0), P(A1, B1, -0.28), P(A1, B0, -0.22)], '#e6eef8', 'stroke="none"');
    const pine = (x, y, k) => {
      const [bx, by] = P(x, y, 0);
      const w = U * 0.9 * k, hh = U * 2.6 * k;
      return `<rect x="${(bx - U * 0.12 * k).toFixed(1)}" y="${(by - U * 0.45 * k).toFixed(1)}" width="${(U * 0.24 * k).toFixed(1)}" height="${(U * 0.45 * k).toFixed(1)}" fill="#6b4226"/>`
        + [0, 1, 2].map(i => {
          const ty = by - U * 0.3 * k - i * hh * 0.28, ww = w * (1 - i * 0.24);
          return `<path d="M${(bx - ww).toFixed(1)} ${ty.toFixed(1)} L${bx.toFixed(1)} ${(ty - hh * 0.42).toFixed(1)} L${(bx + ww).toFixed(1)} ${ty.toFixed(1)}Z" fill="#2f7a4a" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`
            + `<path d="M${(bx - ww * 0.5).toFixed(1)} ${(ty - hh * 0.2).toFixed(1)} L${bx.toFixed(1)} ${(ty - hh * 0.42).toFixed(1)} L${(bx + ww * 0.5).toFixed(1)} ${(ty - hh * 0.2).toFixed(1)}Z" fill="#ffffff"/>`;
        }).join('');
    };
    const rock = (x, y, k) => { const [bx, by] = P(x, y, 0); return `<ellipse cx="${bx.toFixed(1)}" cy="${(by - 3).toFixed(1)}" rx="${(U * 0.45 * k).toFixed(1)}" ry="${(U * 0.28 * k).toFixed(1)}" fill="#9aa3b4" stroke="${INK}" stroke-width="2"/><ellipse cx="${bx.toFixed(1)}" cy="${(by - 3 - U * 0.14 * k).toFixed(1)}" rx="${(U * 0.32 * k).toFixed(1)}" ry="${(U * 0.12 * k).toFixed(1)}" fill="#fff"/>`; };
    out += path([P(FX0 - 0.7, FY0 - 0.7, 0), P(FX1 + 0.7, FY0 - 0.7, 0), P(FX1 + 0.7, FY1 + 0.7, 0), P(FX0 - 0.7, FY1 + 0.7, 0)], '#e8f0f8', `stroke="#b9c9dc" stroke-width="2"`);
    out += path([P(FX0 - 0.2, FY0 - 0.2, 0), P(FX1 + 0.2, FY0 - 0.2, 0), P(FX1 + 0.2, FY1 + 0.2, 0), P(FX0 - 0.2, FY1 + 0.2, 0)], '#f6f9fd', 'stroke="none"');
    out += pine(FX0 - 0.1, FY0 - 0.1, 1.7) + pine(FX0 + 1.6, FY0 - 0.3, 1.25) + pine(FX1 - 0.4, FY0 - 0.2, 1.5) + pine(FX0 - 0.2, FY1 - 1.5, 1.3) + rock(FX0 + 0.2, FY1 - 0.8, 0.9) + rock(FX1 - 1.2, FY0 + 1.2, 0.7);
    if (!lv('found')) {
      // Henüz temel yok: inşaat yeri kesik çizgiyle gösterilir
      out += path([P(-0.3, -0.3, 0.02), P(5.3, -0.3, 0.02), P(5.3, 4.3, 0.02), P(-0.3, 4.3, 0.02)], 'none', `stroke="#e0a020" stroke-width="3" stroke-dasharray="8 6"`);
    }
    if (lv('found')) {
      for (let y = 4.4; y < FY1 - 0.3; y += 0.7) out += path([P(0.95, y, 0), P(2.05, y, 0), P(2.05, y + 0.5, 0), P(0.95, y + 0.5, 0)], '#c9c3b8', `stroke="#9a958b" stroke-width="1"`);
    }

    const fl = lv('fence');
    const gate = fl ? [P(0.6, FY1, 0)[0], P(2.4, FY1, 0)[0]] : null;
    if (fl) {
      out += wrap('fence', fenceEdge([FX0, FY0], [FX1, FY0], 'x', fl) + fenceEdge([FX0, FY0], [FX0, FY1], 'y', fl));
    }

    // Arka kanatlar (mutfak: sol arka, banyo: sağ arka)
    const wallBox = { kitchen: { x0: -3.2, x1: 0, y0: 0.5, y1: 3.5, z0: Z0, z1: 2.5, rise: 1.4, axis: 'x', winY: [-2.4, -1.2] },
      bath: { x0: 1, x1: 4.2, y0: -3.2, y1: 0, z0: Z0, z1: 2.5, rise: 1.4, axis: 'y', winX: [-2.4, -1.4] },
      bedroom: { x0: 5, x1: 8.4, y0: 0.6, y1: 3.8, z0: Z0, z1: 2.5, rise: 1.5, axis: 'x', winY: [6.2, 7.4], winX: [1.6, 2.8] } };
    ['kitchen', 'bath'].forEach(id => {
      if (!H.rooms[id]) return;
      const b = Object.assign({ wall: ext }, wallBox[id]);
      out += wrap('room.' + id, box(b.x0 - 0.15, b.x1 + 0.15, b.y0 - 0.15, b.y1 + 0.15, 0, Z0, '#a9a59c') + wing(b, ext, brick, roofC, lv('roof'), lv('lights') >= 2 ? lights : null));
    });

    // Temel
    if (lv('found')) out += wrap('found', box(-0.3, 5.3, -0.3, 4.3, 0, Z0, '#a9a59c', { tex: true, brick: true, topColor: '#cfc9bd' }));
    // İç zemin (çatı yoksa görünür)
    if (lv('found') && !lv('roof')) {
      let dd = '';
      for (let x = 0.5; x < 5; x += 0.5) dd += line(P(x, 0, Z0), P(x, 4, Z0));
      out += `<path d="${dd}" stroke="#000" stroke-opacity=".1" stroke-width="1"/>`;
    }

    // Duvarlar: arka iki duvar önce, ön iki duvar sonra.
    const t = 0.25;
    const wl = lv('walls');
    const W = {
      wall1: () => box(0, t, t, 4 - t, Z0, ZH, ext, { tex: true, brick, topColor: shade(ext, 1.2) }),
      wall2: () => box(0, 5, 0, t, Z0, ZH, ext, { tex: true, brick, topColor: shade(ext, 1.2) }),
      wall4: () => {
        let s = box(5 - t, 5, t, 4 - t, Z0, ZH, ext, { tex: true, brick, topColor: shade(ext, 1.2) });
        const F = onFace('x', 5);
        s += wallTrim(F, t, 4 - t, Z0, ZH, wl);
        if (lv('win')) s += windowOn(F, 1.4, 2.6, Z0 + 1.0, Z0 + 2.0, lv('win'));
        if (play) s += windowOn(F, 1.4, 2.6, Z0 + 3.2, Z0 + 4.1, lv('win') || 1);
        return s;
      },
      wall3: () => {
        let s = box(0, 5, 4 - t, 4, Z0, ZH, ext, { tex: true, brick, topColor: shade(ext, 1.2) });
        const F = onFace('y', 4);
        s += wallTrim(F, 0, 5, Z0, ZH, wl);
        if (lv('door')) s += wrap('door', doorOn(F, 1.0, 2.0, Z0, Z0 + 1.85, lv('door')));
        if (lv('win')) s += wrap('win', windowOn(F, 3.0, 4.2, Z0 + 1.0, Z0 + 2.0, lv('win')));
        if (play) s += windowOn(F, 1.0, 2.0, Z0 + 3.2, Z0 + 4.1, lv('win') || 1) + windowOn(F, 3.0, 4.2, Z0 + 3.2, Z0 + 4.1, lv('win') || 1);
        return s;
      }
    };
    ['wall1', 'wall2', 'wall4', 'wall3'].forEach(id => { if (lv(id)) out += wrap(fresh === 'walls' ? 'walls' : id, W[id]()); });

    // Çatı ve baca
    if (lv('roof')) {
      const b = { x0: 0, x1: 5, y0: 0, y1: 4, z1: ZH, rise: 2.0, axis: 'x', wall: ext };
      let chimney = '';
      if (lv('chimney')) {
        const zTop = ZH + 2.0 + (lv('chimney') >= 2 ? 1.0 : 0.5);
        chimney = box(3.5, 4.2, 0.7, 1.4, ZH + 0.4, zTop, '#9c5a3c', { tex: true, brick: true, topColor: '#3a2a22' });
        if (lv('chimney') >= 2) {
          const c = P(3.85, 1.05, zTop);
          chimney += `<g class="smoke"><circle cx="${c[0]}" cy="${c[1] - 10}" r="6" fill="#dfe6ee"/><circle cx="${c[0] + 6}" cy="${c[1] - 22}" r="8" fill="#dfe6ee"/><circle cx="${c[0] + 14}" cy="${c[1] - 36}" r="10" fill="#dfe6ee"/></g>`;
        }
        chimney = wrap('chimney', chimney);
      }
      const r = roof(b, roofC, lv('roof'), { chimney });
      out += wrap('roof', r.svg);
      if (lv('lights')) { lights.push(r.eave); if (lv('lights') >= 2) lights.push(r.gableEdge); }
    }

    // Yatak odası kanadı (sağ ön): ana evin önünde kalır.
    if (H.rooms.bedroom) {
      const b = Object.assign({ wall: ext }, wallBox.bedroom);
      out += wrap('room.bedroom', box(b.x0 - 0.15, b.x1 + 0.15, b.y0 - 0.15, b.y1 + 0.15, 0, Z0, '#a9a59c') + wing(b, ext, brick, roofC, lv('roof'), lv('lights') >= 2 ? lights : null));
    }

    // Bahçe
    const g = lv('garden');
    const items = [];
    if (g >= 1) items.push(['bush', -2.4, 5.2], ['bush', 7.8, 4.8]);
    if (g >= 2) items.push(['pot', 0.55, 4.7], ['pot', 2.45, 4.7]);
    if (g >= 3) items.push(['snowman', 5.8, 5.4]);
    if (g >= 4) items.push(['tree', -2.4, 3.9]);
    if (lv('lights') >= 3) items.push(['lamp', 0.4, FY1 - 0.4], ['lamp', 2.6, FY1 - 0.4]);
    // Ev sahibi kapının önünde durur (kostümüyle).
    if (o.owner && lv('found')) items.push(['owner', 2.9, 5.0]);
    items.sort((a, b) => (a[1] + a[2]) - (b[1] + b[2]));
    out += wrap('garden', items.map(i => sprite(...i)).join(''));

    if (fl) out += wrap('fence', fenceEdge([FX0, FY1], [FX1, FY1], 'x', fl, gate) + fenceEdge([FX1, FY0], [FX1, FY1], 'y', fl));

    // Işıklar: saçaklar boyunca renkli ampuller
    if (lights.length) {
      const colors = ['#ff5a4f', '#ffd34d', '#59c26a', '#4fa3e8', '#f37aa7'];
      let bulbs = '', glow = '', wire = '';
      lights.forEach(seg => {
        for (let i = 0; i < seg.length - 1; i++) {
          const a = seg[i], b = seg[i + 1];
          const n = Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 13));
          wire += `M${pt(a)}`;
          for (let k = 0; k <= n; k++) {
            const f = k / n;
            const x = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f + Math.sin(f * Math.PI * n) * 2 + 3;
            wire += `L${x.toFixed(1)} ${(y - 2).toFixed(1)}`;
            const c = colors[(i * 7 + k) % colors.length];
            glow += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" fill="${c}" opacity=".3"/>`;
            bulbs += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6" fill="${c}" stroke="${INK}" stroke-width=".8"/>`;
          }
        }
      });
      out += wrap('lights', `<path d="${wire}" stroke="#2b2f3b" stroke-width="1" fill="none"/><g class="tw">${glow}</g>${bulbs}`);
    }

    // Sıradaki parçanın hayaleti: "burayı yap" diye yanıp söner.
    if (o.ghost) {
      const G = { found: () => box(-0.3, 5.3, -0.3, 4.3, 0, Z0, '#ffffff'), wall1: () => box(0, t, t, 4 - t, Z0, ZH, '#ffffff'),
        wall2: () => box(0, 5, 0, t, Z0, ZH, '#ffffff'), wall3: () => box(0, 5, 4 - t, 4, Z0, ZH, '#ffffff'),
        wall4: () => box(5 - t, 5, t, 4 - t, Z0, ZH, '#ffffff'), door: () => path(quad(onFace('y', 4), 1.0, 2.0, Z0, Z0 + 1.85), '#ffffff'),
        win: () => path(quad(onFace('y', 4), 3.0, 4.2, Z0 + 1.0, Z0 + 2.0), '#ffffff'),
        roof: () => roof({ x0: 0, x1: 5, y0: 0, y1: 4, z1: ZH, rise: 2.0, axis: 'x', wall: '#ffffff' }, '#ffffff', 1).svg };
      if (G[o.ghost]) out += `<g class="ghost">${G[o.ghost]().replace(new RegExp(INK, 'g'), '#e09a12').replace(/fill="#[0-9a-f]{6}"/g, 'fill="#ffd34d"')}</g>`;
    }
    // Görüntü kutusu arsaya göre: ev ekranda büyük görünsün.
    const L = P(FX0 - 0.7, FY1 + 0.7, 0)[0] - 4, R = P(FX1 + 0.7, FY0 - 0.7, 0)[0] + 4;
    const T = Math.min(P(FX0, FY0, 0)[1] - (play ? 9.5 : 7.2) * U, P(FX0 - 0.1, FY0 - 0.1, 0)[1] - 4.6 * U), B = P(FX1 + 0.7, FY1 + 0.7, -2.4)[1] + 4;
    const vb = o.viewBox || `${L.toFixed(0)} ${T.toFixed(0)} ${(R - L).toFixed(0)} ${(B - T).toFixed(0)}`;
    return `<svg class="house-svg" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg">${out}</svg>`;
  }

  /* ================= ODA İÇİ (önden) ================= */
  const S3 = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
  const tierC = (t, a, b, c) => [a, b, c][Math.max(0, Math.min(2, t - 1))];
  const gold = '#e0a92c';

  // Her eşya: (kademe) -> SVG, (0,0) alt orta noktası. Kademe 2 ayrıntı, kademe 3 lüks.
  const FURN_ART = {
    sofa: t => { const c = tierC(t, '#c0574b', '#3f78c8', '#7b4bb3'); return `<rect x="-70" y="-62" width="140" height="40" rx="14" fill="${shade(c, 0.85)}" ${S3}/><rect x="-78" y="-40" width="156" height="34" rx="12" fill="${c}" ${S3}/><rect x="-86" y="-52" width="22" height="50" rx="10" fill="${c}" ${S3}/><rect x="64" y="-52" width="22" height="50" rx="10" fill="${c}" ${S3}/><path d="M-66 -6v6M66 -6v6" ${S3}/>` + (t >= 2 ? `<rect x="-58" y="-58" width="30" height="22" rx="6" fill="#ffd34d" ${S3} transform="rotate(-8 -43 -47)"/><rect x="30" y="-58" width="30" height="22" rx="6" fill="#f37aa7" ${S3} transform="rotate(8 45 -47)"/>` : '') + (t >= 3 ? `<path d="M-78 -40h156" stroke="${gold}" stroke-width="4"/><path d="M-12 -62q12-12 24 0" stroke="${gold}" stroke-width="4" fill="none"/>` : ''); },
    tv: t => { const w = tierC(t, 70, 90, 110); return `<rect x="-${w / 2 + 8}" y="-34" width="${w + 16}" height="34" rx="4" fill="#8a5631" ${S3}/><rect x="-${w / 2}" y="-${34 + w * 0.6}" width="${w}" height="${w * 0.6}" rx="5" fill="#2b2f3b" ${S3}/><rect x="-${w / 2 - 6}" y="-${28 + w * 0.6}" width="${w - 12}" height="${w * 0.6 - 12}" rx="3" fill="${tierC(t, '#4f6fae', '#59c2d6', '#7fd36a')}"/><circle cx="${w / 4}" cy="-${18 + w * 0.4}" r="${w * 0.1}" fill="#ffd34d"/><path d="M-${w / 2 - 6} -${40 + w * 0.12}l${w * 0.3} -${w * 0.2} ${w * 0.25} ${w * 0.14} ${w * 0.3} -${w * 0.08}v${w * 0.16}h-${w * 0.85}z" fill="#3f8f4a" opacity=".8"/>` + (t >= 3 ? `<rect x="-${w / 2 + 30}" y="-70" width="16" height="36" rx="3" fill="#2b2f3b" ${S3}/><rect x="${w / 2 + 14}" y="-70" width="16" height="36" rx="3" fill="#2b2f3b" ${S3}/>` : ''); },
    rug: t => { const c = tierC(t, '#d9894b', '#3f8fb0', '#a8324a'); return `<ellipse cx="0" cy="-10" rx="${tierC(t, 80, 95, 110)}" ry="18" fill="${c}" ${S3}/><ellipse cx="0" cy="-10" rx="${tierC(t, 60, 75, 90)}" ry="12" fill="none" stroke="${t >= 3 ? gold : '#fff'}" stroke-width="3" opacity=".8"/>`; },
    lamp: t => `<path d="M-14 0h28l-6-8h-16z" fill="#2b2f3b" ${S3}/><rect x="-2.5" y="-${tierC(t, 80, 95, 110)}" width="5" height="${tierC(t, 80, 95, 110)}" fill="#2b2f3b"/><circle cx="0" cy="-${tierC(t, 100, 115, 130)}" r="${tierC(t, 30, 36, 42)}" fill="#ffe7a3" opacity=".35"/><path d="M-20 -${tierC(t, 88, 103, 118)}h40l-10 -26h-20z" fill="${tierC(t, '#f6d27a', '#f3a7c3', gold)}" ${S3}/>`,
    xmas: t => { const s = tierC(t, 0.75, 0.9, 1.05); return `<g transform="scale(${s})"><rect x="-8" y="-20" width="16" height="20" fill="#7a4a2c" ${S3}/><path d="M0 -150l-34 52h14l-26 40h14l-30 38h124l-30-38h14l-26-40h14z" fill="#2f7d45" ${S3}/><path d="M0 -164l6 12 13 2-10 9 3 13-12-7-12 7 3-13-10-9 13-2z" fill="#ffd34d" ${S3}/>` + [[-14, -110, '#e8483e'], [16, -88, '#4fa3e8'], [-22, -62, '#ffd34d'], [24, -48, '#f37aa7'], [0, -76, '#fff'], [-34, -34, '#4fa3e8'], [34, -28, '#e8483e']].slice(0, t * 3 + 1).map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="6" fill="${c}" ${S3}/>`).join('') + (t >= 2 ? `<rect x="-60" y="-26" width="28" height="26" fill="#c2362f" ${S3}/><path d="M-46 -26v26M-60 -14h28" stroke="${gold}" stroke-width="4"/>` : '') + (t >= 3 ? `<rect x="34" y="-34" width="34" height="34" fill="#3f78c8" ${S3}/><path d="M51 -34v34M34 -17h34" stroke="#fff" stroke-width="4"/>` : '') + '</g>'; },
    shelf: t => `<rect x="-60" y="-${tierC(t, 90, 120, 150)}" width="120" height="${tierC(t, 90, 120, 150)}" rx="4" fill="${t >= 3 ? '#5f3a22' : '#a86b3c'}" ${S3}/>` + Array.from({ length: t + 1 }, (_, i) => `<path d="M-56 -${30 + i * 30}h112" ${S3}/>`).join('') + (t >= 3 ? `<path d="M-60 -150h120" stroke="${gold}" stroke-width="5"/>` : ''),
    bed: t => { const c = tierC(t, '#4f8fd6', '#59b36a', '#a34d8f'); return `<rect x="-95" y="-${tierC(t, 90, 100, 120)}" width="22" height="${tierC(t, 90, 100, 120)}" rx="6" fill="${t >= 3 ? gold : '#8a5631'}" ${S3}/><rect x="-90" y="-40" width="180" height="32" rx="6" fill="#8a5631" ${S3}/><rect x="-78" y="-58" width="166" height="24" rx="10" fill="${c}" ${S3}/><rect x="-74" y="-66" width="40" height="18" rx="8" fill="#fff" ${S3}/><path d="M-90 -8v8M86 -8v8" ${S3}/>` + (t >= 2 ? `<path d="M-30 -58q30 10 60 0q20 -6 50 0" stroke="#fff" stroke-width="3" fill="none" opacity=".7"/><rect x="-30" y="-74" width="34" height="18" rx="8" fill="#ffd34d" ${S3}/>` : '') + (t >= 3 ? `<path d="M-84 -120q90 -40 180 0" stroke="${gold}" stroke-width="4" fill="none"/>` : ''); },
    wardrobe: t => `<rect x="-${tierC(t, 40, 50, 60)}" y="-${tierC(t, 130, 140, 150)}" width="${tierC(t, 80, 100, 120)}" height="${tierC(t, 130, 140, 150)}" rx="5" fill="${tierC(t, '#b77a45', '#e4d3b3', '#5f3a22')}" ${S3}/><path d="M0 -${tierC(t, 124, 134, 144)}v${tierC(t, 118, 128, 138)}" ${S3}/><circle cx="-7" cy="-70" r="3.5" fill="${t >= 3 ? gold : INK}"/><circle cx="7" cy="-70" r="3.5" fill="${t >= 3 ? gold : INK}"/>` + (t >= 2 ? `<rect x="-${tierC(t, 30, 40, 50)}" y="-${tierC(t, 120, 130, 140)}" width="${tierC(t, 22, 30, 38)}" height="40" rx="4" fill="#bfe0f5" ${S3}/>` : ''),
    night: t => `<rect x="-26" y="-46" width="52" height="46" rx="4" fill="${tierC(t, '#b77a45', '#e4d3b3', '#5f3a22')}" ${S3}/><path d="M-22 -24h44" ${S3}/><circle cx="0" cy="-34" r="3" fill="${INK}"/><circle cx="0" cy="-12" r="3" fill="${INK}"/><rect x="-2" y="-74" width="4" height="28" fill="#2b2f3b"/><path d="M-14 -70h28l-6-18h-16z" fill="${tierC(t, '#f6d27a', '#f3a7c3', gold)}" ${S3}/>` + (t >= 2 ? `<circle cx="0" cy="-80" r="22" fill="#ffe7a3" opacity=".3"/>` : '') + (t >= 3 ? `<rect x="10" y="-58" width="12" height="12" rx="2" fill="#4fa3e8" ${S3}/>` : ''),
    desk: t => `<rect x="-60" y="-64" width="120" height="12" rx="3" fill="${tierC(t, '#b77a45', '#e4d3b3', '#5f3a22')}" ${S3}/><path d="M-52 -52v52M52 -52v52" ${S3}/><rect x="10" y="-52" width="38" height="34" fill="${tierC(t, '#b77a45', '#e4d3b3', '#5f3a22')}" ${S3}/>` + (t >= 2 ? `<rect x="-40" y="-100" width="50" height="34" rx="3" fill="#2b2f3b" ${S3}/><rect x="-35" y="-95" width="40" height="24" fill="#59c2d6"/>` : `<rect x="-40" y="-74" width="34" height="10" fill="#4fa3e8" ${S3}/>`) + (t >= 3 ? `<path d="M30 -64v-30" stroke="#2b2f3b" stroke-width="3"/><circle cx="30" cy="-98" r="8" fill="${gold}" ${S3}/>` : ''),
    poster: t => `<rect x="-${tierC(t, 26, 32, 40)}" y="-${tierC(t, 70, 84, 100)}" width="${tierC(t, 52, 64, 80)}" height="${tierC(t, 70, 84, 100)}" fill="${t >= 3 ? gold : '#fff'}" ${S3}/><rect x="-${tierC(t, 20, 26, 32)}" y="-${tierC(t, 64, 78, 92)}" width="${tierC(t, 40, 52, 64)}" height="${tierC(t, 58, 72, 84)}" fill="#bfe0f5"/><path d="M-${tierC(t, 20, 26, 32)} -${tierC(t, 10, 10, 12)}l14 -24 10 12 12 -18 ${tierC(t, 4, 16, 28)} 30z" fill="#3f8f4a"/><circle cx="8" cy="-${tierC(t, 48, 58, 70)}" r="7" fill="#ffd34d"/>`,
    fridge: t => `<rect x="-${tierC(t, 34, 40, 50)}" y="-${tierC(t, 120, 140, 150)}" width="${tierC(t, 68, 80, 100)}" height="${tierC(t, 120, 140, 150)}" rx="10" fill="${tierC(t, '#f4f6fa', '#9fdcc0', '#c9ced8')}" ${S3}/><path d="M-${tierC(t, 34, 40, 50)} -${tierC(t, 80, 94, 100)}h${tierC(t, 68, 80, 100)}" ${S3}/><path d="M${tierC(t, 22, 28, 36)} -${tierC(t, 100, 118, 128)}v14M${tierC(t, 22, 28, 36)} -60v18" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>` + (t >= 2 ? `<circle cx="-14" cy="-110" r="6" fill="#e8483e"/><rect x="-6" y="-120" width="12" height="10" fill="#ffd34d" transform="rotate(10)"/>` : '') + (t >= 3 ? `<path d="M0 -150v150" ${S3}/>` : ''),
    stove: t => `<rect x="-44" y="-86" width="88" height="86" rx="6" fill="${tierC(t, '#f4f6fa', '#e8483e', '#2b2f3b')}" ${S3}/><rect x="-34" y="-58" width="68" height="44" rx="4" fill="#2b2f3b" ${S3}/><rect x="-28" y="-52" width="56" height="32" rx="3" fill="${t >= 2 ? '#f08a2c' : '#4a4f5c'}" opacity=".8"/><circle cx="-20" cy="-74" r="5" fill="${INK}"/><circle cx="0" cy="-74" r="5" fill="${INK}"/><circle cx="20" cy="-74" r="5" fill="${INK}"/>` + (t >= 2 ? `<rect x="-30" y="-106" width="36" height="20" rx="4" fill="#9aa3b2" ${S3}/><path d="M-20 -110q4-8 0-14M-8 -110q4-8 0-14" stroke="#dfe6ee" stroke-width="3" fill="none"/>` : '') + (t >= 3 ? `<path d="M-44 -86h88" stroke="${gold}" stroke-width="4"/>` : ''),
    table: t => `<ellipse cx="0" cy="-60" rx="${tierC(t, 56, 66, 76)}" ry="12" fill="${tierC(t, '#b77a45', '#e4d3b3', '#5f3a22')}" ${S3}/><path d="M-36 -52v52M36 -52v52" ${S3}/>` + (t >= 2 ? `<ellipse cx="-16" cy="-66" rx="14" ry="5" fill="#fff" ${S3}/><circle cx="20" cy="-72" r="9" fill="#e8483e" ${S3}/>` : '') + (t >= 3 ? `<rect x="-4" y="-98" width="8" height="28" fill="#fff" ${S3}/><path d="M0 -98q6-8 0-14q-6 6 0 14" fill="#ffd34d"/>` : ''),
    counter: t => `<rect x="-${tierC(t, 60, 75, 90)}" y="-70" width="${tierC(t, 120, 150, 180)}" height="70" rx="4" fill="${tierC(t, '#b77a45', '#9fdcc0', '#2b2f3b')}" ${S3}/><rect x="-${tierC(t, 64, 79, 94)}" y="-78" width="${tierC(t, 128, 158, 188)}" height="10" rx="3" fill="${t >= 3 ? '#efe9e1' : '#e4d3b3'}" ${S3}/><path d="M0 -66v60" ${S3}/><circle cx="-8" cy="-36" r="3" fill="${t >= 3 ? gold : INK}"/><circle cx="8" cy="-36" r="3" fill="${t >= 3 ? gold : INK}"/>` + (t >= 2 ? `<rect x="-${tierC(t, 50, 60, 72)}" y="-104" width="22" height="26" rx="4" fill="#bfe0f5" ${S3}/><circle cx="30" cy="-86" r="9" fill="#ffd34d" ${S3}/>` : ''),
    plant: t => `<path d="M-16 -32h32l-5 32h-22z" fill="${tierC(t, '#c26a3d', '#4fa3e8', gold)}" ${S3}/><path d="M0 -32q-26-30 -14-${tierC(t, 50, 70, 90)}q10 20 14 40q4-30 22-${tierC(t, 40, 60, 80)}q4 30-22 ${tierC(t, 60, 80, 100) - 32}" fill="#3f8f4a" ${S3}/>` + (t >= 3 ? `<circle cx="-8" cy="-80" r="6" fill="#f37aa7" ${S3}/><circle cx="16" cy="-74" r="6" fill="#fff" ${S3}/>` : ''),
    tub: t => `<path d="M-${tierC(t, 80, 90, 100)} -56h${tierC(t, 160, 180, 200)}v14q0 38 -40 38h-${tierC(t, 80, 100, 120)}q-40 0 -40-38z" fill="${tierC(t, '#f4f6fa', '#bfe0f5', '#f4f6fa')}" ${S3}/><path d="M-60 -4l-8 8M60 -4l8 8" ${S3}/><path d="M-${tierC(t, 70, 80, 90)} -52q40 10 ${tierC(t, 140, 160, 180)} 0" stroke="#7fc6ec" stroke-width="5" fill="none"/>` + (t >= 2 ? `<circle cx="-20" cy="-64" r="10" fill="#fff" ${S3}/><circle cx="-6" cy="-68" r="8" fill="#fff" ${S3}/><circle cx="8" cy="-62" r="9" fill="#fff" ${S3}/><path d="M30 -64q8-10 16 0z" fill="#ffd34d" ${S3}/>` : '') + (t >= 3 ? `<path d="M-100 -56h200" stroke="${gold}" stroke-width="5"/>` : ''),
    sink: t => `<rect x="-30" y="-60" width="60" height="60" rx="4" fill="${tierC(t, '#e4d3b3', '#9fdcc0', '#5f3a22')}" ${S3}/><path d="M-38 -66h76q0 14-14 14h-48q-14 0-14-14z" fill="#fff" ${S3}/><path d="M0 -66v-14h12" stroke="${t >= 3 ? gold : '#9aa3b2'}" stroke-width="5" fill="none" stroke-linecap="round"/>`,
    mirror: t => `<ellipse cx="0" cy="-${tierC(t, 40, 46, 54)}" rx="${tierC(t, 26, 32, 38)}" ry="${tierC(t, 36, 42, 50)}" fill="${t >= 3 ? gold : t >= 2 ? '#f3a7c3' : '#e4d3b3'}" ${S3}/><ellipse cx="0" cy="-${tierC(t, 40, 46, 54)}" rx="${tierC(t, 20, 26, 32)}" ry="${tierC(t, 30, 36, 44)}" fill="#cfe6f6"/><path d="M-8 -${tierC(t, 56, 62, 72)}l14 -10" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`,
    toilet: t => `<rect x="-14" y="-96" width="34" height="38" rx="6" fill="#fff" ${S3}/><path d="M-28 -58h56q0 30-20 34v24h-16v-24q-20-4-20-34z" fill="#fff" ${S3}/><rect x="-30" y="-62" width="60" height="8" rx="4" fill="${tierC(t, '#fff', '#4fa3e8', gold)}" ${S3}/>`,
    towel: t => `<path d="M-30 -110h60" stroke="${t >= 3 ? gold : '#9aa3b2'}" stroke-width="5" stroke-linecap="round"/><rect x="-24" y="-110" width="${tierC(t, 22, 22, 22)}" height="60" rx="4" fill="${tierC(t, '#f37aa7', '#59c26a', '#4fa3e8')}" ${S3}/>` + (t >= 2 ? `<rect x="2" y="-110" width="22" height="50" rx="4" fill="#ffd34d" ${S3}/>` : '') + (t >= 3 ? `<path d="M-24 -66h22M2 -70h22" stroke="#fff" stroke-width="3"/>` : ''),
    toybox: t => `<rect x="-40" y="-50" width="80" height="50" rx="4" fill="${tierC(t, '#e8483e', '#4fa3e8', gold)}" ${S3}/><path d="M-44 -50h88l-4 -10h-80z" fill="${shade(tierC(t, '#e8483e', '#4fa3e8', gold), 0.8)}" ${S3}/><circle cx="-14" cy="-66" r="10" fill="#ffd34d" ${S3}/><rect x="2" y="-80" width="22" height="22" rx="3" fill="#59c26a" ${S3}/>` + (t >= 2 ? `<path d="M-30 -60l-10 -24 14 4z" fill="#f37aa7" ${S3}/>` : '') + (t >= 3 ? `<circle cx="28" cy="-88" r="9" fill="#fff" ${S3}/><path d="M22 -96l-4-8M34 -96l4-8" ${S3}/>` : ''),
    console: t => `<rect x="-${tierC(t, 50, 60, 70)}" y="-30" width="${tierC(t, 100, 120, 140)}" height="30" rx="4" fill="#2b2f3b" ${S3}/><rect x="-${tierC(t, 44, 54, 64)}" y="-${30 + tierC(t, 56, 66, 76)}" width="${tierC(t, 88, 108, 128)}" height="${tierC(t, 56, 66, 76)}" rx="4" fill="#2b2f3b" ${S3}/><rect x="-${tierC(t, 38, 48, 58)}" y="-${24 + tierC(t, 56, 66, 76)}" width="${tierC(t, 76, 96, 116)}" height="${tierC(t, 44, 54, 64)}" fill="${tierC(t, '#59c2d6', '#7fd36a', '#f37aa7')}"/><rect x="-10" y="-${tierC(t, 60, 70, 80)}" width="20" height="16" fill="#ffd34d"/><rect x="-20" y="-24" width="40" height="14" rx="6" fill="#4a4f5c"/>` + (t >= 3 ? `<path d="M-70 -30h140" stroke="${gold}" stroke-width="4"/>` : ''),
    beanbag: t => `<path d="M-48 0q-10-50 20-62q30-10 54 6q26 20 22 56z" fill="${tierC(t, '#f08a2c', '#7b4bb3', '#e8483e')}" ${S3}/><path d="M-20 -40q14-6 30 4" stroke="#fff" stroke-width="3" fill="none" opacity=".6"/>` + (t >= 2 ? `<rect x="10" y="-24" width="30" height="20" rx="6" fill="#ffd34d" ${S3}/>` : '') + (t >= 3 ? `<circle cx="-30" cy="-10" r="4" fill="${gold}"/>` : ''),
    train: t => `<path d="M-90 -6h180" stroke="#8a5631" stroke-width="5"/>` + Array.from({ length: t + 1 }, (_, i) => `<rect x="${-70 + i * 48}" y="-38" width="40" height="28" rx="4" fill="${['#e8483e', '#4fa3e8', '#59c26a', '#ffd34d'][i]}" ${S3}/><circle cx="${-60 + i * 48}" cy="-8" r="6" fill="#2b2f3b"/><circle cx="${-40 + i * 48}" cy="-8" r="6" fill="#2b2f3b"/>`).join('') + `<rect x="-70" y="-56" width="14" height="18" fill="#2b2f3b" ${S3}/>`,
    kite: t => `<path d="M0 -150l30 40-30 50-30-50z" fill="${tierC(t, '#e8483e', '#4fa3e8', gold)}" ${S3}/><path d="M0 -150v90M-30 -110h60" stroke="${INK}" stroke-width="2"/><path d="M0 -60q10 20-6 36q12 10 4 24" stroke="${INK}" stroke-width="2" fill="none"/>` + Array.from({ length: t + 1 }, (_, i) => `<path d="M${-4 + (i % 2) * 8} ${-46 + i * 14}l6 4-6 4z" fill="#ffd34d"/>`).join('')
  };

  // Odaya göre eşya yerleri (x: 0-400, y: zemin çizgisi), ve sahne sırası (arkadan öne).
  const SLOTS = {
    living: { sofa: [140, 268], tv: [312, 214], rug: [190, 292], lamp: [36, 214], xmas: [378, 286], shelf: [80, 196] },
    bedroom: { bed: [130, 258], wardrobe: [340, 214], night: [252, 222], rug: [210, 292], desk: [56, 280], poster: [270, 150] },
    kitchen: { fridge: [46, 220], stove: [140, 214], counter: [270, 214], table: [210, 290], plant: [370, 286] },
    bath: { tub: [120, 270], sink: [292, 214], mirror: [292, 140], toilet: [362, 214], towel: [36, 200] },
    play: { toybox: [60, 280], console: [300, 214], beanbag: [250, 292], train: [140, 294], kite: [360, 170] }
  };
  const ORDER = ['poster', 'mirror', 'kite', 'towel', 'shelf', 'tv', 'console', 'wardrobe', 'night', 'fridge', 'stove', 'counter', 'sink', 'toilet', 'lamp', 'rug', 'bed', 'sofa', 'tub', 'desk', 'table', 'toybox', 'train', 'beanbag', 'xmas', 'plant'];

  function floorArt(kind, c) {
    let s = `<path d="M0 214H400V300H0Z" fill="${c}"/>`;
    if (kind === 'wood') { let dd = ''; for (let y = 226; y < 300; y += 14) { dd += `M0 ${y}H400`; for (let x = (y / 14 % 2) * 40 + 20; x < 400; x += 80) dd += `M${x} ${y - 14}V${y}`; } s += `<path d="${dd}" stroke="#000" stroke-opacity=".18" stroke-width="1.5"/>`; }
    if (kind === 'tile' || kind === 'checker') { let r = ''; for (let y = 214, i = 0; y < 300; y += 22, i++) for (let x = 0, j = 0; x < 400; x += 40, j++) { if (kind === 'checker' ? (i + j) % 2 : true) r += `<rect x="${x}" y="${y}" width="40" height="22" fill="${kind === 'checker' ? '#f4f6fa' : 'none'}" stroke="#000" stroke-opacity=".12"/>`; } s += r; }
    if (kind === 'carpet') s += `<path d="M0 230H400M0 252H400M0 276H400" stroke="#fff" stroke-opacity=".12" stroke-width="6"/>`;
    if (kind === 'marble') s += `<path d="M20 230q60 20 120 0t160 10M60 270q80-20 160 4t140-8" stroke="#b8b0a4" stroke-opacity=".5" stroke-width="2" fill="none"/>`;
    return s;
  }

  function interior(H, roomId, opts) {
    const o = opts || {};
    const room = H.rooms[roomId];
    const wallC = paintC('wall', room.wall), floorC = paintC('floor', room.floor);
    let s = `<rect x="0" y="0" width="400" height="214" fill="${wallC}"/>`;
    // duvar kağıdı çizgileri ve süpürgelik
    let dd = '';
    for (let x = 20; x < 400; x += 40) dd += `M${x} 0V180`;
    s += `<path d="${dd}" stroke="#fff" stroke-opacity=".25" stroke-width="10"/>`;
    s += `<rect x="0" y="180" width="400" height="34" fill="${shade(wallC, 0.85)}"/><path d="M0 180H400" stroke="${INK}" stroke-opacity=".3" stroke-width="3"/>`;
    // pencere: karlı gece
    const wx = roomId === 'bath' ? 150 : 170, ww = roomId === 'bath' ? 70 : 90;
    s += `<rect x="${wx - 6}" y="34" width="${ww + 12}" height="92" rx="6" fill="#f7f1e3" ${S3}/><rect x="${wx}" y="40" width="${ww}" height="80" fill="#1d2f55"/><circle cx="${wx + ww - 18}" cy="58" r="9" fill="#fff4c4"/>` +
      [[12, 56], [30, 90], [52, 70], [70, 102], [20, 110]].map(([x, y]) => `<circle cx="${wx + x * ww / 90}" cy="${y}" r="2" fill="#fff"/>`).join('') +
      `<path d="M${wx} 112q${ww / 2} -14 ${ww} 0V120H${wx}z" fill="#e8f0f8"/><path d="M${wx + ww / 2} 40V120M${wx} 80H${wx + ww}" stroke="#f7f1e3" stroke-width="5"/>`;
    s += floorArt(room.floor, floorC);
    s += `<path d="M0 214H400" stroke="${INK}" stroke-opacity=".35" stroke-width="3"/>`;
    const slots = SLOTS[roomId];
    const list = CZ.house.roomDef(roomId).furn.slice().sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
    list.forEach(f => {
      const tier = room.furn[f] || 0;
      const [x, y] = slots[f];
      if (!tier) {
        if (o.empty !== false) s += `<g class="slot-ghost" transform="translate(${x} ${y})"><ellipse cx="0" cy="-4" rx="28" ry="8" fill="#fff" opacity=".35"/></g>`;
        return;
      }
      const body = FURN_ART[f](tier);
      const cls = o.fresh === f ? 'pop' : '';
      s += `<g transform="translate(${x} ${y})"><g class="${cls}">${body}</g></g>`;
      // Kupa rafı: bulunan eşyalar rafta durur.
      if (f === 'shelf' && o.trophies) {
        const n = Math.min(o.trophies.length, (tier + 1) * 3);
        for (let i = 0; i < n; i++) {
          const row = Math.floor(i / 3), col = i % 3;
          s += `<image href="${o.trophies[i]}" x="${x - 54 + col * 36}" y="${y - 30 - row * 30 - 26}" width="30" height="28"/>`;
        }
      }
    });
    return `<svg class="room-svg" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
  }

  // Malzeme simgeleri (küçük SVG).
  const MAT_ICON = {
    brick: `<rect x="3" y="8" width="26" height="16" rx="2" fill="#c4643f" ${ST}/><path d="M3 16h26M12 8v8M20 16v8" stroke="${INK}" stroke-width="1.5"/>`,
    wood: `<rect x="4" y="9" width="24" height="7" rx="3" fill="#b77a45" ${ST}/><rect x="4" y="17" width="24" height="7" rx="3" fill="#c99566" ${ST}/><circle cx="26" cy="12.5" r="2" fill="#e4d3b3"/>`,
    stone: `<path d="M5 22l3-10 9-4 9 5 2 9-6 4H10z" fill="#a9a59c" ${ST}/><path d="M12 14l5 3" stroke="${INK}" stroke-width="1.5"/>`,
    glass: `<rect x="7" y="5" width="18" height="22" rx="2" fill="#bfe0f5" ${ST}/><path d="M11 10l6-3M11 16l9-5" stroke="#fff" stroke-width="2"/>`,
    tile: `<path d="M4 20q6-10 12 0q6-10 12 0v5H4z" fill="#c2362f" ${ST}/><path d="M4 13q6-10 12 0q6-10 12 0" fill="#d9574f" ${ST}/>`,
    gold: `<circle cx="16" cy="16" r="10" fill="#f2c94c" ${ST}/><circle cx="16" cy="16" r="5.5" fill="none" stroke="#c99a2e" stroke-width="2"/>`
  };
  const matIcon = id => `<svg class="mat-icon" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">${MAT_ICON[id] || ''}</svg>`;
  const furnIcon = (f, tier) => {
    const body = FURN_ART[f](Math.max(1, tier));
    return `<svg class="furn-icon" viewBox="-110 -170 220 180" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
  };

  return { exterior, interior, matIcon, furnIcon, SLOTS, shade };
})();
