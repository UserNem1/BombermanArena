/**
 * Menu principal du jeu.
 *
 * Construit le titre et les trois boutons dans l'espace de conception
 * (1280x720). Le renderer se charge de mettre cette scène à l'échelle et
 * de la centrer dans la fenêtre ; le fond uni, lui, est géré par le
 * canvas PixiJS.
 */

import { Container, Text, TextStyle } from 'pixi.js';
import { Button } from './Button.js';
import { DESIGN_HEIGHT, DESIGN_WIDTH } from './design.js';

/** Couleurs du menu (0xRRGGBB). */
const TITLE_COLOR = 0xffd166;
const SUBTITLE_COLOR = 0x4cc9f0;

/** Position verticale du titre, en fraction de la hauteur. */
const TITLE_Y = 0.3;

/** Décalage du sous-titre sous le titre (px). */
const SUBTITLE_OFFSET = 58;

/** Ordonnée du premier bouton et espacement vertical (px). */
const BUTTONS_Y = 0.56;
const BUTTON_GAP = 64;

/** Police d'affichage des titres. */
const DISPLAY_FONT = '"Arial Black", Impact, Arial, sans-serif';

/**
 * Un menu est un `Container` : un groupe d'objets graphiques que l'on
 * peut déplacer, mettre à l'échelle et afficher d'un seul bloc.
 */
export class Menu extends Container {
  constructor() {
    super();

    // Titre principal. `Text` dessine du texte et `TextStyle` décrit son
    // apparence (police, taille, couleur, contour...).
    const title = new Text({
      text: 'BOMBERMAN',
      style: new TextStyle({
        fontFamily: DISPLAY_FONT,
        fontSize: 64,
        fontWeight: '900',
        letterSpacing: 6,
        fill: TITLE_COLOR,
        stroke: { color: '#4a1d00', width: 7 },
        padding: 10,
      }),
    });
    // `anchor` place l'origine du texte en son centre : la position
    // indiquée correspond donc au centre du texte, pas à son coin.
    title.anchor.set(0.5);
    title.position.set(DESIGN_WIDTH / 2, DESIGN_HEIGHT * TITLE_Y);

    // Sous-titre, centré sous le titre.
    const subtitle = new Text({
      text: 'ARENA',
      style: new TextStyle({
        fontFamily: DISPLAY_FONT,
        fontSize: 34,
        fontWeight: '900',
        letterSpacing: 20,
        fill: SUBTITLE_COLOR,
        stroke: { color: '#0b2545', width: 5 },
        padding: 10,
      }),
    });
    subtitle.anchor.set(0.5);
    subtitle.position.set(DESIGN_WIDTH / 2, DESIGN_HEIGHT * TITLE_Y + SUBTITLE_OFFSET);

    // Ajoute les deux textes au menu.
    this.addChild(title, subtitle);

    // Libellé de chaque bouton et action associée. Un tableau de paires
    // [texte, fonction] évite de répéter trois fois le même code.
    const entries: [string, () => void][] = [
      ['JOUER', () => console.log('[menu] Jouer')],
      ['OPTIONS', () => console.log('[menu] Options')],
      ['QUITTER', () => window.close()],
    ];
    entries.forEach(([label, onClick], index) => {
      const button = new Button(label, onClick);
      // Les boutons sont empilés verticalement à partir de BUTTONS_Y.
      button.position.set(DESIGN_WIDTH / 2, DESIGN_HEIGHT * BUTTONS_Y + index * BUTTON_GAP);
      this.addChild(button);
    });
  }
}
