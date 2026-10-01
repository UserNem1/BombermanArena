const Player = require('./Player');
const Map = require('./Map');
const Bomb = require('./Bomb');


const gameMap = new Map();
const map = new Map();

var playersCount = 0;
var players = [];
let gameState = 'LOBBY';


function sendMessage(type, data) {
    ws.send(JSON.stringify({
        type: type,
        data: data
    }));
}

function broadcast(type, data) {
    const data = JSON.stringify(data);
    broadcast({ type: type, data: data });
}


function manageMessage(type, data) {
    data = JSON.parse(data);
    if (type === 'JOIN_LOBBY') {    // GESTION DU LOBBY
        // Vérifier si le joueur peut rejoindre le lobby
        if (gameState !== 'LOBBY') return ws.send(JSON.stringify({ type: 'ERROR', message: 'Partie en cours' }));
        if (playersCount >= 4) return ws.send(JSON.stringify({ type: 'ERROR', message: 'Lobby plein' }));

        // Ajouter le joueur au lobby
        playersCount++;
        players.push({ id: playerId, ws: ws, player: new Player(playerId) });
        sendMessage('JOINED_LOBBY', { id: playerId });
        broadcast('LOBBY_UPDATE', { playerCount: playersCount });
    } else if (type === 'LEAVE_LOBBY') {
        // Retirer le joueur du lobby
        playersCount--;
        players = players.filter(player => player.id !== playerId);
        broadcast('LOBBY_UPDATE', { playerCount: playersCount });
    } else if (type === 'START_GAME') {
        // Vérifier si le joueur peut démarrer la partie
        if (gameState !== 'LOBBY') return ws.send(JSON.stringify({ type: 'ERROR', message: 'Partie en cours' }));
        if (playersCount < 2) return ws.send(JSON.stringify({ type: 'ERROR', message: 'Pas assez de joueurs' }));

        // Lancer la partie
        gameState = 'IN_GAME';
        broadcast('IN_GAME');
    } else if (type === 'IN_GAME') {   // GESTION DU JEU EN COURS
        if (gameState === 'IN_GAME') {
            const user = players.find(player => player.id === playerId);
            if (!user) return;
        }
    } else if (data.type === 'MOVE') {
        // DÉPLACEMENT
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
            broadcast('POSITION_UPDATED', { id: playerId, x: user.player.x, y: user.player.y });
        } else {
            console.log(`Collision évitée pour ${user.player.name}`);
        }
    } else if (data.type === 'PLACE_BOMB') {
        // POSE DE BOMBE
        const bomb = new Bomb(user.player, playerId, user.player.x, user.player.y, 3, 2);
        broadcast('BOMB_PLACED', { id: playerId, x: bomb.x, y: bomb.y });
    }
}
