// Bilgisayarda yapay zekâyla üretilen 3D modeller (assets/3d/gen/*.glb). Köşe renkli, tek parça.
// CZ.GEN3D: hangi modellerin hazır olduğu ve oyundaki boyu (h) / yönü (yaw).
CZ.GEN3D = {
  ayi: { yaw: Math.PI, seat: 0.66 }, kutupayisi: { yaw: Math.PI, seat: 0.64 }, rengeyigi: { yaw: Math.PI, seat: 0.5 },
  kurt: { yaw: Math.PI, seat: 0.6 }, mamut: { yaw: Math.PI, seat: 0.78 },
  kartopukulesi: {}, topkulesi: { yaw: Math.PI }, koymeydani: {}, altinmadeni: {}, firin: {}, ahir: {}, demirci: {},
  cam_lo: {}, cam_hi: {}, hediye_lo: {}, sandik_lo: {},
  g_cadir: {}, g_totem: { yaw: Math.PI }, g_ates: {},
  goblin: { yaw: Math.PI }, zibo: { yaw: Math.PI }, goblinsef: { yaw: Math.PI }, kuyu: {}, fici: {}, fener: {},
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
  const mat = o => new window.THREE.MeshToonMaterial(Object.assign({ gradientMap: grad() }, typeof o === 'number' ? { color: o } : o));
  // yapay zekâ modellerinin renklerini ortak paletle uyumlu yap: aşırı soluk/aşırı koyu tonları topla, doygunluğu dengele
  function harmonize(geo) {
    const c = geo.attributes.color; if (!c || c.userData && c.userData.hz) return; const T = window.THREE, col = new T.Color(), hsl = {};
    for (let i = 0; i < c.count; i++) { col.setRGB(c.getX(i), c.getY(i), c.getZ(i)); col.getHSL(hsl);
      const s2 = Math.min(0.85, hsl.s * 1.3 + 0.05), l2 = 0.08 + hsl.l * 0.74; col.setHSL(hsl.h, s2, l2); c.setXYZ(i, col.r, col.g, col.b); }
    c.needsUpdate = true; c.userData = { hz: true };
  }
  return { grad, mat, harmonize, OL: 0x1c1a2e };
})();
CZ.gen3d = (function () {
  const cache = {};
  let P = null;
  function load() {
    if (P) return P;
    const THREE = window.THREE;
    const ids = Object.keys(CZ.GEN3D);
    if (!ids.length || !THREE || !THREE.GLTFLoader) return (P = Promise.resolve());
    const L = new THREE.GLTFLoader();
    P = Promise.all(ids.map(id => new Promise(ok => {
      L.load('assets/3d/gen/' + id + '.glb', g => {
        const root = g.scene;
        root.traverse(o => { if (o.isMesh) { o.geometry.computeVertexNormals(); CZ.style.harmonize(o.geometry); o.material = CZ.style.mat({ vertexColors: true }); o.castShadow = true; o.receiveShadow = true; } });
        cache[id] = root; ok();
      }, undefined, () => ok());
    })));
    return P;
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
  return { load, has, get, geo };
})();
