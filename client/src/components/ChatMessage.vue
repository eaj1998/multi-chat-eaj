<template>
  <div class="chat-message">
    <span class="username" :style="{ color: color }">{{ user }}:</span>
    <span class="message-text">{{ text }}</span>
  </div>
</template>

<script setup>
defineProps({
  user: String,
  text: String,
  color: String
});
</script>

<style scoped>
.chat-message {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  text-align: left;
  line-height: 1.5;
  font-size: 0.9rem;
  animation: fadeIn 0.3s ease-in-out;
  word-wrap: break-word;
}

.username {
  font-weight: 700;
  margin-right: 6px;
}
.message-text {
  color: #dadada;
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
