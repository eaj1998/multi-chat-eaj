import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import tmi from 'tmi.js';
import WebSocket from 'ws';
import twitchEmoticons from "@mkody/twitch-emoticons";
const { EmoteFetcher, EmoteParser } = twitchEmoticons;
import { ApiClient } from '@twurple/api';
import { AppTokenAuthProvider } from '@twurple/auth';
import 'dotenv/config';

const fetcher = new EmoteFetcher(process.env.TWITCH_ID, process.env.TWITCH_SECRET);

const authProvider = new AppTokenAuthProvider(
  process.env.TWITCH_ID,
  process.env.TWITCH_SECRET
);
const apiClient = new ApiClient({ authProvider });


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [process.env.CORS_ORIGIN],
    methods: ['GET', 'POST']
  }
});

const requiredEnvVars = ['TWITCH_USERNAME', 'TWITCH_OAUTH_TOKEN', 'TWITCH_SECRET', 'TWITCH_ID'];
for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    console.error(`ERRO: A variável ${varName} é obrigatória`);
    process.exit(1);
  }
}

app.use(cors({ origin: [process.env.CORS_ORIGIN], credentials: true }));
app.use(express.json());

async function loadEmotes(channelId) {
  try {
    console.log(`📡 Fetching emotes for channel ID: ${channelId}...`);
    await Promise.all([
      fetcher.fetchTwitchEmotes(), // Global Twitch Emotes
      fetcher.fetchTwitchEmotes(channelId),
      fetcher.fetchBTTVEmotes(), // Global BTTV Emotes
      fetcher.fetchBTTVEmotes(channelId),
      fetcher.fetchFFZEmotes(), // Global FFZ Emotes
      fetcher.fetchFFZEmotes(channelId),
      fetcher.fetchSevenTVEmotes(null, 'avif'), // Global 7TV Emotes
      fetcher.fetchSevenTVEmotes(channelId, 'avif'),
    ]);
    console.log(`✅ Successfully fetched emotes for channel ID: ${channelId}`);
  } catch (error) {
    console.error(`❌ CRITICAL: Failed to fetch emotes for channel ID ${channelId}.`);
    console.error(`Error details: ${error}`);
  }
}

const kickConnections = new Map();
const twitchConnections = new Map();
const clientBadgeState = new Map();

