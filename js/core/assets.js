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
  // Kunduz Usta: ev inşasında yardımcı
  'usta.wave': 'assets/usta/wave.webp', 'usta.talk': 'assets/usta/talk.webp', 'usta.hammer': 'assets/usta/hammer.webp',
  'usta.worried': 'assets/usta/worried.webp', 'usta.cheer': 'assets/usta/cheer.webp', 'usta.think': 'assets/usta/think.webp'
};

// Yazılmayan her görsel bu kuraldan bulunur: 'item.x' -> assets/items/x.svg
CZ.FOLDERS = {
  item: 'items', zibo: 'zibo', avatar: 'avatar', scene: 'scenes', story: 'story', village: 'village', ui: 'ui', gold: 'gold'
};

CZ.art = function (key) {
  if (CZ.OVERRIDES[key]) return CZ.OVERRIDES[key];
  // Oyuncu karakteri renk ve kostüme göre çizilir (js/core/avatar.js).
  if (key.startsWith('avatar.') && CZ.avatarArt) return CZ.avatarArt.url(key.slice(7));
  const dot = key.indexOf('.');
  return 'assets/' + CZ.FOLDERS[key.slice(0, dot)] + '/' + key.slice(dot + 1) + '.svg';
};
