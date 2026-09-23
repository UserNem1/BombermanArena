import { checkWallCollision } from './core/grid';
import { Application, Assets, Sprite, Container } from 'pixi.js';
import { InputManager } from './core/InputManager';
import { NetworkManager } from './core/NetworkManager';
import { gridToPixel, drawBoard, GRID_WIDTH, GRID_HEIGHT, TILE_SIZE } from './core/grid';
import { HUD } from './ui/HUD';


async function main() {
  const gameWidth = GRID_WIDTH * TILE_SIZE;
  const gameHeight = GRID_HEIGHT * TILE_SIZE + 50; // +50 pour le HUD

  const app = new Application();
  await app.init({
    resizeTo: window, // le canvas suit automatiquement la taille de la fenêtre
    background: '#363b3c',
  });
  document.body.appendChild(app.canvas);

  // --- Container qui regroupe tout le contenu du jeu ---
  const gameContainer = new Container();
  app.stage.addChild(gameContainer);

  const network = new NetworkManager('ws://localhost:8080');

  const hud = new HUD(gameWidth);
  gameContainer.addChild(hud);

  const board = drawBoard();
  board.y = 50;
  gameContainer.addChild(board);

  const playerTexture = await Assets.load('assets/player.png');
  const player = new Sprite(playerTexture);
  player.width = TILE_SIZE;
  player.height = TILE_SIZE;

  const startPos = gridToPixel(1, 1);
  player.x = startPos.x;
  player.y = startPos.y + 50;

  gameContainer.addChild(player);

  // --- Fonction qui recalcule l'échelle et centre le jeu ---
  function resizeGame() {
    const scale = Math.min(
      window.innerWidth / gameWidth,
      window.innerHeight / gameHeight
    );

    gameContainer.scale.set(scale);
    gameContainer.x = (window.innerWidth - gameWidth * scale) / 2;
    gameContainer.y = (window.innerHeight - gameHeight * scale) / 2;
  }

  resizeGame(); // au démarrage
  window.addEventListener('resize', resizeGame); // à chaque redimensionnement

  // --- Envoyer des infos au serveur ---
  const input = new InputManager();
  let lastX = 0, lastY = 0;

  app.ticker.add(() => {
  let moved = false;
  const speed = 1;

  // On teste chaque axe séparément
  let newX = player.x;
  let newY = player.y;

  if (input.isPressed('ArrowUp')) newY -= speed;
  if (input.isPressed('ArrowDown')) newY += speed;
  if (input.isPressed('ArrowLeft')) newX -= speed;
  if (input.isPressed('ArrowRight')) newX += speed;

  // Déplacement horizontal, seulement si pas de collision
  if (newX !== player.x && !checkWallCollision(newX, player.y - 50, TILE_SIZE)) {
    player.x = newX;
    moved = true;
  }

  // Déplacement vertical, seulement si pas de collision
  if (newY !== player.y && !checkWallCollision(player.x, newY - 50, TILE_SIZE)) {
    player.y = newY;
    moved = true;
  }

  if (moved && (player.x !== lastX || player.y !== lastY)) {
    network.send('player:move', { x: player.x, y: player.y });
    lastX = player.x;
    lastY = player.y;
  }

  hud.updateTime(Math.floor(app.ticker.lastTime / 1000));
});

  network.on('player:moved', (data) => {
    console.log('Un autre joueur a bougé', data);
  });

  network.on('bomb:placed', (data) => {
    console.log('Bombe posée', data);
  });

  network.on('player:joined', (data) => {
    console.log('Nouveau joueur', data);
  });




  setTimeout(() => hud.updateKills(1), 3000);
}

main();