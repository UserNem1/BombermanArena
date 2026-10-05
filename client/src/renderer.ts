/**
 * Point d'entrée du renderer : démarrage de l'application et câblage.
 *
 * Initialise PixiJS (moteur de rendu de tous les écrans), crée les deux
 * écrans — menu principal et salle d'attente — puis les relie au modèle :
 * les actions de l'utilisateur (retour, prêt, changement de personnage)
 * remontent vers le bus du lobby, et le bus redessine la salle. L'interface
 * est dessinée dans un espace de conception de 1280x720, mis à l'échelle et
 * centré pour s'adapter à la fenêtre ; le fond uni est celui du canvas.
 *
 * Ce fichier ne contient que ce qui est propre à l'application : le reste vit
 * dans des modules testables (`design`, `screens`, `components`, `lobby`,
 * `previews`).
 */

import { Application, Container } from 'pixi.js';
import { DESIGN_HEIGHT, DESIGN_WIDTH } from './design.js';
import { Menu } from './screens/Menu.js';
import { WaitingMenu } from './screens/WaitingMenu.js';
import { AnimationPersonnageMenu } from './AnimationPersonnageMenu.js';
import { CHARACTERS } from './lobby/characters.js';
import { LobbyBus } from './lobby/LobbyBus.js';
import { LobbyMock } from './lobby/LobbyMock.js';
import { CharacterPreviews, type PreviewFactory } from './previews.js';

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
const menu = new Menu(showWaiting);

// Aperçus des personnages (première pose de chaque planche) : l'écran
// d'attente demande une image par joueur à cette fabrique.
const previews = new CharacterPreviews();
const getPreview: PreviewFactory = (characterId, height) => previews.get(characterId, height);

// Salle d'attente : le bus d'événements joue les intermédiaires entre le
// serveur (réel ou simulé) et l'écran. Tant que le backend WebSocket n'a
// pas défini le protocole, un mock alimente le bus avec de fausses données :
// on peut ainsi voir la salle se remplir et basculer « prêt » sans serveur.
const lobby = new LobbyBus();
const mock = new LobbyMock(lobby, ['LeBGdu80', 'Bread', 'Joe', 'Bob'], 900);
const waiting = new WaitingMenu(
  showMenu,
  toggleReady,
  cycleCharacter,
  mock.selfId,
  getPreview,
);
lobby.on((players) => waiting.setPlayers(players));

// La salle est rafraîchie une fois les planches chargées : les portraits
// apparaissent alors dans les emplacements, sans nouvelle action de
// l'utilisateur.
void previews.load().then(() => waiting.setPlayers(lobby.players));

/** Bascule l'état prêt du joueur local dans le bus. */
function toggleReady(): void {
  const self = lobby.players.find((p) => p.id === mock.selfId);
  lobby.setReady(mock.selfId, !self?.ready);
}

/**
 * Change le personnage du joueur local vers le premier personnage libre
 * après le sien dans le catalogue (un joueur par personnage). Sans libre,
 * il garde son personnage.
 */
function cycleCharacter(): void {
  const self = lobby.players.find((p) => p.id === mock.selfId);
  if (!self || CHARACTERS.length === 0) return;

  const taken = new Set(lobby.players.map((p) => p.characterId));
  const start = CHARACTERS.findIndex((c) => c.id === self.characterId);
  for (let step = 1; step <= CHARACTERS.length; step++) {
    const next = CHARACTERS[(start + step + CHARACTERS.length) % CHARACTERS.length];
    if (!taken.has(next.id)) {
      lobby.setCharacter(mock.selfId, next.id);
      return;
    }
  }
}

/** Écran actuellement affiché (menu ou salle d'attente). */
let current: Container = menu;
app.stage.addChild(current);

/** Remplace l'écran affiché : démonte l'ancien et monte le nouveau. */
const showScreen = (next: Container): void => {
  app.stage.removeChild(current);
  current = next;
  app.stage.addChild(current);
  layout();
};

/** Bascule vers la salle d'attente (bouton JOUER) et lance la simulation. */
function showWaiting(): void {
  showScreen(waiting);
  mock.start();
}

/** Bascule vers le menu principal et interrompt la simulation en cours. */
function showMenu(): void {
  showScreen(menu);
  mock.stop();
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