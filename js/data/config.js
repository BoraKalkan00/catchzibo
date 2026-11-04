// OYUN AYARLARI — denge değişikliklerini buradan yap. Süreler saniye.
CZ.CONFIG = {
  roundSeconds: 30,
  adContinueSeconds: 15,
  adFakeSeconds: 3,
  maxAdContinues: 2,     // bir denemede en fazla kaç kez "reklamla devam"
  holdMs: 450,           // bu süreden uzun basma = "bu benim"
  moveCancelPx: 22,      // parmak bu kadar kayarsa basma iptal
  rewardBase: 10,
  rewardPerSeconds: 3,   // kalan her 3 saniye +1 zümrüt
  rewardReplay: 3,
  rewardNewStar: 5,      // tekrar oynarken kazanılan her yeni yıldız
  stars: [0.66, 0.33],   // kalan sürenin turun süresine oranı: %66+ = 3 yıldız, %33+ = 2, altı 1 (30 sn'de 20 ve 10 sn)
  diaryGift: 5,          // günün ilk günlük okuması: Zibo'dan "sus payı"
  tauntEverySeconds: 7,
  storySlideMs: 3250,    // 4 sahne x 3.25 sn = 13 sn
  roomDates: false       // true: odalar 'opens' tarihinden önce açılmaz (yılbaşı takvimi). Test için false.
};

