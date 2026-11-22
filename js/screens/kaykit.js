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
          // elde tutulan silahlar (KayKit asa / değnek / tatar yayı)
          const getW = f => new Promise(ok => L.load('assets/3d/w/' + f + '.gltf', g => ok(g.scene), undefined, () => ok(null)));
          const wp = Promise.all(['staff', 'wand', 'crossbow_1handed'].map(getW)).then(ws => { WEAP.staff = ws[0]; WEAP.wand = ws[1]; WEAP.crossbow = ws[2]; });
          // Mixamo: gerçek iskelet + profesyonel hareketler (yoksa KayKit'e düşer)
          const getM = f => new Promise(ok => L.load('assets/3d/mx/' + f + '.glb', g => ok(g), undefined, () => ok(null)));
          MX_GET = getM;
          const d = (CZ.state && CZ.state.data) || {};
          const first = ['zibo', 'goblin', 'chief', 'mila', d.avatar || 'girl'];
          try { const b = CZ.heroes && CZ.heroes.buddy && CZ.heroes.buddy(); if (b) first.push('hero_' + b); } catch (e) { }
          const mp = getM('anims').then(a => {
            if (!a) return;
            MXC = {}; a.animations.forEach(c => { MXC[c.name] = c; });
            return needMX(first);
          });
          return Promise.all([wp, mp]);
        });
      });
    P.catch(() => { P = null; });
    return P;
  }
  const ready = () => !!clips;
  // Mixamo'lu karakterler (assets/3d/mx/<ad>.glb). Açılışta yalnız gerekenler iner, diğerleri needMX ile.
  const MX_ALL = ['zibo', 'goblin', 'chief', 'girl', 'boy', 'santa', 'elf', 'snowkid', 'reindeer', 'knight', 'mila', 'hero_buzbas', 'hero_demir', 'hero_noel', 'hero_mila', 'hero_ela', 'hero_rudi'];
  const MX_FILE = { hero_mila: 'mila' };
  const MXB = {}, MXP = {};
  let MXC = null, MX_GET = null;
  const hasMX = k => !!(MXC && MXB[k]);
  function needMX(keys) {
    if (!MX_GET) return Promise.resolve();
    return Promise.all(keys.filter(k => MX_ALL.includes(k)).map(k => MXP[k] || (MXP[k] = MX_GET(MX_FILE[k] || k).then(g => { if (g) MXB[k] = g.scene; }))));
  }
  // KayKit klip adlarını Mixamo kliplerine çevirir; kalça yüksekliği karaktere göre ölçeklenir
  const MXCL = {};
  function mxGuess(n) {
    if (MXC[n]) return n;
    if (MX_MAP[n] && MXC[MX_MAP[n]]) return MX_MAP[n];
    if (/Dodge/.test(n) && MXC.dodgeR) return /Left/.test(n) ? (MXC.dodgeL ? 'dodgeL' : 'dodgeR') : 'dodgeR';
    if (/Jump/.test(n) && MXC.jump) return 'jump';
    if (/Sit/.test(n) && MXC.sit) return 'sit';
    return /Run|Jump|Dodge/.test(n) ? 'run' : /Walk/.test(n) ? 'walk' : /Death|Lie/.test(n) ? 'die' : /Hit/.test(n) ? 'hit' : /Cheer|Victory|Win/.test(n) ? 'win' : /Throw|Shoot|Spell|Attack|Melee|Chop|Slice|Stab|Block|Punch/.test(n) ? 'throw' : 'idle';
  }
  function mxClips(k) {
    if (MXCL[k]) return MXCL[k];
    const hips = MXB[k].getObjectByName('mixamorigHips'), hy = hips ? hips.position.y : 1;
    const cache = {};
    const get = n => {
      const m = mxGuess(n);
      if (!cache[m]) {
        const c = MXC[m].clone();
        c.tracks.forEach(t => { if (/Hips\.position$/.test(t.name)) for (let i = 0; i < t.values.length; i++) t.values[i] *= hy; });
        cache[m] = c;
      }
      return cache[m];
    };
    return (MXCL[k] = new Proxy({}, { get: (o, n) => typeof n === 'string' ? get(n) : undefined }));
  }
  const MX_UPPER = /mixamorig(Spine1|Spine2|Neck|Head|Left(Shoulder|Arm|ForeArm|Hand)|Right(Shoulder|Arm|ForeArm|Hand))/;
  const mxPartCache = {};
  function mxPart(k, CL, name, upper) {
    const key = k + name + upper;
    if (mxPartCache[key]) return mxPartCache[key];
    const c = CL[name];
    return (mxPartCache[key] = new T.AnimationClip(key, c.duration, c.tracks.filter(tr => MX_UPPER.test(tr.name.split('.')[0]) === upper)));
  }
  // KayKit klip adı -> Mixamo klip adı
  const MX_MAP = { Idle: 'idle', Running_A: 'run', Running_B: 'run', Walking_A: 'walk', Hit_A: 'hit', Hit_B: 'hit', Jump_Idle: 'jump', Jump_Full_Short: 'jump', Throw: 'throw', Cheer: 'win', Death_A: 'die', Death_B: 'die', Sit_Floor_Down: 'sit', Dodge_Left: 'dodgeL', Dodge_Right: 'dodgeR', Roll: 'roll' };
  const WEAP = {};

  /* ---------- Silahlar: elde gerçekten tutulur ---------- */
  // atış türü: throw (kartopu/buz topu: kol savrulur), shoot (sapan/şeker tabancası), cast (asa)
  const WEAPON_STYLE = { snowball: 'throw', ice: 'throw', sling: 'shoot', candy: 'shoot', staff: 'cast', thunder: 'cast' };
  function makeWeapon(id) {
    const g = new T.Group();
    const m = c => KTM({ color: c, gradientMap: grad() });
    const add = (geo, mat, p, r, sc) => { const o = new T.Mesh(geo, mat); if (p) o.position.set(p[0], p[1], p[2]); if (r) o.rotation.set(r[0], r[1], r[2]); if (sc) o.scale.set(sc[0], sc[1], sc[2]); g.add(o); return o; };
    const cloneW = (k, tint, glow) => {
      if (!WEAP[k]) return null;
      const o = WEAP[k].clone(true);
      o.traverse(x => { if (x.isMesh) { x.material = KTM({ map: x.material.map, color: tint || 0xffffff, gradientMap: grad() }); if (x.material.map) x.material.map.encoding = T.LinearEncoding; } });
      g.add(o);
      if (glow) {
        const bb = new T.Box3().setFromObject(o);
        const b = add(new T.SphereGeometry(0.14, 14, 10), new T.MeshBasicMaterial({ color: glow, transparent: true, opacity: 0.85 }), [(bb.min.x + bb.max.x) / 2, bb.max.y, (bb.min.z + bb.max.z) / 2]);
        b.userData.glow = true;
      }
      return o;
    };
    if (id === 'snowball') add(new T.SphereGeometry(0.22, 14, 10), m(0xeaf6ff), [0, 0.1, 0.06]);
    else if (id === 'ice') { add(new T.SphereGeometry(0.2, 14, 10), new T.MeshBasicMaterial({ color: 0x9fe0ff, transparent: true, opacity: 0.9 }), [0, 0.1, 0.05]); add(new T.SphereGeometry(0.12, 10, 8), m(0xffffff), [0.05, 0.14, 0.1]); }
    else if (id === 'sling') {
      const wood = m(0x8a5228), band = m(0xd23a32);
      const cyl = new T.CylinderGeometry(0.035, 0.04, 1, 8);
      add(cyl, wood, [0, 0.12, 0], null, [1, 0.3, 1]);
      add(cyl, wood, [-0.08, 0.36, 0], [0, 0, 0.45], [1, 0.26, 1]);
      add(cyl, wood, [0.08, 0.36, 0], [0, 0, -0.45], [1, 0.26, 1]);
      add(new T.TorusGeometry(0.1, 0.018, 6, 12, Math.PI), band, [0, 0.47, 0], [0, 0, Math.PI]);
    } else if (id === 'candy') {
      // şeker kamışı tabancası: kırmızı-beyaz çizgili gövde
      const c = document.createElement('canvas'); c.width = 8; c.height = 64;
      const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 8, 64); x.fillStyle = '#e0302e';
      for (let i = 0; i < 64; i += 16) x.fillRect(0, i, 8, 8);
      const tx = new T.CanvasTexture(c); tx.wrapS = tx.wrapT = T.RepeatWrapping; tx.magFilter = T.NearestFilter;
      const mat = KTM({ map: tx, gradientMap: grad() });
      add(new T.CylinderGeometry(0.07, 0.07, 0.7, 12), mat, [0, 0.2, 0.25], [Math.PI / 2, 0, 0]);
      add(new T.TorusGeometry(0.14, 0.07, 8, 14, Math.PI), mat, [0, 0.2, -0.15], [0, Math.PI / 2, 0]);
      add(new T.CylinderGeometry(0.05, 0.05, 0.25, 8), m(0x8a5228), [0, 0.02, 0.05]);
    } else if (id === 'staff') cloneW('staff', 0xcfe9ff, 0x9fe0ff);
    else if (id === 'thunder') cloneW('wand', 0xffd84a, 0xffe36e) || cloneW('staff', 0xffd84a, 0xffe36e);
    return g;
  }

  // Üst gövde katmanı: koşarken bacaklar koşmaya devam eder, yalnız kollar atar.
  const UPPER = /^(chest|upperarm|lowerarm|wrist|hand|handslot|head|neck)/;
  const clipCache = {};
  function part(name, upper) {
    const k = name + (upper ? ':u' : ':l');
    if (clipCache[k]) return clipCache[k];
    const c = clips[name];
    const tracks = c.tracks.filter(tr => UPPER.test(tr.name.split('.')[0]) === upper);
    return (clipCache[k] = new T.AnimationClip(k, c.duration, tracks));
  }

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

  const KTM = o => (CZ.style ? CZ.style.mat(o) : new T.MeshToonMaterial(o));   // (22 Kas) grafik kalitesine göre malzeme
  let GRAD = null;
  function grad() {
    if (CZ.style) return CZ.style.grad();   // oyunun ortak ışık rampası
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
    boy: { body: 'mage', head: 'knight', hide: ['Mage_Hat', 'Mage_Cape', 'Mage_Head'], paint: { knight: { '1,0': 0x5a3418 }, mage: { '1,0': 0x6b3f22, '0,1': 0x2f6fd8, '2,2': 0x44a044, '2,1': 0x44a044, '3,2': 0x2b3a5c, '7,1': 0x8a5228 } }, acc: ['beanie'] },
    snowkid: { body: 'mage', head: 'knight', hide: ['Mage_Hat', 'Mage_Cape', 'Mage_Head'], paint: { knight: { '1,0': 0x3a200e }, mage: { '1,0': 0x6b3f22, '0,1': 0xf4f6fb, '4,0': 0xf4f6fb, '3,0': 0x1d1d26, '2,2': 0xd23a32, '5,0': 0xd23a32, '3,2': 0xf4f6fb, '7,1': 0x1d1d26 } }, acc: ['topHat', 'carrot'] },
    reindeer: { body: 'barbarian', head: 'knight', hide: ['Barbarian_Head', 'Barbarian_Cape'], paint: { barbarian: { '7,0': 0x8a5230, '2,1': 0xf2dcc0, '0,1': 0x8a5230, '1,1': 0xa0643a, '6,0': 0x6a3c20, '3,2': 0x8a5230, '7,1': 0x4a2c1a, '7,2': 0xf2dcc0 }, knight: { '1,0': 0x6a3c20 } }, acc: ['antlers', 'nose'] }
  };
  CZ.KK_LOOKS = LOOKS;

  function toonize(root, paints, keyBase) {
    root.traverse(o => {
      if (!o.isMesh) return;
      const m = o.material;
      const model = o.userData.kkModel;
      const map = m.map ? paint(m.map, paints[model], keyBase + ':' + model) : null;
      if (map) map.encoding = T.LinearEncoding;   // oyun doğrusal çıktı kullanıyor: renkler olduğu gibi
      o.material = KTM({ map, color: map ? 0xffffff : m.color, gradientMap: grad(), transparent: false });
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
    const m = c => KTM({ color: c, gradientMap: grad() });
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
        add(head, tor, white, [0, 0.9, 0], [Math.PI / 2, 0, 0], [0.5, 0.5, 0.38]);
        add(head, cone, red, [0, 1.2, -0.1], [-0.5, 0, 0], [0.42, 0.6, 0.42]);
        add(head, sph, white, [0, 1.43, -0.3], null, [0.1, 0.1, 0.1]);
      } else if (a === 'santaHatZibo') {
        add(head, tor, white, [0, 0.88, 0], [Math.PI / 2 - 0.15, 0, 0], [0.42, 0.42, 0.32]);
        add(head, cone, red, [0, 1.14, -0.1], [-0.55, 0, 0.15], [0.36, 0.55, 0.36]);
        add(head, sph, white, [0.08, 1.36, -0.32], null, [0.09, 0.09, 0.09]);
      } else if (a === 'beanie') {
        const hc = mat.hat ? m(mat.hat) : red;
        add(head, sph, hc, [0, 0.88, 0.02], null, [0.47, 0.36, 0.5]);
        add(head, tor, hc, [0, 0.8, 0.02], [Math.PI / 2, 0, 0], [0.45, 0.47, 0.3]);
        add(head, sph, white, [0, 1.24, 0.02], null, [0.1, 0.1, 0.1]);
      } else if (a === 'hardHat') {
        const hc = m(mat.hat || 0xf2c230);
        add(head, sph, hc, [0, 0.95, 0], null, [0.58, 0.42, 0.6]);
        add(head, cyl, hc, [0, 0.86, 0.06], null, [0.68, 0.04, 0.72]);
        add(head, cyl, hc, [0, 1.05, 0], null, [0.08, 0.38, 0.62]);
      } else if (a === 'lamp') {
        add(head, cyl, gold, [0, 1.0, 0.56], [Math.PI / 2, 0, 0], [0.13, 0.12, 0.13]);
        add(head, sph, new G.MeshBasicMaterial({ color: 0xfff6c0 }), [0, 1.0, 0.63], null, [0.1, 0.1, 0.04]);
      } else if (a === 'chefHat') {
        add(head, cyl, white, [0, 1.08, 0], null, [0.5, 0.3, 0.5]);
        add(head, sph, white, [0, 1.42, 0], null, [0.64, 0.38, 0.64]);
      } else if (a === 'featherHat') {
        const hc = m(mat.hat || 0x2e6a3a);
        add(head, cyl, hc, [0, 0.95, 0], null, [0.78, 0.04, 0.78]);
        add(head, cone, hc, [0, 1.22, 0], null, [0.48, 0.55, 0.48]);
        add(head, sph, red, [0.32, 1.32, -0.18], [0, 0, -0.6], [0.06, 0.38, 0.06]);
      } else if (a === 'bandana') {
        const hc = m(mat.hat || 0xd23a32);
        add(head, sph, hc, [0, 0.93, -0.02], null, [0.57, 0.3, 0.59]);
        add(head, sph, hc, [0, 0.85, -0.56], null, [0.13, 0.13, 0.13]);
        add(head, sph, hc, [0.08, 0.68, -0.6], [0.3, 0, 0.3], [0.07, 0.2, 0.05]);
      } else if (a === 'cap') {
        const hc = m(mat.hat || 0x1565c0);
        add(head, sph, hc, [0, 0.95, 0], null, [0.57, 0.32, 0.58]);
        add(head, cyl, hc, [0, 0.9, 0.5], null, [0.34, 0.035, 0.28]);
      } else if (a === 'ponytail') {
        const hm = m(mat.hair || 0x5a3418);
        add(head, sph, hm, [0, 0.92, -0.55], null, [0.18, 0.18, 0.18]);
        add(head, sph, hm, [0, 0.58, -0.7], [0.3, 0, 0], [0.17, 0.4, 0.17]);
      } else if (a === 'bun') {
        add(head, sph, m(mat.hair || 0x5a3418), [0, 1.0, -0.42], null, [0.27, 0.25, 0.27]);
      } else if (a === 'braids') {
        const hm = m(mat.hair || 0x5a3418);
        [-1, 1].forEach(sd => { add(head, sph, hm, [sd * 0.46, 0.3, -0.12], null, [0.12, 0.42, 0.12]); add(head, sph, red, [sd * 0.46, -0.1, -0.12], null, [0.08, 0.06, 0.08]); });
      } else if (a === 'longHair') {
        add(head, sph, m(mat.hair || 0x5a3418), [0, 0.5, -0.3], null, [0.56, 0.68, 0.42]);
      } else if (a === 'beard') {
        const hm = m(mat.hair || 0x5a3418);
        add(head, sph, hm, [0, 0.02, 0.4], null, [0.34, 0.22, 0.2]);
        [-1, 1].forEach(sd => add(head, sph, hm, [sd * 0.34, 0.2, 0.36], null, [0.1, 0.2, 0.12]));
      } else if (a === 'mustache') {
        [-1, 1].forEach(sd => add(head, sph, m(mat.hair || 0x3a200e), [sd * 0.12, 0.13, 0.5], [0, 0, sd * 0.3], [0.14, 0.055, 0.07]));
      } else if (a === 'flowerCrown') {
        add(head, tor, m(0x3a8a3a), [0, 0.86, 0], [Math.PI / 2, 0, 0], [0.56, 0.56, 0.25]);
        [0xf07aa8, 0xffffff, 0xf2c230, 0xb45aff, 0xf07aa8, 0xffffff].forEach((c, i) => { const a2 = i / 6 * Math.PI * 2; add(head, sph, m(c), [Math.sin(a2) * 0.56, 0.88, Math.cos(a2) * 0.56], null, [0.09, 0.09, 0.09]); });
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
      } else if (a === 'goblinFace') {
        // Zibo'nun yüzü: kocaman parlak gözler, çatık kaşlar, sivri burun, sinsi sırıtış
        const eyeW = m(0xfffbe8), pupil = m(0x15121a), skinD = mat.skin, mouthM = m(0x4a1018), tooth = m(0xfffbe8), brow = m(0x23401a);
        [-1, 1].forEach(sd => {
          add(head, sph, eyeW, [sd * 0.2, 0.5, 0.45], null, [0.17, 0.21, 0.12]);
          add(head, sph, pupil, [sd * 0.17, 0.5, 0.56], null, [0.08, 0.1, 0.04]);
          add(head, sph, eyeW, [sd * 0.14 + 0.03, 0.54, 0.59], null, [0.027, 0.027, 0.01]);
          add(head, sph, brow, [sd * 0.21, 0.73, 0.5], [0, 0, sd * 0.38], [0.17, 0.045, 0.06]);
        });
        add(head, cone, skinD, [0, 0.38, 0.66], [Math.PI / 2 - 0.35, 0, 0], [0.085, 0.3, 0.085]);
        const smile = new G.Mesh(new G.TorusGeometry(0.2, 0.05, 8, 18, Math.PI), mouthM);
        smile.position.set(0, 0.27, 0.5); smile.rotation.set(-0.2, 0, Math.PI); smile.scale.set(1.15, 0.7, 1); head.add(smile);
        [-0.12, 0.12].forEach(x => add(head, cone, tooth, [x, 0.215, 0.53], [Math.PI, 0, 0], [0.032, 0.065, 0.032]));
      } else if (a === 'sack') {
        add(chest, sph, m(0xc8a060), [0.12, 0.2, -0.5], null, [0.34, 0.4, 0.3]);
        add(chest, tor, m(0x7a4a24), [0.12, 0.58, -0.5], [Math.PI / 2, 0, 0], [0.12, 0.12, 0.25]);
        [[0.02, 0.64], [0.16, 0.68], [0.26, 0.6]].forEach(([x, y]) => add(chest, cyl, gold, [x, y, -0.5], [0.4, 0, 0.3], [0.09, 0.025, 0.09]));
      }
    });
  }

  /* ---------- Animasyon sürücüsü ---------- */
  function rig(root, set, map) {
    const mixer = new T.AnimationMixer(root);
    const acts = {};
    const CS = set || clips;
    const act = n => {
      if (map && map[n]) n = map[n];
      if (!acts[n]) { acts[n] = mixer.clipAction(CS[n]); }
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

  /* ---------- YAPAY ZEKÂ MODELİNİ KAYKIT İSKELETİNE BAĞLA ---------- */
  // T-pozunda üretilen tek parça modeli KayKit iskeletinin kutusuna oturtur, her köşeye bölgesine göre
  // (kafa / gövde / kol / bacak) kemik ağırlığı verir. Böylece KayKit'in 29 hazır animasyonu bu modelle oynar.
  CZ.KK_GEN = {};   // KAPALI (Bora: kollar bozuk). Hazır eşleme: girl v_girl, boy v_boy, santa v_santa, elf v_elf, snowkid v_snowkid, reindeer v_reindeer, knight v_knight, mila v_mila, goblin v_goblin, chief v_chief, zibo v_zibo, hero_* v_rudi/v_hela/v_buzbas/v_demir/v_noel/v_mila — Mixamo ile düzgün iskelet gelince açılacak
  const GEN_SKIN = {};
  // Gardıroptan alınan mont / bere / atkı renkleri yapay zekâ modelinin köşe renklerine de uygulanır (2D çizimlerdeki kuralların aynısı)
  function recolor(geo, kind) {
    const colors = CZ.charArt ? CZ.charArt.colorsOf(kind) : {}, rules = [];
    ['jacket', 'hat', 'scarf'].forEach(p2 => { const tg = colors[p2] && CZ.PART_ORIG[kind] && colors[p2] !== CZ.PART_ORIG[kind][p2] ? CZ.COLORS[colors[p2]] : null; const r = (CZ.PART_RULES[kind] || {})[p2]; if (tg && r) rules.push({ r, t: tg }); });
    if (!rules.length || !geo.attributes.color) return;
    const c = geo.attributes.color, pos = geo.attributes.position, col = new T.Color(), hsl = {};
    let y0 = Infinity, y1 = -Infinity; for (let i = 0; i < pos.count; i++) { y0 = Math.min(y0, pos.getY(i)); y1 = Math.max(y1, pos.getY(i)); }
    for (let i = 0; i < c.count; i++) {
      col.setRGB(c.getX(i), c.getY(i), c.getZ(i)); col.getHSL(hsl); const h = hsl.h * 360, yt = 1 - (pos.getY(i) - y0) / (y1 - y0);
      for (const { r, t } of rules) { const [lo, hi] = r.hue; const inH = lo <= hi ? h >= lo && h <= hi : h >= lo || h <= hi;
        if (!inH || hsl.s < (r.smin || 0) || hsl.s > (r.smax || 1) || hsl.l < (r.lmin || 0) || hsl.l > (r.lmax || 1) || yt < (r.y0 || 0) || yt > (r.y1 || 1)) continue;
        col.setHSL(t.h / 360, Math.min(1, Math.max(0, hsl.s * (t.sk || 1) + (t.sa || 0))), Math.min(1, Math.max(0, hsl.l * (t.lk || 1) + (t.la || 0)))); c.setXYZ(i, col.r, col.g, col.b); break; }
    }
    c.needsUpdate = true;
  }
  const TEXC = {};
  function recolorMap(map, kind) {
    const colors = CZ.charArt ? CZ.charArt.colorsOf(kind) : {}, rules = [];
    ['jacket', 'hat', 'scarf'].forEach(p2 => { const tg = colors[p2] && CZ.PART_ORIG[kind] && colors[p2] !== CZ.PART_ORIG[kind][p2] ? CZ.COLORS[colors[p2]] : null; const r = (CZ.PART_RULES[kind] || {})[p2]; if (tg && r) rules.push({ r, t: tg }); });
    if (!rules.length || !map.image) return map;
    const k = kind + JSON.stringify(colors); if (TEXC[k]) return TEXC[k];
    const im = map.image, c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0);
    const d2 = x.getImageData(0, 0, c.width, c.height), px = d2.data, col = new T.Color(), hsl = {};
    for (let i = 0; i < px.length; i += 4) { col.setRGB(px[i] / 255, px[i + 1] / 255, px[i + 2] / 255); col.getHSL(hsl); const h = hsl.h * 360, yt = Math.floor(i / 4 / c.width) / c.height;
      for (const { r, t } of rules) { const [lo, hi] = r.hue; const inH = lo <= hi ? h >= lo && h <= hi : h >= lo || h <= hi;
        if (!inH || hsl.s < (r.smin || 0) || hsl.s > (r.smax || 1) || hsl.l < (r.lmin || 0) || hsl.l > (r.lmax || 1) || yt < (r.y0 || 0) || yt > (r.y1 || 1)) continue;
        col.setHSL(t.h / 360, Math.min(1, Math.max(0, hsl.s * (t.sk || 1) + (t.sa || 0))), Math.min(1, Math.max(0, hsl.l * (t.lk || 1) + (t.la || 0)))); px[i] = col.r * 255; px[i + 1] = col.g * 255; px[i + 2] = col.b * 255; break; } }
    x.putImageData(d2, 0, 0); const tx = new T.CanvasTexture(c); tx.encoding = T.LinearEncoding; tx.flipY = map.flipY; return (TEXC[k] = tx);
  }
  function skinGen(model, id, kind) {
    const parts = []; model.traverse(o => { if (o.isSkinnedMesh) parts.push(o); });
    const body = parts.find(o => /Body/.test(o.name)) || parts[0]; if (!body) return false;
    model.updateMatrixWorld(true);
    const sk = body.skeleton, B = n => sk.bones.find(b => b.name === n);
    const P = {}; sk.bones.forEach(b => { P[b.name] = new T.Vector3().setFromMatrixPosition(b.matrixWorld); });
    const ck = id + '|' + JSON.stringify(CZ.charArt ? CZ.charArt.colorsOf(kind) : {});
    let geo = GEN_SKIN[ck];
    if (!geo) {
      const box = new T.Box3(); parts.forEach(o => { if (!o.visible) return; o.geometry.computeBoundingBox(); box.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld)); });
      geo = CZ.gen3d.geo(id); geo.computeBoundingBox(); const gb = geo.boundingBox;
      const sy = (box.max.y - box.min.y) / (gb.max.y - gb.min.y), sx = sy, sz = sy;   // boya göre eşit ölçek: karakter basıklaşmasın
      const cx = (box.min.x + box.max.x) / 2, cz = (box.min.z + box.max.z) / 2, gcx = (gb.min.x + gb.max.x) / 2, gcz = (gb.min.z + gb.max.z) / 2;
      const pos = geo.attributes.position, n = pos.count, H = box.max.y - box.min.y;
      for (let i = 0; i < n; i++) pos.setXYZ(i, (pos.getX(i) - gcx) * sx + cx, (pos.getY(i) - gb.min.y) * sy + box.min.y, (pos.getZ(i) - gcz) * sz + cz);
      // bölgeler ve kemik zincirleri
      const L = P.upperarml.x < 0 ? 'l' : 'r', sideOf = x => (x < 0) === (L === 'l') ? 'l' : 'r';
      const armY = P.upperarml.y, headY = P.head.y, legY = P.upperlegl.y, ax0 = Math.abs(P.upperarml.x), ax1 = Math.abs(P.lowerarml.x);
      const armX = ax0 + (ax1 - ax0) * 0.35, band = H * 0.16;
      const top = new T.Vector3(P.head.x, box.max.y, P.head.z);
      const segs = { hips: [P.hips, P.spine], spine: [P.spine, P.chest], chest: [P.chest, P.head], head: [P.head, top] };
      ['l', 'r'].forEach(sd => { segs['upperarm' + sd] = [P['upperarm' + sd], P['lowerarm' + sd]]; segs['lowerarm' + sd] = [P['lowerarm' + sd], P['wrist' + sd]]; segs['wrist' + sd] = [P['wrist' + sd], P['hand' + sd]]; segs['hand' + sd] = [P['hand' + sd], P['handslot' + sd]];
        segs['upperleg' + sd] = [P['upperleg' + sd], P['lowerleg' + sd]]; segs['lowerleg' + sd] = [P['lowerleg' + sd], P['foot' + sd]]; segs['foot' + sd] = [P['foot' + sd], P['toes' + sd]]; segs['toes' + sd] = [P['toes' + sd], P['toes' + sd].clone().add(new T.Vector3(0, 0, P['toes' + sd].z - P['foot' + sd].z))]; });
      const dSeg = (v, [a, b]) => { const ab = b.clone().sub(a), t = Math.max(0, Math.min(1, v.clone().sub(a).dot(ab) / Math.max(1e-6, ab.lengthSq()))); return v.distanceTo(a.clone().addScaledVector(ab, t)); };
      const si = new Uint16Array(n * 4), sw = new Float32Array(n * 4), v = new T.Vector3();
      let headHalf = 0; { const yh = P.head.y + (box.max.y - P.head.y) * 0.3; for (let i = 0; i < n; i++) if (pos.getY(i) > yh) headHalf = Math.max(headHalf, Math.abs(pos.getX(i) - cx)); }   // kafanın (şapka/kapüşon dahil) yarı genişliği
      const RAD = { head: (box.max.y - P.head.y) * 0.42, chest: H * 0.1, spine: H * 0.1, hips: H * 0.09 };
      for (let i = 0; i < n; i++) {
        v.fromBufferAttribute(pos, i); const sd = sideOf(v.x); let cand;
        if (v.y < legY && Math.abs(v.x) < armX) cand = ['hips', 'upperleg' + sd, 'lowerleg' + sd, 'foot' + sd, 'toes' + sd];
        else if (Math.abs(v.x) > (v.y > P.head.y ? Math.max(ax1, headHalf * 1.08) : ax1) && v.y > armY - band) cand = ['upperarm' + sd, 'lowerarm' + sd, 'wrist' + sd, 'hand' + sd];   // gövdeden uzakta: yalnız kol (el diken diken gerilmesin)
        else cand = ['head', 'chest', 'spine', 'hips', 'upperarm' + sd, 'lowerarm' + sd, 'wrist' + sd, 'hand' + sd];
        // en yakın kemik; kafa ve gövde kalın (yarıçap), kollar ince: kalkık eller kafaya yapışmasın
        const sc = cand.map(nm => [nm, Math.max(0, dSeg(v, segs[nm]) - (RAD[nm] || H * 0.04))]).sort((a, b) => a[1] - b[1]);
        let ws = sc.slice(0, 2).map(([nm, d2]) => [nm, 1 / Math.pow(d2 + H * 0.03, 4)]);
        if (sc[0][0] === 'head' && sc[0][1] === 0) ws = [['head', 1]];   // kafa sert dursun
        const tot = ws.reduce((s2, w) => s2 + w[1], 0);
        ws.forEach((w, k) => { si[i * 4 + k] = sk.bones.indexOf(B(w[0])); sw[i * 4 + k] = w[1] / tot; });
      }
      geo.setAttribute('skinIndex', new T.Uint16BufferAttribute(si, 4)); geo.setAttribute('skinWeight', new T.Float32BufferAttribute(sw, 4));
      geo.applyMatrix4(new T.Matrix4().copy(body.matrixWorld).invert());   // gövde parçasının kendi uzayına
      if (CZ.gen3d.map(id)) CZ.gen3d.smooth(geo); else geo.computeVertexNormals();
      recolor(geo, kind); GEN_SKIN[ck] = geo;
    }
    const mp0 = CZ.gen3d.map(id), mp = mp0 ? recolorMap(mp0, kind) : null, mesh = new T.SkinnedMesh(geo, CZ.style.mat(mp ? { map: mp } : { vertexColors: true }));
    mesh.name = 'GenBody'; mesh.position.copy(body.position); mesh.quaternion.copy(body.quaternion); mesh.scale.copy(body.scale);
    body.parent.add(mesh); mesh.bind(sk, body.bindMatrix);
    model.traverse(o => { if (o.isMesh && o !== mesh) o.visible = false; });   // eski KayKit parçaları (şapka, kafa vb.) gizlenir
    mesh.castShadow = true; mesh.frustumCulled = false;
    return true;
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
    const MXK = hasMX(kind) ? kind : null;
    const CL = MXK ? mxClips(MXK) : clips;
    const partX = MXK ? (n, u) => mxPart(MXK, CL, n, u) : part;
    let model;
    if (MXK) {
      model = mxModel(MXK).model;
      if (hx.jacket && !/^hero_|goblin|chief|mila/.test(kind)) model.traverse(o => { if (o.isMesh) o.material.color.lerp(new T.Color(hx.jacket), 0.18); });
    } else {
      model = T.SkeletonUtils.clone(base[L.body]);
      tagModel(model, L.body);
      if (L.head) borrowHead(model, L.head, { mage: 'Mage_Head', knight: 'Knight_Head', rogue: 'Rogue_Head', barbarian: 'Barbarian_Head' }[L.head] || L.head);
      (L.hide || []).forEach(n => { const o = model.getObjectByName(n); if (o) o.visible = false; });
      const gid = CZ.KK_GEN[kind], genOk = gid && CZ.gen3d && CZ.gen3d.has(gid) && skinGen(model, gid, kind);
      if (!genOk) { toonize(model, L.paint || {}, kind + JSON.stringify(hx)); accessories(model, L.acc || [], { hat: hx.hatColor || L.hat, hair: L.hair }); }
      if (L.scale) model.scale.set(model.scale.x * L.scale[0], model.scale.y * L.scale[1], model.scale.z * L.scale[2]);
    }
    const root = new T.Group();
    const holder = new T.Group();
    holder.rotation.y = Math.PI;      // kameraya sırtı dönük koşsun
    holder.scale.setScalar(0.5);
    holder.add(model);
    // takla ekseni: göbek hizası (yuvarlanırken yerinde döner)
    const spin = new T.Group(); spin.position.y = 0.42; holder.position.y = -0.42;
    spin.add(holder);
    root.add(spin);
    const R = rig(model, CL);
    // Silah yuvası: sağ elde
    const weaponSlot = new T.Group();
    const hand = model.getObjectByName('handslotr') || model.getObjectByName('handr') || model.getObjectByName('mixamorigRightHand') || model.getObjectByName('head') || model;
    hand.add(weaponSlot);
    if (MXK) { root.updateMatrixWorld(true); const ws = new T.Vector3(); hand.getWorldScale(ws); weaponSlot.scale.setScalar(1 / (ws.x || 1)); weaponSlot.position.set(0, 0.08 / (ws.x * 2 || 1), 0); }
    else weaponSlot.scale.setScalar(1 / 0.5);

    const st = { mode: '', wasJump: false, wasSlide: false, side: 0, dodgeT: 0 };
    function update(dt, info) {
      let want = 'run';
      if (info.dead) want = 'dead';
      else if (info.sit) want = 'sit';
      else if (info.cheer) want = 'cheer';
      else if (info.idle) want = 'idle';
      else if (info.sliding) want = 'roll';
      else if (info.jumping) want = 'jump';
      const lean = info.lean || 0;
      const side = lean > 0.35 ? 1 : lean < -0.35 ? -1 : 0;
      if (want === 'run' && side && side !== st.side) { st.dodgeT = 0.28; st.dodgeDir = side; if (MXK) dodgeNow(side > 0 ? 'Dodge_Right' : 'Dodge_Left'); }
      st.side = side;
      st.dodgeT -= dt;
      if (want === 'run' && st.dodgeT > 0 && !MXK) want = st.dodgeDir > 0 ? 'dodgeR' : 'dodgeL';
      if (want !== st.mode) {
        const prev = st.mode;
        st.mode = want;
        if (want === 'run') R.play('Running_A', { speed: 1.25, fade: prev === 'roll' ? 0.08 : 0.15 });
        else if (want === 'jump') { const c = CL.Jump_Full_Short; R.play('Jump_Full_Short', { once: true, speed: c.duration / 0.8, fade: 0.06 }); }
        else if (want === 'roll') {
          if (MXK && MXC.roll) { const c = CL.Roll; R.play('Roll', { once: true, speed: c.duration / 0.62, fade: 0.05 }); st.rollT = -99; }
          else { const a = R.play('Jump_Idle', { fade: 0.05 }); a.timeScale = 0; a.time = 0.1; st.rollT = 0; }
        }
        else if (want === 'sit') { const a = R.play('Sit_Floor_Down', { once: true, fade: 0.2 }); a.timeScale = 0; a.time = CL.Sit_Floor_Down.duration - 0.01; }
        else if (want === 'dodgeL') R.play('Dodge_Left', { once: true, speed: 2.2, fade: 0.06 });
        else if (want === 'dodgeR') R.play('Dodge_Right', { once: true, speed: 2.2, fade: 0.06 });
        else if (want === 'dead') R.play('Death_A', { once: true, fade: 0.1 });
        else if (want === 'cheer') R.play('Cheer', { fade: 0.2 });
        else R.play('Idle', { fade: 0.25 });
      }
      if (want === 'run') { const a = R.cur; if (a) a.timeScale = 0.9 + Math.min(0.8, (info.speed || 14) / 40); }
      // Kayma: yere oturup bacaklar önde kayar (Subway Surfers gibi), poz hızla oturur ve kayarken kalır
      // TAKLA: toplanıp öne bir tam tur döner (Subway Surfers gibi), sonra eğik kalır
      if (want === 'roll' && st.rollT > -50) {
        st.rollT = (st.rollT || 0) + dt;
        const k = Math.min(1, st.rollT / 0.42);
        const e = k < 1 ? (1 - Math.cos(k * Math.PI)) / 2 : 1;
        spin.rotation.x = -e * Math.PI * 2;
        spin.position.y = 0.42 - Math.sin(k * Math.PI) * 0.12 - 0.1;
        spin.scale.set(1, 0.82, 1);
      } else {
        spin.rotation.x *= 0.5; if (Math.abs(spin.rotation.x) < 0.01) spin.rotation.x = 0;
        spin.position.y += (0.42 - spin.position.y) * Math.min(1, dt * 14);
        spin.scale.y += (1 - spin.scale.y) * Math.min(1, dt * 14);
      }
      R.mixer.update(dt);
    }
    const mats = [];
    model.traverse(o => { if (o.isMesh) mats.push(o.material); });
    root.traverse(o => { if (o.isMesh && !mats.includes(o.material)) mats.push(o.material); });
    function setOpacity(o) { mats.forEach(m => { m.transparent = o < 1; m.opacity = o; }); }
    // Silah: elde gerçek 3D model
    let weapon = null, wid = 'snowball';
    function setWeapon(id) {
      wid = id || 'snowball';
      if (weapon) weaponSlot.remove(weapon);
      weapon = makeWeapon(wid);
      weapon.scale.setScalar(0.5);   // yuva dünya ölçeğinde (x2); silah model ölçeğinde
      weaponSlot.add(weapon);
    }
    // Atış: koşuyorsa yalnız üst gövde (bacaklar koşmaya devam), değilse tam beden
    const legs = R.mixer.clipAction(partX('Running_A', false));
    legs.play(); legs.setEffectiveWeight(0);
    let up = null, upT = 0;
    function throwNow() {
      const style = WEAPON_STYLE[wid] || 'throw';
      const name = style === 'cast' ? 'Spellcast_Shoot' : style === 'shoot' ? '1H_Ranged_Shoot' : 'Throw';
      const dur = style === 'throw' ? 0.42 : 0.36;
      if (up) up.stop();
      up = R.mixer.clipAction(partX(name, true));
      up.reset(); up.setLoop(T.LoopOnce); up.clampWhenFinished = true;
      up.timeScale = CL[name].duration / dur; up.play();
      upT = dur;
      // kartopu / buz topu elden çıkar, sonra yenisi belirir
      if (style === 'throw' && weapon) { weapon.visible = false; setTimeout(() => { if (weapon) weapon.visible = true; }, dur * 900); }
    }
    // Mixamo kaçınma: bacaklar koşmaya devam eder, üst gövde yana eğilir
    function dodgeNow(name) {
      if (up) up.stop();
      up = R.mixer.clipAction(partX(name, true));
      up.reset(); up.setLoop(T.LoopOnce); up.clampWhenFinished = true;
      up.timeScale = CL[name].duration / 0.34; up.play();
      upT = 0.34;
    }
    const baseUpdate = update;
    const armL = model.getObjectByName('upperarml') || model.getObjectByName('mixamorigLeftArm'), armR = model.getObjectByName('upperarmr') || model.getObjectByName('mixamorigRightArm');
    const foreL = model.getObjectByName('lowerarml') || model.getObjectByName('mixamorigLeftForeArm'), foreR = model.getObjectByName('lowerarmr') || model.getObjectByName('mixamorigRightForeArm');
    let pointK = 0, pointDir = 1, restL = null, restR = null;
    function update2(dt, info) {
      baseUpdate(dt, info);
      // durağan pozda karıştırıcı kemiği her kare yeniden yazmaz: kolu her kare dinlenme pozundan kur
      if (info.sit && armL && armR) {
        if (!restL) { restL = armL.quaternion.clone(); restR = armR.quaternion.clone(); }
        armL.quaternion.copy(restL); armR.quaternion.copy(restR);
      } else { restL = restR = null; }
      // Kızakta yön gösterme: kolu yana kaldırıp baş parmakla işaret eder
      const want = info.point || 0;
      if (want) pointDir = want;
      pointK += ((want ? 1 : 0) - pointK) * Math.min(1, dt * 12);
      if (pointK > 0.01) {
        // karakter kameraya sırtı dönük: sola gösterirken sol kol, sağa gösterirken sağ kol
        const arm = pointDir < 0 ? armL : armR, fore = pointDir < 0 ? foreL : foreR;
        if (arm) { arm.rotation.y += (pointDir < 0 ? -1.2 : 1.2) * pointK; arm.rotation.z += (pointDir < 0 ? 0.6 : -0.6) * pointK; }
        if (fore) fore.rotation.x *= 1 - pointK;
      }
      const run = R.cur === R.act('Running_A');
      if (upT > 0) upT -= dt;
      const w = upT > 0 ? 1 : 0;
      if (up) up.setEffectiveWeight(w);
      // koşu kolları susar, bacak kopyası koşuyu sürdürür (aynı zamanda)
      if (run) {
        const full = R.act('Running_A');
        legs.time = full.time; legs.timeScale = full.timeScale;
        full.setEffectiveWeight(1 - w); legs.setEffectiveWeight(w);
      } else legs.setEffectiveWeight(0);
      if (up && w === 0 && upT <= -0.2) { up.stop(); up = null; }
      if (weapon) weapon.traverse(o => { if (o.userData.glow) o.scale.setScalar(1 + Math.sin(performance.now() / 120) * 0.12); });
    }
    function pose(name, tt) {
      R.mixer.stopAllAction();
      const a = R.mixer.clipAction(CL[name]);
      a.reset(); a.setLoop(T.LoopOnce); a.clampWhenFinished = true; a.play();
      R.mixer.update(Math.min(tt, CL[name].duration - 0.001));
    }
    return { root, update: update2, weaponSlot, setOpacity, throwNow, setWeapon, pose, is3d: true, kk: true, mx: !!MXK };
  }

  /* ---------- ZİBO ---------- */
  // Mixamo'lu Zibo: Gemini çizimli dokulu model, Mixamo'nun otomatik iskeleti ve hareket kütüphanesi
  let KK_H = 0;
  function mxModel(k) {
    const model = T.SkeletonUtils.clone(MXB[k]);
    model.traverse(o => {
      if (!o.isMesh) return;
      const mp = o.material.map; if (mp) mp.encoding = T.LinearEncoding;
      o.material = KTM({ map: mp, gradientMap: grad() });
      o.frustumCulled = false;
    });
    if (!KK_H) { const b = new T.Box3().setFromObject(base.barbarian); KK_H = b.max.y - b.min.y; }
    const b = new T.Box3().setFromObject(MXB[k]);
    const s = KK_H * 0.92 / (b.max.y - b.min.y);
    model.scale.setScalar(s);
    return { model, s };
  }
  function ziboMX(tint) {
    const { model, s } = mxModel('zibo');
    if (tint) model.traverse(o => { if (o.isMesh) o.material.color.lerp(new T.Color(tint), 0.35).multiplyScalar(1.15); });
    const root = new T.Group(), holder = new T.Group();
    holder.rotation.y = Math.PI; holder.scale.setScalar(0.66);
    holder.add(model); root.add(holder);
    const R = rig(model, mxClips('zibo'));
    const head = model.getObjectByName('mixamorigHead');
    const top = model.getObjectByName('mixamorigHeadTop_End');
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
        if (want === 'run') R.play('run', { speed: 1.15 });
        else if (want === 'hit') R.play('hit', { speed: 1.2, fade: 0.08 });
        else if (want === 'jump') { const c = mxClips('zibo').Jump_Full_Short; R.play('Jump_Full_Short', { once: true, speed: c.duration / 0.8, fade: 0.08 }); }
        else if (want === 'throw') R.play('throw', { once: true, speed: 1.6, fade: 0.08 });
        else R.play('idle', { fade: 0.25 });
      }
      R.mixer.update(dt);
      const yawT = want === 'throw' ? 0 : Math.PI;
      st.yaw = st.yaw == null ? Math.PI : st.yaw + (yawT - st.yaw) * Math.min(1, dt * (want === 'throw' ? 16 : 9));
      holder.rotation.y = st.yaw;
      st.look += ((info.look ? 1 : 0) - st.look) * Math.min(1, dt * 8);
      if (head && st.look > 0.01 && want !== 'throw') head.rotation.y += st.look * 2.4;
    }
    function setCrown(on) {
      if (!on || crown || !head) return;
      const gold = KTM({ color: 0xf2c230, gradientMap: grad() });
      crown = new T.Group(); crown.scale.setScalar(0.5 / s);
      crown.position.copy(top ? top.position : new T.Vector3(0, 0.3, 0)).multiplyScalar(0.92);
      head.add(crown);
      crown.add(new T.Mesh(new T.CylinderGeometry(0.42, 0.42, 0.16, 18), gold));
      for (let i = 0; i < 5; i++) {
        const a = i / 5 * Math.PI * 2;
        const c = new T.Mesh(new T.ConeGeometry(0.12, 0.3, 8), gold);
        c.position.set(Math.cos(a) * 0.36, 0.2, Math.sin(a) * 0.36);
        crown.add(c);
      }
    }
    function pose(name, t) {
      const c = mxClips('zibo')[name]; if (!c) return;
      const a = R.mixer.clipAction(c);
      R.mixer.stopAllAction();
      a.reset(); a.setLoop(T.LoopOnce); a.clampWhenFinished = true; a.play();
      R.mixer.update(Math.min(t, c.duration - 0.001));
    }
    return { root, update, setCrown, pose, mx: true, play: (n, o) => R.play(n, o) };
  }

  function zibo(THREE, tint) {
    T = THREE;
    if (hasMX('zibo')) return ziboMX(tint);
    const skin = tint || 0x5fa83a;
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
    const skinMat = KTM({ color: dark, gradientMap: grad() });
    accessories(model, ['goblinEars', 'goblinFace', 'santaHatZibo', 'sack'], { skin: skinMat });
    if (CZ.KK_GEN.zibo && CZ.gen3d && CZ.gen3d.has(CZ.KK_GEN.zibo)) skinGen(model, CZ.KK_GEN.zibo, 'zibo');   // Gemini çizimli Zibo (aksesuarlar gizlenir)
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
        else if (want === 'throw') R.play('Throw', { once: true, speed: 1.25, fade: 0.08 });
        else R.play('Cheer', { fade: 0.2 });
      }
      R.mixer.update(dt);
      // bomba atarken bir anlığına oyuncuya döner, sonra yine kaçar
      const yawT = want === 'throw' ? 0 : Math.PI;
      st.yaw = st.yaw == null ? Math.PI : st.yaw + (yawT - st.yaw) * Math.min(1, dt * (want === 'throw' ? 16 : 9));
      holder.rotation.y = st.yaw;
      // geriye bakıp gülme: kafa döner (animasyonun üstüne)
      st.look += ((info.look ? 1 : 0) - st.look) * Math.min(1, dt * 8);
      if (st.look > 0.01 && want !== 'throw') head.rotation.y += st.look * 2.4;
    }
    function setCrown(on) {
      if (!on || crown) return;
      const gold = KTM({ color: 0xf2c230, gradientMap: grad() });
      crown = new T.Group(); crown.position.set(0, 1.25, 0); head.add(crown);
      crown.add(new T.Mesh(new T.CylinderGeometry(0.42, 0.42, 0.16, 18), gold));
      for (let i = 0; i < 5; i++) {
        const a = i / 5 * Math.PI * 2;
        const c = new T.Mesh(new T.ConeGeometry(0.12, 0.3, 8), gold);
        c.position.set(Math.cos(a) * 0.36, 0.2, Math.sin(a) * 0.36);
        crown.add(c);
      }
    }
    // Sabit poz (menü/hikâye resmi çizmek için)
    function pose(name, t) {
      const a = R.mixer.clipAction(clips[name]);
      R.mixer.stopAllAction();
      a.reset(); a.setLoop(T.LoopOnce); a.clampWhenFinished = true; a.play();
      R.mixer.update(Math.min(t, clips[name].duration - 0.001));
    }
    return { root, update, setCrown, pose };
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
    const P = { front: [Math.PI - 0.3, { idle: true }, 5], wave: [Math.PI - 0.3, { cheer: true }, 0.55], back1: [0.25, { idle: true }, 5], back2: [-0.25, { idle: true }, 5], jump: [Math.PI - 0.3, { jumping: true }, 0.35] }[pose] || [Math.PI - 0.3, { idle: true }, 5];
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

  /* ---------- NOEL BABA (uçan kızağı sürer) ---------- */
  function santaClaus(THREE) {
    T = THREE;
    const model = T.SkeletonUtils.clone(base.barbarian);
    tagModel(model, 'barbarian');
    ['Barbarian_Hat', 'Barbarian_Cape'].forEach(n => { const o = model.getObjectByName(n); if (o) o.visible = false; });
    toonize(model, { barbarian: { '1,0': 0xf4f4f8, '0,1': 0xd8282a, '1,1': 0xd8282a, '2,1': 0xffffff, '6,0': 0x1d1d26, '7,0': 0x1d1d26, '3,2': 0xd8282a, '7,1': 0x1d1d26, '7,2': 0xffffff, '3,0': 0xf2c230 } }, 'santaClaus');
    accessories(model, ['santaHat']);
    const holder = new T.Group(); holder.rotation.y = Math.PI; holder.scale.setScalar(0.55); holder.add(model);
    const root = new T.Group(); root.add(holder);
    const R = rig(model);
    const a = R.play('Sit_Floor_Down', { once: true, fade: 0 }); a.timeScale = 0; a.time = clips.Sit_Floor_Down.duration - 0.01;
    const armL = model.getObjectByName('upperarml'), armR = model.getObjectByName('upperarmr');
    let tt = 0;
    R.mixer.update(0.01);
    const restL = armL && armL.quaternion.clone(), restR = armR && armR.quaternion.clone();
    function update(dt, info) {
      R.mixer.update(dt); tt += dt;
      if (armL) armL.quaternion.copy(restL);
      if (armR) armR.quaternion.copy(restR);
      // dizginleri tutar; döneceği yöne çeker
      const turn = (info && info.turn) || 0;
      if (armL) { armL.rotation.x -= 0.9; armL.rotation.z -= 0.2 + Math.sin(tt * 6) * 0.05 + Math.max(0, -turn) * 0.4; }
      if (armR) { armR.rotation.x -= 0.9; armR.rotation.z += 0.2 + Math.sin(tt * 6 + 1) * 0.05 + Math.max(0, turn) * 0.4; }
    }
    return { root, update };
  }

  CZ.kk = { load, ready, hasMX, needMX, hero, zibo, portrait, santaClaus, skinGen, clipNames: () => Object.keys(clips || {}) };
})();
