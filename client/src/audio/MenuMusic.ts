/**
 * Musique des écrans hors partie.
 *
 * Un seul lecteur partagé (singleton `menuMusic`) diffuse la musique du
 * menu. Il est indépendant des écrans : il continue donc de jouer quand on
 * passe du menu aux options ou à la salle d'attente, et il suffit de
 * l'arrêter au lancement d'une partie.
 *
 * Le lecteur s'appuie sur un `HTMLAudioElement` en boucle. Si Chromium
 * refuse la lecture automatique (politique d'autoplay), on réessaie une
 * seule fois au premier clic ou à la première touche du joueur.
 */

/** Volume par défaut du lecteur (0 = muet, 1 = maximum). */
const DEFAULT_VOLUME = 0.5;

/** Fabrique un élément audio ; injectable pour les tests. */
export type AudioFactory = (source: string) => HTMLAudioElement;

/**
 * Lecteur de musique en boucle, partagé par les écrans hors partie.
 */
export class MenuMusic {
  /** Élément audio, créé à la première lecture puis réutilisé. */
  private audio: HTMLAudioElement | null = null;

  /** Volume courant (0..1), conservé même avant la création de l'élément. */
  private volume = DEFAULT_VOLUME;

  /** Vrai tant que l'on souhaite entendre la musique. */
  private wantsPlayback = false;

  /** Vrai quand l'attente du premier geste est déjà installée. */
  private waitingForGesture = false;

  /**
   * Gestionnaire du premier geste de l'utilisateur, lié une seule fois pour
   * pouvoir être retiré avec la même référence.
   */
  private readonly onFirstGesture = (): void => {
    this.removeGestureRetry();
    if (this.wantsPlayback) {
      this.start();
    }
  };

  /**
   * @param source      Chemin du fichier audio, relatif à index.html.
   * @param createAudio Fabrique de l'élément audio (tests uniquement).
   */
  constructor(
    private readonly source: string,
    private readonly createAudio: AudioFactory = (src) => new Audio(src),
  ) {}

  /**
   * Démarre (ou reprend) la lecture en boucle.
   *
   * Sans effet si la musique joue déjà. En cas de refus d'autoplay, la
   * lecture est retentée au premier geste de l'utilisateur.
   */
  play(): void {
    this.wantsPlayback = true;
    this.start();
  }

  /** Met la musique en pause (la position dans le morceau est conservée). */
  pause(): void {
    this.wantsPlayback = false;
    this.removeGestureRetry();
    this.audio?.pause();
  }

  /**
   * Règle le volume de la musique.
   *
   * @param volume Valeur entre 0 (muet) et 1 (maximum) ; les valeurs hors
   *               bornes sont ramenées dans l'intervalle.
   */
  setVolume(volume: number): void {
    this.volume = Math.min(1, Math.max(0, volume));
    if (this.audio) {
      this.audio.volume = this.volume;
    }
  }

  /** Volume courant de la musique (0..1). */
  getVolume(): number {
    return this.volume;
  }

  /** Vrai si la musique est actuellement en cours de lecture. */
  isPlaying(): boolean {
    return this.audio !== null && !this.audio.paused;
  }

  /** Lance la lecture si nécessaire, sans créer de nouvelle promesse inutile. */
  private start(): void {
    const audio = this.ensureAudio();

    // `paused` est mis à jour dès l'appel à `play()` : inutile de relancer
    // la lecture (et d'empiler des promesses) si elle est déjà en cours.
    if (!audio.paused) {
      return;
    }

    // `play()` renvoie une promesse rejetée si l'autoplay est bloqué : on
    // attend alors le premier geste du joueur au lieu de réessayer en boucle.
    void audio.play().catch(() => this.waitForGesture());
  }

  /** Crée l'élément audio au premier besoin, puis le réutilise. */
  private ensureAudio(): HTMLAudioElement {
    if (!this.audio) {
      this.audio = this.createAudio(this.source);
      this.audio.loop = true;
      this.audio.preload = 'auto';
      this.audio.volume = this.volume;
    }
    return this.audio;
  }

  /**
   * Installe l'attente du premier clic ou de la première touche.
   *
   * Le drapeau `waitingForGesture` évite d'enregistrer plusieurs paires
   * d'écouteurs si plusieurs tentatives de lecture échouent.
   */
  private waitForGesture(): void {
    // Pas de DOM (tests unitaires exécutés sous Node) : rien à faire.
    if (this.waitingForGesture || typeof window === 'undefined') {
      return;
    }

    this.waitingForGesture = true;
    window.addEventListener('pointerdown', this.onFirstGesture);
    window.addEventListener('keydown', this.onFirstGesture);
  }

  /** Retire l'attente du premier geste, si elle est installée. */
  private removeGestureRetry(): void {
    if (!this.waitingForGesture) {
      return;
    }

    this.waitingForGesture = false;
    window.removeEventListener('pointerdown', this.onFirstGesture);
    window.removeEventListener('keydown', this.onFirstGesture);
  }
}

/** Lecteur partagé par les écrans hors partie (menu, options, attente). */
export const menuMusic = new MenuMusic('assets/music_menu.ogg');
