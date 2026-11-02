export class Tile {
  constructor(
    public readonly id: string,
    public readonly walkable: boolean,
    public readonly breakable: boolean,
  ) {}
}
