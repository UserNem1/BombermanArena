/**
 * Tests du bus d'événements du lobby.
 *
 * Aucune dépendance à PixiJS ni au réseau : on vérifie uniquement le
 * contrat du bus (état des joueurs, notification des abonnés, arrivée et
 * départ). C'est la brique qui relie, plus tard, le serveur WebSocket à
 * l'affichage.
 */

import { describe, expect, it, vi } from 'vitest';
import { canStartGame, LobbyBus, MAX_PLAYERS, MIN_PLAYERS, type Player } from './LobbyBus.js';

/** Joueuses de test, chacune sur son personnage (couleurs distinctes). */
const alix: Player = { id: 'p1', name: 'Alix', characterId: 'perso-1', ready: false };
const basile: Player = { id: 'p2', name: 'Basile', characterId: 'perso-2', ready: false };

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

  it('fait arriver un joueur non prêt par défaut et sans perso', () => {
    const bus = new LobbyBus();
    const sansEtat = { id: 'p9', name: 'Sans état' } as Player;

    bus.join(sansEtat);

    expect(bus.players[0].ready).toBe(false);
    // Premier personnage libre du catalogue attribué automatiquement.
    expect(bus.players[0].characterId).toBe('perso-1');
  });

  it('refuse un joueur dont le personnage est déjà pris', () => {
    const bus = new LobbyBus();
    const listener = vi.fn();
    bus.on(listener);
    bus.join(alix);

    bus.join({ ...basile, characterId: 'perso-1' });

    expect(bus.players).toEqual([alix]);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('attribue un personnage libre à un arrivant qui n’en précise pas', () => {
    const bus = new LobbyBus();
    bus.join(alix); // perso-1 occupé

    bus.join({ id: 'p2', name: 'Basile', ready: false } as Player);

    expect(bus.players[1].characterId).toBe('perso-2');
  });

  it('change le personnage d’un joueur et prévient les abonnés', () => {
    const bus = new LobbyBus();
    bus.join(alix);
    bus.join(basile);
    const listener = vi.fn();
    bus.on(listener);

    const ok = bus.setCharacter(alix.id, 'perso-3');

    expect(ok).toBe(true);
    expect(bus.players[0].characterId).toBe('perso-3');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('refuse un personnage déjà porté par un autre joueur', () => {
    const bus = new LobbyBus();
    bus.join(alix);
    bus.join(basile);
    const listener = vi.fn();
    bus.on(listener);

    const ok = bus.setCharacter(alix.id, 'perso-2');

    expect(ok).toBe(false);
    expect(bus.players[0].characterId).toBe('perso-1');
    expect(listener).not.toHaveBeenCalled();
  });

  it('ignore un changement de perso pour un joueur inconnu ou inchangé', () => {
    const bus = new LobbyBus();
    bus.join(alix);
    const listener = vi.fn();
    bus.on(listener);

    expect(bus.setCharacter('inconnu', 'perso-2')).toBe(false);
    expect(bus.setCharacter(alix.id, 'perso-1')).toBe(false);

    expect(listener).not.toHaveBeenCalled();
  });

  it('marque un joueur prêt et prévient les abonnés', () => {
    const bus = new LobbyBus();
    bus.join(alix);
    const listener = vi.fn();
    bus.on(listener);

    bus.setReady(alix.id, true);

    expect(bus.players[0].ready).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('ignore un changement d’état pour un joueur inconnu', () => {
    const bus = new LobbyBus();
    const listener = vi.fn();
    bus.on(listener);

    bus.setReady('inconnu', true);

    expect(bus.players).toEqual([]);
    expect(listener).not.toHaveBeenCalled();
  });

  it('ignore un changement d’état redondant (déjà dans cet état)', () => {
    const bus = new LobbyBus();
    bus.join(alix);
    bus.setReady(alix.id, true);
    const listener = vi.fn();
    bus.on(listener);

    bus.setReady(alix.id, true);

    expect(listener).not.toHaveBeenCalled();
  });

  describe('conditions de lancement (règle : 2 à 4 joueurs, tous prêts)', () => {
    it('refuse une partie en solo, même prêt', () => {
      const bus = new LobbyBus();
      bus.join({ ...alix, ready: true });

      expect(MIN_PLAYERS).toBe(2);
      expect(bus.canStart).toBe(false);
      expect(canStartGame([{ ...alix, ready: true }])).toBe(false);
    });

    it('refuse une partie où tout le monde n’est pas prêt', () => {
      const bus = new LobbyBus();
      bus.join({ ...alix, ready: true });
      bus.join(basile);

      expect(bus.canStart).toBe(false);
    });

    it('accepte deux joueurs prêts', () => {
      const bus = new LobbyBus();
      bus.join({ ...alix, ready: true });
      bus.join({ ...basile, ready: true });

      expect(bus.canStart).toBe(true);
    });

    it('accepte trois ou quatre joueurs prêts', () => {
      for (const ready of [3, 4]) {
        const bus = new LobbyBus();
        for (let i = 0; i < ready; i++) {
          bus.join({ id: `p${i}`, name: `J${i}`, characterId: `perso-${i}`, ready: true });
        }
        expect(bus.canStart).toBe(true);
      }
    });

    it('refuse une partie de plus de quatre joueurs', () => {
      const players = Array.from({ length: 5 }, (_, i) => ({
        id: `p${i}`,
        name: `J${i}`,
        characterId: `perso-${i}`,
        ready: true,
      }));
      expect(canStartGame(players)).toBe(false);
    });

    it('refuse une partie quand personne n’est prêt', () => {
      expect(canStartGame([alix, basile])).toBe(false);
    });
  });
});