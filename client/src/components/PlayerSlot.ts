/**
 * Emplacement d'un joueur dans la salle d'attente.
 *
 * Dessine le rectangle du coin, l'image du personnage choisi par le joueur
 * (première pose de sa planche, fournie par le renderer) puis ses deux lignes
 * de texte : le pseudo (avec la marque « · vous » pour le joueur local) et
 * l'état « prêt » ou « pas prêt ». Un emplacement vide affiche « EN ATTENTE… »
 * au centre.
 *
 * L'origine du composant est le CENTRE de l'emplacement : le parent le
 * place d'un seul coup via `position`. L'écran d'attente se contente de
 * déléguer chaque parcelle à un joueur (ou à personne) : toute la
 * présentation vit ici.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { COLORS, statusStyle } from '../design.js';
import type { Player } from '../lobby/LobbyBus.js';

/** Dimensions d'un emplacement (px), exposées pour le placement en coins. */
export const SLOT_WIDTH = 300;
export const SLOT_HEIGHT = 220;

/** Hauteur de l'image du personnage dans l'emplacement (px). */
export const SLOT_PREVIEW_HEIGHT = 96;

/** Ordonnée de la zone d'image (px, depuis le centre de l'emplacement). Le
 *  sélecteur du joueur local est posé exactement à cet endroit, en
 *  remplacement de son portrait : tous les personnages de la salle sont donc
 *  alignés sur la même zone. */
export const SLOT_PREVIEW_OFFSET = -28;

/** Décrochages verticaux du pseudo et de l'état depuis le centre (px). */
const NAME_OFFSET = 50;
const STATUS_OFFSET = 82;
/** Le libellé « EN ATTENTE… » est centré dans l'emplacement vide. */
const EMPTY_NAME_OFFSET = 0;

/** Libellés et marqueur du joueur local. */
const EMPTY_LABEL = 'EN ATTENTE…';
const READY_LABEL = 'PRÊT';
const NOT_READY_LABEL = 'PAS PRÊT';
const SELF_SUFFIX = ' · vous';

/** Style du pseudo (neutre, couleur claire partagée). */
const NAME_STYLE = new TextStyle({
  fontFamily: 'Arial',
  fontSize: 22,
  fontWeight: 'bold',
  fill: COLORS.text,
});
/** Style de l'état « prêt » (vert). */
const READY_STYLE = statusStyle(COLORS.ready);
/** Style de l'état « pas prêt » et de l'attente (gris). */
const NOT_READY_STYLE = statusStyle(COLORS.muted);

export class PlayerSlot extends Container {
  /** Pseudo affiché (ou « EN ATTENTE… »), exposé pour les tests. */
  readonly nameText: Text;
  /** État affiché (ou vide), exposé pour les tests. */
  readonly statusText: Text;
  /** Zone d'accueil de l'image du personnage, exposée pour les tests. */
  readonly previewHolder: Container;

  /** Image actuellement affichée (`null` si emplacement vide). */
  private preview: Container | null = null;

  /** Vrai si une image de personnage est affichée dans cet emplacement. */
  get hasPreview(): boolean {
    return this.preview !== null;
  }

  constructor() {
    super();

    // Rectangle arrondi de l'emplacement, centré sur l'origine.
    const gfx = new Graphics();
    gfx
      .roundRect(-SLOT_WIDTH / 2, -SLOT_HEIGHT / 2, SLOT_WIDTH, SLOT_HEIGHT, 12)
      .fill(COLORS.panel)
      .stroke({ width: 2, color: COLORS.border });

    // L'image du personnage est logée dans un conteneur intermédiaire,
    // calé dans la moitié haute : elle reste ainsi centrée horizontalement
    // et alignée sur la zone d'image de tous les emplacements (le sélecteur
    // en rectangle du joueur local occupe la même zone).
    this.previewHolder = new Container();
    this.previewHolder.position.set(0, SLOT_PREVIEW_OFFSET);

    this.nameText = new Text({ text: EMPTY_LABEL, style: NAME_STYLE });
    this.nameText.anchor.set(0.5);
    this.nameText.position.set(0, EMPTY_NAME_OFFSET);

    this.statusText = new Text({ text: '', style: NOT_READY_STYLE });
    this.statusText.anchor.set(0.5);
    this.statusText.position.set(0, STATUS_OFFSET);

    this.addChild(gfx, this.previewHolder, this.nameText, this.statusText);
  }

  /**
   * Affiche un joueur dans l'emplacement (ou le vide si absent).
   *
   * @param player Joueur occupant l'emplacement, ou `undefined` s'il est libre.
   * @param isSelf Vrai si `player` est le joueur local (marque « · vous »).
   */
  setPlayer(player: Player | undefined, isSelf: boolean): void {
    if (!player) {
      this.nameText.text = EMPTY_LABEL;
      this.nameText.position.set(0, EMPTY_NAME_OFFSET);
      this.statusText.text = '';
      return;
    }

    this.nameText.text = isSelf ? `${player.name}${SELF_SUFFIX}` : player.name;
    this.nameText.position.set(0, NAME_OFFSET);
    this.statusText.text = player.ready ? READY_LABEL : NOT_READY_LABEL;
    this.statusText.style = player.ready ? READY_STYLE : NOT_READY_STYLE;
  }

  /**
   * Affiche l'image du personnage dans l'emplacement (ou la retire).
   *
   * L'image est fournie par le renderer — première pose de la planche,
   * rognée sur son contenu — et déjà centrée sur elle-même ; c'est la zone
   * d'accueil qui se charge du positionnement.
   */
  setPreview(preview: Container | null): void {
    if (this.preview) {
      this.previewHolder.removeChild(this.preview);
    }
    this.preview = preview;
    if (preview) {
      this.previewHolder.addChild(preview);
    }
  }
}