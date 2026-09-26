/**
 * Bus d'événements du lobby (salle d'attente).
 *
 * Relie la couche réseau à l'affichage : le serveur — réel ou simulé
 * (mock) — rapporte les arrivées et départs via `join` / `leave`, et les
 * écrans s'abonnent avec `on` pour redessiner la salle. Aucun écran ne
 * parle directement au réseau : ce bus joue le rôle d'intermédiaire
 * (pattern « bus d'événements »). Le protocole exact (format des messages
 * JSON) sera défini par le pôle backend ; ce bus est prêt à le consommer.
 */

import { CHARACTERS } from './characters.js';

/** Un joueur présent dans la salle d'attente. */
export interface Player {
  /** Identifiant unique fourni par le serveur. */
  readonly id: string;
  /** Pseudo affiché dans la salle. */
  readonly name: string;
  /** Personnage choisi (id du catalogue) : un seul joueur par personnage. */
  readonly characterId: string;
  /** Vrai si le joueur s'est déclaré prêt à commencer. */
  readonly ready: boolean;
}

/** Fonction appelée à chaque changement de la liste des joueurs. */
export type PlayersListener = (players: readonly Player[]) => void;

/** Nombre maximum de joueurs dans une partie (règle du jeu : 2 à 4). */
export const MAX_PLAYERS = 4;

/** Joueur stocké en interne : seul `ready` et `characterId` sont mutables
 *  (états évolutifs). */
type StoredPlayer = {
  id: string;
  name: string;
  characterId: string;
  ready: boolean;
};

export class LobbyBus {
  private players_: StoredPlayer[] = [];
  private listeners_ = new Set<PlayersListener>();

  /** Les joueurs actuellement présents dans la salle (copies). */
  get players(): readonly Player[] {
    return this.players_.map((p) => ({ ...p }));
  }

  /**
   * S'abonne aux changements de la liste des joueurs.
   *
   * @param listener Fonction appelée à chaque arrivée, départ ou
   *                 changement d'état (prêt ou non).
   * @returns Fonction qui annule l'abonnement.
   */
  on(listener: PlayersListener): () => void {
    this.listeners_.add(listener);
    return () => {
      this.listeners_.delete(listener);
    };
  }

  /**
   * Signale l'arrivée d'un joueur dans la salle.
   *
   * Un joueur identifié par le même `id` ne peut pas entrer deux fois, et
   * un joueur ne peut pas entrer avec un personnage déjà pris (un seul
   * joueur par perso) : la demande est alors ignorée. Sans personnage
   * précisé, le premier libre (dans l'ordre du catalogue) est attribué.
   * Le joueur arrive « pas prêt » par défaut (`ready` absent = faux).
   */
  join(player: Player): void {
    if (this.players_.some((p) => p.id === player.id)) {
      return;
    }

    let characterId: string | undefined = player.characterId;
    if (!characterId) {
      characterId = this.nextFreeCharacter();
    }
    if (!characterId || this.isTaken(characterId)) {
      return;
    }

    this.players_.push({
      id: player.id,
      name: player.name,
      characterId,
      ready: player.ready ?? false,
    });
    this.notify();
  }

  /** Signale le départ d'un joueur ; sans effet si l'id est inconnu. */
  leave(playerId: string): void {
    const before = this.players_.length;
    this.players_ = this.players_.filter((p) => p.id !== playerId);
    if (this.players_.length !== before) {
      this.notify();
    }
  }

  /**
   * Met à jour l'état « prêt » d'un joueur (action déclenchée par le
   * serveur : chaque client ne peut marquer que lui-même). Sans effet si
   * le joueur est inconnu ou si l'état ne change pas.
   */
  setReady(playerId: string, ready: boolean): void {
    const player = this.players_.find((p) => p.id === playerId);
    if (!player || player.ready === ready) {
      return;
    }
    player.ready = ready;
    this.notify();
  }

  /**
   * Change le personnage d'un joueur.
   *
   * Règle d'unicité : un personnage déjà porté par un autre joueur est
   * refusé (aucun effet). Ne notifie pas si le joueur est inconnu ou si le
   * personnage demandé est déjà le sien.
   *
   * @returns Vrai si le changement a été appliqué.
   */
  setCharacter(playerId: string, characterId: string): boolean {
    const player = this.players_.find((p) => p.id === playerId);
    if (!player || player.characterId === characterId || this.isTaken(characterId, playerId)) {
      return false;
    }
    player.characterId = characterId;
    this.notify();
    return true;
  }

  /** Vrai si le personnage est porté par un joueur présent (hors `exceptId`). */
  private isTaken(characterId: string, exceptId?: string): boolean {
    return this.players_.some(
      (p) => p.id !== exceptId && p.characterId === characterId,
    );
  }

  /** Premier personnage du catalogue non encore pris (ordre du roster). */
  private nextFreeCharacter(): string | undefined {
    return CHARACTERS.find((c) => !this.isTaken(c.id))?.id;
  }

  /** Prévient tous les abonnés de l'état courant (liste copiée). */
  private notify(): void {
    const snapshot = this.players;
    for (const listener of [...this.listeners_]) {
      listener(snapshot);
    }
  }
}