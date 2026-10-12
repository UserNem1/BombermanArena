import { Tile } from "./Tile";

export class TileMap {
  constructor(public readonly tiles: Tile[][] = []) {}

  getTile(x: number, y: number): Tile | null {
    return this.tiles[y]?.[x] ?? null;
  }

  setTile(x: number, y: number, tile: Tile): void {
    const row = this.tiles[y];
    if (row && x >= 0 && x < row.length) {
      row[x] = tile;
    }
  }

  isWalkable(x: number, y: number): boolean {
    return this.getTile(x, y)?.walkable ?? false;
  }
}
