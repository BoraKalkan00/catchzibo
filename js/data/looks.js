// KARAKTER KATALOĞU (Bitmoji tarzı). Her eşya: id, r (nadirlik), g (yalnız 'boy' ya da 'girl' için), unlock (başarıyla açılır).
// Nadirlik ve fiyat (elmas): F bedava, C sıradan, R nadir, E epik, L efsanevi.
// Hesap: aktif oyuncu günde ~30-40 elmas kazanır → tüm katalog ~3 ay.
CZ.RARITY = { F: 0, C: 30, R: 80, E: 180, L: 450 };

CZ.PALETTE = {
  skin: ['#fbe0c6', '#f6d2ae', '#ecc29a', '#d9a57a', '#c08a5e', '#a06a44', '#7d4e30', '#5a3721', '#8fd16a'],
  hair: ['#2a1d16', '#4a2f1f', '#7a4a26', '#a8683a', '#d9a75a', '#f0d48a', '#b23a2a', '#e06a2a', '#f4f6fa', '#9aa3b2', '#e8598c', '#7b4bb3', '#3f8fd6', '#3aa66a'],
  eyes: ['#3b2a20', '#6b4426', '#2f7fd6', '#3aa66a', '#7a8aa0', '#7b4bb3', '#d8363a', '#e0a92c'],
  cloth: ['#d8363a', '#2f7fd6', '#2fa35a', '#f2b632', '#7b4bb3', '#e8598c', '#2b2f3b', '#f4f6fa', '#8a5631', '#3fb6c8', '#f08a2c', '#9aa3b2']
};

CZ.CATALOG = {
  // Vücut
  body: [{ id: 'slim', r: 'F' }, { id: 'mid', r: 'F' }, { id: 'broad', r: 'F' }],
  height: [{ id: 'short', r: 'F' }, { id: 'mid', r: 'F' }, { id: 'tall', r: 'F' }],
  // Yüz
  face: [{ id: 'round', r: 'F' }, { id: 'oval', r: 'F' }, { id: 'heart', r: 'F' }, { id: 'square', r: 'F' }, { id: 'long', r: 'F' }],
  eyes: [{ id: 'almond', r: 'F' }, { id: 'round', r: 'F' }, { id: 'hooded', r: 'F' }, { id: 'wide', r: 'C' }, { id: 'sleepy', r: 'C' }, { id: 'happy', r: 'C' }, { id: 'starry', r: 'R' }],
  brows: [{ id: 'natural', r: 'F' }, { id: 'thick', r: 'F' }, { id: 'thin', r: 'F' }, { id: 'straight', r: 'F' }, { id: 'angry', r: 'C' }, { id: 'raised', r: 'C' }],
  nose: [{ id: 'button', r: 'F' }, { id: 'small', r: 'F' }, { id: 'wide', r: 'F' }, { id: 'pointy', r: 'F' }, { id: 'round', r: 'F' }],
  mouth: [{ id: 'smile', r: 'F' }, { id: 'grin', r: 'F' }, { id: 'neutral', r: 'F' }, { id: 'smirk', r: 'C' }, { id: 'laugh', r: 'C' }, { id: 'tongue', r: 'R' }],
  beard: [{ id: 'none', r: 'F' }, { id: 'stubble', r: 'C', g: 'boy' }, { id: 'mustache', r: 'C' }, { id: 'goatee', r: 'R', g: 'boy' }, { id: 'full', r: 'R', g: 'boy' }],
  makeup: [{ id: 'none', r: 'F' }, { id: 'blush', r: 'F' }, { id: 'freckles', r: 'F' }, { id: 'mole', r: 'F' }, { id: 'liner', r: 'C' }, { id: 'lipstick', r: 'C' }, { id: 'zibo', r: 'E' }],
  // Saç: kız ve erkek modelleri ayrı
  hair: [
    { id: 'crop', r: 'F', g: 'boy' }, { id: 'buzz', r: 'F', g: 'boy' }, { id: 'sidepart', r: 'F', g: 'boy' }, { id: 'quiff', r: 'C', g: 'boy' },
    { id: 'spiky', r: 'C', g: 'boy' }, { id: 'curlytop', r: 'C', g: 'boy' }, { id: 'afro', r: 'R', g: 'boy' }, { id: 'surfer', r: 'R', g: 'boy' },
    { id: 'manbun', r: 'R', g: 'boy' }, { id: 'mohawk', r: 'E', g: 'boy' }, { id: 'bald', r: 'C', g: 'boy' },
    { id: 'long', r: 'F', g: 'girl' }, { id: 'bob', r: 'F', g: 'girl' }, { id: 'pony', r: 'F', g: 'girl' }, { id: 'wavy', r: 'C', g: 'girl' },
    { id: 'pixie', r: 'C', g: 'girl' }, { id: 'buns', r: 'C', g: 'girl' }, { id: 'braids', r: 'R', g: 'girl' }, { id: 'curly', r: 'R', g: 'girl' },
    { id: 'side', r: 'R', g: 'girl' }, { id: 'twintails', r: 'E', g: 'girl' }],
  // Kıyafet
  top: [{ id: 'tshirt', r: 'F' }, { id: 'hoodie', r: 'F' }, { id: 'sweater', r: 'C' }, { id: 'puffer', r: 'C' }, { id: 'shirt', r: 'C' }, { id: 'jersey', r: 'R' }, { id: 'xmas', r: 'R' }, { id: 'leather', r: 'E' }],
  bottom: [{ id: 'jeans', r: 'F' }, { id: 'joggers', r: 'F' }, { id: 'shorts', r: 'C' }, { id: 'skirt', r: 'C', g: 'girl' }, { id: 'cargo', r: 'R' }],
  shoes: [{ id: 'sneakers', r: 'F' }, { id: 'boots', r: 'F' }, { id: 'hightops', r: 'C' }, { id: 'snow', r: 'R' }, { id: 'gold', r: 'L' }],
  costume: [{ id: 'none', r: 'F' }, { id: 'raven', r: 'E' }, { id: 'santa', r: 'E' }, { id: 'dragon', r: 'L' }, { id: 'zibo', r: 'L', unlock: { chase: 25 } }],
  // Aksesuar
  hat: [{ id: 'none', r: 'F' }, { id: 'beanie', r: 'F' }, { id: 'cap', r: 'C' }, { id: 'backcap', r: 'C' }, { id: 'hijab', r: 'F', g: 'girl' }, { id: 'catears', r: 'R' },
    { id: 'headphones', r: 'R' }, { id: 'santa', r: 'R' }, { id: 'crown', r: 'L', unlock: { house: 60 } }],
  glasses: [{ id: 'none', r: 'F' }, { id: 'round', r: 'C' }, { id: 'square', r: 'C' }, { id: 'sun', r: 'R' }, { id: 'star', r: 'E' }, { id: 'ski', r: 'R' }],
  earrings: [{ id: 'none', r: 'F' }, { id: 'studs', r: 'C' }, { id: 'hoops', r: 'C' }],
  neck: [{ id: 'none', r: 'F' }, { id: 'scarf', r: 'F' }, { id: 'chain', r: 'R' }, { id: 'medal', r: 'L', unlock: { goldBest: 200 } }],
  back: [{ id: 'none', r: 'F' }, { id: 'backpack', r: 'C' }, { id: 'cape', r: 'E' }, { id: 'wings', r: 'L' }],
  // Hareketler
  emote: [{ id: 'idle', r: 'F' }, { id: 'wave', r: 'F' }, { id: 'cheer', r: 'C' }, { id: 'dance', r: 'R' }, { id: 'dab', r: 'E' }, { id: 'zibo', r: 'L', unlock: { chase: 10 } }]
};