// İlk tur eğitimdir. Diğerleri sırayla açılır, gittikçe zorlaşır.
// similar: hedefe benzeyen eşyalar; share: yığının ne kadarı bunlardan oluşsun. Kalan yer rastgele eşyayla dolar.
// ZORLUK AYARLARI (tur tur):
//   heaps:   odadaki yığın sayısı. Biri gerçek (altında hedef), diğerleri tuzak (altında benzer bir eşya).
//            1 = hedefin yeri yığından belli olur (kolay). 4 = dört yığından hangisi? (zor)
//   spread:  örtücülerin hedeften ne kadar kaydığı. Büyük = hedefin kenarı görünür, küçük = tamamen gömülü.
//   seconds: bu turun süresi (yazılmazsa roundSeconds).
//   buzz:    titreşim gücü çarpanı. Tur ilerledikçe kalp atışı ve kayıp titreşimi sertleşir.
// Odalar sırayla açılır: bir oda tamamen bulununca sıradaki gelir.
// scene: assets/scenes içindeki oda görseli. fx: odanın canlı katmanı (alev, kar, ışıklar);
// koordinatlar oda görselinin (1530x2048) üzerinde. İstemiyorsan listeleri boşalt, fire ve snow'u null yap.
CZ.ROOMS = [{
  id: 'living',
  scene: 'room_living',
  fx: {
    size: [1530, 2048],
    fire: { x: 690, y: 780, w: 170, h: 170 },
    snow: { x: 600, y: 130, w: 330, h: 350 },
    lights: [
      [84, 464, '#ffd95e'], [200, 590, '#ff6b6b'], [110, 676, '#6fc3ff'], [60, 850, '#ffd95e'], [320, 770, '#ff6b6b'],
      [194, 1120, '#ffd95e'], [360, 1010, '#6fc3ff'], [34, 1096, '#ffd95e'], [256, 864, '#fff3a8']
    ]
  },
  rounds: [
    { id: 'r0', tutorial: true, target: 'stocking_red', count: 5, share: 0.5, similar: ['stocking_green', 'stocking_red_striped', 'mitten_blue', 'cane_green'] },
    { id: 'r1', target: 'ornament_red_star', count: 18, share: 0.35, heaps: 2, spread: 0.42, seconds: 30, buzz: 1, similar: ['ornament_red_dots', 'ornament_red_stripes', 'ornament_blue_star', 'ornament_gold_star'] },
    { id: 'r2', target: 'bell_gold_red', count: 22, share: 0.4, heaps: 2, spread: 0.36, seconds: 30, buzz: 1.15, similar: ['bell_gold_blue', 'bell_gold_green', 'bell_silver_red', 'bell_silver_blue'] },
    { id: 'r3', target: 'globe_snowman', count: 26, share: 0.45, heaps: 3, spread: 0.3, seconds: 30, buzz: 1.3, similar: ['globe_snowman_bare', 'globe_tree', 'globe_house', 'globe_star'] },
    { id: 'r4', target: 'gift_purple_gold', count: 30, share: 0.5, heaps: 3, spread: 0.25, seconds: 28, buzz: 1.45, similar: ['gift_purple_orange', 'gift_purple_silver', 'gift_blue_gold', 'gift_gold_red', 'gift_red_green'] },
    { id: 'r5', target: 'ginger_bow', count: 34, share: 0.5, heaps: 4, spread: 0.2, seconds: 27, buzz: 1.6, similar: ['ginger_bow_pink', 'ginger_bow_blue', 'ginger_buttons', 'ginger_scarf'] },
    { id: 'r6', target: 'nutcracker_red', count: 40, share: 0.55, heaps: 4, spread: 0.15, seconds: 25, buzz: 1.8, similar: ['nutcracker_red_blue', 'nutcracker_blue', 'nutcracker_green', 'nutcracker_red_blue', 'teddy_brown'] }
  ]
}, {
  id: 'kitchen',
  scene: 'room_kitchen',
  opens: '2026-12-08',
  fx: {
    size: [1536, 2048],
    fire: null,
    snow: { x: 610, y: 150, w: 365, h: 345 },
    lights: [[502, 560, '#ffd27a'], [300, 905, '#ffb347'], [195, 940, '#ff8c3a']]
  },
  rounds: [
    { id: 'k1', target: 'mug_red', count: 24, share: 0.45, heaps: 2, spread: 0.32, seconds: 30, buzz: 1.3, similar: ['mug_blue', 'mug_white', 'mug_green', 'mug_red_striped'] },
    { id: 'k2', target: 'cupcake_pink', count: 28, share: 0.5, heaps: 3, spread: 0.28, seconds: 29, buzz: 1.4, similar: ['cupcake_blue', 'cupcake_mint', 'cupcake_pink_cherry', 'cupcake_choco'] },
    { id: 'k3', target: 'teapot_red', count: 32, share: 0.5, heaps: 3, spread: 0.24, seconds: 28, buzz: 1.5, similar: ['teapot_blue', 'teapot_green', 'teapot_red_dots', 'teapot_white'] },
    { id: 'k4', target: 'cookie_star', count: 36, share: 0.55, heaps: 4, spread: 0.2, seconds: 27, buzz: 1.65, similar: ['cookie_tree', 'cookie_heart', 'cookie_star_iced', 'cookie_bell'] },
    { id: 'k5', target: 'pie_cherry', count: 40, share: 0.55, heaps: 4, spread: 0.16, seconds: 26, buzz: 1.8, similar: ['pie_apple', 'pie_blueberry', 'pie_pumpkin', 'pie_cherry_lattice'] },
    { id: 'k6', target: 'jar_candy_red', count: 44, share: 0.6, heaps: 5, spread: 0.13, seconds: 25, buzz: 2, similar: ['jar_candy_green', 'jar_candy_mixed', 'jar_cookie', 'jar_candy_red_blue'] }
  ]
}, {
  id: 'attic',
  scene: 'room_attic',
  opens: '2026-12-15',
  fx: {
    size: [1536, 2048],
    fire: null,
    snow: { x: 612, y: 188, w: 360, h: 330 },
    lights: [[580, 537, '#ffd27a'], [651, 516, '#ffd27a'], [1085, 467, '#ffd27a'], [417, 679, '#ffb347'], [1231, 516, '#ffb347']]
  },
  rounds: [
    { id: 'a1', target: 'train_red', count: 28, share: 0.5, heaps: 3, spread: 0.26, seconds: 29, buzz: 1.5, similar: ['train_blue', 'train_green', 'train_yellow', 'train_red_silver'] },
    { id: 'a2', target: 'robot_silver', count: 32, share: 0.5, heaps: 3, spread: 0.22, seconds: 28, buzz: 1.6, similar: ['robot_gold', 'robot_blue', 'robot_silver_red', 'robot_silver_plain'] },
    { id: 'a3', target: 'lantern_brass', count: 36, share: 0.55, heaps: 4, spread: 0.19, seconds: 27, buzz: 1.7, similar: ['lantern_red', 'lantern_green', 'lantern_silver', 'lantern_brass_off'] },
    { id: 'a4', target: 'horse_red', count: 40, share: 0.55, heaps: 4, spread: 0.16, seconds: 26, buzz: 1.8, similar: ['horse_blue', 'horse_white', 'horse_brown', 'horse_red_spots'] },
    { id: 'a5', target: 'sled_red', count: 44, share: 0.6, heaps: 5, spread: 0.13, seconds: 25, buzz: 1.9, similar: ['sled_blue', 'sled_green', 'sled_wood', 'sled_red_striped'] }
  ]
},{
  id: 'treasure',
  scene: 'room_treasure',
  opens: '2026-12-22',
  fx: {
    size: [1530, 2048],
    fire: null,
    snow: { x: 690, y: 455, w: 180, h: 205 },
    lights: [[184, 575, '#ffb347'], [1352, 585, '#ffb347'], [180, 1160, '#ffe27a'], [1000, 900, '#ffe27a'], [560, 1000, '#ffe27a']]
  },
  rounds: [
    { id: 't1', target: 'crown_gold', count: 30, share: 0.5, heaps: 3, spread: 0.24, seconds: 29, buzz: 1.6, similar: ['crown_silver', 'crown_gold_blue', 'crown_gold_green', 'crown_gold_mixed'] },
    { id: 't2', target: 'watch_gold', count: 34, share: 0.55, heaps: 4, spread: 0.2, seconds: 28, buzz: 1.7, similar: ['watch_silver', 'watch_bronze', 'watch_gold_blue', 'watch_gold_red'] },
    { id: 't3', target: 'box_red', count: 38, share: 0.55, heaps: 4, spread: 0.17, seconds: 27, buzz: 1.8, similar: ['box_blue', 'box_green', 'box_purple', 'box_red_silver'] },
    { id: 't4', target: 'cup_gold', count: 42, share: 0.6, heaps: 5, spread: 0.14, seconds: 26, buzz: 1.9, similar: ['cup_silver', 'cup_bronze', 'cup_gold_tall', 'cup_gold_star'] },
    { id: 't5', target: 'ring_ruby', count: 46, share: 0.6, heaps: 5, spread: 0.12, seconds: 25, buzz: 2, similar: ['ring_emerald', 'ring_sapphire', 'ring_diamond', 'ring_ruby_silver'] }
  ]
},{
  id: 'throne',
  scene: 'room_throne',
  opens: '2026-12-31',
  fx: {
    size: [1530, 2048],
    fire: null,
    snow: { x: 672, y: 200, w: 228, h: 380 },
    lights: [
      [100, 840, '#ffd27a'], [140, 840, '#ffd27a'], [320, 850, '#ffd27a'], [1210, 840, '#ffd27a'], [1400, 840, '#ffd27a'],
      [320, 140, '#ffd27a'], [1300, 130, '#ffd27a'], [1210, 300, '#ffd27a'], [586, 420, '#7dff8a'], [940, 420, '#7dff8a']
    ]
  },
  rounds: [
    { id: 'z1', target: 'hat_santa', count: 40, share: 0.55, heaps: 4, spread: 0.16, seconds: 27, buzz: 1.9, similar: ['hat_green', 'hat_blue', 'hat_purple', 'hat_santa_striped'] },
    { id: 'z2', target: 'musicbox_red', count: 44, share: 0.6, heaps: 5, spread: 0.13, seconds: 26, buzz: 2, similar: ['musicbox_blue', 'musicbox_green', 'musicbox_gold', 'musicbox_red_open'] },
    { id: 'z3', target: 'present_star', count: 48, share: 0.65, heaps: 5, spread: 0.1, seconds: 25, buzz: 2.2, similar: ['present_star_red', 'present_star_blue', 'present_bell', 'present_plain'] }
  ]
}];

