/**
 * Tests du bus d'événements du lobby.
 *
 * Aucune dépendance à PixiJS ni au réseau : on vérifie uniquement le
 * contrat du bus (état des joueurs, notification des abonnés, arrivée et
 * départ). C'est la brique qui relie, plus tard, le serveur WebSocket à
 * l'affichage.
 */

import { describe, expect, it, vi } from 'vitest';
import { MAX_PLAYERS, LobbyBus, type Player } from './LobbyBus.js';

/** Joueuse de test. */
const alix: Player = { id: 'p1', name: 'Alix' };
const basile: Player = { id: 'p2', name: 'Basile' };

describe('LobbyBus', () => {
  it('démarre avec une salle vide', () => {
    const bus = new LobbyBus();
    expect(bus.players).toEqual([]);
    expect(MAX_PLAYERS).toBe(4);
  });

  it('ajoute un joueur et notifie les abonnés', () => {
    const bus = new LobbyBus();
    const listener = vi.fn();
    bus.on(listener);

    bus.join(alix);

    expect(bus.players).toEqual([alix]);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith([alix]);
  });

  it('ignore une arrivée en double (même id)', () => {
    const bus = new LobbyBus();
    const listener = vi.fn();
    bus.on(listener);

    bus.join(alix);
    bus.join({ ...alix, name: 'AliX' });
    bus.join(basile);

    expect(bus.players).toEqual([alix, basile]);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('retire un joueur et notifie les abonnés', () => {
    const bus = new LobbyBus();
    bus.join(alix);
    bus.join(basile);
    const listener = vi.fn();
    bus.on(listener);

    bus.leave(alix.id);

    expect(bus.players).toEqual([basile]);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith([basile]);
  });

  it('ne notifie pas si le départ concerne un id inconnu', () => {
    const bus = new LobbyBus();
    bus.join(alix);
    const listener = vi.fn();
    bus.on(listener);

    bus.leave('inconnu');

    expect(bus.players).toEqual([alix]);
    expect(listener).not.toHaveBeenCalled();
  });

  it("annule l'abonnement quand la fonction retournée est appelée", () => {
    const bus = new LobbyBus();
    const listener = vi.fn();
    const off = bus.on(listener);

    bus.join(alix);
    off();
    bus.join(basile);

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('expose une copie de la liste : la modifier ne change pas le bus', () => {
    const bus = new LobbyBus();
    bus.join(alix);

    bus.players.push(basile);

    expect(bus.players).toEqual([alix]);
  });
});