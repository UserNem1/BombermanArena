/**
 * Écran d'attente (salle multijoueur).
 *
 * Fond identique au menu (grille), un titre et quatre emplacements dans les
 * coins — un par joueur (voir `PlayerSlot`). Chaque emplacement montre le
 * personnage choisi par son joueur (première pose de sa planche, fournie par
 * le renderer) dans la zone d'image, au centre. L'emplacement du joueur
 * local porte à la place un cadre **rectangle** cliquable
 * (`CharacterPicker`) : on clique dessus pour changer de personnage. En
 * dessous : la synthèse « X/Y prêts » et le bouton « Prêt / Pas prêt » pour
 * le joueur local.
 *
 * L'écran est volontairement sans logique réseau : le bus d'événements du
 * lobby lui fournit la liste des joueurs et il notifie les actions de
 * l'utilisateur (retour, basculement prêt, changement de perso) via des
 * callbacks. Le choix du perso suivant est décidé par le parent (qui
 * connaît le bus) et restitué par `setPlayers`.
 */

import { Container, Text } from 'pixi.js';
import { Button } from '../components/Button.js';
import { CharacterPicker } from '../components/CharacterPicker.js';
import {
  PlayerSlot,
  SLOT_HEIGHT,
  SLOT_PREVIEW_HEIGHT,
  SLOT_PREVIEW_OFFSET,
  SLOT_WIDTH,
} from '../components/PlayerSlot.js';
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
import { canStartGame, MIN_PLAYERS, type Player } from '../lobby/LobbyBus.js';

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

/** Message affiché quand toute la salle est prête. */
const ALL_READY_MESSAGE = 'Tous les joueurs sont prêts !';
/** Message affiché quand la salle est trop petite pour lancer une partie. */
const ALONE_MESSAGE = `Il faut au moins ${MIN_PLAYERS} joueurs pour commencer`;
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
  /** Vrai si la partie peut démarrer (2 à 4 joueurs, tous prêts) : la salle
   *  d'attente ne lance rien elle-même, elle donne l'info à l'écran de jeu. */
  get canStart(): boolean {
    return this.canStart_;
  }
  /** Identifiant du joueur local (marqué « · vous »). */
  private readonly selfId: string;
  /** Conditions de lancement réunies (cf. `canStartGame`). */
  private canStart_ = false;
  /** Personnages dont l'image est actuellement affichée, par emplacement
   *  (`null` si l'emplacement est vide) : évite de reconstruire une image
   *  déjà à l'écran. */
  private readonly shownCharacters: (string | null)[] = [];
  /** Personnage affiché dans le sélecteur (idem). */
  private shownPickerCharacter: string | null = null;
  /** Fabrique d'images de personnages : renvoie une nouvelle image à la
   *  hauteur demandée (ou `null` si elle n'est pas encore chargée). */
  private readonly getPreview: (
    characterId: string,
    height?: number,
  ) => Container | null;

  constructor(
    onBack: () => void,
    onToggleReady: () => void,
    onCycleCharacter: () => void,
    selfId: string,
    getPreview: (characterId: string, height?: number) => Container | null = () => null,
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
   * emplacements restants restent « EN ATTENTE… ». Chaque emplacement affiche
   * l'image du personnage de son joueur ; le sélecteur en U suit l'emplacement
   * du joueur local (ou se masque s'il n'est pas en salle). Met aussi à jour
   * la synthèse « prêts / tous prêts » et le libellé du bouton.
   */
  setPlayers(players: readonly Player[]): void {
    const rawIndex = players.findIndex((p) => p.id === this.selfId);
    const selfIndex = rawIndex < this.slots.length ? rawIndex : -1;
    this.slots.forEach((slot, index) => {
      const player = players[index];
      const isSelf = index === selfIndex;
      slot.setPlayer(player, isSelf);
      // Le joueur local affiche son perso dans le sélecteur cliquable, à la
      // même place : on ne le dessine pas une seconde fois dans l'emplacement.
      const characterId = player && !isSelf ? player.characterId : null;
      this.refreshSlotPreview(slot, index, characterId);
    });
    this.updatePicker(players, selfIndex);
    this.refreshSummary(players);
  }

  /**
   * Affiche le portrait d'un emplacement, sans le reconstruire si le
   * personnage n'a pas changé.
   *
   * La salle est rafraîchie souvent (arrivées, états « prêt ») alors que les
   * portraits ne changent pas : on ne refait donc le sprite que si le
   * personnage a changé. Exception volontaire : un emplacement sans image est
   * retenté à chaque rafraîchissement — c'est ainsi que les portraits
   * apparaissent seuls, une fois les planches chargées.
   */
  private refreshSlotPreview(
    slot: PlayerSlot,
    index: number,
    characterId: string | null,
  ): void {
    if (this.shownCharacters[index] === characterId && (characterId === null || slot.hasPreview)) {
      return;
    }
    slot.setPreview(
      characterId === null ? null : this.getPreview(characterId, SLOT_PREVIEW_HEIGHT),
    );
    this.shownCharacters[index] = characterId;
  }

  /** Place le sélecteur sur la zone d'image de l'emplacement du joueur local
   *  (même zone que les portraits des autres joueurs) et le renseigne. */
  private updatePicker(players: readonly Player[], selfIndex: number): void {
    const self = selfIndex >= 0 ? players[selfIndex] : undefined;
    this.picker.visible = self !== undefined;
    if (!self) return;

    const target = this.slots[selfIndex];
    this.picker.position.set(target.position.x, target.position.y + SLOT_PREVIEW_OFFSET);
    this.picker.setCharacter(getCharacter(self.characterId) ?? null);
    // Comme pour les emplacements, le sprite n'est refait que si le
    // personnage a changé (ou si l'image n'est pas encore chargée).
    if (this.shownPickerCharacter !== self.characterId || !this.picker.hasPreview) {
      this.picker.setPreview(this.getPreview(self.characterId, SLOT_PREVIEW_HEIGHT));
      this.shownPickerCharacter = self.characterId;
    }
  }

  /** Met à jour le compteur de joueurs prêts et le libellé du bouton. */
  private refreshSummary(players: readonly Player[]): void {
    // On ne compte que les joueurs visibles dans les emplacements de l'écran.
    const visible = players.slice(0, this.slots.length);
    this.canStart_ = canStartGame(visible);

    if (visible.length < MIN_PLAYERS) {
      // Seule règle qui prime sur le compteur : on ne lance jamais en solo.
      this.summaryText.text = ALONE_MESSAGE;
      this.summaryText.style = SUMMARY_STYLE;
    } else if (this.canStart_) {
      this.summaryText.text = ALL_READY_MESSAGE;
      this.summaryText.style = SUMMARY_READY_STYLE;
    } else {
      const readyCount = visible.filter((p) => p.ready).length;
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