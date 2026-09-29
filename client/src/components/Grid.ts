/**
 * Grille de l'arène.
 *
 * Dessine un quadrillage dans tout l'espace de conception (1280x720).
 * Le pas est CELL_SIZE : les cellules servent à placer les personnages,
 * comme sur un plateau de jeu.
 */

import { Container, Graphics } from 'pixi.js';
import { DESIGN_HEIGHT, DESIGN_WIDTH } from '../design.js';

/** Taille d'une cellule en pixels (réservée au futur placement des
 *  personnages : réexporter quand la grille sera utilisée hors du dessin). */
const CELL_SIZE = 80;

/** Couleur et opacité des traits de la grille. */
const LINE_COLOR = 0x2a2350;
const LINE_ALPHA = 0.9;

export class Grid extends Container {
  constructor() {
    super();

    const gfx = new Graphics();

    // Traits verticaux.
    for (let x = 0; x <= DESIGN_WIDTH; x += CELL_SIZE) {
      gfx.moveTo(x, 0).lineTo(x, DESIGN_HEIGHT);
    }
    // Traits horizontaux.
    for (let y = 0; y <= DESIGN_HEIGHT; y += CELL_SIZE) {
      gfx.moveTo(0, y).lineTo(DESIGN_WIDTH, y);
    }

    gfx.stroke({ width: 1, color: LINE_COLOR, alpha: LINE_ALPHA });
    this.addChild(gfx);
  }
}
