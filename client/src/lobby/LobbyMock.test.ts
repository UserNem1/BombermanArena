/**
 * Tests du mock de la salle d'attente.
 *
 * On simule le temps avec de fausses horloges (fake timers) pour vérifier
 * le rythme des arrivées, la limite de joueurs et l'annulation propre par
 * `stop`. Aucun réseau ni navigateur nécessaire.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LobbyBus } from './LobbyBus.js';
import { LobbyMock } from './LobbyMock.js';

/** Les pseudos des joueurs présents, dans l'ordre. */
const namesOf = (bus: LobbyBus): string[] =>
  bus.players.map((p) => p.name);

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('LobbyMock', () => {
  it("l'hôte rejoint immédiatement au démarrage", () => {
    const bus = new LobbyBus();
    const mock = new LobbyMock(bus, ['Alix', 'Basile'], 1000);

    mock.start();

    expect(namesOf(bus)).toEqual(['Alix']);
  });

  it('les joueurs suivants arrivent espacés du délai configuré', () => {
    const bus = new LobbyBus();
    const mock = new LobbyMock(bus, ['Alix', 'Basile', 'Camille'], 1000);
    mock.start();

    vi.advanceTimersByTime(900);
    expect(namesOf(bus)).toEqual(['Alix']);

    vi.advanceTimersByTime(100); // t = 1000 ms
    expect(namesOf(bus)).toEqual(['Alix', 'Basile']);

    vi.advanceTimersByTime(1000); // t = 2000 ms
    expect(namesOf(bus)).toEqual(['Alix', 'Basile', 'Camille']);
  });

  it('ne fait jamais rejoindre plus de MAX_PLAYERS joueurs', () => {
    const bus = new LobbyBus();
    const mock = new LobbyMock(bus, ['A', 'B', 'C', 'D', 'E', 'F'], 100);
    mock.start();

    vi.advanceTimersByTime(10_000);

    expect(bus.players).toHaveLength(4);
    expect(bus.players.every((p) => p.name !== 'E' && p.name !== 'F')).toBe(true);
  });

  it('stop() annule les arrivées restantes', () => {
    const bus = new LobbyBus();
    const mock = new LobbyMock(bus, ['A', 'B', 'C'], 100);
    mock.start();

    mock.stop();
    vi.advanceTimersByTime(10_000);

    expect(bus.players).toHaveLength(1); // seul l'hôte est entré
    expect(mock.started).toBe(false);
  });

  it("un second start() n'ajoute pas l'hôte deux fois", () => {
    const bus = new LobbyBus();
    const mock = new LobbyMock(bus, ['Alix'], 100);
    mock.start();

    mock.start();

    expect(bus.players).toHaveLength(1);
  });
});