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
  'gold.weap_snowball': 'assets/gold/weap_snowball.webp',
  'gold.weap_sling': 'assets/gold/weap_sling.webp',
  'gold.weap_candy': 'assets/gold/weap_candy.webp',
  'gold.weap_ice': 'assets/gold/weap_ice.webp',
  'gold.weap_staff': 'assets/gold/weap_staff.webp',
  'gold.weap_thunder': 'assets/gold/weap_thunder.webp',

  'zibo.vrun0': 'assets/zibo/png/vrun0.webp',
  'zibo.vrun1': 'assets/zibo/png/vrun1.webp',
  'zibo.vrun2': 'assets/zibo/png/vrun2.webp',
  'zibo.vrun3': 'assets/zibo/png/vrun3.webp',
  'zibo.vrun4': 'assets/zibo/png/vrun4.webp',
  'zibo.vrun5': 'assets/zibo/png/vrun5.webp',
  'zibo.vrun6': 'assets/zibo/png/vrun6.webp',
  'zibo.vrun7': 'assets/zibo/png/vrun7.webp',

  'scene.room_living': 'assets/scenes/room_living.webp',
  'scene.room_kitchen': 'assets/scenes/room_kitchen.webp',
  'scene.room_attic': 'assets/scenes/room_attic.webp',
  'scene.room_treasure': 'assets/scenes/room_treasure.webp',
  'scene.room_throne': 'assets/scenes/room_throne.webp',
  'scene.road': 'assets/scenes/road.webp',
  'story.1': 'assets/scenes/story1.webp',
  'story.2': 'assets/scenes/story2.webp',
  'story.3': 'assets/scenes/story3.webp',
  'story.4': 'assets/scenes/story4.webp',
  'story.fest': 'assets/scenes/story_fest.webp',
  'story.morning': 'assets/scenes/story_morning.webp',
  'story.trail': 'assets/scenes/story_trail.webp',
  'story.hall': 'assets/scenes/story_hall.webp',
  // Yılbaşı akşamı hikâyesi (Gemini). Dosya yoksa story.js eski resme düşer.
  'story.dinner_girl': 'assets/story/dinner_girl.webp', 'story.dinner_boy': 'assets/story/dinner_boy.webp',
  'story.window': 'assets/story/window.webp', 'story.grab': 'assets/story/grab.webp',
  'story.shock_girl': 'assets/story/shock_girl.webp', 'story.shock_boy': 'assets/story/shock_boy.webp',
  // Kunduz Usta: ev inşasında yardımcı
  'usta.wave': 'assets/usta/wave.webp', 'usta.talk': 'assets/usta/talk.webp', 'usta.hammer': 'assets/usta/hammer.webp',
  'usta.worried': 'assets/usta/worried.webp', 'usta.cheer': 'assets/usta/cheer.webp', 'usta.think': 'assets/usta/think.webp'
};

// Yazılmayan her görsel bu kuraldan bulunur: 'item.x' -> assets/items/x.svg
CZ.FOLDERS = {
  item: 'items', zibo: 'zibo', avatar: 'avatar', scene: 'scenes', story: 'story', village: 'village', ui: 'ui', gold: 'gold'
};

CZ.ITEMS3D = new Set(["bell_gold_blue", "bell_gold_green", "bell_gold_red", "bell_silver_blue", "bell_silver_red", "box_blue", "box_green", "box_purple", "box_red", "box_red_silver", "candle_red", "candle_white", "cane_green", "cane_red", "cookie_bell", "cookie_heart", "cookie_star", "cookie_star_iced", "cookie_tree", "cookies", "crown_gold", "crown_gold_blue", "crown_gold_green", "crown_gold_mixed", "crown_silver", "cup_bronze", "cup_gold", "cup_gold_star", "cup_gold_tall", "cup_silver", "cupcake_blue", "cupcake_choco", "cupcake_mint", "cupcake_pink", "cupcake_pink_cherry", "gift_blue_gold", "gift_gold_red", "gift_green_red", "gift_purple_gold", "gift_purple_orange", "gift_purple_silver", "gift_red_green", "ginger_bow", "ginger_bow_blue", "ginger_bow_pink", "ginger_buttons", "ginger_scarf", "globe_house", "globe_snowman", "globe_snowman_bare", "globe_star", "globe_tree", "hat_blue", "hat_green", "hat_purple", "hat_santa", "hat_santa_striped", "horse_blue", "horse_brown", "horse_red", "horse_red_spots", "horse_white", "jar_candy_green", "jar_candy_mixed", "jar_candy_red", "jar_candy_red_blue", "jar_cookie", "lantern_brass", "lantern_brass_off", "lantern_green", "lantern_red", "lantern_silver", "mini_tree", "mitten_blue", "mitten_green", "mitten_red", "mug_blue", "mug_green", "mug_red", "mug_red_striped", "mug_white", "musicbox_blue", "musicbox_gold", "musicbox_green", "musicbox_red", "musicbox_red_open", "nutcracker_blue", "nutcracker_green", "nutcracker_red", "nutcracker_red_blue", "ornament_blue_star", "ornament_gold_star", "ornament_green_dots", "ornament_red_dots", "ornament_red_star", "ornament_red_stripes", "ornament_silver_stripes", "pie_apple", "pie_blueberry", "pie_cherry", "pie_cherry_lattice", "pie_pumpkin", "pinecone", "present_bell", "present_plain", "present_star", "present_star_blue", "present_star_red", "ring_diamond", "ring_emerald", "ring_ruby", "ring_ruby_silver", "ring_sapphire", "robot_blue", "robot_gold", "robot_silver", "robot_silver_plain", "robot_silver_red", "sled_blue", "sled_green", "sled_red", "sled_red_striped", "sled_wood", "star_gold", "star_silver", "stocking_blue", "stocking_green", "stocking_green_striped", "stocking_red", "stocking_red_striped", "teapot_blue", "teapot_green", "teapot_red", "teapot_red_dots", "teapot_white", "teddy_brown", "teddy_white", "train_blue", "train_green", "train_red", "train_red_silver", "train_yellow", "watch_bronze", "watch_gold", "watch_gold_blue", "watch_gold_red", "watch_silver", "wreath"]);

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
