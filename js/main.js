// Açılış.
(function () {
  CZ.applyLanguage = function (code) {
    CZ.state.data.lang = code;
    CZ.state.save();
    CZ.i18n.set(code);
    // Arapça sağdan sola okunur.
    document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
    document.getElementById('rotate-note').textContent = CZ.t('rotate');
  };

  function preload() {
    const items = new Set(CZ.ROOMS.reduce((all, room) => all.concat(room.pool || CZ.ALL_ITEMS), []));
    const keys = [...items].map(id => 'item.' + id).concat(CZ.ROOMS.map(room => 'scene.' + room.scene)).concat(
      [ 'scene.town', 'scene.title', 'ui.hand', 'ui.emerald']);
    keys.forEach(key => { new Image().src = CZ.art(key); });
    CZ.game.preloadZibo();
  }

  const data = CZ.state.load();
  CZ.applyLanguage(data.lang || CZ.i18n.detect());
  CZ.ui.mount(document.getElementById('app'));
  CZ.game.ensureDiary();
  preload();

  // Ses tarayıcıda ancak ilk dokunuştan sonra açılabilir.
  document.addEventListener('pointerdown', CZ.audio.unlock, { passive: true });
  // Uzun basmada telefonun menü açmasını engeller.
  document.addEventListener('contextmenu', e => e.preventDefault());

  // Arka plana geçince animasyonları dondur: telefon ısınmasın, pil gitmesin.
  document.addEventListener('visibilitychange', () => {
    document.body.classList.toggle('paused', document.hidden);
    // Uygulamadan çıkarken bildirimleri evin son durumuna göre yeniden kur.
    if (document.hidden) CZ.notify.schedule();
  });

  if (CZ.charArt) CZ.charArt.warm();
  // Arkadaşın meydan okuma linkiyle geldiysen: ligine eklenir, merkezde haber verilir
  if (CZ.challenge) { const ch = CZ.challenge.read(); if (ch) { CZ.state.data.pendingChal = ch; CZ.state.save(); } }
  CZ.ui.go('title');
  CZ.notify.schedule();

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(err => console.warn('Çevrimdışı mod açılamadı.', err));
  }
})();
