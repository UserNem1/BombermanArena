/**
 * Démonstration animée du menu.
 *
 * Fait traverser l'écran au personnage comme si quelqu'un jouait : il
 * marche vers la droite (pose « marche droite »), saute sur place, puis
 * « meurt » en s'effaçant, avant de recommencer depuis la gauche. Juste
 * après son entrée complète à gauche, il fait un tour de présentation
 * lent (face -> gauche -> droite -> dos -> face) en guise d'accueil.
 * C'est une machine à états basée sur le temps (aucune entrée joueur),
 * pilotée par la boucle de rendu Pixi via `update(dt)`.
 *
 * La planche `spriteBombermanMenu.png` (fond transparent) est une grille
 * de 3 colonnes x 5 lignes (cases de 32 px ; le fichier source est plus
 * grand, le reste étant vide) :
 * - ligne 1 : marche avant (face)
 * - ligne 2 : marche droite          — utilisée pour la traversée
 * - ligne 3 : marche arrière
 * - ligne 4 : marche gauche
 * - ligne 5 : case 1 = mort, case 2 = saut
 *
 * Chaque case est rognée sur son contenu réel puis alignée dans un
 * cadre commun (pieds au même niveau) : aucune à-coupe d'échelle en
 * passant d'une pose à l'autre. Toutes les positions sont dans
 * l'espace de conception 1280x720, mis à l'échelle par le renderer.
 */
import { Container } from 'pixi.js';
/**
 * Contient les quatre animations du personnage (marche, présentation,
 * saut, mort) et anime la position, l'échelle et l'opacité de celle qui
 * doit être visible.
 */
export declare class AnimationPersonnageMenu extends Container {
    private readonly walk;
    private readonly intro;
    private readonly jump;
    private readonly death;
    private active;
    private phase;
    private time;
    private posX;
    /** Vrai une fois le tour de présentation joué pendant ce cycle. */
    private introDone;
    private constructor();
    /**
     * Charge la planche, découpe les cases et construit les animations.
     * @param url Chemin de l'image, relatif à index.html.
     */
    static load(url: string): Promise<AnimationPersonnageMenu>;
    /**
     * Ne garde que la grille utile (SHEET_COLS x SHEET_ROWS cases de
     * FRAME_SIZE px, en haut à gauche) : le fichier source est plus grand
     * mais le reste est vide. La grille utile est ainsi alignée sur le coin
     * haut-gauche, ce dont dépendent les calculs de cases.
     */
    private static cropSheet;
    /**
     * Charge la planche (avec tentatives) et attend la fin du chargement.
     * `image.decode()` peut rejeter avec EncodingError même quand l'image
     * se charge (caprice de Chromium) : on attend onload/onerror, fiables.
     */
    private static loadImage;
    private static buildFrom;
    /**
     * Rogne la zone d'une case (indice `cell`) dans le cadre commun
     * `Wc x Hc` de sa séquence : centré horizontalement, pieds collés au
     * bas du cadre. `b` est la boîte de contenu détectée de la case.
     */
    private static cropTexture;
    /**
     * Calcule la bounding box du contenu (fond transparent ou quasi blanc
     * ignoré) de chaque case de la grille. Délègue les calculs purs à
     * `detectPixels` (planche.ts) : ici on ne fait que décoder l'image.
     */
    private static detectCellBoxes;
    /**
     * Avance le cycle d'animation d'un pas de temps `dt` (en secondes).
     * À appeler dans la boucle de rendu (app.ticker).
     */
    update(dt: number): void;
    /**
     * Passe à l'étape indiquée : masque l'animation courante, lance la
     * suivante. `keepWalkPos` conserve la position atteinte (reprise de la
     * marche après le tour de présentation).
     */
    private enter;
}
//# sourceMappingURL=AnimationPersonnageMenu.d.ts.map