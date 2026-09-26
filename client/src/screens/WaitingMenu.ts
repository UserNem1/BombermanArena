/**
 * Écran d'attente (salle multijoueur).
 *
 * Fond identique au menu (grille), un titre et quatre rectangles dans les
 * coins — un emplacement par joueur. `setPlayers` reflète l'état de la
 * salle : un emplacement occupé affiche le pseudo et son état « prêt » ou
 * « pas prêt », l'emplacement libre reste « EN ATTENTE… ». Un bouton
 * « Prêt / Pas prêt » permet au joueur local de (dé)clarer sa disponibilité ;
 * le compteur en dessous indique combien de joueurs sont prêts.
 *
 * L'écran est volontairement sans logique réseau : le bus d'événements du
 * lobby lui fournit la liste des joueurs et il notifie les actions de
 * l'utilisateur (retour, basculement prêt) via des callbacks.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Button } from '../components/Button.js';
import {
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  TITLE_Y,
  createCenteredTitle,
} from '../design.js';
import { Grid } from '../components/Grid.js';
import type { Player } from '../lobby/LobbyBus.js';

/** Couleur du titre de la page. */
const TITLE_COLOR = 0x4cc9f0;
const TITLE_STROKE = '#0b2545';

/** Couleurs des emplacements joueur. */
const SLOT_COLOR = 0x2b2f4a;
const SLOT_BORDER = 0x6c63a8;

/** Couleurs selon l'état d'un emplacement. */
const SLOT_EMPTY_FILL = 0x8a8fb8;
const SLOT_READY_FILL = 0x4ade80;
const SLOT_NOT_READY_FILL = 0xdfe4ff;

/** Couleur et libellés des états. */
const READY_LABEL = 'PRÊT';
const NOT_READY_LABEL = 'PAS PRÊT';
const EMPTY_LABEL = 'EN ATTENTE…';
const SELF_SUFFIX = ' · vous';

/** Styles des textes de la salle. */
const SLOT_NAME_STYLE = new TextStyle({
  fontFamily: 'Arial',
  fontSize: 22,
  fontWeight: 'bold',
  fill: SLOT_NOT_READY_FILL,
});
const SLOT_STATUS_STYLE = new TextStyle({
  fontFamily: 'Arial',
  fontSize: 16,
  fontWeight: 'bold',
  letterSpacing: 2,
});
const READY_STATUS_STYLE = new TextStyle({
  fontFamily: 'Arial',
  fontSize: 16,
  fontWeight: 'bold',
  letterSpacing: 2,
  fill: SLOT_READY_FILL,
});
const NOT_READY_STATUS_STYLE = new TextStyle({
  fontFamily: 'Arial',
  fontSize: 16,
  fontWeight: 'bold',
  letterSpacing: 2,
  fill: SLOT_EMPTY_FILL,
});

/** Taille et marge des emplacements (px). */
const SLOT_WIDTH = 300;
const SLOT_HEIGHT = 220;
const SLOT_MARGIN = 90;

/** Décrochage vertical des libellés par rapport au centre de la case. */
const NAME_OFFSET = -18;
const STATUS_OFFSET = 26;

/** Ordonnées (fractions de hauteur) du compteur, du bouton et du retour. */
const STATUS_TEXT_Y = 0.71;
const TOGGLE_Y = 0.78;
const BACK_Y = 0.9;

/** Coin (x, y) de chaque emplacement de joueur. */
const PLAYER_SLOTS: [number, number][] = [
  [SLOT_MARGIN, SLOT_MARGIN],
  [DESIGN_WIDTH - SLOT_MARGIN - SLOT_WIDTH, SLOT_MARGIN],
  [SLOT_MARGIN, DESIGN_HEIGHT - SLOT_MARGIN - SLOT_HEIGHT],
  [DESIGN_WIDTH - SLOT_MARGIN - SLOT_WIDTH, DESIGN_HEIGHT - SLOT_MARGIN - SLOT_HEIGHT],
];

/** Message affiché quand toute la salle est prête. */
const ALL_READY_MESSAGE = 'Tous les joueurs sont prêts !';

