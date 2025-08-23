<template>
  <div class="chat-message" :class="{ 'self-message': props.isSelf }">

    <img v-if="props.platform === 'twitch' && props.isDarkMode" src="../assets/twitch-icon.svg" class="platform-logo" />
    <img v-else-if="props.platform === 'twitch' && !props.isDarkMode" src="../assets/twitch-icon-white.svg"
      class="platform-logo" />

    <img v-else-if="props.platform === 'kick'" src="../assets/kick-icon.svg" class="platform-logo" />

    <span v-if="userBadges.length > 0" class="badges-container">
      <img v-for="badgeUrl in userBadges" :key="badgeUrl" :src="badgeUrl" class="chat-badge" />
    </span>
    <span class="username" :style="{ color: props.color }">{{ props.user }}:</span>
    <span class="message-text" v-html="renderMessage(props.text, props.platform)"></span>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';


onMounted(() => {
  console.log('UserBADGES KICK?', props.userBadgesData);

});

const props = defineProps({
  user: String,
  text: String,
  color: String,
  platform: String,
  isSelf: Boolean,
  isDarkMode: Boolean,
  channelBadges: Object,
  userBadgesData: Object,
});

const userBadges = computed(() => {
  if (!props.userBadgesData || !props.channelBadges) {
    return [];
  }

  if (props.platform === 'twitch') {
    const twitchBadgeSets = props.channelBadges.twitch || {};
    if (typeof props.userBadgesData !== 'object' || props.userBadgesData === null) {
        return [];
    }

    return Object.entries(props.userBadgesData)
      .map(([badgeName, badgeVersion]) => {
        const lookupKey = `${badgeName}/${badgeVersion}`;
        return twitchBadgeSets[lookupKey]; 
      })
      .filter(url => url); 
  }

  if (props.platform === 'kick') {
    const kickSubBadges = props.channelBadges.kick || {};
     if (!Array.isArray(props.userBadgesData)) {
        return [];
    }
    
    return props.userBadgesData
      .map(badge => {
        const type = badge.type;
        
        if (type === 'subscriber' && badge.count) {
          const availableSubTiers = Object.keys(kickSubBadges)
            .filter(k => k.startsWith('subscriber-'))
            .map(k => parseInt(k.split('-')[1]))
            .sort((a, b) => a - b);
          
          let bestFitMonth = 0;
          for (const monthTier of availableSubTiers) {
            if (badge.count >= monthTier) bestFitMonth = monthTier;
            else break;
          }

          if (bestFitMonth > 0) {
            const lookupKey = `subscriber-${bestFitMonth}`;
            return kickSubBadges[lookupKey];
          }
          return null;
        }
        
        return `/badges/kick/${type}.svg`;
      })
      .filter(url => url);
  }

  return [];
});

const emoteProviders = {
  twitch: (id) => `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/1.0`,
  kick: (id) => `https://files.kick.com/emotes/${id}/fullsize`,
  bttv: (id) => `https://cdn.betterttv.net/emote/${id}/1x`,
  ffz: (id) => `https://cdn.frankerfacez.com/emoticon/${id}/1`,
  seventv: (id) => `https://cdn.7tv.app/emote/${id}/1x.webp`
}

function renderMessage(message, platform) {
  console.log('message', message);

  if (!message) return "";
  if (platform == 'twitch')
    return message;

  let parsed = message;
  console.log(parsed);

  parsed = parsed.replace(/\[emote:([^:]+):([^\]]+)\]/g, (match, id, name) => {
    if (emoteProviders[platform]) {
      const url = emoteProviders[platform](id);
      return `<img src="${url}" class="emote" />`;
    }
  });

  return parsed;
}


</script>

<style scoped>
.chat-badge {
  width: 18px;
  height: 18px;
  margin-right: 2px;
  vertical-align: middle;
}

.badges-container {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-right: 5px;
}

.chat-badge {
  width: 18px;
  height: 18px;
  vertical-align: middle;
}

.chat-message {
  display: flex;
  align-items: baseline;
  gap: 6px;
  line-height: 1.5;
  font-size: 0.9rem;
  animation: fadeIn 0.3s ease-in-out;
}

.platform-logo {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.username {
  font-weight: 700;
  white-space: nowrap;
}

.message-text {
  color: var(--text-color-secondary);
  word-break: break-word;
}


@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

<style>
.emote {
  height: 28px;
  width: auto;
  vertical-align: middle;
  display: inline-block;
}
</style>
