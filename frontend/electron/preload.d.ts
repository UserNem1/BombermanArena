/**
 * Script de préchargement du renderer.
 *
 * Le préchargement s'exécute dans un contexte privilégié (isolé du
 * renderer) et expose, via le contextBridge, une API minimale et sûre
 * vers la page web. Il ne faut jamais exposer de modules Node complets
 * au renderer, mais uniquement des fonctions dédiées (principe de
 * moindre privilège).
 */
declare const contextBridge: any, ipcRenderer: any;
//# sourceMappingURL=preload.d.ts.map