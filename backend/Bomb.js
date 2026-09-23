class Bomb {
    constructor(x, y, timer, owner, explosionRadius) {
        this.x = x;
        this.y = y;
        this.timer = timer; // secondes
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
    }
}

module.exports = Bomb;