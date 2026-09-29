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
    
    calculateExplosion(startX, startY, radius) {
            const affectedTiles = [];
            affectedTiles.push({ x: startX, y: startY });

            // Si la case de départ contenait une bombe (3), on la transforme en case vide (0)
            if (this.grid[startY][startX] === 3) {
                this.grid[startY][startX] = 0;
            }

            const directions = [
                { dx: 0, dy: -1 }, // Haut
                { dx: 0, dy: 1 },  // Bas
                { dx: -1, dy: 0 }, // Gauche
                { dx: 1, dy: 0 }   // Droite
            ];

            directions.forEach(dir => {
                for (let i = 1; i <= radius; i++) {
                    const targetX = startX + (dir.dx * i);
                    const targetY = startY + (dir.dy * i);

                    if (targetY < 0 || targetY >= this.grid.length || targetX < 0 || targetX >= this.grid[0].length) {
                        break;
                    }

                    const cell = this.grid[targetY][targetX];

                    if (cell === 1) {
                        // Mur indestructible : arrêt du feu
                        break; 
                    } else if (cell === 2) {
                        // Mur destructible : détruit + arrêt du feu
                        this.grid[targetY][targetX] = 0;
                        affectedTiles.push({ x: targetX, y: targetY });
                        break;
                    } else if (cell === 3) {
                        // Une autre bombe est touchée !
                        // 1. On nettoie la case pour éviter une boucle infinie
                        this.grid[targetY][targetX] = 0;
                        affectedTiles.push({ x: targetX, y: targetY });

                        // 2. Réaction en chaîne : cette bombe explose immédiatement à son tour
                        const chainTiles = this.calculateExplosion(targetX, targetY, radius);
                        
                        // 3. On fusionne les cases brûlées par la seconde bombe
                        chainTiles.forEach(tile => {
                            if (!affectedTiles.some(t => t.x === tile.x && t.y === tile.y)) {
                                affectedTiles.push(tile);
                            }
                        });

                        // Le feu continue sa course après avoir fait sauter la bombe
                    } else {
                        // Case vide (0)
                        affectedTiles.push({ x: targetX, y: targetY });
                    }
                }
            });

            return affectedTiles;
        }
}

module.exports = Map;