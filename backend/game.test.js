const { Player } = require('./dist/Player');
const { Tile } = require('./dist/Tile');
const { TileMap } = require('./dist/TileMap');

function createMap() {
    return new TileMap([
        [new Tile(false), new Tile(false), new Tile(false)],
        [new Tile(false), new Tile(true), new Tile(false)],
        [new Tile(false), new Tile(false), new Tile(false)],
    ]);
}

describe('Mécaniques de la Phase 2', () => {
    test('Le joueur se déplace correctement', () => {
        const player = new Player('p1', 1, 1);
        player.move('right');
        expect(player.x).toBe(2);
        expect(player.y).toBe(1);
    });

    test('Le joueur ne doit pas pouvoir marcher sur un mur (Collision)', () => {
        const map = createMap();
        expect(map.isWalkable(0, 1)).toBe(false);
    });

    test('Le joueur doit pouvoir marcher sur une case vide', () => {
        const map = createMap();
        expect(map.isWalkable(1, 1)).toBe(true);
    });
});