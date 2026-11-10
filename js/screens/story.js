// Atlanabilir hikâye: 4 sahne, kendiliğinden ilerler, dokununca sonrakine geçer.
CZ.screens.story = (function () {
  const { h, img } = CZ.ui;
  // 8 sahne. Yeni resim henüz yoksa "fb" resmine düşer (filtreyle farklılaştırılır).
  const SCENES = [
    { art: 'story.1', key: 'story.1', shot: 1, hero: 'wave', heroCls: 's1' },
    { art: 'story.fest', fb: 'story.1', fbCls: 'fb-fest', key: 'story.fest', shot: 5 },
    { art: 'story.2', key: 'story.2', shot: 2, zibo: 'zibo.runLoot', ziboCls: 's2', gib: true },
    { art: 'story.morning', fb: 'story.1', fbCls: 'fb-morning', key: 'story.morning', shot: 6, hero: 'front', heroCls: 's5' },
    { art: 'story.trail', fb: 'story.3', fbCls: 'fb-trail', key: 'story.trail', shot: 7 },
    { art: 'story.3', key: 'story.3', shot: 3, zibo: 'zibo.laugh', ziboCls: 's3' },
    { art: 'story.hall', fb: 'story.3', fbCls: 'fb-hall', key: 'story.hall', shot: 8, family: true },
    { art: 'story.4', key: 'story.4', shot: 4, zibo: 'zibo.smug', ziboCls: 's4', hero: 'back1', heroCls: 's4' }
  ];
  const COUNT = SCENES.length;
  let timer = null;

  function render(el, params) {
    let index = -1;
    const stage = h('div', { class: 'story-stage', onClick: () => show(index + 1) });
    const text = h('p', { class: 'story-text' });
    const bars = Array.from({ length: COUNT }, () => h('i', {}, h('b', {})));

    function finish() {
      clearTimeout(timer);
      CZ.state.data.storySeen = true;
      CZ.state.save();
      if (params.replay) CZ.ui.go('settings');
      else CZ.game.next();
    }

    function show(next) {
      if (next >= COUNT) return finish();
      index = next;
      const S = SCENES[index];
      const me = CZ.state.data.avatar || 'girl';
      const pic = img(S.art, 'story-img');
      const scene = h('div', { class: `story-scene shot-${S.shot}` }, pic);
      if (S.fb) pic.onerror = () => { pic.onerror = null; pic.src = CZ.art(S.fb); scene.classList.add(S.fbCls); };
      if (S.hero) scene.append(CZ.charArt.img(me, S.hero, 'story-hero ' + S.heroCls));
      if (S.zibo) scene.append(img(S.zibo, 'story-zibo ' + S.ziboCls));
      if (S.family) {
        // Zibo'nun ailesi: beş kuzen sırayla zıplayarak çıkar
        scene.append(h('div', { class: 'story-family' },
          ['zibo', 'buzbo', 'ucubo', 'patlabo', 'kralbo'].map((id, i) => h('figure', { class: 'fam fam-' + id, style: `animation-delay:${0.25 + i * 0.22}s` },
            img('zibo.smug', 'fam-img'),
            id === 'kralbo' ? h('i', { class: 'fam-crown' }) : null,
            h('figcaption', { text: id === 'zibo' ? 'Zibo' : CZ.t('boss.' + id) })))));
      }
      stage.append(scene);
      const old = stage.children;
      while (old.length > 2) old[0].remove();
      text.textContent = CZ.t(S.key);
      text.classList.remove('in');
      void text.offsetWidth;
      text.classList.add('in');
      bars.forEach((bar, i) => {
        bar.className = i < index ? 'done' : i === index ? 'now' : '';
        bar.firstChild.style.animationDuration = CZ.CONFIG.storySlideMs + 'ms';
      });
      CZ.audio.sfx('intro');
      if (S.gib) {
        CZ.audio.speak(CZ.game.gibberish('zibo.catch'));
        CZ.audio.vibrate(30);
      }
      clearTimeout(timer);
      timer = setTimeout(() => show(index + 1), CZ.CONFIG.storySlideMs);
    }

    el.append(
      stage,
      h('div', { class: 'story-bars' }, bars),
      CZ.ui.btn(CZ.t('story.skip'), finish, 'small story-skip'),
      text);
    show(0);
  }

  return { render, leave: () => clearTimeout(timer) };
})();
