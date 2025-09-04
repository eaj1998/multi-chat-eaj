import { ALERT_TYPES } from '../../shared/constants/Platforms.js';

export class Alert {
    constructor({ platform, type, username, timestamp, metadata = {} }) {
        this.platform = platform;
        this.type = type;
        this.username = username;
        this.timestamp = timestamp;
        this.metadata = metadata;
    }

    isValid() {
        return this.platform && this.type && this.username;
    }

    toSocketData() {
        return {
            platform: this.platform,
            type: this.type,
            username: this.username,
            timestamp: this.timestamp,
            ...this.metadata
        };
    }

    static createSubscription(platform, username, metadata = {}) {
        return new Alert({
            platform,
            type: ALERT_TYPES.SUB,
            username,
            timestamp: Date.now(),
            metadata: {
                tier: metadata.tier || 'Tier 1',
                message: metadata.message || `${username} acabou de se inscrever!`,
                ...metadata
            }
        });
    }

    static createResubscription(platform, username, months, metadata = {}) {
        return new Alert({
            platform,
            type: ALERT_TYPES.RESUB,
            username,
            timestamp: Date.now(),
            metadata: {
                months,
                tier: metadata.tier || 'Tier 1',
                message: metadata.message || `${username} se inscreveu por ${months} meses!`,
                ...metadata
            }
        });
    }

    static createGiftSubscription(platform, username, metadata = {}) {
        return new Alert({
            platform,
            type: ALERT_TYPES.GIFTSUB,
            username,
            timestamp: Date.now(),
            metadata: {
                count: metadata.count || 1,
                tier: metadata.tier || 'Tier 1',
                recipient: metadata.recipient,
                message: metadata.message || `${username} presenteou ${metadata.count || 1} subs!`,
                ...metadata
            }
        });
    }

    static createSingleGiftSub(platform, username, recipient, metadata = {}) {
        return new Alert({
            platform,
            type: ALERT_TYPES.GIFTSUB_SINGLE,
            username,
            timestamp: Date.now(),
            metadata: {
                recipient,
                tier: metadata.tier || 'Tier 1',
                message: metadata.message || `${username} presenteou uma inscrição para ${recipient}!`,
                ...metadata
            }
        });
    }
}