// Zibo's Raid — Masaüstü (Steam) sarmalayıcısı. Oyunu kendi içinden "app://" adresiyle sunar
// (file:// ile fetch/modeller yüklenmez); internet gerekmez.
const { app, BrowserWindow, Menu, shell, protocol, net, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }]);
app.commandLine.appendSwitch('ignore-gpu-blocklist');   // eski ekran kartlarında da WebGL açılsın
const ROOT = path.join(__dirname, 'game');
// --- Steam: başarımlar. Steam kapalıysa / App ID yoksa oyun normal çalışır ---
// App ID: Steamworks'ten alınınca exe'nin yanındaki steam_appid.txt'ye (test) ya da STEAM_APP_ID'ye yazılır.
let steam = null;
try {
  const idFile = [path.join(path.dirname(process.execPath), 'steam_appid.txt'), path.join(__dirname, 'steam_appid.txt')].find(f => fs.existsSync(f));
  const appId = Number(process.env.STEAM_APP_ID || (idFile ? fs.readFileSync(idFile, 'utf8').trim() : 0));
  if (appId) { steam = require('steamworks.js').init(appId); require('steamworks.js').electronEnableSteamOverlay(); }
} catch (e) { steam = null; }
ipcMain.on('achieve', (e, id) => { try { if (steam && !steam.achievement.isActivated(id)) steam.achievement.activate(id); } catch (err) { /* */ } });
ipcMain.on('steamOn', e => { e.returnValue = !!steam; });
// --- Kayıt dosyası: Steam Bulut (Auto-Cloud) bu dosyayı eşitler: %APPDATA%/Zibo's Raid/save.json ---
const SAVE = () => path.join(app.getPath('userData'), 'save.json');
ipcMain.on('saveRead', e => { try { e.returnValue = fs.readFileSync(SAVE(), 'utf8'); } catch (err) { e.returnValue = null; } });
ipcMain.on('saveWrite', (e, txt) => { try { const f = SAVE(); fs.writeFileSync(f + '.tmp', txt); fs.renameSync(f + '.tmp', f); } catch (err) { /* */ } });
function create() {
  const win = new BrowserWindow({
    width: 1280, height: 720, minWidth: 960, minHeight: 540, backgroundColor: '#14233c', show: false,
    title: "Catch Zibo!", autoHideMenuBar: true,
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
