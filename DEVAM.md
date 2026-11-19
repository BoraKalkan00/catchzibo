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
- 3D işleme: trimesh ile `clean` + `paint.py` (oturumla silinir; önden izdüşümle köşe boyama, 4000 yüz, boy=1, taban y=0) (görüntüden boyama) → `assets/3d/gen/*.glb` → `js/core/gen3d.js` CZ.GEN3D'ye ekle.
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
1. ✅ (18 Kas) Yardımcı kahramanlar kendi 3D modelinde (assets/3d/gen/h_*.glb, valley.js spawnBuddy). Mila hâlâ KayKit (binekte oturuyor). Telefonda nasıl göründüğüne Bora karar versin; kötü ise KayKit'e dönmek için GEN3D'den h_* sil.
2. ✅ Donmuş goblin buz kabuğu, buz/hediye/kılıç sesleri, hediye konfetisi.
3. Gerçek telefonda performans testi (Bora'dan geri bildirim).
4. Mağaza görselleri (store/gorseller taslak; öne çıkan görsel 2D, oyun 3D — yeniden yap).
5. Arkadaş köyüne baskın (sunucu gerekir, sonra).

## 19 Kas — video geri bildirimi (yapıldı)
- Yatay ekran: Ayarlar > Yatay ekran (bilgisayarda kendiliğinden yatay). APK'da @capacitor/screen-orientation ile döner (CZ.orient, main.js).
- Ekranın sağ yarısına dokun / fareyle tıkla = oraya at, basılı tut = atmaya devam (fireAt). Klavye: WASD + boşluk.
- 3D modellere gölgelendiriciyle yürüme (walkMat): bacak/kol salınımı. Goblinler ve yardımcılar.
- Mor "üflemeli" goblin (gb.ranged): 8.5 m'den kırmızı dart atar, kaçılabilir (dalga 2+).
- Vuruş hissi: goblin ezilip zıplar + buz kırıntısı; oyuncu vurulunca sarsıntı, kırmızı sayı, kırmızı yanıp sönme, can azsa kenarlar kırmızı nabız.
- Binekte de kartopu atılır (ok yok). Balta/kazma artık gerçek şekil (bayrağa benziyordu).
- Zemin yumuşak geçişli, 512 doku; kayalar pürüzsüz + karlı; ağaçlar cam_hi (1400 yüz); kar taneleri yuvarlak.
- Çitin üstüne gelince canı ve yükseltmesi görünür.
- (19 Kas) 1. fikir yapıldı — KÖY GÜCÜ (vilPower): kule/çit puanı dalgaları güçlendirir. Yeni goblinler: bombacı (turuncu, kuleyi 25 sn bozar / çiti yıkar), zıplayan (sarı, çitten atlar), kalkanlı (kule hasarı %40). Her 5 dalgada BÜYÜK BASKIN (tek yönden, uyarı bandı, hepsi düşerse ödül; çalınmazsa +2 zümrüt). Bozuk kulenin yanında durunca 3x hızlı onarılır. Yatay telefonda "dik tut" uyarısı artık çıkmıyor.
- Sıradaki: 6 sipariş panosu (Bora'nın Gemini köylü/malzeme görselleri bekleniyor), 2 goblin kampları (PC'de çadır/totem 3D), 10 köy genişletme, sonra 3,4,5,7,8,9.
- (19 Kas) 6+5 yapıldı — SİPARİŞ PANOSU (js/core/orders.js, d.ord): 3 köylü siparişi, teslimde altın/zümrüt, her 3 siparişte itibar seviyesi; boş yuva 8 dk (reklamla hemen). ATÖLYE: 5 odun=1 tahta, 5 taş=1 tuğla, 8 taş+6 odun=1 demir. Kule sv4-5 ve çit sv3 artık tahta/tuğla/demir ister. Görseller assets/ui/npc, assets/ui/mat (Bora'nın Gemini çizimleri).
- (19 Kas) 2 yapıldı — GOBLİN KAMPLARI: köy dışında 8 kamp (campSites, d.vil.camps). Yaklaşınca bekçiler uyanır (2+2×seviye), hepsi düşünce altın+demir+zümrüt(+kahraman parçası şansı); 4 saat sonra 1 seviye güçlü döner. Haritada mor üçgen (sayı=seviye), temizse yeşil. 3D: g_cadir, g_totem, g_ates.
