const express = require('express');
const server = require('http').createServer();
const app = express();
const PORT = 3000;

app.get('/', function (req, res) {
  res.sendFile('index.html', { root: __dirname });
});

server.on('request', app);

server.listen(PORT, function () {
  console.log(`Listening on port ${PORT}`);
});

// Begin WebSocket
const WebSocketServer = require('ws').Server;
const wss = new WebSocketServer({ server });

process.on('SIGINT', () => {
  wss.clients.forEach(function each(client) {
    client.close();
  });

  server.close(() => {
    shutdownDB();
  });
});

wss.on('connection', function connection(ws) {
  const numClients = wss.clients.size;
  console.log(`Clients connected: ${numClients}`);

  wss.broadcast(`Current visitors: ${numClients}`);

  if (ws.readyState === ws.OPEN) {
    ws.send('Welcome to my server');
  }

  db.run(`
    INSERT INTO visitors (count, time)
    VALUES (${numClients}, datetime('now'))
  `);

  ws.on('close', function close() {
    wss.broadcast(`Current visitors: ${numClients}`);
    console.log('A client has disconnected');
  });
});

/**
 * Broadcast data to all connected clients
 * @param  {Object} data
 * @void
 */
wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function (client) {
    client.send(data);
  });
};
// End WebSocket

// Begin Database
const sqlite = require('sqlite3');
const db = new sqlite.Database(':memory:');

db.serialize(() => {
  db.run(`
    CREATE TABLE visitors (
      count INTEGER,
      time TEXT
    )
  `);
});

function getCounts() {
  db.each('SELECT * FROM visitors', (error, row) => {
    console.log(row);
  });
}

function shutdownDB() {
  getCounts();
  console.log('Shutting down db');
  db.close();
}
