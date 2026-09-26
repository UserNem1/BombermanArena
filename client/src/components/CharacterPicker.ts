/**
 * Sélecteur de personnage en « U » de la salle d'attente.
 *
 * Une « U » (cadre carré ouvert en haut) posée dans l'angle supérieur
 * gauche de l'emplacement du joueur local : on clique dessus pour changer
 * de personnage. À l'intérieur apparaît l'image du perso (la planche entière
 * fournie par le renderer, pré-mise à l'échelle) ou, à défaut d'image,
 * une pastille de sa couleur. Le parent choisit le perso suivant (logique
 * réseau) via le callback `onPick`.
 *
 * Le cadre est statique (dessiné une fois) : seuls l'image/la pastille
 * changent. Quand l'image est fournie, elle est ajoutée comme enfant et la
 * pastille de repli est retirée ; sans personnage connu, le cadre reste
 * vide.
 */

import { Container, Graphics } from 'pixi.js';
import { COLORS, fillDisc } from '../design.js';
import type { Character } from '../lobby/characters.js';

/** Dimensions du cadre en U (px), exposées pour le positionnement. */
export const PICKER_WIDTH = 92;
export const PICKER_HEIGHT = 116;

/** Hauteur max de l'image du personnage dans la U (px). */
export const PICKER_PREVIEW_HEIGHT = 100;

/** Rayon des coins et épaisseur du trait de la U (px). */
const CORNER_RADIUS = 8;
const BORDER_WIDTH = 5;

/** Pastille de repli (sans image) : rayon et position (px). */
const FALLBACK_RADIUS = 18;

export class CharacterPicker extends Container {
  private readonly gfx = new Graphics();
  private readonly onPick: () => void;
  private character_: Character | null;
  private preview: Container | null = null;
  private fallback: Graphics | null = null;

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
    this.renderFallback();
  }

  /** Personnage affiché (ou `null` si inconnu), exposé pour les tests. */
  get character(): Character | null {
    return this.character_;
  }

  /** Change le personnage affiché (pastille de repli si pas d'image). */
  setCharacter(character: Character | null): void {
    this.character_ = character;
    this.renderFallback();
  }

  /**
   * Affiche l'image du personnage (fournie pré-mise à l'échelle par le
   * renderer) ; `null` restaure la pastille de repli.
   */
  setPreview(preview: Container | null): void {
    if (this.preview) {
      this.removeChild(this.preview);
    }
    this.preview = preview;
    if (preview) {
      this.addChild(preview);
    }
    this.renderFallback();
  }

  /** Déclenche le changement de personnage (appelé par le parent). */
  activate(): void {
    this.onPick();
  }

  /** Montre la pastille de repli seulement quand aucune image n'est là. */
  private renderFallback(): void {
    if (this.preview) {
      if (this.fallback) {
        this.removeChild(this.fallback);
        this.fallback = null;
      }
      return;
    }
    if (!this.character_ || this.fallback) {
      return;
    }
    this.fallback = fillDisc(new Graphics(), FALLBACK_RADIUS, this.character_.color);
    this.addChild(this.fallback);
  }
}