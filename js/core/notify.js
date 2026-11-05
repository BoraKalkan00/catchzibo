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
  function messages() { return ['notif.stole2', 'notif.gift', 'notif.gold', 'notif.room', 'notif.rival2']; }
  const text = key => CZ.t(key);

  async function schedule() {
    const ln = plugin();
    if (!ln) return;
    try {
      await ln.cancel({ notifications: IDS.concat([JOB_ID]).map(id => ({ id })) });
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
