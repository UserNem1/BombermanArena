/**
 * Test d'intégrité du catalogue de personnages.
 *
 * Garantit les règles que le code suppose : des identifiants uniques,
 * une couleur unique par personnage (deux joueurs ne peuvent pas avoir
 * le même perso), et une grille de planche cohérente. Comme le catalogue
 * est destiné à s'agrandir, ce garde-fou protège le roster entier.
 */

import { describe, expect, it } from 'vitest';
import { CHARACTERS, getCharacter } from './characters.js';

describe('catalogue des personnages', () => {
  it('contient des identifiants uniques', () => {
    const ids = CHARACTERS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('contient des couleurs uniques (unicité d\'un perso par partie)', () => {
    const colors = CHARACTERS.map((c) => c.color);
    expect(new Set(colors).size).toBe(colors.length);
    expect(CHARACTERS.length).toBeGreaterThanOrEqual(2);
  });

  it('chaque perso a un label et une planche d’animations valides', () => {
    for (const c of CHARACTERS) {
      expect(c.label.length).toBeGreaterThan(0);
      expect(c.sprites).toMatch(/^assets\/.+\.(png|jpe?g)$/i);
    }
  });

  it('getCharacter renvoie le bon perso ou undefined', () => {
    expect(getCharacter(CHARACTERS[0].id)).toBe(CHARACTERS[0]);
    expect(getCharacter('inconnu')).toBeUndefined();
  });
});