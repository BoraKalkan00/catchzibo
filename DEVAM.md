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
- (19 Kas) 10 yapıldı — KÖYÜ GENİŞLET: çitin güneyinde 'x' dairesi (taş+tuğla+altın, 8 seviye, en az 3 kule kurulunca görünür); her seviye dış halkada (OUT_R=23) bir kule yeri açar (DS.t[8..15]). Dalga yazısının yanında 🏰 köy seviyesi (vilLevel: tüm seviyelerin toplamı).
- Kalan: 3 Zibo'nun Kulesi (sonsuz kat), 4 PvP (Firebase gerekir, çıkıştan sonra), 7 kahraman yıldızları/takım, 8 goblinlerin uyum sağlaması, 9 günün kuralı.
- (19 Kas) Oyun hissi (Bora'nın gönderdiği TikTok'lardan): can barı sayılı, renk geçişli, gecikmeli sarı iz, vurulunca sarsıntı+beyaz parlama, iyileşince yeşil halka, azken nefes alır. Bütün açılır pencereler zıplayarak açılır, içerik sırayla gelir, kapanırken küçülür (ui.js Element.remove sarmalı). Sağda 🎁 ücretsiz sandık: 4 dk'da dolar, her dokunuş 4 sn hızlandırır (d.giftAt). Kartopu yalpalayarak iz bırakır.
- (19 Kas) 30 fikirden 1. TEK SANAT STİLİ: CZ.style (gen3d.js) — tek 4 tonlu çizgi film ışık rampası (KayKit karakterler dahil), bütün 3D malzemeler MeshToon (zemin/su hariç), yapay zekâ modellerinin köşe renkleri harmonize (doygunluk/parlaklık aralığı). Kontur her yerde aynı renk (CZ.style.OL): karakter, kule, çit, köy binası, kamp, süs, binek, kaya (instanced). outlineWorld(root, dünyaKalınlığı) ölçekten bağımsız; şekil bozan gölgelendiricilerde (yürüme, binek bacakları) kontur da aynı bükülür (userData.deform). İçinden görülen binaların konturu da delikli (outlineSee). Ekran dışı kontur çizilmez → çizim çağrısı 114→126. Koşu modu ve Köyüm ekranı da toon. Kalan: Köyüm ekranında kontur yok, ağaçlarda kontur yok (performans).
- (19 Kas) 2. adım denendi — İSKELETE BAĞLAMA hazır ama KAPALI: kaykit.js skinGen() yapay zekâ modelini KayKit iskeletine otomatik bağlar (bölge+mesafe ağırlıkları, gardırop renkleri köşe renklerine uygulanır). CZ.KK_GEN boş bırakıldı çünkü T-pozlu Hunyuan modelleri (u_girl, t_boy, t_santa, t_elf, t_snow, t_deer, t_knight, t_mila; Claude oturumunda /home/claude/rigmodels, bilgisayarda Zibo3D/cikti) KayKit'ten bulanık/kalitesiz göründü. Bora'ya karşılaştırma gösterildi, karar bekleniyor (öneri: KayKit CC0 paketleriyle dünyayı KayKit'e uydurmak).
- (19 Kas) 2. adım BİTTİ — YENİ KARAKTERLER: Bora'nın Gemini ön/arka T-poz çizimleri (cizim/karakter/) → bilgisayarda URET6.bat (uret6.py: hazır resmi kullanır, octree 384, 12 adım) → cizim/texpaint.py (ön/arka resmi doku olarak kaplar, 6000 yüz, JPEG doku, ~500 KB) → assets/3d/gen/v_*.glb → kaykit.js skinGen ile KayKit iskeletine bağlanır, 29 animasyon çalışır. CZ.KK_GEN: girl, boy, santa, elf, snowkid, reindeer, knight, mila. v_* modelleri 'lazy': açılışta yalnız seçili karakter + Mila iner (gen3d.load / need). Gardırop renkleri dokuya uygulanır (recolorMap). Menü resimleri (assets/chars/*_front/wave/back1/back2/jump) yeni modellerden yeniden çizildi. Kalan: goblinler ve yardımcı kahramanlar da aynı yöntemle (Gemini T-poz çizimi lazım).
- (19 Kas) Goblin, goblin şefi, Zibo ve yardımcı kahramanlar (Rudi, Ela madenci=v_hela, Buzbaş, Demir, Noel) da Gemini çiziminden iskeletli 3D. Goblinler rigGoblin (valley.js): KayKit koşu/bekleme, saldırıda vuruş; tür renkleri malzeme rengiyle. v_goblin/v_chief açılışta, diğerleri lazy (gen3d.load: avatar+Mila+Zibo+yardımcı). Kahraman resimleri yeni modellerden (heroes.portrait, model inince yenilenir).
- (19 Kas 18:45) Bora iskeletli karakterleri beğenmedi (kollar bozuk, özellikle Zibo). CZ.KK_GEN boşaltıldı, menü resimleri eski haline döndü; v_* modeller duruyor. Plan: Mixamo otomatik iskelet + Mixamo animasyonları (ve belki TRELLIS ile daha iyi model).
- (20 Kas) MIXAMO HATTI ÇALIŞIYOR — Zibo pilotu oyunda: assets/3d/mx/zibo.glb (330 KB, v_zibo dokusu + Mixamo otomatik iskeleti) ve assets/3d/mx/anims.glb (266 KB; idle, run, walk, throw, hit, die, win — X Bot üzerinde "Without Skin", koşu/yürüme In Place). kaykit.js: MX_CHARS listesi, hasMX(k), rig(root, set, map) + MX_MAP (KayKit klip adı → Mixamo), ziboMX(): kk.zibo() Mixamo varsa onu döndürür (koşu modu, prolog). Hat: 1) Hunyuan modeli → su geçirmez vokselli OBJ (pitch 1.2, ×170) 2) mixamo.com Upload Character (çene/bilek/dirsek/diz/kasık) → FBX Binary T-pose indir 3) FBX2glTF 4) cizim/mxbind.py rig.glb dokulu.glb out.glb (ağırlıkları en yakın yüzeyden aktarır; çorba ağı konuma göre kaynatılır yoksa yırtılır) 5) yeni animasyon: Mixamo'da X Bot seçili, Without Skin → cizim/animpack.py. Chrome indirmeleri Bora "Sakla" demeden inmez. Sıradaki: diğer 16 karakter aynı hatla (her biri için yalnız 2. adım Mixamo yükleme gerekir), goblinler için rigGoblin yerine Mixamo.
- (20 Kas) YENİ SANAT YÖNÜ (Bora onayladı): chibi / Brawl Stars tarzı, düz renk, A-poz (kollar 45° aşağı), yumruk eller. Zibo yeniden: cizim/karakter/zibo2_turnaround.png → Hunyuan (bilgisayarda İndirilenler\ZIBO_MODEL_URET.bat = Zibo3D\URET6.bat; isler.json + cikti/<ad>_0.png) → texpaint 12000 yüz → Mixamo vekil: voksel pitch 1.6, KÜÇÜLTME YOK (decimate su geçirmezliği bozuyor, Mixamo "Unknown error" verir), 170 boy. Kasık işaretçisi bacak arasındaki boşluğa değil şort/gömlek birleşimine konmalı yoksa "place all markers" hatası. anims.glb artık yeni Zibo iskeletinin kalça yüksekliğine göre (animpack.py ikinci argüman). device_commit_files aynı yola ikinci kez yazınca eski içeriği yazabiliyor → her seferinde yeni dosya adı.
- (20 Kas 15:20) 13 YENİ KARAKTER: Gemini A-poz görselleri cizim/karakter değil /home/claude/n2/<ad>_src/front/back.png (n_goblin, n_chief, n_girl, n_boy, n_santa, n_elf, n_snowkid, n_reindeer, n_knight, n_mila, n_buzbas, n_demir, n_noel). Hunyuan çıktıları bilgisayarda cikti/n_*_0.glb (İndirilenler\ZIBO_MODEL_URET3.bat: düşük öncelik + çökünce 6 kez yeniden dener). texpaint kenar aşındırma ile yan yüzler temiz. Mixamo vekilleri Zibo3D\mixamo\n_*.obj (2 ondalık, <3.8 MB). Mixamo: n_goblin ve n_chief iskeletlendi+indirildi (n_goblin_mx.glb hazır), n_girl yüklendi (işaretçi bekliyor). Kalan: girl..noel Mixamo, sonra hepsi oyuna (MX_CHARS + KK_GEN yerine). Rudi ve Madenci Ela görselleri gelmedi. Yeni logo + ikon eklendi. 2D Zibo resimleri 3D'den; yüz ifadeleri için Gemini promptları verilecek.
- (20 Kas 17:50) MIXAMO KARAKTERLER OYUNDA: assets/3d/mx/{girl,boy,santa,elf,snowkid,reindeer,mila,goblin,chief,hero_buzbas,zibo}.glb. kaykit.js: MX_ALL + needMX(keys) (açılışta zibo, goblin, şef, mila, avatar, yardımcı iner), mxClips(k) (KayKit klip adı → Mixamo klip Proxy, kalça yüksekliği karaktere göre; anims.glb artık birim kalçalı: animpack.py --unit), mxPart (üst gövde atış). hero(kind) Mixamo varsa onu kullanır (silah yuvası mixamorigRightHand). valley: goblinBody/rigGoblin, Mila, yardımcı (hero_<id>) Mixamo'ya geçer. Bekleyen: demir/noel/knight FBX (Bora 'Sakla' demeli: n_demir.fbx, n_noel.fbx, n_knight3.fbx), Rudi + Madenci Ela görselleri. Eksik animasyonlar: zıplama, kayma, kaçınma (şimdilik koşu).
- (21 Kas) 16/16 KARAKTER MIXAMO (Rudi T-poz görselle yeniden; mxbind: boyun üstü kafa, kalça üstü bacaksız, kol kapsülü). Yeni animasyonlar anims.glb'de: jump (Running Jump, ip), roll (Quick Roll To Run, ip, t=0.6-1.375), dodgeR (Dodging Right, ip) + dodgeL (aynası, animpack ':mirror'). Koşucuda: Mixamo karakterde takla gerçek klip (prosedürel dönüş kapalı), kaçınma = bacak koşar + üst gövde dodge (dodgeNow). 'sit' klibi yok → idle (Sitting Idle indirilemedi, Bora 'Sakla' demeli). animpack seçenekleri: ad=dosya.glb:ip:mirror:t=a-b.

