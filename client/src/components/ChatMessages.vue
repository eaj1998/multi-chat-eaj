<template>
  <div class="chat-messages" ref="container">
    <template v-if="messages.length > 0">
      <ChatMessage v-for="(msg, i) in messages" :key="i" :user="msg.user" :text="msg.text" :color="msg.color"
        :platform="msg.platform" :isSelf="false" />
    </template>
    <template v-else>
      <div class="text-center text-gray-500 mt-10">Nenhuma mensagem ainda.</div>
    </template>
  </div>
</template>


<script setup>
import { watch, ref, nextTick } from 'vue';
import ChatMessage from './ChatMessage.vue';

const props = defineProps({ messages: Array });
const container = ref(null);

watch(() => props.messages, async (newMessages, oldMessages) => {
  if (!oldMessages || oldMessages.length === 0) {
    await nextTick();
    setTimeout(() => {
      container.value?.scrollTo({
        top: container.value.scrollHeight,
        behavior: "smooth"
      });
    }, 50);
    return;
  }

  const el = container.value;
  if (!el) return;

  const buffer = 30;
  const isScrolledToBottom = el.scrollHeight - el.clientHeight <= el.scrollTop + buffer;

  await nextTick();

  if (isScrolledToBottom) {
    setTimeout(() => {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: "smooth"
      });
    }, 50);
  }
}, { deep: true });

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
  background: #46464a;
  border-radius: 4px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #5a5a5e;
}
</style>
