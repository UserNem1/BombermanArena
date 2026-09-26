/**
 * Curseur de volume (barre horizontale).
 *
 * Une piste avec un remplissage proportionnel à la valeur et une poignée
 * déplaçable à la souris : un clic sur la piste y place la poignée, un
 * glisser la déplace en continu. La valeur est comprise entre 0 et 1 ;
 * `onChange` est appelé à chaque variation avec la nouvelle valeur.
 * (Le support clavier viendra dans un commit ultérieur.)
 *
 * Fin de glisser : on ne dépend pas d'un seul événement `pointerup`. Le
 * relâchement peut arriver hors de la zone du curseur (sur un autre bouton,
 * hors de la fenêtre...) ; on écoute donc aussi `pointerupoutside`,
 * `globalpointerup` et un `pointerup` au niveau de la fenêtre, tous
 * idempotents, pour ne jamais « rester bloqué » en mode glisser.
 */

import { Container, Graphics, Rectangle } from 'pixi.js';
import type { FederatedPointerEvent } from 'pixi.js';

/** Dimensions de la piste et de la poignée (px). */
const TRACK_WIDTH = 420;
const TRACK_HEIGHT = 18;
const HANDLE_RADIUS = 14;

/** Couleurs du curseur (0xRRGGBB). */
const TRACK_FILL = 0x2b2f4a;
const TRACK_BORDER = 0x6c63a8;
const PROGRESS_FILL = 0xf77f00;
const HANDLE_FILL = 0x9fd0ff;

export class Slider extends Container {
  private readonly gfx = new Graphics();
  private dragging = false;
  private _value = 0;

  /**
   * @param onChange   Appelé avec la nouvelle valeur (0 à 1).
   * @param initialValue Valeur de départ (défaut : 0).
   */
  constructor(
    private readonly onChange: (value: number) => void,
    initialValue = 0,
  ) {
    super();
    this._value = initialValue;

    // Rend le curseur sensible à la souris, curseur en main.
    this.eventMode = 'static';
    this.cursor = 'pointer';
    // Zone cliquable : la piste plus la portée de la poignée.
    this.hitArea = new Rectangle(
      -TRACK_WIDTH / 2 - HANDLE_RADIUS,
      -HANDLE_RADIUS,
      TRACK_WIDTH + HANDLE_RADIUS * 2,
      HANDLE_RADIUS * 2,
    );

    this.on('pointerdown', this.onPress);
    // `globalpointermove` suit la souris même quand elle quitte le curseur.
    this.on('globalpointermove', this.onMove);
    // Fin de glisser : plusieurs sources sûres (dont la fenêtre entière).
    this.on('pointerup', this.endDrag);
    this.on('pointerupoutside', this.endDrag);
    this.on('globalpointerup', this.endDrag);
    window.addEventListener('pointerup', this.endDrag);

    this.addChild(this.gfx);
    this.paint();
  }

  /** Valeur courante (0 à 1). */
  get value(): number {
    return this._value;
  }

  private readonly onPress = (event: FederatedPointerEvent): void => {
    this.dragging = true;
    this.setFromPointer(event);
  };

  private readonly onMove = (event: FederatedPointerEvent): void => {
    if (this.dragging) {
      this.setFromPointer(event);
    }
  };

  /** Termine le glisser (déclenchable plusieurs fois, sans effet redondant). */
  private readonly endDrag = (): void => {
    if (!this.dragging) return;
    this.dragging = false;
  };

  /** Calcule la valeur depuis les coordonnées locales « x ». */
  private valueFromX(x: number): number {
    const left = -TRACK_WIDTH / 2;
    return Math.max(0, Math.min(1, (x - left) / TRACK_WIDTH));
  }

  private setFromPointer(event: FederatedPointerEvent): void {
    const next = this.valueFromX(event.getLocalPosition(this).x);
    if (next !== this._value) {
      this._value = next;
      this.paint();
      this.onChange(this._value);
    }
  }

  /** Redessine le curseur : piste, remplissage puis poignée. */
  private paint(): void {
    const progress = this._value * TRACK_WIDTH;
    const radius = TRACK_HEIGHT / 2;

    this.gfx.clear();
    this.gfx
      .roundRect(-TRACK_WIDTH / 2, -radius, TRACK_WIDTH, TRACK_HEIGHT, radius)
      .fill(TRACK_FILL)
      .stroke({ width: 2, color: TRACK_BORDER });
    if (progress > 0) {
      this.gfx
        .roundRect(-TRACK_WIDTH / 2, -radius, progress, TRACK_HEIGHT, radius)
        .fill(PROGRESS_FILL);
    }
    this.gfx
      .circle(-TRACK_WIDTH / 2 + progress, 0, HANDLE_RADIUS)
      .fill(HANDLE_FILL);
  }
}