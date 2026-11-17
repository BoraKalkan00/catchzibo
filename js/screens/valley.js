// HAZİNE VADİSİ: Albion Online gibi yukarıdan bakılan küçük açık dünya.
// Sol: Brawl Stars tarzı yön çubuğu. Sağ: atış düğmesi (dokun = en yakın hedefe otomatik,
// basılı tut + sürükle = Mobile Legends gibi kendin nişan al). Ayılara ve geyiğe gerçekten binilir.
// 3 dakikalık akın: kutuları kır, altın yığınlarını topla, Zibo'nun yardakçılarından çuvalları düşür.
CZ.MOUNTS = [
  { id: 'brown', price: 0, speed: 10.5, color: 0x7a4a2a, light: 0xc89a6a, kind: 'bear' },
  { id: 'polar', price: 3500, speed: 10, color: 0xf3f3ee, light: 0xdcd6c8, kind: 'bear' },
  { id: 'deer', price: 6000, speed: 13, color: 0x8a5230, light: 0xe2c49a, kind: 'deer' }
];
CZ.screens.valley = (function () {
  // Ahırdaki binek resmi: 3D modelden bir kez çizilir
  const mountCache = {};
  CZ.mountPortrait = id => mountCache[id] || (mountCache[id] = CZ.runner3d.load().then(() => {
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
  const WORLD_R = 58;
  const SESSION = 180;

  /* ---------- Dört ayaklı binekler (kodla, çizgi film tarzı) ---------- */
  function quadruped(THREE, def) {
    const toon = c => new THREE.MeshLambertMaterial({ color: c });
    const fur = toon(def.color), light = toon(def.light), dark = toon(0x2a1a12);
    const g = new THREE.Group();
    const body = new THREE.Group(); g.add(body);
    const bear = def.kind === 'bear';
    const L = bear ? { len: 1.15, r: 0.55, leg: 0.62, legR: 0.17, neck: 0 } : { len: 1.0, r: 0.36, leg: 0.95, legR: 0.08, neck: 0.5 };
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
    const hr = bear ? 0.42 : 0.22;
    const skull = new THREE.Mesh(new THREE.SphereGeometry(hr, 14, 10), fur); skull.scale.set(1, 0.95, bear ? 1.05 : 1.4); head.add(skull);
    const snout = new THREE.Mesh(new THREE.SphereGeometry(hr * 0.5, 10, 8), light); snout.scale.set(1, 0.8, 1.2); snout.position.set(0, -hr * 0.2, -hr * 0.85); head.add(snout);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(hr * 0.18, 8, 6), dark); nose.position.set(0, -hr * 0.05, -hr * 1.35); head.add(nose);
    [-1, 1].forEach(sd => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(hr * 0.12, 8, 6), dark); eye.position.set(sd * hr * 0.42, hr * 0.2, -hr * 0.82); head.add(eye);
      const shine = new THREE.Mesh(new THREE.SphereGeometry(hr * 0.045, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff })); shine.position.set(sd * hr * 0.42 + 0.02, hr * 0.25, -hr * 0.92); head.add(shine);
      if (bear) {
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
    const tail = new THREE.Mesh(new THREE.SphereGeometry(bear ? 0.13 : 0.1, 8, 6), light); tail.position.set(0, L.leg + L.r * 1.0, L.len / 2 + L.r * 0.9); body.add(tail);
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

  /* ---------- Dünya ---------- */
  function build(el, params) {
    const THREE = window.THREE;
    const d = CZ.state.data;
    let V_move, V_up;
    const stage = h('div', { class: 'valley-stage' });
    const W = (CZ.GOLD.weapons.find(w => w.id === d.weapon) || CZ.GOLD.weapons[0]);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    const RATIOS = [Math.min(window.devicePixelRatio || 1, 1.75), 1.25, 1, 0.8];
    let ratioIdx = 0;
    renderer.setPixelRatio(RATIOS[0]);
    stage.append(renderer.domElement);
    const scene = new THREE.Scene();
    const SKY = 0xbcd4f2;
    scene.background = new THREE.Color(SKY);
    scene.fog = new THREE.Fog(SKY, 40, 75);
    const camera = new THREE.PerspectiveCamera(46, 1, 0.5, 160);
    scene.add(new THREE.HemisphereLight(0xeef4ff, 0x7a88a8, 0.8));
    const sun = new THREE.DirectionalLight(0xfff0d8, 0.75); sun.position.set(20, 40, 10); scene.add(sun); scene.add(sun.target);
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
    sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 5, far: 90 }); sun.shadow.bias = -0.002;
    const toon = c => new THREE.MeshLambertMaterial({ color: c });
    const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
    const seeU = { uSee: { value: new THREE.Vector3(-999, -999, 0) }, uSeeR: { value: 90 } };
    const seeThrough = mat => {
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
    const toonSee = c => seeThrough(new THREE.MeshLambertMaterial({ color: c }));

    // Zemin: kar, yollar ve doku için köşe renkleri
    const groundGeo = new THREE.PlaneGeometry(170, 170, 85, 85);
    groundGeo.rotateX(-Math.PI / 2);
    const pos = groundGeo.attributes.position, col = [];
    const roads = [[-20, 14, 24, -24], [-20, 14, -34, -30], [-20, 14, 26, 26]];
    const distSeg = (x, z, s) => { const [ax, az, bx, bz] = s; const vx = bx - ax, vz = bz - az; const tt = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz))); return Math.hypot(x - (ax + vx * tt), z - (az + vz * tt)); };
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const r = Math.hypot(x, z);
      let y = 0;
      if (r > WORLD_R + 4) y = (r - WORLD_R - 4) * 0.9 + Math.sin(x * 0.3) * Math.cos(z * 0.27) * 2.5;   // vadiyi çevreleyen tepeler
      pos.setY(i, y);
      const n = Math.sin(x * 0.7) * Math.cos(z * 0.6) * 0.04;
      const road = Math.min(...roads.map(s => distSeg(x, z, s)));
      let c = [0.86 + n, 0.9 + n, 0.98];
      if (road < 2.2) c = [0.6 + n, 0.54 + n, 0.5];
      if (Math.hypot(x - 20, z + 16) < 10.5) c = [0.62, 0.82, 0.95];   // donmuş göl
      if (y > 3) c = [0.82 + n, 0.86 + n, 0.94];
      col.push(...c);
    }
    groundGeo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    groundGeo.computeVertexNormals();
    const ground = new THREE.Mesh(groundGeo, new THREE.MeshLambertMaterial({ vertexColors: true })); ground.receiveShadow = true; scene.add(ground);
    // gölün parlaklığı
    const lake = new THREE.Mesh(new THREE.CircleGeometry(10.2, 40), new THREE.MeshLambertMaterial({ color: 0xa8dcf6, transparent: true, opacity: 0.55 }));
    lake.rotation.x = -Math.PI / 2; lake.position.set(20, 0.03, -16); scene.add(lake);

    // dışarıda kalan dağ zirveleri
    const peakGeo = new THREE.ConeGeometry(1, 1, 7);
    const peaks = new THREE.InstancedMesh(peakGeo, toon(0xe8eef8), 26);
    const tmp = new THREE.Object3D();
    for (let i = 0; i < 26; i++) {
      const a = i / 26 * Math.PI * 2 + rand(-0.1, 0.1), r = rand(74, 82);
      tmp.position.set(Math.cos(a) * r, 6, Math.sin(a) * r); tmp.scale.set(rand(9, 14), rand(16, 26), rand(9, 14)); tmp.rotation.y = rand(0, 6); tmp.updateMatrix();
      peaks.setMatrixAt(i, tmp.matrix);
    }
    scene.add(peaks);

    // Engeller (çarpışma için daireler)
    const solids = [];
    const free = (x, z, r) => Math.hypot(x, z) < WORLD_R - 2 && Math.hypot(x - 20, z + 16) > 11.5 + r && Math.min(...roads.map(s => distSeg(x, z, s))) > 2.6 + r && !solids.some(s => Math.hypot(s.x - x, s.z - z) < s.r + r + 1);
    // Köy: evler
    const houseCols = [0xc8302a, 0x2a7a46, 0x2f5fb8, 0xd88a2a, 0x8a4ad0];
    [[-26, 8], [-14, 6], [-28, 20], [-12, 22], [-20, 30], [-33, 12]].forEach(([x, z], i) => {
      const hg = new THREE.Group();
      hg.add(at(new THREE.Mesh(new THREE.BoxGeometry(4.4, 3, 4), toon(0xf0e2c8)), 0, 1.5, 0));
      const roof = new THREE.Mesh(new THREE.ConeGeometry(3.6, 2.4, 4), toon(houseCols[i % houseCols.length])); roof.rotation.y = Math.PI / 4; roof.position.y = 4.2; roof.scale.set(1, 1, 0.95); hg.add(roof);
      const snowCap = new THREE.Mesh(new THREE.ConeGeometry(3.0, 0.9, 4), toon(0xffffff)); snowCap.rotation.y = Math.PI / 4; snowCap.position.y = 5.05; hg.add(snowCap);
      const door = new THREE.Mesh(new THREE.BoxGeometry(1, 1.7, 0.1), toon(0x6a3a1e)); door.position.set(0, 0.85, 2.02); hg.add(door);
      [-1.4, 1.4].forEach(wx => { const w = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.1), new THREE.MeshBasicMaterial({ color: 0xffd98a })); w.position.set(wx, 1.9, 2.02); hg.add(w); });
      const chim = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.4, 0.6), toon(0x8a5a4a)); chim.position.set(1.1, 4.6, -0.6); hg.add(chim);
      hg.position.set(x, 0, z); hg.rotation.y = Math.atan2(-20 - x, 14 - z) + Math.PI;
      hg.traverse(o => { o.castShadow = true; if (o.material) o.material = seeThrough(o.material.clone()); }); scene.add(hg);
      solids.push({ x, z, r: 2.9 });
    });
    // Noel ağacı (köy meydanı)
    const xmas = new THREE.Group();
    [[3, 3.2, 0], [2.3, 2.6, 2.2], [1.5, 2, 4]].forEach(([r, hh, y]) => { const c = new THREE.Mesh(new THREE.ConeGeometry(r, hh, 10), toon(0x1f7a3a)); c.position.y = y + 1.6; xmas.add(c); });
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.6), new THREE.MeshBasicMaterial({ color: 0xffe27a })); star.position.y = 7.4; xmas.add(star);
    const bulbMats = [0xff4a4a, 0x4ab0ff, 0xffd84a, 0xff7ad8].map(c => new THREE.MeshBasicMaterial({ color: c }));
    for (let i = 0; i < 26; i++) { const a = i * 2.4, y = 1.8 + (i % 13) * 0.42, r = 2.8 - y * 0.33; const b2 = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 4), bulbMats[i % 4]); b2.position.set(Math.cos(a) * r, y, Math.sin(a) * r); xmas.add(b2); }
    xmas.position.set(-20, 0, 14); scene.add(xmas); solids.push({ x: -20, z: 14, r: 3 });
    // Zibo'nun kampı: çadır + ateş
    const tent = new THREE.Mesh(new THREE.ConeGeometry(3.2, 3.6, 6), toon(0x4a8a3a)); tent.position.set(28, 1.8, 26); scene.add(tent); solids.push({ x: 28, z: 26, r: 3.1 });
    const campLight = new THREE.PointLight(0xff8a3a, 1.4, 14); campLight.position.set(24, 1.5, 22); scene.add(campLight);
    const logs = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 0.4, 8), toon(0x5a3418)); logs.position.set(24, 0.2, 22); scene.add(logs);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.4, 8), new THREE.MeshBasicMaterial({ color: 0xffa83a, transparent: true, opacity: 0.85 })); flame.position.set(24, 1, 22); scene.add(flame);
    // Buz mağarası: sadece kutup ayısı buz duvarını kırabilir; içinde hazine sandığı
    const cave = new THREE.Mesh(new THREE.SphereGeometry(5, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), toon(0x8a96b0)); cave.position.set(-36, 0, -30); cave.scale.set(1.3, 0.9, 1); scene.add(cave);
    solids.push({ x: -40, z: -31, r: 4.2 });
    const iceWall = new THREE.Mesh(new THREE.BoxGeometry(3.4, 3.2, 0.8), new THREE.MeshLambertMaterial({ color: 0x9fe0ff, transparent: true, opacity: 0.8 }));
    iceWall.position.set(-32, 1.6, -26.5); iceWall.rotation.y = -0.75; scene.add(iceWall);
    const ice = { x: -32, z: -26.5, r: 1.9, mesh: iceWall, alive: true };
    solids.push(ice);

    // Ağaçlar (tek çizim: InstancedMesh) ve kayalar
    const trees = [];
    for (let k = 0; k < 900 && trees.length < 170; k++) {
      const x = rand(-WORLD_R, WORLD_R), z = rand(-WORLD_R, WORLD_R);
      if (!free(x, z, 0.8)) continue;
      if (Math.hypot(x + 20, z - 14) < 18 && Math.random() < 0.85) continue;   // köy açık kalsın
      if (Math.hypot(x, z) < 6) continue;
      trees.push({ x, z, s: rand(0.8, 1.35) });
      solids.push({ x, z, r: 0.75 });
    }
    const leafGeo = new THREE.ConeGeometry(1.5, 3, 8), trunkGeo = new THREE.CylinderGeometry(0.25, 0.3, 1, 6), snowTop = new THREE.ConeGeometry(0.8, 1, 8);
    const leafI = new THREE.InstancedMesh(leafGeo, toonSee(0x2a7a4a), trees.length * 2), trunkI = new THREE.InstancedMesh(trunkGeo, toonSee(0x6a4024), trees.length), snowI = new THREE.InstancedMesh(snowTop, toonSee(0xffffff), trees.length);
    trees.forEach((tr, i) => {
      tmp.rotation.set(0, rand(0, 6), 0);
      tmp.position.set(tr.x, 0.5 * tr.s, tr.z); tmp.scale.set(tr.s, tr.s, tr.s); tmp.updateMatrix(); trunkI.setMatrixAt(i, tmp.matrix);
      tmp.position.set(tr.x, 2.2 * tr.s, tr.z); tmp.updateMatrix(); leafI.setMatrixAt(i * 2, tmp.matrix);
      tmp.position.set(tr.x, 3.5 * tr.s, tr.z); tmp.scale.set(tr.s * 0.75, tr.s * 0.8, tr.s * 0.75); tmp.updateMatrix(); leafI.setMatrixAt(i * 2 + 1, tmp.matrix);
      tmp.position.set(tr.x, 4.55 * tr.s, tr.z); tmp.scale.set(tr.s, tr.s * 0.6, tr.s); tmp.updateMatrix(); snowI.setMatrixAt(i, tmp.matrix);
    });
    [leafI, trunkI, snowI].forEach(m => { m.castShadow = true; }); scene.add(leafI, trunkI, snowI);
    const rockGeo = new THREE.DodecahedronGeometry(1, 0);
    const rocksN = 40, rockI = new THREE.InstancedMesh(rockGeo, toon(0x8a90a0), rocksN);
    for (let i = 0, k = 0; i < rocksN && k < 400; k++) {
      const x = rand(-WORLD_R, WORLD_R), z = rand(-WORLD_R, WORLD_R), s = rand(0.6, 1.4);
      if (!free(x, z, s)) continue;
      tmp.position.set(x, s * 0.4, z); tmp.scale.set(s, s * 0.7, s); tmp.rotation.set(rand(0, 3), rand(0, 3), 0); tmp.updateMatrix(); rockI.setMatrixAt(i++, tmp.matrix);
      solids.push({ x, z, r: s * 0.9 });
    }
    rockI.castShadow = true; scene.add(rockI);

    /* ---------- Altın kaynakları ---------- */
    const coinGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.07, 14); coinGeo.rotateX(Math.PI / 2);
    const coinMat = new THREE.MeshLambertMaterial({ color: 0xffc020, emissive: 0x3a2600 });
    const drops = [];   // yerdeki tek tek altınlar
    function dropCoins(x, z, n, y) {
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
        g.add(new THREE.Mesh(boxGeo, toon(pick(giftCols))));
        const r1 = new THREE.Mesh(ribGeo, ribMat); g.add(r1);
        const r2 = new THREE.Mesh(ribGeo, ribMat); r2.rotation.y = Math.PI / 2; g.add(r2);
        [-1, 1].forEach(sd => { const b = new THREE.Mesh(bowGeo, ribMat); b.position.set(sd * 0.2, 0.68, 0); b.rotation.y = Math.PI / 2; g.add(b); });
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
    for (let i = 0; i < 26; i++) spawnBox(i < 3);
    for (let i = 0; i < 30; i++) spawnPile();
    // mağaradaki hazine sandığı (buz kırılınca)
    const chestG = new THREE.Group();
    chestG.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.6, 1, 1.1), toon(0x8a5228)), 0, 0.5, 0));
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.6, 10, 1, false, 0, Math.PI), toon(0x9a6230)); lid.rotation.z = Math.PI / 2; lid.position.y = 1; chestG.add(lid);
    chestG.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.64, 0.15, 1.14), toon(0xf2c230)), 0, 0.75, 0));
    chestG.position.set(-36, 0, -30); scene.add(chestG);
    const chest = { type: 'chest', x: -36, z: -30, r: 1, hp: 6, maxHp: 6, mesh: chestG, coins: 80, locked: true };
    targets.push(chest);

    // Zibo'nun yardakçıları: çuvalla kaçar, vurulunca çuvalı düşürür
    const goblins = [];
    function spawnGoblin() {
      const z3 = CZ.kk.zibo(THREE, pick([0x4f9a32, 0x6aa83a, 0x3f8a5a]));
      z3.root.scale.setScalar(1.0);
      let x, z;
      for (let k = 0; k < 40; k++) { x = rand(-40, 40); z = rand(-40, 40); if (free(x, z, 0.6) && Math.hypot(x - P.x, z - P.z) > 18) break; }
      z3.root.position.set(x, 0, z); z3.root.traverse(o => { o.castShadow = true; }); scene.add(z3.root);
      const gb = { type: 'goblin', x, z, r: 0.7, hp: 4, maxHp: 4, mesh: z3.root, z3, coins: 25, vx: 0, vz: 0, think: 0, stun: 0 };
      goblins.push(gb); targets.push(gb);
    }

    /* ---------- Oyuncu ve binek ---------- */
    const P = { x: -4, z: 2, dir: Math.PI, riding: false, vx: 0, vz: 0 };
    const hero = CZ.kk.hero(THREE, d.avatar || 'girl');
    if (hero.setWeapon) hero.setWeapon(W.id);
    hero.root.traverse(o => { o.castShadow = true; }); scene.add(hero.root);
    const HS = 1.35; hero.root.scale.setScalar(HS);
    const heroShadow = new THREE.Mesh(new THREE.CircleGeometry(0.45, 16), new THREE.MeshBasicMaterial({ color: 0x0a1030, transparent: true, opacity: 0.25, depthWrite: false }));
    heroShadow.rotation.x = -Math.PI / 2; heroShadow.position.y = 0.02; scene.add(heroShadow);
    const mountDef = CZ.MOUNTS.find(m => m.id === (d.mount || 'brown')) || CZ.MOUNTS[0];
    const mount = quadruped(THREE, mountDef);
    const M = { x: -1.5, z: 3.5, dir: Math.PI, speed: 0 };
    mount.root.position.set(M.x, 0, M.z); mount.root.traverse(o => { if (o.geometry && o.geometry.type !== 'CircleGeometry') o.castShadow = true; }); scene.add(mount.root);
    for (let i = 0; i < 4; i++) spawnGoblin();

    // nişan göstergesi (yerde ok)
    const aimTex = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 256; const x = c.getContext('2d'); const gr = x.createLinearGradient(0, 256, 0, 0); gr.addColorStop(0, 'rgba(255,255,255,.1)'); gr.addColorStop(1, 'rgba(255,255,255,.75)'); x.fillStyle = gr; x.fillRect(16, 40, 32, 216); x.beginPath(); x.moveTo(0, 48); x.lineTo(32, 0); x.lineTo(64, 48); x.fill(); return new THREE.CanvasTexture(c); })();
    const aim = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 9), new THREE.MeshBasicMaterial({ map: aimTex, transparent: true, depthWrite: false }));
    aim.rotation.x = -Math.PI / 2; aim.visible = false; scene.add(aim);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.85, 1.1, 24), new THREE.MeshBasicMaterial({ color: 0xffe27a, transparent: true, opacity: 0.9, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.visible = false; scene.add(ring);

    /* ---------- Mermiler ---------- */
    const shots = [];
    const ballGeo = new THREE.SphereGeometry(0.22, 10, 8);
    const arrowGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.1, 6); arrowGeo.rotateX(Math.PI / 2);
    const tipGeo = new THREE.ConeGeometry(0.1, 0.25, 6); tipGeo.rotateX(-Math.PI / 2);
    const ballMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(W.ball || '#f4fbff') });
    function fire(dx, dz) {
      if (V.cool > 0) return;
      V.cool = Math.max(0.18, 0.42 - W.dmg * 0.025);
      const L2 = Math.hypot(dx, dz) || 1; dx /= L2; dz /= L2;
      P.dir = Math.atan2(-dx, -dz);
      let m;
      if (P.riding) {   // binekteyken ok atar
        m = new THREE.Group();
        m.add(new THREE.Mesh(arrowGeo, toon(0x8a5228)));
        const tip = new THREE.Mesh(tipGeo, toon(0xcfd6e2)); tip.position.z = -0.6; m.add(tip);
        m.rotation.y = Math.atan2(-dx, -dz);
      } else m = new THREE.Mesh(ballGeo, ballMat);
      m.position.set(P.x + dx * 0.6, P.riding ? mount.seatY + 1.1 : 1.2, P.z + dz * 0.6);
      scene.add(m);
      shots.push({ m, dx, dz, life: 0.75, sp: P.riding ? 30 : 24 });
      if (hero.throwNow) hero.throwNow();
      CZ.audio.sfx('throw');
    }
    function nearestTarget(maxD) {
      let best = null, bd = maxD;
      targets.forEach(o => { if (o.dead || (o.locked)) return; const dd = Math.hypot(o.x - P.x, o.z - P.z); if (dd < bd) { bd = dd; best = o; } });
      if (!ice.alive) return best;
      return best;
    }
    function hit(o, dmg) {
      o.hp -= dmg;
      if (o.mesh) { if (!o.base) o.base = o.mesh.scale.x; o.mesh.scale.setScalar(o.base * 1.12); o.flash = 0.1; }
      CZ.audio.sfx(o.type === 'goblin' ? 'hit' : 'crack');
      if (o.type === 'goblin') { o.stun = 0.6; }
      if (o.hp <= 0) kill(o);
    }
    function kill(o) {
      o.dead = true;
      scene.remove(o.mesh);
      dropCoins(o.x, o.z, Math.round(o.coins / (o.type === 'chest' ? 4 : 2)), 1.2);
      V.pending += o.coins - Math.round(o.coins / (o.type === 'chest' ? 4 : 2));   // kalanı doğrudan
      bump(o.coins);
      if (o.type === 'goblin') { CZ.audio.sfx('win'); floatAt(o, t('valley.sack', { n: o.coins })); }
      if (o.type === 'chest') { CZ.audio.sfx('win'); floatAt(o, t('valley.chest', { n: o.coins })); CZ.audio.vibrate([40, 30, 80]); }
      const i = targets.indexOf(o); if (i >= 0) targets.splice(i, 1);
      if (o.type === 'box') setTimeout(() => { if (V) spawnBox(Math.random() < 0.1); }, rand(12000, 22000));
      if (o.type === 'goblin') { const j = goblins.indexOf(o); if (j >= 0) goblins.splice(j, 1); setTimeout(() => { if (V) spawnGoblin(); }, 15000); }
    }

    /* ---------- Arayüz ---------- */
    const goldEl = h('b', { text: '0' });
    const timeEl = h('b', { class: 'vl-time', text: '3:00' });
    const floats = h('div', { class: 'vl-floats' });
    const stick = h('div', { class: 'vl-stick' }, h('i'));
    const fireBtn = h('button', { class: 'vl-fire', type: 'button' }, img(W.art, 'vl-fire-ico'));
    const rideBtn = h('button', { class: 'vl-ride', type: 'button', text: t('valley.ride') });
    const pauseB = h('button', { class: 'pause-btn vl-pause', type: 'button' }, h('i'), h('i'));
    const ui = h('div', { class: 'vl-ui' },
      h('div', { class: 'vl-top' }, h('div', { class: 'chase-gold' }, img('ui.gold', 'mini-ico'), goldEl), timeEl),
      pauseB, floats, stick, rideBtn, fireBtn);
    const wrap = h('div', { class: 'valley-wrap' }, stage, ui);
    el.append(wrap);
    function resize() {
      const w = stage.clientWidth || window.innerWidth, hh = stage.clientHeight || window.innerHeight;
      renderer.setSize(w, hh, false); camera.aspect = w / hh; camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);
    const v3 = new THREE.Vector3();
    function floatAt(o, text) {
      v3.set(o.x, 2.5, o.z).project(camera);
      const f = h('div', { class: 'vl-float', text });
      f.style.left = ((v3.x + 1) / 2 * 100) + '%'; f.style.top = ((1 - v3.y) / 2 * 100) + '%';
      floats.append(f); setTimeout(() => f.remove(), 1100);
    }
    function bump() { goldEl.parentNode.classList.remove('bump'); void goldEl.offsetWidth; goldEl.parentNode.classList.add('bump'); }

    // Yön çubuğu: sol yarıda nereye basarsan orada açılır (Brawl Stars)
    const joy = { id: null, x0: 0, y0: 0, dx: 0, dy: 0 };
    ui.addEventListener('pointerdown', e => {
      if (e.target.closest('button')) return;
      if (e.clientX > window.innerWidth * 0.55 || joy.id !== null) return;
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
      if (e.pointerId === aimP.id) {
        aimP.dx = e.clientX - aimP.x0; aimP.dy = e.clientY - aimP.y0;
        if (Math.hypot(aimP.dx, aimP.dy) > 18) aimP.aiming = true;
      }
    });
    window.addEventListener('pointerup', V_up = e => {
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
      const o = nearestTarget(15);
      if (o) fire(o.x - P.x, o.z - P.z); else fire(-Math.sin(P.dir), -Math.cos(P.dir));
    }
    rideBtn.addEventListener('click', () => {
      if (P.riding) { P.riding = false; P.x += Math.cos(P.dir) * 1.6; P.z -= Math.sin(P.dir) * 1.6; CZ.audio.sfx('land'); }
      else if (Math.hypot(M.x - P.x, M.z - P.z) < 3.2) { P.riding = true; CZ.audio.sfx('jump'); }
      else { V.whistle = true; CZ.audio.sfx('star'); floatAt(M, t('valley.coming')); }
    });
    pauseB.addEventListener('pointerdown', e => { e.stopPropagation(); pause(); });

    V = {
      el, renderer, scene, stage, wrap, raf: 0, last: 0, time: SESSION, earned: 0, pending: 0, cool: 0, running: true, paused: false, whistle: false,
      P, M, hero, camera, solids, targets, goblins, piles, ice, chest, debug: { fire, autoFire, joy, nearestTarget },
      cleanup() {
        window.removeEventListener('resize', resize);
        window.removeEventListener('pointermove', V_move);
        window.removeEventListener('pointerup', V_up);
        window.removeEventListener('pointercancel', V_up);
        renderer.dispose();
      }
    };
    function pause() {
      if (!V || V.paused || !V.running) return;
      V.paused = true;
      const box = h('div', { class: 'pause-menu' }, h('div', { class: 'pause-card' },
        h('b', { class: 'lg-title', text: t('pause.title') }),
        btn(t('pause.resume'), () => { box.remove(); V.paused = false; V.last = 0; }, 'primary wide', 'ic:play'),
        btn(t('pause.quit'), () => { box.remove(); V.paused = false; end(); }, 'small ghost-dark')));
      wrap.append(box);
    }
    V.pause = pause;
    V.onHide = () => { if (document.hidden) pause(); };
    document.addEventListener('visibilitychange', V.onHide);

    /* ---------- Döngü ---------- */
    const perf = { acc: 0, n: 0, slow: 0 };
    const collide = (x, z, r) => {
      for (const s of solids) { if (s === ice && !ice.alive) continue; const dx = x - s.x, dz = z - s.z, dd = Math.hypot(dx, dz), m = s.r + r; if (dd < m && dd > 0.001) { x = s.x + dx / dd * m; z = s.z + dz / dd * m; } }
      const rr = Math.hypot(x, z); if (rr > WORLD_R) { x *= WORLD_R / rr; z *= WORLD_R / rr; }
      return [x, z];
    };
    function step(dt) {
      V.time -= dt;
      V.cool -= dt;
      const sec = Math.max(0, Math.ceil(V.time));
      timeEl.textContent = Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
      timeEl.classList.toggle('low', sec <= 15);
      if (V.time <= 0) return end();
      // altın yağmuru: akının ortasında 12 sn
      if (!V.rained && V.time < SESSION / 2) { V.rained = true; V.rainT = 12; floatAt(P, t('valley.rain')); CZ.audio.sfx('star'); }
      if (V.rainT > 0) { V.rainT -= dt; if (Math.random() < dt * 9) { const m = new THREE.Mesh(coinGeo, coinMat); m.position.set(P.x + rand(-9, 9), 12, P.z + rand(-9, 9)); scene.add(m); drops.push({ m, vx: 0, vz: 0, vy: -2, t: 0, rain: true }); } }

      // hareket
      const sp = P.riding ? mountDef.speed : 6;
      let mx = joy.dx, mz = joy.dy;
      const kb = V.keys || {};
      if (kb.ArrowLeft || kb.a) mx = -1; if (kb.ArrowRight || kb.d) mx = 1; if (kb.ArrowUp || kb.w) mz = -1; if (kb.ArrowDown || kb.s) mz = 1;
      const mag = Math.min(1, Math.hypot(mx, mz));
      P.vx += (mx * sp - P.vx) * Math.min(1, dt * 10); P.vz += (mz * sp - P.vz) * Math.min(1, dt * 10);
      [P.x, P.z] = collide(P.x + P.vx * dt, P.z + P.vz * dt, P.riding ? 1.0 : 0.45);
      const speed = Math.hypot(P.vx, P.vz);
      if (mag > 0.15 && !(aimP.aiming)) { const want = Math.atan2(-mx, -mz); let dd = want - P.dir; dd = Math.atan2(Math.sin(dd), Math.cos(dd)); P.dir += dd * Math.min(1, dt * 12); }
      if (P.riding) {
        M.x = P.x; M.z = P.z; M.dir = P.dir; M.speed = speed;
        // ayı kutuları ve yardakçıları ezer; kutup ayısı buzu kırar
        targets.slice().forEach(o => { if (!o.dead && !o.locked && o.type === 'box' && mountDef.kind === 'bear' && Math.hypot(o.x - P.x, o.z - P.z) < o.r + 1.1 && speed > 3) kill(o); });
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

      // yardakçılar: oyuncu yaklaşınca kaçar
      goblins.forEach(o => {
        o.stun = Math.max(0, o.stun - dt);
        o.think -= dt;
        const dx = o.x - P.x, dz = o.z - P.z, dd = Math.hypot(dx, dz);
        if (o.think <= 0) { o.think = rand(0.6, 1.4); if (dd < 12) { o.vx = dx / dd * 5.2; o.vz = dz / dd * 5.2; } else { const a = rand(0, 6.28); o.vx = Math.cos(a) * 2; o.vz = Math.sin(a) * 2; } }
        const k = o.stun > 0 ? 0 : 1;
        [o.x, o.z] = collide(o.x + o.vx * dt * k, o.z + o.vz * dt * k, 0.5);
        o.mesh.position.set(o.x, 0, o.z);
        o.mesh.rotation.y = Math.atan2(-o.vx, -o.vz);
        o.z3.update(dt, { running: k > 0, dizzy: o.stun > 0, look: dd < 6 && o.stun <= 0 });
      });
      // hedeflerin sarsılması geri gelsin
      targets.forEach(o => { if (o.flash > 0) { o.flash -= dt; if (o.flash <= 0) o.mesh.scale.setScalar(o.base); } });

      // mermiler
      for (let i = shots.length - 1; i >= 0; i--) {
        const s2 = shots[i];
        s2.m.position.x += s2.dx * s2.sp * dt; s2.m.position.z += s2.dz * s2.sp * dt;
        s2.life -= dt;
        let hitO = null;
        for (const o of targets) { if (o.dead || o.locked) continue; if (Math.hypot(o.x - s2.m.position.x, o.z - s2.m.position.z) < o.r + 0.35) { hitO = o; break; } }
        if (!hitO && ice.alive && Math.hypot(ice.x - s2.m.position.x, ice.z - s2.m.position.z) < ice.r) { s2.life = 0; if (!V.iceHint2) { V.iceHint2 = true; floatAt(ice, t('valley.needPolar')); } }
        if (hitO) { hit(hitO, W.dmg + (P.riding ? 1 : 0)); s2.life = 0; }
        if (s2.life <= 0) { scene.remove(s2.m); shots.splice(i, 1); }
      }
      // yerdeki altınlar: sıçrar, sonra oyuncuya çekilir
      const magR = P.riding ? 4.5 : 3.2;
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
      if (V.pending > 0) { const n = Math.min(V.pending, Math.ceil(V.pending * dt * 6)); V.pending -= n; gain(n, true); }
      flame.scale.set(1 + Math.sin(performance.now() / 90) * 0.12, 1 + Math.sin(performance.now() / 70) * 0.18, 1);
      star.rotation.y += dt;
    }
    function gain(n, quiet) {
      V.earned += n;
      goldEl.textContent = V.earned;
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
      // otomatik hedef halkası
      const o = nearestTarget(15);
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
      renderer.render(scene, camera);
      // zayıf telefonda çözünürlüğü düşür (30 FPS altına inmesin)
      perf.acc += dt; perf.n++;
      if (perf.acc > 2) { const fps = perf.n / perf.acc; perf.acc = 0; perf.n = 0; V.fps = Math.round(fps); if (fps < 40 && ratioIdx < RATIOS.length - 1) { ratioIdx++; renderer.setPixelRatio(RATIOS[ratioIdx]); resize(); if (ratioIdx >= 2 && sun.castShadow) { sun.castShadow = false; } } }
    }
    V.raf = requestAnimationFrame(loop);
    V.keys = {};
    V.kd = e => { V.keys[e.key] = true; if (e.key === ' ') autoFire(); if (e.key === 'e') rideBtn.click(); };
    V.ku = e => { V.keys[e.key] = false; };
    window.addEventListener('keydown', V.kd); window.addEventListener('keyup', V.ku);
    CZ.audio.music('play');
    if (CZ.ads.playing) CZ.ads.playing();
    // ilk girişte kısa ipucu
    if (!d.valleyTut) { d.valleyTut = true; CZ.state.save(); const tip = h('div', { class: 'tut-tip vl-tip' }, h('span', { text: t('valley.tut') })); wrap.append(tip); setTimeout(() => tip.classList.add('out'), 6000); setTimeout(() => tip.remove(), 6600); }
  }

  /* ---------- Akın sonu ---------- */
  function end() {
    if (!V || !V.running) return;
    V.running = false;
    const d = CZ.state.data;
    const earned = V.earned + V.pending;
    d.gold = (d.gold || 0) + earned;
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
    CZ.runner3d.load().then(() => {
      loading.done();
      if (!CZ.kk || !CZ.kk.ready()) throw new Error('no3d');
      build(el, params || {});
    }).catch(err => { console.error('valley', err && err.stack || err); loading.done(); CZ.ui.toast(t('run.noGl')); });
  }
  function leave() {
    if (!V) return;
    if (V.running) { const d = CZ.state.data; d.gold = (d.gold || 0) + V.earned + V.pending; CZ.state.save(); }
    cancelAnimationFrame(V.raf);
    document.removeEventListener('visibilitychange', V.onHide);
    window.removeEventListener('keydown', V.kd); window.removeEventListener('keyup', V.ku);
    V.cleanup();
    V = null;
  }
  function onBack() { if (V && V.running && !V.paused) { V.pause(); return true; } return false; }
  return { render, leave, onBack, music: null, get debug() { return V; } };
})();
