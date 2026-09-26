/**
 * Chargement d'une image HTML en arrière-plan (browser).
 *
 * `image.decode()` peut rejeter avec EncodingError même quand l'image se
 * charge (caprice de Chromium) : on attend `onload`/`onerror`, fiables.
 * Quelques tentatives espacées évitent qu'un échec ponctuel casse la
 * construction de l'écran (le renderer, à défaut, affiche une pastille).
 */

/** Nombre de tentatives de chargement d'une image. */
const LOAD_ATTEMPTS = 3;

/**
 * Charge une image (chemin relatif à index.html) et résout dès qu'elle
 * est décodée. Rejette après `LOAD_ATTEMPTS` tentatives.
 */
export async function loadImage(
  url: string,
  attempts = LOAD_ATTEMPTS,
): Promise<HTMLImageElement> {
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
      if (attempt >= attempts) throw error;
      await new Promise((r) => setTimeout(r, 300 * attempt));
    }
  }
}