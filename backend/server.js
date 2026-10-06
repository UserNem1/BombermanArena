const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

const gameManager = require('./gameManager');

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
            const message = JSON.parse(message);

            gameManager.manageMessage(message.type, message.data);

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