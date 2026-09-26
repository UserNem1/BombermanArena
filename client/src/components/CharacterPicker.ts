/**
 * Sélecteur de personnage en « U » de la salle d'attente.
 *
 * Une « U » (cadre carré ouvert en haut) posée dans l'angle supérieur
 * gauche de l'emplacement du joueur local : on clique dessus pour changer
 * de personnage. À l'intérieur apparaît la première pose du perso (image
 * pré-mise à l'échelle par le renderer) ; sans image, la U reste vide. Le
 * parent choisit le perso suivant (logique réseau) via le callback
 * `onPick`.
 *
 * Le cadre est statique (dessiné une fois) : seule l'image change.
 */

import { Container, Graphics } from 'pixi.js';
import { COLORS } from '../design.js';
import type { Character } from '../lobby/characters.js';

/** Dimensions du cadre en U (px), exposées pour le positionnement. */
export const PICKER_WIDTH = 92;
export const PICKER_HEIGHT = 116;

/** Hauteur max de l'image du personnage dans la U (px). */
export const PICKER_PREVIEW_HEIGHT = 100;

/** Rayon des coins et épaisseur du trait de la U (px). */
const CORNER_RADIUS = 8;
const BORDER_WIDTH = 5;

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
      .moveTo(-PICKER_WIDTH / 2, -PICKER_HEIGHT / 2 + CORNER_RADIUS)
      .lineTo(-PICKER_WIDTH / 2, PICKER_HEIGHT / 2)
      .moveTo(PICKER_WIDTH / 2, -PICKER_HEIGHT / 2 + CORNER_RADIUS)
      .lineTo(PICKER_WIDTH / 2, PICKER_HEIGHT / 2)
      .moveTo(-PICKER_WIDTH / 2 + CORNER_RADIUS, PICKER_HEIGHT / 2)
      .lineTo(PICKER_WIDTH / 2 - CORNER_RADIUS, PICKER_HEIGHT / 2)
      .stroke({
        width: BORDER_WIDTH,
        color: COLORS.border,
        cap: 'round',
        join: 'round',
      });

    this.on('pointertap', () => this.onPick());
    this.addChild(this.gfx);
  }

  /** Personnage affiché (ou `null` si inconnu), exposé pour les tests. */
  get character(): Character | null {
    return this.character_;
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