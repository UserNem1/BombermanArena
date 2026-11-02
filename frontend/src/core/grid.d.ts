import { Container } from 'pixi.js';
export declare const TILE_SIZE = 32;
export declare const GRID_WIDTH = 15;
export declare const GRID_HEIGHT = 13;
export declare var nbMursCassables: number;
export declare function gridToPixel(gridX: number, gridY: number): {
    x: number;
    y: number;
};
export declare function isWallTile(x: number, y: number): boolean;
export declare function drawBoard(): Container;
export declare function checkWallCollision(px: number, py: number, size: number): boolean;
//# sourceMappingURL=grid.d.ts.map