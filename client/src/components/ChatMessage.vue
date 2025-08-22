<template>
  <div class="chat-message" :class="{ 'self-message': isSelf }">
    <img v-if="platform === 'twitch' && isDarkMode" src="../assets/twitch-icon.svg" class="platform-logo" />
    <img v-else-if="platform === 'twitch' && !isDarkMode" src="../assets/twitch-icon-white.svg" class="platform-logo" />

    <img v-else-if="platform === 'kick'" src="../assets/kick-icon.svg" class="platform-logo" />

    <span class="username" :style="{ color: color }">{{ user }}:</span>
    <span class="message-text" v-html="renderMessage(text, platform)"></span>
  </div>
</template>

<script setup>
defineProps({
  user: String,
  text: String,
  color: String,
  platform: String,
  isSelf: Boolean,
  isDarkMode: Boolean
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

    return name;
  });

  return parsed;
}


</script>

<style scoped>
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
