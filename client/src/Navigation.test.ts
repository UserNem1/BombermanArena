/**
 * Tests de la navigation clavier (Navigation.ts).
 *
 * On mocke pixi.js (Container + primitives de Button) et on simule les
 * événements `keydown` du canvas pour vérifier : déplacement du focus au
 * Tab, activation à Entrée/Espace, et indépendance entre écrans.
 */

import { describe, expect, it, vi } from 'vitest';
import { Container } from 'pixi.js';
import { Button } from './components/Button.js';
import { Navigation } from './Navigation.js';

// Mock minimal de pixi.js : suffit à instancier Button (Graphics/Text).
vi.mock('pixi.js', () => {
  class Container {
    children: unknown[] = [];
    addChild(child: unknown): unknown {
      this.children.push(child);
      return child;
    }
    on(): void {}
  }
  return {
    Container,
    Graphics: class Graphics {
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
    },
    Text: class Text {
      anchor = { set(_x: number, _y: number): void {} };
    },
    TextStyle: class TextStyle {},
  };
});

interface FakeApp {
  canvas: {
    tabIndex: number;
    listener: ((e: KeyboardEvent) => void) | null;
    addEventListener(type: string, fn: (e: KeyboardEvent) => void): void;
  };
}

/** Construit une navigation avec un canvas factice qui capture keydown. */
function makeNav(getCurrent: () => Container): { app: FakeApp; key(e: KeyboardEvent): void } {
  const app: FakeApp = {
    canvas: {
      tabIndex: 0,
      listener: null,
      addEventListener(_type, fn) {
        this.listener = fn;
      },
    },
  };
  // Le constructeur lit app.canvas : on le caste en Application factice.
  const nav = new Navigation(app as never, getCurrent);
  void nav;
  return {
    app,
    key: (e) => app.canvas.listener?.(e),
  };
}

/** Construit un écran contenant le nombre de boutons demandé. */
function makeScreen(count: number, spies: (() => void)[]): Container {
  const screen = new Container();
  for (let i = 0; i < count; i++) {
    screen.addChild(new Button(`B${i}`, spies[i]));
  }
  // Un enfant non-bouton ne doit pas entrer dans la navigation.
  screen.addChild(new Container());
  return screen;
}

const tabEvent = { code: 'Tab', shiftKey: false } as KeyboardEvent;
const shiftTabEvent = { code: 'Tab', shiftKey: true } as KeyboardEvent;
const enterEvent = { code: 'Enter' } as KeyboardEvent;
const spaceEvent = { code: 'Space' } as KeyboardEvent;

function makeKey(e: KeyboardEvent): KeyboardEvent {
  return { ...e, preventDefault: vi.fn() } as KeyboardEvent;
}

describe('Navigation clavier', () => {
  it('active le bouton focus avec Entrée', () => {
    const spy = vi.fn();
    const screen = makeScreen(1, [spy]);
    const { key } = makeNav(() => screen);
    key(makeKey(enterEvent));
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('bouge le focus au Tab, puis active le nouveau bouton', () => {
    const spies = [vi.fn(), vi.fn()];
    const screen = makeScreen(2, spies);
    const { key } = makeNav(() => screen);
    key(makeKey(tabEvent)); // index 0 -> 1
    key(makeKey(enterEvent));
    expect(spies[0]).not.toHaveBeenCalled();
    expect(spies[1]).toHaveBeenCalledTimes(1);
  });

  it('retourne au début après le dernier bouton (cycle)', () => {
    const spies = [vi.fn(), vi.fn(), vi.fn()];
    const screen = makeScreen(3, spies);
    const { key } = makeNav(() => screen);
    key(makeKey(tabEvent)); // 0 -> 1
    key(makeKey(tabEvent)); // 1 -> 2
    key(makeKey(tabEvent)); // 2 -> 0
    key(makeKey(spaceEvent)); // Espace active aussi
    expect(spies[0]).toHaveBeenCalledTimes(1);
  });

  it('Shifts+Tab navigue en arrière', () => {
    const spies = [vi.fn(), vi.fn()];
    const screen = makeScreen(2, spies);
    const { key } = makeNav(() => screen);
    key(makeKey(tabEvent)); // 0 -> 1
    key(makeKey(shiftTabEvent)); // 1 -> 0
    key(makeKey(enterEvent));
    expect(spies[0]).toHaveBeenCalledTimes(1);
  });

  it('ne navigue que dans l’écran courant (changement d’écran)', () => {
    const spiesA = [vi.fn(), vi.fn()];
    const spiesB = [vi.fn(), vi.fn()];
    const screenA = makeScreen(2, spiesA);
    const screenB = makeScreen(2, spiesB);
    let current: Container = screenA;
    const { key } = makeNav(() => current);
    key(makeKey(tabEvent)); // focus sur B1 de l'écran A
    current = screenB; // on passe à B
    key(makeKey(enterEvent)); // doit activer B1 de l'écran B, pas A
    expect(spiesA[1]).not.toHaveBeenCalled();
    expect(spiesB[1]).toHaveBeenCalledTimes(1);
  });
});