// (22 Kas) BİNA İÇİ (Kingshot gibi): binaya dokununca çatı kalkar, yarım duvarlı oda + eşyalar görünür.
// Eşyalar seviyeye göre büyür/çoğalır; seviye 0 eşya yeri kesik çizgili boş alan olarak durur. Her eşyanın üstünde seviye rozeti.
CZ.interior = (function () {
  const texC = {};
  function canTex(T, key, w, h, draw) { if (texC[key]) return texC[key]; const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    const tx = new T.CanvasTexture(c); tx.anisotropy = 4; return (texC[key] = tx); }
  const M = (c, o) => CZ.style.mat(Object.assign({ color: c }, o || {}));
  const box = (T, g, mat, w, h, d, x, y, z, ry) => { const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); if (ry) m.rotation.y = ry; m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
  const cyl = (T, g, mat, r1, r2, h, x, y, z, seg) => { const m = new T.Mesh(new T.CylinderGeometry(r1, r2, h, seg || 12), mat); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
  const sph = (T, g, mat, r, x, y, z, sx, sy, sz) => { const m = new T.Mesh(new T.SphereGeometry(r, 12, 9), mat); m.position.set(x, y, z); m.scale.set(sx || 1, sy || 1, sz || 1); m.castShadow = true; g.add(m); return m; };
  let MT = null;
  function mats(T) { if (MT) return MT;
    MT = { wood: M(0x9a6638), dark: M(0x5e3a1e), light: M(0xc89460), stone: M(0x9aa2b0), stoneD: M(0x6e7684), plaster: M(0xf2e6cf), roofT: M(0x7a4a26),
      white: M(0xf6f4ee), red: M(0xc8403a), blue: M(0x3f6fb8), cloth: M(0x5a8a4a), iron: M(0x50545e), gold: M(0xf2c230, { emissive: 0x6a4a00 }), bread: M(0xd99a4a),
      fire: new T.MeshBasicMaterial({ color: 0xffa040 }), glow: new T.MeshBasicMaterial({ color: 0xffe08a }), rock: M(0x8a909c), straw: M(0xe0c070) };
    return MT; }
  // ---- eşya yapıcıları (yerel 0,0 zemine oturur; boyut ~1 birim) ----
  const F = {
    stove(T, g, L, m) { box(T, g, m.stone, 1.0, 0.75, 0.75, 0, 0.375, 0); box(T, g, m.stoneD, 1.04, 0.08, 0.8, 0, 0.78, 0);
      box(T, g, m.fire, 0.42, 0.26, 0.05, 0, 0.26, 0.38); cyl(T, g, m.stoneD, 0.16, 0.2, 1.4, -0.28, 1.45, -0.18, 8);
      if (L >= 2) { cyl(T, g, m.iron, 0.22, 0.18, 0.26, 0.18, 0.95, 0, 14); sph(T, g, m.white, 0.08, 0.18, 1.2, 0, 1, 1.6, 1); }
      if (L >= 3) for (let i = 0; i < 3; i++) cyl(T, g, m.wood, 0.07, 0.07, 0.6, 0.72, 0.08 + i * 0.13, -0.1 + (i % 2) * 0.14, 6).rotation.x = Math.PI / 2;
      if (L >= 4) cyl(T, g, m.iron, 0.16, 0.13, 0.2, -0.05, 0.92, 0.16, 12);
      if (L >= 5) box(T, g, m.gold, 1.06, 0.05, 0.05, 0, 0.7, 0.39); },
    table(T, g, L, m) { const len = 1.4 + Math.min(L, 5) * 0.12; box(T, g, m.light, len, 0.08, 0.7, 0, 0.62, 0); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => box(T, g, m.dark, 0.08, 0.6, 0.08, a * (len / 2 - 0.1), 0.3, b * 0.26));
      box(T, g, m.wood, len * 0.9, 0.07, 0.24, 0, 0.36, 0.55); if (L >= 2) box(T, g, m.wood, len * 0.9, 0.07, 0.24, 0, 0.36, -0.55);
      for (let i = 0; i < Math.min(6, L + 1); i++) { const x = -len / 2 + 0.25 + i * (len - 0.5) / Math.max(1, Math.min(6, L + 1) - 1); cyl(T, g, m.white, 0.12, 0.1, 0.03, x, 0.68, i % 2 ? -0.18 : 0.18, 14); if (L >= 3) sph(T, g, m.bread, 0.06, x, 0.72, i % 2 ? -0.18 : 0.18, 1.4, 0.8, 1); } },
    shelf(T, g, L, m) { box(T, g, m.wood, 1.2, 1.5, 0.08, 0, 0.75, -0.2); [-0.58, 0.58].forEach(x => box(T, g, m.dark, 0.08, 1.5, 0.4, x, 0.75, 0)); [0.35, 0.78, 1.2].forEach(y => box(T, g, m.light, 1.16, 0.05, 0.4, 0, y, 0));
      const n = L * 2; for (let i = 0; i < n; i++) sph(T, g, m.bread, 0.09, -0.42 + (i % 5) * 0.21, 0.42 + Math.floor(i / 5) * 0.43, 0.02, 1.6, 0.8, 1); },
    bunk(T, g, L, m) { const one = (x) => { [[-0.5, -0.32], [0.5, -0.32], [-0.5, 0.32], [0.5, 0.32]].forEach(([a, b]) => box(T, g, m.dark, 0.07, 1.4, 0.07, x + a, 0.7, b));
        [0.32, 0.98].forEach((y, k) => { box(T, g, m.wood, 1.06, 0.08, 0.7, x, y, 0); box(T, g, k ? m.blue : m.red, 0.98, 0.1, 0.62, x, y + 0.09, 0); box(T, g, m.white, 0.26, 0.08, 0.5, x - 0.34, y + 0.17, 0); }); };
      one(0); if (L >= 3) { const g2 = new T.Group(); g.add(g2); const g0 = g; g = g2; one(0); g = g0; g2.position.set(0, 0, 1.05); } if (L >= 5) { const g3 = new T.Group(); g.add(g3); const g0 = g; g = g3; one(0); g = g0; g3.position.set(0, 0, 2.1); } },
    fireplace(T, g, L, m) { box(T, g, m.stone, 1.2, 1.1, 0.5, 0, 0.55, -0.1); box(T, g, m.dark, 0.6, 0.5, 0.1, 0, 0.3, 0.16); box(T, g, m.fire, 0.42, 0.22 + L * 0.03, 0.06, 0, 0.18, 0.2);
      box(T, g, m.stoneD, 1.36, 0.12, 0.6, 0, 1.12, -0.1); if (L >= 2) cyl(T, g, m.stone, 0.22, 0.26, 1.2, 0, 1.75, -0.15, 8); if (L >= 3) box(T, g, m.red, 1.1, 0.02, 0.7, 0, 0.012, 0.7); if (L >= 4) sph(T, g, m.gold, 0.08, 0.4, 1.25, -0.05); },
    chest(T, g, L, m) { const s = 0.85 + L * 0.06; box(T, g, m.wood, 0.8 * s, 0.45 * s, 0.5 * s, 0, 0.225 * s, 0); box(T, g, m.dark, 0.84 * s, 0.14 * s, 0.54 * s, 0, 0.5 * s, 0);
      [-0.3, 0.3].forEach(x => box(T, g, L >= 3 ? m.gold : m.iron, 0.06, 0.6 * s, 0.56 * s, x * s, 0.3 * s, 0)); if (L >= 4) for (let i = 0; i < 4; i++) sph(T, g, m.gold, 0.07, -0.2 + i * 0.13, 0.62 * s, 0.05); },
    cart(T, g, L, m) { [-0.8, 0.8].forEach(z => box(T, g, m.iron, 2.4, 0.04, 0.06, 0, 0.03, z * 0.3)); for (let i = -4; i <= 4; i++) box(T, g, m.dark, 0.08, 0.04, 0.5, i * 0.28, 0.02, 0);
      box(T, g, m.iron, 0.9, 0.45, 0.6, 0, 0.45, 0); [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]].forEach(([a, b]) => { const w = cyl(T, g, m.dark, 0.12, 0.12, 0.06, a, 0.14, b, 10); w.rotation.x = Math.PI / 2; });
      for (let i = 0; i < 2 + L * 2; i++) sph(T, g, m.rock, 0.12 + (i % 3) * 0.03, -0.3 + (i % 4) * 0.2, 0.7 + Math.floor(i / 4) * 0.1, -0.15 + (i % 2) * 0.3); },
    rack(T, g, L, m) { box(T, g, m.wood, 1.2, 0.08, 0.3, 0, 1.0, 0); [-0.55, 0.55].forEach(x => box(T, g, m.dark, 0.08, 1.1, 0.3, x, 0.55, 0));
      for (let i = 0; i < Math.min(5, 1 + L); i++) { const x = -0.4 + i * 0.2; box(T, g, m.dark, 0.05, 0.9, 0.05, x, 0.55, 0.12).rotation.z = 0.12; box(T, g, m.iron, 0.3, 0.08, 0.06, x + 0.06, 1.0, 0.12); } },
    bucket(T, g, L, m) { for (let i = 0; i < Math.min(4, L); i++) { const x = (i - 1) * 0.42; cyl(T, g, m.wood, 0.2, 0.16, 0.36, x, 0.18, (i % 2) * 0.3, 12); cyl(T, g, M(0x5aa0e0), 0.18, 0.18, 0.02, x, 0.35, (i % 2) * 0.3, 12); } },
    saw(T, g, L, m) { box(T, g, m.light, 1.6, 0.1, 0.6, 0, 0.7, 0); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => box(T, g, m.dark, 0.09, 0.7, 0.09, a * 0.7, 0.35, b * 0.22));
      const bl = cyl(T, g, m.iron, 0.28 + L * 0.02, 0.28 + L * 0.02, 0.03, 0, 0.78, 0, 20); bl.rotation.x = Math.PI / 2; cyl(T, g, m.wood, 0.14, 0.14, 1.3, 0.1, 0.86, 0, 10).rotation.z = Math.PI / 2; },
    logs(T, g, L, m) { let k = 0; for (let r = 0; r < 3 && k < 2 + L * 2; r++) for (let i = 0; i < 4 - r && k < 2 + L * 2; i++, k++) { const c = cyl(T, g, m.wood, 0.15, 0.15, 1.2, (i - (3 - r) / 2) * 0.31, 0.15 + r * 0.27, 0, 10); c.rotation.x = Math.PI / 2; } },
    gold(T, g, L, m) { F.chest(T, g, L, m); for (let i = 0; i < L * 3; i++) sph(T, g, m.gold, 0.08, -0.5 + (i % 6) * 0.2, 0.06 + Math.floor(i / 6) * 0.1, 0.45, 1, 0.5, 1); },
    // ---- (22 Kas) diğer binaların eşyaları ----
    throne(T, g, L, m) { box(T, g, m.stone, 1.3, 0.2, 1.0, 0, 0.1, 0); box(T, g, L >= 3 ? m.gold : m.wood, 0.8, 0.5, 0.6, 0, 0.45, 0); box(T, g, L >= 3 ? m.gold : m.wood, 0.8, 1.2, 0.14, 0, 1.0, -0.26);
      box(T, g, m.red, 0.66, 0.08, 0.5, 0, 0.74, 0.02); box(T, g, m.red, 0.66, 0.9, 0.04, 0, 1.0, -0.18); [-0.42, 0.42].forEach(x => box(T, g, m.dark, 0.1, 0.4, 0.55, x, 0.85, 0));
      if (L >= 2) [-0.4, 0, 0.4].forEach(x => { const c = new T.Mesh(new T.ConeGeometry(0.07, 0.18, 6), m.gold); c.position.set(x, 1.68, -0.26); g.add(c); });
      if (L >= 4) { const cp = new T.Mesh(new T.PlaneGeometry(1.6, 1.4), m.red); cp.position.set(0, 0.008 + 0.14, 1.0); cp.rotation.x = -Math.PI / 2; g.add(cp); } },
    banner(T, g, L, m) { for (let i = 0; i < Math.min(3, 1 + Math.floor(L / 2)); i++) { const x = (i - 1) * 0.55; cyl(T, g, m.dark, 0.04, 0.04, 2.0, x, 1.0, 0, 6); box(T, g, i % 2 ? m.blue : m.red, 0.42, 0.8, 0.03, x, 1.45, 0.05); box(T, g, m.gold, 0.42, 0.06, 0.04, x, 1.86, 0.05); if (L >= 3) sph(T, g, m.gold, 0.07, x, 2.05, 0); } },
    maptable(T, g, L, m) { F.table(T, g, 0, m); const mp = new T.Mesh(new T.PlaneGeometry(1.1, 0.55), M(0xe8d6a8)); mp.rotation.x = -Math.PI / 2; mp.position.set(0, 0.665, 0); g.add(mp);
      for (let i = 0; i < L * 2; i++) { const c = new T.Mesh(new T.ConeGeometry(0.04, 0.12, 6), i % 2 ? m.red : m.blue); c.position.set(-0.4 + (i * 0.37) % 0.8, 0.73, -0.15 + (i % 3) * 0.13); g.add(c); }
      if (L >= 3) sph(T, g, M(0x5aa0e0), 0.12, 0.6, 0.78, 0.1); },
    scales(T, g, L, m) { box(T, g, m.dark, 0.6, 0.7, 0.4, 0, 0.35, 0); cyl(T, g, m.gold, 0.03, 0.03, 0.6, 0, 1.0, 0, 6); box(T, g, m.gold, 0.8, 0.04, 0.04, 0, 1.3, 0);
      [-0.4, 0.4].forEach((x, k) => { cyl(T, g, m.gold, 0.14, 0.1, 0.04, x, 1.05 + (k ? 0.05 : -0.05), 0, 12); }); for (let i = 0; i < L; i++) sph(T, g, m.gold, 0.06, -0.4 + (i % 3) * 0.04, 1.1, 0); },
    snow(T, g, L, m) { for (let i = 0; i < 3 + L * 3; i++) { const r = i < 6 ? 0 : 1; sph(T, g, m.white, 0.14, -0.4 + (i % 5) * 0.2, 0.14 + Math.floor(i / 5) * 0.2, (i % 2) * 0.2 - 0.1); } if (L >= 3) { sph(T, g, m.white, 0.28, 0.7, 0.28, 0); sph(T, g, m.white, 0.2, 0.7, 0.68, 0); box(T, g, m.dark, 0.3, 0.05, 0.3, 0.7, 0.88, 0); } },
    target(T, g, L, m) { cyl(T, g, m.dark, 0.04, 0.04, 1.2, 0, 0.6, -0.1, 6); [[0.45, m.white], [0.33, m.red], [0.2, m.white], [0.09, m.red]].forEach(([r, mm], k) => { const c = cyl(T, g, mm, r, r, 0.04, 0, 1.0, 0.0 + k * 0.012, 18); c.rotation.x = Math.PI / 2; });
      for (let i = 0; i < Math.min(5, L); i++) { const a = cyl(T, g, m.dark, 0.012, 0.012, 0.3, -0.15 + i * 0.08, 1.0 + (i % 2) * 0.1, 0.15, 4); a.rotation.x = Math.PI / 2; } },
    bell(T, g, L, m) { [-0.35, 0.35].forEach(x => box(T, g, m.dark, 0.1, 1.7, 0.1, x, 0.85, 0)); box(T, g, m.wood, 0.9, 0.12, 0.14, 0, 1.7, 0); const b = new T.Mesh(new T.CylinderGeometry(0.12, 0.28 + L * 0.02, 0.4, 14), m.gold); b.position.set(0, 1.38, 0); b.castShadow = true; g.add(b); sph(T, g, m.dark, 0.05, 0, 1.17, 0); },
    hay(T, g, L, m) { for (let i = 0; i < Math.min(6, 1 + L); i++) box(T, g, m.straw, 0.7, 0.4, 0.45, (i % 3 - 1) * 0.72, 0.2 + Math.floor(i / 3) * 0.4, 0); },
    trough(T, g, L, m) { box(T, g, m.wood, 1.3, 0.4, 0.5, 0, 0.2, 0); box(T, g, M(0x5aa0e0), 1.18, 0.04, 0.38, 0, 0.36, 0); if (L >= 2) box(T, g, m.straw, 0.5, 0.25, 0.4, 0.95, 0.12, 0); if (L >= 4) cyl(T, g, m.wood, 0.2, 0.16, 0.36, -0.95, 0.18, 0, 12); },
    saddle(T, g, L, m) { box(T, g, m.wood, 1.1, 0.08, 0.2, 0, 0.9, -0.1); [-0.5, 0.5].forEach(x => box(T, g, m.dark, 0.08, 0.95, 0.2, x, 0.47, -0.1)); for (let i = 0; i < Math.min(3, Math.ceil(L / 2)); i++) { const x = (i - 1) * 0.36; sph(T, g, L >= 3 ? m.red : m.dark, 0.16, x, 0.98, 0.02, 1, 0.6, 1.4); box(T, g, m.dark, 0.04, 0.4, 0.04, x, 0.7, 0.12); } },
    anvil(T, g, L, m) { cyl(T, g, m.wood, 0.28, 0.3, 0.45, 0, 0.22, 0, 10); box(T, g, m.iron, 0.6, 0.2, 0.26, 0, 0.55, 0); box(T, g, m.iron, 0.3, 0.12, 0.2, 0, 0.42, 0); const h2 = new T.Mesh(new T.ConeGeometry(0.1, 0.3, 8), m.iron); h2.rotation.z = Math.PI / 2; h2.position.set(0.42, 0.58, 0); g.add(h2);
      if (L >= 2) { box(T, g, m.dark, 0.05, 0.4, 0.05, -0.15, 0.82, 0.05).rotation.z = 0.5; box(T, g, m.iron, 0.16, 0.08, 0.08, -0.25, 0.98, 0.05); } if (L >= 4) box(T, g, m.fire, 0.2, 0.04, 0.08, 0.05, 0.67, 0); },
    furnace(T, g, L, m) { box(T, g, m.stoneD, 1.0, 1.0, 0.8, 0, 0.5, 0); box(T, g, m.fire, 0.5, 0.35 + L * 0.03, 0.05, 0, 0.35, 0.41); cyl(T, g, m.stoneD, 0.2, 0.26, 1.2, 0, 1.6, -0.1, 8);
      if (L >= 2) box(T, g, m.wood, 0.5, 0.35, 0.35, 0.8, 0.25, 0.1); if (L >= 3) for (let i = 0; i < 3; i++) box(T, g, m.iron, 0.3, 0.06, 0.12, 0.8, 0.47 + i * 0.07, 0.1); },
    shields(T, g, L, m) { F.rack(T, g, L, m); for (let i = 0; i < Math.min(3, Math.ceil(L / 2)); i++) { const s = cyl(T, g, i % 2 ? m.red : m.blue, 0.22, 0.22, 0.05, -0.35 + i * 0.35, 0.55, 0.22, 14); s.rotation.x = Math.PI / 2; cyl(T, g, m.gold, 0.06, 0.06, 0.07, -0.35 + i * 0.35, 0.55, 0.24, 8).rotation.x = Math.PI / 2; } },
    scope(T, g, L, m) { [[-0.2, -0.15], [0.2, -0.15], [0, 0.22]].forEach(([x, z]) => box(T, g, m.dark, 0.05, 1.0, 0.05, x, 0.5, z)); const tb = cyl(T, g, L >= 3 ? m.gold : m.iron, 0.07, 0.11, 0.8 + L * 0.06, 0, 1.08, 0, 12); tb.rotation.x = -1.0; },
    lantern(T, g, L, m) { for (let i = 0; i < Math.min(4, L); i++) { const x = (i - 1.5) * 0.36; cyl(T, g, m.dark, 0.02, 0.02, 0.6 + (i % 2) * 0.2, x, 0.3 + (i % 2) * 0.1, 0, 4); box(T, g, m.iron, 0.16, 0.22, 0.16, x, 0.7 + (i % 2) * 0.2, 0); sph(T, g, m.glow, 0.07, x, 0.7 + (i % 2) * 0.2, 0); } },
    oven(T, g, L, m) { sph(T, g, M(0xb0603a), 0.6, 0, 0.3, 0, 1, 0.9, 1); box(T, g, m.dark, 0.36, 0.3, 0.1, 0, 0.3, 0.55); box(T, g, m.fire, 0.26, 0.18, 0.06, 0, 0.26, 0.58); cyl(T, g, m.stoneD, 0.1, 0.12, 0.5, 0.25, 0.95, -0.2, 8);
      for (let i = 0; i < L; i++) cyl(T, g, M(0xc88a4a), 0.07, 0.07, 0.03, -0.25 + i * 0.12, 0.06, 0.75, 10); },
    dough(T, g, L, m) { F.table(T, g, 0, m); for (let i = 0; i < 2 + L * 2; i++) cyl(T, g, M(0xd8a060), 0.07, 0.07, 0.03, -0.5 + (i % 6) * 0.2, 0.68, -0.15 + Math.floor(i / 6) * 0.25, 10); if (L >= 2) cyl(T, g, m.white, 0.16, 0.12, 0.16, 0.55, 0.74, 0.1, 12); },
    jar(T, g, L, m) { for (let i = 0; i < Math.min(5, L); i++) { const x = (i - 2) * 0.28; cyl(T, g, M(0xbfe4ff, { transparent: true, opacity: 0.7 }), 0.12, 0.12, 0.3, x, 0.15, 0, 12); sph(T, g, M(0xc88a4a), 0.06, x, 0.12, 0); cyl(T, g, m.red, 0.13, 0.13, 0.04, x, 0.32, 0, 12); } },
    spikes(T, g, L, m) { for (let i = 0; i < 2 + L; i++) { const c = new T.Mesh(new T.ConeGeometry(0.07, 0.8, 6), m.wood); c.position.set(-0.6 + i * 0.22, 0.35, (i % 2) * 0.15); c.rotation.x = 0.5; c.castShadow = true; g.add(c); } box(T, g, m.dark, 1.4, 0.1, 0.12, 0, 0.12, 0); },
    barrels(T, g, L, m) { for (let i = 0; i < Math.min(6, 1 + L); i++) { const x = (i % 3 - 1) * 0.46, y = Math.floor(i / 3) * 0.55; cyl(T, g, m.wood, 0.2, 0.2, 0.52, x, 0.26 + y, 0, 12); [0.12, 0.4].forEach(dy => cyl(T, g, m.iron, 0.21, 0.21, 0.04, x, dy + y, 0, 12)); } },
    torch(T, g, L, m) { for (let i = 0; i < Math.min(3, Math.ceil(L / 2) + 1); i++) { const x = (i - 1) * 0.5; cyl(T, g, m.dark, 0.04, 0.05, 1.3, x, 0.65, 0, 6); const f = new T.Mesh(new T.ConeGeometry(0.09, 0.26, 8), m.fire); f.position.set(x, 1.42, 0); g.add(f); } },
    cell(T, g, L, m) { box(T, g, m.stoneD, 1.4, 0.08, 0.9, 0, 0.04, 0); for (let i = 0; i < 7; i++) cyl(T, g, m.iron, 0.025, 0.025, 1.4, -0.6 + i * 0.2, 0.7, 0.42, 6); box(T, g, m.iron, 1.3, 0.06, 0.06, 0, 1.38, 0.42);
      if (L >= 1) { sph(T, g, M(0x5aa040), 0.18, 0, 0.35, -0.1); sph(T, g, M(0x5aa040), 0.13, 0, 0.62, -0.1); [-1, 1].forEach(s => { const e = new T.Mesh(new T.ConeGeometry(0.05, 0.18, 6), M(0x5aa040)); e.position.set(s * 0.15, 0.66, -0.1); e.rotation.z = -s * 1.2; g.add(e); }); }
      if (L >= 3) box(T, g, m.straw, 0.6, 0.12, 0.4, -0.3, 0.1, -0.2); },
    chains(T, g, L, m) { box(T, g, m.stoneD, 1.0, 1.5, 0.12, 0, 0.75, -0.1); for (let c = 0; c < Math.min(3, L); c++) for (let i = 0; i < 6; i++) { const r = new T.Mesh(new T.TorusGeometry(0.05, 0.015, 6, 10), m.iron); r.position.set(-0.3 + c * 0.3, 1.3 - i * 0.09, 0); r.rotation.y = i % 2 ? Math.PI / 2 : 0; g.add(r); } },
    desk(T, g, L, m) { F.table(T, g, 0, m); box(T, g, m.dark, 0.4, 0.5, 0.4, 0, 0.25, 0.65); box(T, g, m.dark, 0.4, 0.5, 0.06, 0, 0.6, 0.85); for (let i = 0; i < L; i++) box(T, g, M(0xe8d6a8), 0.25, 0.02, 0.3, -0.4 + i * 0.12, 0.67 + i * 0.01, 0); if (L >= 2) { box(T, g, m.iron, 0.12, 0.16, 0.12, 0.5, 0.74, 0); sph(T, g, m.glow, 0.05, 0.5, 0.74, 0); } },
    bench(T, g, L, m) { F.saw(T, g, 0, m); for (let i = 0; i < L; i++) box(T, g, [m.red, m.blue, m.cloth][i % 3], 0.22, 0.22, 0.22, -0.55 + i * 0.26, 0.86, -0.12); },
    gifts(T, g, L, m) { let k = 0; for (let r = 0; r < 3 && k < 2 + L * 2; r++) for (let i = 0; i < 4 - r && k < 2 + L * 2; i++, k++) { const s = 0.3 - r * 0.03, x = (i - (3 - r) / 2) * 0.34, y = s / 2 + r * 0.3; box(T, g, [m.red, m.blue, m.cloth, m.gold][k % 4], s, s, s, x, y, 0); box(T, g, m.white, s + 0.01, s + 0.01, 0.05, x, y, 0); } },
    ribbon(T, g, L, m) { box(T, g, m.wood, 1.2, 0.06, 0.3, 0, 0.9, 0); [-0.55, 0.55].forEach(x => box(T, g, m.dark, 0.06, 0.9, 0.3, x, 0.45, 0)); for (let i = 0; i < Math.min(6, L + 1); i++) { const c = cyl(T, g, [m.red, m.blue, m.cloth, m.gold, m.white, m.red][i], 0.08, 0.08, 0.14, -0.4 + i * 0.16, 0.64, 0, 10); c.rotation.x = Math.PI / 2; } },
    sack(T, g, L, m) { for (let i = 0; i < Math.min(5, L); i++) { sph(T, g, m.straw, 0.26, (i - 2) * 0.36, 0.26, (i % 2) * 0.3, 1, 1.15, 1); sph(T, g, m.gold, 0.06, (i - 2) * 0.36, 0.58, (i % 2) * 0.3); } }
  };
  // bina başına eşya tipleri (sırası FURN ile aynı) + zemin + oda boyu
  const DEF = {
    canteen: { items: ['stove', 'table', 'shelf'], floor: 'plank', wall: 'plaster' },
    house: { items: ['bunk', 'fireplace', 'chest'], floor: 'plank', wall: 'plaster', slots: [[-0.3, -0.27], [0.27, -0.3], [0.22, 0.18]] },
    mine: { items: ['rack', 'cart', 'bucket'], floor: 'stone', wall: 'stone' },
    bakery: { items: ['saw', 'logs', 'rack'], floor: 'plank', wall: 'plaster' },
    goldmine: { items: ['bucket', 'gold', 'sack'], floor: 'stone', wall: 'stone' },
    elf: { items: ['bench', 'gifts', 'ribbon'], floor: 'plank', wall: 'plaster', rug: 0x2e8a4a },
    hall: { items: ['throne', 'banner', 'maptable'], floor: 'stone', wall: 'plaster', rug: 0xa82a2a, slots: [[0, -0.28], [-0.32, -0.3], [0.22, 0.14]] },
    vault: { items: ['chest', 'scales', 'gold'], floor: 'stone', wall: 'stone', rug: 0x6a3a8a },
    tower: { items: ['snow', 'target', 'bell'], floor: 'plank', wall: 'stone' },
    stable: { items: ['hay', 'trough', 'saddle'], floor: 'straw', wall: 'plaster', rug: 0 },
    forge: { items: ['anvil', 'furnace', 'shields'], floor: 'dark', wall: 'stone', rug: 0, slots: [[0.05, 0.1], [-0.28, -0.24], [0.3, -0.26]] },
    lookout: { items: ['scope', 'maptable', 'lantern'], floor: 'plank', wall: 'plaster' },
    cookie: { items: ['oven', 'dough', 'jar'], floor: 'plank', wall: 'plaster', rug: 0xd06a8a },
    gate: { items: ['spikes', 'barrels', 'torch'], floor: 'stone', wall: 'stone', rug: 0 },
    jail: { items: ['cell', 'chains', 'desk'], floor: 'dark', wall: 'stone', rug: 0, slots: [[-0.25, -0.2], [0.3, -0.3], [0.2, 0.15]] }
  };
  const SLOTS = [[-0.28, -0.22], [0.08, 0.12], [0.3, -0.24]];   // oda genişliğine göre oran (x, z)
  const has = id => !!DEF[id];
  const slotsOf = id => (DEF[id] && DEF[id].slots) || SLOTS;
  function floorTex(T, kind) {
    return canTex(T, 'fl_' + kind, 256, 256, (c, w, h) => {
      if (kind === 'plank') { for (let i = 0; i < 8; i++) { c.fillStyle = ['#b07a46', '#a46e3c', '#b9844e', '#9e6a3a'][i % 4]; c.fillRect(i * 32, 0, 32, h); c.fillStyle = 'rgba(60,30,10,.35)'; c.fillRect(i * 32, 0, 2, h); c.fillRect(i * 32, (i * 71) % h, 32, 2); }
        c.fillStyle = 'rgba(255,255,255,.05)'; for (let i = 0; i < 40; i++) c.fillRect(Math.random() * w, Math.random() * h, 12, 1); }
      else if (kind === 'straw') { c.fillStyle = '#d8b860'; c.fillRect(0, 0, w, h); for (let i = 0; i < 500; i++) { c.strokeStyle = ['#e8cc78', '#b8963e', '#f0d88a'][i % 3]; c.lineWidth = 2; const x = Math.random() * w, y = Math.random() * h, a = Math.random() * 3; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * 14, y + Math.sin(a) * 14); c.stroke(); } }
      else if (kind === 'dark') { c.fillStyle = '#4a4e58'; c.fillRect(0, 0, w, h); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const v = 70 + Math.floor(Math.random() * 25); c.fillStyle = `rgb(${v},${v + 3},${v + 10})`; c.fillRect(x * 64 + (y % 2) * 32 + 2, y * 64 + 2, 60, 60); } }
      else { c.fillStyle = '#8c94a2'; c.fillRect(0, 0, w, h); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const v = 130 + Math.floor(Math.random() * 30); c.fillStyle = `rgb(${v},${v + 6},${v + 18})`; c.fillRect(x * 64 + (y % 2) * 32 + 2, y * 64 + 2, 60, 60); } }
    }); }
  const emptyTex = T => canTex(T, 'empty', 128, 128, (c, w) => { c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 6; c.setLineDash([14, 10]); c.strokeRect(8, 8, w - 16, w - 16); c.fillStyle = 'rgba(255,255,255,.9)'; c.font = 'bold 64px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('+', w / 2, w / 2 + 4); });
  function badge(T, L) { const tx = canTex(T, 'bd' + L, 64, 64, (c, w) => { c.fillStyle = L ? '#2a3a6a' : '#888'; c.beginPath(); c.arc(32, 32, 28, 0, 7); c.fill(); c.lineWidth = 5; c.strokeStyle = '#fff'; c.stroke(); c.fillStyle = '#fff'; c.font = 'bold 34px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(L), 32, 34); });
    const s = new T.Sprite(new T.SpriteMaterial({ map: tx, depthTest: false, transparent: true })); s.scale.set(0.42, 0.42, 1); s.renderOrder = 20; return s; }
  // oda: W genişlik, D derinlik (dünya birimi). Arka duvar yüksek, yanlar öne doğru alçalır, ön duvar alçak + kapı boşluğu
  function build(T, id, furnL, W) {
    const m = mats(T), D0 = DEF[id], g = new T.Group(), D = W * 0.8; g.userData.walls = []; g.userData.items = [];
    const fl = new T.Mesh(new T.BoxGeometry(W, 0.14, D), CZ.style.mat({ map: floorTex(T, D0.floor) })); fl.position.y = 0.07; fl.receiveShadow = true; g.add(fl);
    const wm = D0.wall === 'stone' ? m.stone : m.plaster, th = 0.24, H = 1.7;
    const wall = (w, h, x, z, ry) => { const p = new T.Group(); p.position.set(x, 0.14, z); p.rotation.y = ry || 0; g.add(p);
      box(T, p, m.stoneD, w, 0.22, th + 0.04, 0, 0.11, 0); box(T, p, wm, w, h, th, 0, h / 2 + 0.2, 0); box(T, p, m.roofT, w + 0.04, 0.1, th + 0.08, 0, h + 0.25, 0); g.userData.walls.push(p); return p; };
    wall(W, H, 0, -D / 2);                                              // arka
    [-1, 1].forEach(s => { const p = wall(D, H * 0.62, s * W / 2, 0, Math.PI / 2); p.scale.y = 1; });   // yanlar
    const gap = 0.9; [-1, 1].forEach(s => wall((W - gap) / 2, 0.32, s * (W + gap) / 4, D / 2));       // ön alçak duvar + kapı
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { const p = new T.Group(); g.add(p); box(T, p, m.dark, 0.26, b < 0 ? H + 0.45 : 0.75, 0.26, a * W / 2, (b < 0 ? H + 0.45 : 0.75) / 2 + 0.14, b * D / 2); g.userData.walls.push(p); });
    // arka duvar süsleri: pencere + lamba + raf
    const win = box(T, g, m.glow, 0.6, 0.45, 0.04, -W * 0.18, 1.3, -D / 2 + th / 2 + 0.03); win.material = new T.MeshBasicMaterial({ color: 0xbfe4ff }); box(T, g, m.dark, 0.7, 0.06, 0.08, -W * 0.18, 1.04, -D / 2 + th / 2 + 0.05);
    const lamp = sph(T, g, m.glow, 0.09, W * 0.36, 1.45, -D / 2 + th / 2 + 0.1); box(T, g, m.iron, 0.05, 0.2, 0.12, W * 0.36, 1.3, -D / 2 + th / 2 + 0.06);
    const pl = new T.PointLight(0xffc27a, 0.7, W * 1.6); pl.position.set(0, 1.6, 0); g.add(pl);
    if (D0.rug !== 0) { const rug = new T.Mesh(new T.PlaneGeometry(W * 0.34, D * 0.3), M(D0.rug || (id === 'house' ? 0x7a3a5a : 0x5a6a9a))); rug.rotation.x = -Math.PI / 2; rug.position.set(-W * 0.05, 0.15, D * 0.24); g.add(rug); }
    D0.items.forEach((k, i) => {
      const L = furnL[i] || 0, slot = new T.Group(), [sx, sz] = slotsOf(id)[i]; slot.position.set(sx * W, 0.14, sz * D); g.add(slot); g.userData.items.push(slot);
      if (L <= 0) { const e = new T.Mesh(new T.PlaneGeometry(0.95, 0.95), new T.MeshBasicMaterial({ map: emptyTex(T), transparent: true, depthWrite: false })); e.rotation.x = -Math.PI / 2; e.position.y = 0.02; slot.add(e); }
      else { const inner = new T.Group(); F[k](T, inner, L, m); inner.scale.setScalar(0.92 + L * 0.03); slot.add(inner); }
      const b = badge(T, L); b.position.set(0, L ? 1.9 : 0.5, 0); slot.add(b);
    });
    return g;
  }
  return { has, build, SLOTS, DEF, slotsOf };
})();
