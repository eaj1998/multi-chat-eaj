import { ChatMessage } from '../core/entities/ChatMessage.js';
import { Alert } from '../core/entities/Alert.js';
import { PLATFORMS, ALERT_TYPES } from '../shared/constants/Platforms.js';

export class MockDataGenerator {
  constructor() {
    this.usernames = [
      'lucasmahle', 'mikeColorado', 'GamerPro', 'SilentWatcher', 'StreamFan_123',
      'ProStreamer', 'ChatMaster', 'ViewerVIP', 'ModSquad', 'SubHero'
    ];

    this.messages = [
      'olá!', 'gg', 'top', '😂', 'brabo', 'isso foi incrível!',
      'Kappa', 'Vamos lá! Pog', 'Não acredito nisso LUL',
      'Que triste peppoSAD', 'Alguém mais viu isso? 7TV',
      'Este jogo é muito bom Pog', 'First!', 'Melhor streamer!',
      'Que jogada!', 'OMEGALUL', 'PogChamp', '5Head play'
    ];

    this.colors = [
      '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
      '#FFA500', '#800080', '#FFC0CB', '#A52A2A', '#808080', '#000080'
    ];
  }

  getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  getRandomPlatform() {
    return Math.random() > 0.5 ? PLATFORMS.TWITCH : PLATFORMS.KICK;
  }

  generateChatMessage() {
    const platform = this.getRandomPlatform();
    const username = this.getRandomElement(this.usernames);
    const message = this.getRandomElement(this.messages);
    
    if (platform === PLATFORMS.TWITCH) {
      const mockTags = {
        'display-name': username,
        'color': this.getRandomElement(this.colors),
        'badges': this.generateRandomBadges(platform)
      };
      return ChatMessage.fromTwitch(mockTags, message);
    } else {
      const mockEventData = {
        sender: {
          username,
          identity: {
            color: this.getRandomElement(this.colors),
            badges: this.generateRandomBadges(platform)
          }
        },
        content: message
      };
      return ChatMessage.fromKick(mockEventData);
    }
  }

  generateRandomBadges(platform) {
    const badges = {};
    
    if (platform === PLATFORMS.TWITCH) {
      if (Math.random() < 0.3) badges.subscriber = Math.floor(Math.random() * 24) + 1;
      if (Math.random() < 0.1) badges.moderator = '1';
      if (Math.random() < 0.05) badges.broadcaster = '1';
      if (Math.random() < 0.2) badges.vip = '1';
    } else {
      // Kick badges
      if (Math.random() < 0.3) {
        return [{ type: 'subscriber', count: Math.floor(Math.random() * 12) + 1 }];
      }
    }
    
    return badges;
  }

  generateAlert() {
    const platform = this.getRandomPlatform();
    const username = this.getRandomElement(this.usernames);
    const alertType = this.getRandomElement(Object.values(ALERT_TYPES));

    switch (alertType) {
      case ALERT_TYPES.SUB:
        return Alert.createSubscription(platform, username, {
          tier: this.getRandomElement(['Tier 1', 'Tier 2', 'Tier 3', 'Prime'])
        });

      case ALERT_TYPES.RESUB:
        return Alert.createResubscription(platform, username, Math.floor(Math.random() * 36) + 2, {
          tier: this.getRandomElement(['Tier 1', 'Tier 2', 'Tier 3', 'Prime'])
        });

      case ALERT_TYPES.GIFTSUB:
        return Alert.createGiftSubscription(platform, username, {
          count: this.getRandomElement([1, 5, 10, 20, 50]),
          tier: this.getRandomElement(['Tier 1', 'Tier 2', 'Tier 3'])
        });

      case ALERT_TYPES.GIFTSUB_SINGLE:
        return Alert.createSingleGiftSub(
          platform, 
          username, 
          this.getRandomElement(this.usernames), {
            tier: this.getRandomElement(['Tier 1', 'Tier 2', 'Tier 3'])
          }
        );

      default:
        return Alert.createSubscription(platform, username);
    }
  }

  generateMixedEvent() {
    // 70% chance de ser mensagem de chat, 30% de ser alert
    if (Math.random() < 0.7) {
      return {
        type: 'chat',
        data: this.generateChatMessage()
      };
    } else {
      return {
        type: 'alert',
        data: this.generateAlert()
      };
    }
  }
}