## 21 Kasım akşamı – durum (v179)
- Köyüm 2D: binalar Gemini resimleri (assets/village/<id>/<sv>.webp, inşaat c.webp). VART tablosu js/screens/village.js. Arka plan silme: /home/claude/tools/keymag.py (cizim/koy/ kaynaklar).
- 14 bina: hall 10, goldmine 10 (altın), elf 6 (zümrüt), cookie 5 (can+koşu), gate 6 (goblin yavaşlatır), jail 5 (goblin altını), mine 10, bakery 10, vault 8, tower 10, stable 6, forge 8 (resim 7 var, 8 eksik), lookout 5, tree 15.
- Seviye tavanı: cap = ceil(max*(hall+1)/11). Gerçek sayılar CZ.village.stats(id,L).
- Süs mağazası (9 süs, 12 yer) Köyüm'de "Süsler" düğmesi.
- Zemin: assets/village/zemin/{v,h}.webp (telefon/PC).
- Büyük harita: assets/map/tile (zemin deseni), assets/map/prop (ağaç, kaya, çalı, fener, çit, kamp, mağara, sandık, kutu) kameraya dönük düz resim (pGeo/pMat valley.js).
- Yükseltme kartı: js/core/upgrade.js (CZ.upgradeCard). Köyüm'de ve vadide dairelere/binalara dokununca açılır.
- Görüntü: gölge alanı ±52 (ortadaki parlak daire giderildi), bloom düşük, temiz kar tonları.
- Prompt sayfası: https://claude.ai/artifact/B3YaieDYXpqLmFmUJLktJB (kaynak /home/claude/promptsayfa).
- SIRADA: Savunma kuleleri resimleri (Kartopu Atıcı 5, Top Kulesi 5, Çit 3) + Demirci Sv8 gelince bağla (valley.js DEF_EMO yerine resim); goblinlerin 3D stilini resimlerle uyumlu hale getir; telefonda gerçek APK testi.
