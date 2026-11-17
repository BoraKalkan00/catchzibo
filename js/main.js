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
  // Android geri tuşu: oyundaysan durdurur; menüdeyken bir önceki ekrana döner;
  // merkezde / açılışta "Oyundan çıkmak istiyor musun?" diye sorar (kazara çıkış olmasın).
  const capApp = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
  if (capApp && capApp.addListener) capApp.addListener('backButton', () => {
    if (document.querySelector('.modal-wrap, .confirm-wrap')) { const m = document.querySelectorAll('.modal-wrap, .confirm-wrap'); m[m.length - 1].remove(); return; }
    const name = CZ.ui.current;
    const scr = CZ.screens[name];
    if (scr && scr.onBack && scr.onBack()) return;
    if (name === 'hub' || name === 'title') {
      CZ.ui.confirmBox(CZ.t('exit.ask'), CZ.t('exit.yes'), CZ.t('common.no'), () => capApp.exitApp(), 'danger');
    } else if (name === 'chase' || name === 'play' || name === 'gold') {
      CZ.ui.confirmBox(CZ.t('pause.quitAsk'), CZ.t('pause.quit'), CZ.t('common.no'), () => CZ.ui.go('hub'), 'danger');
    } else CZ.ui.go('hub');
  });

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

// Açılış (yükleme) ekranı: oyun hazır olunca yumuşakça kaybolur.
(function () { const sp = document.getElementById('splash'); if (sp) setTimeout(() => { sp.classList.add('out'); setTimeout(() => sp.remove(), 450); }, 700); })();
