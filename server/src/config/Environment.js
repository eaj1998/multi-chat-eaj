import { Logger } from '../shared/utils/Logger.js';

export class Environment {
    static validate() {
        const required = [
            'TWITCH_USERNAME',
            'TWITCH_OAUTH_TOKEN',
            'TWITCH_SECRET',
            'TWITCH_ID'
        ];

        const missing = required.filter(env => !process.env[env]);

        if (missing.length > 0) {
            Logger.error('❌ Variáveis de ambiente obrigatórias não encontradas:', { missing });
            return false;
        }
        
        if (!process.env.TWITCH_OAUTH_TOKEN.startsWith('oauth:')) {
            Logger.warn('⚠️ TWITCH_OAUTH_TOKEN deve começar com "oauth:"');
        }

        Logger.info('✅ Variáveis de ambiente validadas');
        return true;
    }

    static async checkConnectivity() {
        const [hasInternet, canReachTwitch, canReachKick] = await Promise.allSettled([
            this.checkInternetConnection(),
            this.checkTwitchAPI(),
            this.checkKickAPI()
        ]);

        return {
            hasInternet: hasInternet.status === 'fulfilled' ? hasInternet.value : false,
            canReachTwitch: canReachTwitch.status === 'fulfilled' ? canReachTwitch.value : false,
            canReachKick: canReachKick.status === 'fulfilled' ? canReachKick.value : false
        };
    }

    static async checkInternetConnection() {
        try {
            const response = await fetch('https://www.google.com', {
                method: 'HEAD',
                signal: AbortSignal.timeout(5000)
            });
            return response.ok;
        } catch (error) {
            Logger.warn('⚠️ Sem conexão com internet detectada');
            return false;
        }
    }

    static async checkTwitchAPI() {
        try {
            const response = await fetch('https://api.twitch.tv/helix/users', {
                method: 'HEAD',
                signal: AbortSignal.timeout(5000)
            });
            return true;
        } catch (error) {
            Logger.warn('⚠️ API da Twitch inacessível:', { error: error.message });
            return false;
        }
    }

    static async checkKickAPI() {
        try {
            const response = await fetch('https://kick.com/api/v2/ping', {
                signal: AbortSignal.timeout(5000)
            });
            return true;
        } catch (error) {
            Logger.warn('⚠️ API do Kick inacessível:', { error: error.message });
            return false;
        }
    }
}