/**
 * Point d'entrée du renderer (couche d'affichage).
 *
 * Initialise l'application PixiJS (moteur de rendu de tous les écrans du
 * jeu), crée les écrans (menu, options), branche la navigation clavier et
 * monte l'écran initial. L'interface est dessinée dans un espace de
 * conception de 1280x720, mis à l'échelle et centré pour s'adapter à la
 * fenêtre ; le fond uni est celui du canvas.
 *
 */

import { Application, Container } from 'pixi.js';
import { DESIGN_HEIGHT, DESIGN_WIDTH } from './design.js';
import { Menu } from './screens/Menu.js';
import { Options } from './screens/Options.js';
import { AnimationPersonnageMenu } from './AnimationPersonnageMenu.js';
import { Navigation } from './Navigation.js';

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
// ajouté est dessiné à l'écran. Les deux écrans sont créés à l'avance, puis
// un seul est monté sur la scène à la fois (le menu au départ).
const menu = new Menu(showOptions);
const options = new Options(showMenu);

/** Écran actuellement affiché (menu ou options). */
let current: Container = menu;
app.stage.addChild(current);

/**
 * Remplace l'écran affiché : démonte l'ancien et monte le nouveau.
 */
const showScreen = (next: Container): void => {
  app.stage.removeChild(current);
  current = next;
  app.stage.addChild(current);
  layout();
};

/** Bascule vers la page des options. */
function showOptions(): void {
  showScreen(options);
}

/** Bascule vers le menu principal. */
function showMenu(): void {
  showScreen(menu);
}

// Démonstration animée (test) : le personnage traverse l'écran, saute
// puis disparaît, en boucle. Le sprite est inséré en dessous du texte
// (index 1). La taille se règle dans AnimationPersonnageMenu.ts (DISPLAY_HEIGHT).
// Un échec de chargement ne doit pas casser le menu entier : on
// journalise l'erreur et on continue sans la démo.
let demo: AnimationPersonnageMenu | null = null;
try {
  demo = await AnimationPersonnageMenu.load('assets/perso1.png');
  menu.addChildAt(demo, 1);
} catch (error) {
  console.error('[renderer] chargement du perso impossible :', error);
}

// La boucle de rendu fait avancer la démonstration à chaque image. On
// mesure le vrai temps écoulé (performance.now) plutôt que le delta du
// ticker, pour une vitesse identique quel que soit le rafraîchissement.
// La démo appartient au menu : inutile de l'animer quand un autre écran
// est affiché (`menu.parent` est alors null).
let lastTime = performance.now();
app.ticker.add(() => {
  const now = performance.now();
  if (menu.parent) {
    demo?.update((now - lastTime) / 1000);
  }
  lastTime = now;
});

/**
 * Met l'interface à l'échelle et la centre dans la fenêtre.
 *
 * On calcule le plus petit facteur d'échelle qui fait tenir tout l'espace
 * de conception (1280x720) dans la fenêtre, puis on décale l'écran courant
 * pour le centrer. L'interface reste ainsi complète et proportionnée,
 * quelle que soit la résolution ou le format de la fenêtre.
 */
const layout = (): void => {
  const { width, height } = app.screen;
  const scale = Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT);
  current.scale.set(scale);
  current.position.set(
    (width - DESIGN_WIDTH * scale) / 2,
    (height - DESIGN_HEIGHT * scale) / 2,
  );
};

// Recalcule la disposition à chaque redimensionnement, puis une fois au départ.
app.renderer.on('resize', layout);
layout();

// Navigation clavier : Tab/Entrée pilotent les boutons de l'écran affiché.
new Navigation(app, () => current);