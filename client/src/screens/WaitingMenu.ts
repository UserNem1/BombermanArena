/**
 * Écran d'attente (salle multijoueur).
 *
 * Fond identique au menu (grille), un titre et quatre rectangles dans les
 * coins — un emplacement par joueur. `setPlayers` reflète l'état de la
 * salle : un emplacement occupé affiche le pseudo du joueur, un emplacement
 * libre affiche « EN ATTENTE… ». Le bouton « Retour » ramène au menu.
 * L'écran est volontairement sans logique : c'est le bus d'événements du
 * lobby qui lui envoie la liste des joueurs.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Button } from '../components/Button.js';
import {
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  TITLE_Y,
  titleStyle,
} from '../design.js';
import { Grid } from '../components/Grid.js';
import type { Player } from '../lobby/LobbyBus.js';

/** Couleur du titre de la page. */
const TITLE_COLOR = 0x4cc9f0;
const TITLE_STROKE = '#0b2545';

/** Couleurs des emplacements joueur. */
const SLOT_COLOR = 0x2b2f4a;
const SLOT_BORDER = 0x6c63a8;

/** Libellés affichés dans les emplacements. */
const EMPTY_LABEL = 'EN ATTENTE…';

/** Styles des libellés des emplacements. */
const SLOT_EMPTY_STYLE = new TextStyle({
  fontFamily: 'Arial',
  fontSize: 22,
  fontWeight: 'bold',
  fill: 0x8a8fb8,
});
const SLOT_OCCUPIED_STYLE = new TextStyle({
  fontFamily: 'Arial',
  fontSize: 22,
  fontWeight: 'bold',
  fill: 0xdfe4ff,
});

/** Taille et marge des emplacements (px). */
const SLOT_WIDTH = 300;
const SLOT_HEIGHT = 220;
const SLOT_MARGIN = 90;

/** Ordonnée du bouton retour, en fraction de la hauteur. */
const BACK_Y = 0.9;

/** Coin (x, y) de chaque emplacement de joueur. */
const PLAYER_SLOTS: [number, number][] = [
  [SLOT_MARGIN, SLOT_MARGIN],
  [DESIGN_WIDTH - SLOT_MARGIN - SLOT_WIDTH, SLOT_MARGIN],
  [SLOT_MARGIN, DESIGN_HEIGHT - SLOT_MARGIN - SLOT_HEIGHT],
  [DESIGN_WIDTH - SLOT_MARGIN - SLOT_WIDTH, DESIGN_HEIGHT - SLOT_MARGIN - SLOT_HEIGHT],
];

export class WaitingMenu extends Container {
  /** Libellés des quatre emplacements (exposés pour les tests). */
  readonly slotLabels: Text[] = [];

  constructor(onBack: () => void) {
    super();

    // Décor de fond identique au menu : la grille de l'arène.
    this.addChild(new Grid());

    // Les quatre emplacements joueurs, un dans chaque coin.
    const gfx = new Graphics();
    for (const [x, y] of PLAYER_SLOTS) {
      gfx
        .roundRect(x, y, SLOT_WIDTH, SLOT_HEIGHT, 12)
        .fill(SLOT_COLOR)
        .stroke({ width: 2, color: SLOT_BORDER });
    }
    this.addChild(gfx);

    // Libellé au centre de chaque emplacement, vide au départ.
    for (const [x, y] of PLAYER_SLOTS) {
      const text = new Text({ text: EMPTY_LABEL, style: SLOT_EMPTY_STYLE });
      text.anchor.set(0.5);
      text.position.set(x + SLOT_WIDTH / 2, y + SLOT_HEIGHT / 2);
      this.slotLabels.push(text);
      this.addChild(text);
    }

    // Titre au centre, au-dessus des emplacements du haut.
    const title = new Text({
      text: 'EN ATTENTE',
      style: titleStyle(TITLE_COLOR, 40, 8, TITLE_STROKE, 6),
    });
    title.anchor.set(0.5);
    title.position.set(DESIGN_WIDTH / 2, DESIGN_HEIGHT * TITLE_Y);
    this.addChild(title);

    // Retour au menu principal.
    const back = new Button('RETOUR', onBack);
    back.position.set(DESIGN_WIDTH / 2, DESIGN_HEIGHT * BACK_Y);
    this.addChild(back);
  }

  /**
   * Reflète la liste des joueurs de la salle dans les emplacements.
   *
   * Les `MAX_PLAYERS` premiers joueurs occupent les coins, dans l'ordre ;
   * les emplacements restants restent affichés « EN ATTENTE… ».
   */
  setPlayers(players: readonly Player[]): void {
    this.slotLabels.forEach((label, index) => {
      const player = players[index];
      label.text = player ? player.name : EMPTY_LABEL;
      label.style = player ? SLOT_OCCUPIED_STYLE : SLOT_EMPTY_STYLE;
    });
  }
}