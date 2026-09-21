/**
 * Bouton du menu.
 *
 * Un rectangle arrondi avec un libellé centré. Au survol, le
 * remplissage et la bordure changent de couleur (les animations
 * viendront dans un commit ultérieur).
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';

/** Dimensions et rayon des coins du bouton (px). */
const WIDTH = 260;
const HEIGHT = 54;
const RADIUS = 12;

/** Couleurs du bouton (0xRRGGBB). */
const FILL = 0x2b2f4a;
const FILL_HOVER = 0xf77f00;
const BORDER = 0x6c63a8;
const BORDER_HOVER = 0xffb703;
const LABEL = 0xdfe4ff;

/**
 * Un bouton est un `Container` qui regroupe :
 * - un `Graphics` : le rectangle dessiné ;
 * - un `Text` : le libellé.
 */
export class Button extends Container {
  private readonly gfx = new Graphics();
  private readonly caption: Text;

  /**
   * @param label Libellé affiché au centre du bouton.
   * @param onClick Action déclenchée au clic.
   */
  constructor(label: string, onClick: () => void) {
    super();

    // Rend le bouton sensible à la souris et affiche un curseur en main.
    this.eventMode = 'static';
    this.cursor = 'pointer';

    this.caption = new Text({
      text: label,
      style: new TextStyle({
        fontFamily: 'Arial',
        fontSize: 19,
        fontWeight: 'bold',
        letterSpacing: 3,
        fill: LABEL,
      }),
    });
    this.caption.anchor.set(0.5); // origine au centre du libellé
    this.addChild(this.gfx, this.caption);

    // Réactions de la souris : changer de couleur au survol, agir au clic.
    this.on('pointerover', () => this.paint(true));
    this.on('pointerout', () => this.paint(false));
    this.on('pointertap', onClick);

    // Dessin initial (état non survolé).
    this.paint(false);
  }

  /**
   * Redessine le bouton.
   * @param hovered Indique si le curseur survole le bouton.
   */
  private paint(hovered: boolean): void {
    // Le rectangle est dessiné centré sur l'origine du bouton, ce qui
    // évite tout décalage quand on le positionne ou le met à l'échelle.
    const x = -WIDTH / 2;
    const y = -HEIGHT / 2;

    this.gfx.clear();
    // `roundRect` décrit la forme, `fill` la remplit et `stroke` dessine
    // son contour.
    this.gfx
      .roundRect(x, y, WIDTH, HEIGHT, RADIUS)
      .fill(hovered ? FILL_HOVER : FILL)
      .stroke({ width: 2, color: hovered ? BORDER_HOVER : BORDER });
  }
}
