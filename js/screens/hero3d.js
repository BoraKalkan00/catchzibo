// Koşucu karakter: basit parçalardan (küre, kapsül) kurulmuş 3D çocuk.
// Resim resim değil, her karede eklemleri döndürerek akıcı koşar (Subway Surfers gibi).
// Renkler Gemini'deki karakter çizimleriyle aynı (CZ.CHARS).
CZ.CHARS = {
  boy: { skin: 0xf2c4a0, hair: 0x6b3f22, hat: 'beanie', hatColor: 0xc8302e, pom: 0xf4f4f4, jacket: 0x2f63c4, scarf: 0x3f8a3a, pants: 0x2b3448, boots: 0x7a4a24 },
  elf: { skin: 0xf2c4a0, hair: 0xf0c860, hat: 'elf', hatColor: 0x2f8a3a, pom: 0xe8b82a, jacket: 0x2f8a3a, scarf: 0xc8302e, pants: 0xf2f2f2, stripes: 0xd23a3a, boots: 0x2f8a3a },
  snowkid: { skin: 0xf2c4a0, hair: 0x6b3f22, hat: 'tophat', hatColor: 0x1d1d22, band: 0xc8302e, pom: 0xf08a2a, jacket: 0xf4f6fa, scarf: 0xc8302e, pants: 0xf4f6fa, boots: 0x1d1d22, chubby: 1.3 },
  reindeer: { skin: 0xf2c4a0, hair: 0x7a4a2a, hat: 'antlers', hatColor: 0x7a4a2a, pom: 0x4a2c1a, jacket: 0x7a4a2a, scarf: 0xc8302e, pants: 0x7a4a2a, boots: 0x3e2414, chubby: 1.1 },
  knight: { skin: 0xf2c4a0, hair: 0x6b3f22, hat: 'helmet', hatColor: 0xe0b030, pom: 0xd22a2a, jacket: 0xe0b030, scarf: 0xd22a2a, pants: 0x55555e, boots: 0x7a4a24, cape: 0xd22a2a },
  girl: { skin: 0xf2c4a0, hair: 0xa4472a, hat: 'beret', hatColor: 0xe0709e, pom: 0xf4f4f4, jacket: 0x8a4cc0, scarf: 0xf0c22e, fur: 0xf6f1ea, pants: 0x9a9ca4, boots: 0xf2f2f2, braid: true }
};

CZ.hero3d = function (THREE, kind) {
  const C = Object.assign({}, CZ.CHARS[kind] || CZ.CHARS.girl, CZ.charArt ? CZ.charArt.hexes(kind) : {});
  const mat = c => new THREE.MeshLambertMaterial({ color: c });
  const stripeMat = () => {
    const c = document.createElement('canvas'); c.width = 16; c.height = 64;
    const x = c.getContext('2d');
    x.fillStyle = '#' + C.pants.toString(16).padStart(6, '0'); x.fillRect(0, 0, 16, 64);
    x.fillStyle = '#' + C.stripes.toString(16).padStart(6, '0');
    for (let i = 0; i < 64; i += 16) x.fillRect(0, i, 16, 8);
    const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(1, 2);
    return new THREE.MeshLambertMaterial({ map: tex });
  };
  const M = { skin: mat(C.skin), hair: mat(C.hair), hat: mat(C.hatColor), pom: mat(C.pom), jacket: mat(C.jacket), scarf: mat(C.scarf), pants: C.stripes ? stripeMat() : mat(C.pants), boots: mat(C.boots), fur: mat(C.fur || 0xffffff) };
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
  jacket.scale.set(1.12 * (C.chubby || 1), 1, 0.92 * (C.chubby || 1));
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

  let cape = null;
  if (C.cape) {
    cape = pivot(0, 0.6, 0.2);
    torso.add(cape);
    const cloth = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.36, 0.7, 14, 1, true, -Math.PI / 2, Math.PI), new THREE.MeshLambertMaterial({ color: C.cape, side: THREE.DoubleSide }));
    cloth.position.set(0, -0.34, -0.2);
    cape.add(cloth);
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
  } else if (C.hat === 'antlers') {
    head.add(sph(0.235, M.hat, 0, 0.02, 0.02, 1.05, 1.05, 1.05));
    [-1, 1].forEach(sd => {
      const ant = pivot(sd * 0.12, 0.18, 0); head.add(ant);
      const main = cap(0.03, 0.2, M.pom, 0.12); ant.add(main); ant.rotation.z = -sd * 0.45;
      const tine = cap(0.025, 0.08, M.pom, 0.1); tine.position.set(sd * -0.06, 0.12, 0); tine.rotation.z = sd * 0.9; ant.add(tine);
      head.add(sph(0.06, M.hat, sd * 0.22, 0.08, 0, 1.4, 0.7, 0.5));
    });
  } else if (C.hat === 'helmet') {
    head.add(sph(0.225, M.hat, 0, 0.05, 0.01, 1, 0.95, 1));
    const ridge = cap(0.03, 0.3, M.hat, 0); ridge.position.set(0, 0.24, 0.02); ridge.rotation.x = Math.PI / 2; head.add(ridge);
    const plume = sph(0.08, M.pom, 0, 0.32, 0.04, 0.6, 1.3, 1.6); head.add(plume);
  } else if (C.hat === 'tophat') {
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.03, 20), M.hat);
    brim.position.y = 0.15; head.add(brim);
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.26, 20), M.hat);
    crown.position.y = 0.29; head.add(crown);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.175, 0.06, 20), mat(C.band || 0xc8302e));
    band.position.y = 0.2; head.add(band);
    head.add(sph(0.04, M.pom, 0.17, 0.21, 0, 1.6, 0.7, 0.7));
  } else if (C.hat === 'elf') {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.55, 14), M.hat);
    cone.position.set(0, 0.3, 0.08); cone.rotation.x = 0.7;
    head.add(cone);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.05, 8, 20), M.scarf);
    rim.rotation.x = Math.PI / 2; rim.position.y = 0.07;
    head.add(rim);
    head.add(sph(0.06, M.pom, 0, 0.42, 0.38));
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
    if (cape) cape.rotation.x = -(0.25 + run * (0.35 + Math.sin(phase * 2) * 0.12) + state.jump * 0.8 + state.slide * 0.3);
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

