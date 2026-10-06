/**
 * Tests des design tokens partagés (design.ts).
 *
 * PixiJS est mocké (Text/TextStyle minimaux) : on vérifie que
 * `createCenteredTitle` centre bien le titre, applique le style demandé
 * et que les valeurs par défaut sont cohérentes.
 */

import { describe, expect, it, vi } from 'vitest';
import { Text } from 'pixi.js';
import { createCenteredTitle } from './design.js';

vi.mock('pixi.js', () => {
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
    constructor(opts: Record<string, unknown>) {
      Object.assign(this, opts);
    }
  }
  return { Text, TextStyle };
});

describe('createCenteredTitle', () => {
  it('centre le titre horizontalement et ancre au milieu', () => {
    const title = createCenteredTitle('BOMBERMAN', 123, {
      fill: 0xffd166,
      fontSize: 40,
      strokeColor: '#000',
    });
    expect(title.text).toBe('BOMBERMAN');
    expect(title.anchor.x).toBe(0.5);
    expect(title.anchor.y).toBe(0.5);
    expect(title.position.x).toBe(1280 / 2);
    expect(title.position.y).toBe(123);
  });

  it('applique le style demandé au TextStyle', () => {
    const title = createCenteredTitle('OPTIONS', 10, {
      fill: 0x4cc9f0,
      fontSize: 64,
      letterSpacing: 6,
      strokeColor: '#0b2545',
      strokeWidth: 7,
    });
    expect(title.style).toEqual(
      expect.objectContaining({
        fontFamily: expect.any(String),
        fontSize: 64,
        fontWeight: '900',
        letterSpacing: 6,
        fill: 0x4cc9f0,
        stroke: { color: '#0b2545', width: 7 },
      }),
    );
  });

  it('utilise des valeurs par défaut cohérentes quand elles sont omises', () => {
    const title = createCenteredTitle('ARENA', 200, {
      fill: 0xffffff,
      fontSize: 34,
      strokeColor: '#000',
    });
    const style = title.style as { letterSpacing: number; stroke: { width: number } };
    expect(style.letterSpacing).toBe(4);
    expect(style.stroke.width).toBe(5);
  });
});