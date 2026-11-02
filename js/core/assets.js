// GÖRSEL KAYDI — gerçek görselleri buradan bağlarsın.
// Çoğu durumda: dosyayı assets/ altına koy, aşağıdaki OVERRIDES'a bir satır ekle. Hepsi bu.
// Örnek:  'item.ornament_red_star': 'assets/items/ornament_red_star.png',
window.CZ = window.CZ || {};

CZ.OVERRIDES = {
  // Zibo'nun Gemini çizimleri. Eksik pozlar gelene kadar en yakın poz kullanılır.
  'zibo.idle': 'assets/zibo/png/smug.webp',
  'zibo.blink': 'assets/zibo/png/smug.webp',
  'zibo.smug': 'assets/zibo/png/smug.webp',
  'zibo.laugh': 'assets/zibo/png/laugh.webp',
  'zibo.mad': 'assets/zibo/png/smug.webp',
  'zibo.nervous': 'assets/zibo/png/smug.webp',
  'zibo.tantrum': 'assets/zibo/png/laugh.webp',
  'zibo.tongue': 'assets/zibo/png/run_tongue.webp',
  'zibo.run1': 'assets/zibo/png/run_tongue.webp',
  'zibo.run2': 'assets/zibo/png/run_tongue.webp',
  'zibo.runLoot': 'assets/zibo/png/run_loot.webp'
};

// Yazılmayan her görsel bu kuraldan bulunur: 'item.x' -> assets/items/x.svg
CZ.FOLDERS = {
  item: 'items', zibo: 'zibo', avatar: 'avatar', scene: 'scenes', story: 'story', village: 'village', ui: 'ui', gold: 'gold'
};

CZ.art = function (key) {
  if (CZ.OVERRIDES[key]) return CZ.OVERRIDES[key];
  const dot = key.indexOf('.');
  return 'assets/' + CZ.FOLDERS[key.slice(0, dot)] + '/' + key.slice(dot + 1) + '.svg';
};
