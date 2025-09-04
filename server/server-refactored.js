import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import tmi from 'tmi.js';
import WebSocket from 'ws';
import twitchEmoticons from "@mkody/twitch-emoticons";
const { EmoteFetcher } = twitchEmoticons;
import { ApiClient } from '@twurple/api';
import { AppTokenAuthProvider } from '@twurple/auth';
import 'dotenv/config';

// Importar nossas classes
import { Logger } from './src/shared/utils/Logger.js';
import { Environment } from './src/config/Environment.js';
import { ChatService } from './src/application/services/ChatService.js';
import { AlertService } from './src/application/services/AlertService.js';
import { MockService } from './src/testing/MockService.js';
import { SocketManager } from './src/presentation/websocket/SocketManager.js';
import { EmoteParser } from './src/infrastructure/emotes/EmoteParser.js';
import { TestController } from './src/presentation/http/controllers/TestController.js';
import { PlatformConnectionHandler } from './src/infrastructure/platforms/handlers/PlatformConnectionHandler.js';
import { NetworkError, PlatformError } from './src/shared/errors/BaseError.js';

// ===============================
// VALIDAÇÃO INICIAL
// ===============================

Logger.info('🚀 Iniciando servidor robusto...');

// Verificar variáveis de ambiente
if (!Environment.validate()) {
    Logger.error('❌ Falha na validação do ambiente. Encerrando...');
    process.exit(1);
}

Environment.checkConnectivity().then(connectivity => {
    Logger.info('🌐 Status de conectividade:', connectivity);
});

// ===============================
// CONFIGURAÇÃO INICIAL
// ===============================

const app = express();
const server = http.createServer(app);

const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map(origin => origin.trim())
    : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST']
    }
});

app.use(express.json());

// ===============================
// INICIALIZAR SERVIÇOS COM PROTEÇÃO
// ===============================

const socketManager = new SocketManager(io);
const connectionHandler = new PlatformConnectionHandler(socketManager);

let fetcher = null;
let apiClient = null;

try {
    fetcher = new EmoteFetcher(process.env.TWITCH_ID, process.env.TWITCH_SECRET);
    const authProvider = new AppTokenAuthProvider(process.env.TWITCH_ID, process.env.TWITCH_SECRET);
    apiClient = new ApiClient({ authProvider });
    Logger.info('✅ APIs da Twitch inicializadas');
} catch (error) {
    Logger.error('❌ Falha ao inicializar APIs da Twitch:', { error: error.message });
    Logger.warn('⚠️ Continuando em modo limitado (apenas mocks disponíveis)');
}

const emoteParser = fetcher ? new EmoteParser(fetcher) : null;
const chatService = new ChatService(emoteParser, socketManager);
const alertService = new AlertService(socketManager);
const mockService = new MockService(socketManager);
const testController = new TestController(mockService);

// ===============================
// CONEXÕES ROBUSTAS
// ===============================

const kickConnections = new Map();
const twitchConnections = new Map();
const clientBadgeState = new Map();

async function loadEmotes(channelId) {
    if (!fetcher) {
        Logger.warn('Fetcher não disponível, pulando carregamento de emotes');
        return;
    }

    try {
        Logger.info(`Carregando emotes para canal ID: ${channelId}...`);
        await Promise.race([
            Promise.all([
                fetcher.fetchTwitchEmotes(),
                fetcher.fetchTwitchEmotes(channelId),
                fetcher.fetchBTTVEmotes(),
                fetcher.fetchBTTVEmotes(channelId),
                fetcher.fetchFFZEmotes(),
                fetcher.fetchFFZEmotes(channelId),
                fetcher.fetchSevenTVEmotes(null, 'avif'),
                fetcher.fetchSevenTVEmotes(channelId, 'avif'),
            ]),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
        ]);
        Logger.info(`✅ Emotes carregados para canal ID: ${channelId}`);
    } catch (error) {
        Logger.warn(`Falha ao carregar emotes para canal ID ${channelId}:`, { error: error.message });
    }
}

// ===============================
// SOCKET.IO COM TRATAMENTO DE ERRO
// ===============================

