/**
 * Menu principal du jeu.
 *
 * Construit le titre et les trois boutons dans l'espace de conception
 * (1280x720). Le renderer se charge de mettre cette scène à l'échelle et
 * de la centrer dans la fenêtre ; le fond uni, lui, est géré par le
 * canvas PixiJS.
 */

import { Container, Text } from 'pixi.js';
import { Button } from '../components/Button.js';
import {
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  TITLE_Y,
  titleStyle,
} from '../design.js';
import { Grid } from '../components/Grid.js';

/** Couleurs du menu (0xRRGGBB). */
const TITLE_COLOR = 0xffd166;
const SUBTITLE_COLOR = 0x4cc9f0;
const TITLE_STROKE = '#4a1d00';
const SUBTITLE_STROKE = '#0b2545';

/** Décalage du sous-titre sous le titre (px). */
const SUBTITLE_OFFSET = 58;

/** Ordonnée du premier bouton et espacement vertical (px). */
const BUTTONS_Y = 0.56;
const BUTTON_GAP = 64;

/**
 * Un menu est un `Container` : un groupe d'objets graphiques que l'on
 * peut déplacer, mettre à l'échelle et afficher d'un seul bloc.
 */
export class Menu extends Container {
  constructor() {
    super();

    // Décor de fond : la grille de l'arène, ajoutée en premier pour
    // rester derrière le titre et les boutons.
    this.addChild(new Grid());

    // Titre principal. `Text` dessine du texte et `TextStyle` décrit son
    // apparence (police, taille, couleur, contour...).
    const title = new Text({
      text: 'BOMBERMAN',
      style: titleStyle(TITLE_COLOR, 64, 6, TITLE_STROKE, 7),
    });
    // `anchor` place l'origine du texte en son centre : la position
    // indiquée correspond donc au centre du texte, pas à son coin.
    title.anchor.set(0.5);
    title.position.set(DESIGN_WIDTH / 2, DESIGN_HEIGHT * TITLE_Y);

    // Sous-titre, centré sous le titre.
    const subtitle = new Text({
      text: 'ARENA',
      style: titleStyle(SUBTITLE_COLOR, 34, 20, SUBTITLE_STROKE, 5),
    });
    subtitle.anchor.set(0.5);
    subtitle.position.set(DESIGN_WIDTH / 2, DESIGN_HEIGHT * TITLE_Y + SUBTITLE_OFFSET);

    // Ajoute les deux textes au menu.
    this.addChild(title, subtitle);

    // Libellé de chaque bouton et action associée. Un tableau de paires
    // [texte, fonction] évite de répéter trois fois le même code.
    const entries: [string, () => void][] = [
      ['JOUER', () => console.log('[menu] Jouer')],
      // L'écran Options arrive sur une branche dédiée : simple trace ici.
      ['OPTIONS', () => console.log('[menu] Options (à venir)')],
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
