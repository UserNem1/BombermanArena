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


    
    // Méthode à ajouter dans la classe Map
    calculateExplosion(startX, startY, radius) {
        const affectedTiles = [];
        // La case centrale (là où est la bombe) est toujours touchée
        affectedTiles.push({ x: startX, y: startY });

        // Les 4 directions de propagation : Haut, Bas, Gauche, Droite
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

                // Sécurité : vérifier que l'explosion ne sort pas des limites de la carte
                if (targetY < 0 || targetY >= this.grid.length || targetX < 0 || targetX >= this.grid[0].length) {
                    break; 
                }

                const cell = this.grid[targetY][targetX];

                if (cell === 1) {
                    // Mur indestructible (1) : le feu s'arrête net, on casse la boucle
                    break;
                } else if (cell === 2) {
                    // Mur destructible (2) : il est détruit (devient 0) et le feu s'arrête
                    this.grid[targetY][targetX] = 0;
                    affectedTiles.push({ x: targetX, y: targetY });
                    break;
                } else {
                    // Case vide (0) : le feu passe à travers, on continue la boucle
                    affectedTiles.push({ x: targetX, y: targetY });
                }
            }
        });

        // On retourne la liste des coordonnées brûlées pour pouvoir tuer les joueurs plus tard
        return affectedTiles;
    }
}

module.exports = Map;