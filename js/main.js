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
    // (22 Kas) eski gizli-nesne oyununun yüzlerce eşya/oda görseli açılışta iniyordu (~5 MB, yavaş açılış) → kaldırıldı
    ['ui.emerald'].forEach(key => { new Image().src = CZ.art(key); });
  }

  const data = CZ.state.load();
  CZ.applyLanguage(data.lang || CZ.i18n.detect());
  // Yatay / dikey ekran. Ayarlanmamışsa: dokunmatik olmayan geniş ekranda (bilgisayar) yatay.
  CZ.orient = {
    on() { const v = CZ.state.data.landscape; if (v === true || v === false) return v; return !('ontouchstart' in window) && window.innerWidth > window.innerHeight; },
    apply() {
      const on = CZ.orient.on(); document.body.classList.toggle('wide', on);
      const SO = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform() && window.Capacitor.Plugins && window.Capacitor.Plugins.ScreenOrientation;
      try { if (SO) SO.lock({ orientation: on ? 'landscape' : 'portrait' }).catch(() => {}); else if (screen.orientation && screen.orientation.lock && 'ontouchstart' in window) screen.orientation.lock(on ? 'landscape' : 'portrait').catch(() => {}); } catch (e) { /* desteklenmiyor */ }
      setTimeout(() => window.dispatchEvent(new Event('resize')), 300);
    }
  };
  CZ.orient.apply();
  CZ.ui.mount(document.getElementById('app'));
  CZ.game.ensureDiary();
  preload();

  // Ses tarayıcıda ancak ilk dokunuştan sonra açılabilir.
  document.addEventListener('pointerdown', CZ.audio.unlock, { passive: true });
  // Android geri tuşu: oyundaysan durdurur; menüdeyken bir önceki ekrana döner;
  // merkezde / açılışta "Oyundan çıkmak istiyor musun?" diye sorar (kazara çıkış olmasın).
  const capApp = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
  if (capApp && capApp.addListener) capApp.addListener('backButton', () => {
    const up = document.querySelector('.upg-wrap'); if (up) { const c = up.querySelector('.upg-close'); if (c) c.click(); else up.click(); return; }   // (23 Kas) bina kartı: kapat (V.paused geri gelsin)
    if (document.querySelector('.modal-wrap, .confirm-wrap')) { const m = document.querySelectorAll('.modal-wrap, .confirm-wrap'); const top = m[m.length - 1]; if ((top.classList.contains('pause-menu') || top.querySelector('.pause-menu')) && CZ.ui.current === 'valley') { CZ.ui.confirmBox(CZ.t('exit.ask'), CZ.t('exit.yes'), CZ.t('common.no'), () => { CZ.state.save(); capApp.exitApp(); }, 'danger'); return; } top.remove(); return; }
    const name = CZ.ui.current;
    const scr = CZ.screens[name];
    if (scr && scr.onBack && scr.onBack()) return;
    if (name === 'hub' || name === 'title') {
      CZ.ui.confirmBox(CZ.t('exit.ask'), CZ.t('exit.yes'), CZ.t('common.no'), () => capApp.exitApp(), 'danger');
    } else if (name === 'valley') {   // (23 Kas) köyden eski menüye gitmek yerine: önce duraklat, sonra çıkış sor
      const V = CZ.screens.valley.debug; if (V && V.paused && !document.querySelector('.pause-menu') && !V.cine) { V.paused = false; V.last = 0; return; }   // kapanan pencere oyunu donuk bırakmasın
      if (V && !V.paused && V.pause) { V.pause(); return; }
      CZ.ui.confirmBox(CZ.t('exit.ask'), CZ.t('exit.yes'), CZ.t('common.no'), () => { CZ.state.save(); capApp.exitApp(); }, 'danger');
    } else if (name === 'chase' || name === 'play') {
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
  if (CZ.PC) document.body.classList.add('pc');
  CZ.ui.go('valley');   // (22 Kas) başlık ekranı atlandı: açılış = ikon → yükleme (yeni sahneler) → oyun
  CZ.notify.schedule();

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(err => console.warn('Çevrimdışı mod açılamadı.', err));
  }
})();

// Açılış (yükleme) ekranı: oyun hazır olunca yumuşakça kaybolur.
(function () { const sp = document.getElementById('splash'); if (sp) setTimeout(() => { sp.classList.add('out'); setTimeout(() => sp.remove(), 450); }, 700); })();

// PC: daha önce açılmış başarımları Steam'e de bildir (Steam sonradan bağlandıysa)
setTimeout(() => { try { if (window.CZ_DESKTOP && CZ.achv) CZ.achv.sync(); } catch (e) { /* */ } }, 4000);
