// Oyuna "PC sürümündesin" bilgisini verir (reklam yok, gerçek para mağazası yok).
const { contextBridge } = require('electron');
contextBridge.exposeInMainWorld('CZ_DESKTOP', { platform: 'pc', steam: false });
