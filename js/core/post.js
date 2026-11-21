// Sinematik son işlem: hafif bloom + renk ayarı (sıcak ışık / serin gölge) + vinyet.
// Ucuz: sahne 1 kez çizilir, bloom çeyrek çözünürlükte 2 bulanıklık geçişi. level 0 = kapalı (direkt render).
(function () {
  const T = () => window.THREE;
  const VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  const BRIGHT = `uniform sampler2D tex; uniform float thr; varying vec2 vUv;
    void main(){ vec3 c = texture2D(tex, vUv).rgb; float l = max(c.r, max(c.g, c.b));
      float s = max(l - thr, 0.0); s = s * s / (s + 0.08); gl_FragColor = vec4(c * (s / max(l, 1e-4)), 1.0); }`;
  const BLUR = `uniform sampler2D tex; uniform vec2 dir; varying vec2 vUv;
    void main(){ vec3 c = texture2D(tex, vUv).rgb * 0.227;
      c += (texture2D(tex, vUv + dir * 1.385).rgb + texture2D(tex, vUv - dir * 1.385).rgb) * 0.316;
      c += (texture2D(tex, vUv + dir * 3.231).rgb + texture2D(tex, vUv - dir * 3.231).rgb) * 0.070;
      gl_FragColor = vec4(c, 1.0); }`;
  const COMP = `uniform sampler2D tex; uniform sampler2D bloom; uniform float bStr, sat, con, vig, warm; uniform vec2 asp; varying vec2 vUv;
    void main(){ vec3 c = texture2D(tex, vUv).rgb + texture2D(bloom, vUv).rgb * bStr;
      float l = dot(c, vec3(0.299, 0.587, 0.114));
      c = mix(vec3(l), c, sat);
      c = (c - 0.5) * con + 0.5;
      c *= mix(vec3(1.0 - warm * 0.5, 1.0 - warm * 0.2, 1.0 + warm * 0.8), vec3(1.0 + warm * 0.6, 1.0 + warm * 0.15, 1.0 - warm * 0.6), smoothstep(0.15, 0.85, l));
      vec2 d = (vUv - 0.5) * asp; c *= 1.0 - vig * smoothstep(0.35, 0.95, dot(d, d) * 2.2);
      gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0); }`;

  function create(renderer, opt) {
    const THREE = T(); opt = Object.assign({ bloom: 0.55, thr: 0.82, sat: 1.12, con: 1.05, vig: 0.32, warm: 0.05 }, opt || {});
    const gl2 = renderer.capabilities.isWebGL2;
    const mk = (s) => new THREE.WebGLRenderTarget(4, 4, Object.assign({ minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false }, s || {}));
    const rtScene = mk({ depthBuffer: true, samples: gl2 && opt.msaa !== false ? 4 : 0 });
    const rtA = mk(), rtB = mk();
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    const fs = new THREE.Scene(); fs.add(quad); quad.frustumCulled = false;
    const sm = (frag, u) => new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: frag, uniforms: u, depthTest: false, depthWrite: false });
    const mBright = sm(BRIGHT, { tex: { value: null }, thr: { value: opt.thr } });
    const mBlur = sm(BLUR, { tex: { value: null }, dir: { value: new THREE.Vector2() } });
    const mComp = sm(COMP, { tex: { value: null }, bloom: { value: null }, bStr: { value: opt.bloom }, sat: { value: opt.sat }, con: { value: opt.con }, vig: { value: opt.vig }, warm: { value: opt.warm }, asp: { value: new THREE.Vector2(1, 1) } });
    let W = 4, H = 4;
    const P = {
      level: 2,    // 2 = tam, 1 = sadece renk/vinyet (bloom yok), 0 = kapalı
      u: mComp.uniforms,
      setSize(w, h) {
        const pr = renderer.getPixelRatio(); W = Math.max(4, Math.round(w * pr)); H = Math.max(4, Math.round(h * pr));
        rtScene.setSize(W, H); const bw = Math.max(4, W >> 2), bh = Math.max(4, H >> 2); rtA.setSize(bw, bh); rtB.setSize(bw, bh);
        mComp.uniforms.asp.value.set(w >= h ? w / h : 1, h > w ? h / w : 1);
      },
      render(scene, camera) {
        if (P.level <= 0) { renderer.setRenderTarget(null); renderer.render(scene, camera); return; }
        renderer.setRenderTarget(rtScene); renderer.render(scene, camera);
        const pass = (m, target) => { quad.material = m; renderer.setRenderTarget(target); renderer.render(fs, cam); };
        if (P.level >= 2) {
          mBright.uniforms.tex.value = rtScene.texture; pass(mBright, rtA);
          for (let i = 0; i < 2; i++) {
            mBlur.uniforms.tex.value = rtA.texture; mBlur.uniforms.dir.value.set((1 + i) / rtA.width, 0); pass(mBlur, rtB);
            mBlur.uniforms.tex.value = rtB.texture; mBlur.uniforms.dir.value.set(0, (1 + i) / rtA.height); pass(mBlur, rtA);
          }
          mComp.uniforms.bStr.value = opt.bloom;
        } else mComp.uniforms.bStr.value = 0;
        mComp.uniforms.tex.value = rtScene.texture; mComp.uniforms.bloom.value = rtA.texture;
        pass(mComp, null);
      },
      dispose() { [rtScene, rtA, rtB].forEach(r => r.dispose()); [mBright, mBlur, mComp].forEach(m => m.dispose()); quad.geometry.dispose(); }
    };
    create.last = P; return P;
  }
  window.CZ = window.CZ || {}; CZ.post = { create };
})();
