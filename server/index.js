const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const tmi = require('tmi.js');
const cors = require('cors');
const axios = require('axios');
const WebSocket = require('ws');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 3000;

app.use(cors());
app.get('/', (req, res) => res.send('Chat Aggregator Backend Running'));

// --- Twitch Connection (Unchanged) ---
const twitchClient = new tmi.Client({
  options: { debug: true },
  identity: {
    username: process.env.TWITCH_USERNAME,
    password: process.env.TWITCH_OAUTH_TOKEN,
  },
  channels: [process.env.TWITCH_CHANNEL]
});

(async () => {
  try {
    await twitchClient.connect();
    console.log('Connected to Twitch');
  } catch (err) {
    console.error('[Twitch Error]', err);
  }
})();

twitchClient.on('message', (channel, tags, message, self) => {
  if (self) return;
  io.emit('chat-message', {
    platform: 'twitch',
    username: tags['display-name'],
    message,
    timestamp: Date.now()
  });
});


// --- YouTube Connection (Unchanged) ---
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
let youtubeLiveChatId = null;
let youtubePollingInterval = null;

async function getLiveChatId() {
  try {
    const res = await axios.get('https://www.googleapis.com/youtube/v3/liveBroadcasts', {
      params: {
        part: 'snippet',
        broadcastStatus: 'active',
        broadcastType: 'all',
        key: YOUTUBE_API_KEY
      }
    });

    const broadcasts = res.data.items;
    if (broadcasts.length > 0) {
      const newLiveChatId = broadcasts[0].snippet.liveChatId;
      if (youtubeLiveChatId !== newLiveChatId) {
        youtubeLiveChatId = newLiveChatId;
        console.log('YouTube liveChatId found:', youtubeLiveChatId);
        if (youtubePollingInterval) clearInterval(youtubePollingInterval); // Clear old interval if it exists
        pollYouTubeChat();
      }
    } else {
      console.log('No active YouTube live found.');
      if (youtubePollingInterval) clearInterval(youtubePollingInterval);
      youtubeLiveChatId = null;
    }
  } catch (err) {
    console.error('YouTube liveChatId error:', err.message);
  }
}

async function pollYouTubeChat() {
  console.log('Starting YouTube chat polling...');
  youtubePollingInterval = setInterval(async () => {
    if (!youtubeLiveChatId) {
      console.log('Stopping YouTube polling, no liveChatId.');
      clearInterval(youtubePollingInterval);
      return;
    }
    try {
      const res = await axios.get('https://www.googleapis.com/youtube/v3/liveChat/messages', {
        params: {
          liveChatId: youtubeLiveChatId,
          part: 'snippet,authorDetails',
          key: YOUTUBE_API_KEY
        }
      });

      const messages = res.data.items;
      messages.forEach(msg => {
        io.emit('chat-message', {
          platform: 'youtube',
          username: msg.authorDetails.displayName,
          message: msg.snippet.displayMessage,
          timestamp: new Date(msg.snippet.publishedAt).getTime()
        });
      });
    } catch (err) {
      console.error('[YouTube Chat]', err.message);
      // If chat is permanently closed, this will error. Stop polling.
      if (err.response && (err.response.status === 403 || err.response.status === 404)) {
         console.log('YouTube chat is likely inactive. Stopping polling.');
         clearInterval(youtubePollingInterval);
         youtubeLiveChatId = null;
      }
    }
  }, 7000); // Polling interval set to 7 seconds
}

// Initial check for YouTube stream
getLiveChatId();
// Periodically check if a new stream has started
setInterval(getLiveChatId, 300000); // Check every 5 minutes for a new live stream

/**
 * Conecta-se ao chat de um canal Kick e gerencia a reconexão automática.
 * @param {string} channel - O nome de usuário do canal Kick.
 * @param {number} retryAttempt - Parâmetro interno para tentativas de reconexão.
 */
async function connectKickChat(channel, retryAttempt = 0) {
  console.log(`[Kick Chat] Tentando conectar ao canal "${channel}" (Tentativa: ${retryAttempt + 1})`);

  try {
    const response = await axios.get(`https://kick.com/api/v2/channels/${channel}/chatroom`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    const { chat_server: wsUrl, id: chatroomId } = response.data.chatroom;
    if (!wsUrl || !chatroomId) {
      throw new Error('Resposta da API inválida. Não foi possível encontrar a URL do WebSocket ou o ID da sala.');
    }

    const ws = new WebSocket(wsUrl);

    ws.on('open', () => {
      console.log(`[Kick Chat] Conexão com "${channel}" estabelecida com sucesso.`);
      retryAttempt = 0;

      ws.send(JSON.stringify({
        event: 'pusher:subscribe',
        data: {
          auth: '',
          channel: `chatrooms.${chatroomId}.v2`,
        },
      }));
    });

    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());

      // PASSO 4: Ficar atento aos eventos de mensagem e emiti-los para o frontend.
      if (message.event === 'App\\Events\\ChatMessageEvent') {
        const chatData = JSON.parse(message.data);
        io.emit('chat-message', {
          platform: 'kick',
          username: chatData.sender.username,
          message: chatData.content,
          timestamp: new Date(chatData.created_at).getTime(),
        });
      }
    });

    ws.on('close', (code, reason) => {
      console.warn(`[Kick Chat] Conexão fechada. Código: ${code}, Motivo: ${reason.toString()}`);
      handleReconnect(channel, retryAttempt + 1);
    });

    ws.on('error', (error) => {
      console.error('[Kick Chat] Erro de WebSocket:', error.message);
      // O evento 'close' geralmente é disparado após um erro, cuidando da reconexão.
    });

  } catch (error) {
    if (error.response) {
      console.error(`[Kick Chat] Erro de API: ${error.response.status}`, error.response.data);
    } else {
      console.error('[Kick Chat] Erro de Rede ou API:', error.message);
    }
    handleReconnect(channel, retryAttempt + 1);
  }
}

/**
 * Gerencia a lógica de reconexão com "exponential backoff".
 * Isso evita sobrecarregar o servidor com tentativas de reconexão.
 * @param {string} channel
 * @param {number} attempt
 */
function handleReconnect(channel, attempt) {
  // Atraso exponencial: 2s, 4s, 8s, 16s, ... até um máximo de 2 minutos.
  const delay = Math.min(Math.pow(2, attempt) * 1000, 120000); 
  console.log(`[Kick Chat] Reconectando em ${delay / 1000} segundos...`);
  setTimeout(() => connectKickChat(channel, attempt), delay);
}

// E você continua chamando a função da mesma forma no seu código principal.
if (process.env.KICK_CHANNEL) {
    connectKickChat(process.env.KICK_CHANNEL);
}


// --- Final Server Setup ---
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));