// REKORUNU PAYLAŞ: 1080x1920 dikey kart (TikTok/Reels/Shorts ölçüsü) çizer, telefonun paylaş menüsünü açar.
// Paylaşım yoksa resmi indirir. Arkadaşlar arasında "geç beni" yarışı = bedava reklam.
CZ.share = (function () {
  const load = src => new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });

  function outlined(x, text, px, cx, y, fill) {
    x.font = `800 ${px}px "Baloo Game", "Fredoka", sans-serif`;
    x.textAlign = 'center';
    x.lineJoin = 'round';
    x.lineWidth = px * 0.16;
    x.strokeStyle = '#22140e';
    x.strokeText(text, cx, y);
    x.fillStyle = fill || '#fff';
    x.fillText(text, cx, y);
  }

  // info: { big: '12.450', label: 'PUAN', line: 'x7 kombo', avatar: 'boy' }
  async function card(info) {
    const W = 1080, H = 1920;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d');
    const bg = await load(CZ.art('story.fest')) || await load(CZ.art('story.1'));
    if (bg) {
      const s = Math.max(W / bg.width, H / bg.height);
      x.drawImage(bg, (W - bg.width * s) / 2, (H - bg.height * s) / 2, bg.width * s, bg.height * s);
    }
    const grd = x.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, 'rgba(10,14,40,.55)'); grd.addColorStop(.45, 'rgba(10,14,40,.1)'); grd.addColorStop(1, 'rgba(10,14,40,.8)');
    x.fillStyle = grd; x.fillRect(0, 0, W, H);
    outlined(x, 'CATCH ZIBO!', 120, W / 2, 200, '#8be95a');
    const hero = await load(CZ.charArt ? CZ.charArt.url(info.avatar || 'girl', 'front') : '');
    const zibo = await load(CZ.art('zibo.laugh'));
    if (hero) { const hh = 820, ww = hh * hero.width / hero.height; x.drawImage(hero, W * 0.3 - ww / 2, 470, ww, hh); }
    if (zibo) { const hh = 560, ww = hh * zibo.width / zibo.height; x.drawImage(zibo, W * 0.74 - ww / 2, 640, ww, hh); }
    outlined(x, info.label || '', 64, W / 2, 1420, '#ffe27a');
    outlined(x, info.big || '', 190, W / 2, 1600, '#fff');
    if (info.line) outlined(x, info.line, 64, W / 2, 1700, '#9fdcff');
    outlined(x, CZ.t('share.beat'), 72, W / 2, 1830, '#ff8a7a');
    return c;
  }

  async function share(info) {
    const c = await card(info);
    const blob = await new Promise(r => c.toBlob(r, 'image/png'));
    const file = new File([blob], 'catch-zibo.png', { type: 'image/png' });
    const text = (info.text || CZ.t('share.text', { n: info.big })) + (info.url ? '\n' + info.url : '');
    // Telefonda (APK): Capacitor paylaş menüsü, resimle birlikte
    const P = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform() && window.Capacitor.Plugins;
    if (P && P.Share) {
      try {
        let files;
        if (P.Filesystem) {
          const data = c.toDataURL('image/png').split(',')[1];
          const w = await P.Filesystem.writeFile({ path: 'catch-zibo.png', data, directory: 'CACHE' });
          files = [w.uri];
        }
        await P.Share.share(Object.assign({ title: 'Catch Zibo!', text, dialogTitle: 'Catch Zibo!' }, info.url ? { url: info.url } : {}, files ? { files } : {}));
        return;
      } catch (e) {
        if (e && /cancel/i.test(e.message || '')) return;
        try { await P.Share.share({ title: 'Catch Zibo!', text, url: info.url }); return; } catch (e2) { /* tarayıcı yoluna düş */ }
      }
    }
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text });
        return;
      }
      // resimsiz paylaşım (link yeter)
      if (info.url && navigator.share) { await navigator.share({ text, url: info.url }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    // Link varsa panoya kopyala
    if (info.url) { try { await navigator.clipboard.writeText(text); CZ.ui.toast(CZ.t('chal.copied')); return; } catch (e) { /* olmazsa resmi indir */ } }
    // Paylaşım yoksa indir
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'catch-zibo.png';
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    CZ.ui.toast(CZ.t('share.saved'));
  }
  return { card, share };
})();
