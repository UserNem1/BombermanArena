import { Tile } from "./Tile";

export class TileSet {
  tiles: Tile[] = [
    new Tile("floor", true, false),
    new Tile("wall", false, false),
    new Tile("rock", false, true),
  ];

  get_tile(id: string): Tile {
    const tile = this.tiles.find((tile: Tile) => tile.id === id);
    if (tile === undefined) {
      throw new Error(`Tile not found: ${id}`);
    }
    return tile;
  }
}
