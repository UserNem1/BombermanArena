class Bomb {
    constructor(owner, x, y, timer, explosionRadius) {
        this.x = x;
        this.y = y;
        this.timer = timer; // secondes
        this.owner = owner;
        this.explosionRadius = explosionRadius;
        // Minuteur simple d'explosion (3 secondes)
        setTimeout(() => {
            this.explode();
        }, timer * 1000);
    }

    explode() {
        console.log(`Bomb exploded at (${this.x}, ${this.y}) with radius ${this.explosionRadius}`);
    }
}

module.exports = Bomb;