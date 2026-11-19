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
        root.traverse(o => { if (o.isMesh) { o.geometry.computeVertexNormals(); o.material = new THREE.MeshLambertMaterial({ vertexColors: true }); o.castShadow = true; o.receiveShadow = true; } });
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
