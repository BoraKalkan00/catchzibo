// İnternetsiz çalışma. Önce ağı dener (yeni görseller hemen görünsün), ağ yoksa hafızadan verir.
importScripts('sw-files.js');
const CACHE = 'catchzibo-v80';

// İlk açılışta yalnız oyunun çekirdeği (kod, yazı tipi, arayüz) iner; görseller oynadıkça önbelleğe girer.
// Böylece telefon ilk açılışta yüzlerce dosya indirmez.
const CORE = f => !f.startsWith('assets/') || f.startsWith('assets/fonts/') || f.startsWith('assets/ui/');
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache =>
    Promise.all(self.CZ_FILES.filter(CORE).map(file => cache.add(file).catch(() => null)))
  ).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) return;
  // Görseller ve sesler: önce önbellek (hızlı), yoksa ağdan alıp saklar.
  // Görsel değişirse sürüm (CACHE) artırılır, eski önbellek silinir.
  if (new URL(event.request.url).pathname.includes('/assets/')) {
    event.respondWith(caches.match(event.request, { ignoreSearch: true }).then(hit => hit || fetch(event.request).then(response => {
      if (response.ok) { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)); }
      return response;
    })));
    return;
  }
  // Kod: her seferinde sunucuya sorar (eski kod kalmasın), internet yoksa önbellek.
  event.respondWith(fetch(event.request, { cache: 'no-cache' }).then(response => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, copy));
    }
    return response;
  }).catch(() => caches.match(event.request, { ignoreSearch: true })
    .then(hit => hit || caches.match('index.html'))));
});
