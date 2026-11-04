// Reklam: şimdilik 3 saniyelik sahte reklam. AdMob eklenince yalnız show() değişir.
CZ.ads = (function () {
  function show(done) {
    const { h, img } = CZ.ui;
    const t = CZ.t;
    let left = 3;
    const count = h('p', { text: t('ad.wait', { s: left }) });
    const box = h('div', { class: 'fake-ad' },
      h('small', { text: t('ad.label') }),
      img('zibo.laugh', 'fake-ad-zibo'),
      h('h2', { text: t('title.name') }),
      h('p', { text: t('ad.fake') }),
      count);
    (document.querySelector('.screen') || document.body).append(box);
    const timer = setInterval(() => {
      left -= 1;
      if (left > 0) { count.textContent = t('ad.wait', { s: left }); return; }
      clearInterval(timer);
      box.remove();
      done();
    }, 1000);
    return timer;
  }
  return { show };
})();
