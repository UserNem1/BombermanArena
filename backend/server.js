const WebSocket = require('ws');
const http = require('http');



const server = http.createServer();
const wss = new WebSocket.Server({ server });


wss.on('connection', (ws) => {
  console.log('Client connecté!');

  // Envoyer et recevoir les données

  ws.on('close', () => {
    console.log('Client déconnecté');
  });
});


function startServer() {
  server.listen(8080, () => {
    console.log('Serveur Démarré');
  });
}

function stopServer() {
  server.close(() => {
    console.log('Serveur Arrêté');
  });
}

module.exports = { startServer, stopServer };

startServer();