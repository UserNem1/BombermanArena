/**
 * Sélecteur de personnage de la salle d'attente.
 *
 * Un cadre **rectangle** posé au centre de l'emplacement du joueur local, à
 * la place de son portrait : on clique dessus pour changer de personnage. Le
 * trait retenu reste dans les tons sourds de l'interface (le bleu d'accent
 * fatigued l'œil sur une petite image). À l'intérieur apparaît la première
 * pose du perso (image pré-mise à l'échelle par le renderer) ; sans image, le
 * cadre reste vide. Le parent choisit le perso suivant (logique réseau) via
 * le callback `onPick`.
 *
 * Le cadre est statique (dessiné une fois) : seule l'image change. Sa taille
 * est celle de la zone d'image des emplacements (`SLOT_PREVIEW_HEIGHT`), pour
 * que tous les personnages de la salle aient la même hauteur d'affichage.
 */

import { Container, Graphics } from 'pixi.js';
import { COLORS } from '../design.js';
import type { Character } from '../lobby/characters.js';

/** Dimensions du cadre (px) : elles enveloppent la zone d'image des
 *  emplacements, cadre centré dessus par l'écran d'attente. */
const PICKER_WIDTH = 104;
const PICKER_HEIGHT = 112;

/** Rayon des coins et épaisseur du trait du cadre (px). */
const CORNER_RADIUS = 8;
const BORDER_WIDTH = 3;

/** Fond du cadre : plus sombre que l'emplacement, pour faire ressortir la
 *  pose sans contraste agressif. */
const FRAME_FILL = 0x1b1636;

export class CharacterPicker extends Container {
  private readonly gfx = new Graphics();
  private readonly onPick: () => void;
  private character_: Character | null;
  private preview: Container | null = null;

  constructor(character: Character | null, onPick: () => void) {
    super();
    this.character_ = character;
    this.onPick = onPick;

    // Sensible à la souris comme les boutons.
    this.eventMode = 'static';
    this.cursor = 'pointer';

    this.gfx
      .roundRect(
        -PICKER_WIDTH / 2,
        -PICKER_HEIGHT / 2,
        PICKER_WIDTH,
        PICKER_HEIGHT,
        CORNER_RADIUS,
      )
      .fill(FRAME_FILL)
      .stroke({ width: BORDER_WIDTH, color: COLORS.border });

    this.on('pointertap', () => this.onPick());
    this.addChild(this.gfx);
  }

  /** Personnage affiché (ou `null` si inconnu), exposé pour les tests. */
  get character(): Character | null {
    return this.character_;
  }

  /** Vrai si une image de personnage est affichée dans le cadre. */
  get hasPreview(): boolean {
    return this.preview !== null;
  }

  /** Change le personnage affiché. */
  setCharacter(character: Character | null): void {
    this.character_ = character;
  }

  /**
   * Affiche l'image du personnage (première pose, fournie pré-mise à
   * l'échelle par le renderer) ; `null` vide la U.
   */
  setPreview(preview: Container | null): void {
    if (this.preview) {
      this.removeChild(this.preview);
    }
    this.preview = preview;
    if (preview) {
      this.addChild(preview);
    }
  }

  /** Déclenche le changement de personnage (appelé par le parent). */
  activate(): void {
    this.onPick();
  }
}