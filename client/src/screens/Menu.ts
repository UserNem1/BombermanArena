/**
 * Menu principal du jeu.
 *
 * Construit le fond (image du menu), le titre et les trois boutons dans
 * l'espace de conception (1280x720). Le renderer met cette scène à
 * l'échelle et la centre, puis étire le fond pour couvrir toute la fenêtre
 * via `coverBackdrop`.
 */

import { Container, Sprite, Text, Texture } from 'pixi.js';
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
  /** Fond conservé pour pouvoir le redimensionner à chaque changement de
   *  taille de la fenêtre. Absent si le chargement de l'image a échoué. */
  private readonly backdrop?: Sprite;

  /**
   * @param background Image de fond du menu (1920x1080). À défaut, on
   *   retombe sur la grille de l'arène (utile si le chargement échoue).
   */
  constructor(background?: Texture) {
    super();

    // Décor de fond, ajouté en premier pour rester derrière le titre et
    // les boutons : l'image du menu si elle est fournie, sinon la grille.
    if (background) {
      this.backdrop = new Sprite(background);
      this.backdrop.anchor.set(0.5);
      this.addChild(this.backdrop);
    } else {
      this.addChild(new Grid());
    }

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

  /**
   * Redimensionne le fond pour couvrir toute la zone visible de l'écran.
   * La zone est exprimée dans le repère du menu (espace de conception) :
   * elle déborde donc de la grille quand la fenêtre n'est pas en 16:9, ce
   * qui évite les bandes du letterbox autour de l'image. L'image garde son
   * ratio (recadrage centré). Sans fond, cette méthode ne fait rien.
   */
  coverBackdrop(x: number, y: number, width: number, height: number): void {
    if (!this.backdrop) {
      return;
    }
    const image = this.backdrop.texture;
    const cover = Math.max(width / image.width, height / image.height);
    this.backdrop.setSize(image.width * cover, image.height * cover);
    this.backdrop.position.set(x + width / 2, y + height / 2);
  }
  /**
   * Ajoute un élément dans le repère du fond : il suivra donc
   * exactement les redimensionnements du décor.
   */
  addToBackdrop(child: Container): boolean {
     if (!this.backdrop) {
       return false;
   }

     this.backdrop.addChild(child);
       return true;
   }  
}
