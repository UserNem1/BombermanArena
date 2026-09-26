/**
 * Écran d'attente (salle multijoueur).
 *
 * Version très minimale : le même fond que le menu (grille), un titre et
 * quatre rectangles dans les coins — un emplacement par joueur. Le bouton
 * « Retour » ramène au menu. Les joueurs réels, l'animation et le compte
 * à rebours viendront ensuite.
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

/** Couleur du titre de la page. */
const TITLE_COLOR = 0x4cc9f0;
const TITLE_STROKE = '#0b2545';

/** Couleurs des emplacements joueur. */
const SLOT_COLOR = 0x2b2f4a;
const SLOT_BORDER = 0x6c63a8;

/** Style du libellé dans un emplacement. */
const SLOT_LABEL_STYLE = new TextStyle({
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

/** Emplacements des quatre joueurs : [x, y, libellé]. */
const PLAYER_SLOTS: [number, number, string][] = [
  [SLOT_MARGIN, SLOT_MARGIN, 'JOUEUR 1'],
  [DESIGN_WIDTH - SLOT_MARGIN - SLOT_WIDTH, SLOT_MARGIN, 'JOUEUR 2'],
  [SLOT_MARGIN, DESIGN_HEIGHT - SLOT_MARGIN - SLOT_HEIGHT, 'JOUEUR 3'],
  [DESIGN_WIDTH - SLOT_MARGIN - SLOT_WIDTH, DESIGN_HEIGHT - SLOT_MARGIN - SLOT_HEIGHT, 'JOUEUR 4'],
];

export class WaitingMenu extends Container {
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

    // Libellé au centre de chaque emplacement.
    for (const [x, y, label] of PLAYER_SLOTS) {
      const text = new Text({ text: label, style: SLOT_LABEL_STYLE });
      text.anchor.set(0.5);
      text.position.set(x + SLOT_WIDTH / 2, y + SLOT_HEIGHT / 2);
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
}