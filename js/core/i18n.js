// Dil sistemi. Yeni dil eklemek için: js/lang/en.js'i kopyala, çevir, index.html'e bir script satırı ekle.
CZ.i18n = (function () {
  const langs = {};
  let current = 'en';

  function register(code, name, strings) {
    langs[code] = { name, strings };
  }

  function t(key, params) {
    const pack = langs[current] ? langs[current].strings : {};
    let text = pack[key];
    if (text === undefined) text = langs.en ? langs.en.strings[key] : undefined;
    if (text === undefined) {
      console.warn('Eksik çeviri: ' + key);
      return key;
    }
    if (params) Object.keys(params).forEach(k => { text = text.split('{' + k + '}').join(params[k]); });
    return text;
  }

  function set(code) {
    if (!langs[code]) return;
    current = code;
    document.documentElement.lang = code;
  }

  // Kayıtlı dil yoksa telefonun dilini kullan; desteklenmiyorsa İngilizce.
  function detect() {
    const list = navigator.languages || [navigator.language || 'en'];
    for (const l of list) {
      const code = String(l).slice(0, 2).toLowerCase();
      if (langs[code]) return code;
    }
    return 'en';
  }

  return {
    register, t, set, detect,
    get current() { return current; },
    get list() { return Object.keys(langs).map(code => ({ code, name: langs[code].name })); },
    keys: code => Object.keys(langs[code].strings)
  };
})();
CZ.t = CZ.i18n.t;
