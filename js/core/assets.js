// GÖRSEL KAYDI — gerçek görselleri buradan bağlarsın.
// Çoğu durumda: dosyayı assets/ altına koy, aşağıdaki OVERRIDES'a bir satır ekle. Hepsi bu.
// Örnek:  'item.ornament_red_star': 'assets/items/ornament_red_star.png',
window.CZ = window.CZ || {};

CZ.OVERRIDES = {
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
