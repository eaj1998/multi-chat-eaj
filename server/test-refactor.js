import { Logger } from './src/shared/utils/Logger.js';
import { PLATFORMS, EVENT_TYPES } from './src/shared/constants/Platforms.js';
import { ChatMessage } from './src/core/entities/ChatMessage.js';

console.log('🧪 Testando a nova base...\n');

// Teste 1: Logger
Logger.info('Sistema iniciado');
Logger.platform('twitch', 'Testando logs de plataforma');

// Teste 2: Constantes
Logger.info('Plataformas:', { platforms: Object.values(PLATFORMS) });

// Teste 3: ChatMessage
const mockTwitchTags = {
    'display-name': 'TestUser',
    'color': '#FF0000',
    'badges': { subscriber: '12' }
};

const twitchMessage = ChatMessage.fromTwitch(mockTwitchTags, 'Hello World!');
Logger.info('Twitch message criada:', {
    valid: twitchMessage.isValid(),
    data: twitchMessage.toSocketData()
});

const mockKickData = {
    sender: {
        username: 'KickUser',
        identity: {
            color: '#00FF00',
            badges: [{ type: 'subscriber', count: 6 }]
        }
    },
    content: 'Oi do Kick!'
};

const kickMessage = ChatMessage.fromKick(mockKickData);
Logger.info('Kick message criada:', {
    valid: kickMessage.isValid(),
    data: kickMessage.toSocketData()
});

console.log('\n✅ Base funcionando! Podemos continuar com a refatoração.');