<template>
  <div class="chat-message" :class="{ 'self-message': isSelf }">
    <img
      v-if="platform === 'twitch'"
      src="../assets/twitch-icon.svg"
      class="platform-logo"
    />
    <img
      v-else-if="platform === 'kick'"
      src="../assets/kick-icon.svg"
      class="platform-logo"
    />

    <span class="username" :style="{ color: color }">{{ user }}:</span>
    <span class="message-text">{{ text }}</span>
  </div>
</template>

<script setup>
defineProps({
  user: String,
  text: String,
  color: String,
  platform: String,
  isSelf: Boolean 
});
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
  color: #dadada;
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
