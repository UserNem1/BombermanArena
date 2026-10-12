class Player {
    constructor(x = 1, y = 1, name = 'Player 1', health = 5) {
        this.x = x;
        this.y = y;
        this.name = name;
        this.health = health;
        this.isAlive = true; 
    }

    debug() {
        console.log(`Position du joueur: (${this.x}, ${this.y})`);
        console.log(`Nom: ${this.name}, Santé: ${this.health}, Vivant: ${this.isAlive}`);
    }

    move(direction) {
        if (!this.isAlive) return;

        switch (direction) {
            case 'up':
                this.y -= 1;
                break;
            case 'down':
                this.y += 1;
                break;
            case 'left':
                this.x -= 1;
                break;
            case 'right':
                this.x += 1;
                break;
            default:
                throw new Error('Direction invalide');
        }
    }

    die() {
        this.isAlive = false;
        this.health = 0; 
    }
}

module.exports = Player;