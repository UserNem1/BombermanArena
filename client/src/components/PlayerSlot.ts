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
import { COLORS } from '../design.js';
import { getCharacter } from '../lobby/characters.js';
import type { Player } from '../lobby/LobbyBus.js';

/** Dimensions d'un emplacement (px), exposées pour le placement en coins. */
export const SLOT_WIDTH = 300;
export const SLOT_HEIGHT = 220;

/** Décrochages verticaux du pseudo et de l'état depuis le centre (px). */
const NAME_OFFSET = -18;
const STATUS_OFFSET = 26;

/** Pastille de couleur du personnage (à gauche du pseudo). */
const AVATAR_RADIUS = 16;
const AVATAR_X = -72;

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
const READY_STYLE = new TextStyle({
  fontFamily: 'Arial',
  fontSize: 16,
  fontWeight: 'bold',
  letterSpacing: 2,
  fill: COLORS.ready,
});
/** Style de l'état « pas prêt » et de l'attente (gris). */
const NOT_READY_STYLE = new TextStyle({
  fontFamily: 'Arial',
  fontSize: 16,
  fontWeight: 'bold',
  letterSpacing: 2,
  fill: COLORS.muted,
});

export class PlayerSlot extends Container {
  /** Pseudo affiché (ou « EN ATTENTE… »), exposé pour les tests. */
  readonly nameText: Text;
  /** État affiché (ou vide), exposé pour les tests. */
  readonly statusText: Text;
  /** Pastille de couleur du personnage du joueur (masquée si vide). */
  readonly avatar: Graphics;

  constructor() {
    super();

    // Rectangle arrondi de l'emplacement, centré sur l'origine.
    const gfx = new Graphics();
    gfx
      .roundRect(-SLOT_WIDTH / 2, -SLOT_HEIGHT / 2, SLOT_WIDTH, SLOT_HEIGHT, 12)
      .fill(COLORS.panel)
      .stroke({ width: 2, color: COLORS.border });

    // Pastille de la couleur du personnage du joueur.
    this.avatar = new Graphics();
    this.avatar.position.set(AVATAR_X, NAME_OFFSET);
    this.avatar.visible = false;

    this.nameText = new Text({ text: EMPTY_LABEL, style: NAME_STYLE });
    this.nameText.anchor.set(0.5);
    this.nameText.position.set(0, NAME_OFFSET);

    this.statusText = new Text({ text: '', style: NOT_READY_STYLE });
    this.statusText.anchor.set(0.5);
    this.statusText.position.set(0, STATUS_OFFSET);

    this.addChild(gfx, this.avatar, this.nameText, this.statusText);
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
      this.avatar.visible = false;
      return;
    }

    this.nameText.text = isSelf ? `${player.name}${SELF_SUFFIX}` : player.name;
    this.statusText.text = player.ready ? READY_LABEL : NOT_READY_LABEL;
    this.statusText.style = player.ready ? READY_STYLE : NOT_READY_STYLE;

    // Pastille de la couleur du personnage (les joueurs sans perso connu
    // n'en ont pas : rendu neutre).
    const character = getCharacter(player.characterId);
    if (character) {
      this.avatar.clear();
      this.avatar
        .circle(0, 0, AVATAR_RADIUS)
        .fill(character.color);
      this.avatar.visible = true;
    } else {
      this.avatar.visible = false;
    }
  }
}