# Yol haritası (otomatik çalışan Claude oturumları buradan sırayla iş alır)

Kurallar:
- Sıradaki ilk `[ ]` maddeyi al. Bitirince `[x]` yap, altına 1 satır ne yapıldığını yaz, DEVAM.md'ye not düş.
- "Bitti" demek için: `node --check` temiz, `tools/qa/` içindeki ilgili Playwright testi hatasız (çıktılar /tmp/qa/), ekran görüntüsüne bakılmış, sw.js sürümü +1, commit + push.
- Bir maddeyi bir daha dönüp yapmaya gerek kalmayacak kadar iyi yap. Emin değilsen küçük ve sağlam yap.
- Test ortamı: `mkdir -p /tmp/qa && pip install playwright --break-system-packages && python3 -m playwright install chromium` (gerekirse). Testler sayfayı kendisi sunar (port 8765).
- Mağaza/hesap işleri Bora'nındır; sen OYUNA odaklan.

## A) Görünüş
- [x] A1 Kilitli bölge sisi + kilit tabelaları
- [x] A2 Prolog gecesi renkleri
- [x] A3 Binek %20 küçük
- [x] A4 Yol kenarı süsleri: KayKit props (fence, barrel, crate, sack, wheelbarrow, resource_lumber, tent, flag) yollar boyunca ve kamp/maden çevresinde; çarpışma ekle; köyden 18 m dışında; performans için mümkünse InstancedMesh
  - Yapıldı: 6 tip küme (çit, fıçı+sandık, el arabası+çuval, kütük, büyük sandık, palet) yollar boyunca 5-8 m arayla (~18 küme), patika rengi koyulaştı. İleride: kamp/maden çevresi.
- [ ] A5 Köy çevresi yaşanmışlık: çit ile çevrili tarla (karlı), kuyu, odun yığınları, köy girişinde tabela ve 2 fener; köy meydanı zemini taş döşeme dokusu
- [ ] A6 Oyuncu karakteri %10 büyük (rider/seat ve hitbox'la uyumlu), ad etiketi okunur

## B) İlk 10 dakika
- [ ] B7 Görev şeridi ilk 5 görev metnini netleştir (Zibo'yu yakala → İlk kuleni kur → 5 ağaç kes → Geceyi atlat → Köylü kurtar) ve üstteki "Tiny Keep 0/1" quest göstergesini kaldır/birleştir
- [ ] B8 İlk 5 dakikada aynı anda en fazla 1 pencere/ipucu (kuyruk sistemi): ipucu, kart, rapor, hoş geldin, günlük hediye çakışmasın
- [ ] B9 İlk gece ayarı: kesin kazanılır ama oyuncunun canı en az %30 düşer (goblin hasarı/sayısı wave 1-2 için ayarla), sonunda büyük ödül patlaması
- [ ] B10 tools/qa/ftue.py ile yeni oyuncu akışını uçtan uca oyna; dokunuş sayısı, kontrol alma süresi, takılma noktalarını DEVAM.md'ye yaz ve düzelt

## C) Sağlamlık
- [ ] C11 tools/qa/soak.py 10 dakika: sıfır konsol hatası; bulunan her hatayı düzelt
- [ ] C12 Eski kayıt göçü: eksik alanlarla (d.surv yok, d.vil yok, eski sürüm alanları) açılış çökmesin
- [ ] C13 Yatay ekran (1280×720) ve küçük ekran (360×640) düzeni: HUD çakışmaları düzelt
- [ ] C14 tr/en dil dosyalarında eksik anahtar taraması (kodda t('x') geçen ama dilde olmayan); eksikleri ekle

## D) PC/Steam sürümü (hesap Bora'da, sen sadece oyunu hazırla)
- [ ] D15 Klavye/fare: e.code ile WASD/oklar (Türkçe klavye, CapsLock), Shift=atılma, Q=yetenek, R=kükreme, M=harita, Esc=duraklat, 1-3 silah; fareyle tıklanan yöne ateş zaten var; ekranda tuş ipuçları (yalnız fare/klavye varsa)
- [ ] D16 Electron masaüstü sarmalayıcısı (desktop/ klasörü) + GitHub Actions ile Windows x64 zip; ads.show PC'de reklamsız doğrudan ödül, gerçek para mağazası PC'de gizli
- [ ] D17 steamworks.js entegrasyonu (App ID gelince açılacak şekilde bayrakla): başarımlar (ilk gece, Zibo yakalandı, 10 gece, belediye sv5 ...) ve bulut kayıt

## E) Tutma (retention)
- [ ] E18 "Bak" düğmesi (fotoğraf modu): savaş yokken kamera karakter etrafında döner + ekran görüntüsü paylaş
- [ ] E19 Gündüz sakinken kamera biraz alçalır/yaklaşır, gece/savaşta normale döner (ayarlarda kapatılabilir)
- [ ] E20 Gece sonu paylaşım kartı (goblin sayısı, en yüksek kombo, Zibo durumu) — mevcut paylaş düğmesine bağla
- [ ] E21 Mağaza ekran görüntülerini yeni dünyayla yeniden çek (store/ tr_/en_ 1080×1920, 8'er adet) — Playwright ile

## F) Çıkış sonrası (şimdilik dokunma)
- Kış Festivali etkinliği, Meshy karakterleri, sunuculu baskın/sıralama
