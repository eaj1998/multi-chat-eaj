<template>
  <div class="chat-stream">
    <ChatHeader :title="title" :kickConnected="kickConnected" :twitchConnected="twitchConnected"
      :kickUsername="kickUsername" :twitchUsername="twitchUsername" />
    <ChatMessages :messages="messages" :isDarkMode="isDarkMode" />
  </div>
</template>

<script setup>
import ChatHeader from './ChatHeader.vue';
import ChatMessages from './ChatMessages.vue';

defineProps({
  messages: Array,
  title: String,
  kickConnected: Boolean,
  twitchConnected: Boolean,
  kickUsername: String,
  twitchUsername: String,
  isDarkMode: Boolean,
});

// const messages = ref([]);

// function addMessage(msg) {
//   messages.value.push({
//     user: `${msg.username}`,
//     text: msg.message,
//     color: msg.color,
//     platform: msg.platform
//   });

//   if (messages.value.length > 100) {
//     messages.value.splice(0, messages.value.length - 100);
//   }
// }

// let onChatMessage = (event) => {
//   addMessage(event.detail);
// };

// onMounted(() => {
//   window.addEventListener('chat-message', onChatMessage);
// });

// onBeforeUnmount(() => {
//   window.removeEventListener('chat-message', onChatMessage);
// });

</script>

<style scoped>
.chat-stream {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--bg-color-secondary);
  border: 1px solid var(--border-color);
}
</style>
