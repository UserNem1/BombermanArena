/**
 * Script de préchargement du renderer.
 *
 * Le préchargement s'exécute dans un contexte privilégié (isolé du
 * renderer) et expose, via le contextBridge, une API minimale et sûre
 * vers la page web. Il ne faut jamais exposer de modules Node complets
 * au renderer, mais uniquement des fonctions dédiées (principe de
 * moindre privilège).
 */

const { contextBridge, ipcRenderer } = require('electron');

/**
 * API des versions exposée dans l'espace global du renderer.
 *
 * Cette API est accessible côté renderer via `window.versions`.
 * Elle expose uniquement les informations de versions et le canal
 * IPC `ping` — pas l'objet `ipcRenderer` complet.
 */
contextBridge.exposeInMainWorld('versions', {
  /** @returns {string} Version de Node.js du processus principal. */
  node: () => process.versions.node,

  /** @returns {string} Version de Chromium embarquée par Electron. */
  chrome: () => process.versions.chrome,

  /** @returns {string} Version d'Electron utilisée. */
  electron: () => process.versions.electron,

  /**
   * Invoque le handler IPC `ping` côté processus principal pour
   * vérifier la communication inter-processus.
   *
   * @returns {Promise<string>} La réponse `'pong'` renvoyée par le main.
   */
  ping: () => ipcRenderer.invoke('ping'),

  // On peut aussi exposer des variables, pas uniquement des fonctions.
});