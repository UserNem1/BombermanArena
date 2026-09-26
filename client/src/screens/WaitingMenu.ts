/**
 * Écran d'attente (salle multijoueur).
 *
 * Fond identique au menu (grille), un titre et quatre emplacements dans les
 * coins — un par joueur (voir `PlayerSlot`). L'emplacement du joueur local
 * porte un sélecteur en « U » dans son angle supérieur gauche : on clique
 * dessus pour changer de personnage (l'image du perso y est affichée par
 * le renderer, sinon une pastille de couleur). En dessous : la synthèse
 * « X/Y prêts » et le bouton « Prêt / Pas prêt » pour le joueur local.
 *
 * L'écran est volontairement sans logique réseau : le bus d'événements du
 * lobby lui fournit la liste des joueurs et il notifie les actions de
 * l'utilisateur (retour, basculement prêt, changement de perso) via des
 * callbacks. Le choix du perso suivant est décidé par le parent (qui
 * connaît le bus) et restitué par `setPlayers`.
 */

import { Container, Text } from 'pixi.js';
import { Button } from '../components/Button.js';
import {
  CharacterPicker,
  PICKER_HEIGHT,
  PICKER_WIDTH,
} from '../components/CharacterPicker.js';
import { PlayerSlot, SLOT_HEIGHT, SLOT_WIDTH } from '../components/PlayerSlot.js';
import {
  COLORS,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  TITLE_Y,
  createCenteredTitle,
  statusStyle,
} from '../design.js';
import { Grid } from '../components/Grid.js';
import { getCharacter } from '../lobby/characters.js';
import type { Player } from '../lobby/LobbyBus.js';

/** Couleur du titre de la page. */
const TITLE_STROKE = '#0b2545';

/** Styles de la synthèse sous le sélecteur (compteur / tous prêts). */
const SUMMARY_STYLE = statusStyle(COLORS.muted);
const SUMMARY_READY_STYLE = statusStyle(COLORS.ready);

/** Marge des emplacements aux bords de l'écran (px). */
const SLOT_MARGIN = 90;

/** Ordonnées (fractions de hauteur) : synthèse, boutons. */
const SUMMARY_Y = 0.64;
const TOGGLE_Y = 0.83;
const BACK_Y = 0.93;

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

/** Décrochage du centre du sélecteur en U par rapport à son emplacement
 *  (angle supérieur gauche : bord haut-gauche de l'emplacement + moitié du
 *  sélecteur). */
const PICKER_DX = -(SLOT_WIDTH / 2) + PICKER_WIDTH / 2 + 10;
const PICKER_DY = -(SLOT_HEIGHT / 2) + PICKER_HEIGHT / 2 + 10;

/** Message affiché quand toute la salle est prête. */
const ALL_READY_MESSAGE = 'Tous les joueurs sont prêts !';
/** Libellés du bouton de bascule. */
const READY_LABEL = 'PRÊT';
const NOT_READY_LABEL = 'PAS PRÊT';

export class WaitingMenu extends Container {
  /** Emplacements des joueurs, exposés pour les tests. */
  readonly slots: PlayerSlot[] = [];
  /** Sélecteur en U du personnage du joueur local, exposé pour les tests. */
  readonly picker: CharacterPicker;
  /** Bouton « Prêt / Pas prêt ». */
  readonly readyButton: Button;
  /** Texte de synthèse (compteur / tous prêts). */
  readonly summaryText: Text;
  /** Identifiant du joueur local (marqué « · vous »). */
  private readonly selfId: string;
  /** Fournit l'image (pré-mise à l'échelle) d'un personnage, ou `null`. */
  private readonly getPreview: (characterId: string) => Container | null;

  constructor(
    onBack: () => void,
    onToggleReady: () => void,
    onCycleCharacter: () => void,
    selfId: string,
    getPreview: (characterId: string) => Container | null = () => null,
  ) {
    super();
    this.selfId = selfId;
    this.getPreview = getPreview;

    // Décor de fond identique au menu : la grille de l'arène.
    this.addChild(new Grid());
    this.buildSlots();

    // Sélecteur en U : d'abord invisible, place sur l'emplacement du joueur
    // local dès la première liste de joueurs (voir `setPlayers`).
    this.picker = new CharacterPicker(null, onCycleCharacter);
    this.picker.visible = false;
    this.addChild(this.picker);

    this.addChild(
      createCenteredTitle('EN ATTENTE', DESIGN_HEIGHT * TITLE_Y, {
        fill: COLORS.accent,
        fontSize: 40,
        letterSpacing: 8,
        strokeColor: TITLE_STROKE,
        strokeWidth: 6,
      }),
    );
    const controls = this.buildControls(onBack, onToggleReady);
    this.summaryText = controls.summaryText;
    this.readyButton = controls.readyButton;
  }

  /**
   * Reflète la liste des joueurs de la salle dans les emplacements.
   *
   * Les premiers joueurs occupent les coins, dans l'ordre ; les
   * emplacements restants restent « EN ATTENTE… ». Le sélecteur en U suit
   * l'emplacement du joueur local (ou se masque s'il n'est pas en salle).
   * Met aussi à jour la synthèse « prêts / tous prêts » et le libellé du
   * bouton.
   */
  setPlayers(players: readonly Player[]): void {
    const rawIndex = players.findIndex((p) => p.id === this.selfId);
    const selfIndex = rawIndex < this.slots.length ? rawIndex : -1;
    this.slots.forEach((slot, index) => {
      slot.setPlayer(players[index], index === selfIndex);
      slot.setPicked(index === selfIndex);
    });
    this.updatePicker(players, selfIndex);
    this.refreshSummary(players);
  }

  /** Place le sélecteur sur l'emplacement du joueur local et le renseigne. */
  private updatePicker(players: readonly Player[], selfIndex: number): void {
    const self = selfIndex >= 0 ? players[selfIndex] : undefined;
    this.picker.visible = self !== undefined;
    if (!self) return;

    const target = this.slots[selfIndex];
    this.picker.position.set(
      target.position.x + PICKER_DX,
      target.position.y + PICKER_DY,
    );
    this.picker.setCharacter(getCharacter(self.characterId) ?? null);
    this.picker.setPreview(this.getPreview(self.characterId));
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

  /** Place les quatre emplacements de joueur dans les coins. */
  private buildSlots(): void {
    for (const [x, y] of SLOTS_CENTER) {
      const slot = new PlayerSlot();
      slot.position.set(x, y);
      this.slots.push(slot);
      this.addChild(slot);
    }
  }

  /** Construit la synthèse, le bouton « prêt » et le bouton retour. */
  private buildControls(
    onBack: () => void,
    onToggleReady: () => void,
  ): { summaryText: Text; readyButton: Button } {
    const summaryText = new Text({ text: '', style: SUMMARY_STYLE });
    summaryText.anchor.set(0.5);
    summaryText.position.set(DESIGN_WIDTH / 2, DESIGN_HEIGHT * SUMMARY_Y);
    this.addChild(summaryText);

    const readyButton = new Button(READY_LABEL, onToggleReady);
    readyButton.position.set(DESIGN_WIDTH / 2, DESIGN_HEIGHT * TOGGLE_Y);
    this.addChild(readyButton);

    const back = new Button('RETOUR', onBack);
    back.position.set(DESIGN_WIDTH / 2, DESIGN_HEIGHT * BACK_Y);
    this.addChild(back);

    return { summaryText, readyButton };
  }
}