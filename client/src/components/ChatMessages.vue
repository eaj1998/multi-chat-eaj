<template>
  <div class="chat-messages" ref="container">
    <template v-if="props.messages.length > 0">
      <div v-for="item in props.messages" :key="item.id">
        <ChatMessage v-if="item.type === 'chat'" :user="item.data.username" :text="item.data.message"
          :color="item.data.color" :platform="item.data.platform" :isSelf="false" :isDarkMode="props.isDarkMode" :channelBadges="props.channelBadges"  :userBadgesData="item.data.badges" />
        <AlertMessage v-else-if="item.type === 'alert'" :alert="item.data" />
      </div>
    </template>
    <template v-else>
      <div class="text-center text-gray-500 mt-10">Nenhuma mensagem ainda.</div>
    </template>
  </div>
</template>

<script setup>
import { watch, ref, nextTick } from 'vue';
import ChatMessage from './ChatMessage.vue';
import AlertMessage from './AlertMessage.vue';

const props = defineProps({ messages: Array, isDarkMode: Boolean, channelBadges: Object });
const container = ref(null);

watch(() => props.messages, async (newMessages) => {
  const el = container.value;
  if (!el) return;

  // Passo 1: Verifica se o usuário estava perto do fundo ANTES da atualização do DOM.
  // Usamos um buffer maior para garantir que mesmo durante uma animação de 'smooth' de outra fonte, ele ainda funcione.
  const buffer = 100; 
  const isScrolledToBottom = el.scrollHeight - el.clientHeight <= el.scrollTop + buffer;

  // Passo 2: Espera o Vue renderizar a nova mensagem e o DOM ser atualizado.
  await nextTick();

  // Passo 3: Se o usuário ESTAVA no fundo, força a rolagem para o novo final.
  if (isScrolledToBottom || newMessages.length <= 1) { // Também força na primeira mensagem
    el.scrollTop = el.scrollHeight; // Rolagem instantânea
  }
}, { deep: true });

// watch(() => props.messages, async (newMessages, oldMessages) => {
//   if (!oldMessages || oldMessages.length === 0) {
//     await nextTick();
//     setTimeout(() => {
//       container.value?.scrollTo({
//         top: container.value.scrollHeight,
//         behavior: "smooth"
//       });
//     }, 50);
//     return;
//   }

//   const el = container.value;
//   if (!el) return;

//   const buffer = 30;
//   const isScrolledToBottom = el.scrollHeight - el.clientHeight <= el.scrollTop + buffer;

//   await nextTick();

//   if (isScrolledToBottom) {
//     setTimeout(() => {
//       el.scrollTo({
//         top: el.scrollHeight,
//         behavior: "smooth"
//       });
//     }, 50);
//   }
// }, { deep: true });

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
