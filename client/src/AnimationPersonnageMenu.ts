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
 * La planche `perso1.png` (fond transparent) est une grille de 3 colonnes x 6 lignes :
 * - ligne 1 : marche avant (face)    (réservé)
 * - ligne 2 : marche arrière         (réservé)
 * - ligne 3 : marche gauche          (réservé)
 * - ligne 4 : cases 1-2 = saut, case 3 = 1re pose de mort
 * - ligne 5 : cases 1-2 = poses de mort 2 et 3
 * - ligne 6 : marche droite          — utilisée pour la traversée
 *
 * Chaque case est rognée sur son contenu réel puis alignée dans un
 * cadre commun (pieds au même niveau) : aucune à-coupe d'échelle en
 * passant d'une pose à l'autre. Toutes les positions sont dans
 * l'espace de conception 1280x720, mis à l'échelle par le renderer.
 */

import { AnimatedSprite, Container, Rectangle, Texture, TextureSource } from 'pixi.js';
import { SHEET_COLS, SHEET_ROWS, detectPixels } from './planche.js';

/** Cases utilisées par séquence (indice = ligne * COLS + colonne). */
const WALK_CELLS = [15, 16, 17]; // ligne 6 : marche droite
const INTRO_CELLS = [0, 6, 15, 3, 0]; // face, gauche, droite, dos, face : présentation
const JUMP_CELLS = [9, 10]; // ligne 4, cases 1-2 : saut
const DEATH_CELLS = [11, 12, 13]; // fin ligne 4 + début ligne 5 : mort

/** Nombre de tentatives de chargement de la planche (lecture fichier
 *  parfois instable : un échec ponctuel ne doit pas casser la démo). */
const LOAD_ATTEMPTS = 3;

/** Hauteur d'affichage du personnage (px dans l'espace de conception). */
const DISPLAY_HEIGHT = 160;

/** Hauteur du sol au-dessus duquel le personnage marche/saute. */
const FLOOR_Y = 700;

/** Positions horizontales : départ hors écran à gauche, saut sur la droite. */
const SPAWN_X = -80;
const JUMP_X = 950;

/** Abscisse où le personnage, parvenu à l'écran, fait son tour de
 *  présentation avant de repartir en marche. */
const INTRO_X = 300;

/** Durée du tour de présentation (s). */
const INTRO_DURATION = 3.5;

/** Vitesse de déplacement pendant la marche (px/s). */
const WALK_SPEED = 330;

/** Vitesse de défilement des poses (images de la boucle par image Pixi). */
const WALK_ANIM_SPEED = 0.12;
const INTRO_ANIM_SPEED = 0.025;
const JUMP_ANIM_SPEED = 0.06;
const DEATH_ANIM_SPEED = 0.07;

/** Saut : hauteur de l'arc et durée (s). */
const JUMP_HEIGHT = 150;
const JUMP_DURATION = 1.1;

/** Coefficient de l'arc parabolique `4 * t * (1 - t)` : hauteur maximale
 *  atteinte à mi-parcours (t = 0,5), nulle aux deux extrémités. */
const PARABOLA_SHAPE = 4;

/** Mort : durée du fondu (s). */
const DIE_DURATION = 1.0;

/** Pause entre la mort et le retour à gauche (s). */
const PAUSE_DURATION = 1.0;

/** Étape du cycle en cours. */
type Phase = 'walk' | 'intro' | 'jump' | 'die' | 'pause';

/**
 * Contient les trois animations du personnage et anime la position,
 * l'échelle et l'opacité de celle qui doit être visible.
 */
export class AnimationPersonnageMenu extends Container {
  private readonly walk: AnimatedSprite;
  private readonly intro: AnimatedSprite;
  private readonly jump: AnimatedSprite;
  private readonly death: AnimatedSprite;
  private active: AnimatedSprite;
  private phase: Phase = 'walk';
  private time = 0;
  private posX = SPAWN_X;
  /** Vrai une fois le tour de présentation joué pendant ce cycle. */
  private introDone = false;

