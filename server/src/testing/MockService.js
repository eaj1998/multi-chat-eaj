import { MockDataGenerator } from './MockDataGenerator.js';
import { Logger } from '../shared/utils/Logger.js';
import { EVENT_TYPES } from '../shared/constants/Platforms.js';

export class MockService {
    constructor(socketManager) {
        this.socketManager = socketManager;
        this.generator = new MockDataGenerator();
        this.interval = null;
        this.isRunning = false;
        this.config = {
            interval: 2000,
            chatWeight: 0.7, // 70% chat, 30% alerts
            burstMode: false,
            platforms: ['twitch', 'kick']
        };
    }

    start(config = {}) {
        if (this.isRunning) {
            this.stop();
        }

        this.config = { ...this.config, ...config };

        Logger.info(`🧪 Iniciando sistema de mock`, {
            interval: this.config.interval,
            chatWeight: this.config.chatWeight,
            burstMode: this.config.burstMode
        });

        this.isRunning = true;
        this.interval = setInterval(() => {
            this.generateEvent();
        }, this.config.interval);

        return {
            status: 'started',
            config: this.config
        };
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.isRunning = false;

        Logger.info('🛑 Sistema de mock parado');

        return {
            status: 'stopped'
        };
    }

    generateEvent() {
        try {
            if (Math.random() < this.config.chatWeight) {
                this.generateChatMessage();
            } else {
                this.generateAlert();
            }

            if (this.config.burstMode && Math.random() < 0.1) {
                setTimeout(() => {
                    this.generateChatMessage();
                    setTimeout(() => this.generateAlert(), 200);
                }, 100);
            }
        } catch (error) {
            Logger.error('Erro ao gerar evento mock', { error: error.message });
        }
    }

    generateChatMessage() {
        const chatMessage = this.generator.generateChatMessage();

        if (chatMessage.isValid()) {
            this.socketManager.broadcast(EVENT_TYPES.CHAT_MESSAGE, chatMessage.toSocketData());
            Logger.platform(chatMessage.platform, `MOCK CHAT: ${chatMessage.username}: ${chatMessage.message.substring(0, 30)}...`);
        }
    }

    generateAlert() {
        const alert = this.generator.generateAlert();

        if (alert.isValid()) {
            this.socketManager.broadcast(EVENT_TYPES.ALERT_MESSAGE, alert.toSocketData());
            Logger.platform(alert.platform, `MOCK ALERT: ${alert.type.toUpperCase()} - ${alert.username}`);
        }
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            config: this.config,
            uptime: this.isRunning ? Date.now() : 0
        };
    }

    generateSpecificEvent(type, platform, options = {}) {
        try {
            switch (type) {
                case 'chat':
                    const chatMessage = platform === 'twitch'
                        ? this.generateTwitchChat(options)
                        : this.generateKickChat(options);

                    this.socketManager.broadcast(EVENT_TYPES.CHAT_MESSAGE, chatMessage.toSocketData());
                    return chatMessage.toSocketData();

                case 'sub':
                case 'resub':
                case 'giftsub':
                    const alert = this.generateSpecificAlert(type, platform, options);
                    this.socketManager.broadcast(EVENT_TYPES.ALERT_MESSAGE, alert.toSocketData());
                    return alert.toSocketData();

                default:
                    throw new Error(`Tipo de evento desconhecido: ${type}`);
            }
        } catch (error) {
            Logger.error('Erro ao gerar evento específico', { error: error.message, type, platform });
            throw error;
        }
    }

    generateTwitchChat(options = {}) {
        const mockTags = {
            'display-name': options.username || this.generator.getRandomElement(this.generator.usernames),
            'color': options.color || this.generator.getRandomElement(this.generator.colors),
            'badges': options.badges || this.generator.generateRandomBadges('twitch')
        };

        return ChatMessage.fromTwitch(mockTags, options.message || this.generator.getRandomElement(this.generator.messages));
    }

    generateKickChat(options = {}) {
        const mockEventData = {
            sender: {
                username: options.username || this.generator.getRandomElement(this.generator.usernames),
                identity: {
                    color: options.color || this.generator.getRandomElement(this.generator.colors),
                    badges: options.badges || this.generator.generateRandomBadges('kick')
                }
            },
            content: options.message || this.generator.getRandomElement(this.generator.messages)
        };

        return ChatMessage.fromKick(mockEventData);
    }

    generateSpecificAlert(type, platform, options = {}) {
        const username = options.username || this.generator.getRandomElement(this.generator.usernames);

        switch (type) {
            case 'sub':
                return Alert.createSubscription(platform, username, options);
            case 'resub':
                return Alert.createResubscription(platform, username, options.months || 6, options);
            case 'giftsub':
                return Alert.createGiftSubscription(platform, username, { count: options.count || 5, ...options });
            default:
                return Alert.createSubscription(platform, username, options);
        }
    }
}