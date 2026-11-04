// Koşucu karakter: basit parçalardan (küre, kapsül) kurulmuş 3D çocuk.
// Resim resim değil, her karede eklemleri döndürerek akıcı koşar (Subway Surfers gibi).
// Renkler Gemini'deki karakter çizimleriyle aynı (CZ.CHARS).
CZ.CHARS = {
  boy: { skin: 0xf2c4a0, hair: 0x6b3f22, hat: 'beanie', hatColor: 0xc8302e, pom: 0xf4f4f4, jacket: 0x2f63c4, scarf: 0x3f8a3a, pants: 0x2b3448, boots: 0x7a4a24 },
  girl: { skin: 0xf2c4a0, hair: 0xa4472a, hat: 'beret', hatColor: 0xe0709e, pom: 0xf4f4f4, jacket: 0x8a4cc0, scarf: 0xf0c22e, fur: 0xf6f1ea, pants: 0x9a9ca4, boots: 0xf2f2f2, braid: true }
};

CZ.hero3d = function (THREE, kind) {
  const C = CZ.CHARS[kind] || CZ.CHARS.girl;
  const mat = c => new THREE.MeshLambertMaterial({ color: c });
  const M = { skin: mat(C.skin), hair: mat(C.hair), hat: mat(C.hatColor), pom: mat(C.pom), jacket: mat(C.jacket), scarf: mat(C.scarf), pants: mat(C.pants), boots: mat(C.boots), fur: mat(C.fur || 0xffffff) };
  const sph = (r, m, x, y, z, sx, sy, sz) => {
    const o = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), m);
    o.position.set(x || 0, y || 0, z || 0);
    o.scale.set(sx || 1, sy || 1, sz || 1);
    return o;
  };
  const cap = (r, len, m, y) => {
    const o = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 12), m);
    o.position.y = y;
    return o;
  };
  const pivot = (x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z || 0); return g; };

  const root = new THREE.Group();      // dünyada konum
  const body = pivot(0, 0, 0);         // zıplama/eğilme için gövde
  root.add(body);
  const hips = pivot(0, 0.82, 0);
  body.add(hips);

  // Bacaklar: kalça → diz → bot
  const legs = [-1, 1].map(side => {
    const thigh = pivot(side * 0.12, 0, 0);
    hips.add(thigh);
    thigh.add(cap(0.085, 0.3, M.pants, -0.19));
    const knee = pivot(0, -0.4, 0);
    thigh.add(knee);
    knee.add(cap(0.075, 0.26, M.pants, -0.17));
    const boot = sph(0.1, M.boots, 0, -0.38, -0.04, 1, 0.75, 1.45);
    knee.add(boot);
    return { thigh, knee };
  });

  // Gövde: şişme mont + atkı/kürk yaka
  const torso = pivot(0, 0.02, 0);
  hips.add(torso);
  const jacket = cap(0.23, 0.3, M.jacket, 0.3);
  jacket.scale.set(1.12, 1, 0.92);
  torso.add(jacket);
  [0.2, 0.36].forEach(y => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.235, 0.03, 8, 20), M.jacket);
    ring.rotation.x = Math.PI / 2; ring.position.y = y; ring.scale.set(1.12, 0.92, 1);
    torso.add(ring);
  });
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.065, 10, 18), C.fur ? M.fur : M.scarf);
  collar.rotation.x = Math.PI / 2; collar.position.y = 0.6;
  torso.add(collar);
  if (!C.fur) {
    const tail = cap(0.045, 0.22, M.scarf, 0.42);
    tail.position.set(0.07, 0.44, 0.17); tail.rotation.x = 0.25;
    torso.add(tail);
  } else {
    const sc = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.05, 8, 16), M.scarf);
    sc.rotation.x = Math.PI / 2; sc.position.y = 0.66;
    torso.add(sc);
  }

  // Kollar: omuz → dirsek → el
  const arms = [-1, 1].map(side => {
    const shoulder = pivot(side * 0.27, 0.5, 0);
    torso.add(shoulder);
    shoulder.add(cap(0.075, 0.2, M.jacket, -0.14));
    const elbow = pivot(0, -0.3, 0);
    shoulder.add(elbow);
    elbow.add(cap(0.068, 0.16, M.jacket, -0.11));
    const hand = sph(0.055, M.skin, 0, -0.27, 0);
    elbow.add(hand);
    shoulder.rotation.z = side * 0.18;
    return { shoulder, elbow, hand };
  });

  // Kafa: yüz kameraya dönük değil, arkadan saç ve şapka görünür
  const neck = pivot(0, 0.66, 0);
  torso.add(neck);
  const head = pivot(0, 0.2, 0);
  neck.add(head);
  head.add(sph(0.2, M.skin, 0, 0, 0));
  head.add(sph(0.205, M.hair, 0, -0.01, 0.035, 1.02, 1, 1));
  [-1, 1].forEach(s2 => head.add(sph(0.045, M.skin, s2 * 0.2, -0.01, 0.0, 0.6, 1, 0.8)));
  if (C.hat === 'beanie') {
    head.add(sph(0.215, M.hat, 0, 0.06, 0, 1, 0.82, 1));
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.045, 8, 20), M.hat);
    cuff.rotation.x = Math.PI / 2; cuff.position.y = 0.03;
    head.add(cuff);
    head.add(sph(0.065, M.pom, 0, 0.26, 0));
  } else {
    const beret = sph(0.25, M.hat, 0, 0.13, 0.02, 1, 0.42, 1);
    beret.rotation.x = -0.25;
    head.add(beret);
    head.add(sph(0.05, M.pom, 0, 0.24, 0.0));
  }
  const braid = [];
  if (C.braid) {
    let parent = head;
    let link = pivot(0.05, -0.08, 0.2);
    head.add(link);
    for (let i = 0; i < 6; i++) {
      link.add(sph(0.058 - i * 0.004, M.hair, 0, -0.04, 0));
      braid.push(link);
      parent = link;
      link = pivot(0, -0.075, 0);
      parent.add(link);
    }
  }

  // Elde silah (sağ elde, opsiyonel sprite)
  const weaponSlot = pivot(0, -0.05, 0);
  arms[1].hand.add(weaponSlot);

  let phase = 0;
  const lerp = (a, b, k) => a + (b - a) * k;
  const state = { run: 1, jump: 0, slide: 0, lean: 0, dead: 0 };   // 0..1 karışımları

  // dt: saniye, info: { speed, jumping, vy, sliding, lean, dead }
  function update(dt, info) {
    const k = Math.min(1, dt * 12);
    state.jump = lerp(state.jump, info.jumping ? 1 : 0, k);
    state.slide = lerp(state.slide, info.sliding ? 1 : 0, Math.min(1, dt * 16));
    state.lean = lerp(state.lean, info.lean || 0, k);
    state.dead = lerp(state.dead, info.dead ? 1 : 0, Math.min(1, dt * 5));
    state.run = lerp(state.run, info.idle ? 0 : 1, Math.min(1, dt * 6));
    const run = state.run * (1 - state.jump) * (1 - state.slide) * (1 - state.dead);
    phase += dt * (8 + (info.speed || 13) * 0.32) * (0.25 + state.run * 0.75);
    const s1 = Math.sin(phase), c1 = Math.cos(phase);

    // Koşu: bacaklar ve kollar ters fazda
    legs.forEach((L, i) => {
      const sg = i ? -1 : 1;
      const swing = s1 * sg;
      L.thigh.rotation.x = run * swing * 0.85 + state.jump * (i ? 1.1 : 0.4) + state.slide * 1.35;
      L.knee.rotation.x = -(run * Math.max(0, -Math.sin(phase + (i ? Math.PI : 0) + 0.9)) * 1.5 + state.jump * (i ? 1.5 : 0.9) + state.slide * 0.2);
    });
    arms.forEach((A, i) => {
      const sg = i ? 1 : -1;
      A.shoulder.rotation.x = run * s1 * sg * 0.8 + state.jump * -2.5 + state.slide * 0.9;
      A.shoulder.rotation.z = (i ? 1 : -1) * (0.18 + state.jump * 0.35 + state.slide * 0.5);
      A.elbow.rotation.x = run * 1.1 + state.jump * 0.3 + state.slide * 0.2;
    });
    // Gövde: öne eğik, zıplarken toparlanır, kayarken arkaya yatar
    torso.rotation.x = run * -0.18 + state.jump * -0.1 + state.slide * 0.4;
    torso.rotation.y = run * s1 * 0.12;
    head.rotation.x = state.slide * -0.4;
    hips.position.y = 0.82 + run * Math.abs(c1) * 0.06 - state.slide * 0.5;
    body.rotation.z = state.lean * -0.35;
    body.rotation.y = state.lean * 0.25;
    // Düşme: yana devrilir
    body.rotation.x = state.dead * -1.35;
    // Saç örgüsü sallanır
    braid.forEach((b, i) => {
      b.rotation.x = (i ? -0.12 : -0.55) + Math.sin(phase - i * 0.6) * 0.16 * run - state.jump * 0.4;
      b.rotation.z = Math.cos(phase - i * 0.5) * 0.12 * run - state.lean * 0.3;
    });
  }

  function setOpacity(o) {
    Object.values(M).forEach(m => { m.transparent = o < 1; m.opacity = o; });
  }

  return { root, update, weaponSlot, setOpacity, dispose() { Object.values(M).forEach(m => m.dispose()); } };
};
