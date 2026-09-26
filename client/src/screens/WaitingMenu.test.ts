/**
 * Tests de l'écran d'attente.
 *
 * PixiJS est mocké (Container/Graphics/Text/TextStyle minimaux) : on
 * vérifie la réaction de l'écran à la liste des joueurs — emplacements,
 * état « prêt / pas prêt », marqueur du joueur local, compteur, cartes de
 * personnages et déclenchement des boutons.
 */

import { describe, expect, it, vi } from 'vitest';
import { Text } from 'pixi.js';
import { Button } from '../components/Button.js';
import { WaitingMenu } from './WaitingMenu.js';
import { CHARACTERS } from '../lobby/characters.js';
import type { Player } from '../lobby/LobbyBus.js';

vi.mock('pixi.js', () => {
  class Container {
    children: unknown[] = [];
    eventMode = 'static';
    cursor = 'pointer';
    position = {
      x: 0,
      y: 0,
      set(x: number, y: number): void {
        this.x = x;
        this.y = y;
      },
    };
    on(): void {}
    addChild(...children: unknown[]): unknown {
      this.children.push(...children);
      return children[0];
    }
  }
  class Graphics extends Container {
    clear(): this {
      return this;
    }
    roundRect(): this {
      return this;
    }
    circle(): this {
      return this;
    }
    fill(): this {
      return this;
    }
    stroke(): this {
      return this;
    }
    moveTo(): this {
      return this;
    }
    lineTo(): this {
      return this;
    }
  }
  class Text {
    anchor = {
      set(x: number, y: number = x): void {
        this.x = x;
        this.y = y;
      },
    };
    position = {
      x: 0,
      y: 0,
      set(x: number, y: number): void {
        this.x = x;
        this.y = y;
      },
    };
    text = '';
    style: unknown = null;
    constructor(opts: { text: string; style: unknown }) {
      this.text = opts.text;
      this.style = opts.style;
    }
  }
  class TextStyle {
    constructor(opts: unknown) {
      Object.assign(this, opts);
    }
  }
  return { Container, Graphics, Text, TextStyle };
});

/** Raccourci : noms affichés dans les quatre emplacements. */
const names = (screen: WaitingMenu): string[] =>
  screen.slots.map((slot) => slot.nameText.text);

/** Raccourci : états affichés sous les quatre emplacements. */
const statuses = (screen: WaitingMenu): string[] =>
  screen.slots.map((slot) => slot.statusText.text);

/** Raccourci en clair de l'état d'une carte : libre / choisi / pris. */
const cardState = (screen: WaitingMenu, characterId: string): string => {
  const card = screen.characterCards.find(
    (c) => c.character.id === characterId,
  );
  if (!card) return 'absente';
  if (card.taken) return 'prise';
  if (card.selected) return 'choisie';
  return 'libre';
};

const alix: Player = { id: 'p1', name: 'Alix', characterId: 'perso-1', ready: false };
const basile: Player = { id: 'p2', name: 'Basile', characterId: 'perso-2', ready: false };
const camille: Player = { id: 'p3', name: 'Camille', characterId: 'perso-3', ready: false };

