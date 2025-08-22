<template>
  <div class="alert-message" :class="alertClasses">
    <span>{{ messageText }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  alert: Object // Recebe o objeto completo do alerta
});

const alertClasses = computed(() => ({
  'platform-twitch': props.alert.platform === 'twitch',
  'platform-kick': props.alert.platform === 'kick',
  'type-sub': props.alert.type.includes('sub'),
  'type-gift': props.alert.type.includes('gift'),
}));

const messageText = computed(() => {
  const { type, username, months, count, recipient, tier } = props.alert;
  switch (type) {
    case 'sub':
      return `⭐ ${username} acabou de se inscrever (${tier})!`;
    case 'resub':
      return `⭐ ${username} se inscreveu por ${months} meses (${tier})!`;
    case 'giftsub_community':
      return `🎁 ${username} presenteou ${count} inscrições para a comunidade!`;
    case 'giftsub_single':
       return `🎁 ${username} presenteou uma inscrição para ${recipient}!`;
    case 'kick_sub': // Exemplo para Kick
       return `⭐ ${username} assinou por ${months} meses!`;
    case 'kick_giftsub': // Exemplo para Kick
       return `🎁 ${username} presenteou ${count} subs!`;
    default:
      return `${username} ${props.alert.message}`;
  }
});
</script>

<style scoped>
.alert-message {
  padding: 8px 12px;
  border-radius: 6px;
  font-weight: 600;
  text-align: center;
  font-size: 0.85rem;
  border-left: 4px solid;
  animation: fadeIn 0.3s ease-in-out;
  color: #f0f0f0;
}
.platform-twitch {
  background-color: #3a2f4d;
  border-left-color: #a970ff;
}
.platform-kick {
  background-color: #164024; 
  border-left-color: #53fc18;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>