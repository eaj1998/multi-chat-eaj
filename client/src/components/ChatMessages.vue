<template>
  <div class="chat-messages" ref="container">
    <template v-if="props.messages.length > 0">
      <div v-for="item in props.messages" :key="item.id">
        <ChatMessage v-if="item.type === 'chat'" :user="item.data.username" :text="item.data.message"
          :color="item.data.color" :platform="item.data.platform" :isSelf="false" :isDarkMode="props.isDarkMode"
          :channelBadges="props.channelBadges" :userBadgesData="item.data.badges" />
        <AlertMessage v-else-if="item.type === 'alert'" :alert="item.data" />
      </div>
    </template>
    <template v-else>
      <div class="text-center text-gray-500 mt-10">Nenhuma mensagem ainda.</div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import ChatMessage from './ChatMessage.vue';
import AlertMessage from './AlertMessage.vue';

const props = defineProps({ messages: Array, isDarkMode: Boolean, channelBadges: Object });
const container = ref(null);
let observer = null;

onMounted(() => {
  const el = container.value;
  if (!el) return;

  const scrollToBottom = () => {
    el.scrollTop = el.scrollHeight;
  };

  scrollToBottom();

  observer = new MutationObserver((mutations) => {
    const buffer = 100;
    const isScrolledToBottom = el.scrollHeight - el.clientHeight <= el.scrollTop + buffer;

    if (isScrolledToBottom) {
      scrollToBottom();
    }
  });

  observer.observe(el, { childList: true });
});

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
  }
});
</script>

<style scoped>
.chat-messages {
  flex-grow: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;

  -webkit-overflow-scrolling: touch;
}

.chat-messages::-webkit-scrollbar {
  width: 8px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
  /* background: #46464a; */
  border-radius: 4px;
}
</style>
