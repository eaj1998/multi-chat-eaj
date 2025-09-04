export class ChatMessage {
    constructor({ platform, username, message, color, badges, timestamp }) {
        this.platform = platform;
        this.username = username;
        this.message = message;
        this.color = color;
        this.badges = badges || {};
        this.timestamp = timestamp;
    }

    isValid() {
        return this.platform && this.username && this.message;
    }

    toSocketData() {
        return {
            platform: this.platform,
            username: this.username,
            color: this.color,
            badges: this.badges,
            message: this.message,
            timestamp: this.timestamp
        };
    }

    static fromTwitch(tags, parsedMessage) {
        return new ChatMessage({
            platform: 'twitch',
            username: tags['display-name'],
            message: parsedMessage,
            color: tags['color'],
            badges: tags['badges'],
            timestamp: Date.now()
        });
    }

    static fromKick(eventData) {
        return new ChatMessage({
            platform: 'kick',
            username: eventData.sender.username,
            message: eventData.content,
            color: eventData.sender.identity.color,
            badges: eventData.sender.identity.badges,
            timestamp: Date.now()
        });
    }
}