// Bilgisayarda yapay zekâyla üretilen 3D modeller (assets/3d/gen/*.glb). Köşe renkli, tek parça.
// CZ.GEN3D: hangi modellerin hazır olduğu ve oyundaki boyu (h) / yönü (yaw).
CZ.GEN3D = {
  // (21 Kas) artık kullanılmayanlar lazy: yükleme ~1.5 MB kısaldı (binekler kodla, binalar KayKit, ağaçlar kodla)
  ayi: { yaw: Math.PI, seat: 0.66, lazy: 1 }, kutupayisi: { yaw: Math.PI, seat: 0.64, lazy: 1 }, rengeyigi: { yaw: Math.PI, seat: 0.5, lazy: 1 },
  kurt: { yaw: Math.PI, seat: 0.6, lazy: 1 }, mamut: { yaw: Math.PI, seat: 0.78, lazy: 1 },
  kartopukulesi: { lazy: 1 }, topkulesi: { yaw: Math.PI, lazy: 1 }, koymeydani: { lazy: 1 }, altinmadeni: { lazy: 1 }, firin: { lazy: 1 }, ahir: { lazy: 1 }, demirci: { lazy: 1 },
  cam_lo: { lazy: 1 }, cam_hi: { lazy: 1 }, hediye_lo: {}, sandik_lo: {},
  v_goblin: { lazy: 1 }, v_chief: { lazy: 1 }, v_zibo: { lazy: 1 }, v_rudi: { lazy: 1 }, v_hela: { lazy: 1 }, v_buzbas: { lazy: 1 }, v_demir: { lazy: 1 }, v_noel: { lazy: 1 },
  v_girl: { lazy: 1 }, v_boy: { lazy: 1 }, v_santa: { lazy: 1 }, v_elf: { lazy: 1 }, v_snowkid: { lazy: 1 }, v_reindeer: { lazy: 1 }, v_knight: { lazy: 1 }, v_mila: { lazy: 1 },
  g_cadir: {}, g_totem: { yaw: Math.PI }, g_ates: {},
  goblin: { yaw: Math.PI }, zibo: { yaw: Math.PI }, goblinsef: { yaw: Math.PI }, kuyu: { lazy: 1 }, fici: { lazy: 1 }, fener: { lazy: 1 },
  h_rudi: { yaw: Math.PI }, h_ela: { yaw: Math.PI }, h_buzbas: { yaw: Math.PI }, h_demir: { yaw: Math.PI }, h_noel: { yaw: Math.PI }
};
// OYUNUN TEK GÖRSEL STİLİ: her şey aynı çizgi film ışık rampasıyla (3 ton), aynı konturla ve
// aynı renk aralığında çizilir. Karakterler, binalar, goblinler, ağaçlar: hepsi CZ.style.mat ile.
CZ.style = (function () {
  let G = null;
  function grad() {
    if (G) return G; const T = window.THREE;
    const d = new Uint8Array([112, 112, 112, 255, 178, 178, 178, 255, 228, 228, 228, 255, 255, 255, 255, 255]);   // gölge · ara · ışık · parlak
    G = new T.DataTexture(d, 4, 1, T.RGBAFormat); G.minFilter = G.magFilter = T.NearestFilter; G.needsUpdate = true; return G;
  }
  // (22 Kas) GRAFİK KALİTESİ: 'hi' = yumuşak gölgeli stilize PBR + kenar ışığı (Fortnite benzeri), 'lo' = eski çizgi film (zayıf telefon)
  function gfx() { const d = CZ.state && CZ.state.data || {}; if (gfx.v && gfx.k === d.gfx) return gfx.v; gfx.k = d.gfx; let v = d.gfx;
    if (v !== 'hi' && v !== 'lo') { const mem = navigator.deviceMemory || 4, cores = navigator.hardwareConcurrency || 4; v = (mem <= 3 || cores <= 4) ? 'lo' : 'hi'; }
    return (gfx.v = v); }
  const RIM = { value: null };
  function soft(o) { const T = window.THREE; o = Object.assign({}, o); delete o.gradientMap;
    const m = new T.MeshStandardMaterial(Object.assign({ roughness: 0.82, metalness: 0 }, o));
    if (!RIM.value) RIM.value = new T.Color(0xfff2dd);
    m.onBeforeCompile = sh => { sh.uniforms.uRim = RIM;
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uRim;').replace('#include <output_fragment>',
        'float rimF = 1.0 - clamp(dot(normalize(vViewPosition), normal), 0.0, 1.0); rimF = 1.0 - rimF; rimF = pow(clamp(1.0 - abs(dot(normalize(-vViewPosition), normal)), 0.0, 1.0), 2.6);\n outgoingLight += uRim * rimF * 0.22 * (0.4 + 0.6 * diffuseColor.rgb);\n#include <output_fragment>'); };
    m.customProgramCacheKey = () => 'czsoft';
    return m; }
  const mat = o => { o = typeof o === 'number' ? { color: o } : o; return gfx() === 'hi' ? soft(o) : new window.THREE.MeshToonMaterial(Object.assign({ gradientMap: grad() }, o)); };
  // yapay zekâ modellerinin renklerini ortak paletle uyumlu yap: aşırı soluk/aşırı koyu tonları topla, doygunluğu dengele
  function harmonize(geo) {
    const c = geo.attributes.color; if (!c || c.userData && c.userData.hz) return; const T = window.THREE, col = new T.Color(), hsl = {};
    for (let i = 0; i < c.count; i++) { col.setRGB(c.getX(i), c.getY(i), c.getZ(i)); col.getHSL(hsl);
      const s2 = Math.min(0.85, hsl.s * 1.3 + 0.05), l2 = 0.08 + hsl.l * 0.74; col.setHSL(hsl.h, s2, l2); c.setXYZ(i, col.r, col.g, col.b); }
    c.needsUpdate = true; c.userData = { hz: true };
  }
  return { grad, mat, harmonize, gfx, RIM, OL: 0x1c1a2e };
})();
CZ.gen3d = (function () {
  const cache = {}, maps = {};
  // Dokulu modellerde her üçgenin kendi köşeleri var (UV dikişi); gölge pürüzsüz olsun diye aynı konumdaki köşelerin normallerini ortala
  function smooth(geo) {
    geo.computeVertexNormals(); const p = geo.attributes.position, n = geo.attributes.normal, acc = {};
    const key = i => Math.round(p.getX(i) * 1e4) + ',' + Math.round(p.getY(i) * 1e4) + ',' + Math.round(p.getZ(i) * 1e4);
    for (let i = 0; i < p.count; i++) { const k = key(i), a = acc[k] || (acc[k] = [0, 0, 0]); a[0] += n.getX(i); a[1] += n.getY(i); a[2] += n.getZ(i); }
    for (let i = 0; i < p.count; i++) { const a = acc[key(i)], l = Math.hypot(a[0], a[1], a[2]) || 1; n.setXYZ(i, a[0] / l, a[1] / l, a[2] / l); }
    n.needsUpdate = true;
  }
  let P = null;
  // Karakter modelleri (v_*) büyük: yalnız seçili karakter ve Mila açılışta, diğerleri gerektiğinde (need) iner.
  const pend = {};
  function one(id) {
    if (cache[id]) return Promise.resolve(); if (pend[id]) return pend[id];
    const THREE = window.THREE; if (!THREE || !THREE.GLTFLoader) return Promise.resolve();
    const L = new THREE.GLTFLoader();
    return (pend[id] = new Promise(ok => {
      L.load('assets/3d/gen/' + id + '.glb', g => {
        const root = g.scene;
        root.traverse(o => { if (!o.isMesh) return;
          const map = o.material && o.material.map;
          if (map) { map.encoding = THREE.LinearEncoding; smooth(o.geometry); o.material = CZ.style.mat({ map }); maps[id] = map; }   // Gemini dokulu karakter
          else { o.geometry.computeVertexNormals(); CZ.style.harmonize(o.geometry); o.material = CZ.style.mat({ vertexColors: true }); }
          o.castShadow = true; o.receiveShadow = true; });
        cache[id] = root; ok();
      }, undefined, () => ok());
    }));
  }
  function need(ids) { return Promise.all(ids.filter(id => CZ.GEN3D[id]).map(one)); }
  function load() {
    const K = CZ.KK_GEN || {}, av = K[(CZ.state && CZ.state.data.avatar) || 'girl'];
    if (!P) P = need(Object.keys(CZ.GEN3D).filter(id => !CZ.GEN3D[id].lazy));
    const bud = CZ.heroes && CZ.heroes.buddy ? K['hero_' + CZ.heroes.buddy()] : null;
    return Promise.all([P, need([av, K.mila, K.zibo, bud].filter(Boolean))]);   // seçili karakter değişmiş olabilir: onu da indir
  }
  const has = id => !!cache[id];
  // Boyu h olan, tabanı y=0'da, öne (-z) bakan kopya. tint verilirse renk çarpılır.
  function get(id, h, tint) {
    const THREE = window.THREE, C = CZ.GEN3D[id] || {};
    const m = cache[id].clone(true);
    if (tint) m.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.color.setHex(tint); } });
    const g = new THREE.Group(), inner = new THREE.Group();
    inner.add(m); inner.rotation.y = (C.yaw || 0); inner.scale.setScalar(h || C.h || 1);
    g.add(inner);
    return g;
  }
  // İlk meshin geometrisi (InstancedMesh için)
  function geo(id) { let g = null; cache[id].traverse(o => { if (!g && o.isMesh) { g = o.geometry.clone(); o.updateWorldMatrix(true, false); g.applyMatrix4(o.matrixWorld); } }); return g; }
  return { load, need, has, get, geo, smooth, map: id => maps[id] || null };
})();
