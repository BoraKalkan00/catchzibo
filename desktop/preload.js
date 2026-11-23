// Oyuna "PC sürümündesin" bilgisini verir (reklam yok, gerçek para mağazası yok) + Steam başarımı ve bulut kayıt köprüsü.
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('CZ_DESKTOP', {
  platform: 'pc',
  steam: ipcRenderer.sendSync('steamOn'),
  achieve: id => ipcRenderer.send('achieve', String(id)),
  saveRead: () => ipcRenderer.sendSync('saveRead'),
  saveWrite: txt => ipcRenderer.send('saveWrite', String(txt))
});
