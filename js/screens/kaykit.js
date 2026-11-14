// PROFESYONEL 3D KARAKTERLER
// Modeller ve animasyonlar: KayKit Adventurers (Kay Lousberg, CC0 — ticari kullanım serbest).
// Her karakter aynı iskeleti paylaşır; renkler doku paletinden boyanır, Noel aksesuarları kemiklere takılır.
(function () {
  const FILES = ['knight', 'mage', 'rogue', 'rogue_hooded', 'barbarian'];
  let P = null;
  const base = {};
  let clips = null;
  let T = null;

  function script(src) {
    return new Promise((ok, fail) => {
      const s = document.createElement('script');
      s.src = src; s.onload = ok; s.onerror = fail;
      document.head.append(s);
    });
  }
  function load(THREE) {
    T = THREE;
    if (P) return P;
    P = (THREE.GLTFLoader ? Promise.resolve() : script('js/vendor/GLTFLoader.js'))
      .then(() => THREE.SkeletonUtils ? null : script('js/vendor/SkeletonUtils.js'))
      .then(() => {
        const L = new THREE.GLTFLoader();
        const get = f => new Promise((ok, fail) => L.load('assets/3d/' + f + '.glb', ok, undefined, fail));
        return Promise.all([get('anims')].concat(FILES.map(get))).then(([a, ...list]) => {
          clips = {};
          a.animations.forEach(c => { clips[c.name] = c; });
          FILES.forEach((f, i) => { base[f] = list[i].scene; });
        });
      });
    P.catch(() => { P = null; });
    return P;
  }
  const ready = () => !!clips;

  /* ---------- Palet boyama ---------- */
  // Doku 8x4 hücre (her biri 128x256). Hücrenin kendi parlaklık geçişi korunur, rengi değişir.
  const texCache = {};
  function paint(tex, cells, key) {
    if (!cells || !Object.keys(cells).length) return tex;
    if (texCache[key]) return texCache[key];
    const im = tex.image;
    const c = document.createElement('canvas');
    c.width = im.width; c.height = im.height;
    const x = c.getContext('2d');
    x.drawImage(im, 0, 0);
    const cw = im.width / 8, ch = im.height / 4;
    Object.keys(cells).forEach(k => {
      const [cx, cy] = k.split(',').map(Number);
      const col = cells[k];
      const tr = (col >> 16) & 255, tg = (col >> 8) & 255, tb = col & 255;
      const d = x.getImageData(cx * cw, cy * ch, cw, ch);
      const p = d.data;
      // hücrenin ortası referans parlaklık
      const mid = ((ch / 2) * cw + cw * 0.3) * 4 | 0;
      const ref = Math.max(20, 0.3 * p[mid] + 0.59 * p[mid + 1] + 0.11 * p[mid + 2]);
      for (let i = 0; i < p.length; i += 4) {
        const l = (0.3 * p[i] + 0.59 * p[i + 1] + 0.11 * p[i + 2]) / ref;
        p[i] = Math.min(255, tr * l); p[i + 1] = Math.min(255, tg * l); p[i + 2] = Math.min(255, tb * l);
      }
      x.putImageData(d, cx * cw, cy * ch);
    });
    const t2 = new T.CanvasTexture(c);
    t2.flipY = tex.flipY; t2.encoding = T.LinearEncoding; t2.magFilter = T.NearestFilter; t2.minFilter = T.LinearFilter;
    texCache[key] = t2;
    return t2;
  }

  let GRAD = null;
  function grad() {
    if (GRAD) return GRAD;
    const d = new Uint8Array([120, 120, 120, 255, 200, 200, 200, 255, 255, 255, 255, 255]);
    GRAD = new T.DataTexture(d, 3, 1, T.RGBAFormat);
    GRAD.minFilter = GRAD.magFilter = T.NearestFilter; GRAD.needsUpdate = true;
    return GRAD;
  }

  /* ---------- Karakter tarifleri ---------- */
  // body: hangi model, head: başka modelden kafa (isteğe bağlı), hide: gizlenecek parçalar,
  // paint: { model: { 'x,y': renk } }, acc: kemiklere takılan aksesuarlar
  const LOOKS = {
    knight: { body: 'knight', paint: { knight: { '3,0': 0xd8a83a, '7,0': 0x9aa4ac, '2,1': 0xd8a83a, '7,1': 0x6a4a1a } } },
    girl: { body: 'rogue', hide: ['Rogue_Cape'], paint: { rogue: { '1,0': 0xc0502a, '0,1': 0x8a4ad0, '1,1': 0xf4c52e, '3,2': 0xb4b8c4, '7,1': 0xf4f4f8, '6,0': 0xf4f4f8, '5,2': 0xf6f0ff, '5,0': 0xe8e0f4 } }, acc: ['beret'] },
    santa: { body: 'rogue', hide: ['Rogue_Cape'], paint: { rogue: { '1,0': 0x4a2412, '0,1': 0xd8282a, '1,1': 0xf6f6f6, '3,2': 0xd8282a, '7,1': 0x1d1d26, '6,0': 0x1d1d26, '3,0': 0xf2c230, '5,2': 0xf6f6f6, '5,0': 0xf6f6f6 } }, acc: ['santaHat'] },
    elf: { body: 'rogue_hooded', hide: ['Rogue_Cape'], paint: { rogue_hooded: { '1,1': 0x2fa040, '0,1': 0xd23a32, '3,2': 0xf6f6f6, '7,1': 0x2f9a40, '1,0': 0xf3cc5c } }, acc: ['bell'] },
    boy: { body: 'mage', hide: ['Mage_Hat', 'Mage_Cape'], paint: { mage: { '1,0': 0x6b3f22, '0,1': 0x2f6fd8, '2,2': 0x44a044, '2,1': 0x44a044, '3,2': 0x2b3a5c, '7,1': 0x8a5228 } }, acc: ['beanie'] },
    snowkid: { body: 'mage', hide: ['Mage_Hat', 'Mage_Cape'], paint: { mage: { '1,0': 0x6b3f22, '0,1': 0xf4f6fb, '4,0': 0xf4f6fb, '3,0': 0x1d1d26, '2,2': 0xd23a32, '5,0': 0xd23a32, '3,2': 0xf4f6fb, '7,1': 0x1d1d26 } }, acc: ['topHat', 'carrot'] },
    reindeer: { body: 'barbarian', head: 'mage', hide: ['Barbarian_Head', 'Barbarian_Cape'], paint: { barbarian: { '7,0': 0x8a5230, '2,1': 0xf2dcc0, '0,1': 0x8a5230, '1,1': 0xa0643a, '6,0': 0x6a3c20, '3,2': 0x8a5230, '7,1': 0x4a2c1a, '7,2': 0xf2dcc0 }, mage: { '1,0': 0x6a3c20 } }, acc: ['antlers', 'nose'] }
  };
  CZ.KK_LOOKS = LOOKS;

  function toonize(root, paints, keyBase) {
    root.traverse(o => {
      if (!o.isMesh) return;
      const m = o.material;
      const model = o.userData.kkModel;
      const map = m.map ? paint(m.map, paints[model], keyBase + ':' + model) : null;
      if (map) map.encoding = T.LinearEncoding;   // oyun doğrusal çıktı kullanıyor: renkler olduğu gibi
      o.material = new T.MeshToonMaterial({ map, color: map ? 0xffffff : m.color, gradientMap: grad(), transparent: false });
      o.castShadow = false;
      o.frustumCulled = false;
    });
  }

  function tagModel(obj, model) { obj.traverse(o => { if (o.isMesh) o.userData.kkModel = model; }); }

  // Başka modelin kafasını bu iskelete bağla
  function borrowHead(target, donorName, headName) {
    const donor = T.SkeletonUtils.clone(base[donorName]);
    tagModel(donor, donorName);
    let head = null;
    donor.traverse(o => { if (o.isSkinnedMesh && o.name === headName) head = o; });
    if (!head) return;
    const bones = head.skeleton.bones.map(b => target.getObjectByName(b.name));
    const sk = new T.Skeleton(bones, head.skeleton.boneInverses);
    let host = null;
    target.traverse(o => { if (!host && o.isSkinnedMesh) host = o; });
    head.parent.remove(head);
    host.parent.add(head);
    head.bind(sk, head.bindMatrix);
  }

  /* ---------- Aksesuarlar (kemiğe takılır) ---------- */
  function accessories(root, list, mat) {
    mat = mat || {};
    const head = root.getObjectByName('head');
    const chest = root.getObjectByName('chest');
    const G = T;
    const m = c => new G.MeshToonMaterial({ color: c, gradientMap: grad() });
    const add = (parent, geo, material, p, r, s) => {
      const o = new G.Mesh(geo, material);
      if (p) o.position.set(p[0], p[1], p[2]);
      if (r) o.rotation.set(r[0], r[1], r[2]);
      if (s) o.scale.set(s[0], s[1], s[2]);
      parent.add(o);
      return o;
    };
    const sph = new G.SphereGeometry(1, 16, 12), cone = new G.ConeGeometry(1, 1, 16), tor = new G.TorusGeometry(1, 0.32, 10, 20), cyl = new G.CylinderGeometry(1, 1, 1, 18);
    const red = m(0xe0302e), white = m(0xffffff), gold = m(0xf2c230), black = m(0x1d1d26), brown = m(0x5a3418);
    // Kafa kemiği ölçüleri: kafa merkezi yaklaşık (0, 0.5, 0), yarıçap ~0.55
    list.forEach(a => {
      if (a === 'santaHat') {
        add(head, tor, white, [0, 0.98, 0], [Math.PI / 2, 0, 0], [0.55, 0.55, 0.5]);
        add(head, cone, red, [0, 1.4, -0.12], [-0.45, 0, 0], [0.5, 0.85, 0.5]);
        add(head, sph, white, [0, 1.72, -0.42], null, [0.14, 0.14, 0.14]);
      } else if (a === 'beanie') {
        const hc = mat.hat ? m(mat.hat) : red;
        add(head, sph, hc, [0, 0.98, 0], null, [0.62, 0.48, 0.62]);
        add(head, tor, hc, [0, 0.9, 0], [Math.PI / 2, 0, 0], [0.6, 0.6, 0.55]);
        add(head, sph, white, [0, 1.48, 0], null, [0.17, 0.17, 0.17]);
      } else if (a === 'beret') {
        add(head, sph, m(mat.hat || 0xf07aa8), [0.06, 1.0, 0], [0, 0, -0.22], [0.54, 0.16, 0.52]);
        add(head, sph, white, [0.06, 1.16, 0], null, [0.08, 0.08, 0.08]);
      } else if (a === 'topHat') {
        add(head, cyl, black, [0, 1.12, 0], null, [0.62, 0.05, 0.62]);
        add(head, cyl, black, [0, 1.42, 0], null, [0.42, 0.6, 0.42]);
        add(head, cyl, red, [0, 1.2, 0], null, [0.43, 0.1, 0.43]);
      } else if (a === 'carrot') {
        add(head, cone, m(0xf08a2a), [0, 0.42, 0.62], [Math.PI / 2, 0, 0], [0.07, 0.3, 0.07]);
      } else if (a === 'antlers') {
        [-1, 1].forEach(sd => {
          const ant = new G.Group(); ant.position.set(sd * 0.3, 1.25, -0.05); ant.rotation.z = -sd * 0.35; head.add(ant);
          add(ant, cyl, brown, [0, 0.25, 0], null, [0.05, 0.5, 0.05]);
          add(ant, cyl, brown, [-sd * 0.12, 0.32, 0], [0, 0, sd * 1.0], [0.04, 0.25, 0.04]);
          add(ant, cyl, brown, [sd * 0.05, 0.5, 0], [0, 0, -sd * 0.7], [0.04, 0.2, 0.04]);
        });
      } else if (a === 'nose') {
        add(head, sph, m(0xff2a2a), [0, 0.42, 0.58], null, [0.11, 0.1, 0.1]);
      } else if (a === 'bell') {
        add(chest, sph, gold, [0, 0.05, 0.45], null, [0.1, 0.1, 0.1]);
      } else if (a === 'goblinEars') {
        [-1, 1].forEach(sd => add(head, cone, mat.skin, [sd * 0.7, 0.55, 0], [0, 0, -sd * 1.45], [0.16, 0.8, 0.09]));
      } else if (a === 'sack') {
        add(chest, sph, m(0xc8a060), [0.12, 0.2, -0.5], null, [0.34, 0.4, 0.3]);
        add(chest, tor, m(0x7a4a24), [0.12, 0.58, -0.5], [Math.PI / 2, 0, 0], [0.12, 0.12, 0.25]);
        [[0.02, 0.64], [0.16, 0.68], [0.26, 0.6]].forEach(([x, y]) => add(chest, cyl, gold, [x, y, -0.5], [0.4, 0, 0.3], [0.09, 0.025, 0.09]));
      }
    });
  }

  /* ---------- Animasyon sürücüsü ---------- */
  function rig(root) {
    const mixer = new T.AnimationMixer(root);
    const acts = {};
    const act = n => {
      if (!acts[n]) { acts[n] = mixer.clipAction(clips[n]); }
      return acts[n];
    };
    let cur = null;
    function play(n, o) {
      o = o || {};
      const a = act(n);
      if (cur === a && !o.restart) return a;
      a.reset();
      a.setLoop(o.once ? T.LoopOnce : T.LoopRepeat);
      a.clampWhenFinished = !!o.once;
      a.timeScale = o.speed || 1;
      a.enabled = true;
      a.play();
      if (cur) cur.crossFadeTo(a, o.fade == null ? 0.12 : o.fade, false);
      cur = a;
      return a;
    }
    return { mixer, play, act, get cur() { return cur; } };
  }

  /* ---------- KAHRAMAN ---------- */
  function hero(THREE, kind, hexOverride) {
    T = THREE;
    const L0 = LOOKS[kind] || LOOKS.girl;
    // Gardıroptan alınan renkler (mont / bere / atkı) 3D modele de uygulanır.
    const hx = hexOverride || (CZ.charArt && CZ.charArt.hexes ? CZ.charArt.hexes(kind) : {});
    const L = Object.assign({}, L0, { paint: JSON.parse(JSON.stringify(L0.paint || {})) });
    const cells = L.paint[L.body] = L.paint[L.body] || {};
    if (hx.jacket) cells['0,1'] = hx.jacket;
    if (hx.scarf && L.body === 'mage') { cells['2,2'] = hx.scarf; cells['2,1'] = hx.scarf; }
    if (hx.scarf && L.body === 'rogue') cells['1,1'] = hx.scarf;
    const model = T.SkeletonUtils.clone(base[L.body]);
    tagModel(model, L.body);
    if (L.head) borrowHead(model, L.head, L.head === 'mage' ? 'Mage_Head' : L.head);
    (L.hide || []).forEach(n => { const o = model.getObjectByName(n); if (o) o.visible = false; });
    toonize(model, L.paint || {}, kind + JSON.stringify(hx));
    accessories(model, L.acc || [], { hat: hx.hatColor });
    const root = new T.Group();
    const holder = new T.Group();
    holder.rotation.y = Math.PI;      // kameraya sırtı dönük koşsun
    holder.scale.setScalar(0.5);
    holder.add(model);
    root.add(holder);
    const R = rig(model);
    // Silah yuvası: sağ elde
    const weaponSlot = new T.Group();
    const hand = model.getObjectByName('handslotr') || model.getObjectByName('handr') || model.getObjectByName('head');
    hand.add(weaponSlot);
    weaponSlot.scale.setScalar(1 / 0.5);

    const st = { mode: '', wasJump: false, wasSlide: false, side: 0, dodgeT: 0 };
    function update(dt, info) {
      let want = 'run';
      if (info.dead) want = 'dead';
      else if (info.cheer) want = 'cheer';
      else if (info.idle) want = 'idle';
      else if (info.sliding) want = 'roll';
      else if (info.jumping) want = 'jump';
      const lean = info.lean || 0;
      const side = lean > 0.35 ? 1 : lean < -0.35 ? -1 : 0;
      if (want === 'run' && side && side !== st.side) { st.dodgeT = 0.28; st.dodgeDir = side; }
      st.side = side;
      st.dodgeT -= dt;
      if (want === 'run' && st.dodgeT > 0) want = st.dodgeDir > 0 ? 'dodgeR' : 'dodgeL';
      if (want !== st.mode) {
        const prev = st.mode;
        st.mode = want;
        if (want === 'run') R.play('Running_A', { speed: 1.25, fade: prev === 'roll' ? 0.08 : 0.15 });
        else if (want === 'jump') { const c = clips.Jump_Full_Short; R.play('Jump_Full_Short', { once: true, speed: c.duration / 0.8, fade: 0.06 }); }
        else if (want === 'roll') { const c = clips.Dodge_Forward; R.play('Dodge_Forward', { once: true, speed: c.duration / 0.55, fade: 0.05 }); }
        else if (want === 'dodgeL') R.play('Dodge_Left', { once: true, speed: 2.2, fade: 0.06 });
        else if (want === 'dodgeR') R.play('Dodge_Right', { once: true, speed: 2.2, fade: 0.06 });
        else if (want === 'dead') R.play('Death_A', { once: true, fade: 0.1 });
        else if (want === 'cheer') R.play('Cheer', { fade: 0.2 });
        else R.play('Idle', { fade: 0.25 });
      }
      if (want === 'run') { const a = R.cur; if (a) a.timeScale = 0.9 + Math.min(0.8, (info.speed || 14) / 40); }
      R.mixer.update(dt);
    }
    const mats = [];
    model.traverse(o => { if (o.isMesh) mats.push(o.material); });
    root.traverse(o => { if (o.isMesh && !mats.includes(o.material)) mats.push(o.material); });
    function setOpacity(o) { mats.forEach(m => { m.transparent = o < 1; m.opacity = o; }); }
    function throwNow() { R.play('Throw', { once: true, speed: 2, fade: 0.05, restart: true }); st.mode = 'throw'; setTimeout(() => { if (st.mode === 'throw') st.mode = ''; }, 380); }
    return { root, update, weaponSlot, setOpacity, throwNow, is3d: true, kk: true };
  }

  /* ---------- ZİBO ---------- */
  function zibo(THREE, tint) {
    T = THREE;
    const skin = tint || 0x7cc84a;
    const dark = new T.Color(skin).multiplyScalar(0.72).getHex();
    const face = new T.Color(skin).multiplyScalar(0.78).getHex();   // açık ten hücresi parlak: biraz koyulaştır
    // Gövde: barbar (çıplak kollar), kafa: şövalyenin kel kafası. Ten yeşil, Noel şapkası, kocaman kulaklar, atkı.
    const model = T.SkeletonUtils.clone(base.barbarian);
    tagModel(model, 'barbarian');
    borrowHead(model, 'knight', 'Knight_Head');
    ['Barbarian_Head', 'Barbarian_Hat', 'Barbarian_Cape'].forEach(n => { const o = model.getObjectByName(n); if (o) o.visible = false; });
    toonize(model, {
      barbarian: { '0,0': face, '1,0': dark, '6,0': 0x5a3418, '1,1': 0x3f8a2c, '0,1': 0x3f8a2c, '2,1': 0x3f8a2c, '7,0': 0x5a3418, '3,2': 0x5a3418, '7,1': 0x2a1a10, '7,2': dark },
      knight: { '0,0': face, '1,0': dark }
    }, 'zibo:' + skin);
    const skinMat = new T.MeshToonMaterial({ color: dark, gradientMap: grad() });
    accessories(model, ['goblinEars', 'santaHat', 'sack'], { skin: skinMat });
    const root = new T.Group();
    const holder = new T.Group();
    holder.rotation.y = Math.PI;
    holder.scale.setScalar(0.66);
    holder.add(model);
    root.add(holder);
    const R = rig(model);
    const head = model.getObjectByName('head');
    let crown = null;
    const st = { mode: '', look: 0 };
    function update(dt, info) {
      let want = 'run';
      if (info.dizzy) want = 'hit';
      else if (info.air) want = 'jump';
      else if (info.throwing) want = 'throw';
      else if (info.running === false) want = 'idle';
      if (want !== st.mode) {
        st.mode = want;
        if (want === 'run') R.play('Running_B', { speed: 1.3 });
        else if (want === 'hit') R.play('Hit_A', { speed: 1, fade: 0.08 });
        else if (want === 'jump') R.play('Jump_Idle', { fade: 0.08 });
        else if (want === 'throw') R.play('Throw', { once: true, speed: 1.6, fade: 0.06 });
        else R.play('Cheer', { fade: 0.2 });
      }
      R.mixer.update(dt);
      // geriye bakıp gülme: kafa döner (animasyonun üstüne)
      st.look += ((info.look ? 1 : 0) - st.look) * Math.min(1, dt * 8);
      if (st.look > 0.01) head.rotation.y += st.look * 2.4;
    }
    function setCrown(on) {
      if (!on || crown) return;
      const gold = new T.MeshToonMaterial({ color: 0xf2c230, gradientMap: grad() });
      crown = new T.Group(); crown.position.set(0, 1.25, 0); head.add(crown);
      crown.add(new T.Mesh(new T.CylinderGeometry(0.42, 0.42, 0.16, 18), gold));
      for (let i = 0; i < 5; i++) {
        const a = i / 5 * Math.PI * 2;
        const c = new T.Mesh(new T.ConeGeometry(0.12, 0.3, 8), gold);
        c.position.set(Math.cos(a) * 0.36, 0.2, Math.sin(a) * 0.36);
        crown.add(c);
      }
    }
    return { root, update, setCrown };
  }

  // Menü portresi: 3D modelden çizilir (kesim hatası olmaz, oyundaki karakterin aynısı).
  let PR = null;
  function portrait(kind, pose, hx) {
    if (!PR) {
      const r = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      r.setPixelRatio(1); r.setSize(400, 600); r.setClearColor(0, 0);
      const sc = new T.Scene();
      const cam = new T.PerspectiveCamera(22, 400 / 600, 0.1, 100); cam.position.set(0, 0.9, 6.2); cam.lookAt(0, 0.78, 0);
      sc.add(new T.HemisphereLight(0xffffff, 0x8a90a8, 0.78));
      const dl = new T.DirectionalLight(0xffffff, 0.7); dl.position.set(2.5, 4, 5); sc.add(dl);
      PR = { r, sc, cam };
    }
    const o = hero(T, kind, hx);
    const P = { front: [Math.PI - 0.3, { idle: true }, 5], wave: [Math.PI - 0.3, { cheer: true }, 0.55], back1: [0.25, { idle: true }, 5] }[pose] || [Math.PI - 0.3, { idle: true }, 5];
    o.root.rotation.y = P[0];
    PR.sc.add(o.root);
    for (let n = 0; n < Math.round(P[2] / 0.05); n++) o.update(0.05, P[1]);
    PR.r.render(PR.sc, PR.cam);
    PR.sc.remove(o.root);
    // boş kenarları kırp
    const src = PR.r.domElement;
    const c = document.createElement('canvas'); c.width = 400; c.height = 600;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(src, 0, 0);
    const px = x.getImageData(0, 0, 400, 600).data;
    let x0 = 400, y0 = 600, x1 = 0, y1 = 0;
    for (let y = 0; y < 600; y += 2) for (let xx = 0; xx < 400; xx += 2) if (px[(y * 400 + xx) * 4 + 3] > 8) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 <= x0) return src.toDataURL('image/png');
    const out = document.createElement('canvas'); out.width = x1 - x0 + 4; out.height = y1 - y0 + 4;
    out.getContext('2d').drawImage(c, x0 - 2, y0 - 2, out.width, out.height, 0, 0, out.width, out.height);
    return out.toDataURL('image/webp', 0.92);
  }

  CZ.kk = { load, ready, hero, zibo, portrait };
})();
