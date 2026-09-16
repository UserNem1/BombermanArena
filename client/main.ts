/**
 * Processus principal Electron.
 *
 * Le processus main est responsable du cycle de vie de l'application :
 * création des fenêtres, enregistrement des handlers IPC et gestion
 * de la fermeture selon la plateforme.
 */

const { app, BrowserWindow, ipcMain } = require('electron/main');
const path = require('node:path');

/**
 * Crée et affiche la fenêtre principale de l'application.
 *
 * La fenêtre charge le fichier HTML du renderer et injecte le script
 * de préchargement (`preload.js`) qui expose les APIs au renderer via
 * le contextBridge.
 *
 * @returns {void} Aucune valeur de retour ; la fenêtre est rendue visible.
 */
const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadFile('index.html');
};

/**
 * Enregistre le handler IPC `ping` et créé la fenêtre dès que
 * Electron est prêt.
 *
 * Sur macOS, si aucune fenêtre n'est ouverte alors que l'application
 * est relancée (clic sur l'icône du dock), on recrée la fenêtre.
 */
app.whenReady().then(() => {
  ipcMain.handle('ping', () => 'pong');
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

/**
 * Quitte l'application lorsque toutes les fenêtres sont fermées,
 * sauf sur macOS où l'application reste généralement active.
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});