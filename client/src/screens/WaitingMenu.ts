/**
 * Écran d'attente (salle multijoueur).
 *
 * Fond identique au menu (grille), un titre et quatre emplacements dans les
 * coins — un par joueur (voir `PlayerSlot`). En dessous : le sélecteur de
 * personnages (une carte par perso du catalogue), la synthèse « X/Y prêts »
 * et le bouton « Prêt / Pas prêt » pour le joueur local.
 *
 * L'écran est volontairement sans logique réseau : le bus d'événements du
 * lobby lui fournit la liste des joueurs et il notifie les actions de
 * l'utilisateur (retour, basculement prêt, choix du perso) via des
 * callbacks.
 */

import { Container, Text } from 'pixi.js';
import { Button } from '../components/Button.js';
import { CharacterCard } from '../components/CharacterCard.js';
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
import { CHARACTERS } from '../lobby/characters.js';
import type { Player } from '../lobby/LobbyBus.js';

/** Couleur du titre de la page. */
const TITLE_STROKE = '#0b2545';

/** Styles de la synthèse sous le sélecteur (compteur / tous prêts). */
const SUMMARY_STYLE = statusStyle(COLORS.muted);
const SUMMARY_READY_STYLE = statusStyle(COLORS.ready);

/** Marge des emplacements aux bords de l'écran (px). */
const SLOT_MARGIN = 90;

/** Largeur d'une carte de personnage et espacement (px). */
const CARD_WIDTH = 110;
const CARD_GAP = 10;

/** Ordonnées (fractions de hauteur) : sélecteur, synthèse, boutons. */
const SELECTOR_Y = 0.48;
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

/** Sélecteur de personnages centré, une carte par perso du catalogue. */
const SELECTOR_X0 = (DESIGN_WIDTH - CHARACTERS.length * CARD_WIDTH
  - (CHARACTERS.length - 1) * CARD_GAP) / 2;

/** Message affiché quand toute la salle est prête. */
const ALL_READY_MESSAGE = 'Tous les joueurs sont prêts !';
/** Libellés du bouton de bascule. */
const READY_LABEL = 'PRÊT';
const NOT_READY_LABEL = 'PAS PRÊT';

export class WaitingMenu extends Container {
  /** Emplacements des joueurs, exposés pour les tests. */
  readonly slots: PlayerSlot[] = [];
  /** Cartes de sélection des personnages, exposées pour les tests. */
  readonly characterCards: CharacterCard[] = [];
  /** Bouton « Prêt / Pas prêt ». */
  readonly readyButton: Button;
  /** Texte de synthèse (compteur / tous prêts). */
  readonly summaryText: Text;
  /** Identifiant du joueur local (marqué « · vous »). */
  private readonly selfId: string;

  constructor(
    onBack: () => void,
    onToggleReady: () => void,
    onSelectCharacter: (characterId: string) => void,
    selfId: string,
  ) {
    super();
    this.selfId = selfId;

    // Décor de fond identique au menu : la grille de l'arène.
    this.addChild(new Grid());
    this.buildSlots();
    this.addChild(
      createCenteredTitle('EN ATTENTE', DESIGN_HEIGHT * TITLE_Y, {
        fill: COLORS.accent,
        fontSize: 40,
        letterSpacing: 8,
        strokeColor: TITLE_STROKE,
        strokeWidth: 6,
      }),
    );
    this.buildCharacterSelector(onSelectCharacter);
    const controls = this.buildControls(onBack, onToggleReady);
    this.summaryText = controls.summaryText;
    this.readyButton = controls.readyButton;
  }

  /**
   * Reflète la liste des joueurs de la salle dans les emplacements.
   *
   * Les premiers joueurs occupent les coins, dans l'ordre ; les
   * emplacements restants restent « EN ATTENTE… ». Met aussi à jour la
   * synthèse « prêts / tous prêts », le libellé du bouton et les états
   * des cartes de personnages (choisi, pris, libre).
   */
  setPlayers(players: readonly Player[]): void {
    this.slots.forEach((slot, index) => {
      slot.setPlayer(players[index], players[index]?.id === this.selfId);
    });
    this.characterCards.forEach((card) => {
      const owner = players.find((p) => p.characterId === card.character.id);
      const isSelf = owner?.id === this.selfId;
      card.setSelected(isSelf);
      card.setTaken(owner !== undefined && !isSelf);
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

  /** Place les quatre emplacements de joueur dans les coins. */
  private buildSlots(): void {
    for (const [x, y] of SLOTS_CENTER) {
      const slot = new PlayerSlot();
      slot.position.set(x, y);
      this.slots.push(slot);
      this.addChild(slot);
    }
  }

  /** Sélecteur de personnages : une carte par perso du catalogue (le
   *  roster peut grandir sans toucher à l'écran). */
  private buildCharacterSelector(
    onSelectCharacter: (characterId: string) => void,
  ): void {
    CHARACTERS.forEach((character, index) => {
      const card = new CharacterCard(character, () => onSelectCharacter(character.id));
      card.position.set(
        SELECTOR_X0 + index * (CARD_WIDTH + CARD_GAP),
        DESIGN_HEIGHT * SELECTOR_Y,
      );
      this.characterCards.push(card);
      this.addChild(card);
    });
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