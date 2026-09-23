const Player = require('./Player');
const Map = require('./Map');

describe('Mécaniques de la Phase 2', () => {
    test('Le joueur se déplace correctement', () => {
        const player = new Player(1, 1);
        player.move('right');
        expect(player.x).toBe(2);
        expect(player.y).toBe(1);
    });

    test('Le joueur ne doit pas pouvoir marcher sur un mur (Collision)', () => {
        const map = new Map();
        // Coordonnée (0, 1) est un mur dans notre map (grid[1][0] === 1)
        expect(map.isWalkable(0, 1)).toBe(false);
    });

    test('Le joueur doit pouvoir marcher sur une case vide', () => {
        const map = new Map();
        // Coordonnée (1, 1) est vide (grid[1][1] === 0)
        expect(map.isWalkable(1, 1)).toBe(true);
    });
});