// Renk seçilebilen eşyalar: katalog anahtarı → renk anahtarı
CZ.COLOR_OF = { hair: 'hairColor', top: 'topColor', bottom: 'bottomColor', shoes: 'shoeColor', skin: 'skin', eyes: 'eyeColor' };

// Gardırop: üst gruplar ve alt bölümler
CZ.WARD_GROUPS = [
  { id: 'body', parts: ['skin', 'body', 'height'] },
  { id: 'face', parts: ['face', 'eyes', 'brows', 'nose', 'mouth', 'beard', 'makeup'] },
  { id: 'hair', parts: ['hair'] },
  { id: 'outfit', parts: ['top', 'bottom', 'shoes', 'costume'] },
  { id: 'acc', parts: ['hat', 'glasses', 'earrings', 'neck', 'back'] },
  { id: 'emote', parts: ['emote'] }
];

// Varsayılan karakterler
CZ.LOOK_DEFAULT = {
  boy: { body: 'mid', height: 'mid', skin: 1, face: 'square', eyes: 'almond', eyeColor: 0, brows: 'thick', nose: 'button', mouth: 'smile', beard: 'none', makeup: 'none',
    hair: 'crop', hairColor: 1, top: 'puffer', topColor: 1, bottom: 'jeans', bottomColor: 1, shoes: 'sneakers', shoeColor: 7, costume: 'none',
    hat: 'none', glasses: 'none', earrings: 'none', neck: 'scarf', back: 'none', emote: 'wave' },
  girl: { body: 'mid', height: 'mid', skin: 1, face: 'heart', eyes: 'almond', eyeColor: 1, brows: 'natural', nose: 'small', mouth: 'smile', beard: 'none', makeup: 'blush',
    hair: 'long', hairColor: 2, top: 'puffer', topColor: 5, bottom: 'joggers', bottomColor: 6, shoes: 'boots', shoeColor: 8, costume: 'none',
    hat: 'none', glasses: 'none', earrings: 'studs', neck: 'scarf', back: 'none', emote: 'wave' }
};

// Kostüm güçleri (Altın Avı)
CZ.COSTUME_PERKS = { raven: { goldMul: 1.1 }, dragon: { trapMul: 0.5 }, santa: { bonusSeconds: 3 }, zibo: { trapDelay: 8 } };
