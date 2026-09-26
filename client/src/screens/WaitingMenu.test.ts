/**
 * Tests de l'écran d'attente.
 *
 * PixiJS est mocké (Container/Graphics/Text/TextStyle minimaux) : on
 * vérifie la réaction de l'écran à la liste des joueurs — emplacements,
 * état « prêt / pas prêt », marqueur du joueur local, compteur et
 * déclenchement du bouton retour.
 */

import { describe, expect, it, vi } from 'vitest';
import { Text } from 'pixi.js';
import { Button } from '../components/Button.js';
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
  }
  class Graphics {
    clear(): this {
      return this;
    }
    roundRect(): this {
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
  screen.slotNames.map((label: Text) => label.text);

/** Raccourci : états affichés sous les quatre emplacements. */
const statuses = (screen: WaitingMenu): string[] =>
  screen.slotStatuses.map((label: Text) => label.text);

const alix: Player = { id: 'p1', name: 'Alix', ready: false };
const basile: Player = { id: 'p2', name: 'Basile', ready: false };
const camille: Player = { id: 'p3', name: 'Camille', ready: false };

describe('WaitingMenu', () => {
  it('affiche « EN ATTENTE… » dans les quatre emplacements au départ', () => {
    const screen = new WaitingMenu(() => {}, () => {}, 'p1');
    expect(names(screen)).toEqual([
      'EN ATTENTE…',
      'EN ATTENTE…',
      'EN ATTENTE…',
      'EN ATTENTE…',
    ]);
    expect(statuses(screen)).toEqual(['', '', '', '']);
  });

  it('remplit les emplacements avec les pseudos et leurs états', () => {
    const screen = new WaitingMenu(() => {}, () => {}, 'p1');
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
    const screen = new WaitingMenu(() => {}, () => {}, 'p2');
    screen.setPlayers([alix, basile]);
    expect(names(screen).slice(0, 2)).toEqual(['Alix', 'Basile · vous']);
  });

  it('affiche PRÊT pour un joueur prêt et met à jour le compteur', () => {
    const screen = new WaitingMenu(() => {}, () => {}, 'p1');
    screen.setPlayers([{ ...alix, ready: true }, basile]);
    expect(statuses(screen).slice(0, 2)).toEqual(['PRÊT', 'PAS PRÊT']);
    expect((screen.summaryText as Text).text).toBe('1/2 prêts');
  });

  it('affiche « Tous les joueurs sont prêts ! » quand toute la salle est prête', () => {
    const screen = new WaitingMenu(() => {}, () => {}, 'p1');
    screen.setPlayers([
      { ...alix, ready: true },
      { ...basile, ready: true },
    ]);
    expect((screen.summaryText as Text).text).toBe('Tous les joueurs sont prêts !');
  });

  it('adapte le libellé du bouton prêt selon le joueur local', () => {
    const screen = new WaitingMenu(() => {}, () => {}, 'p1');
    screen.setPlayers([alix]);
    expect(screen.readyButton.getLabel()).toBe('PRÊT');
    screen.setPlayers([{ ...alix, ready: true }]);
    expect(screen.readyButton.getLabel()).toBe('PAS PRÊT');
  });

  it('déclenche onToggleReady quand le bouton prêt est activé', () => {
    const onToggle = vi.fn();
    const screen = new WaitingMenu(() => {}, onToggle, 'p1');
    (screen.readyButton as Button).activate();
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('déclenche onBack quand le bouton RETOUR est activé', () => {
    const onBack = vi.fn();
    const screen = new WaitingMenu(onBack, () => {}, 'p1');
    const back = screen.children.find(
      (child): child is Button => child instanceof Button && child !== screen.readyButton,
    );
    expect(back).toBeDefined();
    back!.activate();
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});