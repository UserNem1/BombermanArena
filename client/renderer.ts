/**
 * Point d'entrée du renderer (couche d'affichage).
 *
 * Initialise l'application PixiJS (moteur de rendu de tous les écrans
 * du jeu) puis monte le menu principal. L'interface est dessinée dans
 * un espace de conception de 1280x720, mis à l'échelle et centré pour
 * s'adapter à la fenêtre ; le fond uni est celui du canvas.
 *
 * Architecture visée : un Event Bus découplera plus tard la logique
 * réseau (WebSocket) de ce moteur de rendu.
 */

import { Application } from 'pixi.js';
import { DESIGN_HEIGHT, DESIGN_WIDTH } from './design.js';
import { Menu } from './Menu.js';

/** Application PixiJS : contient le renderer, le stage et la boucle de rendu. */
const app = new Application();

/**
 * Initialise l'application PixiJS.
 *
 * - `resizeTo: window` : le canvas s'adapte à la taille de la fenêtre.
 * - `autoDensity` / `resolution` : rendu net sur les écrans HiDPI.
 * - `background` : fond uni du menu.
 */
await app.init({
  resizeTo: window,
  autoDensity: true,
  resolution: window.devicePixelRatio || 1,
  antialias: true,
  background: '#140f2e',
});

// Insère le canvas créé par PixiJS dans la page HTML.
document.body.appendChild(app.canvas);

// `app.stage` est la racine de l'arbre d'affichage : tout objet qui y est
// ajouté est dessiné à l'écran. On y place le menu principal.
const menu = new Menu();
app.stage.addChild(menu);

/**
 * Met l'interface à l'échelle et la centre dans la fenêtre.
 *
 * On calcule le plus petit facteur d'échelle qui fait tenir tout l'espace
 * de conception (1280x720) dans la fenêtre, puis on décale le menu pour le
 * centrer. L'interface reste ainsi complète et proportionnée, quelle que
 * soit la résolution ou le format de la fenêtre.
 */
const layout = (): void => {
  const { width, height } = app.screen;
  const scale = Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT);
  menu.scale.set(scale);
  menu.position.set(
    (width - DESIGN_WIDTH * scale) / 2,
    (height - DESIGN_HEIGHT * scale) / 2,
  );
};

// Recalcule la disposition à chaque redimensionnement, puis une fois au départ.
app.renderer.on('resize', layout);
layout();