io.on('connection', (socket) => {
    Logger.info(`Novo cliente conectado: ${socket.id}`);

    socket.on('join-twitch', async ({ username }) => {
        Logger.platform('twitch', `Cliente ${socket.id} conectando: ${username}`);

        try {
            // Tentar buscar badges (não crítico)
            let twitchBadges = {};
            if (apiClient) {
                try {
                    twitchBadges = await fetchAndFormatTwitchBadges(username);
                } catch (error) {
                    Logger.warn('Falha ao buscar badges Twitch (não crítico):', { error: error.message });
                    socketManager.emitToSocket(socket.id, 'warning', {
                        message: 'Badges indisponíveis, mas chat funcionará normalmente'
                    });
                }
            }

            let currentState = clientBadgeState.get(socket.id) || { twitch: {}, kick: {} };
            currentState.twitch = twitchBadges;
            clientBadgeState.set(socket.id, currentState);
            socket.emit('channel-badges', currentState);

            await connectTwitchChatRobust(socket, username);

        } catch (error) {
            await connectionHandler.handleConnectionError(socket.id, 'twitch', error);
        }
    });

    socket.on('join-kick', async ({ username }) => {
        Logger.platform('kick', `Cliente ${socket.id} conectando: ${username}`);

        try {
            let kickBadges = {};
            try {
                kickBadges = await fetchAndFormatKickBadges(username);
            } catch (error) {
                Logger.warn('Falha ao buscar badges Kick (não crítico):', { error: error.message });
                socketManager.emitToSocket(socket.id, 'warning', {
                    message: 'Badges indisponíveis, mas chat funcionará normalmente'
                });
            }

            let currentState = clientBadgeState.get(socket.id) || { twitch: {}, kick: {} };
            currentState.kick = kickBadges;
            clientBadgeState.set(socket.id, currentState);
            socket.emit('channel-badges', currentState);

            await connectKickChatRobust(socket, username);

        } catch (error) {
            await connectionHandler.handleConnectionError(socket.id, 'kick', error);
        }
    });

    socket.on('disconnect', () => {
        Logger.info(`Cliente desconectado: ${socket.id}`);
        connectionHandler.clearRetries(socket.id);
        closeConnections(socket.id);
    });

    socket.on('retry-connection', async ({ platform, username }) => {
        Logger.info(`Retry manual solicitado: ${platform}`, { clientId: socket.id });

        if (platform === 'twitch') {
            socket.emit('join-twitch', { username });
        } else if (platform === 'kick') {
            socket.emit('join-kick', { username });
        }
    });
});

// ===============================
// CONEXÕES ROBUSTAS TWITCH
// ===============================

async function connectTwitchChatRobust(socket, channel) {
    if (!process.env.TWITCH_USERNAME || !process.env.TWITCH_OAUTH_TOKEN) {
        throw new PlatformError('Credenciais Twitch não configuradas', 'twitch', 'connect');
    }

    let emotesLoaded = false;

    const client = new tmi.Client({
        options: {
            debug: false,
            reconnect: true,
            reconnectDelay: 2000,
            reconnectDecay: 1.5,
            maxReconnectAttempts: 3
        },
        identity: {
            username: process.env.TWITCH_USERNAME,
            password: process.env.TWITCH_OAUTH_TOKEN
        },
        channels: [channel]
    });

    client.on('connected', () => {
        Logger.platform('twitch', `Conectado com sucesso ao canal: ${channel}`);
        socketManager.emitToSocket(socket.id, 'platform-connected', { platform: 'twitch', channel });
    });

    client.on('disconnected', (reason) => {
        Logger.warn('Twitch desconectada:', { reason, channel });
        socketManager.emitToSocket(socket.id, 'platform-disconnected', { platform: 'twitch', reason });
    });

    client.on('reconnect', () => {
        Logger.info('Twitch reconectando...', { channel });
        socketManager.emitToSocket(socket.id, 'platform-reconnecting', { platform: 'twitch' });
    });

    client.on('subscription', (chan, username, methods, message, userstate) => {
        const tier = methods.plan === 'Prime' ? 'Prime' : `Tier ${methods.plan / 1000}`;
        alertService.processSubscription('twitch', username, { tier, message });
    });

    client.on('resubscription', (chan, username, months, message, userstate, methods) => {
        const tier = methods.plan === 'Prime' ? 'Prime' : `Tier ${methods.plan / 1000}`;
        alertService.processResubscription('twitch', username, months, { tier, message });
    });

    client.on('subgift', (channel, username, streakMonths, recipient, methods, userstate) => {
        const tier = methods.plan === 'Prime' ? 'Prime' : `Tier ${methods.plan / 1000}`;
        alertService.processSingleGiftSub('twitch', username, recipient, { tier });
    });

    client.on('message', async (chan, tags, message, self) => {
        if (self) return;

        if (!emotesLoaded && fetcher) {
            const channelId = tags['room-id'];
            await loadEmotes(channelId);
            emotesLoaded = true;
        }

        await chatService.processTwitchMessage(tags, message);
    });

    client.on('notice', (chan, msgid, message) => {
        Logger.warn('Twitch notice:', { chan, msgid, message });
    });

    try {
        await client.connect();
        twitchConnections.set(socket.id, client);
    } catch (error) {
        throw new PlatformError(`Falha na conexão Twitch: ${error.message}`, 'twitch', 'connect');
    }
}

