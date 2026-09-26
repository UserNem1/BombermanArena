/**
 * Menu principal du jeu.
 *
 * Construit le titre et les trois boutons dans l'espace de conception
 * (1280x720). Le renderer se charge de mettre cette scène à l'échelle et
 * de la centrer dans la fenêtre ; le fond uni, lui, est géré par le
 * canvas PixiJS.
 */

import { Container } from 'pixi.js';
import { Button } from '../components/Button.js';
import {
  COLORS,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  TITLE_Y,
  createCenteredTitle,
} from '../design.js';
import { Grid } from '../components/Grid.js';

/** Couleurs du menu (0xRRGGBB). */
const TITLE_COLOR = 0xffd166;
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
  constructor(onPlay: () => void) {
    super();

    // Décor de fond : la grille de l'arène, ajoutée en premier pour
    // rester derrière le titre et les boutons.
    this.addChild(new Grid());

    // Titre principal, puis sous-titre centrés ; `createCenteredTitle`
    // gère l'ancrage au centre et le style partagé.
    const title = createCenteredTitle('BOMBERMAN', DESIGN_HEIGHT * TITLE_Y, {
      fill: TITLE_COLOR,
      fontSize: 64,
      letterSpacing: 6,
      strokeColor: TITLE_STROKE,
      strokeWidth: 7,
    });
    const subtitle = createCenteredTitle(
      'ARENA',
      DESIGN_HEIGHT * TITLE_Y + SUBTITLE_OFFSET,
      {
        fill: COLORS.accent,
        fontSize: 34,
        letterSpacing: 20,
        strokeColor: SUBTITLE_STROKE,
        strokeWidth: 5,
      },
    );

    // Ajoute les deux textes au menu.
    this.addChild(title, subtitle);

    // Libellé de chaque bouton et action associée. Un tableau de paires
    // [texte, fonction] évite de répéter trois fois le même code.
    const entries: [string, () => void][] = [
      ['JOUER', onPlay],
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
