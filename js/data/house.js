// EVİM: adım adım ev inşası. Her şey altınla: önce malzeme alınır, sonra parça yapılır.
// Ev seviyesi = bütün parça seviyeleri + odalar + eşyalar + boyalar.

// Malzeme paketleri (altınla). Örnek: 20 tuğla = 100 altın, 1 duvar = 20 tuğla.
CZ.MATS = [
  { id: 'brick', pack: 20, price: 100 },
  { id: 'wood', pack: 20, price: 80 },
  { id: 'stone', pack: 20, price: 160 },
  { id: 'glass', pack: 10, price: 120 },
  { id: 'tile', pack: 20, price: 150 }
];

// Yeni oyuncuya başlangıç: ilk adımlar hemen yapılabilsin.
CZ.HOUSE_START = { stone: 20, brick: 40, wood: 15 };

// Dış parçalar. levels[i] = (i+1). seviyenin bedeli. need = önce yapılması gerekenler.
// def = Zibo baskınlarına karşı savunma puanı (seviye başına).
CZ.PARTS = [
  { id: 'found', levels: [{ stone: 20 }] },
  { id: 'wall1', need: { found: 1 }, levels: [{ brick: 20 }] },
  { id: 'wall2', need: { found: 1 }, levels: [{ brick: 20 }] },
  { id: 'wall3', need: { found: 1 }, levels: [{ brick: 20 }] },
  { id: 'wall4', need: { found: 1 }, levels: [{ brick: 20 }] },
  { id: 'door', need: { wall3: 1 }, def: 3, levels: [
    { wood: 15 }, { wood: 20, gold: 100 }, { wood: 10, stone: 10, gold: 200 }, { stone: 20, gold: 350 }, { stone: 30, brick: 10, gold: 600 }] },
  { id: 'win', need: { wall3: 1, wall4: 1 }, def: 2, levels: [
    { glass: 10, wood: 5 }, { wood: 15, gold: 100 }, { stone: 10, gold: 250 }, { glass: 10, stone: 15, gold: 450 }] },
  { id: 'roof', need: { wall1: 1, wall2: 1, wall3: 1, wall4: 1 }, levels: [
    { tile: 30, wood: 10 }, { tile: 30, gold: 150 }, { tile: 40, gold: 300 }] },
  { id: 'walls', need: { roof: 1 }, def: 2, levels: [
    { brick: 30, gold: 60 }, { brick: 30, stone: 10, gold: 150 }, { stone: 30, gold: 300 }] },
  { id: 'chimney', need: { roof: 1 }, levels: [{ brick: 10 }, { brick: 20, gold: 120 }] },
  { id: 'fence', need: { found: 1 }, def: 2, levels: [
    { wood: 20 }, { wood: 30, gold: 100 }, { stone: 30, gold: 250 }, { stone: 20, brick: 20, gold: 450 }] },
  { id: 'garden', need: { found: 1 }, levels: [{ gold: 80 }, { gold: 150 }, { gold: 250 }, { gold: 400 }] },
  { id: 'lights', need: { roof: 1 }, levels: [{ gold: 100 }, { gold: 200 }, { gold: 350 }] }
];

// Odalar: ev büyür. Salon çatı bitince bedava gelir.
CZ.HROOMS = [
  { id: 'living', free: true, need: { roof: 1 },
    furn: ['sofa', 'tv', 'rug', 'lamp', 'xmas', 'shelf'] },
  { id: 'bedroom', need: { roof: 1 }, cost: { brick: 40, wood: 20, tile: 15, gold: 200 },
    furn: ['bed', 'wardrobe', 'night', 'rug', 'desk', 'poster'] },
  { id: 'kitchen', need: { room: 'bedroom' }, cost: { brick: 50, wood: 20, tile: 20, glass: 5, gold: 300 },
    furn: ['fridge', 'stove', 'table', 'counter', 'plant'] },
  { id: 'bath', need: { room: 'kitchen' }, cost: { brick: 50, tile: 25, glass: 5, gold: 400 },
    furn: ['tub', 'sink', 'mirror', 'toilet', 'towel'] },
  { id: 'play', need: { room: 'bath' }, cost: { brick: 70, wood: 30, tile: 30, glass: 10, gold: 600 },
    furn: ['toybox', 'console', 'beanbag', 'train', 'kite'] }
];

