// Reklam: telefonda (APK) gerçek AdMob ödüllü reklamı; tarayıcıda ya da reklam yüklenemezse 3 sn'lik yedek ekran.
// Şimdilik Google'ın TEST kimlikleri kullanılıyor. AdMob hesabı açılınca yalnız CZ.ADS'teki kimlikler değişir.
CZ.ADS = {
  testing: true,
  appId: 'ca-app-pub-3940256099942544~3347511713',          // test (android.yml manifest'e yazar)
  rewarded: 'ca-app-pub-3940256099942544/5224354917',       // test ödüllü reklam
  interstitial: 'ca-app-pub-3940256099942544/1033173712',   // test geçiş reklamı
  interEvery: 3                                             // her 3 koşuda bir
};
CZ.ads = (function () {
  const plugin = () => window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform() && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob;
  let ready = null;
  function init() {
    const A = plugin();
    if (!A) return Promise.resolve(false);
    if (!ready) {
      // Çocuklara uygun: kişiselleştirilmemiş, G derecelendirmeli reklam.
      ready = A.initialize({ initializeForTesting: CZ.ADS.testing, tagForChildDirectedTreatment: true, tagForUnderAgeOfConsent: true, maxAdContentRating: 'General' })
        .then(() => true).catch(() => false);
    }
    return ready;
  }
  // Gerçek reklam: izlenip ödül hak edilince done() çağrılır. Kapatılırsa ödül yok.
  function show(done) {
    const A = plugin();
    if (!A) return fake(done);
    let busy = true;
    const veil = CZ.ui.h('div', { class: 'fake-ad' }, CZ.ui.h('p', { text: '…' }));
    (document.querySelector('.screen') || document.body).append(veil);
    init().then(ok => {
      if (!ok) throw new Error('init');
      return A.prepareRewardVideoAd({ adId: CZ.ADS.rewarded, isTesting: CZ.ADS.testing, npa: true });
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
  // Geçiş reklamı: ödülsüz, kapatılabilir. Her CZ.ADS.interEvery koşuda bir; ilk 2 günde hiç.
  function maybeInter(done) {
    const d = CZ.state.data;
    d.runsForAd = (d.runsForAd || 0) + 1;
    const fresh = (d.firstDay || CZ.state.today()) === CZ.state.today() || d.noAds;
    if (!d.firstDay) d.firstDay = CZ.state.today();
    CZ.state.save();
    if (fresh || d.runsForAd < CZ.ADS.interEvery) return done();
    d.runsForAd = 0; CZ.state.save();
    const A = plugin();
    if (!A) return done();
    init().then(ok => { if (!ok) throw 0; return A.prepareInterstitial({ adId: CZ.ADS.interstitial, isTesting: CZ.ADS.testing, npa: true }); })
      .then(() => A.showInterstitial()).then(() => done(), () => done());
  }
  return { show, init, maybeInter };
})();
