/**
 * Prélèvement de la première pose d'une planche de personnage (browser).
 *
 * La planche est une grille de poses (voir planche.ts) ; pour l'aperçu du
 * sélecteur on veut une seule case, pas la planche entière : on décode
 * l'image (canvas), on détecte les boîtes de contenu de chaque case puis on
 * retient la première case qui contient une vraie pose (les premières
 * lignes de planche peuvent être vides). La coupe se réduit au contenu réel
 * de la pose (fond rogné), avec la marge CROP_PAD de la détection.
 */

import { detectPixels, firstContentCell } from './planche.js';
import type { CellRect } from './planche.js';

/**
 * Boîte (x, y, width, height en pixels de l'image) de la première pose
 * d'une planche, prête à être passée comme cadre d'une Texture Pixi.
 * Rejette si le canvas 2D n'est pas disponible.
 */
export function firstCellBox(image: HTMLImageElement): CellRect {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D indisponible');
  }
  ctx.drawImage(image, 0, 0);
  const { data } = ctx.getImageData(0, 0, image.width, image.height);
  const boxes = detectPixels(image.width, image.height, data);
  return boxes[firstContentCell(boxes, image.width, image.height)];
}