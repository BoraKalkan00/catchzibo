// GÖRSEL KAYDI — gerçek görselleri buradan bağlarsın.
// Çoğu durumda: dosyayı assets/ altına koy, aşağıdaki OVERRIDES'a bir satır ekle. Hepsi bu.
// Örnek:  'item.ornament_red_star': 'assets/items/ornament_red_star.png',
window.CZ = window.CZ || {};

CZ.OVERRIDES = {
  // Zibo'nun Gemini çizimleri (3D). Arkadan koşu, sersemleme, atış gibi pozlar ayrı ayrı.
  'zibo.idle': 'assets/zibo/png/smug.webp',
  'zibo.blink': 'assets/zibo/png/blink.webp',
  'zibo.smug': 'assets/zibo/png/smug.webp',
  'zibo.laugh': 'assets/zibo/png/laugh.webp',
  'zibo.taunt': 'assets/zibo/png/taunt.webp',
  'zibo.tongue': 'assets/zibo/png/taunt.webp',
  'zibo.mad': 'assets/zibo/png/angry.webp',
  'zibo.angry': 'assets/zibo/png/angry.webp',
  'zibo.nervous': 'assets/zibo/png/scared.webp',
  'zibo.scared': 'assets/zibo/png/scared.webp',
  'zibo.tantrum': 'assets/zibo/png/cry.webp',
  'zibo.cry': 'assets/zibo/png/cry.webp',
  'zibo.dizzy': 'assets/zibo/png/dizzy.webp',
  'zibo.throw': 'assets/zibo/png/throw.webp',
  'zibo.sack': 'assets/zibo/png/sack.webp',
  'zibo.runLoot': 'assets/zibo/png/sack.webp',
  'zibo.run1': 'assets/zibo/png/back1.webp',
  'zibo.run2': 'assets/zibo/png/back2.webp',
  'zibo.back': 'assets/zibo/png/back1.webp',
  'scene.hub_bg': 'assets/scenes/hub_bg.webp',
  'scene.room_living': 'assets/scenes/room_living.webp',
  'scene.room_kitchen': 'assets/scenes/room_kitchen.webp',
  'scene.room_attic': 'assets/scenes/room_attic.webp',
  'scene.room_treasure': 'assets/scenes/room_treasure.webp',
  'scene.room_throne': 'assets/scenes/room_throne.webp',
  'scene.road': 'assets/scenes/road.webp',
  // Kunduz Usta: ev inşasında yardımcı
  'usta.wave': 'assets/usta/wave.webp', 'usta.talk': 'assets/usta/talk.webp', 'usta.hammer': 'assets/usta/hammer.webp',
  'usta.worried': 'assets/usta/worried.webp', 'usta.cheer': 'assets/usta/cheer.webp', 'usta.think': 'assets/usta/think.webp'
};

// Yazılmayan her görsel bu kuraldan bulunur: 'item.x' -> assets/items/x.svg
CZ.FOLDERS = {
  item: 'items', zibo: 'zibo', avatar: 'avatar', scene: 'scenes', story: 'story', village: 'village', ui: 'ui', gold: 'gold'
};

CZ.ITEMS3D = new Set(["bell_gold_blue", "bell_gold_green", "bell_gold_red", "bell_silver_blue", "bell_silver_red", "box_blue", "box_green", "box_purple", "box_red", "box_red_silver", "candle_red", "candle_white", "cane_green", "cane_red", "cookie_bell", "cookie_heart", "cookie_star", "cookie_star_iced", "cookie_tree", "cookies", "cupcake_blue", "cupcake_choco", "cupcake_mint", "cupcake_pink", "cupcake_pink_cherry", "gift_blue_gold", "gift_gold_red", "gift_green_red", "gift_purple_gold", "gift_purple_orange", "gift_purple_silver", "gift_red_green", "ginger_bow", "ginger_bow_blue", "ginger_bow_pink", "ginger_buttons", "ginger_scarf", "globe_house", "globe_snowman", "globe_snowman_bare", "globe_star", "globe_tree", "hat_blue", "hat_green", "hat_purple", "hat_santa", "hat_santa_striped", "jar_candy_green", "jar_candy_mixed", "jar_candy_red", "jar_candy_red_blue", "jar_cookie", "lantern_brass", "lantern_brass_off", "mini_tree", "mitten_blue", "mitten_green", "mitten_red", "mug_blue", "mug_green", "mug_red", "mug_red_striped", "mug_white", "musicbox_blue", "musicbox_gold", "musicbox_green", "musicbox_red", "musicbox_red_open", "nutcracker_blue", "nutcracker_green", "nutcracker_red", "nutcracker_red_blue", "ornament_blue_star", "ornament_gold_star", "ornament_green_dots", "ornament_red_dots", "ornament_red_star", "ornament_red_stripes", "ornament_silver_stripes", "pie_apple", "pie_blueberry", "pie_cherry", "pie_cherry_lattice", "pie_pumpkin", "pinecone", "present_bell", "present_plain", "present_star", "present_star_blue", "present_star_red", "star_gold", "star_silver", "stocking_blue", "stocking_green", "stocking_green_striped", "stocking_red", "stocking_red_striped", "teapot_blue", "teapot_green", "teapot_red", "teapot_red_dots", "teapot_white", "teddy_brown", "teddy_white", "wreath"]);

CZ.art = function (key) {
  if (CZ.OVERRIDES[key]) return CZ.OVERRIDES[key];
  // Gemini eşya çizimleri (3D görünümlü): listede olan eşya webp'den gelir, olmayan eski SVG.
  if (key.startsWith('item.') && CZ.ITEMS3D.has(key.slice(5))) return 'assets/items3d/' + key.slice(5) + '.webp';
  // Gemini karakter çizimleri: char.boy_front, char.girl_wave ...
  if (key.startsWith('char.')) return 'assets/chars/' + key.slice(5) + '.webp';
  // Oyuncu karakteri renk ve kostüme göre çizilir (js/core/avatar.js).
  if (key.startsWith('avatar.') && CZ.avatarArt) return CZ.avatarArt.url(key.slice(7));
  const dot = key.indexOf('.');
  return 'assets/' + CZ.FOLDERS[key.slice(0, dot)] + '/' + key.slice(dot + 1) + '.svg';
};