// ===============================
// CONEXÕES ROBUSTAS KICK
// ===============================

async function connectKickChatRobust(socket, channel, retryAttempt = 0) {
    Logger.platform('kick', `Conectando ao canal "${channel}" (tentativa ${retryAttempt + 1})`);

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(`https://kick.com/api/v2/channels/${channel}/chatroom`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
            throw new NetworkError(`Kick API retornou ${res.status}`, res.url);
        }

        const data = await res.json();
        const chatroomId = data.id;

        const ws = new WebSocket('wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679?protocol=7&client=js&version=8.4.0&flash=false');
        kickConnections.set(socket.id, ws);

        return new Promise((resolve, reject) => {
            const connectTimeout = setTimeout(() => {
                reject(new Error('Timeout na conexão WebSocket'));
            }, 15000);

            ws.on('open', () => {
                clearTimeout(connectTimeout);

                ws.send(JSON.stringify({
                    event: 'pusher:subscribe',
                    data: { channel: `chatrooms.${chatroomId}.v2`, auth: '' }
                }));

                Logger.platform('kick', `WebSocket conectado para ${channel}`);
                socketManager.emitToSocket(socket.id, 'platform-connected', { platform: 'kick', channel });
                resolve();
            });

            ws.on('message', (data) => {
                try {
                    const msg = JSON.parse(data.toString());

                    if (msg.event === 'pusher:ping') {
                        ws.send(JSON.stringify({ event: 'pusher:pong' }));
                        return;
                    }

                    if (msg.event === 'pusher:connection_established') {
                        Logger.platform('kick', 'Conexão Pusher estabelecida');
                        return;
                    }

                    const eventData = msg.data ? JSON.parse(msg.data) : {};

                    switch (msg.event) {
                        case 'App\\Events\\ChatMessageEvent':
                            chatService.processKickMessage(eventData);
                            break;
                        case 'App\\Events\\SubscriptionEvent':
                            alertService.processSubscription('kick', eventData.username, {
                                months: eventData.months
                            });
                            break;
                        case 'App\\Events\\GiftedSubscriptionsEvent':
                            alertService.processGiftSubscription('kick', eventData.gifter_username, {
                                count: eventData.gifted_usernames.length
                            });
                            break;
                    }
                } catch (err) {
                    Logger.warn('Erro ao processar mensagem Kick (não crítico):', { error: err.message });
                }
            });

            ws.on('close', (code, reason) => {
                clearTimeout(connectTimeout);
                Logger.warn('Kick WebSocket fechado:', { code, reason: reason.toString(), channel });

                socketManager.emitToSocket(socket.id, 'platform-disconnected', {
                    platform: 'kick',
                    code,
                    reason: reason.toString()
                });

                const clientStillConnected = io.sockets.sockets.has(socket.id);
                if (clientStillConnected && retryAttempt < 3) {
                    connectionHandler.scheduleRetry(
                        socket.id,
                        'kick',
                        () => connectKickChatRobust(socket, channel, retryAttempt + 1)
                    );
                }
            });

            ws.on('error', (error) => {
                clearTimeout(connectTimeout);
                Logger.error('Kick WebSocket error:', { error: error.message, channel });
                reject(new PlatformError(`WebSocket error: ${error.message}`, 'kick', 'websocket'));
            });
        });

    } catch (error) {
        if (retryAttempt < 3) {
            Logger.warn(`Tentativa ${retryAttempt + 1} falhou, agendando retry...`, { error: error.message });
            connectionHandler.scheduleRetry(
                socket.id,
                'kick',
                () => connectKickChatRobust(socket, channel, retryAttempt + 1)
            );
        } else {
            throw new PlatformError(`Falha na conexão Kick após ${retryAttempt + 1} tentativas: ${error.message}`, 'kick', 'connect');
        }
    }
}

