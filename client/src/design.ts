/**
 * Design tokens de l'interface.
 *
 * Toute l'interface est dessinée dans un repère logique fixe (l'espace de
 * conception), puis mise à l'échelle et centrée par le renderer pour
 * s'adapter à la fenêtre. Ce module centralise aussi les constantes
 * partagées entre les écrans (police des titres, position verticale) et
 * un fabriquant de style de titre, afin d'éviter toute duplication.
 */

import { Text, TextStyle } from 'pixi.js';

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

/** Options de style pour `createCenteredTitle` (voir `titleStyle`). */
export interface TitleOptions {
  /** Couleur du texte (0xRRGGBB). */
  fill: number;
  /** Taille (px). */
  fontSize: number;
  /** Interligne des lettres (px, défaut 4). */
  letterSpacing?: number;
  /** Couleur du contour (chaîne CSS). */
  strokeColor: string;
  /** Épaisseur du contour (px, défaut 5). */
  strokeWidth?: number;
}

/**
 * Fabriquant du titre d'un écran : texte centré horizontalement à l'écran,
 * ancré sur son centre (la position désigne donc le milieu du titre).
 * Centralise le motif commun à tous les écrans (Menu, salle d'attente...).
 *
 * @param text Libellé affiché.
 * @param y    Ordonnée du centre du titre (dans l'espace de conception).
 * @param opts Style du titre.
 */
export function createCenteredTitle(text: string, y: number, opts: TitleOptions): Text {
  const title = new Text({
    text,
    style: titleStyle(
      opts.fill,
      opts.fontSize,
      opts.letterSpacing ?? 4,
      opts.strokeColor,
      opts.strokeWidth ?? 5,
    ),
  });
  title.anchor.set(0.5);
  title.position.set(DESIGN_WIDTH / 2, y);
  return title;
}