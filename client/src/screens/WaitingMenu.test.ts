/**
 * Tests de l'écran d'attente.
 *
 * PixiJS est mocké (Container/Graphics/Text/TextStyle minimaux) : on
 * vérifie la réaction de l'écran à la liste des joueurs — emplacements,
 * état « prêt / pas prêt », marqueur du joueur local, compteur, portraits
 * des personnages, sélecteur (position, personnage, aperçu) et
 * déclenchement des boutons.
 */

import { describe, expect, it, vi } from 'vitest';
import { Container, Text } from 'pixi.js';
import { Button } from '../components/Button.js';
import { SLOT_PREVIEW_HEIGHT, SLOT_PREVIEW_OFFSET } from '../components/PlayerSlot.js';
import { WaitingMenu } from './WaitingMenu.js';
import type { Player } from '../lobby/LobbyBus.js';

vi.mock('pixi.js', () => {
  class Container {
    children: unknown[] = [];
    eventMode = 'static';
    cursor = 'pointer';
    position = {
      x: 0,
      y: 0,
      set(x: number, y: number): void {
        this.x = x;
        this.y = y;
      },
    };
    on(): void {}
    addChild(...children: unknown[]): unknown {
      this.children.push(...children);
      return children[0];
    }
    removeChild(...children: unknown[]): Container {
      this.children = this.children.filter((c) => !children.includes(c));
      return this;
    }
  }
  class Graphics extends Container {
    clear(): this {
      return this;
    }
    roundRect(): this {
      return this;
    }
    circle(): this {
      return this;
    }
    fill(): this {
      return this;
    }
    stroke(): this {
      return this;
    }
    moveTo(): this {
      return this;
    }
    lineTo(): this {
      return this;
    }
  }
  class Text {
    anchor = {
      set(x: number, y: number = x): void {
        this.x = x;
        this.y = y;
      },
    };
    position = {
      x: 0,
      y: 0,
      set(x: number, y: number): void {
        this.x = x;
        this.y = y;
      },
    };
    text = '';
    style: unknown = null;
    constructor(opts: { text: string; style: unknown }) {
      this.text = opts.text;
      this.style = opts.style;
    }
  }
  class TextStyle {
    constructor(opts: unknown) {
      Object.assign(this, opts);
    }
  }
  return { Container, Graphics, Text, TextStyle };
});

/** Raccourci : noms affichés dans les quatre emplacements. */
const names = (screen: WaitingMenu): string[] =>
  screen.slots.map((slot) => slot.nameText.text);

/** Raccourci : états affichés sous les quatre emplacements. */
const statuses = (screen: WaitingMenu): string[] =>
  screen.slots.map((slot) => slot.statusText.text);

const alix: Player = { id: 'p1', name: 'Alix', characterId: 'perso-1', ready: false };
const basile: Player = { id: 'p2', name: 'Basile', characterId: 'perso-2', ready: false };
const camille: Player = { id: 'p3', name: 'Camille', characterId: 'perso-3', ready: false };

