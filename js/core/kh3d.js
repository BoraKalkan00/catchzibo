/* KayKit Medieval Hexagon (CC0) 3D binalar — köy binaları, kuleler, inşaat, çit/sur.
   Her model yüklenince: taban y=0, en geniş yatay boyu 1 birim, malzeme tek tip toon (oyunun ışığına uyar). */
window.CZ = window.CZ || {};
CZ.KH = (function () {
  const DIR = 'assets/3d/kh/';
  const src = {}, waiting = {};
  let tex = null, toonMat = null;
  function mat(THREE) {
    if (toonMat) return toonMat;
    tex = new THREE.TextureLoader().load(DIR + 'hexagons_medieval.png');
    tex.flipY = false; tex.encoding = THREE.LinearEncoding; tex.magFilter = THREE.NearestFilter;
    toonMat = CZ.style.mat({ map: tex });
    return toonMat;
  }
  function load(THREE, name) {
    if (src[name]) return Promise.resolve(src[name]);
    if (waiting[name]) return waiting[name];
    waiting[name] = new Promise(res => {
      new THREE.GLTFLoader().load(DIR + name + '.gltf', g => {
        const root = g.scene, m = mat(THREE);
        root.traverse(o => { if (o.isMesh) { o.material = m; o.castShadow = true; o.receiveShadow = true; } });
        const box = new THREE.Box3().setFromObject(root), sz = box.getSize(new THREE.Vector3());
        const k = 1 / Math.max(sz.x, sz.z, 0.001);
        const wrap = new THREE.Group(); root.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
        wrap.add(root); wrap.scale.setScalar(k); const outer = new THREE.Group(); outer.add(wrap);
        outer.userData.h = sz.y * k;
        src[name] = outer; res(outer);
      }, undefined, () => res(null));
    });
    return waiting[name];
  }
  const has = name => !!src[name];
  // kopya: geometri/malzeme paylaşılır (bellek az)
  function get(name, width) { const s = src[name]; if (!s) return null; const c = s.clone(true); c.scale.setScalar(width || 1); c.userData.kh = true; c.userData.h = s.userData.h * (width || 1); return c; }
  function loadAll(THREE, names) { return Promise.all(names.map(n => load(THREE, n))); }

  // KÖY BİNALARI: seviye eşiklerinde model değişir (Kingshot gibi), aradaki seviyelerde büyür + bayrak/fıçı eklenir
  const B = n => 'building_' + n + '_blue';
  const VMAP = {
    hall: [[1, B('church')], [7, B('castle')]],
    house: [[1, B('home_B')], [5, B('barracks')]],
    canteen: [[1, B('tavern')]],
    goldmine: [[1, 'building_mine_yellow']],
    mine: [[1, B('mine')]],
    bakery: [[1, B('windmill')]],
    vault: [[1, B('market')]],
    tower: [[1, B('tower_A')], [6, B('tower_B')]],
    stable: [[1, B('barracks')]],
    forge: [[1, B('blacksmith')]],
    lookout: [[1, B('tower_base')], [3, B('tower_B')]],
    elf: [[1, B('home_A')]],
    cookie: [[1, B('watermill')]],
    gate: [[1, B('archeryrange')]],
    jail: [[1, B('lumbermill')]]
  };
  const VW = { house: 4.76, canteen: 5.04, hall: 5.88, goldmine: 4.48, mine: 4.48, bakery: 4.2, vault: 4.76, tower: 3.36, stable: 4.76, forge: 4.48, lookout: 3.36, elf: 3.92, cookie: 4.48, gate: 4.76, jail: 4.48 };   // (22 Kas) binalar %40 büyüdü
  // kuleler: kartopu = okçu kulesi, top = mancınıklı kule
  const TMAP = { snow: [[1, B('tower_A')], [4, B('tower_B')]], cannon: [[1, B('tower_base')], [2, B('tower_catapult')]] };
  const STAGES = ['building_stage_A', 'building_stage_B', 'building_stage_C', 'building_scaffolding'];
  const pick = (arr, L) => { let n = arr[0][1]; arr.forEach(([lv, nm]) => { if (L >= lv) n = nm; }); return n; };
  function all() { const s = new Set(['flag_blue', 'barrel', 'crate_A_small', 'wall_straight', 'fence_wood_straight', 'fence_stone_straight', ...STAGES]); Object.values(VMAP).concat(Object.values(TMAP)).forEach(a => a.forEach(([, n]) => s.add(n))); return [...s]; }
  // seviyeye göre süs: 3+ bayrak, 5+ ikinci bayrak, 7+ fıçı/sandık
  function dress(g, L, w) {
    const h = g.userData.h || 1;
    if (L >= 3 && has('flag_blue')) { const f = get('flag_blue', w * 0.22); f.position.set(w * 0.38, 0, w * 0.3); g.add(f); }
    if (L >= 5 && has('flag_blue')) { const f = get('flag_blue', w * 0.22); f.position.set(-w * 0.38, 0, w * 0.3); g.add(f); }
    if (L >= 7 && has('barrel')) { const b = get('barrel', w * 0.13); b.position.set(w * 0.45, 0, -w * 0.05); g.add(b); const c = get('crate_A_small', w * 0.14); if (c) { c.position.set(-w * 0.45, 0, 0); g.add(c); } }
    return h;
  }
  function stage(w, k) { const n = STAGES[Math.min(STAGES.length - 1, k || 0)]; return has(n) ? get(n, w) : null; }
  // köy binası modeli (yoksa null → eski çizim kullanılır)
  function village(THREE, id, L, busy) {
    const arr = VMAP[id]; if (!arr) return null;
    const w = (VW[id] || 3) * (1 + Math.min(10, L) * 0.025);
    if (busy && L <= 1) { const s = stage(w, 0); if (s) { const g = new THREE.Group(); g.add(s); const sc = stage(w * 0.9, 3); if (sc) g.add(sc); g.userData.kh = true; return g; } }
    const nm = pick(arr, L); if (!has(nm)) return null;
    const g = new THREE.Group(), m = get(nm, w); g.add(m); g.userData.kh = true;
    dress(g, L, w);
    if (busy) { const sc = stage(w * 1.05, 3); if (sc) g.add(sc); }   // yükseltme sürerken iskele
    return g;
  }
  function tower(THREE, type, L, busy) {
    const arr = TMAP[type]; if (!arr) return null;
    const w = 3.0 * (1 + L * 0.06);
    if (busy && L <= 1) { const s = stage(w, 1); if (!s) return null; const g = new THREE.Group(); g.add(s); const sc = stage(w * 0.9, 3); if (sc) g.add(sc); g.userData.kh = true; return g; }
    const nm = pick(arr, L); if (!has(nm)) return null;
    const g = new THREE.Group(); g.add(get(nm, w)); g.userData.kh = true; dress(g, L + 2, w);
    if (busy) { const sc = stage(w * 1.05, 3); if (sc) g.add(sc); }
    return g;
  }
  return { load, loadAll, all, has, get, village, tower };
})();
