/**
 * Grille de l'arène (repère de mise en page).
 *
 * Quadrillage couvrant tout l'espace de conception (1280x720), au pas de
 * `CELL_SIZE`. Sert à caler les éléments de l'interface « comme sur un
 * plateau » : elle est affichée en fond du menu et de la salle d'attente,
 * et ses cellules serviront au placement des personnages dans l'arène.
 */

import { Container, Graphics } from 'pixi.js';
import { COLORS, DESIGN_HEIGHT, DESIGN_WIDTH } from '../design.js';

/** Taille d'une cellule en pixels (pas du quadrillage). */
const CELL_SIZE = 80;

/** Opacité des traits de la grille. */
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

    gfx.stroke({ width: 1, color: COLORS.gridLine, alpha: LINE_ALPHA });
    this.addChild(gfx);
  }
}
