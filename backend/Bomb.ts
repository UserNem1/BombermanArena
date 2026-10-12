import type { Player } from "./Player";

export class Bomb {
  constructor(
    public readonly owner: Player,
    public readonly x: number,
    public readonly y: number,
    public readonly timer: number,
    public readonly explosionRadius: number,
  ) {
    setTimeout(() => this.explode(), timer * 1000);
  }

  explode(): void {
    console.log(
      `Bomb exploded at (${this.x}, ${this.y}) with radius ${this.explosionRadius}`,
    );
  }
}
