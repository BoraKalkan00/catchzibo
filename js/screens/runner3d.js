// ALTIN AVI 3D: Subway Surfers tarzı sonsuz koşu (Three.js).
// Yol, evler, fenerler, ağaçlar hareket eder; oyuncu 4 şeritte koşar, zıplar, eğilir.
// Altınlar dizi halinde yerde; arada zor yerde elmas; kutulara kartopu atınca kırılır.
// Telefon ısınmasın diye: gölge yok, basit malzeme, piksel oranı en fazla 1.5, sekme gizlenince durur.
CZ.runner3d = (function () {
  const LANE_W = 1.35;
  const LANES = 4;
  const SPAWN_Z = -95;
  const KILL_Z = 8;
  const laneX = l => (l - (LANES - 1) / 2) * LANE_W;
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  let THREE = null;
  function loadThree() {
    if (window.THREE) { THREE = window.THREE; return Promise.resolve(); }
    return new Promise((ok, fail) => {
      const s = document.createElement('script');
      s.src = 'js/vendor/three.min.js';
      s.onload = () => { THREE = window.THREE; ok(); };
      s.onerror = fail;
      document.head.append(s);
    });
  }

  /* ---------- Dokular: hepsi çalışma anında çizilir (ek dosya yok) ---------- */
  function canvasTex(w, h, draw, repeat) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const tex = new THREE.CanvasTexture(c);
    if (repeat) { tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(repeat[0], repeat[1]); }
    tex.anisotropy = 2;
    return tex;
  }

  function cobbleTex() {
    return canvasTex(256, 256, (x, w, h) => {
      x.fillStyle = '#3e3b48'; x.fillRect(0, 0, w, h);
      const rows = 8, cols = 4;
      for (let r = 0; r < rows; r++) {
        const off = r % 2 ? w / cols / 2 : 0;
        for (let c = -1; c < cols; c++) {
          const sx = c * w / cols + off + 3, sy = r * h / rows + 3;
          const g = 92 + Math.random() * 26;
          x.fillStyle = `rgb(${g - 8},${g - 12},${g + 8})`;
          x.beginPath();
          x.roundRect(sx, sy, w / cols - 6, h / rows - 6, 7);
          x.fill();
          x.fillStyle = 'rgba(255,255,255,.14)';
          x.fillRect(sx + 4, sy + 3, w / cols - 16, 4);
        }
      }
      // ince kar tozu
      for (let i = 0; i < 260; i++) {
        x.fillStyle = `rgba(240,246,255,${Math.random() * 0.5})`;
        x.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }
    }, [2, 24]);
  }

  function snowTex() {
    return canvasTex(128, 128, (x, w, h) => {
      x.fillStyle = '#dfe8f6'; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 90; i++) {
        x.fillStyle = `rgba(${Math.random() < 0.5 ? '180,195,225' : '255,255,255'},.6)`;
        x.beginPath(); x.arc(Math.random() * w, Math.random() * h, rand(1, 4), 0, 7); x.fill();
      }
    }, [6, 30]);
  }

  function giftTex(base, ribbon) {
    return canvasTex(128, 128, (x, w, h) => {
      x.fillStyle = base; x.fillRect(0, 0, w, h);
      x.fillStyle = 'rgba(255,255,255,.18)';
      for (let i = 0; i < 6; i++) { x.beginPath(); x.arc(rand(10, 118), rand(10, 118), 6, 0, 7); x.fill(); }
      x.fillStyle = ribbon;
      x.fillRect(w / 2 - 10, 0, 20, h);
      x.fillRect(0, h / 2 - 10, w, 20);
    });
  }

  function woodTex(dark) {
    return canvasTex(128, 128, (x, w, h) => {
      x.fillStyle = dark ? '#7a4a22' : '#a8692f'; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 4; i++) {
        x.fillStyle = 'rgba(0,0,0,.28)'; x.fillRect(0, i * 32, w, 3);
        x.fillStyle = 'rgba(255,220,160,.12)'; x.fillRect(0, i * 32 + 6, w, 4);
      }
      x.strokeStyle = '#3b2310'; x.lineWidth = 8; x.strokeRect(4, 4, w - 8, h - 8);
    });
  }

  function skyTex() {
    return canvasTex(512, 1024, (x, w, h) => {
      const g = x.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#081232'); g.addColorStop(0.45, '#1d2f6b'); g.addColorStop(0.62, '#4e5ea6'); g.addColorStop(1, '#8a8fc9');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 160; i++) {
        x.fillStyle = `rgba(255,255,255,${rand(0.3, 1)})`;
        x.fillRect(Math.random() * w, Math.random() * h * 0.55, rand(1, 2.4), rand(1, 2.4));
      }
      const mx = w * 0.26, my = h * 0.12;
      const glow = x.createRadialGradient(mx, my, 10, mx, my, 90);
      glow.addColorStop(0, 'rgba(255,250,220,.55)'); glow.addColorStop(1, 'rgba(255,250,220,0)');
      x.fillStyle = glow; x.fillRect(mx - 90, my - 90, 180, 180);
      x.fillStyle = '#fff8dc'; x.beginPath(); x.arc(mx, my, 34, 0, 7); x.fill();
      x.fillStyle = '#1d2f6b'; x.beginPath(); x.arc(mx + 16, my - 8, 30, 0, 7); x.fill();
    });
  }

  function labelTex(text, bg, fg) {
    return canvasTex(128, 128, (x, w, h) => {
      x.fillStyle = bg; x.beginPath(); x.arc(w / 2, h / 2, 58, 0, 7); x.fill();
      x.lineWidth = 8; x.strokeStyle = '#fff'; x.stroke();
      x.fillStyle = fg; x.font = 'bold 56px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(text, w / 2, h / 2 + 3);
    });
  }

  function glowTex(color) {
    return canvasTex(64, 64, (x, w) => {
      const g = x.createRadialGradient(32, 32, 2, 32, 32, 32);
      g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.fillRect(0, 0, w, w);
    });
  }

  // SVG/PNG görselleri tuvale yüksek çözünürlükte çizip doku yapar (bulanık olmasın).
  function imageTex(url, height) {
    return new Promise(ok => {
      const im = new Image();
      im.onload = () => {
        const ratio = (im.naturalWidth || 300) / (im.naturalHeight || 400);
        const c = document.createElement('canvas');
        c.height = height; c.width = Math.round(height * ratio);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        const tex = new THREE.CanvasTexture(c);
        tex.userData = { ratio };
        ok(tex);
      };
      im.onerror = () => ok(null);
      im.src = url;
    });
  }

  // Yol görselinden Zibo'nun malikanesini keser, kenarlarını yumuşatır (uzak manzara).
  function mansionTex(url) {
    return new Promise(ok => {
      const im = new Image();
      im.onload = () => {
        const W = im.naturalWidth, H = im.naturalHeight;
        const sx = W * 0.38, sy = H * 0.215, sw = W * 0.24, sh = H * 0.205;
        const c = document.createElement('canvas');
        c.width = 384; c.height = Math.round(384 * sh / sw);
        const x = c.getContext('2d');
        x.drawImage(im, sx, sy, sw, sh, 0, 0, c.width, c.height);
        x.globalCompositeOperation = 'destination-in';
        const g = x.createRadialGradient(c.width / 2, c.height * 0.55, c.width * 0.18, c.width / 2, c.height * 0.55, c.width * 0.52);
        g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
        ok({ tex: new THREE.CanvasTexture(c), ratio: c.width / c.height });
      };
      im.onerror = () => ok(null);
      im.src = url;
    });
  }

  /* ---------- Oyun ---------- */
  function start(host, opts) {
    const R = CZ.GOLD.runner;
    const CHASE = opts.mode === 'chase';
    const LANES = opts.lanes || 4;
    const laneX = l => (l - (LANES - 1) / 2) * LANE_W;
    const s = {
      alive: true, running: false, t: 0, dist: 0, speed: R.startSpeed,
      lane: 1, px: laneX(1), py: 0, vy: 0, jumping: false, slideT: 0, invT: 0,
      hearts: R.hearts + ((opts.perk || {}).trapMul ? 1 : 0), gold: 0, emeralds: 0, crates: 0,
      magnetT: ((opts.perk || {}).bonusSeconds || 0) * 2, doubleT: 0,
      nextRow: 25, nextPower: rand(12, 18), objs: [], coins: [], shots: [], fx: [],
      obstaclesFrom: R.obstaclesFrom + ((opts.perk || {}).trapDelay || 0), lastThrow: 0, frame: 0,
      ziboLane: Math.min(2, LANES - 1), ziboX: 0, ziboZ: CHASE ? -17 : -11, ziboHp: 0, ziboHits: 0, sled: 0, dashT: 0, ziboNext: 1.5, ziboPose: 0, ziboForce: null, shake: 0, bombs: [], hookFx: 0
    };

    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    host.append(renderer.domElement);
    renderer.domElement.className = 'runner-canvas';

    const scene = new THREE.Scene();
    const FOG = 0x4e5ea6;
    scene.fog = new THREE.Fog(FOG, 38, 92);
    const sky = skyTex();
    scene.background = sky;
    const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 200);
    camera.position.set(0, 2.7, 4.4);
    camera.lookAt(0, 1.15, -8);
    const camBase = camera.position.clone();

    scene.add(new THREE.HemisphereLight(0xb9c8ff, 0x3a3050, 0.95));
    const sun = new THREE.DirectionalLight(0xffe2b8, 0.75);
    sun.position.set(3, 8, 4);
    scene.add(sun);

    // Malzemeler (paylaşılır)
    const M = {
      road: new THREE.MeshLambertMaterial({ map: cobbleTex() }),
      snow: new THREE.MeshLambertMaterial({ map: snowTex() }),
      curb: new THREE.MeshLambertMaterial({ color: 0x8a8394 }),
      walls: [0xe9d3a8, 0xd8b98a, 0xc99f73, 0xe5c79a, 0xbfa07c].map(c => new THREE.MeshLambertMaterial({ color: c })),
      beam: new THREE.MeshLambertMaterial({ color: 0x5a3a22 }),
      roofs: [0x7a3a2a, 0x5b4a6e, 0x6a4a32, 0x3f5a6a].map(c => new THREE.MeshLambertMaterial({ color: c })),
      roofSnow: new THREE.MeshLambertMaterial({ color: 0xf4f8ff }),
      window: new THREE.MeshBasicMaterial({ color: 0xffc95c }),
      door: new THREE.MeshLambertMaterial({ color: 0x6b3d1f }),
      garland: new THREE.MeshLambertMaterial({ color: 0x2f7a3a }),
      bow: new THREE.MeshLambertMaterial({ color: 0xd12a2a }),
      pine: new THREE.MeshLambertMaterial({ color: 0x23683f }),
      trunk: new THREE.MeshLambertMaterial({ color: 0x5a3a22 }),
      pole: new THREE.MeshLambertMaterial({ color: 0x2b2b36 }),
      lampHead: new THREE.MeshBasicMaterial({ color: 0xffd98a }),
      coin: new THREE.MeshLambertMaterial({ color: 0xffc928, emissive: 0x6a4a00 }),
      emerald: new THREE.MeshLambertMaterial({ color: 0x2ee07a, emissive: 0x0b5a2a }),
      gifts: [['#d92d3a', '#2e8b45'], ['#2f6fd6', '#f2c12e'], ['#7b3fc4', '#f2c12e'], ['#2e8b45', '#d92d3a']]
        .map(([a, b]) => new THREE.MeshLambertMaterial({ map: giftTex(a, b) })),
      wood: new THREE.MeshLambertMaterial({ map: woodTex(false) }),
      goldChest: new THREE.MeshLambertMaterial({ color: 0xf3c33c, emissive: 0x5a3d00 }),
      sled: new THREE.MeshLambertMaterial({ color: 0xb8262e }),
      wagonA: new THREE.MeshLambertMaterial({ color: 0xc23a2e }),
      ribbon: new THREE.MeshLambertMaterial({ color: 0xffcf3a }),
      wagonB: new THREE.MeshLambertMaterial({ color: 0x2f7a4a }),
      trim: new THREE.MeshLambertMaterial({ color: 0xe8b830 }),
      roofSnowT: new THREE.MeshLambertMaterial({ color: 0xdfe8f6 }),
      ramp: new THREE.MeshLambertMaterial({ map: woodTex(false) }),
      snowman: new THREE.MeshLambertMaterial({ color: 0xf6f9ff }),
      coal: new THREE.MeshLambertMaterial({ color: 0x222228 }),
      carrot: new THREE.MeshLambertMaterial({ color: 0xf08a2a }),
      runnerMetal: new THREE.MeshLambertMaterial({ color: 0xd9c38a }),
      banner: new THREE.MeshLambertMaterial({ color: 0x2f7a3a, side: THREE.DoubleSide }),
      soldier: new THREE.MeshLambertMaterial({ color: 0xc8242e }),
      skin: new THREE.MeshLambertMaterial({ color: 0xf2c9a0 }),
      shadow: new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false })
    };
    const GEO = {
      box: new THREE.BoxGeometry(1, 1, 1),
      prism: new THREE.CylinderGeometry(1, 1, 1, 3, 1),
      cone: new THREE.ConeGeometry(1, 1, 7),
      cyl: new THREE.CylinderGeometry(1, 1, 1, 8),
      coin: new THREE.CylinderGeometry(0.3, 0.3, 0.07, 16),
      gem: new THREE.OctahedronGeometry(0.3),
      plane: new THREE.PlaneGeometry(1, 1),
      circle: new THREE.CircleGeometry(0.5, 16)
    };
    GEO.coin.rotateX(Math.PI / 2);
    const tri = new THREE.Shape();
    tri.moveTo(-0.5, 0); tri.lineTo(0.5, 0); tri.lineTo(0, 1); tri.lineTo(-0.5, 0);
    const roofGeo = new THREE.ExtrudeGeometry(tri, { depth: 1, bevelEnabled: false });
    roofGeo.translate(0, 0, -0.5);
    const glowWarm = new THREE.SpriteMaterial({ map: glowTex('rgba(255,210,120,.9)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });

    const mesh = (geo, mat, sx, sy, sz, x, y, z) => {
      const m = new THREE.Mesh(geo, mat);
      m.scale.set(sx, sy, sz);
      m.position.set(x || 0, y || 0, z || 0);
      return m;
    };

    /* Zemin: yol ve kaldırımlar kayarak hız hissi verir */
    const roadW = LANES * LANE_W + 0.5;
    const road = mesh(GEO.plane, M.road, roadW, 200, 1, 0, 0, -90);
    road.rotation.x = -Math.PI / 2;
    scene.add(road);
    const laneLine = new THREE.MeshBasicMaterial({ color: 0xc9d4ff, transparent: true, opacity: 0.22 });
    for (let i = 1; i < LANES; i++) {
      const ln = mesh(GEO.plane, laneLine, 0.06, 200, 1, laneX(i) - LANE_W / 2, 0.01, -90);
      ln.rotation.x = -Math.PI / 2;
      scene.add(ln);
    }
    [-1, 1].forEach(side => {
      const walk = mesh(GEO.plane, M.snow, 30, 200, 1, side * (roadW / 2 + 15), 0.12, -90);
      walk.rotation.x = -Math.PI / 2;
      scene.add(walk);
      scene.add(mesh(GEO.box, M.curb, 0.35, 0.22, 200, side * (roadW / 2 + 0.1), 0.08, -90));
    });

    // Uzak manzara: Zibo'nun malikanesi yolun sonunda.
    mansionTex(CZ.art('scene.road')).then(m => {
      if (!m || !s.alive) return;
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: m.tex, fog: false, depthWrite: false }));
      const hgt = 34;
      sp.scale.set(hgt * m.ratio, hgt, 1);
      sp.position.set(0, 13, -150);
      scene.add(sp);
    });

    // AKICILIK: bir dekor grubundaki onlarca küçük kutuyu tek bir ağa "pişir" (renkler köşe rengine).
    // Ev başına ~20 çizim çağrısı → 2. Sahnedeki toplam çağrı ~750'den ~150'ye iner.
    const bakedLambert = new THREE.MeshLambertMaterial({ vertexColors: true });
    const bakedBasic = new THREE.MeshBasicMaterial({ vertexColors: true });
    function bake(g) {
      const lists = { lambert: [], basic: [] };
      g.children.slice().forEach(ch => {
        if (!ch.isMesh) return;
        ch.updateMatrix();
        let geo = ch.geometry.index ? ch.geometry.toNonIndexed() : ch.geometry.clone();
        geo.applyMatrix4(ch.matrix);
        const n = geo.attributes.position.count;
        const col = new Float32Array(n * 3);
        const c = ch.material.color;
        for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
        (ch.material.isMeshBasicMaterial ? lists.basic : lists.lambert).push(geo);
        g.remove(ch);
      });
      ['lambert', 'basic'].forEach(k => {
        const arr = lists[k];
        if (!arr.length) return;
        let total = 0;
        arr.forEach(gg => { total += gg.attributes.position.count; });
        const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), col = new Float32Array(total * 3);
        let off = 0;
        arr.forEach(gg => {
          pos.set(gg.attributes.position.array, off * 3);
          if (gg.attributes.normal) nor.set(gg.attributes.normal.array, off * 3);
          col.set(gg.attributes.color.array, off * 3);
          off += gg.attributes.position.count;
          gg.dispose();
        });
        const merged = new THREE.BufferGeometry();
        merged.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        merged.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
        merged.setAttribute('color', new THREE.BufferAttribute(col, 3));
        merged.computeBoundingSphere();
        g.add(new THREE.Mesh(merged, k === 'basic' ? bakedBasic : bakedLambert));
      });
      return g;
    }

    /* Kenar dekoru: ev, fener, çam. Hepsi döngüde arkaya geri taşınır. */
    function house(side) {
      const g = new THREE.Group();
      const w = rand(3.6, 5), hgt = rand(3.2, 4.6), d = rand(4, 5.4);
      const wall = pick(M.walls);
      g.add(mesh(GEO.box, wall, w, hgt, d, 0, hgt / 2, 0));
      // ahşap kirişler (kafes ev görünümü)
      const face = -side * (w / 2 + 0.03);
      g.add(mesh(GEO.box, M.beam, 0.08, hgt, d + 0.06, face, hgt / 2, 0));
      g.add(mesh(GEO.box, M.beam, 0.1, 0.16, d + 0.08, face, hgt * 0.55, 0));
      [-1, 1].forEach(k => g.add(mesh(GEO.box, M.beam, 0.1, hgt, 0.16, face, hgt / 2, k * d * 0.33)));
      // çatı: üçgen prizma (yola paralel) + kar
      const rh = w * 0.42;
      g.add(mesh(roofGeo, pick(M.roofs), w + 0.5, rh, d + 0.5, 0, hgt, 0));
      g.add(mesh(roofGeo, M.roofSnow, w + 0.2, rh * 0.45, d + 0.62, 0, hgt + rh * 0.58, 0));
      if (Math.random() < 0.6) g.add(mesh(GEO.box, M.curb, 0.5, 1.2, 0.5, side * w * 0.22, hgt + rh * 0.55, -d * 0.25));
      // pencereler ve kapı yola bakar
      const fx = -side * (w / 2 + 0.06);
      const win = (y, z) => { const p = mesh(GEO.plane, M.window, 0.8, 0.9, 1, fx, y, z); p.rotation.y = side * -Math.PI / 2 * -1; p.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2; g.add(p); };
      win(hgt * 0.75, -d * 0.18); win(hgt * 0.75, d * 0.18);
      if (Math.random() < 0.5) win(hgt * 0.32, -d * 0.24);
      const door = mesh(GEO.plane, M.door, 0.9, 1.6, 1, fx, 0.8, d * 0.2);
      door.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      g.add(door);
      // çelenk ve fiyonk
      g.add(mesh(GEO.box, M.garland, 0.18, 0.18, d * 0.8, fx, hgt * 0.53, 0));
      [-0.3, 0, 0.3].forEach(k => g.add(mesh(GEO.box, M.bow, 0.12, 0.3, 0.38, fx - side * -0.05, hgt * 0.5, k * d)));
      const glow = new THREE.Sprite(glowWarm);
      glow.scale.set(2.6, 2.6, 1); glow.position.set(fx - side * -0.3, hgt * 0.75, 0);
      g.add(glow);
      g.userData.len = d + rand(0.4, 1.6);
      g.position.x = side * (roadW / 2 + 1.6 + w / 2 + rand(0, 0.8));
      return g;
    }
    function lamp(side) {
      const g = new THREE.Group();
      g.add(mesh(GEO.cyl, M.pole, 0.07, 3, 0.07, 0, 1.5, 0));
      g.add(mesh(GEO.box, M.lampHead, 0.34, 0.42, 0.34, 0, 3.1, 0));
      g.add(mesh(GEO.box, M.pole, 0.44, 0.08, 0.44, 0, 3.35, 0));
      const glow = new THREE.Sprite(glowWarm);
      glow.scale.set(2.2, 2.2, 1); glow.position.set(0, 3.1, 0);
      g.add(glow);
      g.add(mesh(GEO.prism, M.bow, 0.18, 0.12, 0.18, 0, 2.6, 0));
      g.position.x = side * (roadW / 2 + 0.7);
      return g;
    }
    function pine(side) {
      const g = new THREE.Group();
      const k = rand(0.8, 1.3);
      g.add(mesh(GEO.cyl, M.trunk, 0.15 * k, 0.6, 0.15 * k, 0, 0.3, 0));
      [[1.1, 1.4, 1.1], [0.85, 1.2, 1.9], [0.6, 1.0, 2.6]].forEach(([r, hh, y]) => {
        g.add(mesh(GEO.cone, M.pine, r * k, hh * k, r * k, 0, y * k, 0));
        g.add(mesh(GEO.cone, M.roofSnow, r * k * 0.55, hh * k * 0.35, r * k * 0.55, 0, (y + hh * 0.36) * k, 0));
      });
      g.position.x = side * (roadW / 2 + rand(1, 1.5));
      return g;
    }
    const deco = [];
    [-1, 1].forEach(side => {
      let z = 6;
      while (z > -110) {
        const hz = bake(house(side));
        hz.position.z = z - hz.userData.len / 2;
        scene.add(hz); deco.push(hz);
        z -= hz.userData.len;
      }
      for (let z2 = 2; z2 > -110; z2 -= 13) {
        const l = bake(lamp(side)); l.position.z = z2; scene.add(l); deco.push(l);
      }
      for (let z3 = -4; z3 > -110; z3 -= rand(18, 26)) {
        const p = bake(pine(side)); p.position.z = z3; p.position.x = side * (roadW / 2 + 1.0); scene.add(p); deco.push(p);
      }
    });

    // Kar yağışı (tek çizim çağrısı)
    const flakes = 260;
    const flakeGeo = new THREE.BufferGeometry();
    const fp = new Float32Array(flakes * 3);
    for (let i = 0; i < flakes; i++) { fp[i * 3] = rand(-14, 14); fp[i * 3 + 1] = rand(0, 12); fp[i * 3 + 2] = rand(-60, 6); }
    flakeGeo.setAttribute('position', new THREE.BufferAttribute(fp, 3));
    const snowPts = new THREE.Points(flakeGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.09, transparent: true, opacity: 0.85 }));
    scene.add(snowPts);

    /* Oyuncu ve Zibo: düz görseller (sprite) */
    // Oyuncu: eklemli 3D karakter (akıcı koşu animasyonu)
    // Çizimi olan karakter kendi Gemini çizimleriyle koşar; yoksa 3D parça karakter.
    const hero = CZ.chars && CZ.chars.hasArt(opts.avatar) ? CZ.heroSprite(THREE, opts.avatar) : CZ.hero3d(THREE, opts.avatar);
    scene.add(hero.root);
    const pShadow = mesh(GEO.circle, M.shadow, 1.1, 0.7, 1, 0, 0.02, 0);
    pShadow.rotation.x = -Math.PI / 2;
    scene.add(pShadow);
    const weaponMat = new THREE.SpriteMaterial({ transparent: true });
    const weaponSp = new THREE.Sprite(weaponMat);
    weaponSp.center.set(0.3, 0.1);
    weaponSp.visible = false;
    hero.weaponSlot.add(weaponSp);
    const ziboMat = new THREE.SpriteMaterial({ transparent: true });
    const zibo = new THREE.Sprite(ziboMat);
    if (opts.ziboTint) ziboMat.color.setHex(opts.ziboTint);
    zibo.center.set(0.5, 0);
    zibo.position.set(0, 0, -17);
    scene.add(zibo);
    // Yardımcı hayvan: kahramanın yanında koşar; tilki ara ara Zibo'ya atılır.
    let petSp = null;
    const petState = { dash: 0 };
    if (opts.pet) {
      const im = new Image();
      im.onload = () => {
        if (!s.alive) return;
        const tx = new THREE.Texture(im); tx.needsUpdate = true;
        petSp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, transparent: true }));
        petSp.center.set(0.5, 0);
        const hh = opts.pet.id === 'fox' ? 0.95 : 0.85;
        petSp.scale.set(hh * im.width / im.height, hh, 1);
        scene.add(petSp);
      };
      im.src = CZ.petArt(opts.pet.id, 'back');
    }
    function petStep(dt) {
      if (!petSp) return;
      // Altın Avı'nda tilki kendi kendine Zibo'nun çuvalına atılır
      if (!CHASE && s.running && opts.pet.id === 'fox') {
        petState.timer = (petState.timer == null ? CZ.petFx.foxEvery(opts.pet.lvl) : petState.timer) - dt;
        if (petState.timer <= 0) { petState.timer = CZ.petFx.foxEvery(opts.pet.lvl) + 2; petDash(huntHit); }
      }
      const side = s.lane >= LANES - 1 ? -1 : 1;
      let x = s.px + side * 0.85, y = Math.abs(Math.sin(s.frame * 11)) * 0.12, z = 0.35;
      if (petState.dash > 0) {
        petState.dash -= dt;
        const k = 1 - Math.max(0, petState.dash) / 0.9;
        const e = Math.sin(k * Math.PI);
        x += (zibo.position.x - x) * e; z += (zibo.position.z + 0.6 - z) * e; y += e * 1.2;
        if (k > 0.45 && !petState.hit) { petState.hit = true; ziboHit(); if (petState.onHit) petState.onHit(); }
      }
      petSp.position.set(x, y, z);
    }
    function petDash(onHit) { if (!petSp || petState.dash > 0) return; petState.dash = 0.9; petState.hit = false; petState.onHit = onHit; }

    // Kral Zibo'nun tacı
    let crown = null;
    if (opts.ziboCrown) {
      const cv = document.createElement('canvas'); cv.width = cv.height = 128;
      const g = cv.getContext('2d'); g.font = '100px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('👑', 64, 70);
      crown = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true }));
      crown.scale.set(0.8, 0.8, 1);
      scene.add(crown);
    }
    // Her silahın kendi mermisi: kartopu, buz topu, dönen şeker kamışı, kar tanesi, yıldırım.
    const W = opts.weaponId || 'snowball';
    const SHOT = {
      snowball: { tex: null, size: 0.45, color: '#f4fbff', trail: '#ffffff', spin: 0 },
      sling: { tex: null, size: 0.4, color: '#f4fbff', trail: '#ffffff', spin: 0, speed: 1.4 },
      candy: { tex: 'weapon', size: 0.6, color: '#ff6b6b', trail: '#ff8a8a', spin: 14 },
      ice: { tex: null, size: 0.6, color: '#9fe0ff', trail: '#9fe0ff', spin: 0, glow: true },
      staff: { tex: 'flake', size: 0.65, color: '#c9e8ff', trail: '#bfe4ff', spin: 6, glow: true },
      thunder: { tex: 'bolt', size: 0.7, color: '#ffe36e', trail: '#ffe36e', spin: 0, glow: true, flash: true }
    }[W] || { size: 0.45, color: '#f4fbff', trail: '#fff' };
    const flakeTex = () => canvasTex(64, 64, (x) => { x.strokeStyle = '#eaf6ff'; x.lineWidth = 6; x.lineCap = 'round'; for (let a = 0; a < 6; a++) { x.save(); x.translate(32, 32); x.rotate(a * Math.PI / 3); x.beginPath(); x.moveTo(0, 0); x.lineTo(0, -26); x.moveTo(0, -14); x.lineTo(-8, -20); x.moveTo(0, -14); x.lineTo(8, -20); x.stroke(); x.restore(); } });
    const boltTex = () => canvasTex(64, 64, (x) => { x.fillStyle = '#ffe36e'; x.strokeStyle = '#a86a00'; x.lineWidth = 3; x.beginPath(); x.moveTo(36, 2); x.lineTo(14, 36); x.lineTo(30, 36); x.lineTo(22, 62); x.lineTo(50, 24); x.lineTo(34, 24); x.lineTo(44, 2); x.closePath(); x.fill(); x.stroke(); });
    const ballMat = new THREE.SpriteMaterial({ map: SHOT.tex === 'flake' ? flakeTex() : SHOT.tex === 'bolt' ? boltTex() : glowTex(SHOT.color), transparent: true, depthWrite: false, blending: SHOT.glow && !SHOT.tex ? THREE.AdditiveBlending : THREE.NormalBlending });
    if (SHOT.tex === 'weapon' && opts.weaponArt) imageTex(CZ.art(opts.weaponArt), 128).then(tx => { if (tx) { ballMat.map = tx; ballMat.needsUpdate = true; } });
    const haloMat = SHOT.glow ? new THREE.SpriteMaterial({ map: glowTex(SHOT.color), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }) : null;
    const powerMats = {
      magnet: new THREE.SpriteMaterial({ map: labelTex('🧲', '#d63a3a', '#fff') }),
      double: new THREE.SpriteMaterial({ map: labelTex('x2', '#f2b51e', '#5a2d00') })
    };
    const sparkMat = new THREE.SpriteMaterial({ map: glowTex('rgba(255,220,90,1)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });

    const T = {};
    const loads = [
      ...['run1', 'run2', 'laugh', 'throw', 'dizzy', 'tongue', 'vrun0', 'vrun1', 'vrun2', 'vrun3', 'vrun4', 'vrun5', 'vrun6', 'vrun7'].map(f => imageTex(CZ.art('zibo.' + f), 384).then(x => { T['z_' + f] = x; })),
      opts.weaponArt ? imageTex(CZ.art(opts.weaponArt), 256).then(x => { T.weapon = x; }) : null,
      (opts.loot || (!CHASE && 'gold.chest_gold')) ? imageTex(CZ.art(opts.loot || 'gold.chest_gold'), 256).then(x => { T.loot = x; }) : null
    ];
    const ready = Promise.all(loads).then(() => {
      setZiboFrame('run1');
      if (T.weapon) { weaponMat.map = T.weapon; weaponMat.needsUpdate = true; weaponSp.scale.set(0.5 * T.weapon.userData.ratio, 0.5, 1); }
    });
    function setZiboFrame(f) {
      const tex = T['z_' + f] || T.z_run1;
      if (!tex || ziboMat.map === tex) return;
      ziboMat.map = tex; ziboMat.needsUpdate = true;
      zibo.scale.set((CHASE ? 2.5 : 1.7) * tex.userData.ratio, (CHASE ? 2.5 : 1.7) * (zibo.userData.sy || 1), 1);
    }

    /* ---------- Kovalamaca yardımcıları: bomba, uyarı şeridi, kanca ---------- */
    let lootSp = null;
    ready.then(() => {
      if (!T.loot) return;
      lootSp = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.loot }));
      lootSp.scale.set(0.7 * T.loot.userData.ratio, 0.7, 1);
      scene.add(lootSp);
    });
    // Uyarı: kırmızı-sarı tehlike çizgili, kenarları yumuşak ışıyan şerit (düz dikdörtgen değil).
    const warnTex = canvasTex(64, 256, (x, w, hh) => {
      const g = x.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, 'rgba(255,40,40,0)'); g.addColorStop(0.18, 'rgba(255,40,40,.9)'); g.addColorStop(0.82, 'rgba(255,40,40,.9)'); g.addColorStop(1, 'rgba(255,40,40,0)');
      x.fillStyle = g; x.fillRect(0, 0, w, hh);
      x.fillStyle = 'rgba(255,220,60,.85)';
      for (let y = 0; y < hh; y += 32) { x.beginPath(); x.moveTo(10, y); x.lineTo(32, y + 14); x.lineTo(54, y); x.lineTo(54, y + 10); x.lineTo(32, y + 24); x.lineTo(10, y + 10); x.fill(); }
    }, [1, 3]);
    const warnMat = new THREE.MeshBasicMaterial({ map: warnTex, transparent: true, opacity: 0, depthWrite: false });
    const warns = [];
    if (CHASE) for (let l = 0; l < LANES; l++) {
      const w = mesh(GEO.plane, warnMat.clone(), LANE_W * 0.92, 9, 1, laneX(l), 0.02, -1.5);
      w.rotation.x = -Math.PI / 2;
      scene.add(w);
      warns.push(w);
    }
    const bombTex = CHASE ? canvasTex(128, 128, (x) => {
      x.fillStyle = '#22252e'; x.beginPath(); x.arc(64, 72, 46, 0, 7); x.fill();
      x.fillStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.arc(48, 56, 12, 0, 7); x.fill();
      x.strokeStyle = '#8a6a3a'; x.lineWidth = 8; x.beginPath(); x.moveTo(64, 28); x.quadraticCurveTo(76, 10, 92, 14); x.stroke();
      x.fillStyle = '#ffcf3a'; x.beginPath(); x.arc(94, 14, 9, 0, 7); x.fill();
    }) : null;
    const chainMat = new THREE.MeshBasicMaterial({ color: 0xd8dde8 });
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1, 6), chainMat);
    chain.visible = false;
    scene.add(chain);
    function chaseFx(dt) {
      warns.forEach((w, l) => {
        const on = s.bombs.some(b => b.lane === l);
        w.material.opacity = on ? 0.55 + Math.abs(Math.sin(s.frame * 10)) * 0.4 : Math.max(0, w.material.opacity - dt * 3);
      });
      warnTex.offset.y -= dt * 1.6;
      for (let i = s.bombs.length - 1; i >= 0; i--) {
        const b = s.bombs[i];
        b.t += dt;
        const k = Math.min(1, b.t / b.dur);
        const x = b.x0 + (laneX(b.lane) - b.x0) * k;
        const z = b.z0 + (-1.2 - b.z0) * k;
        const y = b.y0 * (1 - k) + Math.sin(k * Math.PI) * 4 + 0.3 * k;
        b.sp.position.set(x, y, z);
        b.sp.material.rotation += dt * 6;
        if (k >= 1) {
          scene.remove(b.sp);
          s.bombs.splice(i, 1);
          sparks(new THREE.Vector3(laneX(b.lane), 0.6, -1.2), 10, '#ff8a3a');
          sparks(new THREE.Vector3(laneX(b.lane), 0.6, -1.2), 6, '#ffe27a');
        }
      }
      if (s.hookFx > 0) {
        s.hookFx -= dt;
        const from = new THREE.Vector3(s.px + 0.25, s.py + 1.3, -0.2);
        const to = s.hookHit ? new THREE.Vector3(zibo.position.x, 0.9, zibo.position.z) : new THREE.Vector3(s.px, 1.4, -14);
        const mid = from.clone().add(to).multiplyScalar(0.5);
        chain.position.copy(mid);
        chain.scale.set(1, from.distanceTo(to) * Math.min(1, (0.3 - s.hookFx) * 8 + 0.2), 1);
        chain.lookAt(to);
        chain.rotateX(Math.PI / 2);
        chain.visible = true;
      } else chain.visible = false;
    }

    /* ---------- Engeller ve toplanacaklar ---------- */
    function addObj(o) {
      if (o.mesh.isGroup) { if (o.mesh.userData.wobble) o.mesh.children.forEach(u => u.isGroup && bake(u)); else bake(o.mesh); }
      o.mesh.position.z = SPAWN_Z; scene.add(o.mesh); s.objs.push(o); return o;
    }
    function hurdle(lane) {          // alçak: hediye kutusu sırası → ZIPLA
      const g = new THREE.Group();
      g.add(mesh(GEO.box, pick(M.gifts), 0.62, 0.62, 0.62, -0.32, 0.31, 0));
      g.add(mesh(GEO.box, pick(M.gifts), 0.62, 0.62, 0.62, 0.32, 0.31, 0));
      g.add(mesh(GEO.box, pick(M.gifts), 0.44, 0.44, 0.44, 0, 0.84, 0.05));
      g.position.x = laneX(lane);
      return addObj({ type: 'low', lane, len: 0.7, top: 0.75, mesh: g });
    }
    function snowman(lane) {         // alçak (ama daha yüksek): kardan adam → ZIPLA
      const g = new THREE.Group();
      g.add(mesh(GEO.cyl, M.snowman, 0.42, 0.01, 0.42, 0, 0.005, 0));
      const b1 = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 10), M.snowman); b1.position.y = 0.4; g.add(b1);
      const b2 = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10), M.snowman); b2.position.y = 0.95; g.add(b2);
      [0.38, 0.55, 0.72].forEach(y => g.add(mesh(GEO.box, M.coal, 0.07, 0.07, 0.07, 0, y, 0.4)));
      g.add(mesh(GEO.cone, M.carrot, 0.05, 0.25, 0.05, 0, 0.97, 0.36).rotateX(Math.PI / 2));
      g.add(mesh(GEO.cyl, M.coal, 0.22, 0.04, 0.22, 0, 1.2, 0));
      g.add(mesh(GEO.cyl, M.coal, 0.15, 0.24, 0.15, 0, 1.34, 0));
      g.add(mesh(GEO.box, M.bow, 0.5, 0.1, 0.1, 0, 0.78, 0.12));
      g.position.x = laneX(lane);
      return addObj({ type: 'low', lane, len: 0.8, top: 1.15, mesh: g });
    }
    // Kızak treni: üstüne zıplanır ya da önündeki rampadan çıkılır, tepesinde koşulur (Subway'deki tren gibi).
    const TRAIN_TOP = 1.35;
    function train(lane, ramp) {
      const g = new THREE.Group();
      const wagons = 3, wl = 3.6, gap = 0.25, rampLen = ramp ? 3 : 0;
      const bodyLen = wagons * wl + (wagons - 1) * gap;
      const len = bodyLen + rampLen;
      const z0 = -len / 2;
      for (let w = 0; w < wagons; w++) {
        const zc = z0 + w * (wl + gap) + wl / 2;
        g.add(mesh(GEO.box, w % 2 ? M.wagonB : M.wagonA, 1.2, TRAIN_TOP - 0.25, wl, 0, 0.25 + (TRAIN_TOP - 0.25) / 2, zc));
        g.add(mesh(GEO.box, M.trim, 1.24, 0.1, wl + 0.04, 0, TRAIN_TOP - 0.05, zc));
        g.add(mesh(GEO.box, M.roofSnowT, 1.12, 0.06, wl - 0.1, 0, TRAIN_TOP + 0.03, zc));
        g.add(mesh(GEO.box, M.trim, 1.24, 0.08, wl, 0, 0.55, zc));
        // hediye kurdelesi: vagonu saran sarı bant + çatıda fiyonk
        g.add(mesh(GEO.box, M.ribbon, 1.26, TRAIN_TOP - 0.3, 0.22, 0, 0.25 + (TRAIN_TOP - 0.3) / 2, zc));
        g.add(mesh(GEO.box, M.ribbon, 0.5, 0.16, 0.22, -0.22, TRAIN_TOP + 0.12, zc));
        g.add(mesh(GEO.box, M.ribbon, 0.5, 0.16, 0.22, 0.22, TRAIN_TOP + 0.12, zc));
        [-1, 1].forEach(k => g.add(mesh(GEO.box, M.runnerMetal, 0.08, 0.14, wl, k * 0.52, 0.1, zc)));
        // pencere ışıkları
        [-1, 1].forEach(k => g.add(mesh(GEO.box, M.window, 0.02, 0.35, 0.6, k * 0.61, 0.9, zc - 0.8)));
        [-1, 1].forEach(k => g.add(mesh(GEO.box, M.window, 0.02, 0.35, 0.6, k * 0.61, 0.9, zc + 0.8)));
      }
      if (ramp) {
        const rz = z0 + bodyLen + rampLen / 2;
        const slope = Math.atan2(TRAIN_TOP, rampLen);
        const r = mesh(GEO.box, M.ramp, 1.1, 0.1, Math.hypot(rampLen, TRAIN_TOP), 0, TRAIN_TOP / 2, rz);
        r.rotation.x = slope;
        g.add(r);
        [-1, 1].forEach(k => g.add(mesh(GEO.box, M.beam, 0.08, TRAIN_TOP * 0.5, 0.08, k * 0.5, TRAIN_TOP * 0.25, rz - rampLen * 0.25)));
      }
      g.position.x = laneX(lane);
      const o = addObj({ type: 'train', lane, len, top: TRAIN_TOP, ramp, rampLen, mesh: g });
      // tepesinde altın dizisi
      for (let z = z0 + 0.8; z < z0 + bodyLen - 0.4; z += R.coinGap) coin(lane, SPAWN_Z + z, TRAIN_TOP + 0.55);
      return o;
    }
    // Trenin üstündeki zemin yüksekliği (oyuncunun z=0 noktasında). Rampada eğimli artar.
    function floorOf(o) {
      const lz = -o.mesh.position.z;          // oyuncunun trene göre yerel konumu
      const half = o.len / 2;
      if (lz < -half || lz > half) return 0;
      if (o.ramp && lz > half - o.rampLen) return o.top * (half - lz) / o.rampLen;
      return o.top;
    }
    // Oyuncak askerler: Zibo'nun yola dizdiği kurmalı askerler (alçak → ZIPLA), hafifçe sallanırlar.
    function soldiers(lane) {
      const g = new THREE.Group();
      [-0.36, 0, 0.36].forEach((x, i) => {
        const u = new THREE.Group();
        u.add(mesh(GEO.box, M.soldier, 0.24, 0.42, 0.2, 0, 0.36, 0));
        u.add(mesh(GEO.box, M.coal, 0.24, 0.22, 0.2, 0, 0.06, 0));
        u.add(mesh(GEO.box, M.skin, 0.18, 0.16, 0.16, 0, 0.66, 0));
        u.add(mesh(GEO.cyl, M.coal, 0.1, 0.24, 0.1, 0, 0.86, 0));
        u.add(mesh(GEO.box, M.trim, 0.26, 0.05, 0.22, 0, 0.5, 0));
        u.position.x = x; u.userData.wob = i * 1.3;
        g.add(u);
      });
      g.position.x = laneX(lane);
      g.userData.wobble = true;
      return addObj({ type: 'low', lane, len: 0.5, top: 1.0, mesh: g });
    }
    function banner(lane) {          // yüksek: çelenkli pankart → EĞİL
      const g = new THREE.Group();
      [-1, 1].forEach(k => g.add(mesh(GEO.cyl, M.pole, 0.06, 2.3, 0.06, k * 0.6, 1.15, 0)));
      g.add(mesh(GEO.box, M.banner, 1.3, 0.7, 0.08, 0, 1.75, 0));
      g.add(mesh(GEO.box, M.garland, 1.36, 0.14, 0.14, 0, 2.12, 0));
      g.add(mesh(GEO.box, M.bow, 0.3, 0.22, 0.12, 0, 1.75, 0.06));
      g.position.x = laneX(lane);
      return addObj({ type: 'high', lane, len: 0.3, mesh: g });
    }
    function sled(lane) {            // duvar: hediye yüklü kızak → ŞERİT DEĞİŞTİR
      const g = new THREE.Group();
      g.add(mesh(GEO.box, M.sled, 1.15, 0.5, 3.2, 0, 0.45, 0));
      [-1, 1].forEach(k => g.add(mesh(GEO.box, M.runnerMetal, 0.08, 0.1, 3.5, k * 0.5, 0.08, 0)));
      g.add(mesh(GEO.box, pick(M.gifts), 0.9, 0.9, 0.9, 0, 1.15, -0.8));
      g.add(mesh(GEO.box, pick(M.gifts), 0.8, 0.8, 0.8, 0.05, 1.1, 0.5));
      g.add(mesh(GEO.box, pick(M.gifts), 0.6, 0.6, 0.6, -0.05, 1.85, -0.3));
      g.position.x = laneX(lane);
      return addObj({ type: 'wall', lane, len: 3.4, mesh: g });
    }
    function crate(lane) {           // kırılabilir sandık: kartopuyla vur → altın
      const def = pickW(R.crates);
      const g = new THREE.Group();
      g.add(mesh(GEO.box, def.id === 'gold' ? M.goldChest : M.wood, 1.0, 0.9, 0.9, 0, 0.45, 0));
      g.add(mesh(GEO.box, M.beam, 1.04, 0.12, 0.94, 0, 0.62, 0));
      g.position.x = laneX(lane);
      return addObj({ type: 'crate', lane, len: 0.95, top: 0.95, hp: def.hp, def, mesh: g });
    }
    function pickW(list) {
      let r = Math.random() * list.reduce((a, c) => a + c.weight, 0);
      for (const c of list) { r -= c.weight; if (r <= 0) return c; }
      return list[0];
    }
    // Altınlar tek bir "örnekli" ağla çizilir (kaç altın olursa olsun 1 çizim çağrısı).
    const COIN_MAX = 120;
    const coinInst = new THREE.InstancedMesh(GEO.coin, M.coin, COIN_MAX);
    coinInst.count = 0;
    coinInst.frustumCulled = false;
    scene.add(coinInst);
    function coin(lane, z, y) {
      const m = new THREE.Object3D();       // sahneye eklenmez; sadece konum tutar
      m.position.set(laneX(lane), y, z);
      s.coins.push({ kind: 'coin', mesh: m, lane });
    }
    function drawCoins() {
      let n = 0;
      for (const c of s.coins) {
        if (c.kind !== 'coin' || n >= COIN_MAX) continue;
        c.mesh.updateMatrix();
        coinInst.setMatrixAt(n++, c.mesh.matrix);
      }
      coinInst.count = n;
      coinInst.instanceMatrix.needsUpdate = true;
    }
    function gem(lane, z, y) {
      const m = new THREE.Mesh(GEO.gem, M.emerald);
      m.scale.set(1, 1.4, 1);
      m.position.set(laneX(lane), y, z);
      scene.add(m);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex('rgba(80,255,150,.9)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      glow.scale.set(1.6, 1.6, 1); m.add(glow);
      s.coins.push({ kind: 'gem', mesh: m, lane });
    }
    function power(lane, z, kind) {
      const sp = new THREE.Sprite(powerMats[kind]);
      sp.scale.set(0.8, 0.8, 1);
      sp.position.set(laneX(lane), 0.9, z);
      scene.add(sp);
      s.coins.push({ kind, mesh: sp, lane });
    }

    // Bir sıra: her şeride engel ya da boşluk. En az bir şerit hep geçilebilir.
    function spawnRow() {
      const early = s.t < s.obstaclesFrom;
      const ALL = Array.from({ length: LANES }, (_, i) => i);
      const kinds = ALL.map(() => null);
      if (!early) {
        const k = s.t < s.obstaclesFrom + 10 ? 1 : s.t < s.obstaclesFrom + 30 ? pick([1, 2, 2]) : pick([1, 2, 3, 3]);
        const lanes = ALL.slice().sort(() => Math.random() - 0.5).slice(0, CHASE ? Math.min(k, 1 + (Math.random() < 0.35 ? 1 : 0)) : k);
        let crateUsed = false;
        lanes.forEach(l => {
          let kind = pickW(R.obstacles).id;
          // Noel Ekspresi (hediye vagonları) geri döndü: rampayla üstüne çık, çatıda koş.
          if (kind === 'crate') kind = pick(['low', 'low', 'soldier', 'high', 'wall']);
          if (CHASE && kind === 'train' && s.t < 6) kind = 'low';
          if (kind === 'train' && s.t < R.trainsFrom) kind = 'wall';
          if (kind === 'crate') { if (crateUsed) kind = 'low'; crateUsed = true; }
          kinds[l] = kind;
        });
        // Adalet: bir sırada en fazla bir kızak (duvar); kalanlar zıplanır/eğilinir.
        let walls = 0;
        kinds.forEach((k2, l) => { if ((k2 === 'wall' || k2 === 'train') && ++walls > (CHASE ? 1 : 2)) kinds[l] = pick(['low', 'soldier', 'high']); });
        // Bir şeritte tren varken diğer şeritlerden en az biri tamamen açık kalsın
        const blocked = ALL.filter(l => s.busy && s.busy[l] > s.dist).length;
        if (blocked >= LANES - 1) kinds.forEach((k2, l) => { if (k2 === 'train' || k2 === 'wall') kinds[l] = 'low'; });
      }
      // Tren geçen şeride, tren bitene kadar yeni engel konmaz.
      s.busy = s.busy || ALL.map(() => 0);
      kinds.forEach((k2, l) => { if (k2 && s.busy[l] > s.dist) kinds[l] = null; });
      kinds.forEach((k2, l) => {
        if (k2 === 'train') { const o = train(l, Math.random() < R.rampChance); s.busy[l] = s.dist + o.len + 4; return; }
        if (k2 === 'soldier') soldiers(l); else if (k2 === 'low') { if (Math.random() < 0.35) snowman(l); else hurdle(l); } else if (k2 === 'high') banner(l); else if (k2 === 'wall') sled(l); else if (k2 === 'crate') crate(l);
      });
      if (!early && Math.random() < 0.5) { s.ziboPose = 0.5; }
      // Altın dizisi: geçilebilir bir şeritte, engelin önünde başlar, alçak engelin üstünden kavis çizer.
      // Altın dizileri: her sırada en az bir uzun dizi, bazen ikinci bir şeritte daha.
      const options = ALL.filter(l => kinds[l] !== 'soldier' && kinds[l] !== 'wall' && kinds[l] !== 'crate' && kinds[l] !== 'train' && !(s.busy[l] > s.dist));
      const lines = Math.random() > R.coinLineChance ? 0 : Math.random() < R.secondLine ? 2 : 1;
      const used = [];
      for (let li = 0; li < lines && options.length; li++) {
        const l = options.splice(Math.floor(Math.random() * options.length), 1)[0];
        used.push(l);
        const n = Math.floor(rand(R.coinLine[0], R.coinLine[1] + 1));
        for (let i = 0; i < n; i++) {
          const dz = (i - (n - 1) / 2) * R.coinGap;
          let y = 0.55;
          if (kinds[l] === 'low') y = 0.55 + Math.max(0, 1.5 - Math.abs(dz) * 0.32);
          if (kinds[l] === 'high' && Math.abs(dz) < 1) y = 0.35;
          coin(l, SPAWN_Z + dz, y);
        }
        // Elmas: nadir ve zor yerde (alçak engelin tam üstünde, havada).
        if (kinds[l] === 'low' && s.t > R.emeraldFrom && s.emeraldsSpawned < R.emeraldMax && Math.random() < R.emeraldChance) {
          s.emeraldsSpawned += 1;
          gem(l, SPAWN_Z, 2.15);
        }
      }
      if (s.t >= s.nextPower) {
        const free = ALL.filter(l => !kinds[l]);
        if (free.length) { power(pick(free), SPAWN_Z - 6, Math.random() < 0.5 ? 'magnet' : 'double'); s.nextPower = s.t + rand(R.powerEvery[0], R.powerEvery[1]); }
      }
    }
    s.emeraldsSpawned = 0;

    /* ---------- Kontroller ---------- */
    function move(dir) {
      if (!s.running) return;
      const n = Math.max(0, Math.min(LANES - 1, s.lane + dir));
      if (n === s.lane) { bump(); return; }
      const old = s.lane;
      s.lane = n;
      CZ.audio.sfx('swish');
      // Kaç kombosu: arka arkaya hızlı kaçışlar kombo yapar. Hemen önündeki engelden/bombadan
      // son anda kaçarsan "Kıl payı!" bonusu (kombo ile katlanır).
      s.combo = s.t - (s.lastSwipe || -9) < 0.9 ? (s.combo || 0) + 1 : 1;
      s.lastSwipe = s.t;
      s.bestCombo = Math.max(s.bestCombo || 0, s.combo);
      const near = s.objs.some(o => o.lane === old && !o.passed && !o.dead && o.type !== 'crate' && o.mesh.position.z < 0 && o.mesh.position.z > -s.speed * 0.4 - o.len / 2)
        || s.bombs.some(b => b.lane === old && b.t / b.dur > 0.55);
      const gold = (near ? 3 * Math.min(s.combo, 5) : 0) + (s.combo >= 3 ? 1 : 0);
      if (gold) { s.gold += gold; opts.onGold(gold); }
      if (near) { s.nearMiss = (s.nearMiss || 0) + 1; CZ.audio.sfx('coin', 6); sparks(new THREE.Vector3(laneX(old), 1, -0.6), 5, '#ffe27a'); }
      if (opts.onSwipe) opts.onSwipe(s.combo, near, gold);
    }
    function jump() {
      if (!s.running) return;
      if (s.jumping) return;
      s.jumping = true; s.vy = R.jumpV; s.slideT = 0;
      s.squashV = -0.22;   // kalkışta uzama
      sparks(new THREE.Vector3(s.px, (s.floor || 0) + 0.1, 0.2), 5, '#eaf6ff', 0.22);
      CZ.audio.sfx('jump');
    }
    function slide() {
      if (!s.running) return;
      if (s.jumping) { s.vy = -R.jumpV * 1.4; }      // havadaysan hızla in
      s.slideT = R.slideSec;
      CZ.audio.sfx('slide');
    }
    function bump() { s.shake = 0.12; CZ.audio.vibrate(10); }
    function shoot() {
      if (!s.running) return;
      const now = s.t;
      if (now - s.lastThrow < (CHASE ? 0.35 : 0.6)) return;
      s.lastThrow = now;
      // Zibo'yla aynı şeritteysen silah ona gider: her isabette çuvalından altın saçılır.
      const target = !CHASE && s.ziboLane === s.lane && s.ziboRun !== false ? { zibo: true, mesh: zibo, onHit: huntHit } : null;
      const ball = new THREE.Sprite(ballMat.clone());
      ball.scale.set(SHOT.size, SHOT.size, 1);
      if (haloMat) { const hl = new THREE.Sprite(haloMat); hl.scale.set(2.2, 2.2, 1); ball.add(hl); }
      if (SHOT.flash) { s.shake = Math.max(s.shake, 0.06); }
      ball.position.set(s.px + 0.3, s.py + 1.1, -0.3);
      scene.add(ball);
      s.shots.push({ mesh: ball, target, life: 0.6 });
      CZ.audio.sfx('throw');
      if (opts.onThrow) opts.onThrow();
    }
    const down = { x: 0, y: 0, t: 0, used: false };
    const cv = renderer.domElement;
    function onDown(e) { down.x = e.clientX; down.y = e.clientY; down.t = performance.now(); down.used = false; }
    function onMove(e) {
      if (down.used || !down.t) return;
      const dx = e.clientX - down.x, dy = e.clientY - down.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 26) return;
      down.used = true;
      if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 1 : -1); else if (dy < 0) { if (opts.onSwipeUp) opts.onSwipeUp(); else jump(); } else slide();
    }
    function onUp() { if (!down.used && down.t && performance.now() - down.t < 350) { if (opts.onTap) opts.onTap(); else shoot(); } down.t = 0; }
    cv.addEventListener('pointerdown', onDown);
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp);
    cv.addEventListener('pointercancel', () => { down.t = 0; });
    function onKey(e) {
      const map = { ArrowLeft: () => move(-1), ArrowRight: () => move(1), ArrowUp: opts.onSwipeUp || jump, ArrowDown: slide, ' ': opts.onTap || shoot };
      if (map[e.key]) { e.preventDefault(); map[e.key](); }
    }
    window.addEventListener('keydown', onKey);

    /* ---------- Boyut ---------- */
    function resize() {
      const w = host.clientWidth, h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // dar ekranda 4 şeridin hepsi görünsün diye görüş açısı genişler
      camera.fov = w / h < 0.6 ? 70 : 62;
      camera.updateProjectionMatrix();
    }
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    /* ---------- Döngü ---------- */
    let raf = 0, last = 0;
    // Akıcılık: kare süresini ölç; telefon zorlanıyorsa çözünürlüğü kademeli düşür (oyun hissi > keskinlik).
    const perf = s.perf = { fps: 60, js: 0, calls: 0, ratio: renderer.getPixelRatio(), acc: 0, n: 0, jsAcc: 0, slow: 0 };
    const RATIOS = [Math.min(window.devicePixelRatio || 1, 1.5), 1, 0.8, 0.65];
    let ratioIdx = 0;
    const fpsEl = /[?&]fps=1/.test(location.search) || CZ.DEV ? document.createElement('div') : null;
    if (fpsEl) { fpsEl.className = 'fps-meter'; host.append(fpsEl); }
    function loop(now) {
      raf = requestAnimationFrame(loop);
      const raw = now - (last || now);
      const dt = Math.min(0.05, raw / 1000);
      last = now;
      const t0 = performance.now();
      if (s.running) step(dt);
      else if (s.catching) catchStep(dt);
      else idle(dt);
      petStep(dt);
      drawCoins();
      renderer.render(scene, camera);
      perf.jsAcc += performance.now() - t0;
      perf.acc += raw; perf.n++;
      if (perf.acc >= 1500) {
        perf.fps = Math.round(1000 * perf.n / perf.acc);
        perf.js = +(perf.jsAcc / perf.n).toFixed(1);
        perf.calls = renderer.info.render.calls;
        // 3 ölçüm üst üste 48 fps altıysa bir kademe düşür
        perf.slow = perf.fps < 48 && !document.hidden ? perf.slow + 1 : 0;
        if (perf.slow >= 2 && ratioIdx < RATIOS.length - 1) {
          ratioIdx++; perf.slow = 0;
          renderer.setPixelRatio(RATIOS[ratioIdx]); perf.ratio = RATIOS[ratioIdx];
          resize();
        }
        if (fpsEl) fpsEl.textContent = perf.fps + ' fps · ' + perf.js + ' ms · ' + perf.calls + ' dc · x' + perf.ratio;
        perf.acc = 0; perf.n = 0; perf.jsAcc = 0;
      }
    }
    // Yakalama sahnesi: ağır çekim, kahraman Zibo'nun üstüne atlar, eşya havaya fırlar, kamera yaklaşır.
    // Zibo da engelleri aşar: alçak/kızak → zıplar, pankart → eğilir. Önündeki engel ortasından geçerken zirvede olur.
    function ziboHurdles(dt) {
      if (!s.zj) {
        for (const o of s.objs) {
          if (o.ziboDone || o.type === 'train' || Math.abs(laneX(o.lane) - zibo.position.x) > 0.7) continue;
          const dur = Math.max(0.5, (2.4 + o.len) / Math.max(1, s.speed));
          const d = o.mesh.position.z - zibo.position.z;           // < 0: Zibo'nun önünde
          if (d < -(dur * s.speed) / 2 - 0.2 || d > o.len / 2) continue;
          o.ziboDone = true;
          s.zj = { t: 0, dur, duck: o.type === 'high', h: o.type === 'wall' ? 2.1 : 1.35 };
          if (!s.zj.duck) CZ.audio.sfx('jump');
          break;
        }
      }
      let y = 0, sy = 1;
      // Zibo'nun şeridinde tren varsa çatısında koşar (rampadan çıkar)
      for (const o of s.objs) {
        if (o.type !== 'train' || Math.abs(laneX(o.lane) - zibo.position.x) > 0.7) continue;
        const lz = zibo.position.z - o.mesh.position.z, half = o.len / 2;
        if (lz < -half || lz > half) continue;
        y = Math.max(y, o.ramp && lz > half - o.rampLen ? o.top * (half - lz) / o.rampLen : o.top);
      }
      if (s.zj) {
        s.zj.t += dt;
        const k = Math.min(1, s.zj.t / s.zj.dur);
        if (s.zj.duck) sy = 1 - Math.sin(k * Math.PI) * 0.4;
        else y += Math.sin(k * Math.PI) * s.zj.h;
        if (k >= 1) s.zj = null;
      }
      if (opts.ziboFly) y += 0.7 + Math.sin(s.frame * 5) * 0.25;
      zibo.position.y = y;
      zibo.userData.sy = sy;
      if (ziboMat.map) zibo.scale.y = (CHASE ? 2.5 : 1.7) * sy;
    }
    function catchStep(dt) {
      const t0 = s.catching;
      s.catching += dt;
      const t = s.catching;
      s.frame += dt;
      const zx = zibo.position.x, zz = zibo.position.z;
      zibo.position.y += (0 - zibo.position.y) * Math.min(1, dt * 10); zibo.userData.sy = 1;
      const k = Math.min(1, t / 0.7);
      const e = k < 1 ? 1 - Math.pow(1 - k, 3) : 1;
      // kahraman sıçrar
      s.px += (zx - s.px) * Math.min(1, dt * 6);
      const hz = (zz + 0.9) * e;
      s.py = k < 1 ? Math.sin(k * Math.PI) * 1.3 + 0.4 * k : 0.4;
      hero.root.position.set(s.px, s.py, hz);
      hero.update(dt * (k < 1 ? 0.35 : 1), { speed: k < 1 ? 4 : 0, jumping: k < 1, idle: k >= 1, dead: false, vy: k < 0.5 ? 5 : -5, jumpV: R.jumpV });
      pShadow.position.set(s.px, 0.02, hz);
      // Zibo yere yuvarlanır, döner
      zibo.position.z += (-3.4 - zibo.position.z) * Math.min(1, dt * 4);
      if (t > 0.55) zibo.material.rotation = Math.sin(t * 14) * 0.15 * Math.max(0, 1.6 - t);
      // eşya havaya fırlar ve kameraya döner
      if (lootSp) {
        const lk = Math.max(0, Math.min(1, (t - 0.45) / 0.9));
        const ex = camera.position.x, ey = camera.position.y + 0.15, ez = camera.position.z - 3.4;
        lootSp.position.set(zx + (ex - zx) * lk, 1.3 + (ey - 1.3) * lk + Math.sin(lk * Math.PI) * 1.4, zz + (ez - zz) * lk);
        const sc = 0.7 + lk * 0.35;
        lootSp.scale.set(sc * T.loot.userData.ratio, sc, 1);
        lootSp.material.rotation = lk < 1 ? lk * Math.PI * 4 : 0;
        if (t0 < 0.45 && t >= 0.45) { sparks(lootSp.position.clone(), 14, '#ffe27a'); sparks(lootSp.position.clone(), 10, '#ffffff'); s.shake = 0.3; }
      }
      // kamera yaklaşır
      const cz = camBase.z - Math.min(1, t / 1.2) * 2.4;
      camera.position.x += (zx * 0.7 - camera.position.x) * Math.min(1, dt * 3);
      camera.position.y += (camBase.y - 0.5 - camera.position.y) * Math.min(1, dt * 3);
      camera.position.z += (cz - camera.position.z) * Math.min(1, dt * 3);
      camera.lookAt(zx * 0.6, 1.1, zz - 4);
      if (s.shake > 0) { s.shake -= dt; camera.position.x += rand(-0.15, 0.15); camera.position.y += rand(-0.1, 0.1); }
      for (let i = s.fx.length - 1; i >= 0; i--) {
        const f = s.fx[i];
        f.life -= dt; f.mesh.position.addScaledVector(f.v, dt); f.v.y -= 9 * dt;
        f.mesh.material.opacity = Math.max(0, f.life / f.max);
        if (f.life <= 0) { scene.remove(f.mesh); f.mesh.material.dispose(); s.fx.splice(i, 1); }
      }
      setZiboFrame('dizzy');
      animateSnow(dt, 2);
    }
    function idle(dt) {
      s.frame += dt;
      hero.update(dt, { speed: 0, idle: !s.dead, dead: !!s.dead });
      animateSnow(dt, 4);
    }
    function animateSnow(dt, v) {
      const a = flakeGeo.attributes.position.array;
      for (let i = 0; i < flakes; i++) {
        a[i * 3 + 1] -= dt * 1.4;
        a[i * 3 + 2] += dt * v;
        a[i * 3] += Math.sin(s.frame * 1.3 + i) * dt * 0.3;
        if (a[i * 3 + 1] < 0 || a[i * 3 + 2] > 7) { a[i * 3] = rand(-14, 14); a[i * 3 + 1] = rand(6, 12); a[i * 3 + 2] = rand(-60, 0); }
      }
      flakeGeo.attributes.position.needsUpdate = true;
    }

    function step(dt) {
      s.t += dt;
      s.frame += dt;
      s.speed = CHASE ? (opts.speed || 16) * (s.stunT > 0 ? 0.5 : 1) : Math.min(R.maxSpeed, R.startSpeed + s.t * R.accel) * (s.invT > R.invulnSec - 0.6 && !(s.dashT > 0) ? 0.55 : 1);
      s.stunT = Math.max(0, (s.stunT || 0) - dt);
      if (s.dashT > 0) { s.dashT -= dt; s.speed *= 1.6; if (s.dashT <= 0) drawSled(); if (Math.random() < 0.5) sparks(new THREE.Vector3(s.px + rand(-0.4, 0.4), 0.15, 0.6), 1, '#bfe4ff', 0.25); }
      const fov = s.dashT > 0 ? 72 : 62;
      if (Math.abs(camera.fov - fov) > 0.1) { camera.fov += (fov - camera.fov) * Math.min(1, dt * 6); camera.updateProjectionMatrix(); }
      const dz = s.speed * dt;
      s.dist += dz;
      s.score = (s.score || 0) + dz * (s.doubleT > 0 ? 2 : 1);
      // zemin kayar
      M.road.map.offset.y += dz / (200 / 24);
      M.snow.map.offset.y += dz / (200 / 30);
      // dekor geri döner
      deco.forEach(d => {
        d.position.z += dz;
        if (d.position.z > KILL_Z + 4) d.position.z -= 118;
      });
      animateSnow(dt, s.speed * 0.6);

      // sıra doğar
      s.nextRow -= dz;
      if (s.nextRow <= 0 && !s.catching) {
        spawnRow();
        s.nextRow = CHASE ? rand(22, 30) : Math.max(R.rowGap[0], R.rowGap[1] - s.t * 0.06) + rand(0, 4);
      }

      // oyuncu
      const tx = laneX(s.lane);
      s.px += (tx - s.px) * Math.min(1, dt * 16);
      const floor = s.floor || 0;
      // Ayak sesi: her adımda (adım hızı koşu hızıyla artar)
      s.stepT = (s.stepT || 0) - dt;
      if (s.stepT <= 0 && !s.jumping && !(s.slideT > 0)) { s.stepT = 3.4 / (8 + s.speed * 0.32); s.stepSide = !s.stepSide; CZ.audio.sfx('step', s.stepSide ? 1 : 0); }
      if (s.jumping) {
        s.vy -= R.gravity * dt;
        s.py += s.vy * dt;
        if (s.py <= floor && s.vy <= 0) { s.py = floor; s.vy = 0; s.jumping = false; s.squashV = 0.28; sparks(new THREE.Vector3(s.px, floor + 0.08, 0.2), 7, '#eaf6ff', 0.24); CZ.audio.sfx('land'); }
      } else if (s.py < floor) {
        s.py = floor;                                   // rampadan yukarı çıkış
      } else if (s.py > floor + 0.05) {
        s.jumping = true; s.vy = 0;                     // trenin ucundan düşüş
      }
      s.slideT = Math.max(0, s.slideT - dt);
      s.invT = Math.max(0, s.invT - dt);
      s.magnetT = Math.max(0, s.magnetT - dt);
      s.doubleT = Math.max(0, s.doubleT - dt);
      const sliding = s.slideT > 0 && !s.jumping;
      const lean = (tx - s.px) * 0.6;
      hero.root.position.set(s.px, s.py, 0);
      hero.update(dt, { speed: s.speed, jumping: s.jumping, sliding, lean, dead: false, vy: s.vy, jumpV: R.jumpV });
      // Ezilme/uzama (kalkış, iniş) + eğilirken kar püskürmesi + kaçarken yana savrulma
      s.squashV = (s.squashV || 0) * Math.max(0, 1 - dt * 9);
      const sq = s.squashV || 0;
      hero.root.scale.set(1 + sq * 0.6, 1 - sq, 1);
      hero.root.rotation.z = -lean * 0.15;
      if (sliding && Math.random() < 0.6) sparks(new THREE.Vector3(s.px + rand(-0.3, 0.3), (s.floor || 0) + 0.1, 0.4), 1, '#ffffff', 0.18);
      if (Math.abs(lean) > 0.35 && Math.random() < 0.5) sparks(new THREE.Vector3(s.px - Math.sign(lean) * 0.4, (s.floor || 0) + 0.15, 0.3), 1, '#dff2ff', 0.16);
      hero.setOpacity(s.invT > 0 ? (Math.floor(s.t * 14) % 2 ? 0.35 : 1) : 1);
      weaponSp.visible = !sliding && !!T.weapon;
      pShadow.position.x = s.px;
      pShadow.position.y = (s.floor || 0) + 0.02;
      const sh = Math.max(0.4, 1 - (s.py - (s.floor || 0)) * 0.25);
      pShadow.scale.set(1.1 * sh, 0.7 * sh, 1);

      // kamera hafifçe oyuncuyu izler, çarpınca sallanır
      camera.position.x += (s.px * 0.55 - camera.position.x) * Math.min(1, dt * 6);
      // Trenin üstündeyken kamera da yükselir (zemin), zıplarken biraz izler.
      s.camFloor = (s.camFloor || 0) + (((s.floor || 0)) - (s.camFloor || 0)) * Math.min(1, dt * 5);
      camera.position.y = camBase.y + s.camFloor * 0.85 + (s.py - (s.floor || 0)) * 0.25;
      if (s.shake > 0) { s.shake -= dt; camera.position.x += rand(-0.12, 0.12); camera.position.y += rand(-0.08, 0.08); }

      // Zibo önde koşar
      s.ziboNext -= dt;
      if (!CHASE && s.ziboNext <= 0) { s.ziboLane = Math.floor(Math.random() * LANES); s.ziboNext = rand(1.2, 2.4); }
      s.ziboKick = Math.max(0, (s.ziboKick || 0) - dt * 3);
      if (s.ziboCaughtT > 0) { s.ziboCaughtT -= dt; s.ziboZ = -11 - Math.sin(Math.min(1, (3 - s.ziboCaughtT) / 3) * Math.PI) * 14; }
      zibo.position.z += (s.ziboZ + s.ziboKick - zibo.position.z) * Math.min(1, dt * 7);
      if (lootSp) { lootSp.position.set(zibo.position.x + 0.35, zibo.position.y + 1.25, zibo.position.z + 0.05); }
      if (crown) crown.position.set(zibo.position.x, zibo.position.y + zibo.scale.y * 0.98, zibo.position.z + 0.02);
      chaseFx(dt);
      s.ziboX += (laneX(s.ziboLane) - s.ziboX) * Math.min(1, dt * 3);
      s.ziboPose = Math.max(0, s.ziboPose - dt);
      zibo.position.x = s.ziboX;
      ziboHurdles(dt);
      // Koşu: Viggle videosundan 8 kare (saniyede 20 kare)
      setZiboFrame(s.ziboForce || (s.laughT > 0 ? 'laugh' : s.ziboPose > 0 ? 'throw' : 'vrun' + (Math.floor(s.frame * 20) % 8)));
      s.laughT = Math.max(0, (s.laughT || 0) - dt);
      if (s.ziboHitT > 0) { s.ziboHitT -= dt; zibo.material.rotation = Math.sin(s.ziboHitT * 30) * 0.18; if (s.ziboHitT <= 0) { s.ziboForce = null; zibo.material.rotation = 0; } }

      // engeller
      let nextFloor = 0;
      for (let i = s.objs.length - 1; i >= 0; i--) {
        const o = s.objs[i];
        o.mesh.position.z += dz;
        const z = o.mesh.position.z;
        if (z > KILL_Z) { scene.remove(o.mesh); s.objs.splice(i, 1); continue; }
        if (o.mesh.userData.wobble) o.mesh.children.forEach(u => { u.rotation.z = Math.sin(s.frame * 9 + u.userData.wob) * 0.18; });
        if (o.hitFlash) { o.hitFlash -= dt; o.mesh.scale.setScalar(o.hitFlash > 0 ? 1.08 : 1); }
        if (o.passed || o.dead) continue;
        const half = o.len / 2 + 0.3;
        if (Math.abs(z) > half) {
          if (z > half && !o.passed) { o.passed = true; if (o.type !== 'crate' && Math.abs(s.px - laneX(o.lane)) < 0.7) dodged(o); }
          continue;
        }
        if (o.type === 'train') {
          // Tren: şeridindeysen ya üstündesin (zemin) ya da yan/ön yüzüne çarparsın.
          if (Math.abs(s.px - laneX(o.lane)) > 0.62) continue;
          const f = floorOf(o);
          if (s.py >= f - 0.45) { nextFloor = Math.max(nextFloor, f); continue; }
          if (s.invT <= 0) { o.passed = true; crash(o); }
          continue;
        }
        if (Math.abs(s.px - laneX(o.lane)) > 0.62) continue;
        let hit = false;
        if (o.type === 'low' || o.type === 'crate') hit = s.py < o.top - 0.05;
        else if (o.type === 'high') hit = !sliding;
        else hit = true;
        if (hit && s.invT <= 0) { o.passed = true; crash(o); }
      }

      s.floor = nextFloor;
      // altın, elmas, güç
      const magnet = s.magnetT > 0;
      for (let i = s.coins.length - 1; i >= 0; i--) {
        const c = s.coins[i];
        c.mesh.position.z += dz;
        if (c.kind === 'coin' || c.kind === 'gem') c.mesh.rotation.y += dt * 4;
        const p = c.mesh.position;
        if (magnet && c.kind === 'coin' && p.z > -16 && p.z < 1) {
          p.x += (s.px - p.x) * Math.min(1, dt * 10);
          p.y += (s.py + 0.8 - p.y) * Math.min(1, dt * 10);
          p.z += (0 - p.z) * Math.min(1, dt * 6);
        }
        if (p.z > KILL_Z) { scene.remove(c.mesh); s.coins.splice(i, 1); continue; }
        if (Math.abs(p.z) < 0.7 && Math.abs(p.x - s.px) < 0.65 && p.y > s.py - 0.3 && p.y < s.py + (sliding ? 1.0 : 1.9)) {
          scene.remove(c.mesh); s.coins.splice(i, 1);
          collect(c);
        }
      }

      // kartopları
      for (let i = s.shots.length - 1; i >= 0; i--) {
        const b = s.shots[i];
        b.life -= dt;
        if (SHOT.spin) b.mesh.material.rotation += dt * SHOT.spin;
        // iz: arkasında küçük parıltılar
        b.trailT = (b.trailT || 0) - dt;
        if (b.trailT <= 0) { b.trailT = 0.03; sparks(b.mesh.position, 1, SHOT.trail, 0.18); }
        const tgt = b.target && !b.target.dead ? b.target.mesh.position : null;
        if (tgt) {
          const ty = b.target.zibo ? tgt.y + 1.1 : 0.55;
          const dir = new THREE.Vector3(tgt.x - b.mesh.position.x, ty - b.mesh.position.y, tgt.z - b.mesh.position.z);
          const dist = dir.length();
          if (dist < 0.6) {
            if (b.target.zibo) { ziboHit(); if (b.target.onHit) b.target.onHit(); } else hitCrate(b.target);
            scene.remove(b.mesh); s.shots.splice(i, 1); continue;
          }
          dir.normalize().multiplyScalar(Math.min(dist, 60 * (SHOT.speed || 1) * dt));
          b.mesh.position.add(dir);
        } else {
          b.mesh.position.z -= 50 * dt;
        }
        if (b.life <= 0) { scene.remove(b.mesh); s.shots.splice(i, 1); }
      }

      // kıvılcımlar
      for (let i = s.fx.length - 1; i >= 0; i--) {
        const f = s.fx[i];
        f.life -= dt;
        f.mesh.position.addScaledVector(f.v, dt);
        f.v.y -= 9 * dt;
        f.mesh.position.z += dz * 0.6;
        f.mesh.material.opacity = Math.max(0, f.life / f.max);
        if (f.life <= 0) { scene.remove(f.mesh); f.mesh.material.dispose(); s.fx.splice(i, 1); }
      }

      if (opts.onTick) opts.onTick(s);
    }

    function sparks(pos, n, color, size) {
      for (let i = 0; i < n; i++) {
        const mat = sparkMat.clone();
        if (color) mat.color = new THREE.Color(color);
        const sp = new THREE.Sprite(mat);
        const sz = size || 0.35;
        sp.scale.set(sz, sz, 1);
        sp.position.copy(pos);
        scene.add(sp);
        const trail = !!size;
        s.fx.push({ mesh: sp, v: trail ? new THREE.Vector3(rand(-.4, .4), rand(-.2, .4), rand(1, 3)) : new THREE.Vector3(rand(-3, 3), rand(3, 6), rand(-2, 2)), life: trail ? 0.25 : 0.55, max: trail ? 0.25 : 0.55 });
      }
    }

    function collect(c) {
      if (c.kind === 'coin') {
        let n = R.coinValue * (s.doubleT > 0 ? 2 : 1);
        if (opts.goldMult > 1) { s.goldFrac = (s.goldFrac || 0) + n * (opts.goldMult - 1); const extra = Math.floor(s.goldFrac); s.goldFrac -= extra; n += extra; }
        if (opts.perk.goldMul && Math.random() < (opts.perk.goldMul - 1) * 3) n += 1;
        s.gold += n;
        s.score = (s.score || 0) + 5 * n;
        s.coinStreak = s.t - (s.lastCoinT || -9) < 0.4 ? (s.coinStreak || 0) + 1 : 0;
        s.lastCoinT = s.t;
        CZ.audio.sfx('coin', s.coinStreak);
        opts.onGold(n);
        fillSled(1);
      } else if (c.kind === 'gem') {
        s.emeralds += 1;
        CZ.audio.sfx('win');
        CZ.audio.vibrate([20, 20, 40]);
        sparks(c.mesh.position, 8, '#5dff9a');
        opts.onEmerald(1);
      } else {
        if (c.kind === 'magnet') s.magnetT = R.magnetSec; else s.doubleT = R.doubleSec;
        CZ.audio.sfx('buy');
        CZ.audio.vibrate(30);
        opts.onPower(c.kind);
      }
    }

    // KIZAK ATAĞI: altın topladıkça dolar; dolunca düğmeye bas → kızakla öne fırla (dokunulmaz, altınları çeker).
    const SLED_LVL = opts.sledLvl || 1;
    const sledBtn = document.createElement('button');
    sledBtn.type = 'button';
    sledBtn.className = 'sled-btn';
    sledBtn.innerHTML = '<i></i><b></b><span>' + CZ.t('run.sled') + '</span>';
    sledBtn.querySelector('b').append(CZ.icon('sled'));
    host.append(sledBtn);
    sledBtn.addEventListener('pointerdown', e => { e.stopPropagation(); dash(); });
    function fillSled(n) {
      if (s.dashT > 0) return;
      s.sled = Math.min(1, s.sled + n * (1 + (opts.sledBoost || 0)) / Math.max(10, 30 - SLED_LVL * 4));
      drawSled();
    }
    function drawSled() {
      sledBtn.style.setProperty('--fill', s.sled);
      sledBtn.classList.toggle('ready', s.sled >= 1 && s.dashT <= 0);
      sledBtn.classList.toggle('on', s.dashT > 0);
    }
    function dash() {
      if (!s.running || s.sled < 1 || s.dashT > 0) return;
      s.sled = 0;
      s.dashT = 1.1 + SLED_LVL * 0.3;
      s.invT = Math.max(s.invT, s.dashT + 0.3);
      s.magnetT = Math.max(s.magnetT, s.dashT);
      s.shake = 0.2;
      CZ.audio.sfx('buy'); CZ.audio.vibrate([30, 20, 60]);
      drawSled();
      if (opts.onDash) opts.onDash(SLED_LVL);
    }
    function hitCrate(o) {
      if (o.dead) return;
      o.hp -= opts.dmg;
      o.hitFlash = 0.08;
      sparks(new THREE.Vector3(o.mesh.position.x, 0.7, o.mesh.position.z + 0.4), SHOT.glow ? 6 : 3, SHOT.trail);
      CZ.audio.sfx('hit');
      CZ.audio.vibrate(8);
      if (o.hp > 0) return;
      o.dead = true;
      o.passed = true;
      const pos = o.mesh.position.clone(); pos.y = 0.7;
      scene.remove(o.mesh);
      s.objs.splice(s.objs.indexOf(o), 1);
      const n = Math.round(o.def.gold * (s.doubleT > 0 ? 2 : 1) * (opts.perk.goldMul || 1));
      s.gold += n;
      s.crates += 1;
      sparks(pos, 7);
      CZ.audio.sfx('crack');
      CZ.audio.vibrate([30, 20, 40]);
      opts.onGold(n, true);
      opts.onCrate();
    }

    // Kovalamaca: silahını Zibo'ya at. İsabet: Zibo sendeler, yıldızlar uçuşur, bir an yavaşlar.
    function throwAt(hit, onHit) {
      const ball = new THREE.Sprite(ballMat.clone());
      ball.scale.set(SHOT.size * 1.3, SHOT.size * 1.3, 1);
      if (haloMat) { const hl = new THREE.Sprite(haloMat); hl.scale.set(2.2, 2.2, 1); ball.add(hl); }
      ball.position.set(s.px + 0.3, s.py + 1.1, -0.3);
      scene.add(ball);
      s.shots.push({ mesh: ball, target: hit ? { zibo: true, mesh: zibo, onHit } : null, life: hit ? 1.2 : 0.6 });
      s.throwPose = 0.2;
      CZ.audio.sfx('throw');
    }
    // Kaç isabette çuval tamamen boşalır: güçlü silah = daha az isabet.
    const hitsNeeded = () => Math.max(2, Math.ceil(12 / ((opts.dmg || 1) + (opts.power || 0) + 2)));
    function huntHit() {
      s.ziboHits += 1;
      const spill = 1;
      for (let i = 0; i < spill; i++) coin(Math.max(0, Math.min(LANES - 1, s.ziboLane + Math.floor(rand(-1, 2)))), zibo.position.z + 2 + i * 1.1, 0.55);
      if (opts.onZiboHit) opts.onZiboHit(s.ziboHits, hitsNeeded());
      if (s.ziboHits >= hitsNeeded()) {
        s.ziboHits = 0;
        s.ziboCaughtT = 3;
        s.ziboKick = 4;
        for (let i = 0; i < 3; i++) coin(s.ziboLane, zibo.position.z + 1 + i * 0.8, 0.55 + Math.sin(i) * 0.3);
        if (opts.onZiboCaught) opts.onZiboCaught();
      }
    }
    function ziboHit() {
      const p = zibo.position.clone(); p.y += 1.3;
      sparks(p, 10, '#ffe27a'); sparks(p, 6, '#ffffff');
      s.ziboForce = 'dizzy'; s.ziboHitT = 0.55; s.shake = 0.15; s.ziboKick = 2.6;
      CZ.audio.sfx('hit'); CZ.audio.vibrate([20, 30, 40]);
    }
    function dodged(o) {
      if (o.type === 'low' && s.py > 0.2) opts.onDodge();
      else if (o.type === 'high' && s.slideT > 0) opts.onDodge();
    }

    function crash(o) {
      if (CHASE) { s.invT = 1.1; s.shake = 0.35; s.laughT = 1.2; s.slideT = 0; s.stunT = 0.6; CZ.audio.sfx('wrong'); CZ.audio.vibrate([60, 40, 80]); opts.onCrash(); return; }
      s.hearts -= 1;
      s.invT = R.invulnSec;
      s.shake = 0.35;
      s.laughT = 1.2;
      s.slideT = 0;
      CZ.audio.sfx('wrong');
      CZ.audio.vibrate([60, 40, 80]);
      opts.onCrash(s.hearts);
      if (s.hearts <= 0) {
        s.running = false;
        s.dead = true;
        hero.setOpacity(1);
        setZiboFrame('laugh');
        setTimeout(() => { if (s.alive) opts.onEnd(summary()); }, 1100);
      }
    }

    function summary() {
      return { bestCombo: s.bestCombo || 0, nearMiss: s.nearMiss || 0, gold: s.gold, emeralds: s.emeralds, crates: s.crates, meters: Math.round(s.dist), seconds: Math.round(s.t), score: Math.round(s.score || 0) };
    }

    function onVis() { last = 0; }
    document.addEventListener('visibilitychange', onVis);

    raf = requestAnimationFrame(loop);

    return {
      ready,
      state: s,
      go() { s.running = true; last = 0; },
      move, jump, slide, shoot,
      stop() {
        s.running = false;
        s.bombs.forEach(b => scene.remove(b.sp));
        s.bombs = [];
        warns.forEach(w => { w.material.opacity = 0; });
      },
      // Kovalamaca API
      setZibo(lane, z) { s.ziboLane = lane; s.ziboZ = z; },
      ziboPose(p) { s.ziboForce = p || null; },
      ziboThrow() { s.ziboPose = 0.45; },
      bomb(lane, sec) {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: bombTex }));
        sp.scale.set(0.7, 0.7, 1);
        scene.add(sp);
        s.bombs.push({ lane, sp, t: 0, dur: sec, x0: zibo.position.x, y0: 1.2, z0: zibo.position.z });
      },
      hook(hit) { s.hookFx = 0.3; s.hookHit = hit; },
      throwAt, dash, petDash,
      hurt() { s.invT = 0.8; s.shake = 0.35; s.stunT = 0.6; },
      // Bu şeritte, sec saniye sonra oyuncunun hizasında hangi engel olacak?
      obstacleAt(lane, sec) {
        return s.objs.filter(o => o.lane === lane && !o.dead).map(o => ({ o, z: o.mesh.position.z + s.speed * sec }))
          .filter(x => x.z > -1.6 - x.o.len / 2 - 1.5 && x.z < 1.2 + x.o.len / 2 + 1.5).map(x => x.o.type);
      },
      airborne() { return s.py - (s.floor || 0) > 0.3 || s.invT > 0; },
      caught() { s.catching = 0.0001; s.ziboForce = 'dizzy'; s.running = false; s.objs.forEach(o => scene.remove(o.mesh)); s.objs = []; },
      setDead(v) { s.dead = v; },
      // Reklam/elmasla devam: önündeki engeller temizlenir, kısa süre dokunulmazsın.
      revive() {
        s.objs.slice().forEach(o => { if (o.mesh.position.z > -30) { scene.remove(o.mesh); s.objs.splice(s.objs.indexOf(o), 1); } });
        s.hearts = 1; s.dead = false; s.invT = 2.5; s.laughT = 0; s.ziboForce = null;
        s.running = true; last = 0;
      },
      summary,
      destroy() {
        s.alive = false;
        cancelAnimationFrame(raf);
        ro.disconnect();
        window.removeEventListener('keydown', onKey);
        document.removeEventListener('visibilitychange', onVis);
        scene.traverse(o => { if (o.geometry) o.geometry.dispose(); });
        Object.values(M).flat().forEach(m => { if (m && m.dispose) { if (m.map) m.map.dispose(); m.dispose(); } });
        renderer.dispose();
        renderer.forceContextLoss();
        renderer.domElement.remove();
        sledBtn.remove();
      }
    };
  }

  return { load: loadThree, start };
})();
