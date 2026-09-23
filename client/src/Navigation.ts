/**
 * Navigation clavier des écrans (accessibilité).
 *
 * Pixi délègue la souris mais la navigation au clavier n'est fournie que
 * par son plugin d'accessibilité (basé sur un DOM d'ombre). Ici on reste
 * sur du DOM réel, simple et prévisible : le canvas est focusable et on
 * écoute `keydown` dessus.
 *
 * - Tab / Maj+Tab     : déplace le focus entre les boutons de l'écran affiché.
 * - Entrée / Espace   : active le bouton focus.
 * - Clic              : ramène le focus sur le bouton cliqué.
 */

import { Application, Container } from 'pixi.js';
import { Button } from './components/Button.js';

export class Navigation {
  /** Index du bouton focus dans la liste des boutons de l'écran courant. */
  private index = 0;

  /**
   * @param app        Application Pixi : son canvas devient le support focus.
   * @param getCurrent Renvoie l'écran actuellement affiché (menu, options...)
   *                   pour n'explorer que les boutons visibles à l'écran.
   */
  constructor(
    private readonly app: Application,
    private readonly getCurrent: () => Container,
  ) {
    // Le canvas doit pouvoir recevoir le focus pour écouter les touches.
    this.app.canvas.tabIndex = 0;
    this.app.canvas.addEventListener('keydown', (event) => this.onKey(event));
  }

  /** Boutons de l'écran affiché (uniquement ses enfants directs). */
  private buttons(): Button[] {
    return this.getCurrent().children.filter(
      (child): child is Button => child instanceof Button,
    );
  }

  /** Applique la couronne de focus au bouton `index` (cyclique). */
  private focusIndex(index: number): void {
    const buttons = this.buttons();
    if (buttons.length === 0) return;
    this.index = (index + buttons.length) % buttons.length;
    buttons.forEach((button, i) => button.setFocused(i === this.index));
  }

  private onKey(event: KeyboardEvent): void {
    const buttons = this.buttons();
    if (buttons.length === 0) return;

    if (event.code === 'Tab') {
      // On pilote le focus à la main : on neutralise le Tab du navigateur.
      event.preventDefault();
      this.focusIndex(this.index + (event.shiftKey ? -1 : 1));
    } else if (event.code === 'Enter' || event.code === 'Space') {
      event.preventDefault();
      buttons[this.index].activate();
    }
  }
}