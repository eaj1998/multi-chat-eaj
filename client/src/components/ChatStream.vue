<template>
  <div class="chat-stream">
    <ChatHeader
      :title="title"
      :kickConnected="kickConnected"
      :twitchConnected="twitchConnected"
      :kickUsername="kickUsername"
      :twitchUsername="twitchUsername"
    />
    <ChatMessages :messages="messages" />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import ChatHeader from './ChatHeader.vue';
import ChatMessages from './ChatMessages.vue';

defineProps({
  title: String,
  kickConnected: Boolean,
  twitchConnected: Boolean,
  kickUsername: String,
  twitchUsername: String
});

const messages = ref([]);

function addMessage(msg) {
  messages.value.push({
    user: `[${msg.platform.toUpperCase()}] ${msg.username}`,
    text: msg.message,
    color: getColorForPlatform(msg.platform),
  });

  if (messages.value.length > 100) {
    messages.value.splice(0, messages.value.length - 100);
  }
}

function getColorForPlatform(platform) {
  return {
    twitch: '#9147ff',
    youtube: '#ff0000',
    kick: '#43e660',
  }[platform] || '#dadada';
}

let onChatMessage = (event) => {
  addMessage(event.detail);
};

onMounted(() => {
  window.addEventListener('chat-message', onChatMessage);
});

onBeforeUnmount(() => {
  window.removeEventListener('chat-message', onChatMessage);
});

</script>

<style scoped>
.chat-stream {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  background-color: #1e1e1e;
  overflow: hidden;
  border: 1px solid #36363a;
}
</style>
