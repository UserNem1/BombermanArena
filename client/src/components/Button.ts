/**
 * Bouton du menu.
 *
 * Un rectangle arrondi avec un libellé centré. Au survol, le
 * remplissage et la bordure changent de couleur. L'état « focus »
 * (navigation clavier) affiche sa propre variante : les animations
 * viendront dans un commit ultérieur.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';

/** Dimensions et rayon des coins du bouton (px). */
const WIDTH = 260;
const HEIGHT = 54;
const RADIUS = 12;

/** Couleurs du bouton (0xRRGGBB). */
const FILL = 0x2b2f4a;
const FILL_HOVER = 0xf77f00;
const FILL_FOCUS = 0x31578c;
const BORDER = 0x6c63a8;
const BORDER_HOVER = 0xffb703;
const BORDER_FOCUS = 0x9fd0ff;
const LABEL = 0xdfe4ff;

/**
 * Un bouton est un `Container` qui regroupe :
 * - un `Graphics` : le rectangle dessiné ;
 * - un `Text` : le libellé.
 */
export class Button extends Container {
  private readonly gfx = new Graphics();
  private readonly caption: Text;
  private readonly onClick: () => void;
  /** Vrai si le bouton est le focus clavier courant. */
  private isFocused = false;

  /**
   * @param label Libellé affiché au centre du bouton.
   * @param onClick Action déclenchée au clic (ou au clavier via navigation).
   */
  constructor(label: string, onClick: () => void) {
    super();

    // Rend le bouton sensible à la souris et affiche un curseur en main.
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.onClick = onClick;

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
    this.on('pointerover', () => this.paint(true, this.isFocused));
    this.on('pointerout', () => this.paint(false, this.isFocused));
    this.on('pointertap', () => this.activate());

    // Dessin initial (non survolé, non focus).
    this.paint(false, false);
  }

  /** Déclenche l'action du bouton (clic souris ou clavier). */
  activate(): void {
    this.onClick();
  }

  /** Marque le bouton comme focus clavier (couronne visuelle). */
  setFocused(focused: boolean): void {
    this.isFocused = focused;
    this.paint(false, focused);
  }

  /**
   * Redessine le bouton.
   * @param hovered Indique si le curseur survole le bouton.
   * @param focused Indique si le bouton est le focus clavier courant.
   */
  private paint(hovered: boolean, focused: boolean): void {
    // Le rectangle est dessiné centré sur l'origine du bouton, ce qui
    // évite tout décalage quand on le positionne ou le met à l'échelle.
    const x = -WIDTH / 2;
    const y = -HEIGHT / 2;

    const fill = hovered ? FILL_HOVER : focused ? FILL_FOCUS : FILL;
    const border = hovered ? BORDER_HOVER : focused ? BORDER_FOCUS : BORDER;

    this.gfx.clear();
    // `roundRect` décrit la forme, `fill` la remplit et `stroke` dessine
    // son contour.
    this.gfx
      .roundRect(x, y, WIDTH, HEIGHT, RADIUS)
      .fill(fill)
      .stroke({ width: 2, color: border });
  }
}
