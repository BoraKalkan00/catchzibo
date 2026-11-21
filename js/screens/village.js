// KÖYÜM: yukarıdan bakılan 3D köy. Binaya dokun -> yükselt. Maden ve fırının üstündeki altına dokun -> topla.
CZ.screens.village = (function () {
  const { h, img, btn } = CZ.ui;
  const t = CZ.t;
  const VL = () => CZ.village;
  let S = null;
  // Binaların köydeki yerleri (x, z)
  const SPOTS = { hall: [0, -2], mine: [-6, -8], bakery: [6, -8], vault: [-5, 2.5], tower: [5.5, 2.5], stable: [-6.5, 9], forge: [6, 10], lookout: [0, -12.5], tree: [0, 7], goldmine: [-10.5, -2.5], elf: [10.5, -2.5], cookie: [10, 5], gate: [0, 13.6], jail: [-10, 5] };

  // Yapay zekâ modelleri (varsa): bina -> [model, boy]
  const VGEN = { hall: ['koymeydani', 6.2], mine: ['altinmadeni', 3.6], bakery: ['firin', 4.2], stable: ['ahir', 4.2], forge: ['demirci', 4], tower: ['kartopukulesi', 4.5] };
  // Seviye kademesi: 1-3 → 1, 4-6 → 2, 7+ → 3. Kademe modeli (ör. firin_2) varsa o kullanılır.
  const tierOf = L => L >= 7 ? 3 : L >= 4 ? 2 : 1;
  function genName(id, L) {
    const base = VGEN[id] && VGEN[id][0]; if (!base || !CZ.gen3d) return null;
    for (let t = tierOf(L); t >= 1; t--) { const n = t > 1 ? base + '_' + t : base; if (CZ.gen3d.has(n)) return n; }
    return null;
  }
  // Her seviyede görünür bir şey eklenir: bayrak, fenerler, taş zemin, altın süs, tepe yıldızı, parıltı.
  function decorate(THREE, g, id, L) {
    if (L <= 0) return g;
    g.updateMatrixWorld(true);
    const bb = new THREE.Box3().setFromObject(g), sz = bb.getSize(new THREE.Vector3());
    const R = Math.min(sz.x, sz.z) * 0.5 + 0.2, top = bb.max.y;
    const mat = (c, e) => CZ.style.mat(e ? { color: c, emissive: e } : { color: c });
    const add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
    const gold = mat(0xf2c230, 0x4a3000), wood = mat(0x8a5a30);
    const flagCol = [0xd8282a, 0xd8282a, 0x2f5fd8, 0x2f5fd8, 0x3aa84a, 0x3aa84a, 0x9a3ad8, 0x9a3ad8, 0xf2c230, 0xf2c230][Math.min(9, L - 1)];
    // Lv1+: taban (seviye arttıkça taş → altın kenarlı)
    if (L >= 4) { const base = add(new THREE.CylinderGeometry(R, R + 0.12, 0.14, 20), mat(0xc8c2b4), 0, 0.05, 0); base.receiveShadow = true; }
    if (L >= 7) add(new THREE.TorusGeometry(R + 0.05, 0.07, 6, 28), gold, 0, 0.16, 0).rotation.x = Math.PI / 2;
    // Lv2+: bayrak direği (renk seviyeyle değişir); Lv6+: iki bayrak
    const flag = (x, z) => {
      add(new THREE.CylinderGeometry(0.05, 0.06, 2.4, 6), wood, x, 1.2, z);
      const f = add(new THREE.BoxGeometry(0.8, 0.5, 0.04), mat(flagCol), x + 0.42, 2.1, z); f.userData.wave = Math.random() * 6;
      if (L >= 8) add(new THREE.SphereGeometry(0.1, 8, 6), gold, x, 2.45, z);
    };
    if (L >= 2) flag(-R * 0.85, R * 0.55);
    if (L >= 6) flag(R * 0.85, R * 0.55);
    // Lv3+: yanan fenerler (seviye arttıkça sayı artar)
    if (L >= 3) {
      const n = Math.min(10, 2 + (L - 3) * 2), lampM = new THREE.MeshBasicMaterial({ color: 0xffd27a });
      for (let i = 0; i < n; i++) {
        const a = Math.PI * (0.1 + 0.8 * i / Math.max(1, n - 1)), x = Math.cos(a) * (R + 0.1), z = Math.sin(a) * (R + 0.1);
        add(new THREE.CylinderGeometry(0.035, 0.035, 0.9, 5), wood, x, 0.45, z);
        add(new THREE.SphereGeometry(0.12, 8, 6), lampM, x, 0.95, z);
      }
    }
    // Lv4+: hediye/fıçı yığını
    if (L >= 4) [[0.55, 0xd8282a], [0.75, 0x2f5fd8], [0.45, 0x3aa84a]].slice(0, L >= 7 ? 3 : 2).forEach(([s, c], i) => {
      add(new THREE.BoxGeometry(s * 0.6, s * 0.6, s * 0.6), mat(c), R * 0.55 - i * 0.45, s * 0.3 + 0.1, R * 0.8).rotation.y = i * 0.5;
    });
    // Lv5+: altın çatı süsü; Lv10: dönen altın yıldız + parıltı halkası
    if (L >= 5) add(new THREE.SphereGeometry(0.16 + (L >= 8 ? 0.06 : 0), 10, 8), gold, 0, top + 0.12, 0);
    if (L >= 10) {
      const st = add(new THREE.OctahedronGeometry(0.45, 0), mat(0xffd84a, 0x806000), 0, top + 0.75, 0); st.userData.spin = 1;
      const sp = new THREE.MeshBasicMaterial({ color: 0xfff3b0, transparent: true, opacity: 0.8 });
      for (let i = 0; i < 6; i++) { const o = add(new THREE.OctahedronGeometry(0.12, 0), sp, 0, 0, 0); o.castShadow = false; o.userData.orbit = [i / 6 * 6.28, R * 0.9, top * (0.4 + (i % 3) * 0.2)]; }
    }
    return g;
  }
  // Gemini'den gelen 2D bina resimleri: assets/village/<id>/<seviye>.webp, inşaat hali c.webp
  const VART = { hall: { n: 10, c: true, w: 4.4, k: 0.24 }, goldmine: { n: 10, c: true, w: 3.6, k: 0.2 }, bakery: { n: 10, c: true, w: 3.6, k: 0.2 }, mine: { n: 10, c: true, w: 3.6, k: 0.2 }, vault: { n: 8, c: true, w: 3.4, k: 0.22 }, tower: { n: 10, c: true, w: 2.9, k: 0.16 }, stable: { n: 6, c: true, w: 3.4, k: 0.25 }, forge: { n: 7, c: true, w: 3.4, k: 0.22 }, lookout: { n: 5, c: true, w: 2.7, k: 0.2 }, elf: { n: 6, c: true, w: 3.6, k: 0.25 }, cookie: { n: 5, c: true, w: 3.2, k: 0.25 }, gate: { n: 6, c: true, w: 3.4, k: 0.22 }, jail: { n: 5, c: true, w: 3, k: 0.25 }, tree: { n: 15, c: false, w: 2.6, k: 0.17 } };
  const texCache = {};
  function spriteModel(THREE, id, L, busy) {
    const A = VART[id], key = busy && A.c ? 'c' : String(Math.min(A.n, L));
    const g = new THREE.Group(); g.userData.sprite = true;
    const W = A.w + A.k * Math.min(A.n, L);
    const url = 'assets/village/' + id + '/' + key + '.webp';
    const tex = texCache[url] || (texCache[url] = new THREE.TextureLoader().load(url, t => { t.userData.ok = true; fit(); }));
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, fog: false });
    const sp = new THREE.Sprite(mat); sp.center.set(0.5, 0.2); g.add(sp);
    function fit() { const im = tex.image; if (!im || !im.width) return; sp.scale.set(W, W * im.height / im.width, 1); }
    sp.scale.set(W, W, 1); if (tex.image && tex.image.width) fit();
    // yere yumuşak gölge
    const sh = new THREE.Mesh(new THREE.CircleGeometry(W * 0.48, 24), new THREE.MeshBasicMaterial({ color: 0x1a2a4a, transparent: true, opacity: 0.22, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2; sh.position.y = 0.03; sh.scale.y = 0.7; g.add(sh);
    return g;
  }
  function model(THREE, id, L, busy) {
    if (L > 0 && VART[id]) return spriteModel(THREE, id, L, busy);
    const gn = L > 0 ? genName(id, L) : null;
    if (gn) {
      const g = new THREE.Group();
      // aynı kademede de her seviye biraz büyür; yeni kademe modeli gelince büyüme sıfırlanır
      const t = tierOf(L), inTier = L - (t === 1 ? 1 : t === 2 ? 4 : 7), tierModel = gn !== VGEN[id][0];
      const k = tierModel ? 1 + inTier * 0.035 : 0.85 + Math.min(10, L) * 0.04;
      g.add(CZ.gen3d.get(gn, VGEN[id][1] * k));
      return decorate(THREE, g, id, L);
    }
    const toon = c => CZ.style.mat(c);
    const g = new THREE.Group();
    const add = (geo, mat, x, y, z, ry) => { const m = new THREE.Mesh(geo, typeof mat === 'number' ? toon(mat) : mat); m.position.set(x, y, z); if (ry) m.rotation.y = ry; m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
    const roofCone = (r, hh, col, y) => { const m = add(new THREE.ConeGeometry(r, hh, 4), col, 0, y, 0, Math.PI / 4); const s = add(new THREE.ConeGeometry(r * 0.8, hh * 0.35, 4), 0xffffff, 0, y + hh * 0.36, 0, Math.PI / 4); return [m, s]; };
    if (L <= 0) {   // inşaat arsası
      add(new THREE.BoxGeometry(3, 0.15, 3), 0x9a7a52, 0, 0.08, 0);
      [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]].forEach(([x, z]) => add(new THREE.BoxGeometry(0.18, 1.6, 0.18), 0xb88a52, x, 0.8, z));
      add(new THREE.BoxGeometry(2.8, 0.14, 0.14), 0xb88a52, 0, 1.55, -1.3); add(new THREE.BoxGeometry(2.8, 0.14, 0.14), 0xb88a52, 0, 1.55, 1.3);
      add(new THREE.BoxGeometry(0.9, 0.6, 0.08), 0xf2c230, 1.2, 0.9, 1.4);
      return g;
    }
    const k = Math.min(1, L / 10);
    if (id === 'hall') {
      const floors = 1 + Math.min(3, Math.floor(L / 3));
      for (let i = 0; i < floors; i++) add(new THREE.BoxGeometry(4.6 - i * 0.6, 1.8, 4 - i * 0.5), i % 2 ? 0xe8d6b0 : 0xf3e4c4, 0, 0.9 + i * 1.8, 0);
      roofCone(3.6 - floors * 0.3, 2.4, 0x2f5fd8, floors * 1.8 + 1.2);
      add(new THREE.BoxGeometry(1.1, 1.6, 0.1), 0x6a3a1e, 0, 0.8, 2.01);
      add(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 6), 0x8a8a8a, 0, floors * 1.8 + 3.2, 0);
      add(new THREE.BoxGeometry(0.9, 0.55, 0.05), L >= 5 ? 0xf2c230 : 0xd8282a, 0.47, floors * 1.8 + 3.9, 0);
      if (L >= 4) [-1, 1].forEach(sd => { add(new THREE.CylinderGeometry(0.7, 0.8, 3.2 + L * 0.15, 8), 0xd8d0c0, sd * 2.8, 1.6, 1.5); add(new THREE.ConeGeometry(0.9, 1.4, 8), 0x2f5fd8, sd * 2.8, 3.9 + L * 0.15, 1.5); });
    } else if (id === 'mine') {
      const rock = CZ.style.mat({ color: 0x8a90a0, flatShading: true });
      add(new THREE.DodecahedronGeometry(2.2, 0), rock, 0, 0.9, -0.4).scale.set(1.2, 0.75, 1);
      add(new THREE.DodecahedronGeometry(1.4, 0), rock, 1.6, 0.7, -0.8);
      add(new THREE.CircleGeometry(0.9, 12, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x141a28 }), 0, 0.02, 1.2).rotation.x = 0;
      add(new THREE.BoxGeometry(2, 0.2, 0.2), 0x8a5228, 0, 1.7, 1.25); [-0.9, 0.9].forEach(x => add(new THREE.BoxGeometry(0.2, 1.7, 0.2), 0x8a5228, x, 0.85, 1.25));
      const n = 1 + Math.floor(L / 2);
      for (let i = 0; i < n; i++) add(new THREE.ConeGeometry(0.35 + i * 0.03, 0.4, 8), CZ.style.mat({ color: 0xffc020, emissive: 0x3a2600 }), -1.6 + (i % 4) * 0.5, 0.2, 1.9 + Math.floor(i / 4) * 0.5);
      add(new THREE.BoxGeometry(0.9, 0.5, 0.6), 0x5a3a20, 1.6, 0.45, 1.6); add(new THREE.ConeGeometry(0.45, 0.35, 8), CZ.style.mat({ color: 0xffc020, emissive: 0x3a2600 }), 1.6, 0.85, 1.6);
    } else if (id === 'bakery') {
      add(new THREE.BoxGeometry(3.4, 2.2, 3), 0xf3d8b0, 0, 1.1, 0);
      roofCone(2.8, 1.8, 0xd88a2a, 3.1);
      add(new THREE.BoxGeometry(0.6, 1.6, 0.6), 0x8a5a4a, 1, 3.6, -0.5);
      add(new THREE.BoxGeometry(1.6, 0.6, 0.1), 0x6a3a1e, 0, 2.4, 1.52);
      add(new THREE.TorusGeometry(0.22, 0.1, 6, 10), 0xd8a050, 0, 2.4, 1.6);
      add(new THREE.BoxGeometry(0.9, 0.9, 0.1), new THREE.MeshBasicMaterial({ color: 0xffb04a }), -0.9, 1.1, 1.52);
      if (L >= 6) add(new THREE.BoxGeometry(1.6, 1.4, 1.6), 0xf3d8b0, -2.2, 0.7, 0.4);
    } else if (id === 'vault') {
      const st = 0x9aa0ae;
      add(new THREE.BoxGeometry(3 + k, 2 + k, 2.6 + k), st, 0, 1 + k / 2, 0);
      add(new THREE.BoxGeometry(3.2 + k, 0.3, 2.8 + k), 0x6a7080, 0, 2.1 + k, 0);
      add(new THREE.CylinderGeometry(0.75, 0.75, 0.15, 16), 0xf2c230, 0, 1.1, 1.35 + k / 2).rotation.x = Math.PI / 2;
      add(new THREE.BoxGeometry(0.15, 1.1, 0.1), 0x5a5a5a, 0, 1.1, 1.45 + k / 2);
    } else if (id === 'tower') {
      const H = 2.6 + L * 0.28;
      add(new THREE.CylinderGeometry(1.1, 1.35, H, 10), 0xc8c0b4, 0, H / 2, 0);
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; add(new THREE.BoxGeometry(0.45, 0.5, 0.45), 0xb8b0a4, Math.cos(a) * 1.05, H + 0.25, Math.sin(a) * 1.05, -a); }
      for (let i = 0; i < 3 + Math.floor(L / 3); i++) add(new THREE.SphereGeometry(0.25, 8, 6), 0xffffff, (i % 3 - 1) * 0.4, H + 0.2 + Math.floor(i / 3) * 0.35, (Math.floor(i / 3) % 2) * 0.3);
      add(new THREE.BoxGeometry(0.8, 1.2, 0.1), 0x6a3a1e, 0, 0.6, 1.3);
    } else if (id === 'stable') {
      add(new THREE.BoxGeometry(4, 2.2, 3), 0xb8322a, 0, 1.1, 0);
      add(new THREE.BoxGeometry(4.3, 0.25, 3.3), 0xffffff, 0, 2.3, 0);
      const roof = add(new THREE.CylinderGeometry(1.7, 1.7, 4.2, 4, 1, false, 0, Math.PI), 0x6a3a1e, 0, 2.3, 0); roof.rotation.z = Math.PI / 2; roof.rotation.y = 0; roof.scale.set(1, 1, 0.9);
      add(new THREE.BoxGeometry(1.5, 1.7, 0.1), 0x6a3a1e, 0, 0.85, 1.52);
      [[-0.6, 1], [0.6, -1]].forEach(([x, s2]) => add(new THREE.BoxGeometry(0.1, 1.6, 0.1), 0xffffff, x * s2, 0.85, 1.58).rotation.z = 0.7 * s2);
      if (CZ.quadruped && L >= 1) {
        const mid = (CZ.state.data.mount || 'brown');
        const q = CZ.quadruped(THREE, CZ.MOUNTS.find(m => m.id === mid) || CZ.MOUNTS[0]);
        q.root.position.set(2.8, 0, 1.6); q.root.rotation.y = -2.2; q.root.scale.setScalar(0.85); q.update(0.1, 0);
        q.root.traverse(o => { if (o.isMesh && o.geometry.type !== 'CircleGeometry') o.castShadow = true; });
        g.add(q.root); g.userData.mount = q;
      }
    } else if (id === 'forge') {
      add(new THREE.BoxGeometry(3.2, 2, 2.8), 0x5a5a66, 0, 1, 0);
      roofCone(2.6, 1.4, 0x3a3a44, 2.7);
      add(new THREE.CylinderGeometry(0.45, 0.55, 2.4, 8), 0x7a5a4a, 1, 3.4, -0.6);
      add(new THREE.BoxGeometry(1.2, 0.9, 0.1), new THREE.MeshBasicMaterial({ color: 0xff7a2a }), 0, 0.8, 1.42);
      add(new THREE.BoxGeometry(0.8, 0.35, 0.4), 0x2a2a30, 1.9, 0.75, 1.6); add(new THREE.BoxGeometry(0.4, 0.55, 0.3), 0x2a2a30, 1.9, 0.3, 1.6);
      const fl = new THREE.PointLight(0xff7a2a, 0.9, 6); fl.position.set(0, 1, 2.2); g.add(fl);
    } else if (id === 'lookout') {
      const H = 3 + L * 0.35;
      [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]].forEach(([x, z]) => add(new THREE.CylinderGeometry(0.12, 0.15, H, 6), 0x8a5a30, x, H / 2, z));
      add(new THREE.BoxGeometry(2.2, 0.2, 2.2), 0xa87040, 0, H, 0);
      add(new THREE.ConeGeometry(1.7, 1.3, 4), 0x2f8a4e, 0, H + 1.4, 0, Math.PI / 4);
      [-1, 1].forEach(sd => add(new THREE.BoxGeometry(2.2, 0.5, 0.1), 0xa87040, 0, H + 0.35, sd * 1.05));
    } else if (id === 'tree') {
      const s = 0.55 + L * 0.07;
      [[2.2, 2.6, 0], [1.7, 2.2, 1.6], [1.1, 1.7, 3]].forEach(([r, hh, y]) => add(new THREE.ConeGeometry(r * s, hh * s, 10), 0x1f7a3a, 0, (y + 1.3) * s, 0));
      add(new THREE.CylinderGeometry(0.3 * s, 0.35 * s, 1.2 * s, 6), 0x6a4024, 0, 0.6 * s, 0);
      add(new THREE.OctahedronGeometry(0.5 * s), new THREE.MeshBasicMaterial({ color: 0xffe27a }), 0, 5.3 * s, 0);
      const cols = [0xff4a4a, 0x4ab0ff, 0xffd84a, 0xff7ad8].map(c => new THREE.MeshBasicMaterial({ color: c }));
      for (let i = 0; i < 6 + L * 2; i++) { const a = i * 2.4, y = 1.2 + (i % 12) * 0.32, r = 2.1 - y * 0.32; if (r < 0.2) continue; add(new THREE.SphereGeometry(0.13 * s + 0.05, 6, 4), cols[i % 4], Math.cos(a) * r * s, y * s, Math.sin(a) * r * s); }
      if (L >= 5) for (let i = 0; i < Math.min(8, L - 3); i++) add(new THREE.BoxGeometry(0.6, 0.5, 0.6), [0xd8282a, 0x2f9a40, 0x2f5fd8, 0x9a4ad0][i % 4], Math.cos(i * 1.3) * 2.4 * s, 0.25, Math.sin(i * 1.3) * 2.4 * s);
    }
    return g;
  }

  CZ.villageModel = model; CZ.VILLAGE_SPOTS = SPOTS;
  function render(el) {
    el.classList.add('village-screen');
    const loading = CZ.ui.loading(el);
    CZ.runner3d.load().then(() => CZ.gen3d.load()).then(() => { loading.done(); build(el); })
      .catch(err => { console.error('village', err && err.stack || err); loading.done(); CZ.ui.toast(t('run.noGl')); });
  }

  function build(el) {
    const THREE = window.THREE;
    const V = VL().ensure();
    VL().tick();
    const stage = h('div', { class: 'valley-stage' });
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.shadowMap.enabled = true;
    stage.append(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbcd4f2);
    scene.fog = new THREE.Fog(0xbcd4f2, 45, 80);
    scene.add(new THREE.HemisphereLight(0xeef4ff, 0x7a88a8, 0.8));
    const sun = new THREE.DirectionalLight(0xfff0d8, 0.75); sun.position.set(14, 30, 10); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 5, far: 70 }); scene.add(sun);
    const camera = new THREE.PerspectiveCamera(46, 1, 0.5, 150);
    // zemin ve çit
    const ground = new THREE.Mesh(new THREE.CircleGeometry(60, 48), new THREE.MeshLambertMaterial({ color: 0xe2eaf6 }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
    const plaza = new THREE.Mesh(new THREE.CircleGeometry(13.5, 40), new THREE.MeshLambertMaterial({ color: 0xd2dcec }));
    plaza.rotation.x = -Math.PI / 2; plaza.position.y = 0.01; plaza.receiveShadow = true; scene.add(plaza);
    // köy duvarı: kule seviyesiyle yükselir ve taşlaşır
    const wallL = VL().lv('tower');
    const wallMat = CZ.style.mat({ color: wallL >= 6 ? 0xa8a4a0 : 0x9a6a3a });
    const postGeo = wallL >= 6 ? new THREE.BoxGeometry(1.4, 1 + wallL * 0.08, 0.7) : new THREE.CylinderGeometry(0.15, 0.15, 1.1, 6);
    for (let i = 0; i < 64; i++) {
      const a = i / 64 * Math.PI * 2;
      if (Math.abs(a - Math.PI / 2) < 0.12) continue;   // kapı
      const m = new THREE.Mesh(postGeo, wallMat); m.position.set(Math.cos(a) * 14.5, (wallL >= 6 ? 0.5 + wallL * 0.04 : 0.55), Math.sin(a) * 14.5); m.rotation.y = -a + Math.PI / 2; m.castShadow = true; scene.add(m);
    }
    // ağaçlar çevrede
    const tg = new THREE.ConeGeometry(1.4, 3.2, 8), tm = CZ.style.mat({ color: 0x2a7a4a });
    const treeI = new THREE.InstancedMesh(tg, tm, 70), tmp = new THREE.Object3D();
    for (let i = 0; i < 70; i++) { const a = Math.random() * 6.28, r = 17 + Math.random() * 16; const s = 0.8 + Math.random() * 0.6; tmp.position.set(Math.cos(a) * r, 1.6 * s, Math.sin(a) * r); tmp.scale.setScalar(s); tmp.updateMatrix(); treeI.setMatrixAt(i, tmp.matrix); }
    treeI.castShadow = true; scene.add(treeI);

    // binalar
    const blds = {};
    const pick = [];
    function place(id) {
      if (blds[id]) { scene.remove(blds[id].g); }
      const L = VL().lv(id);
      const J = VL().ensure().job, busy = !!(J && J.id === id);
      let g = model(THREE, id, L, busy);
      if (!g.userData.sprite && !genName(id, L) && L > 0 && !g.userData.mount) decorate(THREE, g, id, L);
      const [x, z] = SPOTS[id];
      g.position.set(x, 0, z);
      if (g.userData.sprite) g.children[0].renderOrder = 100 + Math.round((z + 30) * 2);
      blds[id] && (blds[id].busy = busy);
      g.userData.id = id;
      scene.add(g);
      blds[id] = { g, L, busy };
      pick.length = 0; Object.values(blds).forEach(b => pick.push(b.g));
    }
    CZ.VB.forEach(b => place(b.id));
    // inşaat iskelesi göstergesi
    // Yükseltme sürerken: binayı saran ahşap iskele, sarı-siyah şerit, dönen vinç, toz bulutları ve zıplayan çekiç.
    const scaffold = new THREE.Group(); scene.add(scaffold);
    const SC = { crane: null, dust: [], hammer: null, id: null };
    function buildScaffold(id) {
      scaffold.clear(); SC.dust = []; SC.id = id;
      const b = blds[id]; if (!b) return;
      b.g.updateMatrixWorld(true);
      const bb = new THREE.Box3().setFromObject(b.g), sz = bb.getSize(new THREE.Vector3());
      const hx = Math.max(1.4, sz.x / 2 + 0.25), hz = Math.max(1.4, sz.z / 2 + 0.25), H = Math.max(2.5, sz.y * 0.8);
      const wood = CZ.style.mat({ color: 0xb8864e }), yel = CZ.style.mat({ color: 0xf2c230 }), blk = CZ.style.mat({ color: 0x222222 });
      const box = (w, hh, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), m); o.position.set(x, y, z); o.castShadow = true; scaffold.add(o); return o; };
      [[-hx, -hz], [hx, -hz], [-hx, hz], [hx, hz], [0, hz], [0, -hz]].forEach(([x, z]) => box(0.12, H, 0.12, wood, x, H / 2, z));
      for (let y = 1; y < H; y += 1.1) { box(hx * 2, 0.08, 0.32, wood, 0, y, hz); box(hx * 2, 0.08, 0.32, wood, 0, y, -hz); box(0.32, 0.08, hz * 2, wood, -hx, y, 0); box(0.32, 0.08, hz * 2, wood, hx, y, 0); }
      for (let i = 0; i < 8; i++) box(hx * 2 / 8 - 0.02, 0.14, 0.04, i % 2 ? blk : yel, -hx + (i + 0.5) * hx * 2 / 8, 0.55, hz + 0.25);
      // vinç
      const crane = new THREE.Group(); crane.position.set(hx + 0.6, 0, -hz - 0.4); scaffold.add(crane);
      const mast = new THREE.Mesh(new THREE.BoxGeometry(0.22, H + 1.6, 0.22), yel); mast.position.y = (H + 1.6) / 2; crane.add(mast);
      const arm = new THREE.Group(); arm.position.y = H + 1.6; crane.add(arm);
      const jib = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 3.4), yel); jib.position.z = 1.1; arm.add(jib);
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.4, 4), blk); rope.position.set(0, -0.7, 2.6); arm.add(rope);
      const load = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.5), wood); load.position.set(0, -1.55, 2.6); arm.add(load);
      SC.crane = arm;
      // çekiç
      const hm = new THREE.Group(); hm.position.set(-hx * 0.5, H + 0.25, hz); scaffold.add(hm);
      const hd = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.2), CZ.style.mat({ color: 0x8a8a9a })); hd.position.y = 0.4; hm.add(hd);
      const hl = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 5), wood); hl.position.y = 0.2; hm.add(hl);
      SC.hammer = hm;
      // toz
      const dm = new THREE.MeshBasicMaterial({ color: 0xeee6d8, transparent: true, opacity: 0.7, depthWrite: false });
      for (let i = 0; i < 10; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.28, 7, 5), dm.clone()); d.userData.t = i / 10; d.userData.a = Math.random() * 6.28; scaffold.add(d); SC.dust.push(d); }
      SC.r = Math.max(hx, hz);
    }
    function animScaffold(now, dt) {
      if (!scaffold.visible) return;
      if (SC.crane) SC.crane.rotation.y = Math.sin(now / 1800) * 1.1;
      if (SC.hammer) SC.hammer.rotation.z = Math.max(0, Math.sin(now / 160)) * -1.3;
      SC.dust.forEach(d => { const u = d.userData; u.t = (u.t + dt * 0.45) % 1; const r = SC.r * (0.7 + u.t * 0.6);
        d.position.set(Math.cos(u.a) * r, 0.2 + u.t * 1.2, Math.sin(u.a) * r); d.scale.setScalar(0.6 + u.t * 1.4); d.material.opacity = 0.65 * (1 - u.t); });
    }
    function animDecor(now) {
      Object.values(blds).forEach(b => b.g.traverse(o => { const u = o.userData;
        if (u.wave !== undefined) o.rotation.y = Math.sin(now / 300 + u.wave) * 0.35;
        if (u.spin) { o.rotation.y = now / 700; o.position.y += Math.sin(now / 400) * 0.002; }
        if (u.orbit) { const a = u.orbit[0] + now / 1500; o.position.set(Math.cos(a) * u.orbit[1], u.orbit[2] + Math.sin(now / 300 + u.orbit[0]) * 0.2, Math.sin(a) * u.orbit[1]); o.rotation.y = now / 300; } }));
    }

    /* ---------- Arayüz ---------- */
    const labels = h('div', { class: 'vil-labels' });
    const goldTxt = h('span', { class: 'emerald-count', text: CZ.state.data.gold || 0 });
    const gemTxt = h('span', { class: 'emerald-count', text: CZ.state.data.emeralds || 0 });
    const jobBar = h('div', { class: 'vil-job' });
    const ui = h('div', { class: 'vl-ui vil-ui' },
      h('header', { class: 'topbar vil-top' },
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': t('common.back'), onClick: () => { CZ.audio.sfx('button'); CZ.ui.go('hub'); }, text: '‹' }),
        h('h1', { text: t('vil.title') }),
        h('div', { class: 'top-money' },
          h('div', { class: 'emeralds gold-badge' }, img('ui.gold', 'emerald-icon'), goldTxt),
          h('div', { class: 'emeralds' }, img('ui.emerald', 'emerald-icon'), gemTxt))),
      labels, jobBar,
      h('div', { class: 'vil-bottom' },
        btn(t('valley.title'), () => CZ.ui.wipeTo('gold'), 'primary wide', 'ui.gold')));
    const wrap = h('div', { class: 'valley-wrap' }, stage, ui);
    el.append(wrap);
    const labelEls = {};
    CZ.VB.forEach(b => {
      const lab = h('button', { class: 'vil-lab', type: 'button', onClick: () => open(b.id) });
      labels.append(lab); labelEls[b.id] = lab;
    });
    function refreshMoney() { goldTxt.textContent = CZ.state.data.gold || 0; gemTxt.textContent = CZ.state.data.emeralds || 0; }
    function refreshLabels() {
      const Vd = VL().ensure();
      CZ.VB.forEach(b => {
        const L = VL().lv(b.id), lab = labelEls[b.id];
        const store = VL().PRODS.includes(b.id) ? Math.floor(Vd.store[b.id] || 0) : 0;
        const canUp = !Vd.job && L < VL().cap(b.id) && VL().price(b.id, L) <= (CZ.state.data.gold || 0);
        lab.replaceChildren(...[
          h('b', { text: L ? t('vil.lv', { n: L }) : t('vil.build') }),
          h('small', { text: t('vil.b.' + b.id) }),
          store >= 1 ? h('span', { class: 'vil-coin' }, img('ui.gold', 'mini-ico'), String(store)) : null,
          canUp ? h('i', { class: 'vil-up' }, '▲') : null].filter(Boolean));
        lab.classList.toggle('has-gold', store >= 1);
      });
    }
    function refreshJob() {
      const Vd = VL().ensure();
      if (!Vd.job) { jobBar.replaceChildren(h('span', { text: t('vil.idle') })); jobBar.classList.add('idle'); scaffold.visible = false; SC.id = null; Object.keys(blds).forEach(k => { if (blds[k].busy) place(k); }); return; }
      jobBar.classList.remove('idle');
      const [x, z] = SPOTS[Vd.job.id]; if (blds[Vd.job.id] && !blds[Vd.job.id].busy) place(Vd.job.id); if (SC.id !== Vd.job.id || !scaffold.children.length) buildScaffold(Vd.job.id); scaffold.position.set(x, 0, z); scaffold.visible = !(VART[Vd.job.id] && VART[Vd.job.id].c && VL().lv(Vd.job.id) > 0);
      jobBar.replaceChildren(...[
        h('span', { class: 'vil-job-t' }, '🔨 ', t('vil.b.' + Vd.job.id), ' → ', t('vil.lv', { n: Vd.job.to }), ' · ', h('b', { class: 'vil-left', text: VL().fmt(VL().left()) })),
        btn(String(VL().gemCost()), () => { const r = VL().rush(); if (r === 'short') { CZ.audio.sfx('wrong'); return CZ.ui.toast(t('vil.gemShort')); } done(); }, 'small', 'ui.emerald'),
        Vd.job.ads < 3 ? btn('-30', () => CZ.ads.show(() => { VL().adRush(); if (!VL().ensure().job) done(); else refreshJob(); }), 'small ghost-dark', 'ic:play') : null].filter(Boolean));
    }
    function done() {
      const Vd = VL().ensure();
      const id = Vd.done; Vd.done = null; CZ.state.save();
      if (id) { place(id); CZ.audio.sfx('win'); CZ.audio.vibrate([30, 30, 60]); CZ.ui.toast(t('vil.doneT', { b: t('vil.b.' + id), n: VL().lv(id) })); }
      refreshJob(); refreshLabels(); refreshMoney();
    }
    // Bina penceresi
    function effect(id, L) {
      if (L <= 0) return '—';
      const C = CZ.village;
      switch (id) {
        case 'hall': return t('vil.e.hall', { n: Math.max(2, L * 2) });
        case 'jail': return t('vil.e.jail', { n: L * 10 });
        case 'gate': return t('vil.e.gate', { n: L * 5 });
        case 'cookie': return t('vil.e.cookie', { n: L * 3, c: L * 5 });
        case 'elf': return t('vil.e.elf', { n: VL().rate('elf') });
        case 'goldmine': return t('vil.e.prod', { n: Math.round(240 * 0.35 * L * (1 + L * 0.15)) });
        case 'mine': case 'bakery': return t('vil.e.prod', { n: Math.round((id === 'mine' ? 60 : 40) * L * (1 + L * 0.15)) });
        case 'vault': return t('vil.e.vault', { n: Math.round(300 * Math.pow(L, 1.5)), c: Math.round(400 * Math.pow(L + 1, 1.55)) });
        case 'tower': return t('vil.e.tower', { n: L * 3 });
        case 'stable': return t('vil.e.stable', { n: L * 4 });
        case 'forge': return t('vil.e.forge', { n: Math.floor(L / 2), c: L * 3 });
        case 'lookout': return t('vil.e.lookout', { n: L * 10 });
        case 'tree': return t('vil.e.tree', { n: L });
      }
      return '';
    }
    function open(id) {
      CZ.audio.sfx('button');
      const Vd = VL().ensure();
      if (VL().PRODS.includes(id) && (Vd.store[id] || 0) >= 1) {
        const n = VL().collect(id);
        CZ.audio.sfx('coin'); refreshMoney(); refreshLabels();
        const lab = labelEls[id]; const f = h('div', { class: 'vl-float', text: '+' + n }); f.style.left = lab.style.left; f.style.top = lab.style.top; labels.append(f); setTimeout(() => f.remove(), 1100);
        return;
      }
      const old = wrap.querySelector('.vil-sheet-wrap'); if (old) old.remove();
      const L = VL().lv(id), capL = VL().cap(id), max = VL().def(id).max;
      const p = VL().price(id, L), mins = VL().minutes(id, L);
      const sheetWrap = h('div', { class: 'modal-wrap vil-sheet-wrap', onClick: e => { if (e.target === sheetWrap) sheetWrap.remove(); } });
      let action;
      if (L >= max) action = h('b', { class: 'up-max', text: t('up.max') });
      else if (L >= capL) action = h('p', { class: 'small-note', text: t('vil.needHall', { n: Math.ceil((L + 1) / 2) }) });
      else if (Vd.job) action = h('p', { class: 'small-note', text: t('vil.busy') });
      else action = btn(String(p), () => {
        const r = VL().upgrade(id);
        if (r === 'short') { CZ.audio.sfx('wrong'); return CZ.ui.toast(t('chars.goldShort', { n: p - (CZ.state.data.gold || 0) })); }
        if (r !== 'ok') return;
        sheetWrap.remove(); CZ.audio.sfx('buy'); refreshMoney(); refreshJob(); refreshLabels();
        if (!VL().ensure().job) done();
      }, 'primary wide', 'ui.gold');
      sheetWrap.append(h('div', { class: 'modal vil-sheet' },
        h('b', { class: 'lg-title', text: t('vil.b.' + id) }),
        h('small', { class: 'vil-lvl', text: L ? t('vil.lv', { n: L }) + ' / ' + max : t('vil.notBuilt') }),
        h('p', { text: t('vil.d.' + id) }),
        h('div', { class: 'vil-eff' },
          h('div', {}, h('small', { text: t('vil.now') }), h('b', { text: effect(id, L) })),
          L < max ? h('div', { class: 'next' }, h('small', { text: t('vil.next') }), h('b', { text: effect(id, L + 1) })) : null),
        L < max ? h('p', { class: 'small-note', text: '⏱ ' + VL().fmt(mins * 60000) }) : null,
        action,
        btn(t('common.close'), () => sheetWrap.remove(), 'small ghost-dark')));
      wrap.append(sheetWrap);
    }

    // dokunma: binaya dokununca aç; parmakla sürükleyince kamera kayar
    const ray = new THREE.Raycaster(), mv = new THREE.Vector2();
    const pan = { x: 0, z: 0, id: null, sx: 0, sy: 0, moved: false, bx: 0, bz: 0 };
    stage.addEventListener('pointerdown', e => { pan.id = e.pointerId; pan.sx = e.clientX; pan.sy = e.clientY; pan.bx = pan.x; pan.bz = pan.z; pan.moved = false; });
    const onMove = e => { if (e.pointerId !== pan.id) return; const dx = e.clientX - pan.sx, dy = e.clientY - pan.sy; if (Math.hypot(dx, dy) > 8) pan.moved = true; if (pan.moved) { pan.x = Math.max(-10, Math.min(10, pan.bx - dx * 0.05)); pan.z = Math.max(-8, Math.min(12, pan.bz - dy * 0.05)); } };
    const onUp = e => {
      if (e.pointerId !== pan.id) return; pan.id = null;
      if (pan.moved) return;
      const r = renderer.domElement.getBoundingClientRect();
      mv.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(mv, camera);
      const hit = ray.intersectObjects(pick, true)[0];
      if (hit) { let o = hit.object; while (o && !o.userData.id) o = o.parent; if (o) open(o.userData.id); }
    };
    window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp);
    function resize() { const w = stage.clientWidth || innerWidth, hh = stage.clientHeight || innerHeight; renderer.setSize(w, hh, false); camera.aspect = w / hh; camera.updateProjectionMatrix(); }
    resize(); window.addEventListener('resize', resize);

    const v3 = new THREE.Vector3();
    let last = 0, tickT = 0;
    S = { renderer, raf: 0, cleanup() { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); window.removeEventListener('resize', resize); renderer.dispose(); }, open, blds };
    function loop(now) {
      if (!S) return;
      S.raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
      const far = camera.aspect < 1 ? 1 / Math.max(0.42, camera.aspect) * 0.62 : 1;
      const cy = 30 * far, cz = 19 * far;
      camera.position.set(pan.x, cy, pan.z + cz); camera.lookAt(pan.x, 0, pan.z);
      Object.values(blds).forEach(b => { if (b.g.userData.mount) b.g.userData.mount.update(dt, 0); });
      animScaffold(now, dt); animDecor(now);
      camera.updateMatrixWorld();
      CZ.VB.forEach(b => {
        const [x, z] = SPOTS[b.id];
        v3.set(x, b.id === 'hall' ? 7 : 4.6, z).project(camera);
        const lab = labelEls[b.id];
        const W2 = wrap.clientWidth || innerWidth, H2 = wrap.clientHeight || innerHeight;
        lab.style.left = Math.max(56, Math.min(W2 - 56, (v3.x + 1) / 2 * W2)) + 'px'; lab.style.top = Math.max(150, Math.min(H2 - 100, (1 - v3.y) / 2 * H2)) + 'px';   // ekran kenarında kesilmesin
      });
      tickT -= dt;
      if (tickT <= 0) {
        tickT = 1;
        const had = VL().ensure().job;
        VL().tick();
        if (had && !VL().ensure().job) done();
        else if (had) { const l = jobBar.querySelector('.vil-left'); if (l) l.textContent = VL().fmt(VL().left()); }
        refreshLabels();
      }
      renderer.render(scene, camera);
    }
    refreshMoney(); refreshLabels(); refreshJob();
    if (VL().ensure().done) done();
    S.raf = requestAnimationFrame(loop);
    // ilk ziyaret ipucu
    const D = CZ.state.data;
    if (!D.vilTut) { D.vilTut = true; CZ.state.save(); const tip = h('div', { class: 'tut-tip vl-tip' }, h('span', { text: t('vil.tut') })); wrap.append(tip); setTimeout(() => tip.classList.add('out'), 6500); setTimeout(() => tip.remove(), 7100); }
  }
  function leave() { if (CZ.notify) CZ.notify.schedule(); if (!S) return; cancelAnimationFrame(S.raf); S.cleanup(); S = null; }
  return { render, leave, get debug() { return S; } };
})();
