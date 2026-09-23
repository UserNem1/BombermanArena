/**
 * Design tokens de l'interface.
 *
 * Toute l'interface est dessinée dans un repère logique fixe (l'espace de
 * conception), puis mise à l'échelle et centrée par le renderer pour
 * s'adapter à la fenêtre. Ce module centralise aussi les constantes
 * partagées entre les écrans (police des titres, position verticale) et
 * un fabriquant de style de titre, afin d'éviter toute duplication.
 */

import { TextStyle } from 'pixi.js';

/** Largeur logique de référence de l'interface (px). */
export const DESIGN_WIDTH = 1280;

/** Hauteur logique de référence de l'interface (px). */
export const DESIGN_HEIGHT = 720;

/** Police d'affichage des titres (partagée par tous les écrans). */
export const DISPLAY_FONT = '"Arial Black", Impact, Arial, sans-serif';

/** Ordonnée du titre d'un écran, en fraction de la hauteur. */
export const TITLE_Y = 0.3;

/** Masse de bordure du texte des titres (regularité visuelle). */
const TITLE_PADDING = 10;

/**
 * Fabriquant du style de titre d'un écran : police partagée, graisse,
 * interligne des lettres, contour et marge interne.
 *
 * @param fill          Couleur du texte (0xRRGGBB).
 * @param fontSize      Taille (px).
 * @param letterSpacing Interligne des lettres (px).
 * @param strokeColor   Couleur du contour (chaîne CSS).
 * @param strokeWidth   Épaisseur du contour (px).
 */
export function titleStyle(
  fill: number,
  fontSize: number,
  letterSpacing: number,
  strokeColor: string,
  strokeWidth: number,
): TextStyle {
  return new TextStyle({
    fontFamily: DISPLAY_FONT,
    fontSize,
    fontWeight: '900',
    letterSpacing,
    fill,
    stroke: { color: strokeColor, width: strokeWidth },
    padding: TITLE_PADDING,
  });
}