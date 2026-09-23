/**
 * Tests unitaires de la découpe de la planche (planche.ts).
 *
 * On vérifie le calcul pur des boîtes de contenu sur de petites images
 * RGBA synthétiques : aucune dépendance au DOM ni à Pixi.
 */

import { describe, expect, it } from 'vitest';
import { detectPixels } from './planche.js';

/**
 * Tampon RGBA (w x h) uniformément rempli.
 */
function makeRgba(width: number, height: number, r: number, g: number, b: number, a: number): Uint8ClampedArray {
  const d = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    d[i * 4] = r;
    d[i * 4 + 1] = g;
    d[i * 4 + 2] = b;
    d[i * 4 + 3] = a;
  }
  return d;
}

/** Remplace un pixel précis (x, y) du tampon. */
function setPixel(d: Uint8ClampedArray, width: number, x: number, y: number, r: number, g: number, b: number, a: number): void {
  const i = (y * width + x) * 4;
  d[i] = r;
  d[i + 1] = g;
  d[i + 2] = b;
  d[i + 3] = a;
}

describe('detectPixels', () => {
  it('retourne la case entière pour une case vide (fond transparent)', () => {
    // 2x2 cases sur une image 4x4 ; pad 0 pour ne pas rogner.
    const data = makeRgba(4, 4, 0, 0, 0, 0);
    const boxes = detectPixels(4, 4, data, { cols: 2, rows: 2, pad: 0 });
    expect(boxes).toEqual([
      { x: 0, y: 0, width: 2, height: 2 },
      { x: 2, y: 0, width: 2, height: 2 },
      { x: 0, y: 2, width: 2, height: 2 },
      { x: 2, y: 2, width: 2, height: 2 },
    ]);
  });

  it('rogne la case sur le contenu opaque (avec la marge CROP_PAD)', () => {
    const data = makeRgba(4, 4, 0, 0, 0, 0);
    // Un unique pixel rouge opaque en (1, 1) : case (0,0) de 2x2.
    setPixel(data, 4, 1, 1, 255, 0, 0, 255);
    const boxes = detectPixels(4, 4, data, { cols: 2, rows: 2 });
    // Rogné à {x:1,y:1} moins la marge 1, largeur 1 + 2*1 = 3.
    expect(boxes[0]).toEqual({ x: 0, y: 0, width: 3, height: 3 });
  });

  it('ignore les pixels quasi transparents (alpha < 64)', () => {
    const data = makeRgba(4, 4, 0, 0, 0, 0);
    setPixel(data, 4, 2, 1, 255, 0, 0, 30); // alpha 30 < 64
    const boxes = detectPixels(4, 4, data, { cols: 2, rows: 2, pad: 0 });
    // Aucun contenu détecté : toutes les cases entières.
    expect(boxes[0]).toEqual({ x: 0, y: 0, width: 2, height: 2 });
  });

  it('ignore les pixels quasi blancs (fond blanc opaque)', () => {
    const data = makeRgba(4, 4, 255, 255, 255, 255); // tout blanc opaque
    const boxes = detectPixels(4, 4, data, { cols: 2, rows: 2, pad: 0 });
    // Tout blanc = fond : cases entières (aucun contenu réel).
    expect(boxes[0]).toEqual({ x: 0, y: 0, width: 2, height: 2 });
  });

  it('respecte les limites de cases sur une taille non divisible', () => {
    // 10x10, 3 colonnes : X = [0,3[, [3,7[, [7,10[ (Math.round).
    const data = makeRgba(10, 10, 0, 0, 0, 0);
    setPixel(data, 10, 5, 0, 0, 200, 0, 255); // dans la case du milieu
    const boxes = detectPixels(10, 10, data, { cols: 3, rows: 1, pad: 0 });
    // Colonne du milieu : pixel x=5 -> boîte (5,0,1,1).
    expect(boxes[1]).toEqual({ x: 5, y: 0, width: 1, height: 1 });
    // Colonnes vides : cases entières [0,3[ et [7,10[.
    expect(boxes[0]).toEqual({ x: 0, y: 0, width: 3, height: 10 });
    expect(boxes[2]).toEqual({ x: 7, y: 0, width: 3, height: 10 });
  });
});