io.on('connection', (socket) => {
  console.log(`🔌 Novo cliente conectado: ${socket.id}`);

  socket.on('join-kick', async ({ username }) => {
    console.log(`➡️ Cliente ${socket.id} se conectou ao Kick: ${username}`);

    const kickBadges = await fetchAndFormatKickBadges(username);

    let currentState = clientBadgeState.get(socket.id);

    if (!currentState) {
      console.warn(`[Estado] Estado não encontrado para ${socket.id}, inicializando...`);
      currentState = { twitch: {}, kick: {} };
    }

    currentState.kick = kickBadges;
    clientBadgeState.set(socket.id, currentState);

    socket.emit('channel-badges', currentState);

    connectKickChat(socket, username);
  });

  socket.on('join-twitch', async ({ username }) => {
    console.log(`➡️ Cliente ${socket.id} se conectou à Twitch: ${username}`);

    const twitchBadges = await fetchAndFormatTwitchBadges(username);

    const currentState = clientBadgeState.get(socket.id);
    currentState.twitch = twitchBadges;
    clientBadgeState.set(socket.id, currentState);

    socket.emit('channel-badges', currentState);

    connectTwitchChat(socket, username);
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
          return;
        }

        const eventData = msg.data ? JSON.parse(msg.data) : {};

        switch (msg.event) {
          case 'App\\Events\\ChatMessageEvent':
            socket.emit('chat-message', {
              platform: 'kick',
              username: eventData.sender.username,
              message: eventData.content,
              color: eventData.sender.identity.color,
              badges: eventData.sender.identity.badges,
              timestamp: Date.now()
            });
            break;

          case 'App\\Events\\SubscriptionEvent':
            socket.emit('alert-message', {
              platform: 'kick',
              type: 'sub',
              username: eventData.username,
              months: eventData.months,
              message: `assinou por ${eventData.months} meses!`,
              timestamp: Date.now()
            });
            break;

          case 'App\\Events\\GiftedSubscriptionsEvent':
            socket.emit('alert-message', {
              platform: 'kick',
              type: 'subgift',
              username: eventData.gifter_username,
              count: eventData.gifted_usernames.length,
              message: `presenteou ${eventData.gifted_usernames.length} subs!`,
              timestamp: Date.now()
            });
            break;
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
async function getKickChannelInfo(channel) {
  if (!channel) return null;

  const url = `https://kick.com/api/v2/channels/${channel.toLowerCase()}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Status da resposta: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error(`Erro ao buscar informações do canal da Kick "${channel}":`, error.message);
    return null;
  }
}

async function fetchAndFormatKickBadges(channelName) {
  const channelInfo = await getKickChannelInfo(channelName);
  console.log(channelInfo);

  if (!channelInfo) {
    return {};
  }

  const formattedBadges = {};

  if (channelInfo.subscriber_badges && Array.isArray(channelInfo.subscriber_badges)) {
    channelInfo.subscriber_badges.forEach(badge => {
      const key = `subscriber-${badge.months}`;
      if (badge.badge_image) {
        formattedBadges[key] = badge.badge_image.src;
      }
    });
  }
  console.log(`[Kick] Badges formatados para o canal "${channelName}":`, formattedBadges);
  return formattedBadges;
}

async function connectTwitchChat(socket, channel) {
  let emotesLoaded = false;

  const client = new tmi.Client({
    options: { debug: false },
    identity: {
      username: process.env.TWITCH_USERNAME,
      password: process.env.TWITCH_OAUTH_TOKEN
    },
    channels: [channel]
  });

  client.on('subscription', (chan, username, methods, message, userstate) => {
    const tier = methods.plan === 'Prime' ? 'Prime' : `Tier ${methods.plan / 1000}`;
    console.log(`[tmi.js] Nova Inscrição: ${username} (${tier})`);

    socket.emit('alert-message', {
      platform: 'twitch',
      type: 'sub',
      username: username,
      tier: tier,
      message: message || `${username} acabou de se inscrever!`,
      timestamp: Date.now()
    });
  });

  client.on('resubscription', (chan, username, months, message, userstate, methods) => {
    const tier = methods.plan === 'Prime' ? 'Prime' : `Tier ${methods.plan / 1000}`;
    console.log(`[tmi.js] Re-inscrição: ${username} por ${months} meses (${tier})`);

    socket.emit('alert-message', {
      platform: 'twitch',
      type: 'resub',
      username: username,
      months: months,
      tier: tier,
      message: message || `${username} se inscreveu por ${months} meses!`,
      timestamp: Date.now()
    });
  });

  client.on('subgift', (channel, username, streakMonths, recipient, methods, userstate) => {
    const tier = methods.plan === 'Prime' ? 'Prime' : `Tier ${methods.plan / 1000}`;
    console.log(`[tmi.js] Presente Individual: ${username} presenteou um sub para ${recipient}`);

    socket.emit('alert-message', {
      platform: 'twitch',
      type: 'giftsub_single',
      username: username,
      recipient: recipient,
      tier: tier,
      message: `${username} presenteou uma inscrição para ${recipient}!`,
      timestamp: Date.now()
    });
  });

  client.on('message', async (chan, tags, message, self) => {
    if (self) return;

    if (!emotesLoaded) {
      const channelId = tags['room-id'];
      console.log(`Carregando emotes para o canal ID: ${channelId}`);
      await loadEmotes(channelId);
      emotesLoaded = true;
    }

    const parsedMessage = manualParse(message, fetcher);

    console.log('tags', tags['badges']);

    socket.emit('chat-message', {
      platform: 'twitch',
      username: tags['display-name'],
      color: tags['color'],
      badges: tags['badges'],
      message: parsedMessage,
      timestamp: Date.now()
    });
  });

  await client.connect();
  twitchConnections.set(socket.id, client);

}

async function fetchAndFormatTwitchBadges(channel) {
  try {
    const user = await apiClient.users.getUserByName(channel);
    if (!user) {
      console.error(`[Badges] Usuário Twitch ${channel} não encontrado.`);
      return {};
    }
    const channelId = user.id;

    const [globalBadges, channelBadges] = await Promise.all([
      apiClient.chat.getGlobalBadges(),
      apiClient.chat.getChannelBadges(channelId)
    ]);

    const badgeMap = new Map();
    [...globalBadges, ...channelBadges].forEach(badge => {
      badge.versions.forEach(version => {
        const key = `${badge.id}/${version.id}`;
        badgeMap.set(key, version.getImageUrl(2));
      });
    });

    return Object.fromEntries(badgeMap);
  } catch (error) {
    console.error('[Badges] Erro ao buscar os badges da Twitch:', error);
    return {};
  }
}


function manualParse(message, fetcherInstance, options = {}) {
  const words = message.split(' ');

  const parsedWords = words.map(word => {
    const cleanWord = word.trim().replace(/[.,!?;:]/g, '');

    if (fetcherInstance.emotes.has(cleanWord)) {
      const emote = fetcherInstance.emotes.get(cleanWord);
      const link = emote.toLink();
      return `<img alt="${emote.code}" title="${emote.code}" class="emote" src="${link.replace('undefined', '1x.avif')}">`;
    }

    return word;
  });

  return parsedWords.join(' ');
}


//########### MOCK TESTS
let mockInterval = null;

const mockUsernames = ['lucasmahle', 'mikeColorado', 'GamerPro', 'SilentWatcher', 'StreamFan_123'];
const mockMessages = [
  'olá!',
  'gg',
  'top',
  '😂',
  'brabo',
  'isso foi incrível!',
  'Kappa',
  'Vamos lá! Pog',
  'Não acredito nisso LUL',
  'Que triste peppoSAD',
  'Alguém mais viu isso? 7TV',
  'Este jogo é muito bom Pog'
];


function generateRandomMessage() {
  const platform = Math.random() > 0.5 ? 'kick' : 'twitch';
  const messageContent = getRandomElement(mockMessages);
  const parsedContent = manualParse(messageContent, fetcher);

  return {
    id: Date.now() + mockUsernames[0],
    type: 'chat',
    data: {
      platform,
      username: getRandomElement(mockUsernames),
      message: parsedContent,
      color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
      timestamp: Date.now()
    }
  };
}


function generateRandomAlert() {
  const platform = Math.random() > 0.5 ? 'kick' : 'twitch';
  const alertTypes = ['sub', 'resub', 'subgift'];
  const type = getRandomElement(alertTypes);
  const username = getRandomElement(mockUsernames);

  let alertData = {
    platform,
    type,
    username,
    timestamp: Date.now(),
  };

  if (type === 'sub' || type === 'resub') {
    alertData.tier = 'Tier 1';
    alertData.months = type === 'resub' ? Math.floor(Math.random() * 10) + 2 : 1;
    alertData.message = `${username} se inscreveu por ${alertData.months} meses!`;
  } else if (type === 'subgift' || type === 'giftsub') {
    alertData.count = getRandomElement([1, 5, 10]);
    alertData.tier = 'Tier 1';
    alertData.message = `${username} presenteou ${alertData.count} subs!`;
  }

  return {
    id: Date.now() + username,
    type: 'alert',
    data: alertData
  };
}

const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

app.post('/test/start-mock', (req, res) => {
  if (mockInterval) {
    clearInterval(mockInterval);
  }
  const { interval = 2000 } = req.body;
  console.log(`🚀 Iniciando gerador de mocks. Intervalo: ${interval}ms`);

  mockInterval = setInterval(() => {
    const isChatMessage = Math.random() < 0.8;

    if (isChatMessage) {
      const mockMsg = generateRandomMessage();
      console.log('Emitindo MOCK de CHAT:', mockMsg.data.username, ':', mockMsg.data.message);
      io.emit('chat-message', mockMsg.data);
    } else {
      const mockAlert = generateRandomAlert();
      console.log('Emitindo MOCK de ALERTA:', mockAlert.data.type, 'por', mockAlert.data.username);
      io.emit('alert-message', mockAlert.data);
    }
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
