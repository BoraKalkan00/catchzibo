// KARAKTER RENKLERİ: Gemini çizimlerinde mont / bere / atkı rengini kodla değiştirir.
// Yalnız temiz çıkan parçalar (saç ve ten değişmez: gölgeler bozuluyordu).
// Renk bir kez satın alınır, her karakterde kullanılabilir. Çoğu altınla, bazıları elmasla.
CZ.PART_RULES = {
  // ton aralığı (derece), doygunluk ve açıklık sınırları, görselin üst kısmı (y1) gibi kurallar
  boy: {
    jacket: { hue: [195, 240], smin: 0.3, lmin: 0.08 },
    hat: { hue: [348, 9], smin: 0.4, lmax: 0.6, y1: 0.4 },
    scarf: { hue: [65, 150], smin: 0.18 }
  },
  girl: {
    jacket: { hue: [255, 320], smin: 0.08, lmin: 0.05 },
    hat: { hue: [320, 358], smin: 0.25, y1: 0.34 },
    scarf: { hue: [38, 62], smin: 0.45 }
  }
};
CZ.PART_ORIG = { boy: { jacket: 'blue', hat: 'red', scarf: 'green' }, girl: { jacket: 'purple', hat: 'pink', scarf: 'yellow' } };
// Hedef renk: ton (h), doygunluk çarpanı/ekleme (sk/sa), açıklık çarpanı/ekleme (lk/la). hex: 3D koşucu için.
CZ.COLORS = {
  red: { h: 2, sk: 1.1, sa: 0.12, hex: 0xc8302e },
  green: { h: 128, sk: 0.9, sa: 0.08, hex: 0x3f8a3a },
  blue: { h: 214, sk: 1, sa: 0.1, hex: 0x2f63c4 },
  yellow: { h: 46, sk: 1.3, sa: 0.1, lk: 1.7, hex: 0xe8b82a },
  pink: { h: 330, sk: 0.9, sa: 0.1, lk: 1.35, hex: 0xe0709e },
  purple: { h: 278, sk: 0.9, sa: 0.1, lk: 1.15, hex: 0x8a4cc0 },
  black: { h: 220, sk: 0.15, lk: 0.55, hex: 0x2a2c33 },
  white: { h: 210, sk: 0.12, lk: 1.9, la: 0.12, hex: 0xeef0f4 }
};
// Fiyatlar: { gold } ya da { emeralds }
CZ.COLOR_PRICES = {
  jacket: { red: { gold: 400 }, green: { gold: 400 }, blue: { gold: 400 }, purple: { gold: 500 }, yellow: { gold: 600 }, pink: { gold: 600 }, black: { emeralds: 60 }, white: { emeralds: 60 } },
  hat: { red: { gold: 250 }, green: { gold: 250 }, blue: { gold: 250 }, pink: { gold: 300 }, yellow: { gold: 300 }, purple: { gold: 400 }, black: { emeralds: 30 }, white: { emeralds: 30 } },
  scarf: { red: { gold: 150 }, green: { gold: 150 }, blue: { gold: 150 }, yellow: { gold: 150 }, pink: { gold: 200 }, white: { gold: 300 }, purple: { emeralds: 20 }, black: { emeralds: 20 } }
};