  private constructor(
    walk: AnimatedSprite,
    intro: AnimatedSprite,
    jump: AnimatedSprite,
    death: AnimatedSprite,
  ) {
    super();
    this.walk = walk;
    this.intro = intro;
    this.jump = jump;
    this.death = death;
    this.active = walk;

    // Les séquences ont chacune leur échelle (fixée au chargement selon
    // la hauteur de leur cadre). Ancrage sur les pieds : la position
    // désigne le contact au sol.
    for (const sprite of [walk, intro, jump, death]) {
      sprite.anchor.set(0.5, 1);
      sprite.visible = false;
      this.addChild(sprite);
    }
    walk.visible = true;
    walk.position.set(SPAWN_X, FLOOR_Y);
    walk.play();
  }

  /**
   * Charge la planche, découpe les cases et construit les animations.
   * @param url Chemin de l'image, relatif à index.html.
   */
  static async load(url: string): Promise<AnimationPersonnageMenu> {
    const image = await AnimationPersonnageMenu.loadImage(url);
    const source = TextureSource.from(image);
    return AnimationPersonnageMenu.buildFrom(source, image);
  }

  /**
   * Charge la planche (avec tentatives) et attend la fin du chargement.
   * `image.decode()` peut rejeter avec EncodingError même quand l'image
   * se charge (caprice de Chromium) : on attend onload/onerror, fiables.
   */
  private static async loadImage(url: string): Promise<HTMLImageElement> {
    for (let attempt = 1; ; attempt++) {
      try {
        return await new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image();
          image.onload = (): void => resolve(image);
          image.onerror = (): void =>
            reject(new Error(`Impossible de charger l'image ${url} (essai ${attempt})`));
          image.src = url;
        });
      } catch (error) {
        if (attempt >= LOAD_ATTEMPTS) throw error;
        // Petite pause avant la tentative suivante.
        await new Promise((r) => setTimeout(r, 300 * attempt));
      }
    }
  }

  static buildFrom(source: TextureSource, image: HTMLImageElement): AnimationPersonnageMenu {
    const boxes = AnimationPersonnageMenu.detectCellBoxes(image);
    // Un cadre PAR séquence : les poses de saut/de mort sont plus compactes
    // que la marche ; un cadre global trop grand coupait le haut de la
    // marche et laissait un vide sous les pieds.
    const mkAnimation = (
      cells: number[],
      speed: number,
      loop: boolean,
    ): AnimatedSprite => {
      const Wc = Math.max(...cells.map((i) => boxes[i].width));
      const Hc = Math.max(...cells.map((i) => boxes[i].height));
      const list = cells.map((i) =>
        AnimationPersonnageMenu.cropTexture(source, image, boxes[i], i, Wc, Hc),
      );
      const anim = new AnimatedSprite(list);
      anim.animationSpeed = speed;
      anim.loop = loop;
      // Même hauteur d'écran pour chaque séquence.
      anim.scale.set(DISPLAY_HEIGHT / Hc);
      return anim;
    };

    const walk = mkAnimation(WALK_CELLS, WALK_ANIM_SPEED, true);
    const intro = mkAnimation(INTRO_CELLS, INTRO_ANIM_SPEED, false);
    const jump = mkAnimation(JUMP_CELLS, JUMP_ANIM_SPEED, false);
    const death = mkAnimation(DEATH_CELLS, DEATH_ANIM_SPEED, false);

    return new AnimationPersonnageMenu(walk, intro, jump, death);
  }

  /**
   * Rogne la zone d'une case (indice `cell`) dans le cadre commun
   * `Wc x Hc` de sa séquence : centré horizontalement, pieds collés au
   * bas du cadre. `b` est la boîte de contenu détectée de la case.
   */
  private static cropTexture(
    source: TextureSource,
    image: HTMLImageElement,
    b: Rectangle,
    cell: number,
    Wc: number,
    Hc: number,
  ): Texture {
    const col = cell % SHEET_COLS;
    const line = Math.floor(cell / SHEET_COLS);
    const cellX = Math.round((col * image.width) / SHEET_COLS);
    const cellEnd = Math.round(((col + 1) * image.width) / SHEET_COLS);
    const cellY = Math.round((line * image.height) / SHEET_ROWS);
    const cellEndY = Math.round(((line + 1) * image.height) / SHEET_ROWS);

    // Centre horizontalement le contenu dans le cadre (avec garde-fou
    // pour rester dans la case, puis dans l'image).
    const contentCenterX = b.x + b.width / 2;
    const cropX = Math.min(
      Math.max(contentCenterX - Wc / 2, cellX),
      Math.max(cellX, cellEnd - Wc),
    );

    // Cale le bas du cadre sur les pieds : pieds fixes.
    const cropY = Math.min(Math.max(b.y + b.height - Hc, cellY), cellEndY - Hc);

    // Dernier recadrage de sécurité dans l'image.
    const safeX = Math.min(Math.max(cropX, 0), image.width - Wc);
    const safeY = Math.min(Math.max(cropY, 0), image.height - Hc);

    return new Texture({ source, frame: new Rectangle(safeX, safeY, Wc, Hc) });
  }

  /**
   * Calcule la bounding box du contenu (fond transparent ou quasi blanc
   * ignoré) de chaque case de la grille. Délègue les calculs purs à
   * `detectPixels` (planche.ts) : ici on ne fait que décoder l'image.
   */
  private static detectCellBoxes(image: HTMLImageElement): Rectangle[] {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D indisponible');
    }
    ctx.drawImage(image, 0, 0);
    const { data } = ctx.getImageData(0, 0, image.width, image.height);
    return detectPixels(image.width, image.height, data).map(
      (box) => new Rectangle(box.x, box.y, box.width, box.height),
    );
  }

  /**
   * Avance le cycle d'animation d'un pas de temps `dt` (en secondes).
   * À appeler dans la boucle de rendu (app.ticker).
   */
  update(dt: number): void {
    this.time += dt;
    switch (this.phase) {
      case 'walk': {
        // Avance horizontalement en jouant la boucle de marche.
        this.posX += WALK_SPEED * dt;
        this.walk.position.set(this.posX, FLOOR_Y);
        // Dès que le personnage est entièrement visible, il joue son tour
        // de présentation (une fois par cycle) avant de repartir.
        if (!this.introDone && this.posX >= INTRO_X) {
          this.introDone = true;
          this.enter('intro');
        } else if (this.posX >= JUMP_X) {
          this.enter('jump');
        }
        break;
      }
      case 'intro': {
        // Tour sur lui-même sur place, puis reprise de la marche.
        if (this.time >= INTRO_DURATION) {
          this.enter('walk', true);
        }
        break;
      }
      case 'jump': {
        // Arc de saut parabolique sur place : monte, retombe.
        const t = Math.min(this.time / JUMP_DURATION, 1);
        const y = FLOOR_Y - JUMP_HEIGHT * PARABOLA_SHAPE * t * (1 - t);
        this.jump.position.set(JUMP_X, y);
        if (t >= 1) {
          this.enter('die');
        }
        break;
      }
      case 'die': {
        // Le personnage s'efface (fondu) sur ses poses de mort.
        const t = Math.min(this.time / DIE_DURATION, 1);
        this.death.alpha = 1 - t;
        if (t >= 1) {
          this.enter('pause');
        }
        break;
      }
      case 'pause': {
        // Temps mort avant de recommencer tout le cycle.
        if (this.time >= PAUSE_DURATION) {
          this.enter('walk');
        }
        break;
      }
    }
  }

  /**
   * Passe à l'étape indiquée : masque l'animation courante, lance la
   * suivante. `keepWalkPos` conserve la position atteinte (reprise de la
   * marche après le tour de présentation).
   */
  private enter(phase: Phase, keepWalkPos = false): void {
    this.phase = phase;
    this.time = 0;
    this.active.stop();
    this.active.visible = false;
    this.active.alpha = 1;

    if (phase === 'walk') {
      if (keepWalkPos) {
        this.walk.position.set(this.posX, FLOOR_Y);
      } else {
        this.posX = SPAWN_X;
        this.introDone = false;
        this.walk.position.set(SPAWN_X, FLOOR_Y);
      }
      this.active = this.walk;
      this.walk.gotoAndPlay(0);
    } else if (phase === 'intro') {
      this.active = this.intro;
      this.intro.position.set(this.posX, FLOOR_Y);
      this.intro.gotoAndPlay(0);
    } else if (phase === 'jump') {
      this.active = this.jump;
      this.jump.position.set(JUMP_X, FLOOR_Y);
      this.jump.gotoAndPlay(0);
    } else if (phase === 'die') {
      this.active = this.death;
      this.death.position.set(JUMP_X, FLOOR_Y);
      this.death.gotoAndPlay(0);
    }
    // 'pause' : aucune animation visible (après la mort). On remet aussi
    // l'opacité à 1 : la mort l'avait fondu à 0 au cycle précédent.
    this.active.alpha = 1;
    this.active.visible = phase !== 'pause';
  }
}