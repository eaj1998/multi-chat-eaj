import { Alert } from '../../core/entities/Alert.js';
import { Logger } from '../../shared/utils/Logger.js';
import { EVENT_TYPES } from '../../shared/constants/Platforms.js';

export class AlertService {
    constructor(socketManager) {
        this.socketManager = socketManager;
    }

    processSubscription(platform, username, metadata = {}) {
        try {
            const alert = Alert.createSubscription(platform, username, metadata);

            if (alert.isValid()) {
                this.socketManager.broadcast(EVENT_TYPES.ALERT_MESSAGE, alert.toSocketData());
                Logger.platform(platform, `SUB: ${username}`, { tier: metadata.tier });
            }
        } catch (error) {
            Logger.error('Erro ao processar subscription', { error: error.message, platform, username });
        }
    }

    processResubscription(platform, username, months, metadata = {}) {
        try {
            const alert = Alert.createResubscription(platform, username, months, metadata);

            if (alert.isValid()) {
                this.socketManager.broadcast(EVENT_TYPES.ALERT_MESSAGE, alert.toSocketData());
                Logger.platform(platform, `RESUB: ${username} - ${months} meses`, { tier: metadata.tier });
            }
        } catch (error) {
            Logger.error('Erro ao processar resubscription', { error: error.message, platform, username });
        }
    }

    processGiftSubscription(platform, username, metadata = {}) {
        try {
            const alert = Alert.createGiftSubscription(platform, username, metadata);

            if (alert.isValid()) {
                this.socketManager.broadcast(EVENT_TYPES.ALERT_MESSAGE, alert.toSocketData());
                Logger.platform(platform, `GIFT SUB: ${username} - ${metadata.count || 1} subs`);
            }
        } catch (error) {
            Logger.error('Erro ao processar gift subscription', { error: error.message, platform, username });
        }
    }

    processSingleGiftSub(platform, username, recipient, metadata = {}) {
        try {
            const alert = Alert.createSingleGiftSub(platform, username, recipient, metadata);

            if (alert.isValid()) {
                this.socketManager.broadcast(EVENT_TYPES.ALERT_MESSAGE, alert.toSocketData());
                Logger.platform(platform, `SINGLE GIFT: ${username} → ${recipient}`);
            }
        } catch (error) {
            Logger.error('Erro ao processar single gift sub', { error: error.message, platform, username });
        }
    }
}