// Odaya doldurulacak tüm eşyalar (assets/items içindekilerle aynı adlar).
CZ.ALL_ITEMS = [
  'ornament_red_star', 'ornament_red_dots', 'ornament_red_stripes', 'ornament_blue_star', 'ornament_gold_star', 'ornament_green_dots', 'ornament_silver_stripes',
  'bell_gold_red', 'bell_gold_blue', 'bell_gold_green', 'bell_silver_red', 'bell_silver_blue',
  'stocking_red', 'stocking_red_striped', 'stocking_green', 'stocking_blue', 'stocking_green_striped',
  'gift_purple_gold', 'gift_purple_silver', 'gift_blue_gold', 'gift_red_green', 'gift_green_red', 'gift_gold_red',
  'globe_snowman', 'globe_tree', 'globe_house', 'globe_star',
  'ginger_bow', 'ginger_bow_blue', 'ginger_buttons', 'ginger_scarf',
  'nutcracker_red', 'nutcracker_blue', 'nutcracker_green',
  'globe_snowman_bare', 'gift_purple_orange', 'ginger_bow_pink', 'nutcracker_red_blue',
  'mug_red', 'mug_blue', 'mug_white', 'cane_red', 'cane_green', 'mitten_red', 'mitten_blue', 'mitten_green',
  'star_gold', 'star_silver', 'wreath', 'candle_red', 'candle_white', 'teddy_brown', 'teddy_white', 'pinecone', 'cookies', 'mini_tree'
];

