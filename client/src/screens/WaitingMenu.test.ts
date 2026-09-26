/**
 * Tests de l'écran d'attente.
 *
 * PixiJS est mocké (Container/Graphics/Text/TextStyle minimaux) : on
 * vérifie la réaction de l'écran à la liste des joueurs — emplacements,
 * état « prêt / pas prêt », marqueur du joueur local, compteur, sélecteur
 * en « U » (position, personnage, aperçu) et déclenchement des boutons.
 */

import { describe, expect, it, vi } from 'vitest';
import { Container, Text } from 'pixi.js';
import { Button } from '../components/Button.js';
import { SLOT_HEIGHT, SLOT_WIDTH } from '../components/PlayerSlot.js';
import { WaitingMenu } from './WaitingMenu.js';
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
    removeChild(...children: unknown[]): Container {
      this.children = this.children.filter((c) => !children.includes(c));
      return this;
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

  it('masque le sélecteur en U tant que le joueur local n’est pas en salle', () => {
    const screen = new WaitingMenu(() => {}, () => {}, vi.fn(), 'p1');
    screen.setPlayers([]);
    expect(screen.picker.visible).toBe(false);
    screen.setPlayers([basile]); // joueur local absent
    expect(screen.picker.visible).toBe(false);
  });

  it('place le sélecteur en U dans l’angle haut-gauche de l’emplacement local', () => {
    const screen = new WaitingMenu(() => {}, () => {}, vi.fn(), 'p2');
    screen.setPlayers([alix, basile]);
    expect(screen.picker.visible).toBe(true);

    const slot = screen.slots[1];
    expect(screen.picker.position.x).toBeLessThan(slot.position.x);
    expect(screen.picker.position.y).toBeLessThan(slot.position.y);
    expect(screen.picker.position.x).toBeGreaterThanOrEqual(slot.position.x - SLOT_WIDTH / 2);
    expect(screen.picker.position.y).toBeGreaterThanOrEqual(slot.position.y - SLOT_HEIGHT / 2);
  });

  it('décale le pseudo du joueur local pour laisser la place à la U', () => {
    const screen = new WaitingMenu(() => {}, () => {}, vi.fn(), 'p2');
    screen.setPlayers([alix, basile]);
    expect(screen.slots[1].nameText.position.x).toBeGreaterThan(0);
    expect(screen.slots[0].nameText.position.x).toBe(0);
  });

  it('affiche le personnage du joueur local dans le sélecteur', () => {
    const screen = new WaitingMenu(() => {}, () => {}, vi.fn(), 'p2');
    screen.setPlayers([alix, basile]);
    expect(screen.picker.character?.id).toBe('perso-2');
  });

  it('expose dans le sélecteur l’image fournie par le renderer', () => {
    const preview = {} as Container;
    const screen = new WaitingMenu(
      () => {},
      () => {},
      vi.fn(),
      'p1',
      (id) => (id === 'perso-1' ? preview : null),
    );
    screen.setPlayers([alix]);
    expect(screen.picker.children).toContain(preview);
  });

  it('déclenche onCycleCharacter quand le sélecteur est activé', () => {
    const onCycle = vi.fn();
    const screen = new WaitingMenu(() => {}, () => {}, onCycle, 'p1');
    screen.setPlayers([alix]);
    screen.picker.activate();
    expect(onCycle).toHaveBeenCalledTimes(1);
  });
});