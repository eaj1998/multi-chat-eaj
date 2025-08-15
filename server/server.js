const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const tmi = require('tmi.js');
const WebSocket = require('ws');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173'],
    methods: ['GET', 'POST']
  }
});

const requiredEnvVars = ['TWITCH_USERNAME', 'TWITCH_OAUTH_TOKEN'];
for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    console.error(`ERRO: A variável ${varName} é obrigatória`);
    process.exit(1);
  }
}

app.use(cors({ origin: ['http://localhost:5173'], credentials: true }));
app.use(express.json());

const kickConnections = new Map(); 
const twitchConnections = new Map();

io.on('connection', (socket) => {
  console.log(`🔌 Novo cliente conectado: ${socket.id}`);

  socket.on('join-kick', async ({ username }) => {
    console.log(`➡️ Cliente ${socket.id} se conectou ao Kick: ${username}`);
    await connectKickChat(socket, username);
  });

  socket.on('join-twitch', async ({ username }) => {
    console.log(`➡️ Cliente ${socket.id} se conectou à Twitch: ${username}`);
    await connectTwitchChat(socket, username);
  });

  socket.on('disconnect', () => {
    console.log(`🔴 Cliente desconectado: ${socket.id}`);

    const kickWS = kickConnections.get(socket.id);
    if (kickWS && (kickWS.readyState === WebSocket.OPEN || kickWS.readyState === WebSocket.CONNECTING)) {
      kickWS.close();
    }
    kickConnections.delete(socket.id);

    const twitchClient = twitchConnections.get(socket.id);
    if (twitchClient) {
      twitchClient.disconnect();
    }
    twitchConnections.delete(socket.id);
  });
});

async function connectKickChat(socket, channel, retryAttempt = 0) {
  console.log(`[Kick] Conectando ao canal "${channel}"`);
  try {
    const res = await fetch(`https://kick.com/api/v2/channels/${channel}/chatroom`);
    if (!res.ok) throw new Error(`Kick API falhou: ${res.status}`);

    const data = await res.json();
    const chatroomId = data.id;

    const ws = new WebSocket('wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679?protocol=7&client=js&version=8.4.0&flash=false');
    kickConnections.set(socket.id, ws);

    ws.on('open', () => {
      ws.send(JSON.stringify({
        event: 'pusher:subscribe',
        data: { channel: `chatrooms.${chatroomId}.v2`, auth: '' }
      }));
    });

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());

        if (msg.event === 'pusher:ping') {
          ws.send(JSON.stringify({ event: 'pusher:pong' }));
        }

        if (msg.event === 'App\\Events\\ChatMessageEvent') {
          const chatData = JSON.parse(msg.data);
          io.emit('chat-message', {
            platform: 'kick',
            username: chatData.sender.username,
            message: chatData.content,
            timestamp: Date.now()
          });
        }
      } catch (err) {
        console.error('[Kick] Erro ao processar mensagem:', err.message);
      }
    });

    ws.on('close', () => {
      const clientStillConnected = io.sockets.sockets.has(socket.id);
      if (clientStillConnected) {
        const delay = Math.min(Math.pow(2, retryAttempt) * 1000, 120000);
        console.log(`[Kick] Conexão perdida. Reconnectando em ${delay / 1000}s...`);
        setTimeout(() => connectKickChat(socket, channel, retryAttempt + 1), delay);
      } else {
        console.log(`[Kick] Cliente ${socket.id} desconectado, não será reconectado.`);
      }
    });

    ws.on('error', (err) => {
      console.error('[Kick WebSocket Error]', err.message);
    });

  } catch (error) {
    console.error(`[Kick] Erro: ${error.message}`);
  }
}

async function connectTwitchChat(socket, channel) {
  const client = new tmi.Client({
    options: { debug: false },
    identity: {
      username: process.env.TWITCH_USERNAME,
      password: process.env.TWITCH_OAUTH_TOKEN
    },
    channels: [channel]
  });

  client.on('message', (chan, tags, message, self) => {
    if (self) return;
    io.emit('chat-message', {
      platform: 'twitch',
      username: tags['display-name'],
      message,
      timestamp: Date.now()
    });
  });

  await client.connect();
  twitchConnections.set(socket.id, client);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor Híbrido rodando em http://localhost:${PORT}`);
  console.log('-> API de autenticação Kick disponível em /api/auth/*');
  console.log('-> Agregador de chat emitindo eventos "chat-message" via Socket.IO');
});
