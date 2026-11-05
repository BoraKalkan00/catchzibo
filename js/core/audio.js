// Ses dosyası yok: müzik, goblin dili ve efektler Web Audio ile anlık üretilir.
// Besteler kamu malı: Deck the Halls (menü), Carol of the Bells'ten esinli motif (oyun).
CZ.audio = (function () {
  let ctx = null;
  let master = null;
  let musicBus = null;
  let analyser = null;
  let noiseBuffer = null;

  function unlock() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createDynamicsCompressor();
      analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      master.connect(analyser);
      analyser.connect(ctx.destination);
      musicBus = ctx.createGain();
      musicBus.gain.value = 0.55;
      musicBus.connect(master);
      noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      startSong();
    }
    if (ctx.state === 'suspended' && !document.hidden) ctx.resume();
  }

  const ready = () => ctx && ctx.state === 'running';
  const enabled = () => CZ.state.data.sound && ready();
  const midi = n => 440 * Math.pow(2, (n - 69) / 12);

  function tone(freq, start, dur, opts) {
    const o = Object.assign({ type: 'sine', gain: 0.15, to: null, out: master, attack: 0.012 }, opts);
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = o.type;
    osc.frequency.setValueAtTime(freq, start);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, start + dur);
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(o.gain, start + o.attack);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(amp);
    amp.connect(o.out);
    osc.start(start);
    osc.stop(start + dur + 0.02);
    return { osc, amp };
  }

  function noise(start, dur, opts) {
    const o = Object.assign({ gain: 0.15, freq: 1500, q: 1, type: 'bandpass', to: null, out: master }, opts);
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = o.type;
    filter.frequency.setValueAtTime(o.freq, start);
    if (o.to) filter.frequency.exponentialRampToValueAtTime(o.to, start + dur);
    filter.Q.value = o.q;
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(o.gain, start + 0.01);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.connect(filter);
    filter.connect(amp);
    amp.connect(o.out);
    src.start(start, Math.random() * 0.5);
    src.stop(start + dur + 0.02);
  }

  /* ---------- Goblin dili ---------- */
  // Heceler ünlüye göre ağız şekli (formant) alır: gerçek dil gibi ama anlamsız.
  const VOWELS = { a: [820, 1250], e: [520, 1900], i: [320, 2400], o: [520, 950], u: [360, 820] };

  function speak(text) {
    if (!enabled()) return;
    duck(0.25, 1.1);
    const syllables = String(text).toLowerCase().match(/[^\s!?.,…-]{1,4}/g) || [];
    const excited = /!/.test(text);
    let time = ctx.currentTime + 0.02;
    const base = 300 + Math.random() * 90;
    syllables.slice(0, 9).forEach((syl, i) => {
      const vowel = (syl.match(/[aeiou]/) || ['e'])[0];
      const [f1, f2] = VOWELS[vowel];
      const dur = 0.09 + syl.length * 0.018;
      const pitch = base * (1 + (syl.charCodeAt(0) % 5) * 0.09) * (excited && i === syllables.length - 1 ? 1.35 : 1);
      const osc = ctx.createOscillator();
      const vibrato = ctx.createOscillator();
      const vibratoAmount = ctx.createGain();
      const amp = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(pitch * 0.85, time);
      osc.frequency.exponentialRampToValueAtTime(pitch * 1.18, time + dur * 0.35);
      osc.frequency.exponentialRampToValueAtTime(pitch * 0.92, time + dur);
      vibrato.frequency.value = 28;
      vibratoAmount.gain.value = pitch * 0.05;
      vibrato.connect(vibratoAmount);
      vibratoAmount.connect(osc.frequency);
      [[f1, 0.7], [f2, 0.45]].forEach(([freq, level]) => {
        const band = ctx.createBiquadFilter();
        const bandGain = ctx.createGain();
        band.type = 'bandpass';
        band.frequency.value = freq;
        band.Q.value = 7;
        bandGain.gain.value = level;
        osc.connect(band);
        band.connect(bandGain);
        bandGain.connect(amp);
      });
      amp.gain.setValueAtTime(0.0001, time);
      amp.gain.exponentialRampToValueAtTime(0.9, time + 0.018);
      amp.gain.setValueAtTime(0.9, time + dur * 0.6);
      amp.gain.exponentialRampToValueAtTime(0.0001, time + dur);
      amp.connect(master);
      osc.start(time);
      vibrato.start(time);
      osc.stop(time + dur + 0.02);
      vibrato.stop(time + dur + 0.02);
      time += dur + 0.03;
    });
  }

  /* ---------- Efektler ---------- */
  // Art arda kaldırdıkça nota yükselir: oyuncuyu hızlanmaya çeker.
  const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
  const SFX = {
    lift: (t, step = 0) => {
      const note = 72 + PENTA[Math.min(step, PENTA.length - 1)];
      noise(t, 0.16, { gain: 0.1, freq: 900, to: 3800, q: 0.8 });
      tone(midi(note), t, 0.16, { type: 'triangle', gain: 0.1, to: midi(note) * 1.06 });
    },
    drop: t => {
      for (let i = 0; i < 5; i++) noise(t + i * 0.05, 0.06, { gain: 0.1, freq: 500 + i * 180, q: 1 });
      tone(120, t + 0.25, 0.14, { gain: 0.14, to: 70 });
    },
    intro: t => {
      noise(t, 0.28, { gain: 0.07, freq: 500, to: 4000, q: 0.6 });
      tone(midi(79), t + 0.04, 0.3, { type: 'triangle', gain: 0.08 });
      tone(midi(84), t + 0.14, 0.4, { type: 'triangle', gain: 0.08 });
    },
    tick: t => tone(1300, t, 0.035, { type: 'square', gain: 0.035, attack: 0.002 }),
    heart: t => {
      tone(70, t, 0.12, { gain: 0.3, to: 50 });
      tone(62, t + 0.17, 0.14, { gain: 0.22, to: 44 });
    },
    button: t => tone(620, t, 0.07, { type: 'triangle', gain: 0.1, to: 880 }),
    poke: t => tone(260, t, 0.22, { type: 'triangle', gain: 0.16, to: 720 }),
    wrong: t => {
      tone(180, t, 0.3, { type: 'sawtooth', gain: 0.08, to: 90 });
      noise(t, 0.15, { gain: 0.14, freq: 400, q: 0.7 });
    },
    // Hüzünlü trombon: "vah vah vaaah"
    lose: t => {
      [[62, 0, 0.26], [61, 0.28, 0.26], [60, 0.56, 0.26], [59, 0.84, 0.7]].forEach(([n, at, d]) => {
        const f = midi(n - 12);
        const o = tone(f, t + at, d, { type: 'sawtooth', gain: 0.1, to: at > 0.8 ? f * 0.92 : null });
        const lfo = ctx.createOscillator();
        const lfoAmount = ctx.createGain();
        lfo.frequency.value = at > 0.8 ? 7 : 0.1;
        lfoAmount.gain.value = at > 0.8 ? 5 : 0;
        lfo.connect(lfoAmount);
        lfoAmount.connect(o.osc.frequency);
        lfo.start(t + at);
        lfo.stop(t + at + d);
      });
    },
    // Buluş: önce gümbürtü, sonra çan zinciri.
    win: t => {
      tone(110, t, 0.35, { gain: 0.3, to: 45 });
      noise(t, 0.3, { gain: 0.2, freq: 1800, to: 300, q: 0.5 });
      [72, 76, 79, 84, 88, 91].forEach((n, i) => {
        const at = t + 0.12 + i * 0.075;
        tone(midi(n), at, 0.7, { gain: 0.1 });
        tone(midi(n) * 4, at, 0.25, { gain: 0.025 });
      });
      [60, 67, 72, 76].forEach(n => tone(midi(n), t + 0.6, 1.1, { type: 'triangle', gain: 0.06, attack: 0.03 }));
    },
    coin: (t, step = 0) => {
      const n = 84 + PENTA[Math.min(step, PENTA.length - 1)];
      tone(midi(n), t, 0.1, { type: 'square', gain: 0.03, attack: 0.002 });
      tone(midi(n + 7), t + 0.05, 0.2, { gain: 0.07 });
    },
    // İnşa: üç çekiç vuruşu ve küçük bir ding.
    build: t => {
      [0, 0.13, 0.26].forEach(at => { noise(t + at, 0.06, { gain: 0.18, freq: 900, q: 1.2 }); tone(150, t + at, 0.06, { gain: 0.16, to: 80 }); });
      tone(midi(84), t + 0.42, 0.4, { gain: 0.08 });
      tone(midi(91), t + 0.5, 0.5, { gain: 0.06 });
    },
    buy: t => [67, 72, 76, 79].forEach((n, i) => tone(midi(n), t + i * 0.06, 0.3, { gain: 0.09 })),
    // Kartopu savaşı
    throw: t => noise(t, 0.12, { gain: 0.06, freq: 1800, to: 600, q: 0.7 }),
    // Koşu sesleri: karda ayak sesi, zıplama, kayma, iniş, şerit değiştirme
    step: (t, side = 0) => noise(t, 0.07, { gain: 0.035, freq: side ? 900 : 750, to: 300, q: 0.8, type: 'lowpass' }),
    jump: t => { noise(t, 0.18, { gain: 0.07, freq: 500, to: 2600, q: 0.6 }); tone(330, t, 0.16, { gain: 0.05, to: 660, type: 'triangle' }); },
    slide: t => noise(t, 0.32, { gain: 0.09, freq: 2600, to: 400, q: 0.5 }),
    land: t => { noise(t, 0.09, { gain: 0.09, freq: 600, to: 200, q: 0.7, type: 'lowpass' }); tone(110, t, 0.08, { gain: 0.08, to: 70 }); },
    swish: t => noise(t, 0.1, { gain: 0.05, freq: 1400, to: 3000, q: 0.9 }),
    hit: t => {
      noise(t, 0.08, { gain: 0.16, freq: 700, to: 300, q: 0.9 });
      tone(160, t, 0.08, { gain: 0.12, to: 90 });
    },
    crack: t => {
      noise(t, 0.25, { gain: 0.2, freq: 1400, to: 250, q: 0.6 });
      tone(110, t, 0.2, { gain: 0.22, to: 50 });
      [84, 88, 91, 96].forEach((n, i) => tone(midi(n), t + 0.08 + i * 0.05, 0.18, { type: 'square', gain: 0.03 }));
    }
  };

  function sfx(name, step) {
    if (enabled() && SFX[name]) SFX[name](ctx.currentTime + 0.005, step);
  }

  // Uzun basarken yükselen ses. Geri dönen fonksiyon sesi keser (kısa dokunuş ya da iptal).
  function charge(ms) {
    if (!enabled()) return () => {};
    const t = ctx.currentTime + 0.07;
    const { osc, amp } = tone(300, t, ms / 1000 + 0.05, { type: 'triangle', gain: 0.11, to: 1150, attack: 0.1 });
    return () => {
      const now = ctx.currentTime;
      amp.gain.cancelScheduledValues(now);
      amp.gain.setValueAtTime(0.0001, now);
      try { osc.stop(now + 0.01); } catch (e) { /* zaten durmuş */ }
    };
  }

  /* ---------- Müzik ---------- */
  const q = 1;
  const DECK = {
    bpm: 112,
    bell: true,
    gain: 0.1,
    melody: [
      [74, 1.5], [72, 0.5], [71, q], [69, q], [67, q], [69, q], [71, q], [67, q],
      [69, 0.5], [71, 0.5], [72, 0.5], [69, 0.5], [71, 1.5], [69, 0.5], [67, q], [66, q], [67, 2],
      [74, 1.5], [72, 0.5], [71, q], [69, q], [67, q], [69, q], [71, q], [67, q],
      [69, 0.5], [71, 0.5], [72, 0.5], [69, 0.5], [71, 1.5], [69, 0.5], [67, q], [66, q], [67, 2],
      [69, 1.5], [71, 0.5], [72, q], [69, q], [71, 1.5], [72, 0.5], [74, q], [69, q],
      [71, 0.5], [73, 0.5], [74, q], [76, 0.5], [78, 0.5], [79, q], [78, q], [76, q], [74, 2],
      [74, 1.5], [72, 0.5], [71, q], [69, q], [67, q], [69, q], [71, q], [67, q],
      [76, 0.5], [76, 0.5], [76, 0.5], [76, 0.5], [74, 1.5], [72, 0.5], [71, q], [69, q], [67, 2]
    ],
    // Her ölçüye bir kök nota (4 vuruş)
    bass: [43, 43, 38, 43, 43, 43, 38, 43, 38, 43, 45, 38, 43, 43, 48, 43, 43, 43],
    bassEvery: 4
  };
  const motif = up => [[70 + up, q], [69 + up, 0.5], [70 + up, 0.5], [67 + up, q]];
  const CAROL = {
    bpm: 150,
    bell: false,
    gain: 0.09,
    melody: [].concat(
      motif(0), motif(0), motif(0), motif(0),
      motif(12), motif(12), motif(12), motif(12),
      [[79, q], [77, q], [75, q], [74, q], [72, q], [70, q], [69, q], [70, q], [72, q], [74, 3]],
      motif(0), motif(0), motif(12), motif(0)
    ),
    bass: [43, 43, 43, 39, 43, 43, 43, 39, 39, 41, 34, 38, 43, 43, 39, 43],
    bassEvery: 3
  };
  // Altın Avı: hızlı, neşeli (Jingle Bells, 1857, kamu malı)
  const h2 = 0.5;
  const JINGLE = {
    bpm: 168,
    bell: true,
    gain: 0.085,
    melody: [
      [76, 1], [76, 1], [76, 2], [76, 1], [76, 1], [76, 2], [76, 1], [79, 1], [72, 1.5], [74, h2], [76, 4],
      [77, 1], [77, 1], [77, 1.5], [77, h2], [77, 1], [76, 1], [76, 1], [76, h2], [76, h2], [76, 1], [74, 1], [74, 1], [76, 1], [74, 2], [79, 2],
      [76, 1], [76, 1], [76, 2], [76, 1], [76, 1], [76, 2], [76, 1], [79, 1], [72, 1.5], [74, h2], [76, 4],
      [77, 1], [77, 1], [77, 1.5], [77, h2], [77, 1], [76, 1], [76, 1], [76, h2], [76, h2], [79, 1], [79, 1], [77, 1], [74, 1], [72, 4]
    ],
    bass: [48, 55, 48, 55, 48, 55, 48, 55, 53, 57, 48, 55, 50, 55, 43, 47, 48, 55, 48, 55, 48, 55, 48, 55, 53, 57, 48, 55, 43, 47, 48, 48],
    bassEvery: 2
  };
  // Ev, mahalle, gardırop: sıcak ve sakin (We Wish You a Merry Christmas, geleneksel, kamu malı)
  const WISH = {
    bpm: 132,
    bell: false,
    gain: 0.08,
    melody: [
      [74, 1], [79, 1], [79, h2], [81, h2], [79, h2], [78, h2], [76, 1], [76, 1], [76, 1],
      [81, 1], [81, h2], [83, h2], [81, h2], [79, h2], [78, 1], [74, 1], [74, 1],
      [83, 1], [83, h2], [84, h2], [83, h2], [81, h2], [79, 1], [76, 1], [74, h2], [74, h2],
      [76, 1], [81, 1], [78, 1], [79, 3]
    ],
    bass: [43, 43, 48, 45, 50, 50, 40, 48, 50, 43, 43],
    bassEvery: 3
  };
  const SONGS = { menu: DECK, play: CAROL, gold: JINGLE, home: WISH };

  let song = null;
  let songName = null;
  let tempo = 1;
  let noteIndex = 0;
  let bassIndex = 0;
  let nextNote = 0;
  let nextBass = 0;
  let bellBeat = 0;
  let nextBell = 0;
  let scheduler = null;

  function startSong() {
    clearInterval(scheduler);
    scheduler = null;
    song = SONGS[songName] || null;
    if (!song || !ctx) return;
    noteIndex = 0;
    bassIndex = 0;
    bellBeat = 0;
    nextNote = nextBass = nextBell = ctx.currentTime + 0.12;
    scheduler = setInterval(schedule, 90);
  }

  function schedule() {
    if (!ready() || !CZ.state.data.music || !song) {
      if (ready()) nextNote = nextBass = nextBell = ctx.currentTime + 0.1;
      return;
    }
    const beat = 60 / (song.bpm * tempo);
    const horizon = ctx.currentTime + 0.28;
    while (nextNote < horizon) {
      const [n, len] = song.melody[noteIndex];
      const f = midi(n);
      tone(f, nextNote, 1.1, { gain: song.gain, out: musicBus, attack: 0.004 });
      tone(f * 4, nextNote, 0.22, { gain: song.gain * 0.22, out: musicBus, attack: 0.002 });
      nextNote += len * beat;
      noteIndex = (noteIndex + 1) % song.melody.length;
    }
    while (nextBass < horizon) {
      tone(midi(song.bass[bassIndex]), nextBass, 0.34, { type: 'triangle', gain: song.gain * 1.4, out: musicBus, attack: 0.006 });
      nextBass += song.bassEvery * beat;
      bassIndex = (bassIndex + 1) % song.bass.length;
    }
    if (song.bell) {
      while (nextBell < horizon) {
        noise(nextBell, 0.06, { gain: bellBeat % 2 ? 0.035 : 0.015, freq: 7500, q: 3, out: musicBus });
        nextBell += beat * 0.5;
        bellBeat += 1;
      }
    }
  }

  function music(name) {
    if (name === songName) return;
    songName = name;
    tempo = 1;
    startSong();
  }

  // Zibo konuşurken müzik kısılır, sonra geri gelir.
  function duck(level, seconds) {
    if (!ready()) return;
    const now = ctx.currentTime;
    musicBus.gain.cancelScheduledValues(now);
    musicBus.gain.setTargetAtTime(level, now, 0.04);
    musicBus.gain.setTargetAtTime(0.55, now + seconds, 0.25);
  }

  function vibrate(pattern) {
    if (!CZ.state.data.vibration || !navigator.vibrate) return;
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
    navigator.vibrate(pattern);
  }

  // Telefon cebe girince ya da uygulamadan çıkınca ses tamamen dursun.
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend();
    else ctx.resume();
  });

  // Test için: o anki ses seviyesi.
  function level() {
    if (!analyser) return null;
    const buf = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buf);
    let peak = 0;
    let sum = 0;
    buf.forEach(v => { peak = Math.max(peak, Math.abs(v)); sum += v * v; });
    return { peak, rms: Math.sqrt(sum / buf.length), state: ctx.state };
  }

  return { unlock, speak, sfx, charge, music, duck, vibrate, level, setTempo: m => { tempo = m; }, get song() { return songName; } };
})();
