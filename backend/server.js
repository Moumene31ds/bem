// /home/moumene/bem/backend/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { ExpressPeerServer } = require('peer');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Configure CORS for local development and production environments
const corsOptions = {
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST'],
};

const io = new Server(server, {
  cors: corsOptions,
  pingInterval: 10000,
  pingTimeout: 5000,
});

// Create spatial audio WebRTC signalling server (PeerJS)
const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: '/spatial-audio',
});

app.use('/peerjs', peerServer);

app.get('/health', (req, res) => {
  res.status(200).send('EpicGrad Sockets & Peer Server is healthy.');
});

// InMemory registry of all active players
// Key: Socket ID, Value: Player object { id, name, examType, grade, avatarColor, position, rotation, peerId }
const players = new Map();

// Star Collectible Mini-Game State
const stars = [];
const spawnStar = () => {
  let x = (Math.random() - 0.5) * 70;
  let z = (Math.random() - 0.5) * 70;
  // If close to DJ stage (around x=0, z=-5), push it away
  if (Math.abs(x) < 8 && Math.abs(z + 5) < 6) {
    z += 10;
  }
  return {
    id: `star-${Date.now()}-${Math.random()}`,
    position: [x, 0.6, z],
  };
};

// Initialize 5 active stars
for (let i = 0; i < 5; i++) {
  stars.push(spawnStar());
}

io.on('connection', (socket) => {
  console.log(`[Socket Connected] ID: ${socket.id}`);

  // Handle when a graduate joins the party
  socket.on('user_joined', (userData) => {
    // Structure a clean player object
    const player = {
      id: socket.id,
      userId: userData.id || socket.id,
      name: userData.name || 'Anonymous Graduate',
      examType: userData.examType || 'BEM',
      grade: userData.grade || 'PASSABLE',
      avatarColor: userData.avatarColor || '#3b82f6',
      headgear: userData.headgear || 'cap',
      peerId: userData.peerId || null,
      position: [0, 0, 0], // Start at spawning location
      rotation: [0, 0, 0],
      isMoving: false,
      score: 0,
    };

    players.set(socket.id, player);

    // Broadcast system chat notification
    const systemNotice = {
      id: `sys-${Date.now()}-${Math.random()}`,
      userId: 'system',
      name: 'System',
      text: `🎉 ${player.name} (${player.examType} - ${player.grade}) joined the graduation party!`,
      timestamp: new Date().toLocaleTimeString(),
    };
    io.emit('chat_message', systemNotice);

    console.log(`[Player Joined] ${player.name} (${player.examType})`);

    // Acknowledge the joining player with their socket id, players, and stars
    socket.emit('welcome', {
      socketId: socket.id,
      currentPlayers: Array.from(players.values()),
      currentStars: stars,
    });
  });

  // Handle client movement updates
  socket.on('user_moved', (movementData) => {
    const player = players.get(socket.id);
    if (player) {
      player.position = movementData.position || player.position;
      player.rotation = movementData.rotation || player.rotation;
      player.isMoving = movementData.isMoving || false;
      players.set(socket.id, player);
    }
  });

  // Handle peerId updates (once PeerJS initiates on the client)
  socket.on('register_peer_id', (peerId) => {
    const player = players.get(socket.id);
    if (player) {
      player.peerId = peerId;
      players.set(socket.id, player);
      console.log(`[Peer Registered] Socket: ${socket.id} -> Peer ID: ${peerId}`);
    }
  });

  // Handle real-time chat messages
  socket.on('chat_message', (messageText) => {
    const player = players.get(socket.id);
    if (player) {
      const msg = {
        id: `msg-${Date.now()}-${Math.random()}`,
        userId: player.id,
        name: player.name,
        examType: player.examType,
        text: messageText,
        timestamp: new Date().toLocaleTimeString(),
      };
      io.emit('chat_message', msg);
    }
  });

  // Handle global visual effects trigger (Fireworks or Confetti)
  socket.on('fireworks_triggered', (vfxData) => {
    const player = players.get(socket.id);
    if (player) {
      const payload = {
        id: `vfx-${Date.now()}`,
        senderName: player.name,
        type: vfxData.type || 'firework', // 'firework' or 'confetti'
        position: vfxData.position || [0, 10, 0],
        color: vfxData.color || player.avatarColor,
      };
      // Broadcast to everyone including sender
      io.emit('fireworks_triggered', payload);
    }
  });

  // Handle client emote triggers
  socket.on('trigger_emote', (emoteData) => {
    const player = players.get(socket.id);
    if (player) {
      const payload = {
        id: `emote-${Date.now()}-${Math.random()}`,
        playerId: socket.id,
        type: emoteData.type || 'cap',
      };
      // Broadcast to everyone including sender
      io.emit('emote_triggered', payload);
    }
  });

  // Handle star collection in mini-game
  socket.on('collect_star', ({ starId }) => {
    const starIdx = stars.findIndex((s) => s.id === starId);
    if (starIdx !== -1) {
      stars.splice(starIdx, 1);
      const newStar = spawnStar();
      stars.push(newStar);

      const player = players.get(socket.id);
      if (player) {
        player.score = (player.score || 0) + 10;
        players.set(socket.id, player);

        io.emit('stars_updated', {
          stars: stars,
          collectorId: socket.id,
          scoreUpdate: player.score,
        });

        const systemNotice = {
          id: `sys-${Date.now()}-${Math.random()}`,
          userId: 'system',
          name: 'System',
          text: `⭐ ${player.name} collected a graduation star (+10 pts)! Total: ${player.score} pts.`,
          timestamp: new Date().toLocaleTimeString(),
        };
        io.emit('chat_message', systemNotice);
      }
    }
  });

  // Handle client Zgharit (wedding ululation) trigger
  socket.on('trigger_zgharit', () => {
    const player = players.get(socket.id);
    if (player) {
      io.emit('zgharit_triggered', {
        playerId: socket.id,
        position: player.position,
      });
    }
  });

  // Handle clean disconnection
  socket.on('disconnect', () => {
    const player = players.get(socket.id);
    if (player) {
      console.log(`[Player Left] Name: ${player.name}, ID: ${socket.id}`);
      
      const systemNotice = {
        id: `sys-${Date.now()}-${Math.random()}`,
        userId: 'system',
        name: 'System',
        text: `👋 ${player.name} left the beach party.`,
        timestamp: new Date().toLocaleTimeString(),
      };
      io.emit('chat_message', systemNotice);
      
      players.delete(socket.id);
      io.emit('user_left', socket.id);
    }
  });
});

// Setup tick rate loop (30 times per second) for positional multiplayer updates
const TICK_RATE = 30;
setInterval(() => {
  if (players.size > 0) {
    const playerList = Array.from(players.values());
    io.emit('state_update', playerList);
  }
}, 1000 / TICK_RATE);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`   EPICGRAD MULTIPLAYER SOCKET SERVER`);
  console.log(`   Running on http://localhost:${PORT}`);
  console.log(`   PeerJS Mount: http://localhost:${PORT}/peerjs`);
  console.log(`=========================================`);
});
