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

describe('Mécaniques de la Phase 3 : Explosions', () => {
    const Map = require('./Map');
    let gameMap;

    beforeEach(() => {
        gameMap = new Map();
        // On force une grille miniature pour le test
        // 0 = vide, 1 = mur béton, 2 = mur destructible
        gameMap.grid = [
            [1, 1, 1, 1, 1],
            [1, 0, 2, 0, 1], // Un mur destructible en haut (x:2, y:1)
            [1, 2, 0, 1, 1], // Le centre est en (x:2, y:2). Mur béton à droite (x:3, y:2)
            [1, 0, 2, 0, 1],
            [1, 1, 1, 1, 1]
        ];
    });

    test('L\'explosion s\'arrête sur le béton et détruit les caisses', () => {
        // On simule une bombe au centre (2,2) avec un rayon de 1 case
        const burnedTiles = gameMap.calculateExplosion(2, 2, 1);

        // 1. Le mur destructible (2,1) doit être transformé en vide (0)
        expect(gameMap.grid[1][2]).toBe(0);

        // 2. Le mur en béton (3,2) doit rester intact (1)
        expect(gameMap.grid[2][3]).toBe(1);

        // 3. Les flammes doivent avoir touché la case de la caisse détruite
        expect(burnedTiles).toContainEqual({ x: 2, y: 1 });
    });
});