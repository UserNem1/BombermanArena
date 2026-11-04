/**
 * Logique PURE de découpe de la planche de poses (spriteBombermanMenu.png).
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
export declare const SHEET_COLS = 3;
export declare const SHEET_ROWS = 5;
/**
 * Seuil (somme des écarts à 255) au-delà duquel un pixel est du contenu.
 */
export declare const CONTENT_THRESHOLD = 60;
/**
 * Marge ajoutée autour du contenu rogné (px).
 */
export declare const CROP_PAD = 1;
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
export declare function detectPixels(width: number, height: number, data: Uint8ClampedArray, options?: DetectOptions): CellRect[];
//# sourceMappingURL=planche.d.ts.map