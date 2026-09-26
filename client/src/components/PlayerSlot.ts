/**
 * Emplacement d'un joueur dans la salle d'attente.
 *
 * Dessine le rectangle du coin et ses deux lignes de texte : le pseudo
 * (avec la marque « · vous » pour le joueur local) et l'état « prêt » ou
 * « pas prêt ». Un emplacement vide affiche « EN ATTENTE… ».
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

/** Décrochages verticaux du pseudo et de l'état depuis le centre (px). */
const NAME_OFFSET = -18;
const STATUS_OFFSET = 26;

/** Bascule du pseudo à droite, pour libérer la U du sélecteur. */
const PICKED_NAMESHIFT = 56;

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

  constructor() {
    super();

    // Rectangle arrondi de l'emplacement, centré sur l'origine.
    const gfx = new Graphics();
    gfx
      .roundRect(-SLOT_WIDTH / 2, -SLOT_HEIGHT / 2, SLOT_WIDTH, SLOT_HEIGHT, 12)
      .fill(COLORS.panel)
      .stroke({ width: 2, color: COLORS.border });

    this.nameText = new Text({ text: EMPTY_LABEL, style: NAME_STYLE });
    this.nameText.anchor.set(0.5);
    this.nameText.position.set(0, NAME_OFFSET);

    this.statusText = new Text({ text: '', style: NOT_READY_STYLE });
    this.statusText.anchor.set(0.5);
    this.statusText.position.set(0, STATUS_OFFSET);

    this.addChild(gfx, this.nameText, this.statusText);
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
      this.statusText.text = '';
      return;
    }

    this.nameText.text = isSelf ? `${player.name}${SELF_SUFFIX}` : player.name;
    this.statusText.text = player.ready ? READY_LABEL : NOT_READY_LABEL;
    this.statusText.style = player.ready ? READY_STYLE : NOT_READY_STYLE;
  }

  /**
   * Décale le pseudo vers la droite pour laisser la place au sélecteur en
   * U dans l'angle supérieur gauche de l'emplacement — réservé à
   * l'emplacement du joueur local.
   */
  setPicked(picked: boolean): void {
    this.nameText.position.set(picked ? PICKED_NAMESHIFT : 0, NAME_OFFSET);
  }
}