describe('WaitingMenu', () => {
  it('affiche « EN ATTENTE… » dans les quatre emplacements au départ', () => {
    const screen = new WaitingMenu(() => {}, () => {}, vi.fn(), 'p1');
    expect(names(screen)).toEqual([
      'EN ATTENTE…',
      'EN ATTENTE…',
      'EN ATTENTE…',
      'EN ATTENTE…',
    ]);
    expect(statuses(screen)).toEqual(['', '', '', '']);
  });

  it('remplit les emplacements avec les pseudos et leurs états', () => {
    const screen = new WaitingMenu(() => {}, () => {}, vi.fn(), 'p1');
    screen.setPlayers([alix, basile, camille]);
    expect(names(screen)).toEqual(['Alix · vous', 'Basile', 'Camille', 'EN ATTENTE…']);
    expect(statuses(screen)).toEqual([
      'PAS PRÊT',
      'PAS PRÊT',
      'PAS PRÊT',
      '',
    ]);
  });

  it('marque le joueur local avec « · vous » seulement sur son emplacement', () => {
    const screen = new WaitingMenu(() => {}, () => {}, vi.fn(), 'p2');
    screen.setPlayers([alix, basile]);
    expect(names(screen).slice(0, 2)).toEqual(['Alix', 'Basile · vous']);
  });

  it('affiche PRÊT pour un joueur prêt et met à jour le compteur', () => {
    const screen = new WaitingMenu(() => {}, () => {}, vi.fn(), 'p1');
    screen.setPlayers([{ ...alix, ready: true }, basile]);
    expect(statuses(screen).slice(0, 2)).toEqual(['PRÊT', 'PAS PRÊT']);
    expect((screen.summaryText as Text).text).toBe('1/2 prêts');
  });

  it('affiche « Tous les joueurs sont prêts ! » quand toute la salle est prête', () => {
    const screen = new WaitingMenu(() => {}, () => {}, vi.fn(), 'p1');
    screen.setPlayers([
      { ...alix, ready: true },
      { ...basile, ready: true },
    ]);
    expect((screen.summaryText as Text).text).toBe('Tous les joueurs sont prêts !');
  });

  it('adapte le libellé du bouton prêt selon le joueur local', () => {
    const screen = new WaitingMenu(() => {}, () => {}, vi.fn(), 'p1');
    screen.setPlayers([alix]);
    expect(screen.readyButton.getLabel()).toBe('PRÊT');
    screen.setPlayers([{ ...alix, ready: true }]);
    expect(screen.readyButton.getLabel()).toBe('PAS PRÊT');
  });

  it('refuse d’annoncer le lancement quand le joueur local est seul', () => {
    const screen = new WaitingMenu(() => {}, () => {}, vi.fn(), 'p1');
    screen.setPlayers([{ ...alix, ready: true }]);
    expect((screen.summaryText as Text).text).toBe('Il faut au moins 2 joueurs pour commencer');
    expect(screen.canStart).toBe(false);
  });

  it('annonce le lancement dès deux joueurs prêts', () => {
    const screen = new WaitingMenu(() => {}, () => {}, vi.fn(), 'p1');
    screen.setPlayers([
      { ...alix, ready: true },
      { ...basile, ready: true },
    ]);
    expect((screen.summaryText as Text).text).toBe('Tous les joueurs sont prêts !');
    expect(screen.canStart).toBe(true);
  });

  it('attend les joueurs non prêts tout en gardant le compteur', () => {
    const screen = new WaitingMenu(() => {}, () => {}, vi.fn(), 'p1');
    screen.setPlayers([
      { ...alix, ready: true },
      { ...basile, ready: true },
      { ...camille, ready: false },
    ]);
    expect((screen.summaryText as Text).text).toBe('2/3 prêts');
    expect(screen.canStart).toBe(false);
  });

  it('ne redemande pas l’image d’un persos dont le personnage n’a pas changé', () => {
    const asked: string[] = [];
    const screen = new WaitingMenu(() => {}, () => {}, vi.fn(), 'p1', (id) => {
      asked.push(id);
      return new Container();
    });
    screen.setPlayers([alix, basile]);
    const firstPass = asked.length;

    // Un simple changement d'état « prêt » ne doit rien reconstruire.
    screen.setPlayers([
      { ...alix, ready: true },
      { ...basile, ready: true },
    ]);
    expect(asked).toHaveLength(firstPass);

    // Changer de personnage, si, redemande l'image correspondante.
    screen.setPlayers([
      { ...alix, ready: true, characterId: 'perso-3' },
      { ...basile, ready: true },
    ]);
    expect(asked).toHaveLength(firstPass + 1);
    expect(asked.at(-1)).toBe('perso-3');
  });

  it('retent l’image manquante une fois la planche chargée', () => {
    let ready = false;
    const asked: string[] = [];
    const screen = new WaitingMenu(() => {}, () => {}, vi.fn(), 'zzz', (id) => {
      asked.push(id);
      return ready ? new Container() : null;
    });
    screen.setPlayers([alix]);
    expect(asked).toHaveLength(1);

    // Planches chargées, mais la liste n'a pas changé : l'emplacement vide
    // doit tout de même recevoir son portrait.
    ready = true;
    screen.setPlayers([alix]);
    expect(asked).toHaveLength(2);
    expect(screen.slots[0].previewHolder.children).toHaveLength(1);
  });

  it('déclenche onToggleReady quand le bouton prêt est activé', () => {
    const onToggle = vi.fn();
    const screen = new WaitingMenu(() => {}, onToggle, vi.fn(), 'p1');
    screen.readyButton.activate();
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('déclenche onBack quand le bouton RETOUR est activé', () => {
    const onBack = vi.fn();
    const screen = new WaitingMenu(onBack, () => {}, vi.fn(), 'p1');
    const back = screen.children.find(
      (child): child is Button => child instanceof Button && child !== screen.readyButton,
    );
    expect(back).toBeDefined();
    back!.activate();
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('masque le sélecteur en U tant que le joueur local n’est pas en salle', () => {
    const screen = new WaitingMenu(() => {}, () => {}, vi.fn(), 'p1');
    screen.setPlayers([]);
    expect(screen.picker.visible).toBe(false);
    screen.setPlayers([basile]); // joueur local absent
    expect(screen.picker.visible).toBe(false);
  });

  it('centre le sélecteur sur la zone d’image de l’emplacement local', () => {
    const screen = new WaitingMenu(() => {}, () => {}, vi.fn(), 'p2');
    screen.setPlayers([alix, basile]);
    expect(screen.picker.visible).toBe(true);

    const slot = screen.slots[1];
    expect(screen.picker.position.x).toBe(slot.position.x);
    expect(screen.picker.position.y).toBe(slot.position.y + SLOT_PREVIEW_OFFSET);
  });

  it('centre le pseudo dans les emplacements (aucun décalage)', () => {
    const screen = new WaitingMenu(() => {}, () => {}, vi.fn(), 'p2');
    screen.setPlayers([alix, basile]);
    expect(screen.slots[0].nameText.position.x).toBe(0);
    expect(screen.slots[1].nameText.position.x).toBe(0);
  });

  it('affiche le personnage du joueur local dans le sélecteur', () => {
    const screen = new WaitingMenu(() => {}, () => {}, vi.fn(), 'p2');
    screen.setPlayers([alix, basile]);
    expect(screen.picker.character?.id).toBe('perso-2');
  });

  it('affiche l’image du personnage de chaque joueur dans son emplacement', () => {
    const screen = new WaitingMenu(() => {}, () => {}, vi.fn(), 'zzz', () => new Container());
    screen.setPlayers([alix, basile, camille]);
    expect(screen.slots[0].previewHolder.children).toHaveLength(1);
    expect(screen.slots[1].previewHolder.children).toHaveLength(1);
    expect(screen.slots[2].previewHolder.children).toHaveLength(1);
    // L’emplacement restant est vide : pas d’image.
    expect(screen.slots[3].previewHolder.children).toHaveLength(0);
  });

  it('demande l’image de chaque joueur à la hauteur de l’emplacement', () => {
    const heights: (number | undefined)[] = [];
    const screen = new WaitingMenu(
      () => {},
      () => {},
      vi.fn(),
      'zzz',
      (_id, height) => {
        heights.push(height);
        return new Container();
      },
    );
    screen.setPlayers([alix, basile]);
    expect(heights.filter((h) => h !== undefined)).toEqual([
      SLOT_PREVIEW_HEIGHT,
      SLOT_PREVIEW_HEIGHT,
    ]);
  });

  it('retire l’image d’un emplacement dont le joueur est parti', () => {
    const screen = new WaitingMenu(() => {}, () => {}, vi.fn(), 'zzz', () => new Container());
    screen.setPlayers([alix, basile]);
    screen.setPlayers([alix]);
    expect(screen.slots[0].previewHolder.children).toHaveLength(1);
    expect(screen.slots[1].previewHolder.children).toHaveLength(0);
  });

  it('affiche le perso du joueur local dans le sélecteur, pas en double', () => {
    // L'emplacement du joueur local est remplacé par le sélecteur cliquable :
    // son portrait ne doit pas être dessiné deux fois.
    const screen = new WaitingMenu(() => {}, () => {}, vi.fn(), 'p1', () => new Container());
    screen.setPlayers([alix, basile]);
    expect(screen.picker.children.at(-1)).toBeDefined();
    expect(screen.slots[0].previewHolder.children).toHaveLength(0);
    // L'autre joueur, lui, garde son portrait dans son emplacement.
    expect(screen.slots[1].previewHolder.children).toHaveLength(1);
  });

  it('déclenche onCycleCharacter quand le sélecteur est activé', () => {
    const onCycle = vi.fn();
    const screen = new WaitingMenu(() => {}, () => {}, onCycle, 'p1');
    screen.setPlayers([alix]);
    screen.picker.activate();
    expect(onCycle).toHaveBeenCalledTimes(1);
  });
});