// Gemini çizimleriyle koşucu (2B kâğıt değil: adımlara göre yaylanır, eğilir, pozlar arasında yumuşak geçer).
// Karakterin kendi çizimleri kullanıldığı için oyundaki karakter birebir Gemini'deki karakter olur.
// İleride 8 karelik koşu sayfası gelirse CZ.RUN_FRAMES[kind] listesine eklenir, otomatik kullanılır.
// Videodan çıkarılmış kareler (Kling yeşil ekran): koşu döngüsü ve zıplama dizisi.
CZ.POSE_FRAMES = {
  girl: { slide: ['slide2'], left: ['left'], right: ['right'] }
};
CZ.RUN_FRAMES = {
  knight: ['run00', 'run01', 'run02', 'run03', 'run04', 'run05', 'run06', 'run07', 'run08', 'run09', 'run10', 'run11', 'run12'],
  boy: Array.from({ length: 8 }, (_, i) => 'run' + String(i).padStart(2, '0')),
  girl: Array.from({ length: 18 }, (_, i) => 'run' + String(i).padStart(2, '0'))
};
CZ.JUMP_FRAMES = { knight: ['jmp00', 'jmp01', 'jmp02', 'jmp03', 'jmp04', 'jmp05', 'jmp06', 'jmp07', 'jmp08', 'jmp09', 'jmp10', 'jmp11', 'jmp12', 'jmp13'] };
CZ.heroSprite = function (THREE, kind) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const mat = new THREE.SpriteMaterial({ transparent: true });
  const sp = new THREE.Sprite(mat);
  sp.center.set(0.5, 0);
  body.add(sp);
  const weaponSlot = new THREE.Group();
  weaponSlot.position.set(0.42, 0.95, 0.05);
  body.add(weaponSlot);
  const tex = {};
  const video = !!CZ.RUN_FRAMES[kind];
  const runFrames = CZ.RUN_FRAMES[kind] || ['back1', 'back2'];
  const jumpFrames = CZ.JUMP_FRAMES[kind] || ['jump'];
  // Ek pozlar (videodan gelirse): eğilme kareleri ve sağa/sola kaçış kareleri. Yoksa eski tek resimler.
  const extra = (CZ.POSE_FRAMES && CZ.POSE_FRAMES[kind]) || {};
  const slideFrames = extra.slide || ['slide'];
  const leftFrames = extra.left || null;
  const rightFrames = extra.right || null;
  const poses = Array.from(new Set(runFrames.concat(jumpFrames, slideFrames, leftFrames || [], rightFrames || [], ['jump'])));
  poses.forEach(p => {
    const im = new Image();
    im.onload = () => {
      const c = document.createElement('canvas');
      const hh = 512, r = im.naturalWidth / im.naturalHeight;
      c.height = hh; c.width = Math.round(hh * r);
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      const t = new THREE.CanvasTexture(c);
      t.userData = { ratio: r };
      tex[p] = t;
    };
    im.src = CZ.charArt ? CZ.charArt.url(kind, p) : CZ.art('char.' + kind + '_' + p);
  });
  let phase = 0, cur = null, squash = 0, lastFrame = -1;
  const st = { jump: 0, slide: 0, lean: 0, dead: 0 };
  const lerp = (a, b, k) => a + (b - a) * k;
  function show(p, height) {
    const t = tex[p];
    if (!t) return;
    if (cur !== p) { mat.map = t; mat.needsUpdate = true; cur = p; }
    sp.scale.set(height * t.userData.ratio, height, 1);
  }
  function update(dt, info) {
    st.jump = lerp(st.jump, info.jumping ? 1 : 0, Math.min(1, dt * 14));
    st.slide = lerp(st.slide, info.sliding ? 1 : 0, Math.min(1, dt * 18));
    if (!info.sliding) st.slideT = 0;
    st.lean = lerp(st.lean, info.lean || 0, Math.min(1, dt * 12));
    st.dead = lerp(st.dead, info.dead ? 1 : 0, Math.min(1, dt * 5));
    const running = !info.idle && !info.dead;
    phase += dt * (running ? 7 + (info.speed || 13) * 0.3 : 2);
    const H = 1.85;
    if (info.sliding) {
      st.slideT = (st.slideT || 0) + dt;
      const sf = slideFrames[Math.min(slideFrames.length - 1, Math.floor(st.slideT * 14))];
      show(sf, extra.slide ? H * 1.25 : H * 0.62);
      body.position.y = 0;
      body.rotation.z = 0;
    } else if (info.jumping) {
      // Zıplama: yükselirken → tepede → inerken kareleri sırayla
      const k = info.jumpV ? Math.min(1, Math.max(0, (info.jumpV - (info.vy || 0)) / (2 * info.jumpV))) : 0.5;
      const jf = jumpFrames[Math.min(jumpFrames.length - 1, Math.floor(k * jumpFrames.length))];
      show(jf, video ? H * 1.25 : H * 1.05);
      body.position.y = 0;
      body.rotation.z = st.lean * -0.25;
    } else if ((leftFrames || rightFrames) && (Math.abs(info.lean || 0) > 0.12 || st.dodgeHold > 0)) {
      // Şerit değiştirirken yana kaçış karesi (en az ~0,3 sn görünür)
      if (Math.abs(info.lean || 0) > 0.12) { st.dodgeDir = info.lean < 0 ? -1 : 1; st.dodgeHold = Math.max(st.dodgeHold || 0, 0.3); }
      st.dodgeHold -= dt;
      const fr = (st.dodgeDir < 0 ? leftFrames : rightFrames) || leftFrames || rightFrames;
      st.dodgeT = (st.dodgeT || 0) + dt;
      show(fr[Math.min(fr.length - 1, Math.floor(st.dodgeT * 16))], H * 1.25);
      body.position.y = 0;
      body.rotation.z = 0;
    } else {
      st.dodgeT = 0;
      // Koşu: kareler adım hızında değişir; her adımda gövde yaylanır ve hafifçe sallanır.
      const n = runFrames.length;
      const f = Math.floor((phase / Math.PI) * (n / 2)) % n;
      if (f !== lastFrame) { lastFrame = f; squash = 1; }
      show(runFrames[f], video ? H * 1.25 : H);
      squash = video ? 0 : Math.max(0, squash - dt * 9);
      const step = Math.abs(Math.sin(phase));
      body.position.y = running && !video ? step * 0.09 : 0;
      body.rotation.z = (running ? Math.sin(phase) * 0.035 : 0) + st.lean * -0.3;
      sp.scale.y *= 1 - squash * 0.05;
      sp.scale.x *= 1 + squash * 0.04;
    }
    // Düşme: yana devrilir
    if (st.dead > 0.01) body.rotation.z = st.dead * 1.3;
    weaponSlot.visible = !info.sliding;
  }
  function setOpacity(o) { mat.opacity = o; }
  return { root, update, weaponSlot, setOpacity, dispose() { Object.values(tex).forEach(t => t.dispose()); mat.dispose(); } };
};
