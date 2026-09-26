/**
 * Tests de l'écran d'attente.
 *
 * PixiJS est mocké (Container/Graphics/Text/TextStyle minimaux) : on
 * vérifie la réaction de l'écran à la liste des joueurs — l'emplacement
 * occupé affiche le pseudo, l'emplacement libre reste « EN ATTENTE… ».
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
    anchor = { set(): void {} };
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

/** Raccourci : libellés affichés dans les quatre emplacements. */
const texts = (screen: WaitingMenu): string[] =>
  screen.slotLabels.map((label: Text) => label.text);

const alix: Player = { id: 'p1', name: 'Alix' };
const basile: Player = { id: 'p2', name: 'Basile' };
const camille: Player = { id: 'p3', name: 'Camille' };

describe('WaitingMenu', () => {
  it('affiche « EN ATTENTE… » dans les quatre emplacements au départ', () => {
    const screen = new WaitingMenu(() => {});
    expect(texts(screen)).toEqual([
      'EN ATTENTE…',
      'EN ATTENTE…',
      'EN ATTENTE…',
      'EN ATTENTE…',
    ]);
  });

  it('remplit les emplacements avec les pseudos des joueurs présents', () => {
    const screen = new WaitingMenu(() => {});
    screen.setPlayers([alix, basile, camille]);
    expect(texts(screen)).toEqual(['Alix', 'Basile', 'Camille', 'EN ATTENTE…']);
  });

  it('redevient entièrement « EN ATTENTE… » si la salle se vide', () => {
    const screen = new WaitingMenu(() => {});
    screen.setPlayers([alix]);
    screen.setPlayers([]);
    expect(texts(screen)).toEqual([
      'EN ATTENTE…',
      'EN ATTENTE…',
      'EN ATTENTE…',
      'EN ATTENTE…',
    ]);
  });

  it('met en valeur visuelle un emplacement occupé (fill distinct)', () => {
    const screen = new WaitingMenu(() => {});
    screen.setPlayers([alix]);

    const occupied = (screen.slotLabels[0] as Text).style as { fill: number };
    const empty = (screen.slotLabels[1] as Text).style as { fill: number };
    expect(occupied.fill).toBe(0xdfe4ff);
    expect(empty.fill).toBe(0x8a8fb8);
  });

  it('ignore les joueurs au-delà du quatrième emplacement', () => {
    const screen = new WaitingMenu(() => {});
    const extra: Player = { id: 'p5', name: 'Enzo' };
    screen.setPlayers([alix, basile, camille, extra, extra]);
    expect(texts(screen)).toEqual(['Alix', 'Basile', 'Camille', 'Enzo']);
  });

  it('déclenche onBack quand le bouton RETOUR est activé', () => {
    const onBack = vi.fn();
    const screen = new WaitingMenu(onBack);
    const back = screen.children.find(
      (child): child is Button => child instanceof Button,
    );
    expect(back).toBeDefined();
    back!.activate();
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});