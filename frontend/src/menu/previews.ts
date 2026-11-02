/**
 * Aperçus des personnages pour la salle d'attente.
 *
 * Chaque personnage est représenté par la **première pose de sa planche** :
 * les premières lignes d'une planche pouvant être vides, la pose est rognée
 * sur son contenu (voir `firstCell`). Les planches sont chargées une fois
 * pour toutes au démarrage, en parallèle ; un échec de chargement ne bloque
 * rien (l'aperçu reste vide, la salle s'affiche quand même).
 *
 * Choix technique : on met en cache la **texture**, pas le sprite. Un objet
 * d'affichage PixiJS ne peut avoir qu'un seul parent, alors que la texture —
 * la partie coûteuse — se partage sans limite. `get` renvoie donc un
 * nouveau sprite à chaque appel, ce qui permet d'afficher la même pose à
 * plusieurs endroits en même temps (les quatre emplacements, le sélecteur).
 *
 * Ce module dépend du DOM (`Image`, canvas) : il n'est pas couvert par les
 * tests unitaires, qui.mockent PixiJS.
 */

import { Rectangle, Sprite, Texture, TextureSource } from 'pixi.js';
import { SLOT_PREVIEW_HEIGHT } from './components/PlayerSlot.js';
import { CHARACTERS } from './lobby/characters.js';
import { firstCellBox } from './firstCell.js';
import { loadImage } from './imageLoader.js';

/**
 * Fabrique d'aperçus : renvoie une **nouvelle** image du personnage à la
 * hauteur demandée (ou `null` tant que sa planche n'est pas chargée).
 */
export type PreviewFactory = (characterId: string, height?: number) => Sprite | null;

export class CharacterPreviews {
  /** Textures des premières poses, indexées par identifiant de personnage. */
  private readonly textures = new Map<string, Texture>();

  /**
   * Charge les planches de tous les personnages, en parallèle (4 images :
   * les charger l'une après l'autre coûterait quatre allers-retours).
   */
  async load(): Promise<void> {
    await Promise.all(CHARACTERS.map((c) => this.loadOne(c.id, c.sprites)));
  }

  /**
   * Sprite du personnage, centré sur sa position et redimensionné à la
   * hauteur demandée (la largeur suit les proportions de la pose).
   *
   * @param characterId Identifiant du personnage (catalogue).
   * @param height      Hauteur d'affichage en px.
   */
  get(characterId: string, height = SLOT_PREVIEW_HEIGHT): Sprite | null {
    const texture = this.textures.get(characterId);
    if (!texture) return null;

    const sprite = new Sprite({ texture });
    sprite.anchor.set(0.5);
    sprite.height = height;
    sprite.width = (sprite.height * texture.frame.width) / texture.frame.height;
    return sprite;
  }

  /**
   * Charge la planche d'un personnage et met sa pose en cache. Un échec est
   * journalisé mais jamais propagé : mieux vaut un emplacement vide qu'un
   * écran qui ne s'affiche pas.
   */
  private async loadOne(id: string, url: string): Promise<void> {
    try {
      const image = await loadImage(url);
      const box = firstCellBox(image);
      this.textures.set(
        id,
        new Texture({
          source: TextureSource.from(image),
          frame: new Rectangle(box.x, box.y, box.width, box.height),
        }),
      );
    } catch (error) {
      console.error(`[previews] planche du perso ${id} illisible :`, error);
    }
  }
}