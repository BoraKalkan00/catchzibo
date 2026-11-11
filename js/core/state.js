// İlerleme kaydı: telefonun yerel hafızasında (localStorage) durur.
CZ.state = (function () {
  const KEY = 'catchzibo.save.v1';
  const fresh = () => ({
    version: 1,
    lang: null,
    avatar: null,
    sound: true,
    music: true,
    vibration: true,
    emeralds: 0,
    storySeen: false,
    tutorialDone: false,
    rounds: {},      // roundId -> { found: 'YYYY-MM-DD', lockedUntil: 'YYYY-MM-DD' }
    decor: [],       // satın alınan köy süsleri
    diary: [],       // [{ date, index }]
    diaryRead: null,
    lastVisit: null,
    roomDoneSeen: false,
    dayOffset: 0,    // yalnızca test: "yarına geç"
    gold: 100,       // başlangıç altını: ilk dakikada bir şey alınabilsin. altın: kartopu savaşından, gündelik şeyler için
    weapons: ['snowball'],
    weapon: 'snowball',
    goldNextAt: 0,   // bir sonraki ücretsiz kartopu turunun zamanı (ms)
    goldBest: 0,
    cocoa: 0,        // sıcak kakao: sıradaki aramaya +süre
    chaseWins: 0,    // Zibo kaç kez yakalandı: kovalamaca zorlaşır
    xp: 0,
    level: 1,
    daily: { last: null, streak: 0 },
    notify: true     // günlük bildirim (Android)
  });

  let data = fresh();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) data = Object.assign(fresh(), JSON.parse(raw));
    } catch (e) {
      console.warn('Kayıt okunamadı, yeni oyun başlıyor.', e);
    }
    return data;
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Kayıt yazılamadı.', e);
    }
  }

  function reset() {
    const keep = { lang: data.lang };
    data = Object.assign(fresh(), keep);
    save();
  }

  function dateStr(offset) {
    const d = new Date();
    d.setDate(d.getDate() + data.dayOffset + (offset || 0));
    const p = n => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }
  const today = () => dateStr(0);
  const tomorrow = () => dateStr(1);

  function round(id) {
    return data.rounds[id] || {};
  }
  function isFound(id) {
    return !!round(id).found;
  }
  // Günlük deneme sınırı kaldırıldı: kaybeden oyuncu hemen, ücretsiz tekrar dener.
  function isResting() { return false; }
  function markFound(id, reward, stars, seconds) {
    const old = round(id);
    data.rounds[id] = {
      found: old.found || today(),
      stars: Math.max(old.stars || 0, stars || 0),
      best: old.best === undefined ? seconds : Math.min(old.best, seconds)
    };
    data.emeralds += reward;
    if (!old.found && !String(id).startsWith('d.')) data.newReturn = id;
    // Eski günlerin soygun kayıtlarını temizle (kayıt şişmesin).
    Object.keys(data.rounds).forEach(k => { if (k.startsWith('d.') && k.slice(2, 12) < today()) delete data.rounds[k]; });
    save();
    if (CZ.progress) CZ.progress.addXp(old.found ? CZ.PROGRESS.xp.replay : CZ.PROGRESS.xp.find);
    if (CZ.quests) { CZ.quests.track('find'); if (stars >= 3) CZ.quests.track('perfect'); }
  }
  function restUntilTomorrow(id) {
    data.rounds[id] = { lockedUntil: tomorrow() };
    save();
  }

  return {
    load, save, reset, today, tomorrow, round, isFound, isResting, markFound, restUntilTomorrow,
    get data() { return data; }
  };
})();
