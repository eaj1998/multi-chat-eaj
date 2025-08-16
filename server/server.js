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
    origin: [process.env.CORS_ORIGIN],
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

app.use(cors({ origin: [process.env.CORS_ORIGIN], credentials: true }));
app.use(express.json());

// Mapeamentos das conexões
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
    closeConnections(socket.id);
  });
});

app.post('/disconnect-self', (req, res) => {
  const clientId = req.query.id;
  console.log(`⚡ Requisição de desconexão recebida para cliente: ${clientId}`);

  if (!clientId) {
    return res.status(400).json({ error: 'ID do cliente não informado' });
  }

  closeConnections(clientId);

  const socket = io.sockets.sockets.get(clientId);
  if (socket) {
    socket.disconnect(true);
  }

  res.json({ status: 'ok', message: `Conexões do cliente ${clientId} encerradas` });
});

function closeConnections(clientId) {
  const kickWS = kickConnections.get(clientId);
  if (kickWS && (kickWS.readyState === WebSocket.OPEN || kickWS.readyState === WebSocket.CONNECTING)) {
    kickWS.close();
  }
  kickConnections.delete(clientId);

  const twitchClient = twitchConnections.get(clientId);
  if (twitchClient) {
    twitchClient.disconnect();
  }
  twitchConnections.delete(clientId);
}

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
            color: chatData.sender.identity.color,
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
      color: tags['color'],
      message,
      timestamp: Date.now()
    });
  });

  await client.connect();
  twitchConnections.set(socket.id, client);
}


//########### MOCK TESTS

let mockInterval = null; // Variável para controlar o intervalo do mock

const mockUsernames = ['Velociraptor', 'ChatterBox', 'GamerPro', 'SilentWatcher', 'StreamFan_123'];
const mockMessages = {
    short: ['olá!', 'gg', 'top', '😂', 'brabo'],
    medium: [
        'Essa jogada foi incrível!',
        'Qual o próximo jogo que você vai jogar?',
        'Estou gostando muito da live.'
    ],
    long: [
        'Alguém mais acha que a estratégia do streamer de focar em recursos no início do jogo foi a decisão certa para garantir a vitória no final? 🤔',
        'Lembrei de uma história engraçada ontem, estava tentando fazer uma receita nova e acabei queimando tudo. O alarme de incêndio disparou e os vizinhos quase chamaram os bombeiros. 😅'
    ],
    veryLong: [
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat. Duis semper. Duis arcu massa, scelerisque vitae, consequat in, pretium a, enim. Pellentesque congue.',
    ]
};

const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

function generateRandomMessage() {
    const platform = Math.random() > 0.5 ? 'kick' : 'twitch';
    const messageType = getRandomElement(['short', 'medium', 'long', 'veryLong']);
    const messageContent = getRandomElement(mockMessages[messageType]);

    return {
        platform,
        username: getRandomElement(mockUsernames),
        message: messageContent,
        color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
        timestamp: Date.now()
    };
}

app.post('/test/start-mock', (req, res) => {
    if (mockInterval) {
        clearInterval(mockInterval);
    }

    const { interval = 2000 } = req.body;

    console.log(`🚀 Iniciando gerador de mocks. Intervalo: ${interval}ms`);

    mockInterval = setInterval(() => {
        const mockMessage = generateRandomMessage();
        console.log('Emitindo mock:', mockMessage.username, ':', mockMessage.message);
        io.emit('chat-message', mockMessage);
    }, interval);

    res.json({ status: 'ok', message: `Gerador de mocks iniciado com intervalo de ${interval}ms.` });
});

app.post('/test/stop-mock', (req, res) => {
    if (mockInterval) {
        clearInterval(mockInterval);
        mockInterval = null;
        console.log('🛑 Gerador de mocks parado.');
        return res.json({ status: 'ok', message: 'Gerador de mocks parado com sucesso.' });
    }
    console.log('⚠️ Tentativa de parar gerador de mocks, mas nenhum estava ativo.');
    res.status(404).json({ error: 'Nenhum gerador de mocks ativo para parar.' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor Híbrido rodando em http://localhost:${PORT}`);
});
