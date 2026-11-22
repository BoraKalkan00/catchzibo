// Günlük bildirim (yalnız Android uygulamasında). Sunucu yok: bildirimleri telefon kendisi zamanlar.
// Kural: günde en fazla 1, akşam 19:00. Oyunu o gün açtıysan o günün bildirimi gitmez
// (her açılışta yeniden kurulur ve yarından başlar). 3 gün üst üste açmazsan susar.
CZ.notify = (function () {
  const HOUR = 19;
  const DAYS = 3;
  const IDS = [101, 102, 103];
  const JOB_ID = 110;

  function plugin() {
    const cap = window.Capacitor;
    if (!cap || !cap.isNativePlatform || !cap.isNativePlatform()) return null;
    if (cap.Plugins && cap.Plugins.LocalNotifications) return cap.Plugins.LocalNotifications;
    return cap.registerPlugin ? cap.registerPlugin('LocalNotifications') : null;
  }
  const available = () => !!plugin();

  // Evin durumuna göre Zibo'nun mesajları. Her gün farklısı seçilir.
  // Zibo'nun günlük mesajları (ev sistemi kaldırıldı).
  function messages() { return ['notif.v1', 'notif.v2', 'notif.v3', 'notif.v4', 'notif.v5']; }   // (22 Kas) köy oyununa uygun (eski Altın Avı/oda mesajları kaldırıldı)
  const text = key => CZ.t(key);

  async function schedule() {
    const ln = plugin();
    if (!ln) return;
    try {
      await ln.cancel({ notifications: IDS.concat([JOB_ID, JOB_ID + 1]).map(id => ({ id })) });
      if (CZ.state.data.notify === false) return;
      const perm = await ln.checkPermissions();
      if (perm.display !== 'granted') return;
      const pool = messages();
      const start = Math.floor(Math.random() * pool.length);
      const notifications = IDS.slice(0, DAYS).map((id, i) => {
        const at = new Date();
        at.setDate(at.getDate() + i + 1);
        at.setHours(HOUR, Math.floor(Math.random() * 20), 0, 0);
        return { id, title: CZ.t('notif.title'), body: text(pool[(start + i) % pool.length]), schedule: { at, allowWhileIdle: true } };
      });
      // İnşaat bitince haber ver (köy binası ya da vadideki kule/çit)
      const d = CZ.state.data; let soon = 0;
      if (d.vil && d.vil.job) soon = d.vil.job.end;
      const def = d.vil && d.vil.def;
      if (def) ['t', 'f'].forEach(k => (def[k] || []).forEach(it => { if (it && it.job && (!soon || it.job.end < soon)) soon = it.job.end; }));
      // depolar dolunca (çevrimdışı gelir 12 saatte dolar) haber ver
      if (CZ.village && CZ.village.lv && (CZ.village.lv('mine') || CZ.village.lv('goldmine') || CZ.village.lv('bakery'))) notifications.push({ id: JOB_ID + 1, title: CZ.t('notif.title'), body: CZ.t('notif.full'), schedule: { at: new Date(Date.now() + 12 * 3600000), allowWhileIdle: true } });
      if (soon > Date.now() + 60000) notifications.push({ id: JOB_ID, title: CZ.t('notif.title'), body: CZ.t('notif.built'), schedule: { at: new Date(soon), allowWhileIdle: true } });
      await ln.schedule({ notifications });
    } catch (e) {
      console.warn('Bildirim kurulamadı.', e);
    }
  }

  // İzin bir kez, oyuncu oyunu biraz tanıdıktan sonra istenir.
  async function askOnce() {
    const ln = plugin();
    const d = CZ.state.data;
    if (!ln || d.notifyAsked) return;
    d.notifyAsked = true;
    CZ.state.save();
    try {
      const perm = await ln.requestPermissions();
      if (perm.display === 'granted') schedule();
    } catch (e) { /* izin verilmedi */ }
  }

  async function test() {
    const ln = plugin();
    if (!ln) return false;
    try {
      const perm = await ln.requestPermissions();
      if (perm.display !== 'granted') return false;
      await ln.schedule({ notifications: [{ id: 199, title: CZ.t('notif.title'), body: text(messages()[0]), schedule: { at: new Date(Date.now() + 5000) } }] });
      return true;
    } catch (e) { return false; }
  }

  return { available, schedule, askOnce, test };
})();
