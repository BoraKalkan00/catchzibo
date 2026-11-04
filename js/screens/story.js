// Atlanabilir hikâye: 4 sahne, kendiliğinden ilerler, dokununca sonrakine geçer.
CZ.screens.story = (function () {
  const { h, img } = CZ.ui;
  const COUNT = 4;
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
      // Yeni sahne öncekinin üstüne süzülür, kamera yavaşça yaklaşır.
      const scene = h('div', { class: `story-scene shot-${index + 1}` }, img('story.' + (index + 1), 'story-img'));
      // Sahnelerde oyundaki 3D Zibo ve oyuncunun kendi karakteri
      const me = CZ.state.data.avatar || 'girl';
      if (index === 0) scene.append(img('avatar.' + me + '@wave', 'story-hero s1'));
      if (index === 1) scene.append(img('zibo.runLoot', 'story-zibo s2'));
      if (index === 2) scene.append(img('zibo.laugh', 'story-zibo s3'));
      if (index === 3) scene.append(img('zibo.smug', 'story-zibo s4'), img('avatar.' + me + '_run1', 'story-hero s4'));
      stage.append(scene);
      const old = stage.children;
      while (old.length > 2) old[0].remove();
      text.textContent = CZ.t('story.' + (index + 1));
      text.classList.remove('in');
      void text.offsetWidth;
      text.classList.add('in');
      bars.forEach((bar, i) => {
        bar.className = i < index ? 'done' : i === index ? 'now' : '';
        bar.firstChild.style.animationDuration = CZ.CONFIG.storySlideMs + 'ms';
      });
      CZ.audio.sfx('intro');
      if (index === 1) {
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
