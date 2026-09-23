/**
 * Page des options du jeu.
 *
 * Version minimale pour l'instant : la grille en fond, un titre et un
 * bouton « Retour » qui ramène au menu principal. Les réglages (volume,
 * difficulté, contrôles...) viendront ensuite.
 */

import { Container, Text } from 'pixi.js';
import { Button } from '../components/Button.js';
import { DESIGN_HEIGHT, DESIGN_WIDTH, TITLE_Y, titleStyle } from '../design.js';
import { Grid } from '../components/Grid.js';

/** Couleur du titre de la page. */
const TITLE_COLOR = 0x4cc9f0;
const TITLE_STROKE = '#0b2545';

/** Ordonnée du bouton retour, en fraction de la hauteur. */
const BACK_Y = 0.7;

export class Options extends Container {
  constructor(onBack: () => void) {
    super();

    // Décor de fond identique au menu : la grille de l'arène.
    this.addChild(new Grid());

    // Titre de la page.
    const title = new Text({
      text: 'OPTIONS',
      style: titleStyle(TITLE_COLOR, 64, 6, TITLE_STROKE, 7),
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