// ===============================
// FUNÇÕES AUXILIARES ROBUSTAS
// ===============================

function closeConnections(clientId) {
    const kickWS = kickConnections.get(clientId);
    if (kickWS && (kickWS.readyState === WebSocket.OPEN || kickWS.readyState === WebSocket.CONNECTING)) {
        kickWS.close();
    }
    kickConnections.delete(clientId);

    const twitchClient = twitchConnections.get(clientId);
    if (twitchClient) {
        try {
            twitchClient.disconnect();
        } catch (error) {
            Logger.warn('Erro ao desconectar cliente Twitch:', { error: error.message });
        }
    }
    twitchConnections.delete(clientId);
}

async function getKickChannelInfo(channel) {
    if (!channel) return null;

    const url = `https://kick.com/api/v2/channels/${channel.toLowerCase()}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Status da resposta: ${response.status} ${response.statusText}`);
        }
        return response.json();
    } catch (error) {
        clearTimeout(timeoutId);
        throw new NetworkError(`Erro ao buscar informações do canal Kick "${channel}": ${error.message}`, url);
    }
}

async function fetchAndFormatKickBadges(channelName) {
    try {
        const channelInfo = await getKickChannelInfo(channelName);
        if (!channelInfo) return {};

        const formattedBadges = {};
        if (channelInfo.subscriber_badges && Array.isArray(channelInfo.subscriber_badges)) {
            channelInfo.subscriber_badges.forEach(badge => {
                const key = `subscriber-${badge.months}`;
                if (badge.badge_image) {
                    formattedBadges[key] = badge.badge_image.src;
                }
            });
        }
        Logger.platform('kick', `Badges formatados para "${channelName}"`, { count: Object.keys(formattedBadges).length });
        return formattedBadges;
    } catch (error) {
        throw new PlatformError(`Falha ao buscar badges Kick: ${error.message}`, 'kick', 'fetchBadges');
    }
}

async function fetchAndFormatTwitchBadges(channel) {
    if (!apiClient) {
        throw new PlatformError('API Client Twitch não inicializado', 'twitch', 'fetchBadges');
    }

    try {
        const user = await apiClient.users.getUserByName(channel);
        if (!user) {
            throw new PlatformError(`Usuário Twitch "${channel}" não encontrado`, 'twitch', 'fetchBadges');
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

        Logger.platform('twitch', `Badges formatados para "${channel}"`, { count: badgeMap.size });
        return Object.fromEntries(badgeMap);
    } catch (error) {
        throw new PlatformError(`Falha ao buscar badges Twitch: ${error.message}`, 'twitch', 'fetchBadges');
    }
}

// ===============================
// ROTAS
// ===============================

app.post('/disconnect-self', (req, res) => {
    const clientId = req.query.id;
    Logger.info(`Desconexão solicitada para cliente: ${clientId}`);

    if (!clientId) {
        return res.status(400).json({ error: 'ID do cliente não informado' });
    }

    connectionHandler.clearRetries(clientId);
    closeConnections(clientId);

    const socket = io.sockets.sockets.get(clientId);
    if (socket) {
        socket.disconnect(true);
    }

    res.json({ status: 'ok', message: `Conexões do cliente ${clientId} encerradas` });
});

app.post('/test/start-mock', (req, res) => testController.startMock(req, res));
app.post('/test/stop-mock', (req, res) => testController.stopMock(req, res));
app.get('/test/status', (req, res) => testController.getMockStatus(req, res));
app.post('/test/generate/:type/:platform', (req, res) => testController.generateSpecificEvent(req, res));

app.get('/health', async (req, res) => {
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        services: {
            twitch: !!apiClient,
            kick: true, 
            emotes: !!fetcher,
            mock: mockService.getStatus().isRunning
        },
        connections: {
            sockets: io.sockets.sockets.size,
            twitch: twitchConnections.size,
            kick: kickConnections.size
        }
    };

    res.json(health);
});

process.on('uncaughtException', (error) => {
    Logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
});

process.on('unhandledRejection', (reason, promise) => {
    Logger.error('Unhandled Promise Rejection:', { reason, promise });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    Logger.info(`🚀 Servidor Robusto rodando em http://localhost:${PORT}`);
    Logger.info(`📊 Modo: ${process.env.NODE_ENV || 'development'}`);
    Logger.info(`🔗 CORS Origins: ${allowedOrigins.join(', ')}`);
    Logger.info(`✅ Health check disponível em: http://localhost:${PORT}/health`);
});