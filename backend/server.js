const WebSocket = require('ws');
const http = require('http');
const Player = require('./Player');
const Map = require('./Map');
const Bomb = require('./Bomb');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

const gameMap = new Map();
const players = new Map(); 
let gameState = 'LOBBY'; 

// Fonction pour envoyer un message à tous les clients
function broadcast(data) {
  const payload = JSON.stringify(data);
  players.forEach((user) => {
    if (user.ws.readyState === WebSocket.OPEN) {
      user.ws.send(payload);
    }
  });
}

wss.on('connection', (ws) => {
  const playerId = Date.now().toString();
  console.log(`Client connecté! ID: ${playerId}`);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      // GESTION DU LOBBY
      if (data.type === 'JOIN_LOBBY') {
        if (gameState !== 'LOBBY') return ws.send(JSON.stringify({ type: 'ERROR', message: 'Partie en cours' }));
        if (players.size >= 4) return ws.send(JSON.stringify({ type: 'ERROR', message: 'Lobby plein' }));
        
        players.set(playerId, { ws, player: new Player(1, 1, data.playerName) });
        broadcast({ type: 'LOBBY_UPDATE', playerCount: players.size });

        if (players.size >= 2) {
            gameState = 'IN_GAME';
            broadcast({ type: 'GAME_START' });
        }
      }

      // GESTION DU JEU EN COURS
      if (gameState === 'IN_GAME') {
          const user = players.get(playerId);
          if (!user) return;

          // DÉPLACEMENT
          if (data.type === 'MOVE') {
              let targetX = user.player.x;
              let targetY = user.player.y;

              switch (data.direction) {
                  case 'up': targetY -= 1; break;
                  case 'down': targetY += 1; break;
                  case 'left': targetX -= 1; break;
                  case 'right': targetX += 1; break;
              }

              // Vérification des collisions avec les murs
              if (gameMap.isWalkable(targetX, targetY)) {
                  user.player.move(data.direction);
                  broadcast({ type: 'POSITION_UPDATED', id: playerId, x: user.player.x, y: user.player.y });
              } else {
                  console.log(`Collision évitée pour ${user.player.name}`);
              }
          }

          // POSE DE BOMBE
          if (data.type === 'PLACE_BOMB') {
              const bomb = new Bomb(user.player.x, user.player.y, 3, playerId, 2);
              broadcast({ type: 'BOMB_PLACED', id: playerId, x: bomb.x, y: bomb.y });
              
              // Minuteur simple d'explosion (3 secondes)
              setTimeout(() => {
                  bomb.explode();
                  broadcast({ type: 'BOMB_EXPLODED', x: bomb.x, y: bomb.y });
              }, 3000);
          }
      }
    } catch (error) {
      console.error('Message invalide ou format JSON incorrect');
    }
  });

  ws.on('close', () => {
    console.log(`Client déconnecté ID: ${playerId}`);
    players.delete(playerId);
    if (players.size < 2) gameState = 'LOBBY';
  });
});

function startServer() {
  server.listen(8080, () => {
    console.log('Serveur Démarré sur le port 8080');
  });
}

function stopServer() {
  server.close(() => {
    console.log('Serveur Arrêté');
  });
}

module.exports = { startServer, stopServer, wss };

// Lancer le serveur seulement si le fichier est exécuté directement (pas lors des tests)
if (require.main === module) {
  startServer();
}