export class WaitingMenu extends Container {
  /** Libellés des emplacements (noms), exposés pour les tests. */
  readonly slotNames: Text[] = [];
  /** Libellés d'état des emplacements, exposés pour les tests. */
  readonly slotStatuses: Text[] = [];
  /** Bouton « Prêt / Pas prêt ». */
  readonly readyButton: Button;
  /** Texte de synthèse (compteur / tous prêts). */
  readonly summaryText: Text;
  /** Identifiant du joueur local (marqué « · vous »). */
  private readonly selfId: string;
  private readonly onToggleReady: () => void;

  constructor(
    onBack: () => void,
    onToggleReady: () => void,
    selfId: string,
  ) {
    super();
    this.onToggleReady = onToggleReady;
    this.selfId = selfId;

    // Décor de fond identique au menu : la grille de l'arène.
    this.addChild(new Grid());

    // Les quatre emplacements joueurs, un dans chaque coin.
    const gfx = new Graphics();
    for (const [x, y] of PLAYER_SLOTS) {
      gfx
        .roundRect(x, y, SLOT_WIDTH, SLOT_HEIGHT, 12)
        .fill(SLOT_COLOR)
        .stroke({ width: 2, color: SLOT_BORDER });
    }
    this.addChild(gfx);

    // Deux lignes par emplacement : le pseudo (centre) et l'état en dessous.
    for (const [x, y] of PLAYER_SLOTS) {
      const name = new Text({ text: EMPTY_LABEL, style: SLOT_NAME_STYLE });
      name.anchor.set(0.5);
      name.position.set(x + SLOT_WIDTH / 2, y + SLOT_HEIGHT / 2 + NAME_OFFSET);
      const status = new Text({ text: '', style: SLOT_STATUS_STYLE });
      status.anchor.set(0.5);
      status.position.set(x + SLOT_WIDTH / 2, y + SLOT_HEIGHT / 2 + STATUS_OFFSET);
      this.slotNames.push(name);
      this.slotStatuses.push(status);
      this.addChild(name, status);
    }

    // Titre au centre, au-dessus des emplacements du haut.
    this.addChild(
      createCenteredTitle('EN ATTENTE', DESIGN_HEIGHT * TITLE_Y, {
        fill: TITLE_COLOR,
        fontSize: 40,
        letterSpacing: 8,
        strokeColor: TITLE_STROKE,
        strokeWidth: 6,
      }),
    );

    // Synthèse : « X/Y prêts », puis « Tous les joueurs sont prêts ! ».
    this.summaryText = new Text({ text: '', style: SLOT_STATUS_STYLE });
    this.summaryText.anchor.set(0.5);
    this.summaryText.position.set(DESIGN_WIDTH / 2, DESIGN_HEIGHT * STATUS_TEXT_Y);
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
   * Les `MAX_PLAYERS` premiers joueurs occupent les coins, dans l'ordre ;
   * les emplacements restants restent affichés « EN ATTENTE… ». Met aussi
   * à jour le libellé du bouton et la synthèse « prêts / tous prêts ».
   */
  setPlayers(players: readonly Player[]): void {
    this.slotNames.forEach((label, index) => {
      const player = players[index];
      if (!player) {
        label.text = EMPTY_LABEL;
        label.style = SLOT_NAME_STYLE;
        this.slotStatuses[index].text = '';
        return;
      }
      const isSelf = player.id === this.selfId;
      label.text = isSelf ? `${player.name}${SELF_SUFFIX}` : player.name;
      const status = this.slotStatuses[index];
      status.text = player.ready ? READY_LABEL : NOT_READY_LABEL;
      status.style = player.ready ? READY_STATUS_STYLE : NOT_READY_STATUS_STYLE;
    });
    this.refreshSummary(players);
  }

  /** Met à jour le compteur de joueurs prêts et le libellé du bouton. */
  private refreshSummary(players: readonly Player[]): void {
    // On ne compte que les joueurs visibles dans les emplacements de l'écran.
    const visible = players.slice(0, this.slotNames.length);
    const readyCount = visible.filter((p) => p.ready).length;

    if (visible.length > 0 && readyCount === visible.length) {
      this.summaryText.text = ALL_READY_MESSAGE;
      this.summaryText.style = READY_STATUS_STYLE;
    } else {
      this.summaryText.text = `${readyCount}/${visible.length} prêts`;
      this.summaryText.style = NOT_READY_STATUS_STYLE;
    }

    const self = players.find((p) => p.id === this.selfId);
    this.readyButton.setLabel(self?.ready ? NOT_READY_LABEL : READY_LABEL);
  }
}