class Map {
    constructor() {
        // 0 = Vide, 1 = Mur indestructible, 2 = Mur destructible
        this.grid = [
            [1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 2, 0, 0, 1],
            [1, 0, 1, 0, 1, 0, 1],
            [1, 2, 0, 2, 0, 2, 1],
            [1, 0, 1, 0, 1, 0, 1],
            [1, 0, 0, 2, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1]
        ];
        this.width = this.grid[0].length;
        this.height = this.grid.length;
    }

    isWalkable(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return false;
        }
        return this.grid[y][x] === 0;
    }
}

module.exports = Map;