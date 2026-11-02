/**
 * Logique PURE de découpe de la planche de poses (perso1.png).
 *
 * Ce module ne touche ni au DOM, ni à Pixi : uniquement des calculs sur
 * un tampon de pixels brute (RGBA). Il est testable unitairement sans
 * navigateur ni GPU. Le moteur de rendu (AnimationPersonnageMenu) fournit
 * l'image décodée, récupère `data` via <canvas>, puis appelle la fonction
 * ici pour obtenir les boîtes de contenu de chaque case.
 *
 * La planche est une grille de SHEET_COLS colonnes x SHEET_ROWS lignes ;
 * chaque case contient une pose du personnage, dont le fond transparent
 * (ou quasi blanc) est ignoré pour rogner la pose à son vrai contenu.
 */

/**
 * Structure de la planche (grille de poses).
 */
export const SHEET_COLS = 3;
export const SHEET_ROWS = 6;

/**
 * Seuil (somme des écarts à 255) au-delà duquel un pixel est du contenu.
 */
export const CONTENT_THRESHOLD = 60;

/**
 * Marge ajoutée autour du contenu rogné (px).
 */
export const CROP_PAD = 1;

/**
 * Boîte rectangulaire (en pixels de l'image source) englobant le contenu
 * d'une case : coordonnées du coin haut-gauche, largeur et hauteur.
 * Correcte y compris pour les cases vides (case entière conservée).
 */
export interface CellRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Options de détection (surtout utiles aux tests sur de petites images).
 */
export interface DetectOptions {
  cols?: number;
  rows?: number;
  threshold?: number;
  pad?: number;
}

/**
 * Calcule la bounding box du contenu (fond transparent ou quasi blanc
 * ignoré) de chaque case de la grille.
 *
 * @param width  Largeur de l'image source (px).
 * @param height Hauteur de l'image source (px).
 * @param data   Tampon RGBA 8 bits de l'image entière (le même tableau
 *               que celui retourné par `getImageData`).
 * @param options Surcouchable pour les tests (grille plus petite, seuil
 *                différent) ; par défaut : grille réelle de la planche.
 */
export function detectPixels(
  width: number,
  height: number,
  data: Uint8ClampedArray,
  options: DetectOptions = {},
): CellRect[] {
  const cols = options.cols ?? SHEET_COLS;
  const rows = options.rows ?? SHEET_ROWS;
  const threshold = options.threshold ?? CONTENT_THRESHOLD;
  const pad = options.pad ?? CROP_PAD;

  const boxes: CellRect[] = [];
  for (let line = 0; line < rows; line++) {
    const y0 = Math.round((line * height) / rows);
    const y1 = Math.round(((line + 1) * height) / rows);
    for (let col = 0; col < cols; col++) {
      const x0 = Math.round((col * width) / cols);
      const x1 = Math.round(((col + 1) * width) / cols);
      let minX = x1;
      let maxX = -1;
      let minY = y1;
      let maxY = -1;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * width + x) * 4;
          // L'image est un PNG avec fond transparent : on ignore les zones
          // invisibles (et les pixels quasi blancs, pour rester compatible
          // avec un éventuel fond blanc opaque).
          if (data[i + 3] < 64) continue;
          const whiteGap = 765 - (data[i] + data[i + 1] + data[i + 2]);
          if (whiteGap > threshold) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      // Case vide (ou détection ratée) : garde la case entière.
      if (maxX < 0) {
        boxes.push({
          x: x0 + pad,
          y: y0 + pad,
          width: x1 - x0 - 2 * pad,
          height: y1 - y0 - 2 * pad,
        });
        continue;
      }
      boxes.push({
        x: minX - pad,
        y: minY - pad,
        width: maxX - minX + 1 + 2 * pad,
        height: maxY - minY + 1 + 2 * pad,
      });
    }
  }
  return boxes;
}