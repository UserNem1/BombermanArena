/**
 * Processus principal Electron.
 *
 * Le processus main est responsable du cycle de vie de l'application :
 * création des fenêtres, enregistrement des handlers IPC et gestion
 * de la fermeture selon la plateforme.
 */
declare const app: any, BrowserWindow: any, ipcMain: any;
declare const path: any;
/**
 * Crée et affiche la fenêtre principale de l'application.
 *
 * La fenêtre charge le fichier HTML du renderer et injecte le script
 * de préchargement (`preload.js`) qui expose les APIs au renderer via
 * le contextBridge.
 *
 * @returns {void} Aucune valeur de retour ; la fenêtre est rendue visible.
 */
declare const createWindow: () => void;
//# sourceMappingURL=mainMenu.d.ts.map