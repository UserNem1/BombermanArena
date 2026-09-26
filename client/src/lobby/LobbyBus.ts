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

/** Un joueur présent dans la salle d'attente. */
export interface Player {
  /** Identifiant unique fourni par le serveur. */
  readonly id: string;
  /** Pseudo affiché dans la salle. */
  readonly name: string;
  /** Vrai si le joueur s'est déclaré prêt à commencer. */
  readonly ready: boolean;
}

/** Fonction appelée à chaque changement de la liste des joueurs. */
export type PlayersListener = (players: readonly Player[]) => void;

/** Nombre maximum de joueurs dans une partie (règle du jeu : 2 à 4). */
export const MAX_PLAYERS = 4;

/** Joueur stocké en interne : seul `ready` est mutable (état évolutif). */
type StoredPlayer = {
  id: string;
  name: string;
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
   * Un joueur identifié par le même `id` ne peut pas entrer deux fois :
   * la demande est alors ignorée. Le joueur arrive « pas prêt » par défaut
   * (`ready` absent du message = faux).
   */
  join(player: Player): void {
    if (this.players_.some((p) => p.id === player.id)) {
      return;
    }
    this.players_.push({
      id: player.id,
      name: player.name,
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

  /** Prévient tous les abonnés de l'état courant (liste copiée). */
  private notify(): void {
    const snapshot = this.players;
    for (const listener of [...this.listeners_]) {
      listener(snapshot);
    }
  }
}