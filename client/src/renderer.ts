/**
 * Point d'entrée du renderer (couche d'affichage).
 *
 * Initialise l'application PixiJS (moteur de rendu de tous les écrans du
 * jeu) puis monte le menu principal. L'interface est dessinée dans un
 * espace de conception de 1280x720, mis à l'échelle et centré pour
 * s'adapter à la fenêtre ; le fond uni est celui du canvas.
 */

import { Application, Assets,Container, Texture } from 'pixi.js';
import { DESIGN_HEIGHT, DESIGN_WIDTH } from './design.js';
import { Menu } from './screens/Menu.js';
import { AnimationPersonnageMenu } from './AnimationPersonnageMenu.js';

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

// Fond du menu (image 1920x1080). Un échec de chargement ne doit pas
// casser l'écran : on journalise et Menu retombe sur la grille par défaut.
let background: Texture | null = null;
try {
  background = await Assets.load('assets/menu-background.png');
} catch (error) {
  console.error('[renderer] chargement du fond du menu impossible :', error);
}

// `app.stage` est la racine de l'arbre d'affichage : tout objet qui y est
// ajouté est dessiné à l'écran. On y place le menu principal.
const menu = new Menu(background ?? undefined);
app.stage.addChild(menu);

let demo: AnimationPersonnageMenu | null = null;
try {
  demo = await AnimationPersonnageMenu.load('assets/perso1.png');

  if (demo && background) {
    // Le perso utilise des coordonnées 1280x720.
    // Le fond fait 1920x1080 : on convertit ses coordonnées.
    const charWrapper = new Container();

    charWrapper.scale.set(
      background.width / DESIGN_WIDTH,
      background.height / DESIGN_HEIGHT,
    );

    // Le fond a une ancre au centre : on ramène donc le perso
    // dans le coin haut-gauche de l'image.
    charWrapper.position.set(
      -background.width / 2,
      -background.height / 2,
    );

    charWrapper.addChild(demo);
    menu.addToBackdrop(charWrapper);
  } else if (demo) {
    menu.addChildAt(demo, 1);
  }
} catch (error) {
  console.error('[renderer] chargement du perso impossible :', error);
}

// La boucle de rendu fait avancer la démonstration à chaque image. On
// mesure le vrai temps écoulé (performance.now) plutôt que le delta du
// ticker, pour une vitesse identique quel que soit le rafraîchissement.
let lastTime = performance.now();
app.ticker.add(() => {
  const now = performance.now();
  demo?.update((now - lastTime) / 1000);
  lastTime = now;
});

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

  // Échelle qui fait tenir le menu 1280x720 dans la fenêtre.
  const fitScale = Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT);

  // L'UI ne rétrécit jamais en dessous de 75 % de sa taille normale.
  const scale = Math.max(fitScale, 0.85);

  const offsetX = (width - DESIGN_WIDTH * scale) / 2;
  const offsetY = (height - DESIGN_HEIGHT * scale) / 2;

  menu.scale.set(scale);
  menu.position.set(offsetX, offsetY);

  menu.coverBackdrop(
    -offsetX / scale,
    -offsetY / scale,
    width / scale,
    height / scale,
  );
};

// Recalcule la disposition à chaque redimensionnement, puis une fois au départ.
app.renderer.on('resize', layout);
layout();