// Eşya fiyatları (altın): 1., 2., 3. kademe.
CZ.FURN = {
  sofa: [120, 260, 480], tv: [150, 320, 600], rug: [60, 140, 260], lamp: [60, 130, 240], xmas: [100, 220, 420], shelf: [90, 200, 380],
  bed: [140, 300, 560], wardrobe: [120, 260, 480], night: [60, 130, 240], desk: [100, 220, 420], poster: [40, 90, 180],
  fridge: [150, 320, 600], stove: [130, 280, 520], table: [90, 200, 380], counter: [100, 220, 420], plant: [40, 90, 180],
  tub: [160, 340, 640], sink: [80, 170, 320], mirror: [60, 130, 240], toilet: [70, 150, 280], towel: [40, 90, 180],
  toybox: [80, 170, 320], console: [180, 380, 700], beanbag: [70, 150, 280], train: [120, 260, 480], kite: [40, 90, 180]
};

// Boyalar: bir kez alınır, sonra istediğin zaman bedava değiştirirsin.
CZ.PAINTS = {
  ext: [
    { id: 'brick', c: '#c4643f', price: 0 }, { id: 'cream', c: '#f1dfb8', price: 150 }, { id: 'sky', c: '#8fc6ea', price: 150 },
    { id: 'mint', c: '#9fdcc0', price: 150 }, { id: 'pink', c: '#f3a7c3', price: 150 }, { id: 'lilac', c: '#b9a3e3', price: 200 },
    { id: 'sun', c: '#f6cf55', price: 200 }, { id: 'snow', c: '#f4f6fa', price: 250 }, { id: 'forest', c: '#4f8a5b', price: 250 }],
  roof: [
    { id: 'red', c: '#c2362f', price: 0 }, { id: 'blue', c: '#2f63b4', price: 120 }, { id: 'green', c: '#2f8a4e', price: 120 },
    { id: 'brown', c: '#7a4a2c', price: 120 }, { id: 'purple', c: '#6b3fa0', price: 180 }, { id: 'gold', c: '#e0a92c', price: 400 }],
  wall: [
    { id: 'cream', c: '#f3e6c8', price: 0 }, { id: 'sky', c: '#bfe0f5', price: 80 }, { id: 'mint', c: '#c6eedb', price: 80 },
    { id: 'pink', c: '#f8cfe0', price: 80 }, { id: 'lilac', c: '#dccff5', price: 100 }, { id: 'sun', c: '#fbe7a1', price: 100 },
    { id: 'night', c: '#3c4a72', price: 150 }, { id: 'red', c: '#e58a7c', price: 150 }],
  floor: [
    { id: 'wood', c: '#b97a47', price: 0 }, { id: 'tile', c: '#dfe5ec', price: 120 }, { id: 'carpet', c: '#7c5bb0', price: 150 },
    { id: 'checker', c: '#33384a', price: 180 }, { id: 'marble', c: '#efe9e1', price: 300 }]
};

// Mahalle: bot komşular. Seviyeleri her gün büyür (base + rate × gün).
CZ.NEIGHBORS = [
  { id: 'mia', base: 9, rate: 3.2, seed: 11 },
  { id: 'leo', base: 15, rate: 2.6, seed: 23 },
  { id: 'elif', base: 22, rate: 2.1, seed: 37 },
  { id: 'can', base: 4, rate: 4.0, seed: 41 },
  { id: 'yuki', base: 31, rate: 1.5, seed: 59 },
  { id: 'noah', base: 46, rate: 1.1, seed: 67 }
];

// Zibo baskını: savunma (kapı, pencere, çit, duvar) saldırıdan büyükse Zibo eli boş döner.
CZ.RAID = {
  attackBase: 5, attackPerDay: 1.1, attackPerLevel: 0.12, attackMax: 40, spread: 4,
  stealShare: 0.15, stealBase: 40, stealPerLevel: 3, minGold: 50,
  bounty: 25 // Zibo savuşturulursa düşürdüğü altın
};