CZ.charArt = (function () {
  const cache = new Map();      // anahtar → dataURL
  const loading = new Map();
  const d = () => CZ.state.data;

  function colorsOf(id) {
    const all = d().charColors || {};
    return all[id] || {};
  }
  function key(id, pose, colors) {
    return id + '_' + pose + '|' + ['jacket', 'hat', 'scarf'].map(p => colors[p] || '').join(',');
  }
  const isPlain = (id, colors) => ['jacket', 'hat', 'scarf'].every(p => !colors[p] || colors[p] === (CZ.PART_ORIG[id] || {})[p]);

  // Piksel piksel HSL dönüşümü (yalnız kuralın tuttuğu pikseller).
  function recolor(img, id, colors) {
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const x = c.getContext('2d');
    x.drawImage(img, 0, 0);
    const data = x.getImageData(0, 0, c.width, c.height);
    const px = data.data;
    const rules = [];
    ['jacket', 'hat', 'scarf'].forEach(p => {
      const target = colors[p] && colors[p] !== CZ.PART_ORIG[id][p] ? CZ.COLORS[colors[p]] : null;
      const r = (CZ.PART_RULES[id] || {})[p];
      if (target && r) rules.push({ r, t: target });
    });
    const H = c.height, W = c.width;
    for (let i = 0; i < px.length; i += 4) {
      if (px[i + 3] < 10) continue;
      const R = px[i] / 255, G = px[i + 1] / 255, B = px[i + 2] / 255;
      const mx = Math.max(R, G, B), mn = Math.min(R, G, B);
      const l = (mx + mn) / 2, dd = mx - mn;
      if (dd === 0) continue;
      const s = dd / (1 - Math.abs(2 * l - 1) + 1e-6);
      let h = mx === R ? (G - B) / dd : mx === G ? 2 + (B - R) / dd : 4 + (R - G) / dd;
      h = ((h / 6) % 1 + 1) % 1 * 360;
      const y = Math.floor(i / 4 / W) / H;
      for (const { r, t } of rules) {
        const [lo, hi] = r.hue;
        const inHue = lo <= hi ? h >= lo && h <= hi : h >= lo || h <= hi;
        if (!inHue || s < (r.smin || 0) || s > (r.smax || 1) || l < (r.lmin || 0) || l > (r.lmax || 1) || y < (r.y0 || 0) || y > (r.y1 || 1)) continue;
        const ns = Math.min(1, Math.max(0, s * (t.sk || 1) + (t.sa || 0)));
        const nl = Math.min(1, Math.max(0, l * (t.lk || 1) + (t.la || 0)));
        const cc = (1 - Math.abs(2 * nl - 1)) * Math.min(1, ns);
        const hp = t.h / 60, xx = cc * (1 - Math.abs(hp % 2 - 1)), m = nl - cc / 2;
        let rr = 0, gg = 0, bb = 0;
        if (hp < 1) { rr = cc; gg = xx; } else if (hp < 2) { rr = xx; gg = cc; } else if (hp < 3) { gg = cc; bb = xx; } else if (hp < 4) { gg = xx; bb = cc; } else if (hp < 5) { rr = xx; bb = cc; } else { rr = cc; bb = xx; }
        px[i] = (rr + m) * 255; px[i + 1] = (gg + m) * 255; px[i + 2] = (bb + m) * 255;
        break;
      }
    }
    x.putImageData(data, 0, 0);
    return c.toDataURL('image/webp', 0.9);
  }

  function build(id, pose, colors) {
    const k = key(id, pose, colors);
    if (cache.has(k)) return Promise.resolve(cache.get(k));
    if (loading.has(k)) return loading.get(k);
    const p = new Promise(ok => {
      const img = new Image();
      img.onload = () => {
        let url = CZ.art('char.' + id + '_' + pose);
        try { url = recolor(img, id, colors); } catch (e) { /* çizilemezse orijinal */ }
        cache.set(k, url);
        loading.delete(k);
        ok(url);
      };
      img.onerror = () => ok(CZ.art('char.' + id + '_' + pose));
      img.src = CZ.art('char.' + id + '_' + pose);
    });
    loading.set(k, p);
    return p;
  }

  // Hemen kullanılabilir adres: hazır değilse orijinali döner, hazır olunca <img data-ck> güncellenir.
  function url(id, pose, colors) {
    colors = colors || colorsOf(id);
    if (!CZ.PART_RULES[id] || isPlain(id, colors)) return CZ.art('char.' + id + '_' + pose);
    const k = key(id, pose, colors);
    if (cache.has(k)) return cache.get(k);
    build(id, pose, colors).then(u => document.querySelectorAll('img[data-ck="' + CSS.escape(k) + '"]').forEach(el => { el.src = u; }));
    return CZ.art('char.' + id + '_' + pose);
  }

  // <img> öğesi: renkli hali gelince kendini günceller.
  function img(id, pose, cls, colors) {
    colors = colors || colorsOf(id);
    const el = document.createElement('img');
    el.className = cls || '';
    el.alt = '';
    el.dataset.ck = key(id, pose, colors);
    el.src = url(id, pose, colors);
    return el;
  }

  // 3D koşucu için renkler
  function hexes(id) {
    const c = colorsOf(id);
    const out = {};
    if (c.jacket) out.jacket = CZ.COLORS[c.jacket].hex;
    if (c.hat) out.hatColor = CZ.COLORS[c.hat].hex;
    if (c.scarf) out.scarf = CZ.COLORS[c.scarf].hex;
    return out;
  }

  const owns = (part, color) => (d().colorsOwned || []).includes(part + '.' + color);
  function equip(id, part, color) {
    if (!d().charColors) d().charColors = {};
    d().charColors[id] = Object.assign({}, d().charColors[id], { [part]: color });
    CZ.state.save();
  }
  function buy(part, color) {
    const price = CZ.COLOR_PRICES[part][color];
    const dd = d();
    if (price.gold && (dd.gold || 0) < price.gold) return 'gold';
    if (price.emeralds && (dd.emeralds || 0) < price.emeralds) return 'emeralds';
    if (price.gold) dd.gold -= price.gold;
    if (price.emeralds) dd.emeralds -= price.emeralds;
    dd.colorsOwned = (dd.colorsOwned || []).concat(part + '.' + color);
    CZ.state.save();
    return 'ok';
  }
  function warm() {
    const id = d().avatar || 'girl';
    ['front', 'wave'].forEach(p => url(id, p));
  }
  return { url, img, hexes, owns, equip, buy, colorsOf, warm };
})();
