// Oyunun kendi ikonları (emoji yerine). Kalın koyu kontur + parlak dolgu = "çıkartma" oyun stili.
// Kullanım: CZ.icon('flame', 'ek-sınıf') → <span class="ic">…svg…</span>
(function () {
  const O = '#2b1a14'; // kontur
  const W = 'stroke="' + O + '" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"';
  const shine = (x, y, w, h, r) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="#fff" opacity=".55"/>`;
  const G = (id, a, b) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
  const SVG = {
    lens: `${G('gl1', '#ffe48a', '#f0a91b')}${G('gl2', '#e8f8ff', '#8fd3ff')}
      <path d="M60 62 L86 88" ${W} stroke-width="16"/><path d="M60 62 L86 88" stroke="#a0522d" stroke-width="9" stroke-linecap="round"/>
      <circle cx="42" cy="42" r="30" fill="url(#gl1)" ${W}/><circle cx="42" cy="42" r="20" fill="url(#gl2)" ${W} stroke-width="4"/>
      <path d="M30 34 q6-10 16-10" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>`,
    cocoa: `${G('gc1', '#ff6b5e', '#c8242e')}
      <path d="M70 44 q20 0 20 16 t-20 16" fill="none" ${W} stroke-width="12"/><path d="M70 44 q20 0 20 16 t-20 16" fill="none" stroke="#e8423a" stroke-width="6"/>
      <path d="M14 36 h60 v40 q0 16-16 16 h-28 q-16 0-16-16z" fill="url(#gc1)" ${W}/>
      <ellipse cx="44" cy="36" rx="30" ry="8" fill="#6b3a1f" ${W} stroke-width="4"/>
      <circle cx="34" cy="31" r="7" fill="#fff" ${W} stroke-width="3"/><circle cx="50" cy="29" r="8" fill="#fff" ${W} stroke-width="3"/>
      <path d="M22 50 v18" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".6"/>
      <path d="M34 20 q-6-8 0-14 M50 18 q-6-8 0-14" stroke="#fff" stroke-width="3" fill="none" opacity=".8"/>`,
    sled: `${G('gs1', '#ff6b5e', '#b81d27')}
      <path d="M8 76 h70 q14 0 14-14" fill="none" ${W} stroke-width="11"/><path d="M8 76 h70 q14 0 14-14" fill="none" stroke="#ffd34a" stroke-width="5"/>
      <path d="M24 76 v-14 M64 76 v-14" ${W} stroke-width="8"/>
      <path d="M12 38 h62 q10 0 10 10 v14 h-72z" fill="url(#gs1)" ${W}/>${shine(20, 42, 44, 6, 3)}`,
    flame: `${G('gf1', '#ffd34a', '#ff5a1f')}${G('gf2', '#fff6c2', '#ffc23a')}
      <path d="M50 6 q8 22 24 34 q14 12 12 30 q-2 24-36 26 q-34-2-36-26 q-2-16 12-26 q2 12 10 14 q-6-30 14-52z" fill="url(#gf1)" ${W}/>
      <path d="M50 46 q14 14 12 28 q-2 12-12 12 q-12 0-12-12 q0-14 12-28z" fill="url(#gf2)"/>`,
    crown: `${G('gk1', '#ffe48a', '#e09a0a')}
      <path d="M10 76 L16 28 L34 50 L50 18 L66 50 L84 28 L90 76z" fill="url(#gk1)" ${W}/>
      <rect x="10" y="72" width="80" height="14" rx="5" fill="#e09a0a" ${W}/>
      <circle cx="50" cy="60" r="7" fill="#e8423a" ${W} stroke-width="3"/><circle cx="30" cy="64" r="5" fill="#3aa0ff" ${W} stroke-width="3"/><circle cx="70" cy="64" r="5" fill="#3aa0ff" ${W} stroke-width="3"/>`,
    trophy: `${G('gt1', '#ffe48a', '#e09a0a')}
      <path d="M26 20 q-18 0-16 16 q2 16 20 18 M74 20 q18 0 16 16 q-2 16-20 18" fill="none" ${W} stroke-width="9"/><path d="M26 20 q-18 0-16 16 q2 16 20 18 M74 20 q18 0 16 16 q-2 16-20 18" fill="none" stroke="#f5c242" stroke-width="4"/>
      <path d="M24 12 h52 v24 q0 26-26 28 q-26-2-26-28z" fill="url(#gt1)" ${W}/>
      <path d="M44 62 h12 v12 h-12z" fill="#e09a0a" ${W} stroke-width="4"/><rect x="28" y="74" width="44" height="14" rx="4" fill="#8a4b22" ${W}/>${shine(32, 18, 8, 26, 4)}`,
    moon: `${G('gm1', '#fff3b0', '#ffc93a')}
      <path d="M62 10 a40 40 0 1 0 28 62 a32 32 0 1 1 -28 -62z" fill="url(#gm1)" ${W}/>
      <path d="M78 16 l3 7 7 3 -7 3 -3 7 -3-7 -7-3 7-3z" fill="#fff" ${W} stroke-width="2.5"/>`,
    goblin: `${G('gg1', '#9be05a', '#3f9b2b')}
      <path d="M22 44 L2 30 L18 56 M78 44 L98 30 L82 56" fill="#7cc84a" ${W}/>
      <ellipse cx="50" cy="54" rx="32" ry="34" fill="url(#gg1)" ${W}/>
      <ellipse cx="38" cy="48" rx="8" ry="9" fill="#fff" ${W} stroke-width="3"/><ellipse cx="62" cy="48" rx="8" ry="9" fill="#fff" ${W} stroke-width="3"/>
      <circle cx="40" cy="50" r="4" fill="${O}"/><circle cx="60" cy="50" r="4" fill="${O}"/>
      <path d="M34 70 q16 12 32 0" fill="#7a1f2a" ${W} stroke-width="4"/>
      <path d="M28 24 q22-20 44 0 l-6 6 q-16-12-32 0z" fill="#e8423a" ${W} stroke-width="4"/><circle cx="76" cy="18" r="7" fill="#fff" ${W} stroke-width="3"/>`,
    gift: `${G('gp1', '#5fd0ff', '#1f7fd6')}
      <rect x="12" y="40" width="76" height="48" rx="6" fill="url(#gp1)" ${W}/><rect x="8" y="28" width="84" height="18" rx="5" fill="#3aa8f0" ${W}/>
      <path d="M50 28 v60" ${W} stroke-width="14"/><path d="M50 28 v60" stroke="#ffd34a" stroke-width="8"/>
      <path d="M50 28 q-26-26-26-4 q0 6 26 4 q26 2 26-4 q0-22-26 4z" fill="#ffd34a" ${W} stroke-width="4"/>`,
    lock: `${G('glk', '#ffe48a', '#e09a0a')}
      <path d="M30 44 v-12 a20 20 0 0 1 40 0 v12" fill="none" ${W} stroke-width="12"/><path d="M30 44 v-12 a20 20 0 0 1 40 0 v12" fill="none" stroke="#c9ced8" stroke-width="6"/>
      <rect x="18" y="42" width="64" height="48" rx="10" fill="url(#glk)" ${W}/><circle cx="50" cy="62" r="6" fill="${O}"/><path d="M50 64 v12" stroke="${O}" stroke-width="6" stroke-linecap="round"/>`,
    check: `<circle cx="50" cy="50" r="40" fill="#3ccf5e" ${W}/><path d="M30 52 l14 14 l26-30" fill="none" stroke="#fff" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>`,
    play: `<path d="M28 14 L84 50 L28 86z" fill="#fff" ${W}/>`,
    up: `<path d="M50 8 L88 48 H66 V90 H34 V48 H12z" fill="#3ccf5e" ${W}/>${shine(40, 50, 8, 32, 4)}`,
    heart: `<path d="M50 88 L14 52 q-14-16 0-32 q16-14 36 6 q20-20 36-6 q14 16 0 32z" fill="#ff4d5e" ${W}/>${shine(22, 26, 14, 8, 4)}`,
    magnet: `<path d="M18 16 v38 a32 32 0 0 0 64 0 v-38 h-22 v38 a10 10 0 0 1 -20 0 v-38z" fill="#e8423a" ${W}/><path d="M18 16 h22 v14 h-22z M60 16 h22 v14 h-22z" fill="#d9dde6" ${W} stroke-width="4"/>`,
    target: `<circle cx="50" cy="50" r="40" fill="#fff" ${W}/><circle cx="50" cy="50" r="28" fill="#e8423a" ${W} stroke-width="3"/><circle cx="50" cy="50" r="15" fill="#fff" ${W} stroke-width="3"/><circle cx="50" cy="50" r="6" fill="#e8423a"/>`,
    snowflake: `<g ${W} stroke-width="9"><path d="M50 8 V92 M14 29 L86 71 M14 71 L86 29"/></g><g stroke="#bfe8ff" stroke-width="4" stroke-linecap="round"><path d="M50 8 V92 M14 29 L86 71 M14 71 L86 29"/></g>`,
    list: `${G('gq1', '#fff4d6', '#e9d3a3')}<rect x="16" y="12" width="68" height="80" rx="8" fill="url(#gq1)" ${W}/><rect x="34" y="6" width="32" height="14" rx="5" fill="#a0522d" ${W} stroke-width="4"/><path d="M30 40 h40 M30 56 h40 M30 72 h26" stroke="${O}" stroke-width="5" stroke-linecap="round"/>`,
    star: `<path d="M50 6 l13 28 30 4 -22 21 6 30 -27-15 -27 15 6-30 -22-21 30-4z" fill="#ffd34a" ${W}/>`,
    hammer: `<path d="M50 40 L80 90" ${W} stroke-width="16"/><path d="M50 40 L80 90" stroke="#c98a4b" stroke-width="9" stroke-linecap="round"/><path d="M14 30 L54 8 L66 30 L26 52z" fill="#9aa3b5" ${W}/>`,
    shield: `<path d="M50 6 L86 18 V48 q0 28-36 44 q-36-16-36-44 V18z" fill="#3aa0ff" ${W}/><path d="M50 20 V82" stroke="#fff" stroke-width="6" opacity=".5"/>`,
    mask: `<path d="M50 6 L86 18 V48 q0 28-36 44 q-36-16-36-44 V18z" fill="#3aa0ff" ${W}/>`
  };
  CZ.ICONS = SVG;
  CZ.icon = function (name, cls) {
    const span = document.createElement('span');
    span.className = 'ic ic-' + name + (cls ? ' ' + cls : '');
    span.setAttribute('aria-hidden', 'true');
    span.innerHTML = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${SVG[name] || ''}</svg>`;
    return span;
  };
})();
