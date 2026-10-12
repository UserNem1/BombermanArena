const Player = require('./Player');
const Map = require('./Map');
const Bomb = require('./Bomb');

const gameMap = new Map();
let players = [];
let gameState = 'LOBBY';

// La fonction broadcast envoie bien le message à tous les websockets actifs
function broadcast(type, data) {
    const payload = JSON.stringify({ type: type, data: data });
    players.forEach(user => {
        if (user.ws.readyState === 1) { // 1 = WebSocket.OPEN
            user.ws.send(payload);
        }
    });
}

function sendMessage(ws, type, data) {
    ws.send(JSON.stringify({ type: type, data: data }));
}

//  On ajoute ws et playerId en paramètres pour savoir qui parle
function manageMessage(ws, playerId, type, data) {
    if (type === 'JOIN_LOBBY') {
        if (gameState !== 'LOBBY') return sendMessage(ws, 'ERROR', { message: 'Partie en cours' });
        if (players.length >= 4) return sendMessage(ws, 'ERROR', { message: 'Lobby plein' });

        // On crée le joueur 
        players.push({ id: playerId, ws: ws, player: new Player(1, 1, data.playerName || "Joueur") });
        sendMessage(ws, 'JOINED_LOBBY', { id: playerId });
        broadcast('LOBBY_UPDATE', { playerCount: players.length });

    } else if (type === 'START_GAME') {
        if (gameState !== 'LOBBY') return sendMessage(ws, 'ERROR', { message: 'Partie en cours' });
        if (players.length < 2) return sendMessage(ws, 'ERROR', { message: 'Pas assez de joueurs' });

        gameState = 'IN_GAME';
        broadcast('GAME_START', {});

    } else if (gameState === 'IN_GAME') {
        const user = players.find(player => player.id === playerId);
        // On bloque l'action si le joueur n'existe pas ou s'il est mort
        if (!user || !user.player.isAlive) return;

        if (type === 'MOVE') {
            // On calcule la case d'arrivée selon la direction
            let targetX = user.player.x;
            let targetY = user.player.y;

            switch (data.direction) {
                case 'up': targetY -= 1; break;
                case 'down': targetY += 1; break;
                case 'left': targetX -= 1; break;
                case 'right': targetX += 1; break;
            }

            // On vérifie si la case est vide (0) avant d'autoriser le mouvement
            if (gameMap.isWalkable(targetX, targetY)) {
                user.player.move(data.direction);
                broadcast('POSITION_UPDATED', { id: playerId, x: user.player.x, y: user.player.y });
            }

        } else if (type === 'PLACE_BOMB') {
            const bombX = user.player.x;
            const bombY = user.player.y;
            const radius = 2; // Portée de 2 cases

            // présence de la bombe sur la grille (valeur 3)
            if (gameMap.grid && gameMap.grid[bombY]) {
                gameMap.grid[bombY][bombX] = 3;
            }

            broadcast('BOMB_PLACED', { id: playerId, x: bombX, y: bombY });

            // minuteur et explosion
            setTimeout(() => {
                // 1. Calcul de ta croix de feu
                const burnedTiles = gameMap.calculateExplosion(bombX, bombY, radius);
                broadcast('BOMB_EXPLODED', { x: bombX, y: bombY, burnedTiles: burnedTiles });

                // 2. Élimination des joueurs touchés
                players.forEach(p => {
                    if (p.player.isAlive) {
                        const isHit = burnedTiles.some(t => t.x === p.player.x && t.y === p.player.y);
                        if (isHit) {
                            p.player.die();
                            broadcast('PLAYER_DEAD', { id: p.id });
                        }
                    }
                });

                // 3. Vérification du Game Over
                const survivors = players.filter(p => p.player.isAlive);
                if (survivors.length <= 1) {
                    gameState = 'LOBBY';
                    broadcast('GAME_OVER', { winner: survivors.length === 1 ? survivors[0].id : null });
                    // On ressuscite tout le monde pour la prochaine partie
                    players.forEach(p => p.player.isAlive = true);
                }
            }, 3000);
        }
    }
}

// Fonction utilitaire pour gérer les déconnexions
function removePlayer(playerId) {
    players = players.filter(p => p.id !== playerId);
    if (players.length < 2) gameState = 'LOBBY';
    broadcast('LOBBY_UPDATE', { playerCount: players.length });
}

module.exports = { manageMessage, removePlayer };