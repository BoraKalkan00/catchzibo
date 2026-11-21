// HAZİNE VADİSİ: Albion Online gibi yukarıdan bakılan küçük açık dünya.
// Sol: Brawl Stars tarzı yön çubuğu. Sağ: atış düğmesi (dokun = en yakın hedefe otomatik,
// basılı tut + sürükle = Mobile Legends gibi kendin nişan al). Ayılara ve geyiğe gerçekten binilir.
// 3 dakikalık akın: kutuları kır, altın yığınlarını topla, Zibo'nun yardakçılarından çuvalları düşür.
CZ.MOUNTS = [
  { id: 'brown', price: 0, speed: 8, color: 0x7a4a2a, light: 0xc89a6a, kind: 'bear' },
  { id: 'polar', price: 3500, speed: 7.8, color: 0xf3f3ee, light: 0xdcd6c8, kind: 'bear' },
  { id: 'deer', price: 6000, speed: 9.5, color: 0x8a5230, light: 0xe2c49a, kind: 'deer' },
  { id: 'wolf', price: 9000, speed: 10, color: 0xdfe6ee, light: 0xffffff, kind: 'wolf' },
  { id: 'mammoth', price: 15000, speed: 6.6, color: 0x6a3e22, light: 0x9a6a44, kind: 'mammoth', hp: 10 },
  { id: 'goldbear', pass: true, speed: 8.6, color: 0xe0a92c, light: 0xfff0a0, kind: 'bear' },
  { id: 'icewolf', pass: true, speed: 10.6, color: 0x8ad8ff, light: 0xeaf8ff, kind: 'wolf' }
];
// Bineklerin özel güçleri (binerken sağ alttaki güç düğmesi)
CZ.MOUNT_POWER = { brown: { id: 'roar', cd: 10 }, polar: { id: 'frost', cd: 12 }, deer: { id: 'dash', cd: 9 }, wolf: { id: 'pounce', cd: 7 }, mammoth: { id: 'quake', cd: 13 }, goldbear: { id: 'roar', cd: 7 }, icewolf: { id: 'pounce', cd: 5 } };
CZ.screens.valley = (function () {
  // Ahırdaki binek resmi: 3D modelden bir kez çizilir
  const mountCache = {};
  CZ.mountPortrait = id => mountCache[id] || (mountCache[id] = CZ.runner3d.load().then(() => CZ.gen3d.load()).then(() => {
    const THREE = window.THREE;
    const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    r.setPixelRatio(1); r.setSize(220, 220); r.setClearColor(0, 0);
    const sc = new THREE.Scene();
    sc.add(new THREE.HemisphereLight(0xffffff, 0x8a90a8, 1.0));
    const dl = new THREE.DirectionalLight(0xffffff, 0.6); dl.position.set(3, 5, 4); sc.add(dl);
    const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 50); cam.position.set(4.2, 2.6, 4.2); cam.lookAt(0, 0.95, 0);
    const q = quadruped(THREE, CZ.MOUNTS.find(m => m.id === id));
    q.root.rotation.y = -0.5; sc.add(q.root); q.update(0.1, 0);
    r.render(sc, cam);
    const url = r.domElement.toDataURL('image/png');
    r.dispose();
    return url;
  }));
  const { h, img, btn } = CZ.ui;
  const t = CZ.t;
  let V = null;
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const WORLD_R = 100;   // dünya büyüdü: ormanlar, nehir, göller
  const SESSION = 180;
  const RANGE = 8.5;
  const FENCE_R = 15.5;   // köy çiti yarıçapı
  const CORE_R = 7;       // goblin buraya girerse altın çalar
  const PAD_R = 13;       // kule yerleri (çitin içinde)
  // Savunma: kule türleri ve çit. Fiyat ve süreler (dk). Yapınca hemen görünür, süre dolunca çalışır.
  // Maliyetler seviye seviye: odun < taş < altın < zümrüt. Sarı dairenin üstünde durunca kaynaklar akar (Kingshot gibi).
  const DEF = {
    snow: { cost: [{ wood: 20 }, { wood: 90, stone: 30 }, { wood: 160, gold: 150 }, { stone: 120, gold: 380, plank: 8 }, { stone: 240, gold: 800, brick: 10 }], min: [2, 10, 20, 60, 120], range: 10.5, rate: 0.85, dmg: 1, dmgUp: 1 },
    cannon: { cost: [{ wood: 35, stone: 15 }, { wood: 120, stone: 50 }, { wood: 220, gold: 260 }, { stone: 180, gold: 550, brick: 8 }, { stone: 350, gold: 1100, iron: 5 }], min: [2, 10, 20, 60, 120], range: 12.5, rate: 2.2, dmg: 3, dmgUp: 2, splash: 2.6 },
    fence: { cost: [{ wood: 15 }, { wood: 70, stone: 40 }, { wood: 150, gold: 150, plank: 6 }], min: [1, 10, 20], hp: 30, hpUp: 30 }
  };
  const RES = ['wood', 'stone', 'gold', 'plank', 'brick', 'iron'];
  const RES_COL = { wood: '#b8763a', stone: '#9aa3b4', gold: '#ffc928', gems: '#2fd08a', plank: '#e0a860', brick: '#d0503a', iron: '#cfd8e6' };
  const RUSH_BUILD = 200;
  const rushPrice = ms => Math.max(RUSH_BUILD, Math.ceil(ms / 60000) * 20);   // atış menzili: haritanın öbür ucuna ateş edilmez

  /* ---------- Dört ayaklı binekler (kodla, çizgi film tarzı) ---------- */
  // Yapay zekâ modeli varsa onu kullan (hazır değilse aşağıdaki kodla çizilmiş hayvan)
  const MOUNT_GEN = { aurora: ['rengeyigi', 2.0, 0xffd8f2], brown: ['ayi', 1.7], polar: ['kutupayisi', 1.75], deer: ['rengeyigi', 2.1], wolf: ['kurt', 1.5], mammoth: ['mamut', 2.7], goldbear: ['ayi', 1.8, 0xffd04a], icewolf: ['kurt', 1.55, 0x9adcff] };
  function genMount(THREE, def) {
    const [id, hh, tint] = MOUNT_GEN[def.id];
    const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    const mdl = CZ.gen3d.get(id, hh, tint); body.add(mdl);
    // Bacak animasyonu: modelin alt kısmı (bacaklar) köşe gölgelendiricisinde ileri-geri sallanır, çapraz bacaklar birlikte (tırıs)
    const LEG = { rengeyigi: 0.5, kurt: 0.42, mamut: 0.38, ayi: 0.36, kutupayisi: 0.36 }[id] || 0.38;
    const U = { uPh: { value: 0 }, uAmp: { value: 0 } };
    mdl.traverse(o => { if (!o.isMesh) return; o.material = o.material.clone();
      o.material.onBeforeCompile = sh => { sh.uniforms.uPh = U.uPh; sh.uniforms.uAmp = U.uAmp;
        sh.vertexShader = 'uniform float uPh; uniform float uAmp;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
          float lw = clamp((${LEG.toFixed(2)} - position.y) / ${LEG.toFixed(2)}, 0.0, 1.0);
          float sg = sign(position.x + 0.0001) * sign(position.z + 0.0001);
          float sw = sin(uPh) * sg;
          transformed.z += sw * uAmp * lw * 0.22;
          transformed.y += max(0.0, cos(uPh) * sg) * uAmp * lw * 0.08;`); };
      o.material.customProgramCacheKey = () => 'legs' + LEG;
      o.material.userData.deform = { U, key: 'legs' + LEG, glsl: `float lw = clamp((${LEG.toFixed(2)} - position.y) / ${LEG.toFixed(2)}, 0.0, 1.0); float sg = sign(position.x + 0.0001) * sign(position.z + 0.0001); float sw = sin(uPh) * sg; transformed.z += sw * uAmp * lw * 0.22; transformed.y += max(0.0, cos(uPh) * sg) * uAmp * lw * 0.08;` }; });
    let ph = 0;
    return {
      root: g, seatY: hh * ((CZ.GEN3D[id] || {}).seat || 0.62),
      update(dt, speed) {
        const k = Math.min(1, speed / 6);
        ph += dt * (5 + speed * 0.9);
        body.position.y = Math.abs(Math.sin(ph)) * 0.16 * k;
        body.rotation.x = Math.sin(ph * 2) * 0.07 * k;
        body.rotation.z = Math.sin(ph) * 0.04 * k;
        body.scale.y = 1 + (1 - k) * Math.sin(ph * 0.4) * 0.015;   // durunca nefes alır
        U.uPh.value = ph; U.uAmp.value = k;
      }
    };
  }
  function quadruped(THREE, def) {
    if (MOUNT_GEN[def.id] && CZ.gen3d && CZ.gen3d.has(MOUNT_GEN[def.id][0])) return genMount(THREE, def);
    const toon = c => CZ.style.mat(c);
    const fur = toon(def.color), light = toon(def.light), dark = toon(0x2a1a12);
    const g = new THREE.Group();
    const body = new THREE.Group(); g.add(body);
    const kind = def.kind, bear = kind !== 'deer';
    const L = kind === 'bear' ? { len: 1.15, r: 0.55, leg: 0.62, legR: 0.17, neck: 0 } : kind === 'wolf' ? { len: 1.2, r: 0.4, leg: 0.82, legR: 0.1, neck: 0 } : kind === 'mammoth' ? { len: 1.55, r: 0.82, leg: 0.9, legR: 0.26, neck: 0 } : { len: 1.0, r: 0.36, leg: 0.95, legR: 0.08, neck: 0.5 };
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(L.r, L.len, 6, 12), fur);
    torso.rotation.x = Math.PI / 2; torso.position.y = L.leg + L.r * 0.8; body.add(torso);
    const belly = new THREE.Mesh(new THREE.SphereGeometry(L.r * 0.85, 12, 8), light);
    belly.scale.set(0.9, 0.6, 1.5); belly.position.set(0, L.leg + L.r * 0.45, 0); body.add(belly);
    // eyer: kırmızı örtü + altın kenar
    const saddle = new THREE.Mesh(new THREE.BoxGeometry(L.r * 2.05, 0.08, 0.8), toon(0xc8242e));
    saddle.position.set(0, L.leg + L.r * 1.75, 0.05); body.add(saddle);
    const trim = new THREE.Mesh(new THREE.BoxGeometry(L.r * 2.1, 0.05, 0.85), toon(0xf2c230));
    trim.position.set(0, L.leg + L.r * 1.7, 0.05); body.add(trim);
    [-1, 1].forEach(sd => { const flap = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.45, 0.7), toon(0xc8242e)); flap.position.set(sd * L.r * 1.02, L.leg + L.r * 1.4, 0.05); body.add(flap); });
    // kafa
    const head = new THREE.Group();
    head.position.set(0, L.leg + L.r * (bear ? 1.2 : 1.9) + L.neck, -(L.len / 2 + L.r * (bear ? 0.75 : 0.55)));
    body.add(head);
    if (!bear) {
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.17, 0.75, 8), fur);
      neck.position.set(0, L.leg + L.r * 1.3 + 0.3, -(L.len / 2 + 0.15)); neck.rotation.x = 0.5; body.add(neck);
    }
    const hr = kind === 'bear' ? 0.42 : kind === 'wolf' ? 0.3 : kind === 'mammoth' ? 0.62 : 0.22;
    const skull = new THREE.Mesh(new THREE.SphereGeometry(hr, 14, 10), fur); skull.scale.set(1, 0.95, kind === 'bear' || kind === 'mammoth' ? 1.05 : 1.4); head.add(skull);
    if (kind === 'wolf') {
      const sn = new THREE.Mesh(new THREE.ConeGeometry(hr * 0.42, hr * 1.5, 8), light); sn.rotation.x = -Math.PI / 2; sn.position.set(0, -hr * 0.25, -hr * 1.25); head.add(sn);
      const nz = new THREE.Mesh(new THREE.SphereGeometry(hr * 0.13, 8, 6), dark); nz.position.set(0, -hr * 0.2, -hr * 1.95); head.add(nz);
    } else if (kind === 'mammoth') {
      const hump = new THREE.Mesh(new THREE.SphereGeometry(hr * 0.75, 10, 8), toon(0x4a2a16)); hump.position.set(0, hr * 0.65, hr * 0.1); head.add(hump);
      // hortum: aşağı kıvrılan üç parça
      let tp = new THREE.Group(); tp.position.set(0, -hr * 0.2, -hr * 0.85); tp.rotation.x = 0.5; head.add(tp);
      [0.24, 0.19, 0.14].forEach((rr, k) => { const seg = new THREE.Mesh(new THREE.CylinderGeometry(rr * 0.8, rr, 0.45, 8), fur); seg.position.y = -0.2; tp.add(seg); const nx = new THREE.Group(); nx.position.y = -0.42; nx.rotation.x = 0.35 + k * 0.15; tp.add(nx); tp = nx; });
      [-1, 1].forEach(sd => { const tk = new THREE.Mesh(new THREE.ConeGeometry(0.09, 1.0, 8), toon(0xfff6e0)); tk.position.set(sd * hr * 0.45, -hr * 0.55, -hr * 0.95); tk.rotation.set(-2.2, 0, sd * 0.35); head.add(tk); });
    } else {
      const snout = new THREE.Mesh(new THREE.SphereGeometry(hr * 0.5, 10, 8), light); snout.scale.set(1, 0.8, 1.2); snout.position.set(0, -hr * 0.2, -hr * 0.85); head.add(snout);
      const nose = new THREE.Mesh(new THREE.SphereGeometry(hr * 0.18, 8, 6), dark); nose.position.set(0, -hr * 0.05, -hr * 1.35); head.add(nose);
    }
    [-1, 1].forEach(sd => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(hr * 0.12, 8, 6), dark); eye.position.set(sd * hr * 0.42, hr * 0.2, -hr * 0.82); head.add(eye);
      const shine = new THREE.Mesh(new THREE.SphereGeometry(hr * 0.045, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff })); shine.position.set(sd * hr * 0.42 + 0.02, hr * 0.25, -hr * 0.92); head.add(shine);
      if (kind === 'wolf') {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(hr * 0.28, hr * 0.7, 6), fur); ear.position.set(sd * hr * 0.55, hr * 0.85, 0); ear.rotation.z = -sd * 0.2; head.add(ear);
      } else if (kind === 'mammoth') {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(hr * 0.5, 8, 6), fur); ear.scale.set(0.25, 1, 0.9); ear.position.set(sd * hr * 0.95, hr * 0.05, hr * 0.15); head.add(ear);
      } else if (bear) {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(hr * 0.3, 8, 6), fur); ear.scale.set(1, 1, 0.5); ear.position.set(sd * hr * 0.7, hr * 0.75, 0); head.add(ear);
        const inner = new THREE.Mesh(new THREE.SphereGeometry(hr * 0.17, 8, 6), light); inner.scale.set(1, 1, 0.4); inner.position.set(sd * hr * 0.7, hr * 0.75, -hr * 0.1); head.add(inner);
      } else {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 6), fur); ear.position.set(sd * 0.2, 0.15, 0.05); ear.rotation.z = -sd * 1.1; head.add(ear);
        const an = new THREE.Group(); an.position.set(sd * 0.1, 0.2, 0.05); an.rotation.z = -sd * 0.35; head.add(an);
        const horn = toon(0x6a4a2a);
        const a1 = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.5, 5), horn); a1.position.y = 0.25; an.add(a1);
        [0.2, 0.35].forEach(y => { const a2 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.22, 5), horn); a2.position.set(-sd * 0.08, y, 0); a2.rotation.z = sd * 0.9; an.add(a2); });
        const bell = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), toon(0xf2c230)); bell.position.set(0, -0.3, 0.1); head.add(bell);
      }
    });
    if (def.id === 'polar') { const scarf = new THREE.Mesh(new THREE.TorusGeometry(hr * 0.75, 0.07, 6, 14), toon(0x2f6fd8)); scarf.rotation.x = Math.PI / 2; scarf.position.set(0, -hr * 0.55, hr * 0.2); head.add(scarf); }
    // bacaklar: omuz pivotu + pençe
    const legs = [];
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz], i) => {
      const lg = new THREE.Group(); lg.position.set(sx * L.r * 0.62, L.leg + 0.05, sz * L.len * 0.48); body.add(lg);
      const m = new THREE.Mesh(new THREE.CapsuleGeometry(L.legR, L.leg - L.legR * 2, 4, 8), fur); m.position.y = -L.leg / 2; lg.add(m);
      const paw = new THREE.Mesh(new THREE.SphereGeometry(L.legR * (bear ? 1.25 : 1.1), 8, 6), bear ? light : dark); paw.scale.set(1, 0.6, 1.3); paw.position.set(0, -L.leg + 0.02, -0.04); lg.add(paw);
      legs.push({ lg, ph: (i === 0 || i === 3) ? 0 : Math.PI });
    });
    const tail = new THREE.Mesh(new THREE.SphereGeometry(kind === 'wolf' ? 0.2 : bear ? 0.13 : 0.1, 8, 6), light); tail.position.set(0, L.leg + L.r * 1.0, L.len / 2 + L.r * 0.9); if (kind === 'wolf') { tail.scale.set(1, 1, 2.6); tail.position.z += 0.3; tail.position.y += 0.15; tail.rotation.x = -0.5; } body.add(tail);
    // gölge
    const sh = new THREE.Mesh(new THREE.CircleGeometry(1, 20), new THREE.MeshBasicMaterial({ color: 0x0a1030, transparent: true, opacity: 0.22, depthWrite: false }));
    sh.visible = false; sh.rotation.x = -Math.PI / 2; sh.position.y = 0.02; sh.scale.set(L.r * 1.6, (L.len + L.r * 2) * 0.9, 1); g.add(sh);
    let ph = 0;
    const seatY = L.leg + L.r * 1.8;
    return {
      root: g, seatY,
      update(dt, speed) {
        const k = Math.min(1, speed / 6);
        ph += dt * (4 + speed * (bear ? 0.9 : 1.1));
        legs.forEach(L2 => { L2.lg.rotation.x = Math.sin(ph + L2.ph) * 0.75 * k; });
        body.position.y = Math.abs(Math.sin(ph)) * (bear ? 0.12 : 0.18) * k + (1 - k) * Math.sin(ph * 0.3) * 0.02;
        body.rotation.x = Math.sin(ph * 2) * 0.04 * k;
        head.rotation.x = Math.sin(ph * 2 + 1) * 0.08 * k + (1 - k) * Math.sin(ph * 0.5) * 0.05;
        head.rotation.y = (1 - k) * Math.sin(ph * 0.2) * 0.3;
      }
    };
  }

  CZ.quadruped = quadruped;

  /* ---------- Dünya ---------- */
  function build(el, params) {
    const THREE = window.THREE;
    const d = CZ.state.data;
    let V_move, V_up;
    const stage = h('div', { class: 'valley-stage' });
    const W = (CZ.GOLD.weapons.find(w => w.id === d.weapon) || CZ.GOLD.weapons[0]);
    const B = CZ.village ? CZ.village.bonus() : { speed: 1, magnet: 0, dmg: 0, cool: 1, time: 0, boxes: 0 };   // köy yükseltmeleri
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    const RATIOS = [Math.min(window.devicePixelRatio || 1, 1.75), 1.25, 1, 0.8];
    let ratioIdx = 0;
    renderer.setPixelRatio(RATIOS[0]);
    stage.append(renderer.domElement);
    const post = CZ.post.create(renderer, { bloom: 0.5, thr: 0.84 });
    const scene = new THREE.Scene();
    const SKY = 0xbcd4f2;
    scene.background = new THREE.Color(SKY);
    scene.fog = new THREE.Fog(SKY, 40, 75);
    const camera = new THREE.PerspectiveCamera(46, 1, 0.5, 160);
    const hemi = new THREE.HemisphereLight(0xdfeaff, 0x56648a, 0.55); scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffe0b0, 1.08); sun.position.set(20, 40, 10); scene.add(sun); scene.add(sun.target);
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
    sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 5, far: 90 }); sun.shadow.bias = -0.002;
    const toon = c => CZ.style.mat(c);
    const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
    const seeU = { uSee: { value: new THREE.Vector3(-999, -999, 0) }, uSeeR: { value: 90 } };
    const seeThrough = mat => {
      mat.userData.see = true;
      mat.onBeforeCompile = sh => {
        Object.assign(sh.uniforms, seeU);
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vVZ;').replace('#include <project_vertex>', '#include <project_vertex>\nvVZ = -mvPosition.z;');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vVZ; uniform vec3 uSee; uniform float uSeeR;').replace('void main() {', `void main() {
          if (vVZ < uSee.z - 0.8) { float dd = distance(gl_FragCoord.xy, uSee.xy) / uSeeR;
            if (dd < 0.75) discard;
            if (dd < 1.0 && mod(floor(gl_FragCoord.x) + floor(gl_FragCoord.y), 2.0) < 1.0) discard; }`);
      };
      return mat;
    };
    const toonSee = c => seeThrough(CZ.style.mat(c));
    // ÇİZGİ FİLM KONTURU: karakterlerin etrafına koyu ince çizgi (LoL / Albion tarzı okunurluk)
    const outlineMat = th => { const m = new THREE.MeshBasicMaterial({ color: CZ.style.OL, side: THREE.BackSide }); m.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed += normalize(normal) * ' + th.toFixed(4) + ';'); }; m.customProgramCacheKey = () => 'ol' + th; return m; };
    const OL = {};
    function deformOutline(th, df) { const m = new THREE.MeshBasicMaterial({ color: CZ.style.OL, side: THREE.BackSide });
      m.onBeforeCompile = sh => { sh.uniforms.uPh = df.U.uPh; sh.uniforms.uAmp = df.U.uAmp; sh.vertexShader = 'uniform float uPh; uniform float uAmp;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n' + df.glsl + '\ntransformed += normalize(normal) * ' + th.toFixed(4) + ';'); };
      m.customProgramCacheKey = () => 'ol' + df.key + th; return m; }
    // büyük nesnelerde kontur kalınlığı dünyada hep aynı olsun (model ölçeğine bölünür)
    function outlineWorld(root, w) { root.updateWorldMatrix(true, true); const v = new THREE.Vector3(), list = [];
      root.traverse(o => { if (o.isMesh && !o.userData.ol && !o.userData.olDone && o.geometry && o.geometry.attributes.normal && !(o.material && (o.material.transparent || o.material.isMeshBasicMaterial))) list.push(o); });
      list.forEach(o => { o.getWorldScale(v); o.userData.olDone = true; olMesh(o, Math.max(0.002, Math.round(w / Math.max(0.05, v.x) * 1000) / 1000)); }); }
    function addOutline(root, th) {
      const list = [];
      root.traverse(o => { if (o.isMesh && !o.userData.ol && o.geometry && o.geometry.attributes.normal && o.visible && !(o.material && (o.material.transparent || o.material.isMeshBasicMaterial))) list.push(o); });
      list.forEach(o => olMesh(o, th));
    }
    const SEE_V = ['#include <common>', '#include <common>\nvarying float vVZ;', '#include <project_vertex>', '#include <project_vertex>\nvVZ = -mvPosition.z;'];
    const SEE_F = `if (vVZ < uSee.z - 0.8) { float dd = distance(gl_FragCoord.xy, uSee.xy) / uSeeR; if (dd < 0.75) discard; if (dd < 1.0 && mod(floor(gl_FragCoord.x) + floor(gl_FragCoord.y), 2.0) < 1.0) discard; }`;
    const OLS = {};
    const outlineSee = th => { const m = new THREE.MeshBasicMaterial({ color: CZ.style.OL, side: THREE.BackSide });
      m.onBeforeCompile = sh => { Object.assign(sh.uniforms, seeU); sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed += normalize(normal) * ' + th.toFixed(4) + ';').replace(SEE_V[0], SEE_V[1]).replace(SEE_V[2], SEE_V[3]);
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vVZ; uniform vec3 uSee; uniform float uSeeR;').replace('void main() {', 'void main() {\n' + SEE_F); };
      m.customProgramCacheKey = () => 'ols' + th; return m; };
    function olMesh(o, th) {
      if (o.name === 'GenBody') th = th * 1.8;   // Gemini karakterleri: kontur biraz kalın
      const see = o.material && o.material.userData && o.material.userData.see;
      const mat = see ? (OLS[th] || (OLS[th] = outlineSee(th))) : (OL[th] || (OL[th] = outlineMat(th)));
      {
        let c;
        const df = o.material && o.material.userData && o.material.userData.deform;
        if (o.isSkinnedMesh) { c = new THREE.SkinnedMesh(o.geometry, mat); c.bind(o.skeleton, o.bindMatrix); c.bindMode = o.bindMode; }
        else c = new THREE.Mesh(o.geometry, df ? deformOutline(th, df) : mat);
        c.userData.ol = true; c.castShadow = false; c.frustumCulled = !!o.isSkinnedMesh ? false : o.frustumCulled;   // ekran dışındaki kontur çizilmesin
        c.position.copy(o.position); c.quaternion.copy(o.quaternion); c.scale.copy(o.scale);
        o.parent.add(c);
        if (!o.isSkinnedMesh) { o.add(c); c.position.set(0, 0, 0); c.quaternion.identity(); c.scale.set(1, 1, 1); }
      }
    }

    // ===== ARAZİ: nehir, dere, donmuş göller, çimen yamaları, toprak yollar =====
    const roads = [[0, 0, 0, -95], [0, 0, 0, 95], [0, 0, 95, 0], [0, 0, -95, 0]];
    const distSeg = (x, z, s) => { const [ax, az, bx, bz] = s; const vx = bx - ax, vz = bz - az; const tt = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz))); return Math.hypot(x - (ax + vx * tt), z - (az + vz * tt)); };
    const riverZ = x => 44 + 8 * Math.sin(x / 17) + 4 * Math.sin(x / 7.3);          // güneyde batıdan doğuya nehir
    const creekX = z => 50 + 6 * Math.sin(z / 13);                                      // doğuda kuzeyden nehre dere
    const RIVER_W = 2.8, CREEK_W = 1.7;
    const lakes = [[-52, -48, 13], [38, -62, 10], [-70, 20, 8]];
    const bridges = [[0, riverZ(0)], [-58, riverZ(-58)], [62, riverZ(62)], [creekX(0), 0], [creekX(-50), -50]];
    const inRiver = (x, z) => Math.abs(z - riverZ(x)) < RIVER_W || (z < riverZ(x) && Math.abs(x - creekX(z)) < CREEK_W);
    const onBridge = (x, z) => bridges.some(([bx, bz]) => Math.abs(x - bx) < 2.4 && Math.abs(z - bz) < 4.2) || bridges.some(([bx, bz]) => Math.abs(z - bz) < 2.4 && Math.abs(x - bx) < 4.2 && bx > 40 && Math.abs(bz) < 60);
    const water = (x, z) => inRiver(x, z) && !onBridge(x, z);
    // Yol bulma: düz çizgi sudan geçiyorsa en uygun köprünün girişini, köprüdeysen çıkışını döndür
    const bridgeEnds = (k, side) => { const [bx, bz] = bridges[k]; return k < 3 ? [[bx, bz - side * 5], [bx, bz + side * 5]] : [[bx - side * 4.5, bz], [bx + side * 4.5, bz]]; };
    function route(fx, fz, tx, tz) {
      // hangi su: ana nehir mi dere mi (ilk karşılaşılan)
      // kıyı tarafı: aynı taraftaysan köprüye gerek yok (nehrin kıvrımı yolu kesse bile kayarak gidilir)
      const sideR = (x, z) => z > riverZ(x) ? 1 : -1, sideC = (x, z) => x > creekX(z) ? 1 : -1;
      let wet = 0;
      if (sideR(fx, fz) !== sideR(tx, tz)) wet = 1;
      else if (sideR(fx, fz) < 0 && sideR(tx, tz) < 0 && sideC(fx, fz) !== sideC(tx, tz)) wet = 2;
      if (!wet) return null;
      let best = null, bc = 1e9;
      bridges.forEach((b, k) => { if ((wet === 1) !== (k < 3)) return; const side = k < 3 ? (tz > b[1] ? 1 : -1) : (tx > b[0] ? 1 : -1); const [en, ex] = bridgeEnds(k, side); const c = Math.hypot(en[0] - fx, en[1] - fz) + 10 + Math.hypot(tx - ex[0], tz - ex[1]); if (c < bc) { bc = c; best = Math.hypot(en[0] - fx, en[1] - fz) < 1.6 || onBridge(fx, fz) ? ex : en; } });
      return best;
    }
    const inLake = (x, z, pad) => lakes.some(([lx, lz, lr]) => Math.hypot(x - lx, z - lz) < lr + (pad || 0));
    const noise = (x, z) => Math.sin(x * 0.083) * Math.cos(z * 0.071) + 0.6 * Math.sin(x * 0.031 + z * 0.047) + 0.35 * Math.cos(x * 0.19 - z * 0.13);
    const GS = 280, groundGeo = new THREE.PlaneGeometry(GS, GS, 230, 230);
    groundGeo.rotateX(-Math.PI / 2);
    const pos = groundGeo.attributes.position, col = [];
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const r = Math.hypot(x, z);
      let y = 0;
      if (r > WORLD_R + 4) y = (r - WORLD_R - 4) * 0.8 + Math.sin(x * 0.2) * Math.cos(z * 0.17) * 3;
      const nz = noise(x, z), n = Math.sin(x * 0.7) * Math.cos(z * 0.6) * 0.03;
      const sm = (a, b, v) => { const q = Math.min(1, Math.max(0, (v - a) / (b - a))); return q * q * (3 - 2 * q); };
      const mix = (A, Bc, k) => A.map((v, j) => v + (Bc[j] - v) * k);
      let c = [0.66 + n, 0.72 + n, 0.86];                                         // kar
      c = mix(c, [0.58 + n, 0.68 + n, 0.6], sm(0.4, 0.62, nz));                   // ince kar + çimen
      c = mix(c, [0.5 + n, 0.62 + n, 0.42], sm(0.66, 0.9, nz));                   // karı erimiş çimen
      c = mix(c, [0.6 + n, 0.6 + n, 0.66], sm(-0.95, -1.25, nz));                 // kayalık
      const rd = Math.min(...roads.map(s2 => distSeg(x, z, s2)));
      c = mix(c, [0.52 + n, 0.44 + n, 0.36], 1 - sm(1.9, 3.1, rd));               // toprak yol (kenarı yumuşak)
      const dr = Math.min(Math.abs(z - riverZ(x)), z < riverZ(x) ? Math.abs(x - creekX(z)) : 99);
      c = mix(c, [0.42 + n, 0.38 + n, 0.32], 1 - sm(RIVER_W + 0.6, RIVER_W + 2.2, dr));   // nehir kıyısı: çamur
      { const dR = Math.min(Math.abs(z - riverZ(x)) - RIVER_W, z < riverZ(x) ? Math.abs(x - creekX(z)) - CREEK_W : 99), k = 1 - sm(-0.9, 0.5, dR);   // nehir yatağı: kıyıya doğru yumuşak iner
        if (k > 0) { c = mix(c, [0.16, 0.3, 0.42], k); y = Math.min(y, -0.5 * k); } }
      if (inLake(x, z)) c = [0.6, 0.8, 0.93];                                     // donmuş göl
      c = mix(c, [0.58 + n, 0.52 + n, 0.46], 1 - sm(FENCE_R - 0.5, FENCE_R + 1.5, r));   // köy meydanı: toprak
      if (y > 3) c = [0.72 + n, 0.77 + n, 0.9];
      pos.setY(i, y);
      col.push(...c);
    }
    groundGeo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    groundGeo.computeVertexNormals();
    const snowTex = (() => { const S = 512, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
      x.fillStyle = '#ffffff'; x.fillRect(0, 0, S, S);
      // döşemede dikiş görünmesin: her lekeyi dört kenara sarmalayarak çiz
      const blob = (gx, gy, rr, col) => [-S, 0, S].forEach(ox => [-S, 0, S].forEach(oy => { const gg = x.createRadialGradient(gx + ox, gy + oy, 0, gx + ox, gy + oy, rr); gg.addColorStop(0, col); gg.addColorStop(1, 'rgba(120,140,170,0)'); x.fillStyle = gg; x.fillRect(gx + ox - rr, gy + oy - rr, rr * 2, rr * 2); }));
      for (let i = 0; i < 70; i++) blob(Math.random() * S, Math.random() * S, 30 + Math.random() * 70, 'rgba(120,140,170,.12)');
      for (let i = 0; i < 260; i++) blob(Math.random() * S, Math.random() * S, 2 + Math.random() * 3, Math.random() < 0.5 ? 'rgba(255,255,255,.9)' : 'rgba(110,130,150,.22)');
      const tx = new THREE.CanvasTexture(c); tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(26, 26); tx.anisotropy = renderer.capabilities.getMaxAnisotropy(); return tx; })();
    const ground = new THREE.Mesh(groundGeo, new THREE.MeshLambertMaterial({ vertexColors: true, map: snowTex })); ground.receiveShadow = true; scene.add(ground);
    // akan su: nehir ve dere şeritleri, kayan dalga dokusu
    const waterTex = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 128; const x = c.getContext('2d');
      x.fillStyle = '#3d8fd6'; x.fillRect(0, 0, 64, 128);
      for (let i = 0; i < 22; i++) { x.fillStyle = `rgba(255,255,255,${0.12 + Math.random() * 0.25})`; x.fillRect(Math.random() * 64, Math.random() * 128, 6 + Math.random() * 14, 2); }
      const tx = new THREE.CanvasTexture(c); tx.wrapS = tx.wrapT = THREE.RepeatWrapping; return tx; })();
    const waterMat = new THREE.MeshLambertMaterial({ map: waterTex, transparent: true, opacity: 0.88, emissive: 0x0a2a4a });
    function strip(pts, w) {
      const v = [], uv = [], idx = [];
      pts.forEach((p, i) => { const q = pts[Math.min(pts.length - 1, i + 1)], o = pts[Math.max(0, i - 1)]; let dx = q[0] - o[0], dz = q[1] - o[1]; const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
        v.push(p[0] - dz * w, 0.05, p[1] + dx * w, p[0] + dz * w, 0.05, p[1] - dx * w); uv.push(0, i * 0.25, 1, i * 0.25); if (i) idx.push(i * 2 - 2, i * 2 - 1, i * 2, i * 2 - 1, i * 2 + 1, i * 2); });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
      const m = new THREE.Mesh(g, waterMat); scene.add(m); return m;
    }
    const rp = []; for (let x = -GS / 2; x <= GS / 2; x += 2) rp.push([x, riverZ(x)]);
    const cp = []; for (let z = -GS / 2; z <= riverZ(creekX(0)); z += 2) cp.push([creekX(z), z]);
    strip(rp, RIVER_W + 0.3); strip(cp, CREEK_W + 0.3);
    // köprüler
    const plank = toon(0x8a5a30), rail = toon(0x6a4024);
    bridges.forEach(([bx, bz], k) => {
      const g = new THREE.Group(); const alongX = k >= 3;   // derenin köprüleri yan
      const L = alongX ? CREEK_W * 2 + 4 : RIVER_W * 2 + 4;
      for (let i = 0; i < 9; i++) { const pl = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.18, L / 9 - 0.08), plank); pl.position.set(0, 0.32, -L / 2 + (i + 0.5) * L / 9); pl.castShadow = true; g.add(pl); }
      [-1, 1].forEach(sd => { const rl = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, L), rail); rl.position.set(sd * 1.75, 0.65, 0); g.add(rl); });
      g.position.set(bx, 0, bz); if (alongX) g.rotation.y = Math.PI / 2; scene.add(g);
    });
    // donmuş göller (üstünde yürünür, kayar gibi parlar)
    lakes.forEach(([lx, lz, lr]) => { const m = new THREE.Mesh(new THREE.CircleGeometry(lr, 48), new THREE.MeshLambertMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.6, emissive: 0x2a4a6a })); m.rotation.x = -Math.PI / 2; m.position.set(lx, 0.04, lz); scene.add(m); });

    // dışarıda kalan dağ zirveleri
    const peakGeo = new THREE.ConeGeometry(1, 1, 7);
    const peaks = new THREE.InstancedMesh(peakGeo, toon(0xe8eef8), 40);
    const tmp = new THREE.Object3D();
    for (let i = 0; i < 40; i++) {
      const a = i / 40 * Math.PI * 2 + rand(-0.06, 0.06), rr = rand(122, 134);
      tmp.position.set(Math.cos(a) * rr, 10, Math.sin(a) * rr); tmp.scale.set(rand(14, 22), rand(24, 38), rand(14, 22)); tmp.rotation.y = rand(0, 6); tmp.updateMatrix();
      peaks.setMatrixAt(i, tmp.matrix);
    }
    scene.add(peaks);

    // Engeller (çarpışma için daireler)
    const solids = [];
    const free = (x, z, r) => Math.hypot(x, z) < WORLD_R - 2 && Math.hypot(x, z) > FENCE_R + 4 + r && !inLake(x, z, 1 + r) && Math.abs(z - riverZ(x)) > RIVER_W + 1.5 + r && !(z < riverZ(x) && Math.abs(x - creekX(z)) < CREEK_W + 1.5 + r) && Math.min(...roads.map(s => distSeg(x, z, s))) > 2.8 + r && !campSites.some(c => Math.hypot(c[0] - x, c[1] - z) < 7 + r) && !solids.some(s => Math.hypot(s.x - x, s.z - z) < s.r + r + 1);
    // GOBLİN KAMPLARI: köyün dışında 8 yer (her açılışta aynı yerler). Ağaç ve kaya buraya konmaz.
    const campSites = [];
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + 0.4; for (let k = 0; k < 40; k++) { const rr = 48 + ((i * 37 + k * 13) % 38), aa = a + ((k % 7) - 3) * 0.07, x = Math.cos(aa) * rr, z = Math.sin(aa) * rr; if (free(x, z, 5) && !water(x + 4, z) && !water(x - 4, z) && !water(x, z + 4) && !water(x, z - 4)) { campSites.push([x, z, i]); break; } } }
    // OYUNCUNUN KENDİ KÖYÜ: Köyüm ekranındaki binalar, aynı seviyelerle ortada durur
    const VS = 0.68;
    const vilGroup = new THREE.Group(); scene.add(vilGroup);
    const star = new THREE.Object3D();
    function placeVillage() {
      vilGroup.clear();
      if (!CZ.villageModel || !CZ.village) return;
      CZ.VB.forEach(b => {
        const [sx, sz] = CZ.VILLAGE_SPOTS[b.id];
        if (!CZ.village.lv(b.id)) return;
        const g = CZ.villageModel(THREE, b.id, CZ.village.lv(b.id));
        g.scale.setScalar(VS); g.position.set(sx * VS, 0, sz * VS);
        if (g.userData.sprite) { const sp = g.children[0], W = sp.scale.x; sp.center.set(0.5, 0.02); sp.position.z = W * 0.4; sp.material.depthTest = true; sp.renderOrder = 0; sp.material.alphaTest = 0.4; }
        g.traverse(o => { if (o.isMesh) { o.castShadow = true; if (o.material && !o.material.isMeshBasicMaterial) o.material = seeThrough(o.material.clone()); } });
        vilGroup.add(g); outlineWorld(g, 0.035);
        if (!solids.some(q => q.vil === b.id)) solids.push({ x: sx * VS, z: sz * VS, r: (b.id === 'hall' ? 2.4 : 1.7), vil: b.id });
      });
    }
    placeVillage();
    // Zibo'nun kampı: çadır + ateş
    const tent = new THREE.Mesh(new THREE.ConeGeometry(3.2, 3.6, 6), toon(0x4a8a3a)); tent.position.set(38, 1.8, 34); scene.add(tent); solids.push({ x: 38, z: 34, r: 3.1 });
    const campLight = new THREE.PointLight(0xff8a3a, 1.4, 14); campLight.position.set(34, 1.5, 30); scene.add(campLight);
    const logs = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 0.4, 8), toon(0x5a3418)); logs.position.set(34, 0.2, 30); scene.add(logs);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.4, 8), new THREE.MeshBasicMaterial({ color: 0xffa83a, transparent: true, opacity: 0.85 })); flame.position.set(34, 1, 30); scene.add(flame);
    // Buz mağarası: sadece kutup ayısı buz duvarını kırabilir; içinde hazine sandığı
    // kayalık tepe + karanlık mağara ağzı
    const caveMat = seeThrough(CZ.style.mat({ color: 0x8a94aa, flatShading: true }));
    [[-38, -32, 3.4, 3], [-41, -28, 2.8, 2.4], [-35, -35, 2.6, 2.2], [-42, -34, 3, 2.6], [-38.5, -30, 2.2, 3.6]].forEach(([x, z, r2, hh]) => {
      const rk = new THREE.Mesh(new THREE.DodecahedronGeometry(r2, 0), caveMat); rk.position.set(x, hh * 0.45, z); rk.scale.set(1, hh / r2 * 0.75, 1); rk.rotation.y = x; rk.castShadow = true; scene.add(rk);
      const cap = new THREE.Mesh(new THREE.DodecahedronGeometry(r2 * 0.6, 0), seeThrough(toon(0xffffff))); cap.position.set(x, hh * 0.45 + hh * 0.6, z); cap.scale.set(1, 0.4, 1); scene.add(cap);
    });
    const mouth = new THREE.Mesh(new THREE.CircleGeometry(1.8, 16, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x141a28 })); mouth.position.set(-33.4, 0.02, -27.9); mouth.rotation.y = -0.75; scene.add(mouth);
    solids.push({ x: -40, z: -31, r: 4.2 });
    const iceWall = new THREE.Mesh(new THREE.BoxGeometry(3.4, 3.2, 0.8), CZ.style.mat({ color: 0x9fe0ff, transparent: true, opacity: 0.8 }));
    iceWall.position.set(-32, 1.6, -26.5); iceWall.rotation.y = -0.75; scene.add(iceWall);
    const ice = { x: -32, z: -26.5, r: 1.9, mesh: iceWall, alive: true };
    solids.push(ice);

    // ===== KAYNAKLAR: ağaçlar (balta → odun) ve kayalar (kazma → taş). Parçalara bölünmüş InstancedMesh =====
    const CH = 28;
    const chunks = {};
    const chunkOf = (kind, x, z) => { const k = kind + Math.floor(x / CH) + ',' + Math.floor(z / CH); return chunks[k] || (chunks[k] = { kind, items: [], cx: (Math.floor(x / CH) + 0.5) * CH, cz: (Math.floor(z / CH) + 0.5) * CH }); };
    const trees = [], rocks = [];
    for (let k = 0; k < 6000 && trees.length < 620; k++) {
      const x = rand(-WORLD_R, WORLD_R), z = rand(-WORLD_R, WORLD_R);
      const dens = noise(x * 1.3 + 40, z * 1.3 - 20);   // ormanlık bölgeler
      if (dens < 0.15 && Math.random() > 0.08) continue;
      if (Math.hypot(x, z) < FENCE_R + 9) continue;
      if (!free(x, z, 0.8)) continue;
      const sol = { x, z, r: 0.7 };
      const tr = { kind: 'tree', x, z, s: rand(0.85, 1.3), hp: 3, maxHp: 3, solid: sol, alive: true };
      solids.push(sol); trees.push(tr); chunkOf('t', x, z).items.push(tr);
    }
    for (let k = 0; k < 6000 && rocks.length < 260; k++) {
      const x = rand(-WORLD_R, WORLD_R), z = rand(-WORLD_R, WORLD_R), sc = rand(0.7, 1.35);
      if (noise(x - 30, z + 60) > -0.2 && Math.random() > 0.12) continue;   // kayalık bölgeler
      if (Math.hypot(x, z) < FENCE_R + 7) continue;
      if (!free(x, z, sc)) continue;
      const sol = { x, z, r: sc * 0.85 };
      const rk = { kind: 'rock', x, z, s: sc, hp: 4, maxHp: 4, solid: sol, alive: true, rot: rand(0, 6) };
      solids.push(sol); rocks.push(rk); chunkOf('r', x, z).items.push(rk);
    }
    // köy yakınında da birkaç tane olsun (öğretici için)
    const treeGeo = CZ.gen3d.has('cam_hi') ? CZ.gen3d.geo('cam_hi') : CZ.gen3d.has('cam_lo') ? CZ.gen3d.geo('cam_lo') : (() => { const g = new THREE.ConeGeometry(0.45, 1, 8); g.translate(0, 0.5, 0); const c = []; for (let i = 0; i < g.attributes.position.count; i++) c.push(0.2, 0.5, 0.3); g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3)); return g; })();
    const rockGeo = (() => { let g = new THREE.IcosahedronGeometry(1, 3); g.deleteAttribute('normal'); g.deleteAttribute('uv'); { const P0 = g.attributes.position, map = {}, pts = [], idx = []; for (let i = 0; i < P0.count; i++) { const k = [P0.getX(i), P0.getY(i), P0.getZ(i)].map(q => Math.round(q * 1e4)).join(','); if (map[k] === undefined) { map[k] = pts.length / 3; pts.push(P0.getX(i), P0.getY(i), P0.getZ(i)); } idx.push(map[k]); }
        g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); g.setIndex(idx); }   // köşeleri birleştir: yumuşak gölge
      const p2 = g.attributes.position, c = [];
      for (let i = 0; i < p2.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(p2, i);
        const nn = Math.sin(v.x * 3.1 + 1) * Math.cos(v.z * 2.7) * 0.14 + Math.sin(v.y * 6 + v.x * 4) * 0.05 + Math.sin(v.z * 9) * 0.025;   // katmanlı pürüz
        v.multiplyScalar(1 + nn); v.y = v.y < 0 ? v.y * 0.35 : v.y * 0.78; p2.setXYZ(i, v.x, v.y, v.z);
        const k = 0.34 + v.y * 0.08 + nn * 0.3; let cc = [k, k + 0.025, k + 0.075];
        const snow = Math.min(1, Math.max(0, (v.y - 0.66) / 0.12)) * 0.85; cc = cc.map((q, j) => q + ([0.93, 0.96, 1][j] - q) * snow); c.push(...cc); }
      g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3)); g.computeVertexNormals(); g.translate(0, 0.3, 0); return g; })();
    const resMatT = seeThrough(CZ.style.mat({ vertexColors: true }));
    const resMatR = CZ.style.mat({ vertexColors: true });
    function setInst(it) {
      const c = it.chunk;
      if (!it.alive) tmp.scale.setScalar(0.0001);
      else if (it.kind === 'tree') tmp.scale.setScalar(it.s * 3.3 * (it.shrink || 1));
      else tmp.scale.set(it.s, it.s, it.s);
      tmp.position.set(it.x, 0, it.z); tmp.rotation.set(it.kind === 'tree' ? (it.tilt || 0) : 0, it.kind === 'tree' ? it.yaw : it.rot, 0); tmp.updateMatrix();
      c.mesh.setMatrixAt(it.idx, tmp.matrix); c.mesh.instanceMatrix.needsUpdate = true;
    }
    Object.values(chunks).forEach(c => {
      c.mesh = new THREE.InstancedMesh(c.kind === 't' ? treeGeo : rockGeo, c.kind === 't' ? resMatT : resMatR, c.items.length);
      c.mesh.frustumCulled = false; c.mesh.castShadow = true; c.mesh.receiveShadow = c.kind === 'r';
      c.items.forEach((it, i) => { it.chunk = c; it.idx = i; it.yaw = rand(0, 6); setInst(it); if (c.kind === 't') c.mesh.setColorAt(i, new THREE.Color().setHSL(0.4, 0.14, 0.46 + rand(-0.06, 0.08))); });
      scene.add(c.mesh);
      if (c.kind === 'r') { const ol = new THREE.InstancedMesh(rockGeo, outlineMat(0.035), c.items.length); ol.instanceMatrix = c.mesh.instanceMatrix; ol.frustumCulled = false; c.ol = ol; scene.add(ol); }   // kayalara da aynı kontur
    });
    const chunkList = Object.values(chunks);

    // Yağan kar: oyuncunun etrafında dönen nokta bulutu
    const flakeN = 420, flakePos = new Float32Array(flakeN * 3);
    for (let i = 0; i < flakeN; i++) { flakePos[i * 3] = rand(-22, 22); flakePos[i * 3 + 1] = rand(0, 18); flakePos[i * 3 + 2] = rand(-22, 22); }
    const flakeGeo = new THREE.BufferGeometry(); flakeGeo.setAttribute('position', new THREE.BufferAttribute(flakePos, 3));
    const flakes = new THREE.Points(flakeGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.26, transparent: true, opacity: 0.9, depthWrite: false, map: (() => { const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d'); const g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.5, 'rgba(255,255,255,.8)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 32); return new THREE.CanvasTexture(c); })() }));
    scene.add(flakes);

    /* ---------- Altın kaynakları ---------- */
    const coinGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.07, 14); coinGeo.rotateX(Math.PI / 2);
    const coinMat = CZ.style.mat({ color: 0xffc020, emissive: 0x3a2600 });
    const drops = [];   // yerdeki tek tek altınlar
    function dropCoins(x, z, n, y) {
      if (water(x, z) || inLake(x, z)) { V.pending += n; return; }
      for (let i = 0; i < n; i++) {
        const m = new THREE.Mesh(coinGeo, coinMat);
        m.position.set(x, (y || 1) + rand(0, 0.5), z);
        scene.add(m);
        const a = rand(0, Math.PI * 2), sp = rand(1.5, 4.5);
        drops.push({ m, vx: Math.cos(a) * sp, vz: Math.sin(a) * sp, vy: rand(4, 7), t: 0 });
      }
    }
    // hediye kutuları
    const giftCols = [0xd8282a, 0x2f9a40, 0x2f5fd8, 0xf2c230, 0x9a4ad0];
    const boxGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2), ribGeo = new THREE.BoxGeometry(1.24, 1.24, 0.22), bowGeo = new THREE.TorusGeometry(0.22, 0.08, 6, 10);
    const ribMat = toon(0xfff2c8);
    const targets = [];
    function spawnBox(big) {
      for (let k = 0; k < 60; k++) {
        const x = rand(-WORLD_R + 3, WORLD_R - 3), z = rand(-WORLD_R + 3, WORLD_R - 3);
        if (!free(x, z, 1) || targets.some(o => Math.hypot(o.x - x, o.z - z) < 3)) continue;
        const g = new THREE.Group();
        if (CZ.gen3d.has('hediye_lo')) { const gm = CZ.gen3d.get('hediye_lo', 1.25, pick([0xffffff, 0xffffff, 0xb8ffb8, 0xb8d8ff, 0xffe0a0])); gm.position.y = -0.6; g.add(gm); } else {
        g.add(new THREE.Mesh(boxGeo, toon(pick(giftCols))));
        const r1 = new THREE.Mesh(ribGeo, ribMat); g.add(r1);
        const r2 = new THREE.Mesh(ribGeo, ribMat); r2.rotation.y = Math.PI / 2; g.add(r2);
        [-1, 1].forEach(sd => { const b = new THREE.Mesh(bowGeo, ribMat); b.position.set(sd * 0.2, 0.68, 0); b.rotation.y = Math.PI / 2; g.add(b); }); }
        const s = big ? 1.5 : rand(0.85, 1.1);
        g.scale.setScalar(s); g.position.set(x, 0.6 * s, z); g.rotation.y = rand(0, 3);
        g.traverse(o => { o.castShadow = true; }); scene.add(g);
        targets.push({ type: 'box', x, z, r: 0.75 * s, hp: big ? 8 : 3, maxHp: big ? 8 : 3, mesh: g, coins: big ? 30 : 8 });
        return;
      }
    }
    // altın yığınları (üstünden geçince toplanır)
    const piles = [];
    const pileGeo = new THREE.ConeGeometry(0.6, 0.55, 9);
    function spawnPile() {
      for (let k = 0; k < 60; k++) {
        const x = rand(-WORLD_R + 3, WORLD_R - 3), z = rand(-WORLD_R + 3, WORLD_R - 3);
        if (!free(x, z, 0.6)) continue;
        const g = new THREE.Group();
        const pm = new THREE.Mesh(pileGeo, coinMat); pm.position.y = 0.28; g.add(pm);
        for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(coinGeo, coinMat); c.rotation.set(Math.PI / 2 + rand(-0.3, 0.3), 0, rand(0, 3)); c.position.set(rand(-0.5, 0.5), 0.05, rand(-0.5, 0.5)); g.add(c); }
        g.position.set(x, 0, z); scene.add(g);
        piles.push({ x, z, mesh: g, value: 6 });
        return;
      }
    }
    // altın yalnız goblinlerden gelir (yerde kutu/yığın yok)
    // mağaradaki hazine sandığı (buz kırılınca)
    const chestG = new THREE.Group();
    chestG.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.6, 1, 1.1), toon(0x8a5228)), 0, 0.5, 0));
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.6, 10, 1, false, 0, Math.PI), toon(0x9a6230)); lid.rotation.z = Math.PI / 2; lid.position.y = 1; chestG.add(lid);
    chestG.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.64, 0.15, 1.14), toon(0xf2c230)), 0, 0.75, 0));
    if (CZ.gen3d.has('sandik_lo')) { chestG.clear(); chestG.add(CZ.gen3d.get('sandik_lo', 1.6)); }
    chestG.position.set(-34.2, 0, -28.6); chestG.rotation.y = -0.75; scene.add(chestG);
    const chest = { type: 'chest', x: -34.2, z: -28.6, r: 1, hp: 6, maxHp: 6, mesh: chestG, coins: 0, gems: 15, locked: true };
    targets.push(chest);

    // ZİBO'NUN GOBLİNLERİ: dışarıdan sonsuz gelir, elinde mızrak, sırtında altın çuvalı.
    // Sana yakınsa sana saldırır; değilse köye yürür, çit varsa çiti döver, yoksa altın çalıp kaçar.
    const goblins = [];
    const spearWood = toon(0x7a4a24), spearTip = toon(0xcfd6e2), sackMat = toon(0x9a6a3a), ropeMat = toon(0xf2c230);
    const spearGeo = new THREE.CylinderGeometry(0.035, 0.035, 1.5, 5), tipGeo2 = new THREE.ConeGeometry(0.08, 0.26, 5), sackGeo = new THREE.SphereGeometry(0.32, 8, 6);
    // Yeni goblin modelleri (yerel yapay zekâ ile üretildi); yoksa eski modele döner. Yürürken zıplar, sersemleyince sallanır.
    const KIND_TINT = { ranged: 0xb9a2ff, bomber: 0xff9a6a, jumper: 0xffe27a, shield: 0xc8b090 };
    function rigGoblin(look, sc, tint) {
      const h = CZ.kk.hero(THREE, look); h.root.scale.setScalar(sc);
      h.root.traverse(o => { if (o.isSkinnedMesh && (o.name === 'GenBody' || h.mx)) { if (h.mx && !tint) return; o.material = o.material.clone(); o.material.color.setHex(tint || 0xb4cc9c); } });   // tepeden güneşte soluk kalmasın: biraz koyu yeşil
      let lastL = 0;
      return { root: h.root, gen: true, rig: true, h, update(dt, o) { h.update(dt, { idle: !o.running }); } , hit() { if (h.throwNow) h.throwNow(); } };
    }
    function goblinBody(boss, tough, kind) {
      const K = CZ.KK_GEN || {}, rig = (CZ.kk.hasMX && CZ.kk.hasMX('goblin') && CZ.kk.hasMX('chief')) || (CZ.gen3d && CZ.gen3d.has(K.goblin) && CZ.gen3d.has(K.chief));
      if (rig) return rigGoblin(boss || tough ? 'chief' : 'goblin', boss ? 2.5 : tough ? 1.5 : kind === 'shield' ? 1.4 : 1.25, kind ? KIND_TINT[kind] : null);
      const id = boss || tough ? 'goblinsef' : 'goblin';
      if (kind && CZ.gen3d && CZ.gen3d.has(id)) return genBody(id, kind === 'shield' ? 1.6 : 1.4, KIND_TINT[kind]);
      if (!CZ.gen3d || !CZ.gen3d.has(id)) { const z = CZ.kk.zibo(THREE, tough ? pick([0x8a3a8a, 0x3a5aa8]) : pick([0x4f9a32, 0x6aa83a, 0x3f8a5a])); z.root.scale.setScalar(boss ? 1.9 : tough ? 1.15 : 0.95); if (boss && z.setCrown) z.setCrown(true); return z; }
      return genBody(id, boss ? 3.2 : tough ? 1.75 : 1.45);
    }
    // Statik modeli yürüt: kalçanın altındaki köşeler (bacaklar) ve yandaki kollar sırayla öne-arkaya salınır.
    // Her gövdenin kendi malzemesi var ama gölgelendirici programı ortak (customProgramCacheKey).
    const WALK_GLSL = `float sd = transformed.x < 0.0 ? 1.0 : -1.0;
            float sw = sin(uPh + (sd > 0.0 ? 0.0 : 3.14159)) * uAmp;
            float leg = clamp((0.36 - transformed.y) / 0.36, 0.0, 1.0);
            transformed.z += sw * leg * 0.26; transformed.y += max(0.0, sw) * leg * 0.05;
            float arm = smoothstep(0.2, 0.34, abs(transformed.x)) * smoothstep(0.42, 0.55, transformed.y) * (1.0 - smoothstep(0.72, 0.8, transformed.y));
            transformed.z -= sw * arm * (0.78 - transformed.y) * 0.7;`;
    function walkMat(body) {
      const U = { uPh: { value: 0 }, uAmp: { value: 0 } };
      body.traverse(o => { if (!o.isMesh) return; o.material = o.material.clone();
        o.material.onBeforeCompile = sh => { sh.uniforms.uPh = U.uPh; sh.uniforms.uAmp = U.uAmp;
          sh.vertexShader = 'uniform float uPh; uniform float uAmp;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
            float sd = transformed.x < 0.0 ? 1.0 : -1.0;
            float sw = sin(uPh + (sd > 0.0 ? 0.0 : 3.14159)) * uAmp;
            float leg = clamp((0.36 - transformed.y) / 0.36, 0.0, 1.0);
            transformed.z += sw * leg * 0.26; transformed.y += max(0.0, sw) * leg * 0.05;
            float arm = smoothstep(0.2, 0.34, abs(transformed.x)) * smoothstep(0.42, 0.55, transformed.y) * (1.0 - smoothstep(0.72, 0.8, transformed.y));
            transformed.z -= sw * arm * (0.78 - transformed.y) * 0.7;`); };
        o.material.customProgramCacheKey = () => 'walk1'; o.material.userData.deform = { U, key: 'walk1', glsl: WALK_GLSL }; });
      return U;
    }
    function genBody(id, hh, tint) {
      const root = new THREE.Group(), body = CZ.gen3d.get(id, hh, tint);
      const U = walkMat(body); root.add(body); let ph = Math.random() * 6, amp = 0;
      return { root, gen: true, update(dt, o) {
        ph += dt * (o.running ? 11 : 3);
        amp += ((o.running ? 1 : 0) - amp) * Math.min(1, dt * 8); U.uPh.value = ph; U.uAmp.value = amp;
        body.position.y = o.running ? Math.abs(Math.sin(ph)) * 0.07 : Math.sin(ph) * 0.02;
        body.rotation.z = o.dizzy ? Math.sin(ph * 2.2) * 0.35 : o.running ? Math.sin(ph) * 0.12 : 0;
        body.rotation.x = o.running ? 0.12 : 0;
      } };
    }
    const pipeGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.6, 6); pipeGeo.rotateX(Math.PI / 2);
    const dartGeo = new THREE.ConeGeometry(0.07, 0.45, 5); dartGeo.rotateX(-Math.PI / 2);
    const dartMat = new THREE.MeshBasicMaterial({ color: 0xff4a3a });
    const darts = [];
    function shootDart(o) {
      const dx = P.x - o.x, dz = P.z - o.z, L = Math.hypot(dx, dz) || 1;
      const m = new THREE.Mesh(dartGeo, dartMat); m.position.set(o.x + dx / L * 0.6, 1.0, o.z + dz / L * 0.6); m.rotation.y = Math.atan2(-dx, -dz); scene.add(m);
      darts.push({ m, dx: dx / L, dz: dz / L, life: 1.2, dmg: o.dmg }); CZ.audio.sfx('throw');
    }
    function dartTick(dt) {
      for (let i = darts.length - 1; i >= 0; i--) { const q = darts[i]; q.m.position.x += q.dx * 13 * dt; q.m.position.z += q.dz * 13 * dt; q.life -= dt;
        const hitP = Math.hypot(q.m.position.x - P.x, q.m.position.z - P.z) < 0.75 && P.down <= 0;
        if (hitP) hurt(q.dmg);
        if (hitP || q.life <= 0 || !free(q.m.position.x, q.m.position.z, 0.1)) { scene.remove(q.m); darts.splice(i, 1); } }
    }
    const bombGeo = new THREE.SphereGeometry(0.32, 10, 8), bombMat = toon(0x22242c), fuseGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.25, 5), fuseMat = new THREE.MeshBasicMaterial({ color: 0xffb030 });
    const shieldGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.12, 12); shieldGeo.rotateX(Math.PI / 2);
    const bossGeo2 = new THREE.SphereGeometry(0.14, 8, 6);
    // Köy gücü: kurduğun her kule ve çit puan katar; dalgalar buna göre güçlenir (köy asla kendi kendine yetmez)
    function vilPower() { let s2 = 0; pads.forEach(p => { if (p.kind === 'v') return; const it = slot(p); if (it && it.lv) s2 += p.kind === 'f' ? it.lv : it.lv * (it.type === 'cannon' ? 2 : 1.5); }); return s2; }
    /* ---------- Goblin kampları: temizle → ganimet (demir, zümrüt), 4 saat sonra daha güçlü geri gelir ---------- */
    const CD = d.vil ? d.vil : (CZ.village ? CZ.village.ensure() : (d.vil = {})); CD.camps = CD.camps || {};
    const camps = campSites.map(([x, z, i]) => {
      const st = CD.camps[i] || (CD.camps[i] = { tier: 1 + (i % 3), until: 0 });
      const g = new THREE.Group(), tents = new THREE.Group(); g.position.set(x, 0, z); g.add(tents);
      const put = (id, hh, px, pz, ry, fb) => { let m; if (CZ.gen3d && CZ.gen3d.has(id)) m = CZ.gen3d.get(id, hh); else m = fb(); m.position.set(px, 0, pz); m.rotation.y = ry; m.traverse(o => { if (o.isMesh) o.castShadow = true; }); tents.add(m); };
      const tentFb = () => { const m = new THREE.Mesh(new THREE.ConeGeometry(1.5, 2.4, 6), toon(0x6a7a3a)); m.position.y = 1.2; const w = new THREE.Group(); w.add(m); return w; };
      [0, 1, 2].forEach(k => { const a = k / 3 * Math.PI * 2 + 0.5; put('g_cadir', 2.6, Math.cos(a) * 3.6, Math.sin(a) * 3.6, -a + Math.PI / 2, tentFb); solids.push({ x: x + Math.cos(a) * 3.6, z: z + Math.sin(a) * 3.6, r: 1.2 }); });
      put('g_totem', 2.8, 0, -1.2, 0, () => { const w = new THREE.Group(); const m = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 2.8, 8), toon(0x8a5a2a)); m.position.y = 1.4; w.add(m); return w; });
      put('g_ates', 1.0, 0, 1.0, 0, () => { const w = new THREE.Group(); const m = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1, 6), new THREE.MeshBasicMaterial({ color: 0xff8a2a })); m.position.y = 0.5; w.add(m); return w; });
      const flag = new THREE.Group(); const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 6), toon(0xd8d8d8)); pole.position.y = 1.3; flag.add(pole);
      const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.7), new THREE.MeshBasicMaterial({ color: 0x3cbe5a, side: THREE.DoubleSide })); cloth.position.set(0.55, 2.2, 0); flag.add(cloth); g.add(flag);
      scene.add(g); outlineWorld(tents, 0.035);
      return { id: i, x, z, st, g, tents, flag, awake: false };
    });
    const campOn = c => !(c.st.until > Date.now());
    function vanish(o) { o.dead = true; scene.remove(o.mesh); if (o.ice) { scene.remove(o.ice); o.ice = null; } if (o.bar) { scene.remove(o.bar.g); o.bar = null; } const ti = targets.indexOf(o); if (ti >= 0) targets.splice(ti, 1); const gi = goblins.indexOf(o); if (gi >= 0) goblins.splice(gi, 1); }
    function campTick() {
      camps.forEach(c => {
        const on = campOn(c); c.tents.visible = on; c.flag.visible = !on;
        if (!on) return;
        const dp = Math.hypot(P.x - c.x, P.z - c.z);
        if (!c.awake && dp < 17 && !V.story && (d.tutV || 0) >= 5) {
          c.awake = true; const T2 = c.st.tier, n = Math.min(11, 2 + T2 * 2);
          for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2; const g = spawnGoblin(k === 0 && T2 >= 4, [c.x + Math.cos(a) * 5, c.z + Math.sin(a) * 5, 'camp']); g.camp = c; g.village = false; g.hp = g.maxHp = Math.round(g.maxHp * (1 + T2 * 0.35)); hpBar(g); }
          floatAt(c, t('camp.wake', { n: T2 }), 'wave'); CZ.audio.sfx('horn'); CZ.audio.vibrate([60, 30, 60]);
        }
        if (!c.awake) return;
        if (dp > 48) { goblins.filter(o => o.camp === c && !o.dead).forEach(vanish); c.awake = false; return; }   // kaçtın: kamp sıfırlanır
        if (!goblins.some(o => o.camp === c && !o.dead)) {
          const T2 = c.st.tier, gold = 80 + T2 * 60, iron = 1 + T2, gems = T2 >= 3 ? 2 : 1;
          gain(gold, true); d.iron = (d.iron || 0) + iron; d.emeralds = (d.emeralds || 0) + gems;
          if (CZ.heroes && Math.random() < 0.35) { const hid = CZ.heroes.randomDrop(2); if (hid) heroUi(); }
          if (CZ.pass) CZ.pass.addXp(25);
          c.st.until = Date.now() + 4 * 3600000; c.st.tier = Math.min(30, T2 + 1); c.awake = false; CD.campsDone = (CD.campsDone || 0) + 1; CZ.state.save(); resUi();
          floatAt(c, t('camp.clear', { g: gold, i: iron, e: gems }), 'wave'); CZ.audio.sfx('win'); CZ.audio.vibrate([80, 40, 120]);
          for (let k = 0; k < 12; k++) { const m = new THREE.Mesh(chipGeo, chipMats['g' + (k % 3)]); m.position.set(c.x, 1, c.z); scene.add(m); chips.push({ m, vx: rand(-5, 5), vy: rand(5, 9), vz: rand(-5, 5) }); }
        }
      });
    }
    function spawnGoblin(boss, at) {
      const tough = boss || Math.random() < Math.min(0.35, V.wave * 0.04);
      // KÖY GÜCÜ büyüdükçe özel goblinler gelir: kule bozan bombacı, çitten atlayan, kalkanlı (kuleler az işler)
      const pw = vilPower(), rr0 = Math.random();
      let kind = null;
      if (!boss && !tough && !(at && at[2] === 'camp')) {
        if (pw >= 6 && rr0 < Math.min(0.22, pw * 0.012)) kind = 'bomber';
        else if (pw >= 8 && rr0 < Math.min(0.36, 0.1 + pw * 0.01)) kind = 'jumper';
        else if (pw >= 12 && rr0 < Math.min(0.5, 0.2 + pw * 0.01)) kind = 'shield';
        else if (V.wave >= 2 && Math.random() < Math.min(0.3, 0.1 + V.wave * 0.025)) kind = 'ranged';   // üfleme borulu goblin
      }
      const ranged = kind === 'ranged';
      const z3 = goblinBody(boss, tough, kind);
      if (ranged) { const pipe = new THREE.Mesh(pipeGeo, spearWood); pipe.position.set(0, 1.0, -0.45); z3.root.add(pipe); }
      if (kind === 'bomber') { const bm = new THREE.Mesh(bombGeo, bombMat); bm.position.set(0, 1.0, 0.45); z3.root.add(bm); const fz = new THREE.Mesh(fuseGeo, fuseMat); fz.position.set(0, 1.42, 0.45); z3.root.add(fz); }
      if (kind === 'shield') { const sh = new THREE.Mesh(shieldGeo, spearWood); sh.position.set(0, 0.8, -0.5); z3.root.add(sh); const bo = new THREE.Mesh(bossGeo2, spearTip); bo.position.set(0, 0.8, -0.58); z3.root.add(bo); }
      // mızrak (sağ elde) ve çuval (sırtta)
      const spear = new THREE.Group();
      spear.add(new THREE.Mesh(spearGeo, spearWood));
      const tp = new THREE.Mesh(tipGeo2, spearTip); tp.position.y = 0.85; spear.add(tp);
      spear.position.set(0.42, 0.75, -0.1); spear.rotation.x = -1.2; if (!z3.gen) z3.root.add(spear);
      if (!z3.gen) { const sack = new THREE.Mesh(sackGeo, sackMat); sack.scale.set(1, 1.15, 0.8); sack.position.set(0, 0.95, 0.38); z3.root.add(sack);
      const rope = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.035, 5, 10), ropeMat); rope.rotation.x = Math.PI / 2; rope.position.set(0, 1.28, 0.38); z3.root.add(rope); }
      // oyuncunun etrafında, ekran dışında doğar (köyün içinde ve nehirde değil)
      let x = 0, z = 0;
      if (at) { x = at[0]; z = at[1]; }
      else for (let k = 0; k < 30; k++) { const a = rand(0, Math.PI * 2), rr = rand(26, 38); x = P.x + Math.cos(a) * rr; z = P.z + Math.sin(a) * rr; if (Math.hypot(x, z) > FENCE_R + 6 && Math.hypot(x, z) < WORLD_R - 3 && !water(x, z)) break; }
      z3.root.position.set(x, 0, z); z3.root.traverse(o => { o.castShadow = true; }); scene.add(z3.root); addOutline(z3.root, 0.02);
      const hp = Math.round((tough ? 5 : 2) + V.wave * 0.3);
      const gb = { type: 'goblin', x, z, r: 0.7, hp, maxHp: hp, mesh: z3.root, z3, spear, coins: Math.round((tough ? 10 : 4) + V.wave * 0.5), stolen: 0, village: V.wave >= 6 && Math.random() < 0.35, vx: 0, vz: 0, think: 0, stun: 0, atk: rand(0.5, 1.2), lunge: 0, speed: (tough ? 2.8 : 3.3) + Math.min(1, V.wave * 0.06), dmg: 1 + Math.floor(V.wave / 8), flee: false };
      gb.kind = kind; gb.hp = gb.maxHp = Math.round(gb.maxHp * (1 + pw * 0.035));
      if (kind === 'bomber') { gb.speed += 0.5; gb.hp = gb.maxHp = Math.max(2, Math.round(gb.maxHp * 0.7)); }
      if (kind === 'jumper') { gb.speed += 0.3; gb.village = true; }
      if (kind === 'shield') { gb.hp = gb.maxHp = Math.round(gb.maxHp * 1.6); gb.speed -= 0.4; }
      if (ranged) { gb.ranged = true; gb.hp = gb.maxHp = Math.max(1, hp - 1); gb.speed -= 0.3; gb.atk = rand(1.5, 2.5); }
      if (boss) { gb.boss = true; gb.hp = gb.maxHp = 30 + V.wave * 4; gb.coins = 80 + V.wave * 6; gb.gems = 3; gb.speed = 2.6; gb.dmg = 3; gb.r = 1.3; gb.village = false; floatAt(P, t('boss.come'), 'wave'); CZ.audio.sfx('horn'); CZ.audio.vibrate([80, 40, 80]); }
      goblins.push(gb); targets.push(gb); hpBar(gb);
      return gb;
    }
    // BÜYÜK BASKIN: her 5 dalgada bir, tek yönden köy gücüne göre kalabalık bir grup gelir. Hepsi düşerse ödül.
    function raidTick(dt) {
      const R0 = V.raid; if (!R0) return;
      if (R0.t > 0) { R0.t -= dt; if (R0.t <= 0) { const n = Math.min(14, 4 + Math.floor(vilPower() / 3) + Math.floor(V.wave / 5));
          for (let k = 0; k < n; k++) { const a = R0.a + rand(-0.35, 0.35), rr = rand(32, 38); let x = Math.cos(a) * rr, z = Math.sin(a) * rr; if (water(x, z)) { x *= 0.92; z *= 0.92; } const g = spawnGoblin(false, [x, z]); g.raid = true; g.village = true; }
          R0.left = n; R0.stolen0 = V.lost || 0; } return; }
      R0.left = goblins.filter(o => o.raid && !o.dead).length;
      if (R0.left === 0) { const clean = (V.lost || 0) === R0.stolen0, prize = Math.round((60 + V.wave * 12 + vilPower() * 6) * (clean ? 1.5 : 1));
        gain(prize, true); if (clean) { d.emeralds = (d.emeralds || 0) + 2; resUi(); }
        floatAt(P, t(clean ? 'siege.clean' : 'siege.won', { n: prize }), 'wave'); CZ.audio.sfx('win'); CZ.audio.vibrate([60, 30, 60]); V.raid = null; raidEl.classList.remove('on'); }
      else raidEl.textContent = t('siege.left', { n: R0.left });
    }

    /* ---------- Savunma: kule yerleri ve çit ---------- */
    const DD = d.vil ? d.vil : (CZ.village ? CZ.village.ensure() : (d.vil = {}));
    if (!DD.def) DD.def = { t: [null, null, null, null, null, null, null, null], f: [null, null, null, null, null, null, null, null] };
    const DS = DD.def;
    // Daire dokusu: kalan kaynakları renkli şeritlerle gösterir
    const padTex = (lines, title) => { const c = document.createElement('canvas'); c.width = 256; c.height = 256; const x = c.getContext('2d');
      x.fillStyle = 'rgba(10,16,40,.6)'; x.beginPath(); x.arc(128, 128, 122, 0, 7); x.fill();
      x.strokeStyle = '#ffd23a'; x.lineWidth = 12; x.setLineDash([22, 14]); x.beginPath(); x.arc(128, 128, 112, 0, 7); x.stroke(); x.setLineDash([]);
      x.textAlign = 'center'; x.fillStyle = '#fff'; x.font = 'bold 26px sans-serif'; if (title) x.fillText(title, 128, 72);
      lines.forEach((ln, k) => { const y = 112 + k * 46; x.fillStyle = RES_COL[ln.r]; x.beginPath(); x.arc(70, y - 10, 15, 0, 7); x.fill(); x.fillStyle = '#fff'; x.font = 'bold 40px sans-serif'; x.textAlign = 'left'; x.fillText(String(ln.n), 96, y + 4); x.textAlign = 'center'; });
      return new THREE.CanvasTexture(c); };
    const pads = [];
    for (let i = 0; i < 8; i++) {
      const a = (i + 0.5) / 8 * Math.PI * 2;
      pads.push({ kind: 't', i, x: Math.cos(a) * PAD_R, z: Math.sin(a) * PAD_R, a, type: i % 2 ? 'cannon' : 'snow' });
      const fa = (i + 0.5) / 8 * Math.PI * 2;
      pads.push({ kind: 'f', i, x: Math.cos(fa) * (FENCE_R + 2.2), z: Math.sin(fa) * (FENCE_R + 2.2), a: fa });
    }
    // KÖYÜ GENİŞLET: çitin dışına dış halka kule yerleri (her genişleme bir tane açar, en fazla 8)
    const OUT_R = 23, EXP_MAX = 8;
    for (let k = 0; k < 8; k++) { const a = (k + 0.5) / 8 * Math.PI * 2; pads.push({ kind: 't', i: 8 + k, outer: k, x: Math.cos(a) * OUT_R, z: Math.sin(a) * OUT_R, a, type: k % 2 ? 'snow' : 'cannon' }); }
    pads.push({ kind: 'x', i: 0, x: 0, z: FENCE_R + 6 });
    const expLv = () => (d.vil && d.vil.exp) || 0;
    // köy seviyesi: her şeyin toplamı (arkadaşlarla yarış için)
    function vilLevel() { let s2 = expLv() * 3; pads.forEach(p => { if (p.kind === 't' || p.kind === 'f') { const it = slot(p); if (it) s2 += it.lv; } }); if (CZ.village && CZ.VB) CZ.VB.forEach(b => { s2 += CZ.village.lv(b.id); }); return s2; }
    // köy binalarının önünde yükseltme daireleri
    if (CZ.VB && CZ.VILLAGE_SPOTS) CZ.VB.forEach(b => { const [sx, sz] = CZ.VILLAGE_SPOTS[b.id]; pads.push({ kind: 'v', id: b.id, x: sx * 0.68, z: sz * 0.68 + (b.id === 'hall' ? 3.4 : 2.6) }); });
    const padGeo = new THREE.PlaneGeometry(2.6, 2.6);
    const scaffoldMat = CZ.style.mat({ color: 0xf2c230 });
    function cannonModel(L) {
      const g = new THREE.Group();
      const st = toon(L >= 3 ? 0x8a8e9e : 0xa89070);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 1.6 + L * 0.2, 8), st); base.position.y = 0.8 + L * 0.1; g.add(base);
      const top = new THREE.Group(); top.position.y = 1.7 + L * 0.2; g.add(top);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.28 + L * 0.03, 0.36 + L * 0.03, 1.6, 10), toon(0x2a2a32)); barrel.rotation.x = Math.PI / 2 - 0.35; barrel.position.set(0, 0.35, -0.4); top.add(barrel);
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.9, 10), toon(0x6a3a1e)); wheel.rotation.z = Math.PI / 2; top.add(wheel);
      g.userData.top = top;
      return g;
    }
    function towerModel(type, L) {
      const gid = type === 'cannon' ? 'topkulesi' : 'kartopukulesi';
      if (CZ.gen3d.has(gid)) { const g = new THREE.Group(); g.add(CZ.gen3d.get(gid, (type === 'cannon' ? 3.0 : 3.8) * (0.85 + L * 0.08))); return g; }
      if (type === 'cannon') return cannonModel(L);
      const g = CZ.villageModel ? CZ.villageModel(THREE, 'tower', Math.max(1, L * 2)) : new THREE.Group();
      g.scale.setScalar(0.8);
      return g;
    }
    function fenceModel(i, L) {
      const g = new THREE.Group();
      const a0 = i / 8 * Math.PI * 2, a1 = (i + 1) / 8 * Math.PI * 2;
      const stone = L >= 2;
      const mat = toon(stone ? 0x8c8884 : 0x8a5a2e), geo = stone ? new THREE.BoxGeometry(1.1, 1.3 + L * 0.2, 0.6) : new THREE.CylinderGeometry(0.17, 0.2, 1.5, 6);
      const n = 12;
      for (let k = 0; k <= n; k++) {
        const a = a0 + (a1 - a0) * k / n;
        const m = new THREE.Mesh(geo, mat); m.position.set(Math.cos(a) * FENCE_R, stone ? 0.65 : 0.75, Math.sin(a) * FENCE_R); m.rotation.y = -a + Math.PI / 2; m.castShadow = true; g.add(m);
        if (!stone && k % 3 === 0) { const tip = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.35, 6), mat); tip.position.set(m.position.x, 1.65, m.position.z); g.add(tip); }
      }
      if (!stone) [0.5, 1.1].forEach(y => { for (let k = 0; k < n; k++) { const a = a0 + (a1 - a0) * (k + 0.5) / n; const rail = new THREE.Mesh(new THREE.BoxGeometry(FENCE_R * (a1 - a0) / n + 0.1, 0.12, 0.08), mat); rail.position.set(Math.cos(a) * FENCE_R, y, Math.sin(a) * FENCE_R); rail.rotation.y = -a + Math.PI / 2; g.add(rail); } });
      return g;
    }
    const slot = p => (p.kind === 'v' || p.kind === 'x') ? null : DS[p.kind][p.i];
    const defOf = p => DEF[p.kind === 'f' ? 'fence' : p.type];
    // bir sonraki seviyenin maliyeti ve ödenen kısım
    const VIL_COST = id => { const pr = CZ.village.price(id, CZ.village.lv(id)); return { wood: Math.round(pr * 0.09 / 5) * 5, stone: Math.round(pr * 0.07 / 5) * 5, gold: Math.round(pr * 0.3 / 10) * 10 }; };
    function need(p) {
      if (p.kind === 'x') { const L = expLv(); return L >= EXP_MAX ? null : { stone: 120 + L * 90, brick: 6 + L * 6, gold: 250 + L * 250 }; }
      if (p.kind === 'v') { const L = CZ.village.lv(p.id); if (L >= CZ.village.def(p.id).max) return null; return VIL_COST(p.id); }
      const it = slot(p), D2 = defOf(p), L = it ? it.lv : 0;
      if (it && it.job) return null;
      return D2.cost[L] || null;
    }
    const paidKey = p => p.kind === 'v' ? 'v' + p.id : p.kind + p.i;
    const paid = p => { DS.pp = DS.pp || {}; return DS.pp[paidKey(p)] || (DS.pp[paidKey(p)] = { wood: 0, stone: 0, gold: 0 }); }; const pd0 = p => { const q = paid(p); RES.forEach(r2 => { q[r2] = q[r2] || 0; }); return q; };
    const left = p => { const n = need(p); if (!n) return null; const pd = pd0(p); return RES.map(r2 => ({ r: r2, n: Math.max(0, (n[r2] || 0) - pd[r2]) })).filter(x => (n[x.r] || 0) > 0); };
    function jobLeft(it) { return it && it.job ? Math.max(0, it.job.end - Date.now()) : 0; }
    function finishJob(p) { const it = slot(p); if (!it || !it.job) return; it.lv = it.job.to; it.job = null; CZ.state.save(); drawPad(p); CZ.audio.sfx('win'); floatAt(p, t('def.ready')); }
    // daire nerede durur: kule kurulduysa kulenin dışına kayar
    const markPos = p => { if (p.kind === 't' && slot(p)) return [Math.cos(p.a) * (PAD_R + 2.8), Math.sin(p.a) * (PAD_R + 2.8)]; return [p.x, p.z]; };
    // daireler yavaş yavaş açılır (Kingshot gibi): önce 2 kule yeri, kule kurdukça yenisi, sonra çit, görevler bitince köy binaları
    function padVisible(p) {
      if ((d.tutV || 0) < 1) return false;   // Zibo kovalamacası bitene kadar daire yok
      const built = DS.t.filter(Boolean).length;
      if (p.kind === 't' && p.outer != null) return !!slot(p) || expLv() > p.outer;
      if (p.kind === 'x') return (d.tutV || 0) >= 5 && built >= 3 && expLv() < EXP_MAX;
      if (p.kind === 't') return !!slot(p) || p.i < 2 + built;
      if (p.kind === 'f') return !!slot(p) || built >= 1;
      if ((d.tutV || 0) < 5) return false;
      const VV = CZ.village.ensure();   // köy binası: işçi boşsa ve meydan izin veriyorsa
      return !VV.job && CZ.village.lv(p.id) < CZ.village.cap(p.id) && CZ.village.lv(p.id) < CZ.village.def(p.id).max;
    }
    function drawMark(p) {
      if (p.mark) { scene.remove(p.mark); p.mark.material.map.dispose(); p.mark.material.dispose(); p.mark = null; }
      if (!padVisible(p)) return;
      const L2 = left(p);
      if (!L2 || !L2.length) return;
      let title = '';
      if (p.kind === 'x') title = t('exp.title');
      else if (p.kind === 'v') { const lv = CZ.village.lv(p.id); title = (lv ? t('vil.lv', { n: lv + 1 }) : t('vil.build')); if (CZ.village.ensure().job || lv >= CZ.village.cap(p.id)) title = '🔒'; }
      else { const it = slot(p); title = it ? t('vil.lv', { n: it.lv + 1 }) : (p.kind === 'f' ? t('def.fence') : t('def.' + p.type)); }
      p.mark = new THREE.Mesh(padGeo, new THREE.MeshBasicMaterial({ map: padTex(L2, title), transparent: true, depthWrite: false }));
      const [mx, mz] = markPos(p);
      p.mark.rotation.x = -Math.PI / 2; p.mark.position.set(mx, 0.06, mz); p.mark.renderOrder = 2; if (p.kind === 'v') p.mark.scale.setScalar(0.8); scene.add(p.mark);
    }
    function drawPad(p) {
      drawMark(p);
      if (p.kind === 'v' || p.kind === 'x') return;
      const it = slot(p);
      if (p.g) { scene.remove(p.g); p.g = null; }
      if (p.barG) { scene.remove(p.barG); p.barG = null; }
      const building = it && it.job;
      if (!it) { if (p.kind === 'f') { p.hp = 0; } return; }
      const lv = building && it.lv === 0 ? 1 : it.lv;
      p.g = p.kind === 'f' ? fenceModel(p.i, lv) : towerModel(p.type, lv);
      if (p.kind === 't') p.g.position.set(p.x, 0, p.z);
      outlineWorld(p.g, 0.03);
      if (building) {
        // inşaat: hemen görünür ama yarı saydam + iskele
        p.g.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.45; } });
        const sc = new THREE.Group();
        const cx = p.kind === 'f' ? Math.cos(p.a) * FENCE_R : p.x, cz = p.kind === 'f' ? Math.sin(p.a) * FENCE_R : p.z;
        [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]].forEach(([x, z]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.14, 3.4, 0.14), scaffoldMat); m.position.set(cx + x, 1.7, cz + z); sc.add(m); });
        if (p.kind === 't') { sc.position.sub(p.g.position); }
        p.g.add(sc);
        const bar = new THREE.Group();
        const bg = new THREE.Mesh(barGeo, barBg); bg.scale.set(2.2, 1.4, 1); bar.add(bg);
        const fg = new THREE.Mesh(barGeo, new THREE.MeshBasicMaterial({ color: 0x4ab0ff, depthTest: false, transparent: true })); fg.scale.set(2.1, 0.9, 1); fg.position.z = 0.01; bar.add(fg);
        bar.renderOrder = 8; bg.renderOrder = 8; fg.renderOrder = 9;
        bar.position.set(cx, 4, cz); scene.add(bar); p.barG = bar; p.barFg = fg;
      }
      scene.add(p.g);
      if (p.kind === 'f') p.hp = p.hpMax = DEF.fence.hp + DEF.fence.hpUp * (it.lv - 1);
      p.pop = 0.35;
    }
    // KAYNAK AKIŞI: oyuncu dairenin üstündeyken her an biraz kaynak daireye akar
    const flyGeo = new THREE.BoxGeometry(0.22, 0.22, 0.22);
    const flyMats = { plank: toon(0xe0a860), brick: toon(0xd0503a), iron: toon(0xcfd8e6), wood: toon(0xb8763a), stone: toon(0x9aa3b4), gold: new THREE.MeshLambertMaterial({ color: 0xffc928, emissive: 0x5a3a00 }) };
    const flies = [];
    function flowTick(p, dt) {
      const n = need(p); if (!n) return;
      if (p.kind === 'v') { const V2 = CZ.village.ensure(); if (V2.job || CZ.village.lv(p.id) >= CZ.village.cap(p.id)) { if (!V.lockHint) { V.lockHint = true; floatAt(P, V2.job ? t('vil.busy') : t('vil.needHall', { n: Math.ceil((CZ.village.lv(p.id) + 1) / 2) }), 'wave'); setTimeout(() => { if (V) V.lockHint = false; }, 2500); } return; } }
      const pd = pd0(p); let moved = 0, lacking = false;
      const [mx, mz] = markPos(p);
      RES.forEach(r2 => {
        const rest = (n[r2] || 0) - pd[r2]; if (rest <= 0) return;
        const have = Math.floor(d[r2] || 0); if (have <= 0) { lacking = true; return; }
        const amt = Math.min(rest, have, Math.max(1, Math.ceil((n[r2] || 0) * dt * 1.4)));
        d[r2] = have - amt; pd[r2] += amt; moved += amt;
        if (Math.random() < 0.7) { const m = new THREE.Mesh(flyGeo, flyMats[r2]); m.position.set(P.x, 1.2, P.z); scene.add(m); flies.push({ m, t: 0, tx: mx, tz: mz, sx: P.x, sz: P.z }); }
      });
      if (moved) { resUi(); V.flowSfx = (V.flowSfx || 0) - dt; if (V.flowSfx <= 0) { V.flowSfx = 0.12; CZ.audio.sfx('coin', 3); } p.dirty = true; }
      else if (lacking && !V.lackHint) { V.lackHint = true; floatAt(P, t('def.lacking'), 'wave'); setTimeout(() => { if (V) V.lackHint = false; }, 3000); }
      if (left(p).every(x => x.n <= 0)) complete(p);
    }
    function complete(p) {
      delete DS.pp[paidKey(p)];
      if (p.kind === 'x') { d.vil.exp = expLv() + 1; floatAt(p, t('exp.done'), 'wave'); CZ.audio.sfx('win'); pads.forEach(drawMark); }
      else if (p.kind === 'v') { CZ.village.startJob(p.id); floatAt(p, t('def.building'), 'wave'); pads.forEach(drawMark); }
      else {
        const it = slot(p), D2 = defOf(p);
        if (!it) DS[p.kind][p.i] = { type: p.kind === 'f' ? 'fence' : p.type, lv: 0, job: { to: 1, end: Date.now() + D2.min[0] * 60000 } };
        else it.job = { to: it.lv + 1, end: Date.now() + D2.min[it.lv] * 60000 };
        if (V.tut) V.tut.on('build');
      }
      CZ.state.save(); CZ.audio.sfx('buy'); CZ.audio.vibrate([30, 20, 50]);
      drawPad(p); pads.forEach(q => { if (q !== p) drawMark(q); }); padUi(true);
    }
    function rushGold(p) {
      const it = slot(p); const c = it.lv === 0 ? RUSH_BUILD : rushPrice(jobLeft(it));
      if ((d.gold || 0) < c) { CZ.audio.sfx('wrong'); CZ.ui.toast(t('chars.goldShort', { n: c - (d.gold || 0) })); return; }
      d.gold -= c; resUi(); finishJob(p); padUi(true);
    }
    function rushAd(p) { CZ.ads.show(() => { if (V && slot(p) && slot(p).job) { finishJob(p); padUi(true); } }); }

    /* ---------- Oyuncu ve binek ---------- */
    const P = { x: 2.5, z: 6.5, dir: Math.PI, riding: false, vx: 0, vz: 0, hp: 12, maxHp: 12, hurtT: 0, down: 0 };
    const hero = CZ.kk.hero(THREE, d.avatar || 'girl');
    if (hero.setWeapon) hero.setWeapon(W.id);
    hero.root.traverse(o => { o.castShadow = true; }); scene.add(hero.root); addOutline(hero.root, 0.02);
    const HS = 1.35; hero.root.scale.setScalar(HS);
    const heroShadow = new THREE.Mesh(new THREE.CircleGeometry(0.45, 16), new THREE.MeshBasicMaterial({ color: 0x0a1030, transparent: true, opacity: 0.25, depthWrite: false }));
    heroShadow.rotation.x = -Math.PI / 2; heroShadow.position.y = 0.02; scene.add(heroShadow);
    const mountDef = CZ.MOUNTS.find(m => m.id === (d.mount || 'brown')) || CZ.MOUNTS[0];
    const mount = quadruped(THREE, mountDef);
    const M = { x: 5.5, z: 3.8, dir: Math.PI, speed: 0 };
    mount.root.position.set(M.x, 0, M.z); mount.root.traverse(o => { if (o.geometry && o.geometry.type !== 'CircleGeometry') o.castShadow = true; }); scene.add(mount.root); outlineWorld(mount.root, 0.025);   // (bacaklar gölgelendiricide oynadığı için dış çizgi yok)
    // MİLA: köyün bekçisi. Kendi bineği Işıltı (satılmaz). Sen yokken köyü o korur; sen varken dinlenir ama köye giren goblini vurur.
    const MILA = { x: -1.6, z: 9.5, dir: 0, cd: 0, say: null };
    const milaMount = quadruped(THREE, { id: 'aurora', kind: 'deer', color: 0xfff0fa, light: 0xffc8e8, speed: 9 });
    const milaHero = CZ.kk.hero(THREE, (CZ.kk.hasMX && CZ.kk.hasMX('mila')) || (CZ.gen3d && CZ.gen3d.has('t_mila')) ? 'mila' : (d.avatar === 'elf' ? 'girl' : 'elf'));
    milaHero.root.scale.setScalar(1.35);
    milaMount.root.position.set(MILA.x, 0, MILA.z); milaMount.root.rotation.y = Math.PI * 0.85;
    milaMount.root.traverse(o => { if (o.isMesh) o.castShadow = true; }); milaHero.root.traverse(o => { o.castShadow = true; });
    scene.add(milaMount.root, milaHero.root); addOutline(milaHero.root, 0.02); addOutline(milaMount.root, 0.012);
    solids.push({ x: MILA.x, z: MILA.z, r: 1.1 });
    const bubble = h('div', { class: 'mila-bubble' }, h('b', { text: 'Mila' }), h('span'));

    // ===================== KAHRAMAN: yanında koşan yardımcı (Rudi odun keser, Ela taş kırar, Buzbaş dondurur, Demir dövüşür, Noel Baba hediye bombası atar)
    const BUD = { id: null, hero: null, x: 0, z: 0, cd: 1, act: 0, task: null, dir: 0 };
    function spawnBuddy() {
      if (BUD.hero) { scene.remove(BUD.hero.root); BUD.hero = null; }
      BUD.id = CZ.heroes ? CZ.heroes.buddy() : null;
      if (!BUD.id) return;
      const H = CZ.heroes.def(BUD.id);
      const KG = CZ.KK_GEN || {};
      if ((CZ.kk.hasMX && CZ.kk.hasMX('hero_' + BUD.id)) || (KG['hero_' + BUD.id] && CZ.gen3d && CZ.gen3d.has(KG['hero_' + BUD.id]))) { BUD.hero = CZ.kk.hero(THREE, 'hero_' + BUD.id); BUD.hero.root.scale.setScalar(1.3); }
      else if (CZ.gen3d && CZ.gen3d.has('h_' + BUD.id)) {   // kahramana özel 3D model: zıplayarak yürür, yetenekte öne atılır
        const gb = genBody('h_' + BUD.id, 1.95); let kick = 0;
        BUD.hero = { root: gb.root, throwNow() { kick = 0.25; }, update(dt, o) { gb.update(dt, { running: !o.idle }); kick = Math.max(0, kick - dt); gb.root.children[0].rotation.x = (o.idle ? 0 : 0.12) + Math.sin(kick / 0.25 * Math.PI) * 0.35; } };
      } else { BUD.hero = CZ.kk.hero(THREE, H.look); BUD.hero.root.scale.setScalar(1.25); }
      BUD.hero.root.traverse(o => { o.castShadow = true; }); scene.add(BUD.hero.root); addOutline(BUD.hero.root, 0.02);
      BUD.x = P.x + 1.6; BUD.z = P.z + 1.2; BUD.cd = 1.5; BUD.task = null;
    }
    function budChop(it) {   // ağaç/kaya kesme (oyuncununkiyle aynı kurallar)
      const L = CZ.heroes.lv(BUD.id), res = it.kind === 'tree' ? 'wood' : 'stone';
      it.hp -= 2; if (it.kind === 'tree') { it.tilt = 0.14; setInst(it); }
      let n = 1 + Math.ceil(L / 2);
      for (let k = 0; k < 3; k++) { const m = new THREE.Mesh(chipGeo, chipMats[it.kind]); m.position.set(it.x, it.kind === 'tree' ? 1.1 : 0.7, it.z); scene.add(m); chips.push({ m, vx: rand(-3, 3), vy: rand(3, 6), vz: rand(-3, 3) }); }
      CZ.audio.sfx(it.kind === 'tree' ? 'hit' : 'crack');
      if (it.hp <= 0) { n += 8; it.alive = false; it.solid.off = true; setInst(it); BUD.task = null;
        setTimeout(() => { if (!V) return; if (Math.hypot(it.x - P.x, it.z - P.z) < 2) return; it.alive = true; it.hp = it.maxHp; it.solid.off = false; setInst(it); }, rand(70000, 110000)); }
      d[res] = (d[res] || 0) + n; resUi(); floatAt(it, '+' + n + (res === 'wood' ? ' 🪵' : ' 🪨'), 'auto');
    }
    function buddyUpd(dt) {
      if (!BUD.hero) return;
      const H = CZ.heroes.def(BUD.id), L = CZ.heroes.lv(BUD.id);
      BUD.cd -= dt; BUD.act -= dt;
      const dP = Math.hypot(BUD.x - P.x, BUD.z - P.z);
      if (dP > 24) { BUD.x = P.x + 1.5; BUD.z = P.z + 1.5; BUD.task = null; }
      // görev seç
      const nearGob = rr => { let b = null, bd = rr; goblins.forEach(o => { if (o.dead) return; const dd = Math.hypot(o.x - BUD.x, o.z - BUD.z); if (dd < bd && Math.hypot(o.x - P.x, o.z - P.z) < 12) { bd = dd; b = o; } }); return b; };
      if (BUD.task && (BUD.task.dead || BUD.task.alive === false || Math.hypot(BUD.task.x - P.x, BUD.task.z - P.z) > 13)) BUD.task = null;
      if (!BUD.task && (H.role === 'wood' || H.role === 'stone')) {
        let b = null, bd = 9; chunkList.forEach(c => { if (Math.hypot(c.cx - P.x, c.cz - P.z) > CH + 6) return; c.items.forEach(it => { if (!it.alive || it.kind !== (H.role === 'wood' ? 'tree' : 'rock')) return; const dd = Math.hypot(it.x - P.x, it.z - P.z); if (dd < bd && dd > 1.6) { bd = dd; b = it; } }); });
        BUD.task = b;
      }
      if (H.role === 'fight') BUD.task = nearGob(10);
      // hareket: görev varsa ona, yoksa oyuncunun arkasına
      let tx, tz, stopAt;
      if (BUD.task) { tx = BUD.task.x; tz = BUD.task.z; stopAt = (BUD.task.solid ? BUD.task.solid.r : 0.5) + 0.9; }
      else { const a = P.dir + 0.6; tx = P.x + Math.sin(a) * 2.2; tz = P.z + Math.cos(a) * 2.2; stopAt = 0.6; }
      const dx = tx - BUD.x, dz = tz - BUD.z, dd = Math.hypot(dx, dz);
      let moving = false;
      if (dd > stopAt) { const sp = Math.min(dd * 3, P.riding ? 13 : 9) * dt; let [nx, nz] = collide(BUD.x + dx / dd * sp, BUD.z + dz / dd * sp, 0.4); if (water(nx, nz)) { nx = BUD.x; nz = BUD.z; } const mv = Math.hypot(nx - BUD.x, nz - BUD.z); BUD.stk = mv < sp * 0.2 ? (BUD.stk || 0) + dt : 0; if (BUD.stk > 1.2 && dP > 5) { const a2 = P.dir + 0.6; nx = P.x + Math.sin(a2) * 2; nz = P.z + Math.cos(a2) * 2; BUD.task = null; BUD.stk = 0; } BUD.x = nx; BUD.z = nz; BUD.dir = Math.atan2(-dx, -dz); moving = mv > 0.005; }
      else if (BUD.task) BUD.dir = Math.atan2(-dx, -dz);
      // yetenekler
      if (BUD.task && dd <= stopAt + 0.2 && BUD.cd <= 0) {
        if (H.role === 'wood' || H.role === 'stone') { BUD.cd = Math.max(0.5, 1.1 - L * 0.05); budChop(BUD.task); if (BUD.hero.throwNow) BUD.hero.throwNow(); }
        else if (H.role === 'fight') { BUD.cd = Math.max(0.45, 0.9 - L * 0.04); hit(BUD.task, 2 + L * 0.8, true); CZ.audio.sfx('slash'); if (BUD.hero.throwNow) BUD.hero.throwNow(); }
      }
      if (H.role === 'freeze' && BUD.cd <= 0) {
        const g = nearGob(8);
        if (g) { BUD.cd = Math.max(3, 6.5 - L * 0.3); goblins.forEach(o => { if (!o.dead && Math.hypot(o.x - BUD.x, o.z - BUD.z) < 5.5 + L * 0.2) { hit(o, 1 + L * 0.4, true); o.stun = Math.max(o.stun || 0, 1.4 + L * 0.12); o.frozen = o.stun; iceOn(o); } }); ringFx(BUD.x, BUD.z, 5.5 + L * 0.2, 0x9adcff); CZ.audio.sfx('freeze'); CZ.audio.vibrate(25); if (BUD.hero.throwNow) BUD.hero.throwNow(); }
      }
      if (H.role === 'gift' && BUD.cd <= 0) {
        const g = nearGob(10);
        if (g) { BUD.cd = Math.max(3, 7 - L * 0.3); const m = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), toon(pick([0xe0302e, 0x2fa040, 0x2f6fd8]))); m.position.set(BUD.x, 2.2, BUD.z); scene.add(m); tshots.push({ m, o: g, type: 'cannon', gift: true, dmg: 3 + L, sp: 14, t: 0 }); CZ.audio.sfx('throw'); if (BUD.hero.throwNow) BUD.hero.throwNow(); }
      }
      BUD.hero.root.position.set(BUD.x, 0, BUD.z); BUD.hero.root.rotation.y = BUD.dir;
      BUD.hero.update(dt, { idle: !moving, speed: moving ? 8 : 0 });
    }

    // nişan göstergesi (yerde ok)
    const aimTex = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 256; const x = c.getContext('2d'); const gr = x.createLinearGradient(0, 256, 0, 0); gr.addColorStop(0, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,.95)'); x.fillStyle = gr; x.fillRect(16, 40, 32, 216); x.beginPath(); x.moveTo(0, 48); x.lineTo(32, 0); x.lineTo(64, 48); x.fill(); return new THREE.CanvasTexture(c); })();
    const aim = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 10), new THREE.MeshBasicMaterial({ map: aimTex, color: 0xffd84a, transparent: true, depthWrite: false, depthTest: false })); aim.renderOrder = 5;
    aim.rotation.x = -Math.PI / 2; aim.visible = false; scene.add(aim);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.85, 1.1, 24), new THREE.MeshBasicMaterial({ color: 0xffe27a, transparent: true, opacity: 0.9, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.visible = false; scene.add(ring);
    const rangeRing = new THREE.Mesh(new THREE.RingGeometry(RANGE - 0.12, RANGE, 64), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false, depthTest: false }));
    rangeRing.rotation.x = -Math.PI / 2; rangeRing.renderOrder = 4; rangeRing.visible = false; scene.add(rangeRing);

    /* ---------- Mermiler ---------- */
    const shots = [];
    const ballGeo = new THREE.SphereGeometry(0.22, 10, 8);
    const arrowGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.1, 6); arrowGeo.rotateX(Math.PI / 2);
    const tipGeo = new THREE.ConeGeometry(0.1, 0.25, 6); tipGeo.rotateX(-Math.PI / 2);
    const ballMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(W.ball || '#f4fbff') });
    const trails = [], trailMat = new THREE.MeshBasicMaterial({ color: 0xdff4ff, transparent: true, opacity: 0.5, depthWrite: false });
    function trailTick(dt) { for (let i = trails.length - 1; i >= 0; i--) { const q = trails[i]; q.t += dt; q.m.scale.setScalar(Math.max(0.01, 0.6 - q.t * 2.6)); if (q.t > 0.22) { scene.remove(q.m); trails.splice(i, 1); } } }
    function fire(dx, dz) {
      if (V.cool > 0) return;
      V.cool = Math.max(0.12, (0.42 - W.dmg * 0.025) * B.cool * Math.pow(0.95, powLv()));
      const L2 = Math.hypot(dx, dz) || 1; dx /= L2; dz /= L2;
      P.dir = Math.atan2(-dx, -dz);
      let m;
      m = new THREE.Mesh(ballGeo, ballMat);   // elde ne varsa o atılır (binekte de)
      m.position.set(P.x + dx * 0.6, P.riding ? mount.seatY + 1.1 : 1.2, P.z + dz * 0.6);
      scene.add(m);
      const sp2 = P.riding ? 30 : 24; shots.push({ m, dx, dz, life: (RANGE + 0.8) / sp2, sp: sp2, ph: Math.random() * 6, y0: m.position.y });
      if (hero.throwNow) hero.throwNow();
      CZ.audio.sfx('throw');
    }
    function nearestTarget(maxD) {
      let best = null, bd = maxD;
      targets.forEach(o => { if (o.dead || (o.locked)) return; const dd = Math.hypot(o.x - P.x, o.z - P.z); if (dd < bd) { bd = dd; best = o; } });
      if (!ice.alive) return best;
      return best;
    }
    const barBg = new THREE.MeshBasicMaterial({ color: 0x1a2040, depthTest: false, transparent: true, opacity: 0.8 });
    const barFg = new THREE.MeshBasicMaterial({ color: 0x4ade6a, depthTest: false, transparent: true });
    const barGeo = new THREE.PlaneGeometry(1, 0.24);
    function hpBar(o) {
      if (!o.bar) {
        const g = new THREE.Group();
        const bg = new THREE.Mesh(barGeo, barBg); bg.scale.set(1.7, 1.25, 1); g.add(bg);
        const fg = new THREE.Mesh(barGeo, barFg.clone()); fg.scale.set(1.62, 0.85, 1); fg.position.z = 0.01; g.add(fg);
        g.renderOrder = 6; bg.renderOrder = 6; fg.renderOrder = 7;
        scene.add(g); o.bar = { g, fg };
      }
      const k = Math.max(0, o.hp / o.maxHp);
      o.bar.fg.scale.x = 1.62 * k; o.bar.fg.position.x = -0.81 * (1 - k);
      o.bar.fg.material.color.setHex(k > 0.5 ? 0x4ade6a : k > 0.25 ? 0xffc928 : 0xff4a4a);
    }
    function hit(o, dmg, byTower) {
      if (byTower && o.kind === 'shield') { dmg = Math.max(0.5, Math.round(dmg * 0.4 * 10) / 10); }   // kalkan kuleleri durdurur: onu sen yenmelisin
      o.hp -= dmg;
      hpBar(o);
      floatAt(o, '-' + dmg, 'dmg');
      if (o.mesh) { if (!o.base) o.base = o.mesh.scale.x; o.mesh.scale.set(o.base * 1.28, o.base * 0.82, o.base * 1.28); o.flash = 0.12; }
      if (o.type === 'goblin') { for (let k = 0; k < 4; k++) { const m = new THREE.Mesh(chipGeo, chipMats.ice); m.position.set(o.x, 1.1, o.z); scene.add(m); chips.push({ m, vx: rand(-3.5, 3.5), vy: rand(3, 6), vz: rand(-3.5, 3.5) }); } if (!byTower) CZ.audio.vibrate(12); }
      CZ.audio.sfx(o.type === 'goblin' || o.type === 'zibo' ? 'hit' : 'crack');
      if (o.type === 'zibo' && V.story) V.story.ziboHit(o);
      if (o.type === 'goblin') { o.stun = 0.6; const kx = o.x - P.x, kz = o.z - P.z, kl = Math.hypot(kx, kz) || 1, push = o.boss ? 0.25 : 0.9; const [nx2, nz2] = collide(o.x + kx / kl * push, o.z + kz / kl * push, 0.45); if (!water(nx2, nz2)) { o.x = nx2; o.z = nz2; } V.shake = Math.max(V.shake || 0, o.boss ? 0.18 : 0.08); }
      if (o.hp <= 0) kill(o, byTower);
    }
    function kill(o, byTower) {
      if (o.type === 'zibo') return V.story && V.story.ziboDown(o);
      o.dead = true;
      if (o.bar) { scene.remove(o.bar.g); o.bar.fg.material.dispose(); o.bar = null; }
      scene.remove(o.mesh); if (o.ice) { scene.remove(o.ice); o.ice = null; }
      let total = o.coins + (o.stolen || 0);
      if (o.type === 'goblin' && BUD.id === 'noel') total = Math.round(total * (1.05 + CZ.heroes.lv('noel') * 0.02));
      if (o.type === 'goblin' && CZ.heroes && (d.tutV || 0) >= 5) { const sh = o.boss ? 4 : (Math.random() < 0.03 ? 1 : 0); if (sh) { const hid = CZ.heroes.randomDrop(sh); if (hid) { setTimeout(() => { if (V) floatAt(o, t('hero.shardGot', { n: sh, name: t('hero.n.' + hid) }), 'wave'); }, o.boss ? 900 : 0); heroUi(); } } }
      if (o.type === 'goblin' && CZ.pass) CZ.pass.addXp(3);
      if (o.type === 'goblin' && V.tut) V.tut.on('goblin');
      if (o.boss) { d.emeralds = (d.emeralds || 0) + o.gems; resUi(); floatAt(o, t('boss.down', { n: o.gems }), 'wave'); CZ.audio.vibrate([60, 30, 120]); }
      if (byTower) { gain(total, true); floatAt(o, '+' + total, 'auto'); CZ.audio.sfx('coin'); V.kills++; }   // kule vurdu: altın kendiliğinden kasaya
      else {
        dropCoins(o.x, o.z, Math.round(total / (o.type === 'chest' ? 4 : 2)), 1.2);
        V.pending += total - Math.round(total / (o.type === 'chest' ? 4 : 2));   // kalanı doğrudan
        if (o.type === 'goblin') V.kills++;
      }
      bump(total);
      if (o.type === 'goblin' && !byTower) { CZ.audio.sfx('win'); floatAt(o, t('valley.sack', { n: total })); }
      if (o.type === 'chest' && o.gems) { d.emeralds = (d.emeralds || 0) + o.gems; resUi(); CZ.audio.sfx('win'); floatAt(o, '+' + o.gems + ' 💎'); CZ.audio.vibrate([40, 30, 80]); }
      const i = targets.indexOf(o); if (i >= 0) targets.splice(i, 1);
      if (o.type === 'box') setTimeout(() => { if (V) spawnBox(Math.random() < 0.1); }, rand(12000, 22000));
      if (o.type === 'goblin') { const j = goblins.indexOf(o); if (j >= 0) goblins.splice(j, 1); }
    }

    /* ---------- Arayüz ---------- */
    const goldEl = h('b', { text: String(d.gold || 0) }), woodEl = h('b', { text: '0' }), stoneEl = h('b', { text: '0' }), gemEl = h('b', { text: '0' });
    const timeEl = h('b', { class: 'vl-time', text: t('def.wave', { n: 1 }) });
    const raidEl = h('div', { class: 'vl-raid' });
    const GIFT_DUR = 240000;
    const giftBtn = h('button', { type: 'button', class: 'vl-gift' }, h('i', { text: '🎁' }), h('b'));
    const giftK = () => { if (!d.giftAt) d.giftAt = Date.now(); return Math.min(1, (Date.now() - d.giftAt) / GIFT_DUR); };
    function giftUi() { const k = giftK(); giftBtn.style.setProperty('--k', (k * 360) + 'deg'); giftBtn.classList.toggle('full', k >= 1); giftBtn.lastChild.textContent = k >= 1 ? t('gift.open') : Math.ceil((1 - k) * GIFT_DUR / 1000) + 's'; giftBtn.style.display = (d.tutV || 0) >= 5 ? '' : 'none'; }
    giftBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (giftK() < 1) { d.giftAt -= 4000; CZ.audio.sfx('poke'); CZ.audio.vibrate(8); giftBtn.classList.remove('tap'); void giftBtn.offsetWidth; giftBtn.classList.add('tap'); giftUi(); return; }   // dokundukça 4 sn hızlanır
      d.giftAt = Date.now(); const r = Math.random(); let msg;
      if (r < 0.08) { d.emeralds = (d.emeralds || 0) + 1; msg = '+1 💎'; CZ.ui.fly(giftBtn, 'emerald', 1); }
      else if (r < 0.25) { d.plank = (d.plank || 0) + 2; d.brick = (d.brick || 0) + 1; msg = '+2 ' + t('mat.plank') + ' +1 ' + t('mat.brick'); }
      else if (r < 0.55) { d.wood = (d.wood || 0) + 30; d.stone = (d.stone || 0) + 20; msg = '+30 ' + t('mat.wood') + ' +20 ' + t('mat.stone'); }
      else { const g = 40 + Math.round(Math.random() * 60) + V.wave * 5; gain(g, true); msg = '+' + g; CZ.ui.fly(giftBtn, 'gold', g); }
      CZ.state.save(); resUi(); giftUi(); floatAt(P, msg, 'wave'); CZ.audio.sfx('win'); CZ.audio.vibrate([30, 20, 60]);
    });
    const ordBtn = h('button', { type: 'button', class: 'vl-orders' });
    function ordUi() { if (!CZ.orders) return; ordBtn.replaceChildren(h('i', { text: '📜' }), h('b', { text: t('ord.btn') }), ...(CZ.orders.ready() ? [h('em', { text: '!' })] : [])); ordBtn.style.display = (d.tutV || 0) >= 5 ? '' : 'none'; }
    ordBtn.addEventListener('click', () => openOrders());
    const MAT_IMG = { plank: 'plank', brick: 'brick', iron: 'iron', wood: 'log', stone: 'stone' };
    const matIco = k => h('img', { class: 'mat-ico', src: 'assets/ui/mat/' + MAT_IMG[k] + '.webp', alt: t('mat.' + k) });
    function openOrders() {
      if (V && !V.paused) V.paused = true; CZ.audio.sfx('button');
      const box = h('div', { class: 'modal-wrap ord-wrap' });
      const close = () => { box.remove(); ordUi(); resUi(); if (V) { V.paused = false; V.last = 0; } };
      const draw2 = () => {
        const O = CZ.orders.ensure();
        const card = (o, i) => {
          if (o.wait) { const m = Math.max(1, Math.ceil((o.wait - Date.now()) / 60000));
            return h('div', { class: 'ord-card wait' }, h('img', { class: 'ord-npc', src: 'assets/ui/npc/' + (o.npc || 'baker') + '.webp', alt: '' }), h('div', { class: 'ord-body' }, h('b', { text: t('ord.wait', { n: m }) })),
              btn(t('ord.skip'), () => CZ.ads.show(() => { CZ.orders.skip(i); draw2(); }), 'small primary', 'ic:play')); }
          const ok = CZ.orders.can(o);
          return h('div', { class: 'ord-card' + (ok ? ' ok' : '') }, h('img', { class: 'ord-npc', src: 'assets/ui/npc/' + o.npc + '.webp', alt: '' }),
            h('div', { class: 'ord-body' }, h('b', { text: t('npc.' + o.npc) }),
              h('div', { class: 'ord-need' }, ...Object.keys(o.need).map(k => h('span', { class: (d[k] || 0) >= o.need[k] ? 'have' : '' }, matIco(k), Math.floor(d[k] || 0) + '/' + o.need[k]))),
              h('div', { class: 'ord-prize' }, img('ui.gold', 'mini-ico'), '+' + o.gold, ...(o.gems ? [' ', img('ui.emerald', 'mini-ico'), '+' + o.gems] : []))),
            h('div', { class: 'ord-btns' }, btn(t('ord.give'), () => { const r = CZ.orders.deliver(i); if (!r) { CZ.audio.sfx('wrong'); return CZ.ui.toast(t('mkt.short')); } CZ.audio.sfx('win'); CZ.audio.vibrate([40, 20, 40]); CZ.ui.toast(t('ord.thanks', { n: r.gold })); draw2(); }, 'small ' + (ok ? 'primary' : 'ghost-dark')),
              h('button', { type: 'button', class: 'ord-x', 'aria-label': t('ord.trash'), text: '✕', onClick: () => { CZ.orders.trash(i); draw2(); } })));
        };
        const crow = k => { const R = CZ.orders.RECIPES[k], mx = CZ.orders.maxCraft(k);
          return h('div', { class: 'craft-row' }, h('span', {}, ...Object.keys(R).map(r => h('span', {}, matIco(r), String(R[r])))), h('b', { text: '→' }), h('span', {}, matIco(k), '1', h('small', { text: ' (' + Math.floor(d[k] || 0) + ')' })),
            btn('x1', () => { if (!CZ.orders.craft(k, 1)) { CZ.audio.sfx('wrong'); return CZ.ui.toast(t('mkt.short')); } CZ.audio.sfx('buy'); draw2(); }, 'small primary'),
            btn(t('craft.all', { n: mx }), () => { if (!mx || !CZ.orders.craft(k, mx)) { CZ.audio.sfx('wrong'); return; } CZ.audio.sfx('buy'); draw2(); }, 'small ghost-dark')); };
        box.replaceChildren(h('div', { class: 'pause-card ord' },
          h('b', { class: 'lg-title', text: t('ord.title') }), h('small', { class: 'ord-rep', text: t('ord.rep', { n: O.rep + 1, k: O.done % 3, m: 3 }) }),
          ...O.slots.map(card),
          h('b', { class: 'ord-sub', text: t('craft.title') }), ...Object.keys(CZ.orders.RECIPES).map(crow),
          btn(t('common.close'), close, 'small ghost-dark')));
      };
      draw2(); wrap.append(box);
    }
    const hpFill = h('i'), hpTrail = h('u'), hpNum = h('span'); const hpBarEl = h('div', { class: 'vl-hp' }, hpTrail, hpFill, hpNum);
    const hpS = { k: 1, trail: 1, hold: 0, n: -1 };
    function hpPunch(cls) { hpBarEl.classList.remove('hit', 'heal'); void hpBarEl.offsetWidth; hpBarEl.classList.add(cls); }
    const panel = h('div', { class: 'def-panel' });
    const boostBtn = h('button', { type: 'button', class: 'vl-boost' }, h('b', { text: 'x2' }), h('small', { text: t('def.boost') }));
    boostBtn.addEventListener('click', () => { if (V.boostT > 0) return; CZ.ads.show(() => { V.boostT = 300; CZ.audio.sfx('star'); floatAt(P, t('def.boostOn'), 'wave'); }); });
    // SİLAH GÜCÜ: altınla anında yükselt (vuruş +2, atış hızı +%5 her seviye)
    const POW_MAX = 15;
    const powLv = () => d.vpow || 0;
    const powPrice = () => Math.round(150 * Math.pow(1.6, powLv()) / 10) * 10;
    const powBtn = h('button', { type: 'button', class: 'vl-pow' });
    function powUi() {
      const L = powLv();
      powBtn.replaceChildren(h('b', { text: '⚔ ' + t('vil.lv', { n: L }) }), L >= POW_MAX ? h('small', { text: t('up.max') }) : h('small', {}, img('ui.gold', 'mini-ico'), String(powPrice())));
      powBtn.classList.toggle('can', L < POW_MAX && (d.gold || 0) >= powPrice());
    }
    powBtn.addEventListener('click', () => {
      if (powLv() >= POW_MAX) return;
      const c = powPrice();
      if ((d.gold || 0) < c) { CZ.audio.sfx('wrong'); return CZ.ui.toast(t('chars.goldShort', { n: c - (d.gold || 0) })); }
      d.gold -= c; d.vpow = powLv() + 1; CZ.state.save(); resUi();
      CZ.audio.sfx('buy'); CZ.audio.vibrate([20, 20, 40]); floatAt(P, t('def.powUp', { n: d.vpow * 2 + W.dmg * 2 }), 'wave'); powUi();
    });
    // KAHRAMANLAR düğmesi
    const heroBtn = h('button', { type: 'button', class: 'vl-heroes' });
    function heroUi() {
      if (!CZ.heroes) return;
      const b = CZ.heroes.buddy();
      heroBtn.replaceChildren(b ? h('img', { src: CZ.heroes.portrait(b), alt: '', 'data-hero': b }) : h('i', { text: '🦸' }), h('b', { text: t('hero.btn') }), ...(CZ.heroes.hasNews() ? [h('em', { text: '!' })] : []));
      heroBtn.style.display = (d.tutV || 0) >= 5 ? '' : 'none';
    }
    heroBtn.addEventListener('click', () => openHeroes());
    function openHeroes() {
      if (!CZ.heroes) return;
      V.paused = true;
      const box = h('div', { class: 'modal-wrap hero-wrap' });
      const close = () => { box.remove(); V.paused = false; V.last = 0; heroUi(); resUi(); };
      const RAR = ['common', 'rare', 'legend'];
      function card(H) {
        const S = CZ.heroes.st(H.id), own = S.lv > 0, need = own ? CZ.heroes.upNeed(H.id) : { sh: CZ.heroes.unlockNeed(H.id), gold: 0 }, max = S.lv >= CZ.heroes.MAX;
        const pct = max ? 100 : Math.min(100, S.sh / need.sh * 100);
        const isB = CZ.heroes.buddy() === H.id;
        const acts = [];
        if (!own && CZ.heroes.canUnlock(H.id)) acts.push(btn(t('hero.unlock'), () => { CZ.heroes.unlock(H.id); CZ.audio.sfx('win'); CZ.audio.vibrate([40, 30, 90]); if (!CZ.heroes.buddy() && H.id !== 'mila') { CZ.heroes.setBuddy(H.id); spawnBuddy(); } draw(); }, 'primary'));
        if (own && !max) acts.push(btn(t('hero.up') + ' · ' + need.gold, () => { if (!CZ.heroes.up(H.id)) { CZ.audio.sfx('wrong'); return CZ.ui.toast(S.sh < need.sh ? t('hero.needSh', { n: need.sh - S.sh }) : t('chars.goldShort', { n: need.gold - (d.gold || 0) })); } CZ.audio.sfx('buy'); CZ.audio.vibrate([20, 20, 50]); resUi(); draw(); }, CZ.heroes.canUp(H.id) ? 'primary' : 'ghost-dark', 'ui.gold'));
        if (own && H.id !== 'mila') acts.push(isB ? h('span', { class: 'hero-with', text: t('hero.with') }) : btn(t('hero.take'), () => { CZ.heroes.setBuddy(H.id); spawnBuddy(); CZ.audio.sfx('star'); draw(); }, 'ghost-dark'));
        if (!max) acts.push(btn('+5 🧩 · 10', () => { if ((d.emeralds || 0) < 10) { CZ.audio.sfx('wrong'); return CZ.ui.toast(t('vil.gemShort')); } d.emeralds -= 10; CZ.heroes.add(H.id, 5); CZ.audio.sfx('coin'); resUi(); draw(); }, 'ghost-dark', 'ui.emerald'));
        return h('div', { class: 'hero-card ' + RAR[H.rar] + (own ? '' : ' locked') + (isB ? ' buddy' : '') },
          h('div', { class: 'hero-pic' }, h('img', { src: CZ.heroes.portrait(H.id), alt: '', 'data-hero': H.id }), own ? h('b', { class: 'hero-lv', text: t('vil.lv', { n: S.lv }) }) : h('b', { class: 'hero-lv lock', text: '🔒' })),
          h('div', { class: 'hero-info' },
            h('div', { class: 'hero-name' }, h('b', { text: t('hero.n.' + H.id) }), h('small', { class: 'hero-rar', text: t('hero.rar' + H.rar) })),
            h('small', { class: 'hero-desc', text: t('hero.d.' + H.id) }),
            h('div', { class: 'hero-bar' + (pct >= 100 ? ' full' : '') }, h('i', { style: 'width:' + pct + '%' }), h('span', { text: max ? t('up.max') : '🧩 ' + S.sh + ' / ' + need.sh })),
            h('div', { class: 'hero-acts' }, ...acts)));
      }
      function draw() {
        box.replaceChildren(h('div', { class: 'modal hero-modal' },
          h('div', { class: 'hero-head' }, h('b', { class: 'lg-title', text: t('hero.title') }), h('button', { class: 'hero-x', type: 'button', text: '✕', onClick: close })),
          h('small', { class: 'hero-sub', text: t('hero.sub') }),
          h('div', { class: 'hero-list' }, CZ.HEROES.map(card))));
      }
      draw(); wrap.append(box);
    }
    const floats = h('div', { class: 'vl-floats' });
    const mapC = h('canvas', { class: 'vl-map', width: '220', height: '220' });
    const mctx = mapC.getContext('2d');
    const edgeArrows = [0, 1, 2].map(() => h('div', { class: 'vl-edge' }, h('i')));
    const stick = h('div', { class: 'vl-stick' }, h('i'));
    const fireBtn = h('button', { class: 'vl-fire', type: 'button' }, img(W.art, 'vl-fire-ico'));
    const rideBtn = h('button', { class: 'vl-ride', type: 'button', text: t('valley.ride') });
    // BİNEK GÜCÜ: her binek farklı (kükreme, buz nefesi, hız, atılma, deprem)
    const MP = CZ.MOUNT_POWER[mountDef.id] || CZ.MOUNT_POWER.brown;
    const mpBtn = h('button', { class: 'vl-mp', type: 'button' }, h('i'), h('b', { text: t('mp.' + MP.id) }));
    const pauseB = h('button', { class: 'pause-btn vl-pause', type: 'button' }, h('i'), h('i'));
    const ui = h('div', { class: 'vl-ui' },
      h('div', { class: 'vl-top' }, h('div', { class: 'res-bar' }, h('span', { class: 'res wood' }, h('i', { text: '🪵' }), woodEl), h('span', { class: 'res stone' }, h('i', { text: '🪨' }), stoneEl), h('span', { class: 'res gold' }, img('ui.gold', 'mini-ico'), goldEl), h('span', { class: 'res gem', onClick: () => openMarket() }, img('ui.emerald', 'mini-ico'), gemEl, h('i', { class: 'res-plus', text: '⇄' }))), timeEl),
      hpBarEl, raidEl, heroBtn, ordBtn, giftBtn, powBtn, boostBtn, mpBtn, pauseB, floats, mapC, ...edgeArrows, stick, panel, rideBtn, fireBtn);
    const wrap = h('div', { class: 'valley-wrap' }, stage, ui);
    el.append(wrap);
    function resize() {
      const w = stage.clientWidth || window.innerWidth, hh = stage.clientHeight || window.innerHeight;
      renderer.setSize(w, hh, false); post.setSize(w, hh); camera.aspect = w / hh; camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);
    const v3 = new THREE.Vector3();
    function floatAt(o, text, cls) {
      v3.set(o.x, 2.5, o.z).project(camera);
      const f = h('div', { class: 'vl-float' + (cls ? ' ' + cls : ''), text });
      f.style.left = ((v3.x + 1) / 2 * 100) + '%'; f.style.top = ((1 - v3.y) / 2 * 100) + '%';
      floats.append(f); setTimeout(() => f.remove(), 1100);
    }
    function bump() { goldEl.parentNode.classList.remove('bump'); void goldEl.offsetWidth; goldEl.parentNode.classList.add('bump'); }
    // PAZAR: zümrüt ⇄ altın, altın → odun / taş (odun ve taş geri dönmez)
    function openMarket() {
      if (V && !V.paused) V.paused = true;
      const rows = [['gems', 1, 'gold', 90], ['gold', 120, 'gems', 1], ['gold', 10, 'wood', 25], ['gold', 10, 'stone', 15], ['gold', 100, 'wood', 260], ['gold', 100, 'stone', 160]];
      const key = { gems: 'emeralds', gold: 'gold', wood: 'wood', stone: 'stone' };
      const ico = r2 => r2 === 'gold' ? img('ui.gold', 'mini-ico') : r2 === 'gems' ? img('ui.emerald', 'mini-ico') : h('i', { text: r2 === 'wood' ? '🪵' : '🪨' });
      const box = h('div', { class: 'pause-menu' });
      const draw2 = () => box.replaceChildren(h('div', { class: 'pause-card mkt' }, h('b', { class: 'lg-title', text: t('mkt.title') }), h('small', { text: t('mkt.rule') }),
        ...rows.map(([a, na, b2, nb]) => h('div', { class: 'mkt-row' }, h('span', {}, ico(a), String(na)), h('b', { text: '→' }), h('span', {}, ico(b2), String(nb)),
          btn(t('mkt.swap'), () => { if ((d[key[a]] || 0) < na) { CZ.audio.sfx('wrong'); return CZ.ui.toast(t('mkt.short')); } d[key[a]] -= na; d[key[b2]] = (d[key[b2]] || 0) + nb; CZ.state.save(); CZ.audio.sfx('buy'); resUi(); draw2(); }, 'small primary'))),
        btn(t('common.close'), () => { box.remove(); if (V) { V.paused = false; V.last = 0; } }, 'small ghost-dark')));
      draw2(); wrap.append(box);
    }

    // Yön çubuğu: sol yarıda nereye basarsan orada açılır (Brawl Stars)
    const joy = { id: null, x0: 0, y0: 0, dx: 0, dy: 0 };
    const tapRay = new THREE.Raycaster(), tapPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), tapV = new THREE.Vector3(), tapN = new THREE.Vector2();
    const tapAim = { id: null, x: 0, y: 0 };
    function fireAt(cx, cy) {
      const r = renderer.domElement.getBoundingClientRect(); tapN.set((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
      tapRay.setFromCamera(tapN, camera); if (!tapRay.ray.intersectPlane(tapPlane, tapV)) return;
      // tıklanan yere yakın düşman varsa ona kilitle
      let o = null, bd = 2.2; targets.forEach(q => { if (!q.dead && !q.locked) { const dd = Math.hypot(q.x - tapV.x, q.z - tapV.z); if (dd < bd) { bd = dd; o = q; } } });
      if (o) fire(o.x - P.x, o.z - P.z); else fire(tapV.x - P.x, tapV.z - P.z);
    }
    ui.addEventListener('pointerdown', e => {
      if (e.target.closest('button') || e.target.closest('.vl-panel, .pause-card, .def-down')) return;
      if (e.pointerType === 'mouse' || e.clientX > window.innerWidth * 0.55) { tapAim.id = e.pointerId; tapAim.x = e.clientX; tapAim.y = e.clientY; fireAt(e.clientX, e.clientY); return; }   // sağ taraf / fare: oraya at (basılı tutunca atmaya devam)
      if (joy.id !== null) return;
      joy.id = e.pointerId; joy.x0 = e.clientX; joy.y0 = e.clientY; joy.dx = joy.dy = 0;
      stick.style.left = e.clientX + 'px'; stick.style.top = e.clientY + 'px'; stick.classList.add('on');
    });
    window.addEventListener('pointermove', V_move = e => {
      if (e.pointerId === joy.id) {
        let dx = e.clientX - joy.x0, dy = e.clientY - joy.y0; const L2 = Math.hypot(dx, dy), R = 56;
        if (L2 > R) { dx *= R / L2; dy *= R / L2; }
        joy.dx = dx / R; joy.dy = dy / R;
        stick.firstChild.style.transform = `translate(${dx}px, ${dy}px)`;
      }
      if (e.pointerId === tapAim.id) { tapAim.x = e.clientX; tapAim.y = e.clientY; }
      if (e.pointerId === aimP.id) {
        aimP.dx = e.clientX - aimP.x0; aimP.dy = e.clientY - aimP.y0;
        if (Math.hypot(aimP.dx, aimP.dy) > 18) aimP.aiming = true;
      }
    });
    window.addEventListener('pointerup', V_up = e => {
      if (e.pointerId === tapAim.id) tapAim.id = null;
      if (e.pointerId === joy.id) { joy.id = null; joy.dx = joy.dy = 0; stick.classList.remove('on'); stick.firstChild.style.transform = ''; }
      if (e.pointerId === aimP.id) {
        if (aimP.aiming) fire(aimP.dx, aimP.dy);
        else autoFire();
        aimP.id = null; aimP.aiming = false; aim.visible = false; fireBtn.classList.remove('aiming');
      }
    });
    window.addEventListener('pointercancel', V_up);
    // Atış: dokun = otomatik, basılı tut + sürükle = nişan
    const aimP = { id: null, x0: 0, y0: 0, dx: 0, dy: 0, aiming: false };
    fireBtn.addEventListener('pointerdown', e => { e.preventDefault(); aimP.id = e.pointerId; aimP.x0 = e.clientX; aimP.y0 = e.clientY; aimP.dx = aimP.dy = 0; aimP.aiming = false; fireBtn.classList.add('aiming'); });
    function autoFire() {
      const o = nearestTarget(RANGE);
      if (o) fire(o.x - P.x, o.z - P.z); else fire(-Math.sin(P.dir), -Math.cos(P.dir));
    }
    mpBtn.addEventListener('pointerdown', e => { e.stopPropagation(); usePower(); });
    function ringFx(x, z, rad, color) { const m = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 40), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.15, z); scene.add(m); rings.push({ m, rad, t: 0 }); }
    function usePower() {
      if (!P.riding || V.mpCd > 0 || P.down > 0) return;
      V.mpCd = MP.cd;
      const fx = -Math.sin(P.dir), fz = -Math.cos(P.dir);
      const near = rad => goblins.filter(o => !o.dead && Math.hypot(o.x - P.x, o.z - P.z) < rad);
      const pw = powLv();
      CZ.audio.vibrate([40, 30, 60]);
      if (MP.id === 'roar') { near(7).forEach(o => { o.stun = 2.5; hit(o, 3 + pw); }); ringFx(P.x, P.z, 7, 0xffc04a); CZ.audio.sfx('horn'); }
      else if (MP.id === 'frost') {
        goblins.filter(o => !o.dead).forEach(o => { const dx = o.x - P.x, dz = o.z - P.z, dd = Math.hypot(dx, dz); if (dd < 9 && (dx * fx + dz * fz) / (dd || 1) > 0.25) { o.stun = 4; hit(o, 2 + pw); } });
        if (ice.alive && Math.hypot(ice.x - P.x, ice.z - P.z) < 9) { ice.alive = false; scene.remove(ice.mesh); chest.locked = false; floatAt(ice, t('valley.iceBroke')); }
        ringFx(P.x + fx * 4, P.z + fz * 4, 5, 0x8ad8ff); CZ.audio.sfx('crack');
      }
      else if (MP.id === 'dash') { V.dashT = 3; CZ.audio.sfx('star'); ringFx(P.x, P.z, 3, 0xffffff); }
      else if (MP.id === 'pounce') { V.pounceT = 0.35; V.pounceHit = new Set(); CZ.audio.sfx('jump'); }
      else if (MP.id === 'quake') { near(8.5).forEach(o => { const dx = o.x - P.x, dz = o.z - P.z, dd = Math.hypot(dx, dz) || 1; o.x += dx / dd * 3; o.z += dz / dd * 3; o.stun = 1.5; hit(o, 8 + pw * 2); }); ringFx(P.x, P.z, 8.5, 0xa8783a); V.shake = 0.4; CZ.audio.sfx('hit'); }
      floatAt(P, t('mp.' + MP.id) + '!', 'wave');
    }
    rideBtn.addEventListener('click', () => {
      if (P.riding) { P.riding = false; P.x += Math.cos(P.dir) * 1.6; P.z -= Math.sin(P.dir) * 1.6; CZ.audio.sfx('land'); }
      else if (Math.hypot(M.x - P.x, M.z - P.z) < 3.2) { P.riding = true; CZ.audio.sfx('jump'); if (V.tut) V.tut.on('ride'); }
      else { V.whistle = true; CZ.audio.sfx('star'); floatAt(M, t('valley.coming')); }
    });
    pauseB.addEventListener('pointerdown', e => { e.stopPropagation(); pause(); });

    V = {
      el, renderer, scene, stage, wrap, raf: 0, last: 0, wave: 1, waveT: 0, spawnT: 2, kills: 0, earned: 0, pending: 0, cool: 0, running: true, paused: false, whistle: false,
      P, M, hero, camera, BUD, solids, targets, goblins, camps, piles, ice, chest, pads, DS, trees, rocks, left, seeU, debug: { route, fire, autoFire, joy, nearestTarget, rushGold, finishJob, spawnGoblin, complete, flowTick, sim(sec, cb) { for (let t2 = 0; t2 < sec; t2 += 0.05) { if (cb) cb(); if (V.running && !V.paused) step(0.05); draw(0.05); } } },
      cleanup() {
        window.removeEventListener('resize', resize);
        window.removeEventListener('pointermove', V_move);
        window.removeEventListener('pointerup', V_up);
        window.removeEventListener('pointercancel', V_up);
        post.dispose(); renderer.dispose();
      }
    };
    function resumeCount() {
      const n = h('b', { class: 'cd-num' }); const cd = h('div', { class: 'countdown' }, n); wrap.append(cd);
      let k = 3;
      const tick = () => { if (!V) return; if (k === 0) { cd.remove(); V.paused = false; V.last = 0; CZ.audio.duck(0.55, 0.1); return; } n.textContent = k; n.classList.remove('pop'); void n.offsetWidth; n.classList.add('pop'); CZ.audio.sfx('button'); k--; setTimeout(tick, 650); };
      tick();
    }
    function pause() {
      if (!V || V.paused || !V.running) return;
      V.paused = true;
      CZ.audio.duck(0.15, 9999);
      const box = h('div', { class: 'pause-menu' }, h('div', { class: 'pause-card' },
        h('b', { class: 'lg-title', text: t('pause.title') }),
        btn(t('pause.resume'), () => { box.remove(); resumeCount(); }, 'primary wide', 'ic:play'),
        CZ.audioPanel(),
        btn(t('w.stable'), () => { box.remove(); V.paused = false; CZ.ui.go('gold'); }, 'ghost-dark wide'),
        btn(t('pause.quit'), () => { box.remove(); V.paused = false; CZ.audio.duck(0.55, 0.1); end(); }, 'small ghost-dark')));
      wrap.append(box);
    }
    // Köy süsleri: kuyu, fıçılar, fenerler (yeni yapay zekâ modelleri)
    if (CZ.gen3d) {
      const free = (x, z, r) => !water(x, z) && !pads.some(q => Math.hypot(q.x - x, q.z - z) < 2.2 + r) && !solids.some(q => Math.hypot(q.x - x, q.z - z) < q.r + r + 0.6) && Math.hypot(x - MILA.x, z - MILA.z) > 2.5;
      const put = (id, hgt, x, z, r, rot) => { if (!CZ.gen3d.has(id) || !free(x, z, r)) return false; const g = CZ.gen3d.get(id, hgt); g.position.set(x, 0, z); g.rotation.y = rot || 0; g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.material = seeThrough(o.material.clone()); } }); scene.add(g); outlineWorld(g, 0.03); solids.push({ x, z, r }); V.decor = (V.decor || 0) + 1; return true; };
      [[3.2, 6.2], [-3, 6.4], [2.6, -5.2], [-9.5, 0.5], [9.5, 0.5]].some(([x, z]) => put('kuyu', 2.4, x, z, 1.0, 0.4));
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + 0.2; put('fener', 1.9, Math.cos(a) * 10.6, Math.sin(a) * 10.6, 0.35, -a); }
      [[34.5, 31], [35.5, 37.5], [41.5, 31.5], [-7.6, -6.8]].forEach(([x, z], k) => put('fici', 1.1, x, z, 0.5, k));
    }
    pads.forEach(drawPad);
    spawnBuddy(); heroUi(); ordUi(); giftUi();
    try {
      const warm = new THREE.Group();
      [towerModel('snow', 1), towerModel('cannon', 1), fenceModel(0, 1), fenceModel(1, 2)].forEach(g => { g.traverse(o => { if (o.isMesh) { const c = o.clone(); c.material = o.material.clone(); c.material.transparent = true; c.material.opacity = 0.45; warm.add(c); } }); warm.add(g); });
      warm.position.set(P.x, -50, P.z); scene.add(warm); renderer.compile(scene, camera); scene.remove(warm);
    } catch (e) { /* ısınma olmazsa yine çalışır */ }
    V.pause = pause;
    V.onHide = () => { if (document.hidden) pause(); };
    document.addEventListener('visibilitychange', V.onHide);

    /* ---------- Döngü ---------- */
    const perf = { acc: 0, n: 0, slow: 0 };
    const collide = (x, z, r) => {
      for (const s of solids) { if (s.off || (s === ice && !ice.alive)) continue; const dx = x - s.x, dz = z - s.z, dd = Math.hypot(dx, dz), m = s.r + r; if (dd < m && dd > 0.001) { x = s.x + dx / dd * m; z = s.z + dz / dd * m; } }
      const rr = Math.hypot(x, z); if (rr > WORLD_R) { x *= WORLD_R / rr; z *= WORLD_R / rr; }
      return [x, z];
    };
    function step(dt) {
      if (V.cine) return;
      V.cool -= dt;
      // DALGALAR: her 45 sn'de goblinler çoğalır ve güçlenir. Süre sınırı yok.
      V.waveT += dt;
      if (V.waveT > 60) { V.waveT = 0; V.wave++; floatAt(P, t('def.wave', { n: V.wave }), 'wave'); CZ.audio.sfx('horn'); if (V.wave % 5 === 0) spawnGoblin(true);
        if (V.wave % 5 === 0 && !V.raid && !V.story) { const a = rand(0, Math.PI * 2); V.raid = { t: 6, a }; const dirs = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE']; raidEl.textContent = t('siege.warn', { d: t('dir.' + dirs[Math.round(((a + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 4)) % 8]) }); raidEl.classList.add('on'); CZ.audio.sfx('horn'); CZ.audio.vibrate([100, 50, 100]); } }
      raidTick(dt); campTick();
      if ((V.lvT = (V.lvT || 0) - dt) <= 0) { V.lvT = 1; giftUi(); timeEl.textContent = t('def.wave', { n: V.wave }) + ' · 🏰' + vilLevel(); }
      V.spawnT -= dt;
      const cap = Math.min(10, 2 + V.wave) + Math.min(6, Math.floor(vilPower() / 4));
      if (V.spawnT <= 0 && goblins.length < cap && !V.story) { V.spawnT = Math.max(2.2, 5 - V.wave * 0.3); spawnGoblin(); }
      // inşaat süreleri
      pads.forEach(p => { const it = slot(p); if (it && it.job) { if (Date.now() >= it.job.end) finishJob(p); else if (p.barFg) { const D2 = defOf(p); const tot = D2.min[it.job.to - 1] * 60000; const k = 1 - jobLeft(it) / tot; p.barFg.scale.x = 2.1 * Math.max(0.02, k); p.barFg.position.x = -1.05 * (1 - k); p.barG.quaternion.copy(camera.quaternion); } } if (p.pop > 0 && p.g) { p.pop -= dt; const k = 1 + Math.sin(p.pop / 0.35 * Math.PI) * 0.25; p.g.scale.setScalar((p.kind === 't' && slot(p).type !== 'cannon' ? 0.8 : 1) * k); } });
      // KULELER: menzildeki en yakın goblini kendileri vurur
      pads.forEach(p => {
        const it = slot(p); if (p.kind !== 't' || !it || it.lv < 1 || !p.g) return;
        if (p.down > 0) { const near = Math.hypot(P.x - p.x, P.z - p.z) < 4; p.down -= dt * (near ? 3 : 1); p.g.rotation.z = p.down > 0 ? 0.18 : 0; p.smk = (p.smk || 0) - dt;
          if (p.smk <= 0 && p.down > 0) { p.smk = 0.6; const m = new THREE.Mesh(chipGeo, chipMats.smoke); m.scale.setScalar(3); m.position.set(p.x, 3, p.z); scene.add(m); chips.push({ m, vx: rand(-0.5, 0.5), vy: 7, vz: rand(-0.5, 0.5) }); }
          if (p.down <= 0) { floatAt(p, t('siege.fixed'), 'auto'); CZ.audio.sfx('buy'); } return; }
        const D2 = DEF[it.type];
        p.cd = (p.cd || 0) - dt; if (p.cd > 0) return;
        let best = null, bd = D2.range;
        goblins.forEach(o => { if (o.dead) return; const dd = Math.hypot(o.x - p.x, o.z - p.z); if (dd < bd) { bd = dd; best = o; } });
        if (!best) return;
        p.cd = D2.rate * Math.pow(0.9, it.lv - 1);
        const m = new THREE.Mesh(it.type === 'cannon' ? cannonGeo : ballGeo, it.type === 'cannon' ? cannonMat : ballMat);
        const top = it.type === 'cannon' ? 2.2 + it.lv * 0.2 : 2.6 + it.lv * 0.55;
        m.position.set(p.x, top, p.z); scene.add(m);
        tshots.push({ m, o: best, type: it.type, dmg: D2.dmg + D2.dmgUp * (it.lv - 1), sp: it.type === 'cannon' ? 14 : 20, t: 0 });
        if (it.type === 'cannon' && p.g.userData.top) p.g.userData.top.rotation.y = Math.atan2(-(best.x - p.x), -(best.z - p.z));
        if (bd < 14) CZ.audio.sfx(it.type === 'cannon' ? 'hit' : 'throw');
      });
      for (let i = tshots.length - 1; i >= 0; i--) {
        const q = tshots[i]; q.t += dt;
        const tx = q.o.x, tz = q.o.z, ty = 0.9;
        const dx = tx - q.m.position.x, dy = ty - q.m.position.y, dz = tz - q.m.position.z, L2 = Math.hypot(dx, dy, dz);
        if (L2 < 0.5 || q.t > 2) {
          if (q.type === 'cannon') { goblins.slice().forEach(o => { if (!o.dead && Math.hypot(o.x - tx, o.z - tz) < DEF.cannon.splash) hit(o, q.dmg, true); }); boomFx(tx, tz); if (q.gift) giftFx(tx, tz); }
          else if (!q.o.dead) hit(q.o, q.dmg, true);
          scene.remove(q.m); tshots.splice(i, 1); continue;
        }
        const st = Math.min(L2, q.sp * dt);
        q.m.position.x += dx / L2 * st; q.m.position.y += dy / L2 * st + (q.type === 'cannon' ? Math.sin(Math.min(1, q.t * 2) * Math.PI) * dt * 3 : 0); q.m.position.z += dz / L2 * st;
      }
      for (let i = booms.length - 1; i >= 0; i--) { const b2 = booms[i]; b2.t += dt; b2.m.scale.setScalar(0.5 + b2.t * 7); b2.m.material.opacity = Math.max(0, 0.8 - b2.t * 2.4); if (b2.t > 0.35) { scene.remove(b2.m); b2.m.material.dispose(); booms.splice(i, 1); } }
      MILA.cd -= dt;
      if (MILA.cd <= 0) {
        const g = goblins.find(o => !o.dead && Math.hypot(o.x, o.z) < FENCE_R + 4);
        if (g) { const mL = CZ.heroes ? CZ.heroes.lv('mila') : 1; MILA.cd = Math.max(0.5, 1.2 - mL * 0.07); milaMount.root.rotation.y = Math.atan2(-(g.x - MILA.x), -(g.z - MILA.z)); if (milaHero.throwNow) milaHero.throwNow(); const m = new THREE.Mesh(ballGeo, ballMat); m.position.set(MILA.x, 2.6, MILA.z); scene.add(m); tshots.push({ m, o: g, type: 'snow', dmg: 1.5 + mL * 0.5, sp: 22, t: 0 }); }
      }
      buddyUpd(dt);
      // CAN: köyün içinde yavaşça dolar; bayılınca köyde uyanırsın
      P.hurtT = Math.max(0, P.hurtT - dt);
      if (P.down > 0) { P.down -= dt; if (P.down <= 0) { P.hp = P.maxHp; P.x = 2.5; P.z = 6.5; P.riding = false; M.x = 5.5; M.z = 3.8; downEl.remove(); } return; }
      if (Math.hypot(P.x, P.z) < FENCE_R && P.hp < P.maxHp) P.hp = Math.min(P.maxHp, P.hp + dt * 0.6);
      { const k = Math.max(0, P.hp / P.maxHp);
        if (k > hpS.k + 0.001) hpPunch('heal');
        if (k < hpS.k - 0.001) hpS.hold = 0.45;   // iz önce bekler, sonra erir: ne kadar hasar aldığın görünür
        hpS.k = k; hpS.hold -= dt; if (hpS.hold <= 0) hpS.trail += (k - hpS.trail) * Math.min(1, dt * 6); if (hpS.trail < k) hpS.trail = k;
        hpFill.style.width = (k * 100) + '%'; hpTrail.style.width = (hpS.trail * 100) + '%';
        hpFill.style.background = `linear-gradient(hsl(${Math.round(k * 115)},85%,62%), hsl(${Math.round(k * 115)},75%,42%))`;
        const n = Math.ceil(P.hp); if (n !== hpS.n) { hpS.n = n; hpNum.textContent = n + ' / ' + P.maxHp; }
        hpBarEl.classList.toggle('low', k < 0.35 && P.hp > 0); }
      if (V.pending > 0) { const n = Math.min(V.pending, Math.ceil(V.pending * dt * 6)); V.pending -= n; gain(n, true); }
      V.saveT = (V.saveT || 0) - dt; if (V.saveT <= 0) { V.saveT = 3; CZ.village.ensure().leftAt = Date.now(); CZ.state.save(); }
      V.vT = (V.vT || 0) - dt; if (V.vT <= 0) { V.vT = 1; const VV = CZ.village.ensure(), had = VV.job; CZ.village.tick(); if (had && !VV.job) { const id = VV.done; VV.done = null; placeVillage(); pads.forEach(drawMark); CZ.audio.sfx('win'); if (id) floatAt(P, t('vil.doneT', { b: t('vil.b.' + id), n: CZ.village.lv(id) }), 'wave'); } }
      padNear(dt);
      if (V.story && V.story.tick) V.story.tick(dt);
      V.powT = (V.powT || 0) - dt; if (V.powT <= 0) { V.powT = 0.5; powUi(); V.hT2 = (V.hT2 || 0) + 1; if (V.hT2 % 4 === 0) heroUi(); boostBtn.classList.toggle('on', V.boostT > 0); boostBtn.lastChild.textContent = V.boostT > 0 ? Math.ceil(V.boostT / 60) + ' ' + t('def.min') : t('def.boost'); }
      V.boostT = Math.max(0, (V.boostT || 0) - dt);

      // hareket
      V.mpCd = Math.max(0, (V.mpCd || 0) - dt); V.dashT = Math.max(0, (V.dashT || 0) - dt);
      mpBtn.classList.toggle('on', P.riding); mpBtn.classList.toggle('ready', P.riding && V.mpCd <= 0);
      mpBtn.firstChild.style.height = (V.mpCd / MP.cd * 100) + '%';
      for (let i = rings.length - 1; i >= 0; i--) { const q = rings[i]; q.t += dt; const k = Math.min(1, q.t / 0.45); q.m.scale.setScalar(0.5 + q.rad * k); q.m.material.opacity = 0.85 * (1 - k); if (q.t > 0.45) { scene.remove(q.m); q.m.geometry.dispose(); q.m.material.dispose(); rings.splice(i, 1); } }
      if (V.pounceT > 0) {
        V.pounceT -= dt;
        const fx = -Math.sin(P.dir), fz = -Math.cos(P.dir);
        [P.x, P.z] = collide(P.x + fx * 22 * dt, P.z + fz * 22 * dt, 1.0);
        goblins.forEach(o => { if (!o.dead && !V.pounceHit.has(o) && Math.hypot(o.x - P.x, o.z - P.z) < 2) { V.pounceHit.add(o); o.stun = 1; hit(o, 6 + powLv() * 2); } });
      }
      const sp = P.riding ? mountDef.speed * B.speed * (V.dashT > 0 ? 1.6 : 1) : 5;
      let mx = joy.dx, mz = joy.dy;
      const kb = V.keys || {};
      if (kb.ArrowLeft || kb.a) mx = -1; if (kb.ArrowRight || kb.d) mx = 1; if (kb.ArrowUp || kb.w) mz = -1; if (kb.ArrowDown || kb.s) mz = 1;
      const mag = Math.min(1, Math.hypot(mx, mz));
      P.vx += (mx * sp - P.vx) * Math.min(1, dt * 10); P.vz += (mz * sp - P.vz) * Math.min(1, dt * 10);
      {
        const pr = P.riding ? 1.0 : 0.45, want = Math.hypot(P.vx, P.vz) * dt;
        let [nx, nz] = collide(P.x + P.vx * dt, P.z + P.vz * dt, pr);
        // ağaca/kayaya kafa kafaya girince takılma: yana kayarak etrafından dolaş
        if (want > 0.01 && Math.hypot(nx - P.x, nz - P.z) < want * 0.35) {
          for (const a of [0.6, -0.6, 1.2, -1.2]) {
            const c2 = Math.cos(a), s3 = Math.sin(a), vx = P.vx * c2 - P.vz * s3, vz = P.vx * s3 + P.vz * c2;
            const [tx, tz] = collide(P.x + vx * dt, P.z + vz * dt, pr);
            if (Math.hypot(tx - P.x, tz - P.z) > want * 0.5) { nx = tx; nz = tz; break; }
          }
        }
        // nehre giremezsin: köprüden geç (yan eksende kaymayı dene)
        if (water(nx, nz)) { if (!water(nx, P.z)) nz = P.z; else if (!water(P.x, nz)) nx = P.x; else { nx = P.x; nz = P.z; } if (!V.waterHint) { V.waterHint = true; floatAt(P, t('w.bridge'), 'wave'); setTimeout(() => { if (V) V.waterHint = false; }, 4000); } }
        P.x = nx; P.z = nz;
      }
      if (water(P.x, P.z)) { if (P.safe) { P.x = P.safe[0]; P.z = P.safe[1]; } } else P.safe = [P.x, P.z];
      harvest(dt);
      // akan kaynaklar ve görünür parçalar
      for (let i = flies.length - 1; i >= 0; i--) { const f = flies[i]; f.t += dt * 3; const k = Math.min(1, f.t); f.m.position.set(f.sx + (f.tx - f.sx) * k, 1.2 + Math.sin(k * Math.PI) * 1.6 - k * 1.1, f.sz + (f.tz - f.sz) * k); f.m.rotation.x += dt * 9; if (k >= 1) { scene.remove(f.m); flies.splice(i, 1); } }
      V.chT = (V.chT || 0) - dt; if (V.chT <= 0) { V.chT = 0.25; chunkList.forEach(c => { c.mesh.visible = Math.hypot(c.cx - P.x, c.cz - P.z) < 62; if (c.ol) c.ol.visible = c.mesh.visible; }); }
      waterTex.offset.y -= dt * 0.25;
      const speed = Math.hypot(P.vx, P.vz);
      if (mag > 0.15 && !(aimP.aiming)) { const want = Math.atan2(-mx, -mz); let dd = want - P.dir; dd = Math.atan2(Math.sin(dd), Math.cos(dd)); P.dir += dd * Math.min(1, dt * 12); }
      if (P.riding) {
        M.x = P.x; M.z = P.z; M.dir = P.dir; M.speed = speed;
        // ayı kutuları ve yardakçıları ezer; kutup ayısı buzu kırar
        targets.slice().forEach(o => { if (!o.dead && !o.locked && o.type === 'box' && mountDef.kind !== 'deer' && Math.hypot(o.x - P.x, o.z - P.z) < o.r + 1.1 && speed > 3) kill(o); });
        goblins.forEach(o => { if (Math.hypot(o.x - P.x, o.z - P.z) < 1.6 && speed > 3 && !o.stun) { o.stun = 1; hit(o, 2); } });
        if (ice.alive && mountDef.id === 'polar' && Math.hypot(ice.x - P.x, ice.z - P.z) < 3.1) { ice.alive = false; scene.remove(ice.mesh); chest.locked = false; CZ.audio.sfx('crack'); CZ.audio.vibrate([60, 30, 60]); floatAt(ice, t('valley.iceBroke')); }
      } else {
        // binek: çağırınca ya da uzaklaşınca peşinden gelir
        const dd = Math.hypot(P.x - M.x, P.z - M.z);
        const follow = V.whistle || dd > 7;
        let msp = 0;
        if (follow && dd > 2.6) { msp = Math.min(mountDef.speed, dd * 1.5); M.x += (P.x - M.x) / dd * msp * dt; M.z += (P.z - M.z) / dd * msp * dt; M.dir = Math.atan2(-(P.x - M.x), -(P.z - M.z)); }
        else V.whistle = false;
        [M.x, M.z] = collide(M.x, M.z, 1.0);
        M.speed += (msp - M.speed) * Math.min(1, dt * 6);
      }
      if (ice.alive && P.riding === false && Math.hypot(ice.x - P.x, ice.z - P.z) < 3 && !V.iceHint) { V.iceHint = true; floatAt(ice, t('valley.needPolar')); }
      rideBtn.textContent = P.riding ? t('valley.dismount') : (Math.hypot(M.x - P.x, M.z - P.z) < 3.2 ? t('valley.ride') : t('valley.call'));
      rideBtn.classList.toggle('near', !P.riding && Math.hypot(M.x - P.x, M.z - P.z) < 3.2);

      // GOBLİNLER: yakındaysan sana mızrakla saldırır; değilse köye yürür, çiti döver ya da altın çalıp kaçar
      goblins.forEach(o => {
        if (o.dead) return;
        o.stun = Math.max(0, o.stun - dt); if (o.frozen > 0) { o.frozen -= dt; if (o.frozen <= 0) iceOff(o, true); } o.atk -= dt; o.lunge = Math.max(0, o.lunge - dt);
        const dxp = P.x - o.x, dzp = P.z - o.z, dp = Math.hypot(dxp, dzp);
        const rc = Math.hypot(o.x, o.z);
        let tx = 0, tz = 0, sp = o.speed, attackFence = null;
        if (o.flee) { tx = o.x / (rc || 1) * 80; tz = o.z / (rc || 1) * 80; sp = o.speed * 1.15; if (rc > WORLD_R - 2) { o.dead = true; scene.remove(o.mesh); if (o.ice) { scene.remove(o.ice); o.ice = null; } if (o.bar) { scene.remove(o.bar.g); o.bar = null; } targets.splice(targets.indexOf(o), 1); goblins.splice(goblins.indexOf(o), 1); return; } }
        else if (o.kind === 'bomber' && (o.tgt = o.tgt && !(o.tgt.down > 0) && slot(o.tgt) ? o.tgt : pads.filter(p => p.kind === 't' && slot(p) && slot(p).lv >= 1 && !(p.down > 0)).sort((a, b) => Math.hypot(a.x - o.x, a.z - o.z) - Math.hypot(b.x - o.x, b.z - o.z))[0])) {
          tx = o.tgt.x; tz = o.tgt.z;
          if (Math.hypot(tx - o.x, tz - o.z) < 1.8) { o.tgt.down = 25; boomFx(o.x, o.z); boomFx(tx, tz); CZ.audio.sfx('crack'); floatAt(o.tgt, t('siege.towerDown'), 'wave'); o.coins = 0; o.hp = 0; kill(o, true); return; }
        }
        else if (o.camp && (P.down > 0 || Math.hypot(P.x - o.camp.x, P.z - o.camp.z) > 22)) { tx = o.camp.x; tz = o.camp.z; }   // kamp bekçisi kampından uzaklaşmaz
        else if (!o.village && P.down <= 0) { tx = P.x; tz = P.z; }   // önce sadece seni kovalarlar
        else if (dp < 13 && P.down <= 0) { tx = P.x; tz = P.z; }
        else if (!o.village) { o.roam = o.roam || [o.x * 0.75, o.z * 0.75]; tx = o.roam[0]; tz = o.roam[1]; if (Math.hypot(tx - o.x, tz - o.z) < 2) { const a = rand(0, 6.28), rr = rand(FENCE_R + 6, WORLD_R - 6); o.roam = [Math.cos(a) * rr, Math.sin(a) * rr]; } }   // ilk dalgalar: köye girmez, dışarıda dolaşır
        else {
          // köyün merkezine yürü; çit parçası sağlamsa ona takıl
          const seg = ((Math.floor(((Math.atan2(o.z, o.x) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 4))) % 8);
          const fp = pads.find(p => p.kind === 'f' && p.i === seg), fit = fp && slot(fp);
          if (fit && fit.lv >= 1 && fp.hp > 0 && rc < FENCE_R + 1.1 && rc > FENCE_R - 0.5) attackFence = fp;
          else { tx = 0; tz = 0; }
        }
        let mv = 0;
        if (attackFence && o.kind === 'jumper') attackFence = null;   // çitin üstünden atlar
        if (attackFence) {
          o.vx = o.vz = 0;
          if (!o.dead && o.atk <= 0 && o.stun <= 0) { o.atk = 1.3; o.lunge = 0.25; attackFence.hp -= o.dmg; if (attackFence.hp <= 0) { const it = slot(attackFence); DS.f[attackFence.i] = null; CZ.state.save(); drawPad(attackFence); floatAt(attackFence, t('def.fenceBroke'), 'wave'); CZ.audio.sfx('crack'); } }
        } else if (o.ranged && !o.flee && dp < 8.5 && dp > 1.5 && P.down <= 0 && (tx === P.x && tz === P.z)) {
          o.vx = o.vz = 0;
          if (o.atk <= 0.35 && o.atk > 0 && o.stun <= 0 && !o.aimFx) { o.aimFx = true; o.lunge = 0.3; }   // atmadan önce geri çekilir: kaçabilirsin
          if (o.atk <= 0 && o.stun <= 0) { o.atk = 2.2; o.aimFx = false; shootDart(o); }
        } else if (!o.flee && dp < 1.5 && P.down <= 0) {
          o.vx = o.vz = 0;
          if (o.atk <= 0 && o.stun <= 0) { o.atk = 1.7; o.lunge = 0.25; hurt(o.dmg); if (o.z3.hit) o.z3.hit(); }
        } else {
          const ddx = tx - o.x, ddz = tz - o.z, L2 = Math.hypot(ddx, ddz) || 1;
          o.vx = ddx / L2 * sp; o.vz = ddz / L2 * sp; mv = 1;
        }
        const k = o.stun > 0 ? 0 : 1;
        // nehir arada kalıyorsa köprüye yönel (giriş → çıkış)
        if ((o.vx || o.vz) && !attackFence) { const tx2 = o.x + o.vx * 6, tz2 = o.z + o.vz * 6; const w2 = route(o.x, o.z, o.flee ? tx2 : (dp < 40 && !o.village ? P.x : tx2), o.flee ? tz2 : (dp < 40 && !o.village ? P.z : tz2)); if (w2) { const L4 = Math.hypot(w2[0] - o.x, w2[1] - o.z) || 1; o.vx = (w2[0] - o.x) / L4 * o.speed; o.vz = (w2[1] - o.z) / L4 * o.speed; } }
        let [nx, nz] = collide(o.x + o.vx * dt * k, o.z + o.vz * dt * k, 0.45);
        if (water(nx, nz)) { if (!water(nx, o.z)) nz = o.z; else if (!water(o.x, nz)) nx = o.x; else { nx = o.x; nz = o.z; } }
        // sağlam çitten geçemez
        const nr = Math.hypot(nx, nz);
        if (!o.flee && rc >= FENCE_R && nr < FENCE_R + 0.6) {
          const seg = ((Math.floor(((Math.atan2(nz, nx) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 4))) % 8);
          const fp = pads.find(p => p.kind === 'f' && p.i === seg);
          if (fp && slot(fp) && slot(fp).lv >= 1 && fp.hp > 0) { if (o.kind === 'jumper') o.hop = 0.5; else if (o.kind === 'bomber') { fp.hp = 0; DS.f[fp.i] = null; CZ.state.save(); drawPad(fp); floatAt(fp, t('def.fenceBroke'), 'wave'); boomFx(o.x, o.z); CZ.audio.sfx('crack'); o.coins = 0; o.hp = 0; kill(o, true); return; } else { nx = nx / nr * (FENCE_R + 0.6); nz = nz / nr * (FENCE_R + 0.6); } }
        }
        o.x = nx; o.z = nz;
        // köyün kalbine ulaştı: altın çalıp kaçar
        if (!o.flee && Math.hypot(o.x, o.z) < CORE_R) {
          const steal = Math.max(0, Math.min(V.earned - (V.lost || 0), 10 + V.wave * 2, 20, d.gold || 0)); V.lost = (V.lost || 0) + steal;   // bankadaki altın güvende
          d.gold = (d.gold || 0) - steal; resUi(); o.stolen += steal; o.flee = true;
          if (steal > 0) { floatAt(o, t('def.stole', { n: steal }), 'wave'); CZ.audio.sfx('wrong'); }
        }
        if (o.hop > 0) o.hop -= dt;
        o.mesh.position.set(o.x, o.hop > 0 ? Math.sin(o.hop / 0.5 * Math.PI) * 2.2 : 0, o.z);
        const face = (o.vx || o.vz) ? Math.atan2(-o.vx, -o.vz) : Math.atan2(-dxp, -dzp);
        o.mesh.rotation.y = attackFence ? Math.atan2(o.x, o.z) : face;
        o.spear.position.z = -0.1 - o.lunge * 2.2;
        if (o.ice && o.ice.visible) o.ice.position.set(o.x, o.ice.position.y, o.z);
        o.z3.update(dt, { running: mv > 0 && k > 0 && !(o.frozen > 0), dizzy: o.stun > 0 && !(o.frozen > 0), look: false });
      });
      dartTick(dt); trailTick(dt);
      if (tapAim.id !== null && V.cool <= 0 && P.down <= 0) fireAt(tapAim.x, tapAim.y);
      if (hurtTint > 0 || V._tinted) { hurtTint = Math.max(0, hurtTint - dt); const on = hurtTint > 0 && Math.floor(hurtTint * 20) % 2 === 0; heroMats.forEach(m => m.emissive.setHex(on ? 0xcc1010 : 0x000000)); V._tinted = hurtTint > 0; }
      wrap.classList.toggle('lowhp', P.down <= 0 && P.hp > 0 && P.hp / P.maxHp < 0.35);
      // hedeflerin sarsılması geri gelsin
      targets.forEach(o => { if (o.flash > 0) { o.flash -= dt; if (o.flash <= 0) o.mesh.scale.setScalar(o.base); } });

      // mermiler
      for (let i = shots.length - 1; i >= 0; i--) {
        const s2 = shots[i];
        s2.m.position.x += s2.dx * s2.sp * dt; s2.m.position.z += s2.dz * s2.sp * dt;
        if (s2.ph != null) { s2.ph += dt * 22; const w = Math.sin(s2.ph) * 0.12; s2.m.position.x += -s2.dz * w * dt * 6; s2.m.position.z += s2.dx * w * dt * 6; s2.m.position.y = s2.y0 + Math.sin(s2.ph * 0.5) * 0.08; s2.m.scale.setScalar(1 + Math.sin(s2.ph) * 0.12);
          s2.tr = (s2.tr || 0) - dt; if (s2.tr <= 0) { s2.tr = 0.03; const tm = new THREE.Mesh(ballGeo, trailMat); tm.position.copy(s2.m.position); tm.scale.setScalar(0.6); scene.add(tm); trails.push({ m: tm, t: 0 }); } }
        s2.life -= dt;
        let hitO = null;
        for (const o of targets) { if (o.dead || o.locked) continue; if (Math.hypot(o.x - s2.m.position.x, o.z - s2.m.position.z) < o.r + 0.35) { hitO = o; break; } }
        if (!hitO && ice.alive && Math.hypot(ice.x - s2.m.position.x, ice.z - s2.m.position.z) < ice.r) { s2.life = 0; if (!V.iceHint2) { V.iceHint2 = true; floatAt(ice, t('valley.needPolar')); } }
        if (hitO) { hit(hitO, W.dmg * 2 + B.dmg + powLv() * 2 + (P.riding ? 1 : 0)); s2.life = 0; }
        else if (solids.some(sd => sd !== ice && Math.hypot(sd.x - s2.m.position.x, sd.z - s2.m.position.z) < sd.r * 0.8)) s2.life = 0;
        if (s2.life <= 0) { scene.remove(s2.m); shots.splice(i, 1); }
      }
      // yerdeki altınlar: sıçrar, sonra oyuncuya çekilir
      const magR = (P.riding ? 4.5 : 3.2) + B.magnet;
      for (let i = drops.length - 1; i >= 0; i--) {
        const c = drops[i]; c.t += dt;
        const m = c.m;
        if (m.position.y > 0.3 || c.vy > 0) { c.vy -= 18 * dt; m.position.y = Math.max(0.3, m.position.y + c.vy * dt); m.position.x += c.vx * dt; m.position.z += c.vz * dt; if (m.position.y <= 0.3) { c.vx *= 0.3; c.vz *= 0.3; c.vy = 0; } }
        m.rotation.y += dt * 6;
        const dx = P.x - m.position.x, dz = P.z - m.position.z, dd = Math.hypot(dx, dz);
        if (c.t > 0.35 && dd < magR) { m.position.x += dx * Math.min(1, dt * 9); m.position.z += dz * Math.min(1, dt * 9); }
        if (c.t > 0.35 && dd < 0.8) { scene.remove(m); drops.splice(i, 1); gain(1); }
        else if (c.t > 25) { scene.remove(m); drops.splice(i, 1); }
      }
      // yığınlar
      for (let i = piles.length - 1; i >= 0; i--) {
        const p = piles[i];
        p.mesh.rotation.y += dt;
        if (Math.hypot(p.x - P.x, p.z - P.z) < (P.riding ? 1.6 : 1.1)) { scene.remove(p.mesh); piles.splice(i, 1); gain(p.value); floatAt(p, '+' + p.value); setTimeout(() => { if (V) spawnPile(); }, rand(9000, 16000)); }
      }
      // doğrudan kazanç (kutudan kalan kısım) yavaş yavaş sayılır: sayaç tıkır tıkır artsın
      { const a = flakeGeo.attributes.position; for (let i = 0; i < flakeN; i++) { let y = a.array[i * 3 + 1] - dt * 2.2; if (y < 0) y += 18; a.array[i * 3 + 1] = y; a.array[i * 3] += Math.sin(y + i) * dt * 0.4; } a.needsUpdate = true; flakes.position.set(P.x, 0, P.z); }
      flame.scale.set(1 + Math.sin(performance.now() / 90) * 0.12, 1 + Math.sin(performance.now() / 70) * 0.18, 1);
      star.rotation.y += dt;
      mapT -= dt; if (mapT <= 0) { mapT = 0.12; drawMap(); drawEdges(); }
    }
    // Mini harita: kutular, altın yığınları, yardakçılar, mağara, bineğin ve sen
    function drawMap() {
      const W2 = 220, k = W2 / 2 / (WORLD_R + 2), cx = W2 / 2;
      const X = x => cx + x * k, Z = z => cx + z * k;
      mctx.clearRect(0, 0, W2, W2);
      if (!V.mapBg) {   // arazi bir kez çizilir: kar, çimen, nehir, göller, orman ve kayalıklar
        const c = document.createElement('canvas'); c.width = c.height = W2; const x = c.getContext('2d');
        x.save(); x.beginPath(); x.arc(cx, cx, cx - 2, 0, 7); x.clip();
        for (let py = 0; py < W2; py += 4) for (let px = 0; px < W2; px += 4) { const wx = (px - cx) / k, wz = (py - cx) / k; const nz = noise(wx, wz);
          x.fillStyle = inRiver(wx, wz) ? '#3d8fd6' : inLake(wx, wz) ? '#a8dcf6' : nz > 0.75 ? '#9ec08a' : nz > 0.55 ? '#c4d8c4' : '#e8eef8'; x.fillRect(px, py, 4, 4); }
        chunkList.forEach(ch => ch.items.forEach(it => { x.fillStyle = it.kind === 'tree' ? 'rgba(40,110,60,.55)' : 'rgba(110,116,130,.6)'; x.fillRect(X(it.x) - 1, Z(it.z) - 1, 2.5, 2.5); }));
        bridges.forEach(([bx, bz]) => { x.fillStyle = '#8a5a30'; x.fillRect(X(bx) - 3, Z(bz) - 3, 6, 6); });
        x.restore(); V.mapBg = c;
      }
      mctx.drawImage(V.mapBg, 0, 0);
      mctx.fillStyle = 'rgba(200,210,230,.9)'; mctx.beginPath(); mctx.arc(cx, cx, FENCE_R * k, 0, 7); mctx.fill();
      pads.forEach(p => { const it = slot(p); if (p.kind === 'f') { if (it && it.lv) { mctx.strokeStyle = it.job ? '#4ab0ff' : '#8a5a2a'; mctx.lineWidth = 3; mctx.beginPath(); mctx.arc(cx, cx, FENCE_R * k, p.i / 8 * Math.PI * 2, (p.i + 1) / 8 * Math.PI * 2); mctx.stroke(); } }
        else if (it) { mctx.fillStyle = it.type === 'cannon' ? '#3a3a44' : '#5a7ab8'; mctx.beginPath(); mctx.arc(X(p.x), Z(p.z), 4.5, 0, 7); mctx.fill(); }
        else { mctx.strokeStyle = '#d8a010'; mctx.lineWidth = 1.5; mctx.beginPath(); mctx.arc(X(p.x), Z(p.z), 3.5, 0, 7); mctx.stroke(); } });
      mctx.fillStyle = '#c8302a'; mctx.fillRect(cx - 4, cx - 5, 8, 8);
      camps.forEach(c => { const on = campOn(c); mctx.fillStyle = on ? '#7a2a9a' : '#3cbe5a'; mctx.beginPath(); mctx.moveTo(X(c.x), Z(c.z) - 6); mctx.lineTo(X(c.x) + 5.5, Z(c.z) + 4); mctx.lineTo(X(c.x) - 5.5, Z(c.z) + 4); mctx.closePath(); mctx.fill(); mctx.strokeStyle = '#fff'; mctx.lineWidth = 1.2; mctx.stroke();
        if (on) { mctx.fillStyle = '#fff'; mctx.font = 'bold 8px sans-serif'; mctx.textAlign = 'center'; mctx.fillText(String(c.st.tier), X(c.x), Z(c.z) + 3); } });
      mctx.fillStyle = '#7a8296'; mctx.beginPath(); mctx.arc(X(-38), Z(-31), 5, 0, 7); mctx.fill();
      targets.forEach(o => {
        if (o.dead) return;
        if (o.type === 'box') { mctx.fillStyle = o.maxHp > 3 ? '#9a4ad0' : '#e0323a'; mctx.fillRect(X(o.x) - 4.5, Z(o.z) - 4.5, 9, 9); mctx.strokeStyle = '#fff'; mctx.lineWidth = 1.5; mctx.strokeRect(X(o.x) - 4.5, Z(o.z) - 4.5, 9, 9); }
        else if (o.type === 'goblin') { mctx.fillStyle = '#e0323a'; mctx.beginPath(); mctx.arc(X(o.x), Z(o.z), 3.6, 0, 7); mctx.fill(); mctx.strokeStyle = '#fff'; mctx.lineWidth = 1; mctx.stroke(); }
        else if (o.type === 'chest') { mctx.fillStyle = o.locked ? '#7fd0ff' : '#ffd23a'; mctx.font = 'bold 16px sans-serif'; mctx.textAlign = 'center'; mctx.fillText(o.locked ? '❄' : '★', X(o.x), Z(o.z) + 6); }
      });
      if (!P.riding) { mctx.fillStyle = '#7a4a2a'; mctx.beginPath(); mctx.arc(X(M.x), Z(M.z), 5, 0, 7); mctx.fill(); }
      // görüş alanı ve oyuncu oku
      mctx.strokeStyle = 'rgba(30,40,80,.35)'; mctx.lineWidth = 1.5; mctx.beginPath(); mctx.arc(X(P.x), Z(P.z), RANGE * k, 0, 7); mctx.stroke();
      mctx.save(); mctx.translate(X(P.x), Z(P.z)); mctx.rotate(-P.dir);
      mctx.fillStyle = '#ffffff'; mctx.strokeStyle = '#1a2040'; mctx.lineWidth = 3;
      mctx.beginPath(); mctx.moveTo(0, -10); mctx.lineTo(7, 7); mctx.lineTo(0, 3); mctx.lineTo(-7, 7); mctx.closePath(); mctx.stroke(); mctx.fill();
      mctx.restore();
      mctx.strokeStyle = 'rgba(255,255,255,.95)'; mctx.lineWidth = 4; mctx.beginPath(); mctx.arc(cx, cx, cx - 2, 0, 7); mctx.stroke();
    }
    // Ekran dışındaki en yakın kutulara kenar okları
    function drawEdges() {
      const list = targets.filter(o => !o.dead && !o.locked && o.type === 'goblin').map(o => ({ o, d: Math.hypot(o.x - P.x, o.z - P.z) }))
        .filter(x => { v3.set(x.o.x, 0.6, x.o.z).project(camera); return Math.abs(v3.x) > 0.95 || Math.abs(v3.y) > 0.9; })
        .sort((a, b) => a.d - b.d).slice(0, 3);
      edgeArrows.forEach((a, i) => {
        const it = list[i];
        if (!it) { a.style.display = 'none'; return; }
        const dx = it.o.x - P.x, dz = it.o.z - P.z, L2 = Math.hypot(dx, dz);
        const W2 = ui.clientWidth, H2 = ui.clientHeight;
        const sx = dx / L2, sy = dz / L2;
        const tt = Math.min((W2 / 2 - 34) / Math.max(0.01, Math.abs(sx)), (H2 / 2 - (sy > 0 ? 190 : 150)) / Math.max(0.01, Math.abs(sy)));   // alttaki düğmelere binmesin
        a.style.display = 'block';
        a.style.left = (W2 / 2 + sx * tt) + 'px'; a.style.top = (H2 / 2 + sy * tt) + 'px';
        a.style.transform = `translate(-50%,-50%) rotate(${Math.atan2(sy, sx)}rad)`;
        a.firstChild.style.transform = `rotate(${-Math.atan2(sy, sx)}rad)`;
        a.firstChild.textContent = Math.round(L2) + 'm';
        a.classList.toggle('big', it.o.type === 'chest' || it.o.maxHp > 3);
      });
    }
    let mapT = 0;
    const rings = [];
    const tshots = [], booms = [];
    const cannonGeo = new THREE.SphereGeometry(0.3, 10, 8), cannonMat = toon(0x2a2a32);
    // donmuş goblin: yarı saydam buz kabuğu (paylaşılan geometri/malzeme, ucuz)
    const iceGeo = new THREE.IcosahedronGeometry(1, 1), iceMat = new THREE.MeshBasicMaterial({ color: 0x8fd8ff, transparent: true, opacity: 0.45, depthWrite: false });
    function iceOn(o) { if (!o.ice) { o.ice = new THREE.Mesh(iceGeo, iceMat); const s2 = o.boss ? 2.1 : o.r > 0.8 ? 1.5 : 1.15; o.ice.scale.set(s2 * 0.85, s2 * 1.15, s2 * 0.85); o.ice.position.y = s2 * 0.9; o.ice.renderOrder = 3; scene.add(o.ice); } o.ice.visible = true; }
    function iceOff(o, shatter) { if (!o.ice) return; o.ice.visible = false; if (shatter) { for (let k = 0; k < 5; k++) { const m = new THREE.Mesh(chipGeo, chipMats.ice); m.position.set(o.x, 1, o.z); scene.add(m); chips.push({ m, vx: rand(-3, 3), vy: rand(3, 6), vz: rand(-3, 3) }); } CZ.audio.sfx('crack'); } }
    function giftFx(x, z) { for (let k = 0; k < 10; k++) { const m = new THREE.Mesh(chipGeo, chipMats['g' + (k % 3)]); m.position.set(x, 0.8, z); scene.add(m); chips.push({ m, vx: rand(-4, 4), vy: rand(4, 8), vz: rand(-4, 4) }); } CZ.audio.sfx('gift'); }
    function boomFx(x, z) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffb04a, transparent: true, opacity: 0.8, depthWrite: false })); m.position.set(x, 0.6, z); scene.add(m); booms.push({ m, t: 0 }); }
    const reviveBtn = btn(t('def.revive'), () => CZ.ads.show(() => { if (!V || P.down <= 0) return; P.down = 0; P.hp = P.maxHp; P.hurtT = 2; downEl.remove(); CZ.audio.sfx('win'); }), 'primary', 'ic:play');
    const downEl = h('div', { class: 'def-down' }, h('b', { text: t('def.down') }), reviveBtn);
    let hurtTint = 0; const heroMats = []; hero.root.traverse(o => { if (o.isMesh && o.material && o.material.emissive && !heroMats.includes(o.material)) heroMats.push(o.material); });
    function hurt(n) {
      if (P.down > 0 || P.hurtT > 0 || V.dashT > 0) return;
      if (P.riding && mountDef.kind === 'mammoth') n = n / 2;   // mamut zırh gibi
      P.hurtT = 0.45; P.hp -= n;
      CZ.audio.sfx('hit'); CZ.audio.sfx('wrong'); CZ.audio.vibrate([70, 30, 40]);
      V.shake = Math.max(V.shake || 0, 0.35); floatAt(P, '-' + n, 'dmg me'); hurtTint = 0.3; hpPunch('hit');
      wrap.classList.remove('hurt'); void wrap.offsetWidth; wrap.classList.add('hurt');
      if (P.hp <= 0) { P.hp = 0; P.down = 3; P.riding = false; wrap.append(downEl); CZ.audio.sfx('lose'); }
    }
    // Maden (taş) ve oduncu (odun) kendi kendine üretir: üstlerinde balon çıkar, yanına gelince toplanır
    const PROD = [{ id: 'goldmine', res: 'gold' }, { id: 'mine', res: 'stone' }, { id: 'bakery', res: 'wood' }];
    let prodT = 0;
    function prodTick(dt) {
      prodT -= dt; if (prodT > 0 || !CZ.village || !CZ.VILLAGE_SPOTS) return; prodT = 0.5;
      CZ.village.tick(); const VV = CZ.village.ensure();
      PROD.forEach(q => {
        const [sx, sz] = CZ.VILLAGE_SPOTS[q.id], x = sx * VS, z = sz * VS, n = Math.floor(VV.store[q.id] || 0), L = CZ.village.lv(q.id);
        if (!q.spr) { q.spr = new THREE.Sprite(new THREE.SpriteMaterial({ depthTest: false, transparent: true })); q.spr.scale.set(2.2, 1.1, 1); q.spr.position.set(x, 4.6, z); q.spr.renderOrder = 5; scene.add(q.spr); }
        const show = L > 0 && n >= 5, key = Math.floor(n / 5);
        q.spr.visible = show;
        if (show && key !== q.key) { q.key = key; const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x2 = c.getContext('2d');
          x2.fillStyle = '#fff'; x2.strokeStyle = '#1b2a44'; x2.lineWidth = 8; x2.beginPath(); if (x2.roundRect) x2.roundRect(8, 8, 240, 92, 40); else x2.rect(8, 8, 240, 92); x2.fill(); x2.stroke();
          x2.beginPath(); x2.moveTo(110, 98); x2.lineTo(128, 122); x2.lineTo(146, 98); x2.fill();
          x2.font = 'bold 54px sans-serif'; x2.textAlign = 'center'; x2.textBaseline = 'middle'; x2.fillStyle = '#1b2a44'; x2.fillText((q.res === 'wood' ? '🪵' : q.res === 'gold' ? '🪙' : '🪨') + ' ' + n, 128, 56);
          if (q.spr.material.map) q.spr.material.map.dispose(); q.spr.material.map = new THREE.CanvasTexture(c); q.spr.material.needsUpdate = true; }
        if (show) q.spr.position.y = 4.6 + Math.sin(performance.now() / 300) * 0.15;
        if (L > 0 && n >= 1 && Math.hypot(P.x - x, P.z - z) < 4.6) { const got = CZ.village.collect(q.id); if (got) { floatAt({ x, z }, '+' + got + (q.res === 'wood' ? ' 🪵' : q.res === 'gold' ? ' 🪙' : ' 🪨'), 'auto'); resUi(); CZ.audio.sfx('coin'); q.key = -1; } }
      });
    }
    // Kule / çit yerinin yanına gelince panel açılır
    let nearPad = null, panelKey = '', onPad = null;
    function padNear(dt) {
      let best = null, bd = 2.4; onPad = null;
      pads.forEach(p => { if (!padVisible(p)) return; const [mx, mz] = markPos(p); const dd = Math.hypot(mx - P.x, mz - P.z); if (dd < bd) { bd = dd; best = p; } if (dd < 1.5) onPad = p; });
      if (onPad && P.down <= 0) flowTick(onPad, dt);
      prodTick(dt);
      // köy daireleri uzaktayken küçülür (kalabalık görünmesin), yaklaşınca büyür
      pads.forEach(p => { if (p.kind !== 'v' || !p.mark) return; const [mx, mz] = markPos(p); const tg = Math.hypot(mx - P.x, mz - P.z) < 5.5 ? 0.8 : 0.42; const sc = p.mark.scale.x + (tg - p.mark.scale.x) * Math.min(1, dt * 8); p.mark.scale.setScalar(sc); p.mark.material.opacity = 0.35 + (sc - 0.42) / 0.38 * 0.65; });
      if (!best) { const rr = Math.hypot(P.x, P.z); if (Math.abs(rr - FENCE_R) < 1.4) { const seg = ((Math.floor(((Math.atan2(P.z, P.x) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 4))) % 8); const fp = pads.find(p => p.kind === 'f' && p.i === seg); if (fp && slot(fp) && slot(fp).lv >= 1) { best = fp; onPad = fp; } } }   // çitin üstündeyken canını ve yükseltmesini göster
      if (best && !onPad && Math.hypot(P.vx, P.vz) > 2.2) best = null;   // koşarken panel ekranı kapatmasın
      if (best !== nearPad) { nearPad = best; padUi(true); }
      else if (nearPad) padUi(false);
      pads.forEach(p => { if (p.dirty) { p.redraw = (p.redraw || 0) - dt; if (p.redraw <= 0) { p.redraw = 0.15; p.dirty = false; drawMark(p); } } });
    }
    // bilgi paneli: ne yapılıyor, inşaat süresi ve hızlandırma (satın alma düğmesi yok: daireye girince akar)
    function padUi(force) {
      const p = nearPad;
      if (!p) { panel.classList.remove('on'); panel.replaceChildren(); panelKey = ''; return; }
      const it = slot(p);
      const jl = jobLeft(it);
      const L2 = left(p);
      const key = (p.kind + (p.i != null ? p.i : p.id)) + JSON.stringify(it) + Math.ceil(jl / 1000) + JSON.stringify(L2);
      if (!force && key === panelKey) return;
      panelKey = key;
      const kids = [];
      let name;
      if (p.kind === 'x') name = t('exp.title') + ' · ' + expLv() + '/' + EXP_MAX;
      else if (p.kind === 'v') name = t('vil.b.' + p.id) + ' · ' + t('vil.lv', { n: CZ.village.lv(p.id) });
      else name = (p.kind === 'f' ? t('def.fence') : t('def.' + p.type)) + (it && it.lv ? ' · ' + t('vil.lv', { n: it.lv }) : '');
      kids.push(h('b', { class: 'def-title', text: name }));
      if (it && it.job) {
        const s2 = Math.ceil(jl / 1000);
        kids.push(h('small', { text: (it.lv === 0 ? t('def.building') : t('def.upgrading', { n: it.job.to })) + ' · ' + Math.floor(s2 / 60) + ':' + String(s2 % 60).padStart(2, '0') }));
        kids.push(h('div', { class: 'def-row' },
          btn(t('def.now') + ' ' + (it.lv === 0 ? RUSH_BUILD : rushPrice(jl)), () => rushGold(p), 'primary', 'ui.gold'),
          btn(t('def.ad'), () => rushAd(p), 'ghost-dark', 'ic:play')));
      } else if (p.kind === 'v' && CZ.village.ensure().job && CZ.village.ensure().job.id === p.id) {
        const V2 = CZ.village.ensure(), s2 = Math.ceil(CZ.village.left() / 1000);
        kids.push(h('small', { text: t('def.upgrading', { n: V2.job.to }) + ' · ' + Math.floor(s2 / 3600) + ':' + String(Math.floor(s2 % 3600 / 60)).padStart(2, '0') + ':' + String(s2 % 60).padStart(2, '0') }));
        kids.push(h('div', { class: 'def-row' },
          btn(String(CZ.village.gemCost()), () => { if (CZ.village.rush() === 'short') { CZ.audio.sfx('wrong'); return CZ.ui.toast(t('vil.gemShort')); } placeVillage(); resUi(); padUi(true); }, 'primary', 'ui.emerald'),
          V2.job.ads < 3 ? btn('-30 ' + t('def.min'), () => CZ.ads.show(() => { CZ.village.adRush(); placeVillage(); padUi(true); }), 'ghost-dark', 'ic:play') : null));
      } else if (L2 && L2.length) {
        kids.push(h('small', { text: t('def.standHere') }));
        { const dd = CZ.state.data, sw = Math.max(0, ((L2.find(x => x.r === 'wood') || {}).n || 0) - (dd.wood || 0)), ss = Math.max(0, ((L2.find(x => x.r === 'stone') || {}).n || 0) - (dd.stone || 0));
          const cost = Math.ceil(sw * 0.4 + ss * 0.67), gNeed = (L2.find(x => x.r === 'gold') || {}).n || 0;
          if (cost > 0 && (dd.gold || 0) >= cost + Math.min(gNeed, 1)) kids.push(h('div', { class: 'def-row' }, btn(t('def.buyShort') + ' · ' + cost, () => { if ((dd.gold || 0) < cost) return; dd.gold -= cost; dd.wood = (dd.wood || 0) + sw; dd.stone = (dd.stone || 0) + ss; CZ.state.save(); resUi(); CZ.audio.sfx('coin'); padUi(true); }, 'primary', 'ui.gold'))); }
        if (p.kind === 'f' && it) kids.push(h('small', { text: t('def.fenceHp', { n: Math.max(0, Math.ceil(p.hp || 0)), m: p.hpMax || 0 }) }));
        if (p.kind === 'v') kids.push(h('small', { class: 'def-eff', text: t('vil.d.' + p.id) }));
        if (p.kind === 'x') kids.push(h('small', { class: 'def-eff', text: t('exp.d') }));
      } else kids.push(h('small', { text: t('up.max') }));
      panel.replaceChildren(...kids.filter(Boolean));
      panel.classList.add('on');
    }
    // TOPLAYICILIK: ağacın yanına gelince baltayla kes (odun), kayanın yanına gelince kazmayla kır (taş)
    const chips = [], chipGeo = new THREE.BoxGeometry(0.16, 0.16, 0.16), chipMats = { tree: toon(0xc8884a), rock: toon(0xb0b6c4), ice: new THREE.MeshBasicMaterial({ color: 0xbfeaff }), smoke: new THREE.MeshBasicMaterial({ color: 0x555a66, transparent: true, opacity: 0.6 }), g0: toon(0xe0302e), g1: toon(0x2fa040), g2: toon(0xffd23a) };
    // elde balta (ağaç) ya da kazma (kaya)
    const tools = (() => { const mk = pick2 => { const g = new THREE.Group(); const hd = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.95, 6), toon(0x7a4a24)); hd.position.y = 0.3; g.add(hd);
        const steel = toon(0x8f98a8), edge = toon(0xe8eef6);
        if (pick2) { [-1, 1].forEach(sd => { const pk = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.4, 6), steel); pk.rotation.z = -sd * (Math.PI / 2 + 0.25); pk.position.set(sd * 0.2, 0.72, 0); g.add(pk); }); const hb = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.1), steel); hb.position.y = 0.74; g.add(hb); }
        else { const sh = new THREE.Shape(); sh.moveTo(0, -0.07); sh.lineTo(0.14, -0.14); sh.quadraticCurveTo(0.24, 0, 0.14, 0.14); sh.lineTo(0, 0.07); sh.lineTo(0, -0.07);
          const bl = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.04, bevelEnabled: false }), steel); bl.position.set(0.02, 0.68, -0.02); g.add(bl);
          const eg = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.27, 0.045), edge); eg.position.set(0.2, 0.68, 0); g.add(eg); }
        g.rotation.x = Math.PI / 2; g.visible = false; if (hero.weaponSlot) hero.weaponSlot.add(g); return g; };
      return { tree: mk(false), rock: mk(true) }; })();
    let toolT = 0;
    function showTool(kind) { if (!hero.weaponSlot) return; hero.weaponSlot.children.forEach(c => { if (c !== tools.tree && c !== tools.rock) c.visible = !kind; }); tools.tree.visible = kind === 'tree'; tools.rock.visible = kind === 'rock'; }
    function harvest(dt) {
      toolT -= dt; if (toolT < 0 && (tools.tree.visible || tools.rock.visible)) showTool(null);
      for (let i = chips.length - 1; i >= 0; i--) { const c = chips[i]; c.vy -= 16 * dt; c.m.position.x += c.vx * dt; c.m.position.y += c.vy * dt; c.m.position.z += c.vz * dt; c.m.rotation.x += dt * 10; if (c.m.position.y < 0) { scene.remove(c.m); chips.splice(i, 1); } }
      trees.concat(rocks).forEach(it => { if (it.tilt > 0) { it.tilt = Math.max(0, it.tilt - dt * 0.8); setInst(it); } });
      V.hT = (V.hT || 0) - dt;
      if (V.hT > 0 || aimP.aiming || P.down > 0) return;
      let best = null, bd = 99;
      chunkList.forEach(c => { if (Math.hypot(c.cx - P.x, c.cz - P.z) > CH) return; c.items.forEach(it => { if (!it.alive) return; const dd = Math.hypot(it.x - P.x, it.z - P.z) - it.solid.r; if (dd < bd) { bd = dd; best = it; } }); });
      const reach = P.riding ? 1.7 : 1.15;
      if (!best || bd > reach) { V.harv = null; return; }
      V.harv = best;
      V.hT = P.riding ? 0.42 : 0.55;
      showTool(best.kind); toolT = 1;
      if (Math.hypot(P.vx, P.vz) < 1.5) P.dir = Math.atan2(-(best.x - P.x), -(best.z - P.z));
      if (hero.throwNow) hero.throwNow();
      const dmg = P.riding ? 3 : 2, kind = best.kind, res = kind === 'tree' ? 'wood' : 'stone';
      best.hp -= dmg; best.tilt = kind === 'tree' ? 0.14 : 0; if (kind === 'tree') setInst(best);
      for (let k = 0; k < 4; k++) { const m = new THREE.Mesh(chipGeo, chipMats[kind]); m.position.set(best.x, kind === 'tree' ? 1.1 : 0.7, best.z); scene.add(m); chips.push({ m, vx: rand(-3, 3), vy: rand(3, 6), vz: rand(-3, 3) }); }
      let n = dmg;
      CZ.audio.sfx(kind === 'tree' ? 'hit' : 'crack');
      if (best.hp <= 0) {
        n += 10;
        best.alive = false; best.solid.off = true; setInst(best);
        const it = best;
        setTimeout(() => { if (!V) return; if (Math.hypot(it.x - P.x, it.z - P.z) < 2) return; it.alive = true; it.hp = it.maxHp; it.solid.off = false; setInst(it); }, rand(70000, 110000));
      }
      d[res] = (d[res] || 0) + n; resUi();
      floatAt(best, '+' + n + (res === 'wood' ? ' 🪵' : ' 🪨'), 'res');
      if (V.tut) V.tut.on(res);
    }
    // dört para birimi: odun, taş, altın, zümrüt
    function resUi() {
      woodEl.textContent = Math.floor(d.wood || 0); stoneEl.textContent = Math.floor(d.stone || 0);
      goldEl.textContent = Math.floor(d.gold || 0); gemEl.textContent = Math.floor(d.emeralds || 0);
      if (V && (V.ordT = (V.ordT || 0) + 1) % 20 === 1) ordUi();   // sipariş hazır mı (seyrek kontrol)
    }
    function gain(n, quiet) {
      if (V.boostT > 0) n *= 2;   // reklamla x2 altın
      V.earned += n;
      d.gold = (d.gold || 0) + n;
      resUi();
      if (!quiet) { V.streak = performance.now() - (V.lastGain || 0) < 450 ? (V.streak || 0) + 1 : 0; V.lastGain = performance.now(); CZ.audio.sfx('coin', V.streak); bump(); }
    }
    function draw(dt) {
      // oyuncu ve binek görünümü
      mount.root.position.set(M.x, 0, M.z);
      mount.root.rotation.y = M.dir;
      mount.update(dt, P.riding ? Math.hypot(P.vx, P.vz) : M.speed);
      const moving = Math.hypot(P.vx, P.vz) > 0.6;
      if (P.riding) {
        hero.root.position.set(P.x, mount.seatY - 0.12 + (mount.root.children[0].position.y || 0), P.z);
        hero.update(dt, { sit: true });
      } else {
        hero.root.position.set(P.x, 0, P.z);
        hero.update(dt, { idle: !moving, speed: Math.hypot(P.vx, P.vz) * 2 });
      }
      hero.root.rotation.y = P.dir;
      heroShadow.visible = false;
      // nişan
      if (aimP.aiming) {
        const dx = aimP.dx, dz = aimP.dy, L2 = Math.hypot(dx, dz) || 1;
        aim.visible = true;
        aim.position.set(P.x + dx / L2 * 5, 0.06, P.z + dz / L2 * 5);
        aim.rotation.set(-Math.PI / 2, 0, Math.atan2(dx, -dz) * -1);
        P.dir = Math.atan2(-dx / L2, -dz / L2);
      }
      targets.forEach(o => { if (o.bar) { o.bar.g.position.set(o.x, o.barY || (o.type === 'goblin' ? 2.7 : 2.2), o.z); o.bar.g.quaternion.copy(camera.quaternion); } });
      milaMount.update(dt, 0);
      milaHero.root.position.set(MILA.x, milaMount.seatY - 0.12, MILA.z); milaHero.root.rotation.y = milaMount.root.rotation.y;
      milaHero.update(dt, { sit: true });
      if (bubble.isConnected) { v3.set(MILA.x, 4.6, MILA.z).project(camera); const W2 = ui.clientWidth, H2 = ui.clientHeight; bubble.style.left = Math.max(130, Math.min(W2 - 130, (v3.x + 1) / 2 * W2)) + 'px'; bubble.style.top = Math.max(350, Math.min(H2 - 200, (1 - v3.y) / 2 * H2)) + 'px'; }
      if (V.tut && guide.isConnected) { const g = V.tut.target(); if (g) { v3.set(g.x, 3, g.z).project(camera); const inS = Math.abs(v3.x) < 0.9 && Math.abs(v3.y) < 0.85; const W2 = ui.clientWidth, H2 = ui.clientHeight; let gx = (v3.x + 1) / 2 * W2, gy = (1 - v3.y) / 2 * H2; let rot = 0; if (!inS) { const ax = g.x - P.x, az = g.z - P.z; rot = Math.atan2(az, ax) - Math.PI / 2; const L3 = Math.hypot(ax, az) || 1; gx = W2 / 2 + ax / L3 * (W2 / 2 - 40); gy = H2 / 2 + az / L3 * (H2 / 2 - 170); } guide.style.display = 'block'; guide.style.left = gx + 'px'; guide.style.top = gy + 'px'; guide.style.transform = `translate(-50%,-100%) rotate(${rot}rad)`; guide.classList.toggle('edge', !inS); } else guide.style.display = 'none'; }
      // otomatik hedef halkası
      const o = nearestTarget(RANGE);
      rangeRing.visible = aimP.id !== null; rangeRing.position.set(P.x, 0.04, P.z);
      ring.visible = !!o && !aimP.aiming;
      if (o) { ring.position.set(o.x, 0.05, o.z); ring.scale.setScalar(o.r + 0.3 + Math.sin(performance.now() / 150) * 0.06); }
      // Albion gibi yukarıdan, hafif açılı kamera
      // dikey ekranda görüş alanı dar kalmasın: en-boy oranına göre uzaklaş
      const far = (camera.aspect < 1 ? 1 / Math.max(0.42, camera.aspect) * 0.62 : 1) * (P.riding ? 1.12 : 1);
      const ch = 15 * far, cd = 10.5 * far;
      const cx = P.x, cz = P.z + cd;
      camera.position.x += (cx - camera.position.x) * Math.min(1, dt * 5);
      camera.position.z += (cz - camera.position.z) * Math.min(1, dt * 5);
      camera.position.y += (ch - camera.position.y) * Math.min(1, dt * 3);
      camera.lookAt(camera.position.x, 0, camera.position.z - cd);
      if (V.cam) { const c2 = V.cam; c2.t = Math.min(1, (c2.t || 0) + dt / (c2.dur || 1.5)); const e = c2.t * c2.t * (3 - 2 * c2.t);
        if (!c2.from) c2.from = { p: camera.position.clone(), l: c2.lastLook || new THREE.Vector3(P.x, 0, P.z) };
        camera.position.lerpVectors(c2.from.p, c2.p, e); const lk = c2.from.l.clone().lerp(c2.l, e); camera.lookAt(lk); c2.lastLook = lk; }
      if (V.cineUpd) V.cineUpd(dt);
      if (V.shake > 0) { V.shake = Math.max(0, V.shake - dt * 1.6); const a2 = V.shake * 0.9; camera.position.x += (Math.random() - 0.5) * a2; camera.position.y += (Math.random() - 0.5) * a2; }
      v3.set(P.x, 1, P.z).applyMatrix4(camera.matrixWorldInverse);
      const pz = -v3.z; v3.set(P.x, 1, P.z).project(camera);
      const pr = renderer.getPixelRatio(), cw = renderer.domElement.width, chh = renderer.domElement.height;
      seeU.uSee.value.set((v3.x + 1) / 2 * cw, (v3.y + 1) / 2 * chh, pz); seeU.uSeeR.value = 70 * pr;
      sun.position.set(P.x + 14, 32, P.z + 8); sun.target.position.set(P.x, 0, P.z);
    }
    camera.position.set(P.x, 20, P.z + 14);
    function loop(now) {
      if (!V) return;
      V.raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - (V.last || now)) / 1000);
      V.last = now;
      if (V.running && !V.paused) step(dt);
      if (!V) return;
      draw(V.paused ? 0 : dt);
      post.render(scene, camera);
      // zayıf telefonda çözünürlüğü düşür (30 FPS altına inmesin)
      perf.acc += dt; perf.n++;
      if (perf.acc > 2) { const fps = perf.n / perf.acc; perf.acc = 0; perf.n = 0; V.fps = Math.round(fps); if (fps < 40 && post.level > 0) { post.level--; } else if (fps < 40 && ratioIdx < RATIOS.length - 1) { ratioIdx++; renderer.setPixelRatio(RATIOS[ratioIdx]); resize(); if (ratioIdx >= 2 && sun.castShadow) { sun.castShadow = false; } } }
    }
    V.raf = requestAnimationFrame(loop);
    V.keys = {};
    V.kd = e => { V.keys[e.key] = true; if (e.key === ' ') autoFire(); if (e.key === 'e') rideBtn.click(); };
    V.ku = e => { V.keys[e.key] = false; };
    window.addEventListener('keydown', V.kd); window.addEventListener('keyup', V.ku);
    CZ.audio.music('play');
    if (CZ.ads.playing) CZ.ads.playing();
    // ilk girişte kısa ipucu
    // Mila karşılar: sen yokken ne yaptığını anlatır
    function milaSay(text, ms) { bubble.lastChild.textContent = text; if (!bubble.isConnected) wrap.append(bubble); clearTimeout(MILA.say); MILA.say = setTimeout(() => bubble.remove(), ms || 6500); }
    {
      const VV = CZ.village.ensure(); const now = Date.now();
      if (!d.introDone) { /* prolog Mila'yı tanıtır */ }
      else if (!d.milaMet) { d.milaMet = true; milaSay(t('mila.first'), 9000); }
      else {
        // GECE BASKINI: sen yokken Zibo'nun çetesi gelir. Kuleler ve çit savunur, Mila elinden geleni yapar.
        const hrs = Math.min(12, Math.max(0, (now - (VV.leftAt || now)) / 3600000));
        const raiders = Math.floor(hrs * 6);
        if (raiders >= 3) {
          const towerPow = DS.t.reduce((n, x) => n + (x && x.lv > 0 ? (x.type === 'cannon' ? 2.2 : 1.5) * x.lv : 0), 0);
          const fenceN = DS.f.filter(x => x && x.lv > 0).length;
          const defense = 2 + towerPow * 1.2 + fenceN * 0.8 + (CZ.heroes ? CZ.heroes.defense() : 0);   // Mila tek başına ~2 goblin durdurur (saatte)
          const stopped = Math.min(raiders, Math.round(defense * Math.min(hrs, 6) * 0.45));
          const through = raiders - stopped;
          const safe = CZ.village.protect();
          const stolen = Math.max(0, Math.min(Math.round(through * 6), Math.floor((d.gold || 0) - safe)));
          let broke = 0;
          if (through > 0) DS.f.forEach((x, i) => { if (x && broke < Math.ceil(through / 6) && Math.random() < 0.5) { DS.f[i] = null; broke++; } });
          const loot = Math.round(stopped * 2.5);
          d.gold = Math.max(0, (d.gold || 0) - stolen + loot);
          resUi(); pads.forEach(drawPad);
          const rep = h('div', { class: 'modal-wrap raid-wrap' }, h('div', { class: 'modal raid-rep' },
            h('b', { class: 'lg-title', text: t('raid.title') }),
            h('img', { class: 'raid-face', src: (() => { try { return CZ.kk.portrait(d.avatar === 'elf' ? 'girl' : 'elf', 'front'); } catch (e) { return ''; } })(), alt: '' }),
            h('p', { class: 'raid-say', text: through > 0 ? t('raid.bad') : t('raid.good') }),
            h('div', { class: 'raid-grid' },
              h('span', {}, '👺 ', h('b', { text: String(raiders) }), h('small', { text: t('raid.came') })),
              h('span', {}, '🛡️ ', h('b', { text: String(stopped) }), h('small', { text: t('raid.stopped') })),
              h('span', { class: stolen ? 'bad' : '' }, img('ui.gold', 'mini-ico'), h('b', { text: (stolen ? '-' + stolen : '0') }), h('small', { text: t('raid.stolen') })),
              h('span', {}, img('ui.gold', 'mini-ico'), h('b', { text: '+' + loot }), h('small', { text: t('raid.loot') })),
              broke ? h('span', { class: 'bad' }, '🪵 ', h('b', { text: '-' + broke }), h('small', { text: t('raid.fence') })) : null),
            h('small', { class: 'raid-tip', text: t('raid.tip') }),
            btn(t('raid.ok'), () => { rep.remove(); V.paused = false; V.last = 0; milaSay(t('mila.rest'), 5000); }, 'primary wide')));
          wrap.append(rep); V.paused = true;
        } else milaSay(t('mila.hi'), 6500);
      }
      CZ.state.save();
      setTimeout(dailyGift, 1600);
    }
    // GÜNLÜK HEDİYE: 7 günlük seri; bir gün kaçırılırsa baştan başlar
    function dailyGift() {
      if (!V || !d.introDone || (d.tutV || 0) < 5) return;
      if (wrap.querySelector('.modal-wrap') || V.cine) return setTimeout(dailyGift, 1500);
      const day = n => { const x = new Date(n); return x.getFullYear() * 10000 + (x.getMonth() + 1) * 100 + x.getDate(); };
      const today = day(Date.now()), yest = day(Date.now() - 864e5);
      const L = d.login || (d.login = { last: 0, n: 0 });
      if (L.last === today) return;
      const n = L.last === yest ? (L.n % 7) + 1 : 1;
      const R = [{ gold: 60, wood: 40 }, { wood: 120, stone: 60 }, { emeralds: 3, sh: 3 }, { gold: 250 }, { wood: 200, stone: 140, sh: 5 }, { emeralds: 6 }, { emeralds: 12, gold: 600, sh: 12 }];
      const ic = k => k === 'gold' ? img('ui.gold', 'mini-ico') : k === 'emeralds' ? img('ui.emerald', 'mini-ico') : h('i', { text: k === 'wood' ? '🪵' : k === 'sh' ? '🧩' : '🪨' });
      const box = h('div', { class: 'modal-wrap gift-wrap' }, h('div', { class: 'modal gift-rep' },
        h('b', { class: 'lg-title', text: t('gift.title') }),
        h('small', { text: t('gift.sub', { n }) }),
        h('div', { class: 'gift-days' }, R.map((r, i) => h('div', { class: 'gift-day' + (i + 1 < n ? ' got' : i + 1 === n ? ' now' : '') },
          h('small', { text: t('gift.day', { n: i + 1 }) }),
          h('div', { class: 'gift-items' }, Object.entries(r).map(([k, v]) => h('span', {}, ic(k), h('b', { text: String(v) })))),
          i + 1 < n ? h('i', { class: 'gift-check', text: '✓' }) : null))),
        btn(t('gift.claim'), () => {
          Object.entries(R[n - 1]).forEach(([k, v]) => { if (k === 'sh') { if (CZ.heroes) { const hid = CZ.heroes.randomDrop(v); if (hid) setTimeout(() => CZ.ui.toast(t('hero.shardGot', { n: v, name: t('hero.n.' + hid) })), 400); } } else d[k] = (d[k] || 0) + v; }); heroUi();
          L.last = today; L.n = n; CZ.state.save(); resUi(); CZ.audio.sfx('win'); CZ.audio.vibrate([40, 30, 80]);
          box.remove(); V.paused = false; V.last = 0;
        }, 'primary wide')));
      wrap.append(box); V.paused = true; CZ.audio.sfx('buy');
    }
    // GÖREVLER: oyunda ne yapacağını adım adım gösterir
    // eski kayıtlar: zinciri yeni sıraya taşı (eski sıra: odun, taş, kule, goblin, binek)
    if (d.tutVer !== 2) { if ((d.tutV || 0) > 0) { d.tutV = Math.min(5, d.tutV + 1); d.introDone = true; } d.tutVer = 2; CZ.state.save(); }
    const TUT = [{ id: 'chase', n: 1 }, { id: 'wood', n: 8 }, { id: 'stone', n: 4 }, { id: 'build', n: 1 }, { id: 'goblin', n: 3 }];
    const tutEl = h('div', { class: 'quest' }, h('b'), h('i'));
    const guide = h('div', { class: 'guide-arrow', text: '▼' });
    V.tut = {
      on(kind) {
        const st = d.tutV || 0; if (st >= TUT.length || TUT[st].id !== kind) return;
        d.tutN = (d.tutN || 0) + 1;
        if (d.tutN >= TUT[st].n) { d.tutV = st + 1; d.tutN = 0; pads.forEach(drawMark); CZ.audio.sfx('win'); d.gold = (d.gold || 0) + 20; resUi(); floatAt(P, t('quest.done') + ' +20', 'wave'); if (d.tutV >= TUT.length) { milaSay(t('mila.tutDone'), 7000); pads.forEach(drawMark); if (CZ.heroes && !CZ.heroes.owned('rudi')) { CZ.heroes.st('rudi').lv = 1; CZ.heroes.setBuddy('rudi'); spawnBuddy(); heroUi(); setTimeout(() => { if (V) milaSay(t('hero.rudiJoin'), 8000); }, 7500); } } }
        CZ.state.save(); this.ui();
      },
      ui() {
        const st = d.tutV || 0;
        if (st >= TUT.length) { tutEl.remove(); guide.remove(); return; }
        if (!tutEl.isConnected) ui.append(tutEl, guide);
        tutEl.firstChild.textContent = t('quest.' + TUT[st].id);
        tutEl.lastChild.textContent = (d.tutN || 0) + '/' + TUT[st].n;
      },
      target() {
        const st = d.tutV || 0; if (st >= TUT.length) return null;
        const id = TUT[st].id; let best = null, bd = 1e9;
        const near = arr => arr.forEach(o => { if (o.alive === false || o.dead) return; const dd = Math.hypot(o.x - P.x, o.z - P.z); if (dd < bd) { bd = dd; best = o; } });
        if (id === 'wood') near(trees); else if (id === 'stone') near(rocks); else if (id === 'goblin') near(goblins);
        else if (id === 'build') { const p = pads.find(q => q.kind === 't' && !slot(q) && padVisible(q)); if (p) { const L3 = left(p) || []; const lack = L3.find(x => x.n > 0 && (d[x.r] || 0) <= 0); if (lack && lack.r !== 'gold') near(lack.r === 'wood' ? trees : rocks); else { const [mx, mz] = markPos(p); best = { x: mx, z: mz }; } } }
        else if (id === 'chase' && V.boss && !V.boss.dead) best = V.boss;
        return best;
      }
    };
    // ===================== PROLOG: Noel gecesi Zibo köyün hazinesini çalar =====================
    if (!d.introDone) {
      const NIGHT = { bg: new THREE.Color(0x141c3a), hemiS: new THREE.Color(0x6a7cc4), hemiG: new THREE.Color(0x1c2448), hi: 0.62, sun: new THREE.Color(0x9ab0ff), si: 0.45 };
      const DAY = { bg: new THREE.Color(SKY), hemiS: hemi.color.clone(), hemiG: hemi.groundColor.clone(), hi: hemi.intensity, sun: sun.color.clone(), si: sun.intensity };
      const setSky = k => { scene.background.copy(NIGHT.bg).lerp(DAY.bg, k); scene.fog.color.copy(scene.background); hemi.color.copy(NIGHT.hemiS).lerp(DAY.hemiS, k); hemi.groundColor.copy(NIGHT.hemiG).lerp(DAY.hemiG, k); hemi.intensity = NIGHT.hi + (DAY.hi - NIGHT.hi) * k; sun.color.copy(NIGHT.sun).lerp(DAY.sun, k); sun.intensity = NIGHT.si + (DAY.si - NIGHT.si) * k; lamps.forEach(l => { l.intensity = 1.6 * (1 - k); }); };
      const lamps = [[-4, -1], [4, -1], [0, 5], [-5, 6], [5, 6]].map(([x, z]) => { const l = new THREE.PointLight(0xffb060, 1.6, 11); l.position.set(x, 2.5, z); scene.add(l); return l; });
      setSky(0);
      V.story = {};
      V.cine = true;
      d.tutV = 0; d.tutN = 0;
      // Zibo: taçlı, sırtında köyün hazine sandığı
      const zb = CZ.kk.hasMX && CZ.kk.hasMX('zibo') || CZ.gen3d && CZ.KK_GEN && CZ.gen3d.has(CZ.KK_GEN.zibo) ? CZ.kk.zibo(THREE) : CZ.gen3d && CZ.gen3d.has('zibo') ? genBody('zibo', 2.2) : CZ.kk.zibo(THREE); if (!zb.gen) { zb.root.scale.setScalar(1.45); if (zb.setCrown) zb.setCrown(true); }
      const loot = CZ.gen3d.has('sandik_lo') ? CZ.gen3d.get('sandik_lo', 0.75) : new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.5), toon(0x8a5228));
      loot.position.set(0, 1.55, 0.35); loot.visible = false; zb.root.add(loot);
      zb.root.traverse(o => { o.castShadow = true; }); addOutline(zb.root, 0.02);
      const Z = { type: 'zibo', x: 0, z: -40, r: 1.1, hp: 20, maxHp: 20, barY: 3.7, mesh: zb.root, z3: zb, vx: 0, vz: 0, run: false, taunt: 0, dropT: 4 };
      zb.root.position.set(Z.x, 0, Z.z); scene.add(zb.root);
      const hallChest = CZ.gen3d.has('sandik_lo') ? CZ.gen3d.get('sandik_lo', 1.0) : new THREE.Mesh(new THREE.BoxGeometry(1, 0.7, 0.7), toon(0x8a5228));
      hallChest.position.set(0, 0, 1.2); scene.add(hallChest);
      const crew = [];
      for (let i = 0; i < 4; i++) { const g = goblinBody(false, false); if (!g.gen) g.root.scale.setScalar(0.9); g.root.traverse(o => { o.castShadow = true; }); addOutline(g.root, 0.02); g.root.position.set(rand(-3, 3), 0, -46 - i * 1.5); scene.add(g.root); crew.push({ g, x: g.root.position.x, z: g.root.position.z, ox: (i - 1.5) * 1.6 }); }
      // oyuncu evinin önünde uyuyor, ayı yanında
      P.x = 6; P.z = 9; P.dir = 0.6; M.x = 8.2; M.z = 8.5;
      // ---- arayüz: sinema bantları, konuşma kutusu, geç düğmesi
      const bars = h('div', { class: 'cine-bars' }, h('i'), h('i'));
      const cap = h('div', { class: 'cine-cap' });
      const skip = h('button', { class: 'cine-skip', type: 'button', text: t('pro.skip') + ' ›' });
      const box = h('div', { class: 'talk' }, h('img', { class: 'talk-face', alt: '' }), h('div', { class: 'talk-body' }, h('b', { class: 'talk-name' }), h('p', { class: 'talk-text' })), h('i', { class: 'talk-next', text: '▼' }));
      const faces = { zibo: CZ.gen3d && CZ.gen3d.has('zibo') ? 'assets/zibo/png/z3d.webp' : 'assets/zibo/png/laugh.webp', mila: (() => { try { return CZ.kk.portrait(d.avatar === 'elf' ? 'girl' : 'elf', 'wave'); } catch (e) { return ''; } })(), you: (() => { try { return CZ.kk.portrait(d.avatar || 'boy', 'front'); } catch (e) { return ''; } })() };
      ui.classList.add('cine-on'); wrap.append(bars, cap, skip);
      let skipping = false, typing = null, waitTap = null;
      const wait = ms => new Promise(ok => { if (skipping) return ok(); const id = setTimeout(ok, ms); V.story.cancel = () => { clearTimeout(id); ok(); }; });
      function say(who, key, prm) {
        if (skipping) return Promise.resolve();
        return new Promise(ok => {
          box.querySelector('.talk-face').src = faces[who] || ''; box.dataset.who = who;
          box.querySelector('.talk-name').textContent = who === 'zibo' ? 'Zibo' : who === 'mila' ? 'Mila' : t('pro.you');
          const full = t(key, prm); const el2 = box.querySelector('.talk-text'); el2.textContent = '';
          if (!box.isConnected) wrap.append(box);
          box.classList.remove('pop'); void box.offsetWidth; box.classList.add('pop');
          CZ.audio.sfx(who === 'zibo' ? 'poke' : 'button');
          let i2 = 0; clearInterval(typing);
          typing = setInterval(() => { i2 += 2; el2.textContent = full.slice(0, i2); if (i2 >= full.length) { clearInterval(typing); typing = null; } }, 28);
          waitTap = () => { if (typing) { clearInterval(typing); typing = null; el2.textContent = full; return; } waitTap = null; ok(); };
        });
      }
      box.addEventListener('pointerdown', e => { e.stopPropagation(); if (waitTap) waitTap(); });
      bars.addEventListener('pointerdown', () => { if (waitTap) waitTap(); });
      const caption = (key, ms) => { if (skipping) return Promise.resolve(); cap.textContent = t(key); cap.classList.add('on'); return wait(ms || 2600).then(() => cap.classList.remove('on')); };
      const camTo = (p, l, dur) => { V.cam = { p: new THREE.Vector3(...p), l: new THREE.Vector3(...l), dur: dur || 1.6, t: 0, lastLook: V.cam && V.cam.lastLook }; };
      // aktörlerin sinema hareketi
      let ziboGoal = null, crewOn = false, sleepT = 0;
      V.cineUpd = dt => {
        const dx = ziboGoal ? ziboGoal[0] - Z.x : 0, dz = ziboGoal ? ziboGoal[1] - Z.z : 0, L = Math.hypot(dx, dz);
        const moving = ziboGoal && L > 0.3;
        if (moving) { const sp = ziboGoal[2] || 7; Z.x += dx / L * Math.min(L, sp * dt); Z.z += dz / L * Math.min(L, sp * dt); zb.root.rotation.y = Math.atan2(-dx, -dz); }
        zb.root.position.set(Z.x, 0, Z.z); zb.update(dt, { running: moving, look: !moving });
        crew.forEach((c, i) => { if (!crewOn) { c.g.update(dt, {}); return; } const tx = Z.x + c.ox, tz = Z.z - 2 - i * 0.6, ddx = tx - c.x, ddz = tz - c.z, l2 = Math.hypot(ddx, ddz); if (l2 > 0.4) { c.x += ddx / l2 * Math.min(l2, 7.5 * dt); c.z += ddz / l2 * Math.min(l2, 7.5 * dt); c.g.root.rotation.y = Math.atan2(-ddx, -ddz); } c.g.root.position.set(c.x, 0, c.z); c.g.update(dt, { running: l2 > 0.4 }); });
      };
      skip.addEventListener('click', () => { skipping = true; if (waitTap) waitTap(); if (V.story.cancel) V.story.cancel(); });
      (async () => {
        camTo([0, 34, 30], [0, 0, -4], 0.01); await wait(60);
        camTo([0, 22, 22], [0, 0, 0], 4.5);
        await caption('pro.c1', 3000);
        await caption('pro.c2', 2600);
        // Zibo ve çetesi kuzeyden sessizce köye girer
        crewOn = true; ziboGoal = [0, 2.6, 5.5];
        camTo([8, 7, 7], [0, 1.2, 2.4], 3);
        await wait(3600);
        hallChest.visible = false; loot.visible = true; CZ.audio.sfx('coin');
        await say('zibo', 'pro.z1');
        CZ.audio.sfx('horn'); CZ.audio.vibrate([60, 40, 60]);
        // Mila uyanır, sana koşar
        camTo([P.x + 1, 9, P.z + 8], [P.x, 0.8, P.z], 1.6);
        await say('mila', 'pro.m1');
        await say('you', 'pro.p1');
        camTo([Z.x, 9, Z.z + 9], [Z.x, 1, Z.z], 1.3);
        await say('zibo', 'pro.z2');
        ziboGoal = [0, -30, 9];
        await wait(900);
        camTo([P.x + 1, 9, P.z + 8], [P.x, 0.8, P.z], 1.2);
        await say('mila', 'pro.m2');
        // binişe geç: oyun başlar
        bars.classList.add('out'); skip.remove(); box.remove(); cap.remove();
        setTimeout(() => bars.remove(), 600);
        ui.classList.remove('cine-on');
        hallChest.visible = false; loot.visible = true;
        V.cam = null; V.cine = false; V.cineUpd = null;
        crew.forEach(c => { scene.remove(c.g.root); });
        P.riding = true; M.x = P.x; M.z = P.z;
        Z.x = 0; Z.z = -26; ziboGoal = null; Z.run = true;
        Z.hp = Z.maxHp; targets.push(Z); hpBar(Z); V.boss = Z;
        V.tut.ui(); floatAt(P, t('quest.chase') + '!', 'wave'); CZ.audio.sfx('star');
        V.story.chase = true;
      })();
      // ---- kovalamaca: Zibo kaçar, arkasına yardakçı bırakır, uzaklaşınca durup dalga geçer
      V.story.tick = dt => {
        if (!V.story.chase || Z.dead) return;
        const dx = Z.x - P.x, dz = Z.z - P.z, dd = Math.hypot(dx, dz) || 1;
        Z.taunt -= dt; Z.dropT -= dt; Z.stunT = Math.max(0, (Z.stunT || 0) - dt);
        let sp = dd < 7 ? mountDef.speed * 0.92 : dd < 16 ? mountDef.speed * 0.7 : 0;
        if (Z.stunT > 0) sp = 0;
        // kaçış yönü: oyuncudan uzağa, dünya sınırında yana dön, nehre girme
        let fx = dx / dd, fz = dz / dd; const rr = Math.hypot(Z.x, Z.z);
        if (rr > WORLD_R - 18) { const tx = -Z.z / rr, tz = Z.x / rr; const sgn = (tx * fx + tz * fz) > 0 ? 1 : -1; fx = fx * 0.3 + tx * sgn; fz = fz * 0.3 + tz * sgn; const l3 = Math.hypot(fx, fz); fx /= l3; fz /= l3; }
        if (sp > 0) { let [nx, nz] = collide(Z.x + fx * sp * dt, Z.z + fz * sp * dt, 0.6); if (water(nx, nz) || inLake(nx, nz)) { nx = Z.x - fz * sp * dt; nz = Z.z + fx * sp * dt; if (water(nx, nz)) { nx = Z.x; nz = Z.z; } } Z.x = nx; Z.z = nz; zb.root.rotation.y = Math.atan2(-fx, -fz); }
        else zb.root.rotation.y = Math.atan2(dx, dz);
        if (sp === 0 && dd >= 16 && Z.taunt <= 0) { Z.taunt = 4; floatAt(Z, t('pro.taunt' + (1 + Math.floor(Math.random() * 3))), 'zibo'); }
        if (Z.dropT <= 0 && goblins.length < 3 && dd < 22) { Z.dropT = 5; spawnGoblin(); const g = goblins[goblins.length - 1]; g.x = Z.x + rand(-1.5, 1.5); g.z = Z.z + rand(-1.5, 1.5); g.village = false; g.coins = 3; }
        zb.root.position.set(Z.x, 0, Z.z); zb.update(dt, { running: sp > 0, dizzy: Z.stunT > 0, look: sp === 0 });
      };
      V.story.ziboHit = o => { o.stunT = 0.35; if (o.hp > 0 && o.hp % 4 === 0) floatAt(o, t('pro.ouch'), 'zibo'); };
      V.story.ziboDown = o => {
        o.dead = true; V.story.chase = false; const i3 = targets.indexOf(o); if (i3 >= 0) targets.splice(i3, 1);
        if (o.bar) { scene.remove(o.bar.g); o.bar = null; }
        loot.visible = false;
        // sandık yere düşer, altın fışkırır
        const ch2 = CZ.gen3d.has('sandik_lo') ? CZ.gen3d.get('sandik_lo', 1.0) : new THREE.Mesh(new THREE.BoxGeometry(1, 0.7, 0.7), toon(0x8a5228)); ch2.position.set(o.x, 0, o.z); scene.add(ch2);
        dropCoins(o.x, o.z, 40, 1.4); V.pending += 110; d.wood = (d.wood || 0) + 30; d.stone = (d.stone || 0) + 20; resUi();
        CZ.audio.sfx('win'); CZ.audio.vibrate([60, 30, 120]); V.shake = 0.5;
        floatAt(o, t('pro.z3'), 'zibo');
        // Zibo duman içinde kaybolur
        let k2 = 0; const run2 = setInterval(() => { k2++; zb.root.position.y += 0.35; zb.root.rotation.y += 0.6; zb.root.scale.multiplyScalar(0.9); if (k2 > 18) { clearInterval(run2); scene.remove(zb.root); } }, 40);
        V.tut.on('chase'); V.boss = null;
        // gün doğar
        let k = 0; const dawn = setInterval(() => { k = Math.min(1, k + 0.02); setSky(k); if (k >= 1) { clearInterval(dawn); lamps.forEach(l => scene.remove(l)); } }, 50);
        setTimeout(() => { if (!V) return; milaSay(t('pro.m3'), 8000); d.introDone = true; d.milaMet = true; V.story = null; CZ.state.save(); setTimeout(() => { if (V) scene.remove(ch2); }, 30000); }, 1800);
      };
    }
    V.tut.ui();
    resUi();
  }

  /* ---------- Akın sonu ---------- */
  function end() {
    if (!V || !V.running) return;
    V.running = false;
    const d = CZ.state.data;
    const earned = V.earned + V.pending;
    d.gold = (d.gold || 0) + V.pending; V.pending = 0;
    d.valleyRuns = (d.valleyRuns || 0) + 1;
    d.valleyBest = Math.max(d.valleyBest || 0, earned);
    CZ.state.save();
    if (CZ.quests) CZ.quests.track('crate');
    let doubled = false;
    const goldP = h('p', { class: 'reward' }, img('ui.gold', 'emerald-icon'), h('b', { text: '+' + earned }));
    const sheet = h('div', { class: 'sheet endless-over vl-over' },
      h('small', { text: t('valley.over') }),
      h('h2', { class: 'big-score', text: earned }),
      h('p', { text: t('valley.best', { n: d.valleyBest }) }),
      goldP,
      btn(t('endless.double', { n: earned }), e => {
        const b = e.currentTarget; if (doubled) return;
        CZ.ads.show(() => { doubled = true; d.gold += earned; CZ.state.save(); goldP.querySelector('b').textContent = '+' + earned * 2; b.remove(); CZ.audio.sfx('buy'); });
      }, 'ghost-dark wide', 'ic:play'),
      h('div', { class: 'sheet-row' },
        btn(t('win.toVillage'), () => CZ.ui.go('hub'), 'ghost-dark wide'),
        btn(t('valley.again'), () => CZ.ui.wipeTo('valley'), 'primary wide')));
    V.wrap.append(sheet);
    setTimeout(() => { if (V && V.wrap.contains(sheet)) CZ.ads.gameOver(); }, 1200);
  }

  function render(el, params) {
    el.classList.add('valley-screen');
    const loading = CZ.ui.loading(el);
    CZ.runner3d.load().then(() => CZ.gen3d.load()).then(() => {
      loading.done();
      if (!CZ.kk || !CZ.kk.ready()) throw new Error('no3d');
      build(el, params || {});
    }).catch(err => { console.error('valley', err && err.stack || err); loading.done(); CZ.ui.toast(t('run.noGl')); });
  }
  function leave() {
    if (!V) return;
    if (CZ.village) { CZ.village.ensure().leftAt = Date.now(); CZ.state.save(); }
    CZ.ui.toast(t('mila.bye'));
    if (CZ.notify) CZ.notify.schedule();
    if (V.running) { const d = CZ.state.data; d.gold = (d.gold || 0) + V.pending; CZ.state.save(); }
    cancelAnimationFrame(V.raf);
    document.removeEventListener('visibilitychange', V.onHide);
    window.removeEventListener('keydown', V.kd); window.removeEventListener('keyup', V.ku);
    V.cleanup();
    V = null;
  }
  function onBack() { if (V && V.running && !V.paused) { V.pause(); return true; } return false; }
  return { render, leave, onBack, music: null, get debug() { return V; } };
})();
