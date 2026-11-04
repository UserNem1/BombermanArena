/**
 * Bouton du menu.
 *
 * Un rectangle arrondi avec un libellé centré. Au survol, le
 * remplissage et la bordure changent de couleur. L'état « focus »
 * (navigation clavier) affiche sa propre variante : les animations
 * viendront dans un commit ultérieur.
 */
import { Container } from 'pixi.js';
/**
 * Un bouton est un `Container` qui regroupe :
 * - un `Graphics` : le rectangle dessiné ;
 * - un `Text` : le libellé.
 */
export declare class Button extends Container {
    private readonly gfx;
    private readonly caption;
    private readonly onClick;
    /** Vrai si le bouton est le focus clavier courant. */
    private isFocused;
    /**
     * @param label Libellé affiché au centre du bouton.
     * @param onClick Action déclenchée au clic (ou au clavier via navigation).
     */
    constructor(label: string, onClick: () => void);
    /** Déclenche l'action du bouton (clic souris ou clavier). */
    activate(): void;
    /** Marque le bouton comme focus clavier (couronne visuelle). */
    setFocused(focused: boolean): void;
    /**
     * Redessine le bouton.
     * @param hovered Indique si le curseur survole le bouton.
     * @param focused Indique si le bouton est le focus clavier courant.
     */
    private paint;
}
//# sourceMappingURL=Button.d.ts.map