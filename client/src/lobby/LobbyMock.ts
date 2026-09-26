/**
 * Mock du serveur de salle d'attente (fonctionnement hors-ligne).
 *
 * Simule des joueurs qui rejoignent la partie en différé, en alimentant un
 * `LobbyBus` — exactement comme le ferait le serveur WebSocket réel plus
 * tard. Permet de développer et de tester l'interface sans backend : on
 * branche ce mock, on lance l'app, on voit les emplacements se remplir.
 */

import { LobbyBus, MAX_PLAYERS, type Player } from './LobbyBus.js';

export class LobbyMock {
  private readonly bus: LobbyBus;
  private readonly names: readonly string[];
  private readonly joinDelayMs: number;
  private readonly timers_ = new Set<ReturnType<typeof setTimeout>>();
  private started_ = false;

  /**
   * @param bus         Bus à alimenter avec les arrivées simulées.
   * @param names       Pseudos des joueurs qui vont rejoindre la salle.
   * @param joinDelayMs Espacement entre deux arrivées (ms).
   */
  constructor(bus: LobbyBus, names: readonly string[], joinDelayMs = 1500) {
    this.bus = bus;
    this.names = names;
    this.joinDelayMs = joinDelayMs;
  }

  /** Vrai si le mock est en cours de simulation. */
  get started(): boolean {
    return this.started_;
  }

  /**
   * Lance la simulation : l'hôte rejoint immédiatement, les joueurs
   * suivants arrivent un à un, espacés du délai configuré. Jamais plus de
   * `MAX_PLAYERS` joueurs (règle du jeu). Sans effet si déjà démarré.
   */
  start(): void {
    if (this.started_) {
      return;
    }
    this.started_ = true;

    this.names.slice(0, MAX_PLAYERS).forEach((name, index) => {
      if (index === 0) {
        this.bus.join(this.makePlayer(name, index));
        return;
      }
      const timer = setTimeout(() => {
        this.timers_.delete(timer);
        this.bus.join(this.makePlayer(name, index));
      }, this.joinDelayMs * index);
      this.timers_.add(timer);
    });
  }

  /** Annule les arrivées encore programmées (les déjà arrivés restent). */
  stop(): void {
    for (const timer of this.timers_) {
      clearTimeout(timer);
    }
    this.timers_.clear();
    this.started_ = false;
  }

  /** Construit un joueur simulé, identifiable par sa position d'arrivée. */
  private makePlayer(name: string, index: number): Player {
    return { id: `mock-${index + 1}`, name };
  }
}