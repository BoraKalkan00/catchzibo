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
    sack(T, g, L, m) { for (let i = 0; i < Math.min(5, L); i++) { sph(T, g, m.straw, 0.26, (i - 2) * 0.36, 0.26, (i % 2) * 0.3, 1, 1.15, 1); sph(T, g, m.gold, 0.06, (i - 2) * 0.36, 0.58, (i % 2) * 0.3); } }
  };
  // bina başına eşya tipleri (sırası FURN ile aynı) + zemin + oda boyu
  const DEF = {
    canteen: { items: ['stove', 'table', 'shelf'], floor: 'plank', wall: 'plaster' },
    house: { items: ['bunk', 'fireplace', 'chest'], floor: 'plank', wall: 'plaster', slots: [[-0.3, -0.27], [0.27, -0.3], [0.22, 0.18]] },
    mine: { items: ['rack', 'cart', 'bucket'], floor: 'stone', wall: 'stone' },
    bakery: { items: ['saw', 'logs', 'rack'], floor: 'plank', wall: 'plaster' },
    goldmine: { items: ['bucket', 'gold', 'sack'], floor: 'stone', wall: 'stone' }
  };
  const SLOTS = [[-0.28, -0.22], [0.08, 0.12], [0.3, -0.24]];   // oda genişliğine göre oran (x, z)
  const has = id => !!DEF[id];
  const slotsOf = id => (DEF[id] && DEF[id].slots) || SLOTS;
  function floorTex(T, kind) {
    return canTex(T, 'fl_' + kind, 256, 256, (c, w, h) => {
      if (kind === 'plank') { for (let i = 0; i < 8; i++) { c.fillStyle = ['#b07a46', '#a46e3c', '#b9844e', '#9e6a3a'][i % 4]; c.fillRect(i * 32, 0, 32, h); c.fillStyle = 'rgba(60,30,10,.35)'; c.fillRect(i * 32, 0, 2, h); c.fillRect(i * 32, (i * 71) % h, 32, 2); }
        c.fillStyle = 'rgba(255,255,255,.05)'; for (let i = 0; i < 40; i++) c.fillRect(Math.random() * w, Math.random() * h, 12, 1); }
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
    const rug = new T.Mesh(new T.PlaneGeometry(W * 0.34, D * 0.3), M(id === 'house' ? 0x7a3a5a : 0x5a6a9a)); rug.rotation.x = -Math.PI / 2; rug.position.set(-W * 0.05, 0.15, D * 0.24); g.add(rug);
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
