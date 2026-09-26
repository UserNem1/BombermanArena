/**
 * Écran d'attente (salle multijoueur).
 *
 * Fond identique au menu (grille), un titre et quatre emplacements dans les
 * coins — un par joueur (voir `PlayerSlot`). `setPlayers` répartit la liste
 * de la salle sur ces emplacements ; le compteur en dessous indique combien
 * de joueurs sont prêts, et le bouton « Prêt / Pas prêt » permet au joueur
 * local de (dé)clarer sa disponibilité.
 *
 * L'écran est volontairement sans logique réseau : le bus d'événements du
 * lobby lui fournit la liste des joueurs et il notifie les actions de
 * l'utilisateur (retour, basculement prêt) via des callbacks.
 */

import { Container, Text, TextStyle } from 'pixi.js';
import { Button } from '../components/Button.js';
import { PlayerSlot, SLOT_HEIGHT, SLOT_WIDTH } from '../components/PlayerSlot.js';
import {
  COLORS,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  TITLE_Y,
  createCenteredTitle,
} from '../design.js';
import { Grid } from '../components/Grid.js';
import type { Player } from '../lobby/LobbyBus.js';

/** Couleur du titre de la page. */
const TITLE_STROKE = '#0b2545';

/** Styles de la synthèse sous le bouton. */
const SUMMARY_STYLE = new TextStyle({
  fontFamily: 'Arial',
  fontSize: 16,
  fontWeight: 'bold',
  letterSpacing: 2,
  fill: COLORS.muted,
});
const SUMMARY_READY_STYLE = new TextStyle({
  fontFamily: 'Arial',
  fontSize: 16,
  fontWeight: 'bold',
  letterSpacing: 2,
  fill: COLORS.ready,
});

/** Marge des emplacements aux bords de l'écran (px). */
const SLOT_MARGIN = 90;

/** Ordonnées (fractions de hauteur) de la synthèse, du bouton, du retour. */
const SUMMARY_Y = 0.71;
const TOGGLE_Y = 0.78;
const BACK_Y = 0.9;

/** Centre (x, y) de chacun des quatre emplacements de joueur. */
const SLOTS_CENTER: [number, number][] = [
  [SLOT_MARGIN + SLOT_WIDTH / 2, SLOT_MARGIN + SLOT_HEIGHT / 2],
  [DESIGN_WIDTH - SLOT_MARGIN - SLOT_WIDTH / 2, SLOT_MARGIN + SLOT_HEIGHT / 2],
  [SLOT_MARGIN + SLOT_WIDTH / 2, DESIGN_HEIGHT - SLOT_MARGIN - SLOT_HEIGHT / 2],
  [
    DESIGN_WIDTH - SLOT_MARGIN - SLOT_WIDTH / 2,
    DESIGN_HEIGHT - SLOT_MARGIN - SLOT_HEIGHT / 2,
  ],
];

/** Message affiché quand toute la salle est prête. */
const ALL_READY_MESSAGE = 'Tous les joueurs sont prêts !';
/** Libellés du bouton de bascule. */
const READY_LABEL = 'PRÊT';
const NOT_READY_LABEL = 'PAS PRÊT';

export class WaitingMenu extends Container {
  /** Emplacements des joueurs, exposés pour les tests. */
  readonly slots: PlayerSlot[] = [];
  /** Bouton « Prêt / Pas prêt ». */
  readonly readyButton: Button;
  /** Texte de synthèse (compteur / tous prêts). */
  readonly summaryText: Text;
  /** Identifiant du joueur local (marqué « · vous »). */
  private readonly selfId: string;

  constructor(
    onBack: () => void,
    onToggleReady: () => void,
    selfId: string,
  ) {
    super();
    this.selfId = selfId;

    // Décor de fond identique au menu : la grille de l'arène.
    this.addChild(new Grid());

    // Les quatre emplacements joueurs, un dans chaque coin.
    for (const [x, y] of SLOTS_CENTER) {
      const slot = new PlayerSlot();
      slot.position.set(x, y);
      this.slots.push(slot);
      this.addChild(slot);
    }

    // Titre au centre, au-dessus des emplacements du haut.
    this.addChild(
      createCenteredTitle('EN ATTENTE', DESIGN_HEIGHT * TITLE_Y, {
        fill: COLORS.accent,
        fontSize: 40,
        letterSpacing: 8,
        strokeColor: TITLE_STROKE,
        strokeWidth: 6,
      }),
    );

    // Synthèse : « X/Y prêts », puis « Tous les joueurs sont prêts ! ».
    this.summaryText = new Text({ text: '', style: SUMMARY_STYLE });
    this.summaryText.anchor.set(0.5);
    this.summaryText.position.set(DESIGN_WIDTH / 2, DESIGN_HEIGHT * SUMMARY_Y);
    this.addChild(this.summaryText);

    // Bascule l'état prêt du joueur local.
    this.readyButton = new Button(READY_LABEL, onToggleReady);
    this.readyButton.position.set(DESIGN_WIDTH / 2, DESIGN_HEIGHT * TOGGLE_Y);
    this.addChild(this.readyButton);

    // Retour au menu principal.
    const back = new Button('RETOUR', onBack);
    back.position.set(DESIGN_WIDTH / 2, DESIGN_HEIGHT * BACK_Y);
    this.addChild(back);
  }

  /**
   * Reflète la liste des joueurs de la salle dans les emplacements.
   *
   * Les premiers joueurs occupent les coins, dans l'ordre ; les
   * emplacements restants restent « EN ATTENTE… ». Met aussi à jour la
   * synthèse « prêts / tous prêts » et le libellé du bouton.
   */
  setPlayers(players: readonly Player[]): void {
    this.slots.forEach((slot, index) => {
      slot.setPlayer(players[index], players[index]?.id === this.selfId);
    });
    this.refreshSummary(players);
  }

  /** Met à jour le compteur de joueurs prêts et le libellé du bouton. */
  private refreshSummary(players: readonly Player[]): void {
    // On ne compte que les joueurs visibles dans les emplacements de l'écran.
    const visible = players.slice(0, this.slots.length);
    const readyCount = visible.filter((p) => p.ready).length;

    if (visible.length > 0 && readyCount === visible.length) {
      this.summaryText.text = ALL_READY_MESSAGE;
      this.summaryText.style = SUMMARY_READY_STYLE;
    } else {
      this.summaryText.text = `${readyCount}/${visible.length} prêts`;
      this.summaryText.style = SUMMARY_STYLE;
    }

    const self = players.find((p) => p.id === this.selfId);
    this.readyButton.setLabel(self?.ready ? NOT_READY_LABEL : READY_LABEL);
  }
}