/**
 * Tests du menu principal.
 *
 * Le menu choisit son fond (image fournie ou grille de l'arène) et sait
 * étirer l'image pour couvrir la fenêtre. On simule Pixi pour observer la
 * structure construite sans avoir besoin d'un contexte WebGL.
 */

import { Sprite,Container, Texture } from 'pixi.js';
import { Grid } from '../components/Grid.js';
import { Menu } from '../screens/Menu.js';
import { describe, expect, it, vi } from 'vitest';

vi.mock('pixi.js', () => {
  class Container {
    children: unknown[] = [];
    eventMode = 'auto';
    cursor = 'default';
    position = {
      x: 0,
      y: 0,
      set: (x = 0, y = 0): void => {
        this.position.x = x;
        this.position.y = y;
      },
    };
    scale = { set: (): void => undefined };

    addChild(...kids: unknown[]): this {
      this.children.push(...kids);
      return this;
    }

    on(): void {
      /* enregistrement des évènements inutile ici */
    }
  }

  class Sprite extends Container {
    anchor = { set: (): void => undefined };
    size = { width: 0, height: 0 };

    constructor(readonly texture: { width: number; height: number }) {
      super();
    }

    setSize(width: number, height: number): void {
      this.size = { width, height };
    }
  }

  class Text extends Container {
    anchor = { set: (): void => undefined };
    constructor(readonly options?: unknown) {
      super();
    }
  }

  class Graphics extends Container {
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

  class TextStyle {
    constructor(readonly options?: unknown) {
      /* style ignoré */
    }
  }

  return { Container, Sprite, Text, Graphics, TextStyle, Texture: class Texture {} };
});

/** Fausse texture d'image carrée 100x100 pour les tests. */
const IMAGE: Texture = { width: 100, height: 100 } as unknown as Texture;

describe('Menu', () => {
  it('place l’image de fond en premier quand une texture est fournie', () => {
    const menu = new Menu(IMAGE);
    expect(menu.children[0]).toBeInstanceOf(Sprite);
  });

  it('retombe sur la grille de l’arène sans image de fond', () => {
    const menu = new Menu();
    expect(menu.children[0]).toBeInstanceOf(Grid);
  });

  it('étire le fond pour couvrir la fenêtre (recadrage centré)', () => {
    const menu = new Menu(IMAGE);
    menu.coverBackdrop(0, 0, 200, 100);
    const backdrop = menu.children[0] as Sprite & {
      size: { width: number; height: number };
      position: { x: number; y: number };
    };
    // Image 100x100 dans une zone 200x100 : le facteur « cover » vaut 2.
    expect(backdrop.size).toEqual({ width: 200, height: 200 });
    expect(backdrop.position.x).toBe(100);
    expect(backdrop.position.y).toBe(50);
  });

  it('ne fait rien si aucun fond n’est chargé', () => {
    const menu = new Menu();
    expect(() => menu.coverBackdrop(0, 0, 200, 100)).not.toThrow();
  });
  it('ajoute un élément dans le fond quand une texture est fournie', () => {
    const menu = new Menu(IMAGE);
    const child = new Container();

    expect(menu.addToBackdrop(child)).toBe(true);
    expect((menu.children[0] as Container).children).toContain(child);
  });

   it('n’ajoute pas d’élément s’il n’y a pas de fond', () => {
    const menu = new Menu();
    const child = new Container();

    expect(menu.addToBackdrop(child)).toBe(false);
  });
});
