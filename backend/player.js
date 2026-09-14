class Player {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    debug() {
        console.log(`Position du joueur: (${this.x}, ${this.y})`);
    }

    move(direction) {
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
                console.log('Direction invalide');
        }
    }
}

module.exports = Player;