// Mutfağa özel eşyalar. Mutfakta yığın bunlarla + mutfağa yakışan genel eşyalarla dolar.
CZ.KITCHEN_ITEMS = [
  'mug_red', 'mug_blue', 'mug_white', 'mug_green', 'mug_red_striped',
  'cupcake_pink', 'cupcake_blue', 'cupcake_mint', 'cupcake_pink_cherry', 'cupcake_choco',
  'teapot_red', 'teapot_blue', 'teapot_green', 'teapot_red_dots', 'teapot_white',
  'cookie_star', 'cookie_tree', 'cookie_heart', 'cookie_star_iced', 'cookie_bell',
  'pie_cherry', 'pie_apple', 'pie_blueberry', 'pie_pumpkin', 'pie_cherry_lattice',
  'jar_candy_red', 'jar_candy_green', 'jar_candy_mixed', 'jar_cookie', 'jar_candy_red_blue',
  'cane_red', 'cane_green', 'mitten_red', 'mitten_green', 'candle_red', 'candle_white', 'cookies', 'ginger_buttons', 'ginger_scarf', 'pinecone'
];

// Hangi oda hangi eşyalarla dolar (yazılmazsa ALL_ITEMS).
CZ.ROOMS[0].pool = CZ.ALL_ITEMS;
CZ.ROOMS[1].pool = CZ.KITCHEN_ITEMS;
CZ.ROOMS[2].pool = ['train_red','train_blue','train_green','train_yellow','train_red_silver','robot_silver','robot_gold','robot_blue','robot_silver_red','robot_silver_plain','lantern_brass','lantern_red','lantern_green','lantern_silver','lantern_brass_off','horse_red','horse_blue','horse_white','horse_brown','horse_red_spots','sled_red','sled_blue','sled_green','sled_wood','sled_red_striped','teddy_brown','teddy_white','candle_red','candle_white','stocking_blue','stocking_green_striped','mitten_red','mitten_green','pinecone','star_silver','wreath'];
CZ.ROOMS[3].pool = ['crown_gold','crown_silver','crown_gold_blue','crown_gold_green','crown_gold_mixed','watch_gold','watch_silver','watch_bronze','watch_gold_blue','watch_gold_red','box_red','box_blue','box_green','box_purple','box_red_silver','cup_gold','cup_silver','cup_bronze','cup_gold_tall','cup_gold_star','ring_ruby','ring_emerald','ring_sapphire','ring_diamond','ring_ruby_silver','star_gold','star_silver','bell_gold_red','bell_gold_blue','ornament_gold_star','gift_gold_red','gift_blue_gold','candle_red','lantern_brass'];
CZ.ROOMS[4].pool = ['hat_santa','hat_green','hat_blue','hat_purple','hat_santa_striped','musicbox_red','musicbox_blue','musicbox_green','musicbox_gold','musicbox_red_open','present_star','present_star_red','present_star_blue','present_bell','present_plain','crown_gold','crown_silver','cup_gold','globe_snowman','globe_tree','nutcracker_red','nutcracker_blue','ginger_bow','stocking_red_striped','ornament_red_star','bell_gold_red','gift_purple_gold','train_red','horse_red','teddy_brown','candle_red','star_gold','wreath','mini_tree'];

// Köy dükkânı. x, y: süsün köy sahnesindeki yeri (%), size: genişlik (%).
CZ.SHOP = [
  { id: 'snowman', price: 15, x: 14, y: 78, size: 20 },
  { id: 'lamp', price: 20, x: 34, y: 62, size: 16 },
  { id: 'bench', price: 25, x: 72, y: 84, size: 22 },
  { id: 'wreath', price: 25, x: 49.5, y: 47, size: 12 },
  { id: 'tree', price: 35, x: 88, y: 66, size: 22 },
  { id: 'lights', price: 40, x: 50, y: 22, size: 34 },
  { id: 'stall', price: 50, x: 62, y: 66, size: 24 },
  { id: 'sleigh', price: 60, x: 32, y: 88, size: 26 }
];

