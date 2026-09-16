class Bomb {
    constructor(x, y, timer, owner, explosionRadius) {
        this.x = x;
        this.y = y;
        this.timer = timer; // in seconds
        this.owner = owner;
        this.explosionRadius = explosionRadius;
    }

    tick() {
        this.timer -= 1;
        if (this.timer <= 0) {
            this.explode();
        }
    }

    explode() {
        console.log(`Bomb exploded at (${this.x}, ${this.y}) with radius ${this.explosionRadius}`);
        // explosion handling
    }
}

module.exports = Bomb;