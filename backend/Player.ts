import { randomUUID } from "node:crypto";

export type Direction = "up" | "down" | "left" | "right";

export class Player {
  constructor(
    public readonly id: string = randomUUID(),
    public x = 1,
    public y = 1,
    public name = "Player 1",
    public health = 5,
  ) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.name = name;
    this.health = health;
  }

  debug(): void {
    console.log(`Position du joueur: (${this.x}, ${this.y})`);
    console.log(`Nom: ${this.name}, Santé: ${this.health}`);
  }

  move(direction: Direction): void {
    switch (direction) {
      case "up":
        this.y -= 1;
        break;
      case "down":
        this.y += 1;
        break;
      case "left":
        this.x -= 1;
        break;
      case "right":
        this.x += 1;
        break;
    }
  }
}
