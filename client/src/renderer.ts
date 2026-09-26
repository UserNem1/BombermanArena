/**
 * Point d'entrée du renderer (couche d'affichage).
 *
 * Initialise l'application PixiJS (moteur de rendu de tous les écrans du
 * jeu) puis monte le menu principal. L'interface est dessinée dans un
 * espace de conception de 1280x720, mis à l'échelle et centré pour
 * s'adapter à la fenêtre ; le fond uni est celui du canvas.
 */

import {
  Application,
  Container,
  Rectangle,
  Sprite,
  Texture,
  TextureSource,
} from 'pixi.js';
import { DESIGN_HEIGHT, DESIGN_WIDTH } from './design.js';
import { Menu } from './screens/Menu.js';
import { WaitingMenu } from './screens/WaitingMenu.js';
import { AnimationPersonnageMenu } from './AnimationPersonnageMenu.js';
import { CHARACTERS } from './lobby/characters.js';
import { LobbyBus } from './lobby/LobbyBus.js';
import { LobbyMock } from './lobby/LobbyMock.js';
import { loadImage } from './imageLoader.js';
import { firstCellBox } from './firstCell.js';
import { PICKER_PREVIEW_HEIGHT } from './components/CharacterPicker.js';

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

// Salle d'attente : le bus d'événements joue les intermédiaires entre le
// serveur (réel ou simulé) et l'écran. Tant que le backend WebSocket n'a
// pas défini le protocole, un mock alimente le bus avec de fausses données
// : on peut ainsi voir la salle se remplir et basculer « prêt » sans serveur.
const lobby = new LobbyBus();
const mock = new LobbyMock(lobby, ['KillerBee', 'Bonnie', 'TNT', 'Pixel'], 900);
const waiting = new WaitingMenu(
  showMenu,
  toggleReady,
  cycleCharacter,
  mock.selfId,
  getPreview,
);
lobby.on((players) => waiting.setPlayers(players));

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

/**
 * Aperçus des personnages pour le sélecteur en U : la première pose de
 * chaque planche (rognée sur son contenu), chargée en arrière-plan et
 * réduite à la hauteur du sélecteur. Un chargement raté laisse la U vide
 * (jamais de blocage) ; la salle est rafraîchie une fois qu'une image est
 * prête.
 */
const previews = new Map<string, Sprite>();
void loadPreviews();

async function loadPreviews(): Promise<void> {
  for (const character of CHARACTERS) {
    try {
      const image = await loadImage(character.sprites);
      // Seule la première pose est prélevée (les premières lignes de la
      // planche peuvent être vides) : le portrait n'est pas une planche
      // écrasée mais une case rognée sur son contenu.
      const box = firstCellBox(image);
      const sprite = new Sprite({
        texture: new Texture({
          source: TextureSource.from(image),
          frame: new Rectangle(box.x, box.y, box.width, box.height),
        }),
      });
      sprite.anchor.set(0.5);
      sprite.height = PICKER_PREVIEW_HEIGHT;
      sprite.width = (sprite.height * box.width) / box.height;
      previews.set(character.id, sprite);
    } catch (error) {
      console.error(`[renderer] image du perso ${character.id} illisible :`, error);
    }
  }
  waiting.setPlayers(lobby.players);
}

/** Image du personnage pour le sélecteur, ou `null` si non chargée. */
function getPreview(characterId: string): Sprite | null {
  return previews.get(characterId) ?? null;
}

/** Écran actuellement affiché (menu ou salle d'attente). */
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