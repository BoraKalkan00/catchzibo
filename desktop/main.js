// Zibo's Raid — Masaüstü (Steam) sarmalayıcısı. Oyunu kendi içinden "app://" adresiyle sunar
// (file:// ile fetch/modeller yüklenmez); internet gerekmez.
const { app, BrowserWindow, Menu, shell, protocol, net } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }]);
app.commandLine.appendSwitch('ignore-gpu-blocklist');   // eski ekran kartlarında da WebGL açılsın
const ROOT = path.join(__dirname, 'game');
function create() {
  const win = new BrowserWindow({
    width: 1280, height: 720, minWidth: 960, minHeight: 540, backgroundColor: '#14233c', show: false,
    title: "Zibo's Raid", autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, backgroundThrottling: false }
  });
  Menu.setApplicationMenu(null);
  win.loadURL('app://game/index.html?platform=pc');
  win.once('ready-to-show', () => win.show());
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('before-input-event', (e, input) => { if (input.type === 'keyDown' && (input.key === 'F11' || (input.alt && input.key === 'Enter'))) { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); } });
}
app.whenReady().then(() => {
  protocol.handle('app', req => {
    const u = new URL(req.url); let rel = decodeURIComponent(u.pathname).replace(/^\/+/, '');
    const file = path.normalize(path.join(ROOT, rel));
    if (!file.startsWith(ROOT)) return new Response('no', { status: 403 });
    return net.fetch(pathToFileURL(file).toString());
  });
  create();
});
app.on('window-all-closed', () => app.quit());
