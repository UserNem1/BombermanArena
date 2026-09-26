/**
 * Catalogue des personnages jouables.
 *
 * Une partie n'accepte qu'un joueur par personnage : chaque personnage a
 * une couleur distinctive, et c'est par elle qu'on garantit que deux
 * joueurs ne peuvent pas avoir « le même perso ». Le catalogue est
 * volontairement une simple liste : pour ajouter un personnage, on ajoute
 * une entrée (l'écran d'attente construit automatiquement la parcelle de
 * sélection à partir de cette liste).
 *
 * `cols`/`rows` décrivent la grille de la planche d'animations (utilisée
 * pour la découpe des poses dans le jeu) ; ils sont ajustables par fichier
 * car les planches ne partagent pas toutes la même grille.
 */

/** Un personnage jouable. */
export interface Character {
  /** Identifiant stable (ex. 'perso-1'). */
  readonly id: string;
  /** Nom affiché dans les sélecteurs. */
  readonly label: string;
  /** Couleur distinctive du personnage (0xRRGGBB), unique du catalogue. */
  readonly color: number;
  /** Planche d'animations, chemin relatif à index.html. */
  readonly sprites: string;
  /** Colonnes de la grille de la planche (découpe des poses). */
  readonly cols: number;
  /** Rangées de la grille de la planche (découpe des poses). */
  readonly rows: number;
}

/** Personnages disponibles (roster extensible). */
export const CHARACTERS: readonly Character[] = [
  {
    id: 'perso-1',
    label: 'Perso 1',
    color: 0x902058,
    sprites: 'assets/perso1.jpg',
    cols: 1,
    rows: 3,
  },
  {
    id: 'perso-2',
    label: 'Perso 2',
    color: 0x601030,
    sprites: 'assets/perso2.jpg',
    cols: 1,
    rows: 4,
  },
  {
    id: 'perso-3',
    label: 'Perso 3',
    color: 0x0040f0,
    sprites: 'assets/perso3.jpg',
    cols: 1,
    rows: 5,
  },
  {
    id: 'perso-4',
    label: 'Perso 4',
    color: 0xd02810,
    sprites: 'assets/perso4.jpg',
    cols: 1,
    rows: 6,
  },
];

/**
 * Personnage du catalogue correspondant à un identifiant, ou `undefined`
 * si l'identifiant est inconnu (identifiant inconnu => aucune affiche).
 */
export function getCharacter(characterId: string): Character | undefined {
  return CHARACTERS.find((c) => c.id === characterId);
}