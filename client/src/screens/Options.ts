/**
 * Page des options du jeu.
 *
 * Pour l'instant : la grille en fond, un titre, deux réglages de volume
 * (musique et sons du jeu, chacun sous forme d'une barre de 0 à 100 %)
 * et un bouton « Retour » qui ramène au menu principal. Les autres
 * réglages viendront ensuite.
 */

import { Container, Text, TextStyle } from 'pixi.js';
import { Button } from '../components/Button.js';
import { Slider } from '../components/Slider.js';
import { DESIGN_HEIGHT, DESIGN_WIDTH, TITLE_Y, titleStyle } from '../design.js';
import { Grid } from '../components/Grid.js';

/** Couleur du titre de la page. */
const TITLE_COLOR = 0x4cc9f0;
const TITLE_STROKE = '#0b2545';

/** Style des libellés de volume. */
const VOLUME_LABEL_STYLE = new TextStyle({
  fontFamily: 'Arial',
  fontSize: 20,
  fontWeight: 'bold',
  letterSpacing: 2,
  fill: 0xdfe4ff,
});

/** Ordonnées des deux curseurs, en fraction de la hauteur. */
const MUSIC_Y = 0.55;
const SFX_Y = 0.68;

/** Décalage vertical du libellé au-dessus de son curseur (px). */
const LABEL_OFFSET = 40;

/** Ordonnée du bouton retour, en fraction de la hauteur. */
const BACK_Y = 0.82;

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

    // Les deux réglages de volume : la musique et les sons du jeu.
    this.addVolumeRow('MUSIQUE', MUSIC_Y, 1);
    this.addVolumeRow('SONS', SFX_Y, 1);

    // Retour au menu principal.
    const back = new Button('RETOUR', onBack);
    back.position.set(DESIGN_WIDTH / 2, DESIGN_HEIGHT * BACK_Y);
    this.addChild(back);
  }

  /**
   * Ajoute une rangée « libellé + barre de volume » à l'ordonnée `y`.
   *
   * @param label        Nom du canal (ex. : « MUSIQUE »).
   * @param y            Ordonnée de la barre, en fraction de la hauteur.
   * @param initialValue Valeur de départ (0 à 1).
   */
  private addVolumeRow(label: string, y: number, initialValue: number): void {
    // Libellé affiché au-dessus de la barre, mis à jour à chaque variation.
    const text = new Text({
      text: `${label} : ${Math.round(initialValue * 100)} %`,
      style: VOLUME_LABEL_STYLE,
    });
    text.anchor.set(0.5);
    text.position.set(DESIGN_WIDTH / 2, DESIGN_HEIGHT * y - LABEL_OFFSET);
    this.addChild(text);

    // La barre : clic pour positionner, glisser pour régler.
    const slider = new Slider((value) => {
      text.text = `${label} : ${Math.round(value * 100)} %`;
    }, initialValue);
    slider.position.set(DESIGN_WIDTH / 2, DESIGN_HEIGHT * y);
    this.addChild(slider);
  }
}