CZ.DIARY_COUNT = 14;

// GÜNLÜK ÖDÜL ve SEVİYE.
CZ.PROGRESS = {
  daily: [                         // art arda giriş: 1. gün ... 7. gün (7'den sonra tekrar 1'e döner)
    { gold: 30 },
    { emeralds: 5 },
    { gold: 60 },
    { cocoa: 1 },
    { gold: 100 },
    { emeralds: 15 },
    { gold: 250, emeralds: 30, cocoa: 1, big: true }
  ],
  xp: { find: 40, replay: 8, crate: 0.5, chase: 25, daily: 10 },
  xpBase: 120,                     // 1→2 için 120 XP, sonra her seviye 80 fazla
  xpStep: 80,
  levelGold: 20,                   // seviye ödülü: 20 × seviye altın + 5 zümrüt, her 5 seviyede kakao
  levelEmeralds: 5,
  ziboLines: ['level.z1', 'level.z2', 'level.z3', 'level.z4', 'level.z5', 'level.z6', 'level.z7', 'level.z8']
};

// KOVALAMACA: eşyayı bulunca Zibo kapıp kaçar. 3 şerit, bomba, kanca.
// Zibo yenildikçe güçlenir (level = kaç kez yakalandığı).
CZ.CHASE = {
  enabled: true,
  onlyFirstFind: true,     // yalnız eşyayı ilk bulduğunda kovalamaca (tekrar oynayışlarda yok)
  seconds: 30,
  startGap: 100,           // metre
  closeRate: 2.4,          // oyuncu her saniye bu kadar yaklaşır
  hookPull: 16,            // isabetli kanca bu kadar çeker
  hookCooldown: 2.4,       // sn
  hookBurst: 5,            // kancadan sonra Zibo hızlanır, 1 sn'de bu kadar açar
  bombHit: 15,             // bomba yiyince mesafe açılır
  lives: 3,
  warnMs: 1800,            // bomba düşmeden önceki uyarı süresi
  laneSwitchMs: [2600, 1500],   // Zibo'nun şerit değiştirme aralığı: ilk seviye → en zor
  bombEveryMs: [2700, 1400],
  doubleBombLevel: 3,      // bu seviyeden sonra bazen iki şeride birden bomba
  maxLevel: 8,
  pocketBase: 5,           // yakalayınca ceplerinden çıkan zümrüt (+seviye ve kalan süre bonusu)
  continueSeconds: 10,
  continueEmeralds: 20
};