describe('WaitingMenu', () => {
  it('affiche « EN ATTENTE… » dans les quatre emplacements au départ', () => {
    const screen = new WaitingMenu(() => {}, () => {}, vi.fn(), 'p1');
    expect(names(screen)).toEqual([
      'EN ATTENTE…',
      'EN ATTENTE…',
      'EN ATTENTE…',
      'EN ATTENTE…',
    ]);
    expect(statuses(screen)).toEqual(['', '', '', '']);
  });

  it('remplit les emplacements avec les pseudos et leurs états', () => {
    const screen = new WaitingMenu(() => {}, () => {}, vi.fn(), 'p1');
    screen.setPlayers([alix, basile, camille]);
    expect(names(screen)).toEqual(['Alix · vous', 'Basile', 'Camille', 'EN ATTENTE…']);
    expect(statuses(screen)).toEqual([
      'PAS PRÊT',
      'PAS PRÊT',
      'PAS PRÊT',
      '',
    ]);
  });

  it('marque le joueur local avec « · vous » seulement sur son emplacement', () => {
    const screen = new WaitingMenu(() => {}, () => {}, vi.fn(), 'p2');
    screen.setPlayers([alix, basile]);
    expect(names(screen).slice(0, 2)).toEqual(['Alix', 'Basile · vous']);
  });

  it('affiche PRÊT pour un joueur prêt et met à jour le compteur', () => {
    const screen = new WaitingMenu(() => {}, () => {}, vi.fn(), 'p1');
    screen.setPlayers([{ ...alix, ready: true }, basile]);
    expect(statuses(screen).slice(0, 2)).toEqual(['PRÊT', 'PAS PRÊT']);
    expect((screen.summaryText as Text).text).toBe('1/2 prêts');
  });

  it('affiche « Tous les joueurs sont prêts ! » quand toute la salle est prête', () => {
    const screen = new WaitingMenu(() => {}, () => {}, vi.fn(), 'p1');
    screen.setPlayers([
      { ...alix, ready: true },
      { ...basile, ready: true },
    ]);
    expect((screen.summaryText as Text).text).toBe('Tous les joueurs sont prêts !');
  });

  it('adapte le libellé du bouton prêt selon le joueur local', () => {
    const screen = new WaitingMenu(() => {}, () => {}, vi.fn(), 'p1');
    screen.setPlayers([alix]);
    expect(screen.readyButton.getLabel()).toBe('PRÊT');
    screen.setPlayers([{ ...alix, ready: true }]);
    expect(screen.readyButton.getLabel()).toBe('PAS PRÊT');
  });

  it('déclenche onToggleReady quand le bouton prêt est activé', () => {
    const onToggle = vi.fn();
    const screen = new WaitingMenu(() => {}, onToggle, vi.fn(), 'p1');
    screen.readyButton.activate();
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('déclenche onBack quand le bouton RETOUR est activé', () => {
    const onBack = vi.fn();
    const screen = new WaitingMenu(onBack, () => {}, vi.fn(), 'p1');
    const back = screen.children.find(
      (child): child is Button => child instanceof Button && child !== screen.readyButton,
    );
    expect(back).toBeDefined();
    back!.activate();
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('affiche une carte par personnage du catalogue', () => {
    const screen = new WaitingMenu(() => {}, () => {}, vi.fn(), 'p1');
    expect(screen.characterCards.map((c) => c.character.id)).toEqual(
      CHARACTERS.map((c) => c.id),
    );
  });

  it('marque choisie la carte du joueur local', () => {
    const screen = new WaitingMenu(() => {}, () => {}, vi.fn(), 'p1');
    screen.setPlayers([alix, basile]);
    expect(cardState(screen, 'perso-1')).toBe('choisie');
  });

  it('marque prise la carte portée par un autre joueur', () => {
    const screen = new WaitingMenu(() => {}, () => {}, vi.fn(), 'p1');
    screen.setPlayers([alix, basile]);
    expect(cardState(screen, 'perso-2')).toBe('prise');
    expect(cardState(screen, 'perso-3')).toBe('libre');
  });

  it('déclenche onSelectCharacter en activant une carte libre', () => {
    const onSelect = vi.fn();
    const screen = new WaitingMenu(() => {}, () => {}, onSelect, 'p1');
    screen.setPlayers([alix]); // perso-2, 3, 4 libres
    const card = screen.characterCards.find((c) => c.character.id === 'perso-2')!;
    card.activate();
    expect(onSelect).toHaveBeenCalledWith('perso-2');
  });

  it('une carte prise ne déclenche pas la sélection', () => {
    const onSelect = vi.fn();
    const screen = new WaitingMenu(() => {}, () => {}, onSelect, 'p1');
    screen.setPlayers([alix, basile]); // perso-2 pris par Basile
    const card = screen.characterCards.find((c) => c.character.id === 'perso-2')!;
    card.activate();
    expect(onSelect).not.toHaveBeenCalled();
  });
});