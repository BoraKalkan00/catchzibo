// Reklam: telefonda (APK) gerçek AdMob ödüllü reklamı; tarayıcıda ya da reklam yüklenemezse 3 sn'lik yedek ekran.
// Şimdilik Google'ın TEST kimlikleri kullanılıyor. AdMob hesabı açılınca yalnız CZ.ADS'teki kimlikler değişir.
CZ.ADS = {
  testing: true,
  appId: 'ca-app-pub-3940256099942544~3347511713',          // test (android.yml manifest'e yazar)
  rewarded: 'ca-app-pub-3940256099942544/5224354917',       // test ödüllü reklam
  interstitial: 'ca-app-pub-3940256099942544/1033173712',   // test geçiş reklamı
  interEvery: 2,
  interGapMs: 180000,                                       // iki geçiş reklamı arası en az 3 dk
  exitAds: false
};
// (22 Kas) PC/Steam sürümü: ücretli oyun → reklam yok (ödüller direkt verilir), gerçek para mağazası yok
CZ.PC = !!window.CZ_DESKTOP || /[?&]platform=pc\b/.test(location.search);
CZ.ads = (function () {
  const plugin = () => window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform() && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob;
  let ready = null;
  function init() {
    const A = plugin();
    if (!A) return Promise.resolve(false);
    if (!ready) {
      // (22 Kas) Hedef kitle 13+: çocuk etiketi yok (çocuk reklamları ~3-5 kat az kazandırır). AB/İngiltere'de önce Google'ın izin formu (UMP) sorulur,
      // kişiselleştirme kararını SDK izne göre kendisi verir. Reklam içeriği en fazla PG (aile dostu kalsın).
      ready = A.initialize({ initializeForTesting: CZ.ADS.testing, tagForChildDirectedTreatment: false, tagForUnderAgeOfConsent: false, maxAdContentRating: 'ParentalGuidance' })
        .then(() => consent(A)).then(() => true).catch(() => false);
    }
    return ready;
  }
  function consent(A) {
    if (!A.requestConsentInfo) return Promise.resolve();
    return A.requestConsentInfo().then(info => (info && info.status === 'REQUIRED' && info.isConsentFormAvailable && A.showConsentForm) ? A.showConsentForm() : null).catch(() => null);
  }
  // Ayarlardan izin formunu yeniden açmak için (GDPR: oyuncu kararını değiştirebilmeli)
  function privacy() { const A = plugin(); if (!A || !A.showConsentForm) return CZ.ui.toast(CZ.t('ad.privNA')); A.requestConsentInfo().then(() => A.showConsentForm()).catch(() => CZ.ui.toast(CZ.t('ad.privNA'))); }
  // Gerçek reklam: izlenip ödül hak edilince done() çağrılır. Kapatılırsa ödül yok.
  function show(done) {
    if (CZ.PC) { done(); return null; }
    const A = plugin();
    if (!A) return fake(done);
    let busy = true;
    const veil = CZ.ui.h('div', { class: 'fake-ad' }, CZ.ui.h('p', { text: '…' }));
    (document.querySelector('.screen') || document.body).append(veil);
    init().then(ok => {
      if (!ok) throw new Error('init');
      return A.prepareRewardVideoAd({ adId: CZ.ADS.rewarded, isTesting: CZ.ADS.testing, npa: false });
    }).then(() => A.showRewardVideoAd()).then(reward => {
      veil.remove(); busy = false;
      if (reward) done();
    }).catch(() => {
      veil.remove();
      if (busy) { busy = false; CZ.ui.toast(CZ.t('ad.none')); }
    });
    return null;
  }
  function fake(done) {
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
  // Geçiş reklamı: oyun bitince kendiliğinden (Subway Surfers gibi). Oyuncu basmaz.
  // Sıklık: her CZ.ADS.interEvery oyun sonunda bir; ilk 3 koşu hediye (yeni oyuncu kaçmasın).
  // Kapatma düğmesini Google yönetir (birkaç saniye sonra çıkar); bunu biz değiştiremeyiz.
  let lastInter = 0, played = false;
  // bir tur/koşu başladı
  function playing() { played = true; }
  // Oyundan çıkarken (tur bitti, menüye dönüldü) reklam kendiliğinden gelir.
  // Az önce oyun sonu reklamı çıktıysa (40 sn) tekrar göstermez; ilk 3 oyun hediye.
  function onExit() {
    const was = played;
    played = false;
    if (!CZ.ADS.exitAds || !was) return;   // kapalı: oyuncuyu bunaltmasın
    played = false;
    const d = CZ.state.data;
    if (d.noAds || (d.overs || 0) < 3 || Date.now() - lastInter < 40000) return;
    lastInter = Date.now();
    d.interShown = (d.interShown || 0) + 1;
    CZ.state.save();
    setTimeout(() => showInter(() => {}), 350);
  }
  function showInter(done) {
    const A = plugin();
    if (!A) return fakeInter(done);
    init().then(ok => { if (!ok) throw 0; return A.prepareInterstitial({ adId: CZ.ADS.interstitial, isTesting: CZ.ADS.testing, npa: false }); })
      .then(() => A.showInterstitial()).then(() => done(), () => done());
  }
  function gameOver(done) {
    done = done || (() => {});
    if (CZ.PC) return done();
    const d = CZ.state.data;
    if (d.noAds) return done();   // Reklamsız paketi alındı: zorunlu reklam yok
    d.overs = (d.overs || 0) + 1;
    CZ.state.save();
    if (d.noAds || d.overs <= 3 || Date.now() - lastInter < CZ.ADS.interGapMs || Date.now() - (d.lastInterAt || 0) < CZ.ADS.interGapMs) return done();
    d.lastInterAt = Date.now();
    d.interShown = (d.interShown || 0) + 1;
    lastInter = Date.now();
    CZ.state.save();
    showInter(done);
  }
  function fakeInter(done) {
    const { h, img } = CZ.ui;
    const t = CZ.t;
    let left = 5;
    const count = h('p', { text: t('ad.wait', { s: left }) });
    const box = h('div', { class: 'fake-ad inter' }, h('small', { text: t('ad.label') }), img('zibo.laugh', 'fake-ad-zibo'), h('h2', { text: t('title.name') }), count);
    (document.querySelector('.screen') || document.body).append(box);
    const timer = setInterval(() => {
      left -= 1;
      if (left > 0) { count.textContent = t('ad.wait', { s: left }); return; }
      clearInterval(timer); box.remove(); done();
    }, 1000);
  }
  return { show, init, gameOver, onExit, playing, privacy };
})();