// KARTOPU SAVAŞI (altın modu). Hediye paketlerine ve sandıklara kartopu atıp altın topla.
// Her isabet: hasar kadar altın. Kırılınca: canı kadar BONUS altın.
CZ.GOLD = {
  roundSeconds: 30,
  cooldownMinutes: 60,   // ücretsiz turdan sonra bekleme (reklam ya da elmasla hemen oynanabilir)
  skipEmeralds: 5,       // beklemeyi elmasla atla
  throwGapMs: 110,       // iki atış arası en kısa süre
  walkSpeed: 0.3,        // kutuların yaklaşma hızı (1 / sn): ~3.5 sn'de yanından geçer
  lanes: 4,              // yol 4 şeritli: sağa sola kayarak tuzaklardan kaç
  spawnEveryMs: [700, 1100],
  maxCrates: 5,
  comboStep: 4,          // her 4 kırılan kutuda çarpan +1 (kutu kaçırırsan seri sıfırlanır)
  comboMax: 2,
  // Altın yalnız kutu kırılınca gelir (isabet başına altın yok): tur başına ~100 altın.
  crates: [
    { id: 'small', art: 'item.gift_red_green', hp: 3, gold: 1, weight: 50 },
    { id: 'big', art: 'item.gift_blue_gold', hp: 6, gold: 2, weight: 30 },
    { id: 'chest', art: 'gold.chest_wood', hp: 12, gold: 4, weight: 15 },
    { id: 'golden', art: 'gold.chest_gold', hp: 20, gold: 10, weight: 5, hops: true }   // şerit değiştirir
  ],
  // Zibo yolun ucunda koşar ve arkasına tuzak bırakır. Aynı şeritteysen çarparsın.
  trapEveryMs: [1700, 2600],
  trapsFromSecond: 3,
  traps: [
    { id: 'ice', art: 'gold.trap_ice', lose: 4, stun: 0.9, weight: 35 },      // buz: kayarsın, kısa süre atamazsın
    { id: 'banana', art: 'gold.trap_banana', lose: 5, stun: 0.6, weight: 30 }, // muz kabuğu
    { id: 'snow', art: 'gold.trap_snow', lose: 6, stun: 0.5, weight: 25 },     // kar yığını
    { id: 'bomb', art: 'gold.trap_bomb', lose: 10, stun: 0.7, weight: 10, shootable: true } // sahte sandık: vurursan da patlar!
  ],
  weapons: [
    { id: 'snowball', art: 'gold.weap_snowball', dmg: 1, price: 0, ball: '#f4fbff' },
    { id: 'sling', art: 'gold.weap_sling', dmg: 2, price: 150, ball: '#f4fbff' },
    { id: 'candy', art: 'gold.weap_candy', dmg: 3, price: 500, ball: '#ff6b6b' },
    { id: 'ice', art: 'gold.weap_ice', dmg: 4, price: 1000, ball: '#9fe0ff' },
    { id: 'staff', art: 'gold.weap_staff', dmg: 6, price: 2200, ball: '#c9a8ff' },
    { id: 'thunder', art: 'gold.weap_thunder', dmg: 9, price: 4000, ball: '#ffe36e' }
  ],
  cocoa: { price: 60, seconds: 5, max: 3 },  // sıcak kakao: sıradaki aramaya +5 sn
  // 3D koşu (Subway Surfers tarzı). Bir koşu ~45-90 sn, ~120-250 altın.
  runner: {
    startSpeed: 13, maxSpeed: 28, accel: 0.26,  // birim/sn
    hearts: 3, invulnSec: 1.6,                 // 3 çarpma hakkı (ejderha kostümü +1)
    jumpV: 11.5, gravity: 34, slideSec: 0.7,
    rowGap: [10, 17],                          // sıralar arası mesafe (zamanla kısalır)
    obstaclesFrom: 2,                          // ilk saniyeler yalnız altın
    obstacles: [
      { id: 'low', weight: 34 },    // hediye kutuları: zıpla
      { id: 'high', weight: 24 },   // çelenkli pankart: eğil
      { id: 'wall', weight: 30 },   // hediyeli kızak: şerit değiştir
      { id: 'crate', weight: 12 }   // sandık: kartopuyla kır ya da kaç
    ],
    crates: [
      { id: 'wood', hp: 3, gold: 3, weight: 80 },
      { id: 'gold', hp: 9, gold: 10, weight: 20 }
    ],
    coinValue: 1, coinLine: [5, 8], coinGap: 1.3, secondLine: 0.15, coinLineChance: 0.8,
    emeraldFrom: 15, emeraldMax: 2, emeraldChance: 0.18,  // turda en fazla 2 elmas, zor yerde
    powerEvery: [14, 22], magnetSec: 8, doubleSec: 10
  }
};

// Zibo'nun söz havuzları (metinleri js/lang içinde).
CZ.ZIBO_LINES = {
  taunt: ['zibo.catch', 'zibo.cold', 'zibo.give', 'zibo.bored', 'zibo.nap', 'zibo.mom', 'zibo.warm'],
  lift: ['zibo.touch', 'zibo.mess', 'zibo.careful', 'zibo.expensive', 'zibo.notThat'],
  nervous: ['zibo.nothing', 'zibo.notThere', 'zibo.lookAway'],
  exposed: ['zibo.dontDare', 'zibo.ohno'],
  found: ['zibo.mine', 'zibo.notfair', 'zibo.mommy', 'zibo.stolen'],
  wrong: ['zibo.laugh', 'zibo.glasses', 'zibo.thanks'],
  lifted: ['zibo.threw', 'zibo.oops'],
  time: ['zibo.tooSlow', 'zibo.bye'],
  poke: ['zibo.pokeHey', 'zibo.pokeKing', 'zibo.pokeTickle', 'zibo.pokeBill', 'zibo.pokeCrown']
};

// Goblin dili: her cümle için anlamsız bir söz üretmekte kullanılır.
CZ.GOBLIN = ['nak', 'zib', 'gruk', 'bli', 'hee', 'ozz', 'mek', 'tik', 'wub', 'krik', 'yap', 'dro', 'snik', 'pfft', 'glo', 'zub'];
