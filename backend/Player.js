class Player {
    constructor(x, y, name) {
        this.x = x;
        this.y = y;
        this.name = name;
        this.isAlive = true; // Le joueur est vivant en début de partie
    }

    move(direction) {
        // Un joueur mort ne peut plus se déplacer
        if (!this.isAlive) return;

        switch (direction) {
            case 'up': this.y -= 1; break;
            case 'down': this.y += 1; break;
            case 'left': this.x -= 1; break;
            case 'right': this.x += 1; break;
        }
    }

    die() {
        this.isAlive = false;
    }
}

module.exports = Player;