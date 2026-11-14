// GERÇEK 3D KARAKTERLER (kodla kurulur, resim yok).
// Çizgi film (toon) gölgelendirme + koyu kontur = Crossy Road / Stumble Guys tarzı.
// Her karakterin eklemleri her karede döner: koşu, zıplama, takla, yana kaçış, düşme, sevinç.
(function () {
  let GRAD = null;
  function gradient(THREE) {
    if (GRAD) return GRAD;
    const d = new Uint8Array([90, 90, 90, 255, 175, 175, 175, 255, 255, 255, 255, 255]);
    GRAD = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat);
    GRAD.minFilter = GRAD.magFilter = THREE.NearestFilter;
    GRAD.needsUpdate = true;
    return GRAD;
  }
  const OUT = 0x1c1220;

  // Ortak kurucu: malzeme, parça, kontur
  function kit(THREE) {
    const g = gradient(THREE);
    const mats = [];
    const outline = new THREE.MeshBasicMaterial({ color: OUT, side: THREE.BackSide });
    mats.push(outline);
    const mat = (c, extra) => { const m = new THREE.MeshToonMaterial(Object.assign({ color: c, gradientMap: g }, extra || {})); mats.push(m); return m; };
    const GEO = {
      sph: new THREE.SphereGeometry(1, 18, 14),
      cap: new THREE.CapsuleGeometry(1, 1, 6, 14),
      cyl: new THREE.CylinderGeometry(1, 1, 1, 18),
      cone: new THREE.ConeGeometry(1, 1, 16),
      tor: new THREE.TorusGeometry(1, 0.3, 10, 22)
    };
    function part(geo, m, o) {
      o = o || {};
      const mesh = new THREE.Mesh(geo, m);
      const s = o.s || [1, 1, 1];
      mesh.scale.set(s[0], s[1], s[2]);
      if (o.p) mesh.position.set(o.p[0], o.p[1], o.p[2]);
      if (o.r) mesh.rotation.set(o.r[0], o.r[1], o.r[2]);
      if (o.line !== false && o.line) {
        const l = new THREE.Mesh(geo, outline);
        const k = 1 + o.line;
        l.scale.set(k, k, k);
        mesh.add(l);
      }
      return mesh;
    }
    // r: yarıçap, len: gövde uzunluğu (kapsül ölçeği ayrı eksenlerde)
    const sph = (r, m, p, sc, line) => part(GEO.sph, m, { s: [r * (sc ? sc[0] : 1), r * (sc ? sc[1] : 1), r * (sc ? sc[2] : 1)], p, line });
    const capsule = (r, len, m, p, line) => part(GEO.cap, m, { s: [r, len / 2 + r * 0 || len / 2, r], p, line });
    const pivot = (x, y, z) => { const o = new THREE.Group(); o.position.set(x || 0, y || 0, z || 0); return o; };
    return { mat, mats, GEO, part, sph, capsule, pivot, outline };
  }

  /* ===================== KAHRAMAN ===================== */
  const LOOK = {
    boy: { skin: 0xf2c4a0, hair: 0x6b3f22, hat: 'beanie', hatColor: 0xd23a32, pom: 0xffffff, jacket: 0x3070d8, trim: 0x2f63c4, scarf: 0x44a044, pants: 0x2b3a5c, boots: 0x8a5228 },
    girl: { skin: 0xf6c9a8, hair: 0xb04a26, hat: 'beret', hatColor: 0xf07aa8, pom: 0xffffff, jacket: 0x9152d0, trim: 0xffffff, scarf: 0xf4c52e, pants: 0xa0a4ae, boots: 0xffffff, braid: true },
    elf: { skin: 0xf6c9a8, hair: 0xf3cc5c, hat: 'elf', hatColor: 0x2f9a40, pom: 0xf2c230, jacket: 0x2f9a40, trim: 0xd23a32, scarf: 0xd23a32, pants: 0xffffff, stripes: 0xd23a32, boots: 0x2f9a40, ears: true },
    snowkid: { skin: 0xf2c4a0, hair: 0x6b3f22, hat: 'tophat', hatColor: 0x1d1d26, band: 0xd23a32, pom: 0xf08a2a, jacket: 0xf6f8fc, trim: 0x1d1d26, scarf: 0xd23a32, pants: 0xf6f8fc, boots: 0x1d1d26, chubby: 1.32, buttons: true },
    reindeer: { skin: 0xf2c4a0, hair: 0x8a5230, hat: 'antlers', hatColor: 0x8a5230, pom: 0x4a2c1a, jacket: 0x8a5230, trim: 0xf2dcc0, scarf: 0xd23a32, pants: 0x8a5230, boots: 0x4a2c1a, chubby: 1.12, tail: true, bell: true },
    knight: { skin: 0xf2c4a0, hair: 0x6b3f22, hat: 'helmet', hatColor: 0xf0c03a, pom: 0xe03a32, jacket: 0xf0c03a, trim: 0x9a6a1a, scarf: 0xe03a32, pants: 0x55586a, boots: 0x8a5228, cape: 0xe03a32, armor: true },
    santa: { skin: 0xf6c9a8, hair: 0x7a4426, hat: 'santa', hatColor: 0xe0302e, pom: 0xffffff, jacket: 0xe0302e, trim: 0xffffff, scarf: 0xffffff, pants: 0xe0302e, boots: 0x1d1d26, belt: true, pigtails: true }
  };
  CZ.LOOK3D = LOOK;

  CZ.toonHero = function (THREE, kind) {
    const C = Object.assign({}, LOOK[kind] || LOOK.girl, CZ.charArt && CZ.charArt.hexes ? CZ.charArt.hexes(kind) : {});
    const K = kit(THREE);
    const { mat, sph, pivot, part, GEO } = K;
    const M = {
      skin: mat(C.skin), hair: mat(C.hair), hat: mat(C.hatColor), pom: mat(C.pom), jacket: mat(C.jacket),
      trim: mat(C.trim), scarf: mat(C.scarf), pants: mat(C.pants), boots: mat(C.boots), dark: mat(0x1d1d26),
      gold: mat(0xf2c230), white: mat(0xffffff)
    };
    if (C.stripes) {
      const c = document.createElement('canvas'); c.width = 8; c.height = 32;
      const x = c.getContext('2d');
      x.fillStyle = '#ffffff'; x.fillRect(0, 0, 8, 32);
      x.fillStyle = '#' + C.stripes.toString(16).padStart(6, '0');
      for (let i = 0; i < 32; i += 8) x.fillRect(0, i, 8, 4);
      const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(1, 3);
      tex.magFilter = THREE.NearestFilter;
      M.pants = mat(0xffffff, { map: tex });
    }
    const ch = C.chubby || 1;
    const L = 0.035;    // kontur kalınlığı (oransal)

    const root = new THREE.Group();
    const body = pivot(0, 0, 0); root.add(body);       // eğilme/yatma
    const spin = pivot(0, 0.5, 0); body.add(spin);      // takla bu eksende (göbek hizası)
    const hips = pivot(0, 0.12, 0); spin.add(hips);

    // BACAKLAR (kısa, tombul: chibi)
    const legs = [-1, 1].map(side => {
      const thigh = pivot(side * 0.13 * ch, 0, 0); hips.add(thigh);
      thigh.add(part(GEO.cap, M.pants, { s: [0.095, 0.11, 0.095], p: [0, -0.13, 0], line: L }));
      const knee = pivot(0, -0.27, 0); thigh.add(knee);
      knee.add(part(GEO.cap, M.pants, { s: [0.085, 0.08, 0.085], p: [0, -0.1, 0], line: L }));
      knee.add(part(GEO.sph, M.boots, { s: [0.12, 0.09, 0.16], p: [0, -0.24, -0.03], line: L }));
      return { thigh, knee };
    });

    // GÖVDE (şişme mont)
    const torso = pivot(0, 0.02, 0); hips.add(torso);
    torso.add(part(GEO.sph, M.jacket, { s: [0.29 * ch, 0.3, 0.25 * ch], p: [0, 0.24, 0], line: L }));
    torso.add(part(GEO.tor, M.trim, { s: [0.27 * ch, 0.24 * ch, 0.14], p: [0, 0.03, 0], r: [Math.PI / 2, 0, 0] }));
    if (C.buttons) [0.18, 0.3, 0.42].forEach(y => torso.add(sph(0.03, M.dark, [0, y, -0.25 * ch])));
    if (C.belt) {
      torso.add(part(GEO.tor, M.dark, { s: [0.29 * ch, 0.25 * ch, 0.16], p: [0, 0.14, 0], r: [Math.PI / 2, 0, 0] }));
      torso.add(part(GEO.sph, M.gold, { s: [0.06, 0.05, 0.02], p: [0, 0.14, -0.27] }));
    }
    if (C.armor) torso.add(part(GEO.sph, M.trim, { s: [0.2, 0.22, 0.05], p: [0, 0.28, 0.23] }));
    // yaka/atkı
    torso.add(part(GEO.tor, M.scarf, { s: [0.17, 0.17, 0.3], p: [0, 0.5, 0], r: [Math.PI / 2, 0, 0], line: L }));
    if (!C.armor && !C.belt) {
      const tail = part(GEO.cap, M.scarf, { s: [0.05, 0.1, 0.03], p: [0.08, 0.38, 0.2], r: [0.3, 0, 0.1] });
      torso.add(tail);
    }
    if (C.bell) torso.add(sph(0.05, M.gold, [0, 0.42, -0.2], null, L));
    if (C.tail) torso.add(sph(0.07, M.trim, [0, 0.05, 0.22], null, L));
    let cape = null;
    if (C.cape) {
      cape = pivot(0, 0.5, 0.16); torso.add(cape);
      const cloth = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.34, 0.62, 16, 1, true, -Math.PI / 2, Math.PI), mat(C.cape, { side: THREE.DoubleSide }));
      cloth.position.set(0, -0.3, 0.05); cloth.rotation.y = Math.PI;
      cape.add(cloth);
    }

    // KOLLAR
    const arms = [-1, 1].map(side => {
      const shoulder = pivot(side * 0.28 * ch, 0.38, 0); torso.add(shoulder);
      shoulder.add(part(GEO.cap, M.jacket, { s: [0.075, 0.08, 0.075], p: [0, -0.1, 0], line: L }));
      const elbow = pivot(0, -0.22, 0); shoulder.add(elbow);
      elbow.add(part(GEO.cap, M.jacket, { s: [0.07, 0.06, 0.07], p: [0, -0.07, 0], line: L }));
      const hand = sph(0.065, C.armor ? M.trim : M.skin, [0, -0.19, 0], null, L);
      elbow.add(hand);
      shoulder.rotation.z = side * 0.25;
      return { shoulder, elbow, hand };
    });

    // KAFA (büyük: chibi)
    const neck = pivot(0, 0.55, 0); torso.add(neck);
    const head = pivot(0, 0.24, 0); neck.add(head);
    head.add(sph(0.27, M.skin, [0, 0, 0], null, L));
    head.add(sph(0.275, M.hair, [0, 0.02, 0.05], [1, 0.98, 0.96]));            // arka saç
    [-1, 1].forEach(s2 => head.add(sph(0.06, M.skin, [s2 * 0.27, -0.02, 0], [0.55, 1, 0.8], L)));
    if (C.ears) [-1, 1].forEach(s2 => head.add(part(GEO.cone, M.skin, { s: [0.05, 0.16, 0.05], p: [s2 * 0.31, 0.05, 0.02], r: [0, 0, -s2 * 1.2], line: L })));
    // yüz (menüde ve dönünce görünür)
    [-1, 1].forEach(s2 => {
      head.add(sph(0.045, M.dark, [s2 * 0.1, 0.02, -0.25], [0.8, 1.1, 0.5]));
      head.add(sph(0.014, M.white, [s2 * 0.1 + 0.015, 0.045, -0.275]));
    });
    head.add(sph(0.025, M.skin, [0, -0.04, -0.27]));
    head.add(part(GEO.tor, M.dark, { s: [0.05, 0.05, 0.06], p: [0, -0.1, -0.24], r: [0, 0, Math.PI] }));

    if (C.hat === 'beanie') {
      head.add(sph(0.285, M.hat, [0, 0.08, 0], [1, 0.8, 1], L));
      head.add(part(GEO.tor, M.hat, { s: [0.26, 0.26, 0.4], p: [0, 0.04, 0], r: [Math.PI / 2, 0, 0], line: L }));
      head.add(sph(0.085, M.pom, [0, 0.34, 0], null, L));
    } else if (C.hat === 'beret') {
      head.add(sph(0.33, M.hat, [0, 0.17, 0.03], [1, 0.36, 1], L));
      head.add(sph(0.07, M.pom, [0, 0.3, 0], null, L));
    } else if (C.hat === 'elf') {
      head.add(part(GEO.cone, M.hat, { s: [0.27, 0.62, 0.27], p: [0, 0.38, 0.08], r: [0.55, 0, 0], line: L }));
      head.add(part(GEO.tor, M.trim, { s: [0.26, 0.26, 0.35], p: [0, 0.09, 0], r: [Math.PI / 2, 0, 0], line: L }));
      head.add(sph(0.07, M.pom, [0, 0.55, 0.36], null, L));
    } else if (C.hat === 'tophat') {
      head.add(part(GEO.cyl, M.hat, { s: [0.34, 0.035, 0.34], p: [0, 0.2, 0], line: L }));
      head.add(part(GEO.cyl, M.hat, { s: [0.22, 0.32, 0.22], p: [0, 0.37, 0], line: L }));
      head.add(part(GEO.cyl, mat(C.band), { s: [0.225, 0.07, 0.225], p: [0, 0.25, 0] }));
    } else if (C.hat === 'antlers') {
      head.add(sph(0.3, M.hat, [0, 0.03, 0.02], [1, 1, 1], L));
      [-1, 1].forEach(sd => {
        const ant = pivot(sd * 0.14, 0.22, 0); head.add(ant); ant.rotation.z = -sd * 0.4;
        ant.add(part(GEO.cap, M.pom, { s: [0.035, 0.12, 0.035], p: [0, 0.12, 0], line: L }));
        ant.add(part(GEO.cap, M.pom, { s: [0.03, 0.05, 0.03], p: [-sd * 0.06, 0.15, 0], r: [0, 0, sd * 1], line: L }));
        head.add(sph(0.08, M.hat, [sd * 0.3, 0.1, 0], [1.4, 0.6, 0.5], L));
      });
    } else if (C.hat === 'helmet') {
      head.add(sph(0.3, M.hat, [0, 0.06, 0.01], [1, 0.98, 1], L));
      head.add(part(GEO.cap, M.trim, { s: [0.035, 0.18, 0.035], p: [0, 0.32, 0.02], r: [Math.PI / 2, 0, 0] }));
      head.add(sph(0.11, M.pom, [0, 0.42, 0.08], [0.6, 1.2, 1.7], L));
    } else if (C.hat === 'santa') {
      head.add(part(GEO.cone, M.hat, { s: [0.28, 0.5, 0.28], p: [0, 0.34, 0.1], r: [0.7, 0, 0], line: L }));
      head.add(part(GEO.tor, M.white, { s: [0.27, 0.27, 0.5], p: [0, 0.09, 0], r: [Math.PI / 2, 0, 0], line: L }));
      head.add(sph(0.08, M.white, [0, 0.43, 0.38], null, L));
    }
    const braid = [];
    if (C.braid) {
      let link = pivot(0.06, -0.1, 0.25); head.add(link);
      for (let i = 0; i < 6; i++) {
        link.add(sph(0.07 - i * 0.006, M.hair, [0, -0.045, 0], null, L));
        braid.push(link);
        const next = pivot(0, -0.085, 0); link.add(next); link = next;
      }
    }
    if (C.pigtails) [-1, 1].forEach(sd => {
      const p = pivot(sd * 0.24, -0.08, 0.12); head.add(p);
      p.add(sph(0.08, M.hair, [0, -0.08, 0], [0.8, 1.3, 0.8], L)); braid.push(p);
    });

    const weaponSlot = pivot(0, -0.03, 0);
    arms[1].hand.add(weaponSlot);

    // ---------- ANİMASYON ----------
    let phase = 0;
    const st = { run: 1, jump: 0, slide: 0, lean: 0, dead: 0, roll: 0, rollT: 9, cheer: 0, wasSliding: false };
    const lerp = (a, b, k) => a + (b - a) * k;
    function update(dt, info) {
      const k = Math.min(1, dt * 12);
      st.jump = lerp(st.jump, info.jumping ? 1 : 0, k);
      st.slide = lerp(st.slide, info.sliding ? 1 : 0, Math.min(1, dt * 18));
      st.lean = lerp(st.lean, info.lean || 0, k);
      st.dead = lerp(st.dead, info.dead ? 1 : 0, Math.min(1, dt * 6));
      st.run = lerp(st.run, info.idle ? 0 : 1, Math.min(1, dt * 6));
      st.cheer = lerp(st.cheer, info.cheer ? 1 : 0, Math.min(1, dt * 6));
      // Eğilmeye başlarken bir kez öne TAKLA
      if (info.sliding && !st.wasSliding) st.rollT = 0;
      st.wasSliding = !!info.sliding;
      st.rollT += dt;
      const rollK = Math.min(1, st.rollT / 0.42);
      const rolling = rollK < 1;

      const run = st.run * (1 - st.jump) * (1 - st.slide) * (1 - st.dead) * (1 - st.cheer);
      phase += dt * (9 + (info.speed || 13) * 0.36) * (0.3 + st.run * 0.7);
      const s1 = Math.sin(phase), c1 = Math.cos(phase);

      legs.forEach((Lg, i) => {
        const sg = i ? -1 : 1;
        Lg.thigh.rotation.x = run * s1 * sg * 0.95 + st.jump * (i ? 1.3 : 0.5) + st.slide * 1.6 + st.cheer * Math.sin(phase * 1.4 + i * 3) * 0.3;
        Lg.knee.rotation.x = -(run * Math.max(0, -Math.sin(phase + (i ? Math.PI : 0) + 0.9)) * 1.6 + st.jump * (i ? 1.7 : 1.0) + st.slide * 1.9);
      });
      arms.forEach((A, i) => {
        const sg = i ? 1 : -1;
        A.shoulder.rotation.x = run * s1 * sg * 0.95 + st.jump * -2.7 + st.slide * -0.6 + st.cheer * -2.9;
        A.shoulder.rotation.z = (i ? 1 : -1) * (0.25 + st.jump * 0.5 + st.slide * 0.9 + Math.abs(st.lean) * 0.6 + st.cheer * (0.4 + Math.sin(phase * 2.2) * 0.25));
        A.elbow.rotation.x = run * 1.2 + st.jump * 0.2;
      });
      torso.rotation.x = run * -0.22 + st.slide * -0.5;
      torso.rotation.y = run * s1 * 0.14;
      head.rotation.x = run * 0.1 + st.slide * 0.3;
      hips.position.y = 0.12 + run * Math.abs(c1) * 0.07 - st.slide * 0.36 + st.cheer * Math.abs(Math.sin(phase * 1.4)) * 0.12;
      body.rotation.z = -st.lean * 0.45;
      body.rotation.y = st.lean * 0.3;
      // takla: tüm gövde öne bir tur döner (kalça ekseninde)
      spin.rotation.x = rolling ? -rollK * Math.PI * 2 : 0;
      spin.position.y = 0.5 - (rolling ? Math.sin(rollK * Math.PI) * 0.2 : 0);
      body.rotation.x = st.dead * 1.4;
      if (cape) cape.rotation.x = 0.25 + run * (0.45 + Math.sin(phase * 2) * 0.15) + st.jump * 0.9 + st.slide * 0.4;
      braid.forEach((b, i) => {
        b.rotation.x = (C.braid ? (i ? 0.12 : 0.55) : 0) + Math.sin(phase - i * 0.6) * 0.2 * run + st.jump * 0.5;
        b.rotation.z = Math.cos(phase - i * 0.5) * 0.15 * run - st.lean * 0.3;
      });
    }
    function setOpacity(o) { K.mats.forEach(m => { m.transparent = o < 1; m.opacity = o; }); }
    // dünyadaki boy ~1.45 birim (eski sprite kahramanla aynı ölçek)
    body.scale.setScalar(1.08);
    return { root, update, weaponSlot, setOpacity, is3d: true, dispose() { K.mats.forEach(m => m.dispose()); } };
  };

  /* ===================== ZİBO (3D goblin) ===================== */
  CZ.toonZibo = function (THREE, tint) {
    const K = kit(THREE);
    const { mat, sph, pivot, part, GEO } = K;
    const skinC = tint || 0x7cc84a;
    const M = {
      skin: mat(skinC), dark: mat(0x1d1d26), white: mat(0xffffff), vest: mat(0x7a4a24), pants: mat(0x3a2a4a),
      hat: mat(0xe0302e), fur: mat(0xffffff), sack: mat(0xc8a060), gold: mat(0xf2c230), mouth: mat(0x7a1f2a), tooth: mat(0xfff6dc)
    };
    const L = 0.035;
    const root = new THREE.Group();
    const body = pivot(); root.add(body);
    const hips = pivot(0, 0.55, 0); body.add(hips);
    const legs = [-1, 1].map(side => {
      const thigh = pivot(side * 0.12, 0, 0); hips.add(thigh);
      thigh.add(part(GEO.cap, M.pants, { s: [0.08, 0.1, 0.08], p: [0, -0.12, 0], line: L }));
      const knee = pivot(0, -0.24, 0); thigh.add(knee);
      knee.add(part(GEO.cap, M.skin, { s: [0.065, 0.07, 0.065], p: [0, -0.09, 0], line: L }));
      knee.add(part(GEO.sph, M.skin, { s: [0.09, 0.06, 0.17], p: [0, -0.21, -0.06], line: L }));   // çıplak goblin ayağı
      return { thigh, knee };
    });
    const torso = pivot(0, 0.02, 0); hips.add(torso);
    torso.add(part(GEO.sph, M.vest, { s: [0.26, 0.28, 0.23], p: [0, 0.22, 0], line: L }));
    torso.add(part(GEO.sph, M.skin, { s: [0.2, 0.2, 0.12], p: [0, 0.2, -0.13] }));     // göbek
    // ÇUVAL (sırtında, altın dolu)
    const sack = pivot(0, 0.3, 0.26); torso.add(sack);
    sack.add(part(GEO.sph, M.sack, { s: [0.26, 0.3, 0.22], p: [0, 0, 0.05], line: L }));
    sack.add(part(GEO.tor, M.vest, { s: [0.09, 0.09, 0.2], p: [0, 0.27, 0.05], r: [Math.PI / 2, 0, 0] }));
    [[-0.08, 0.32], [0.05, 0.36], [0.12, 0.3]].forEach(([x, y]) => sack.add(part(GEO.cyl, M.gold, { s: [0.06, 0.015, 0.06], p: [x, y, 0.05], r: [0.4, 0, 0.3], line: 0.06 })));
    const arms = [-1, 1].map(side => {
      const shoulder = pivot(side * 0.25, 0.34, 0); torso.add(shoulder);
      shoulder.add(part(GEO.cap, M.skin, { s: [0.06, 0.09, 0.06], p: [0, -0.1, 0], line: L }));
      const elbow = pivot(0, -0.22, 0); shoulder.add(elbow);
      elbow.add(part(GEO.cap, M.skin, { s: [0.055, 0.07, 0.055], p: [0, -0.08, 0], line: L }));
      elbow.add(sph(0.065, M.skin, [0, -0.2, 0], null, L));
      shoulder.rotation.z = side * 0.3;
      return { shoulder, elbow };
    });
    const neck = pivot(0, 0.48, 0); torso.add(neck);
    const head = pivot(0, 0.24, 0); neck.add(head);
    head.add(sph(0.29, M.skin, [0, 0, 0], [1.08, 0.95, 1], L));
    // kocaman sivri kulaklar
    [-1, 1].forEach(sd => {
      const ear = part(GEO.cone, M.skin, { s: [0.1, 0.38, 0.06], p: [sd * 0.38, 0.06, 0.02], r: [0, 0, -sd * 1.25], line: L });
      head.add(ear);
    });
    // YÜZ (z negatif tarafta = kafa döndüğünde kameraya bakar)
    [-1, 1].forEach(sd => {
      head.add(sph(0.085, M.white, [sd * 0.11, 0.05, -0.24], [1, 1.15, 0.6], L));
      head.add(sph(0.04, M.dark, [sd * 0.105, 0.04, -0.29], [1, 1.1, 0.6]));
      head.add(part(GEO.cap, M.dark, { s: [0.02, 0.05, 0.02], p: [sd * 0.11, 0.17, -0.25], r: [0, 0, sd * 0.6] }));   // kaş
    });
    head.add(sph(0.08, M.skin, [0, -0.03, -0.3], [0.7, 0.8, 1.2], L));       // burun
    const mouth = part(GEO.sph, M.mouth, { s: [0.13, 0.06, 0.05], p: [0, -0.14, -0.24] });
    head.add(mouth);
    head.add(part(GEO.sph, M.tooth, { s: [0.025, 0.03, 0.02], p: [0.05, -0.12, -0.275] }));
    head.add(part(GEO.sph, M.tooth, { s: [0.025, 0.03, 0.02], p: [-0.05, -0.12, -0.275] }));
    // Noel şapkası (çalıntı!)
    head.add(part(GEO.cone, M.hat, { s: [0.27, 0.5, 0.27], p: [0, 0.34, 0.08], r: [0.6, 0, 0.2], line: L }));
    head.add(part(GEO.tor, M.fur, { s: [0.27, 0.27, 0.45], p: [0, 0.14, 0], r: [Math.PI / 2, 0, 0], line: L }));
    head.add(sph(0.075, M.fur, [0.08, 0.45, 0.33], null, L));
    let crown = null;

    let phase = 0;
    const st = { look: 0, dizzy: 0, laugh: 0, jump: 0 };
    function update(dt, info) {
      const k = Math.min(1, dt * 8);
      st.look = st.look + ((info.look ? 1 : 0) - st.look) * k;
      st.dizzy = st.dizzy + ((info.dizzy ? 1 : 0) - st.dizzy) * k;
      st.jump = st.jump + ((info.air ? 1 : 0) - st.jump) * Math.min(1, dt * 12);
      phase += dt * (info.running === false ? 3 : 15);
      const s1 = Math.sin(phase), run = (1 - st.dizzy) * (1 - st.jump) * (info.running === false ? 0.2 : 1);
      legs.forEach((Lg, i) => {
        const sg = i ? -1 : 1;
        Lg.thigh.rotation.x = run * s1 * sg * 1.0 + st.jump * (i ? 1.2 : 0.4);
        Lg.knee.rotation.x = -(run * Math.max(0, -Math.sin(phase + (i ? Math.PI : 0) + 0.9)) * 1.5 + st.jump * 1.4);
      });
      arms.forEach((A, i) => {
        const sg = i ? 1 : -1;
        A.shoulder.rotation.x = run * s1 * sg * 1.0 + st.dizzy * Math.sin(phase * 0.7 + i) * 1.2 + st.jump * -2.2;
        A.shoulder.rotation.z = (i ? 1 : -1) * (0.3 + st.dizzy * 0.8 + st.look * 0.3);
        A.elbow.rotation.x = run * 1.2;
      });
      torso.rotation.x = run * -0.25;
      torso.rotation.y = run * s1 * 0.18 + st.look * 0.5;
      // geriye bakıp gülme: kafa ~150° döner, ağız açılır
      head.rotation.y = st.look * 2.6;
      head.rotation.z = st.dizzy * Math.sin(phase * 0.6) * 0.4;
      mouth.scale.y = 0.06 + (st.look * (0.05 + Math.abs(Math.sin(phase * 0.9)) * 0.05));
      hips.position.y = 0.55 + run * Math.abs(Math.cos(phase)) * 0.07;
      body.rotation.y = st.dizzy * phase * 0.4;
      sack.rotation.x = run * Math.sin(phase * 2) * 0.12;
    }
    function setCrown(on) {
      if (!on || crown) return;
      crown = pivot(0, 0.32, 0.02); head.add(crown);
      for (let i = 0; i < 5; i++) {
        const a = i / 5 * Math.PI * 2;
        crown.add(part(GEO.cone, M.gold, { s: [0.06, 0.16, 0.06], p: [Math.cos(a) * 0.18, 0.06, Math.sin(a) * 0.18], line: 0.08 }));
      }
      crown.add(part(GEO.cyl, M.gold, { s: [0.2, 0.06, 0.2], p: [0, 0, 0], line: 0.06 }));
    }
    body.scale.setScalar(1.25);
    return { root, update, setCrown, mats: K.mats, dispose() { K.mats.forEach(m => m.dispose()); } };
  };
})();
