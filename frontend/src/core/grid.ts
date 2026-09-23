import { Container, Graphics } from 'pixi.js';

export const TILE_SIZE = 32;
export const GRID_WIDTH = 15;
export const GRID_HEIGHT = 13;

export function gridToPixel(gridX: number, gridY: number) {
  return { x: gridX * TILE_SIZE, y: gridY * TILE_SIZE };
}

// Détermine si une case donnée est un mur (logique, réutilisée pour dessin ET collisions)
export function isWallTile(x: number, y: number): boolean {
  const isBorder = x === 0 || y === 0 || x === GRID_WIDTH - 1 || y === GRID_HEIGHT - 1;
  const isInnerWall = x % 2 === 0 && y % 2 === 0;
  return isBorder || isInnerWall;
}

export function drawBoard(): Container {
  const board = new Container();

  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      const pos = gridToPixel(x, y);

      if (isWallTile(x, y)) {
        const murIncassable = new Graphics()
          .rect(0, 0, TILE_SIZE, TILE_SIZE)
          .fill(0x696969);
        murIncassable.x = pos.x;
        murIncassable.y = pos.y;
        board.addChild(murIncassable);
      } else {
        const sol = new Graphics()
          .rect(0, 0, TILE_SIZE, TILE_SIZE)
          .fill(0x8fd694);
        sol.x = pos.x;
        sol.y = pos.y;
        board.addChild(sol);
      }
    }
  }

  return board;
}

// Vérifie si un rectangle (le joueur) entre en collision avec un mur
export function checkWallCollision(px: number, py: number, size: number): boolean {
  // On teste les 4 coins du joueur, convertis en coordonnées de grille
  const corners = [
    { x: px, y: py },                     // haut-gauche
    { x: px + size - 1, y: py },          // haut-droite
    { x: px, y: py + size - 1 },          // bas-gauche
    { x: px + size - 1, y: py + size - 1 }, // bas-droite
  ];

  for (const corner of corners) {
    const gridX = Math.floor(corner.x / TILE_SIZE);
    const gridY = Math.floor(corner.y / TILE_SIZE);

    if (isWallTile(gridX, gridY)) {
      return true; // collision détectée
    }
  }

  return false;
}