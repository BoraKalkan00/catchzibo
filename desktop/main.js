// Zibo's Raid — Masaüstü (Steam) sarmalayıcısı. Oyunu yerel dosyadan açar; internet gerekmez.
const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
app.commandLine.appendSwitch('ignore-gpu-blocklist');   // eski ekran kartlarında da WebGL açılsın
function create() {
  const win = new BrowserWindow({
    width: 1280, height: 720, minWidth: 960, minHeight: 540, backgroundColor: '#14233c', show: false,
    title: "Zibo's Raid", autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, backgroundThrottling: false }
  });
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, 'game', 'index.html'), { query: { platform: 'pc' } });
  win.once('ready-to-show', () => win.show());
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });   // gizlilik sayfası vb. tarayıcıda açılsın
  win.webContents.on('before-input-event', (e, input) => { if (input.type === 'keyDown' && (input.key === 'F11' || (input.alt && input.key === 'Enter'))) { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); } });
}
app.whenReady().then(create);
app.on('window-all-closed', () => app.quit());
