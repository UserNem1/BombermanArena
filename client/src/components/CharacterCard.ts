/**
 * Carte de sélection d'un personnage (parcelle du roster).
 *
 * Un petit panneau arrondi : pastille de la couleur du perso (dessinée une
 * fois, la carte entière se grise via l'opacité) et son nom en dessous.
 * Trois états visuels — libre (bordure neutre), pris par un autre joueur
 * (grisé, clic sans effet), choisi par le joueur local (bordure claire).
 * Le parent (l'écran d'attente) charge les états via `setSelected` /
 * `setTaken` à chaque liste de joueurs reçue.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { COLORS, fillDisc } from '../design.js';
import type { Character } from '../lobby/characters.js';

/** Dimensions de la carte et rayon des coins (px). */
const WIDTH = 110;
const HEIGHT = 86;
const RADIUS = 14;

/** Pastille de couleur et libellé (positions relatives au centre). */
const DISC_RADIUS = 20;
const DISC_Y = -14;
const LABEL_Y = 26;

const LABEL_STYLE = new TextStyle({
  fontFamily: 'Arial',
  fontSize: 16,
  fontWeight: 'bold',
  fill: COLORS.text,
});

export class CharacterCard extends Container {
  /** Personnage représenté par la carte (id, couleur, labels). */
  readonly character: Character;
  private readonly gfx = new Graphics();
  private readonly caption: Text;
  private readonly onClick: () => void;
  private selected_ = false;
  private taken_ = false;

  constructor(character: Character, onClick: () => void) {
    super();
    this.character = character;
    this.onClick = onClick;

    // Sensible à la souris comme les boutons.
    this.eventMode = 'static';
    this.cursor = 'pointer';

    // Pastille : couleur fixe du personnage, jamais redessinée. L'opacité
    // de la carte entière gère l'indisponibilité (cf. `paint`).
    const disc = fillDisc(new Graphics(), DISC_RADIUS, character.color);
    disc.position.set(0, DISC_Y);

    this.caption = new Text({ text: character.label, style: LABEL_STYLE });
    this.caption.anchor.set(0.5);
    this.caption.position.set(0, LABEL_Y);

    this.on('pointertap', () => this.activate());
    this.addChild(this.gfx, disc, this.caption);
    this.paint();
  }

  /** Vrai si le joueur local porte ce personnage. */
  get selected(): boolean {
    return this.selected_;
  }

  /** Vrai si un autre joueur porte déjà ce personnage. */
  get taken(): boolean {
    return this.taken_;
  }

  /** Marque la carte comme choisie par le joueur local. */
  setSelected(selected: boolean): void {
    this.selected_ = selected;
    this.paint();
  }

  /** Marque la carte comme prise par un autre joueur (indisponible). */
  setTaken(taken: boolean): void {
    this.taken_ = taken;
    this.paint();
  }

  /** Déclenche le choix du personnage (sans effet si la carte est prise). */
  activate(): void {
    if (!this.taken_) {
      this.onClick();
    }
  }

  /** Redessine le panneau selon ses états (sélection, indisponibilité). */
  private paint(): void {
    const border = this.selected_
      ? COLORS.accentLight
      : this.taken_
        ? COLORS.muted
        : COLORS.border;
    const borderWidth = this.selected_ ? 3 : 2;

    // Carte grisée quand un autre joueur l'a déjà prise.
    this.alpha = this.taken_ ? 0.45 : 1;

    this.gfx.clear();
    this.gfx
      .roundRect(-WIDTH / 2, -HEIGHT / 2, WIDTH, HEIGHT, RADIUS)
      .fill(COLORS.panel)
      .stroke({ width: borderWidth, color: border });
  }
}