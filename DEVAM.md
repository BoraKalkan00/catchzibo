# Catch Zibo! — devir notu (yeni sohbet buradan başlar)

Sahibi: Bora Kalkan. Repo: BoraKalkan00/catchzibo. Web: borakalkan00.github.io/catchzibo
APK (her push'ta GitHub Actions derler): github.com/BoraKalkan00/catchzibo/releases/download/test-build/catchzibo.apk
Google Play hesabı 3 Aralık'ta açılıyor. Hedef: çok indirme + gelir (garanti yok, dürüst ol).

## Çalışma kuralları
- Bora sert eleştiri ve "şu olsa daha iyi olurdu" önerileri ister; otonom çalış, botla test et, ücretsiz araçlar.
- Commit: `git -c user.name="Bora Kalkan" -c user.email=<Bora'nın e-postası>` ; e-postayı dış servislere verme.
- Şifre girme. Bora Türkçe konuşur, kısa cevap ister, krediyi boşa harcama.
- Bilgisayarı (Windows, RTX 5060): Documents\Zibo3D'de Hunyuan3D-2mini + SD-turbo. `isler.json` iş listesi
  ([{ad, istem, n}]), `URET5.bat` üretir → `cikti/*.glb, *.png`. Bora'ya çalıştırtma: Claude Explorer'da
  (yalnız tıklama izni) This PC → C: → Users → kalka → Documents → Zibo3D → URET5.bat'a çift tıklar.
  isler.json'u gönderirken her seferinde YENİ bir outputs klasörü yolu kullan (eski kopya önbelleğe takılıyor).
- 3D işleme: trimesh ile `clean` + `paint.py` (görüntüden boyama) → `assets/3d/gen/*.glb` → `js/core/gen3d.js` CZ.GEN3D'ye ekle.
- Yayın: `/tmp/sync.py` (sw dosya listesi) → commit → `git pull --rebase` → push → `gh run list`.

## Oyun (ana mod: js/screens/valley.js, ~1900 satır)
- Açılış: Noel gecesi prologu (Zibo köyün sandığını çalar) → bineğinle kovalamaca → eğitim
  (TUT: chase, wood, stone, build, goblin) → Rudi kahraman olarak katılır.
- Dünya: yarıçap 100, nehir/dere/göl, 5 köprü, ağaç (balta→odun), kaya (kazma→taş).
- 4 para: zümrüt > altın > taş > odun. Altın yalnız goblinden. Pazar: altın→odun/taş, zümrüt⇄altın.
- İnşaat Kingshot gibi: dairenin üstünde durunca kaynak akar. Kuleler (kartopu/top), çitler, köy binaları
  (hall, mine, bakery, vault, stable, forge, tower, tree…). "Eksik odun/taşı al" düğmesi altınla tamamlar.
- Maden (taş) ve oduncu (odun) kendi üretir; binanın üstünde balon çıkar, yanına gidince toplanır.
- Goblinler: yeni 3D modeller (goblin, goblinsef = boss/güçlü), zıplayarak yürür; 5 dalgada bir boss.
- Mila köyü korur (kartopu atar). Gece baskını raporu: uzaktayken savunma (kule+çit+kahraman) vs goblin.
- Günlük hediye: 7 günlük seri (d.login).
- Kahramanlar (js/core/heroes.js + valley.js BUD): mila, rudi(odun), ela(taş), buzbas(dondurur),
  demir(dövüşür), noel(hediye bombası, +altın). Parça: boss 4, goblin %3, günlük hediye; 5 parça=10 zümrüt.
  Seviye 1-10 (parça+altın). Ücretli rastgele kutu YOK (bilinçli karar).
- Binek bacak animasyonu: gen modelin alt kısmı vertex shader'da sallanır (oyuncu bineğinde dış çizgi yok).
- Mağaza/ödeme: js/core/shop.js (altın/zümrüt paketleri, başlangıç paketi, reklamsız, 100 TL battle pass).
- Diller: js/lang/*.js (9 dil, eksik anahtar İngilizceye düşer). Yeni anahtar dosya sonundaki `});` öncesine.

## Testler (/home/claude/zibo/qa, oturumla silinir — gerekirse yeniden yaz)
Playwright + swiftshader. `CZ.screens.valley.debug` = V (P, BUD, goblins, pads, left, tut, debug.sim, debug.spawnGoblin).
Gift popup'ı kapatmak için `CZ.state.data.login={last:bugünYYYYMMDD,n:1}`.

## Sıradaki işler
1. Her kahramana özel 3D model (şu an KayKit karakterleri; Rudi gerçek ren geyiği değil).
2. Donmuş goblinlere mavi renk, kahraman yeteneklerine ses/efekt.
3. Gerçek telefonda performans testi (Bora'dan geri bildirim).
4. Mağaza görselleri (store/gorseller taslak; öne çıkan görsel 2D, oyun 3D — yeniden yap).
5. Arkadaş köyüne baskın (sunucu gerekir, sonra).
