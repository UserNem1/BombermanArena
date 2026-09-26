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
}

/** Fonction appelée à chaque changement de la liste des joueurs. */
export type PlayersListener = (players: readonly Player[]) => void;

/** Nombre maximum de joueurs dans une partie (règle du jeu : 2 à 4). */
export const MAX_PLAYERS = 4;

export class LobbyBus {
  private players_: Player[] = [];
  private listeners_ = new Set<PlayersListener>();

  /** Les joueurs actuellement présents dans la salle (copie). */
  get players(): readonly Player[] {
    return [...this.players_];
  }

  /**
   * S'abonne aux changements de la liste des joueurs.
   *
   * @param listener Fonction appelée à chaque arrivée ou départ.
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
   * la demande est alors ignorée.
   */
  join(player: Player): void {
    if (this.players_.some((p) => p.id === player.id)) {
      return;
    }
    this.players_.push(player);
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

  /** Prévient tous les abonnés de l'état courant (liste copiée). */
  private notify(): void {
    const snapshot = this.players;
    for (const listener of [...this.listeners_]) {
      listener(snapshot);
    }
  }
}