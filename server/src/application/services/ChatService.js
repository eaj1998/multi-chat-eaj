import { ChatMessage } from '../../core/entities/ChatMessage.js';
import { Logger } from '../../shared/utils/Logger.js';
import { EVENT_TYPES } from '../../shared/constants/Platforms.js';

export class ChatService {
    constructor(emoteParser, socketManager) {
        this.emoteParser = emoteParser;
        this.socketManager = socketManager;
    }

    async processTwitchMessage(tags, message) {
        try {
            const parsedMessage = this.emoteParser.parse(message);

            const chatMessage = ChatMessage.fromTwitch(tags, parsedMessage);

            if (chatMessage.isValid()) {
                this.socketManager.broadcast(EVENT_TYPES.CHAT_MESSAGE, chatMessage.toSocketData());

                Logger.platform('twitch', `Mensagem processada: ${chatMessage.username}`);
            }
        } catch (error) {
            Logger.error('Erro ao processar mensagem Twitch', { error: error.message });
        }
    }

    async processKickMessage(eventData) {
        try {
            const chatMessage = ChatMessage.fromKick(eventData);

            if (chatMessage.isValid()) {
                this.socketManager.broadcast(EVENT_TYPES.CHAT_MESSAGE, chatMessage.toSocketData());

                Logger.platform('kick', `Mensagem processada: ${chatMessage.username}`);
            }
        } catch (error) {
            Logger.error('Erro ao processar mensagem Kick', { error: error.message });
        }
    }
}