<template>
  <div class="chat-input-area">
    <input
      type="text"
      class="chat-input"
      placeholder="Send a message..."
      v-model="input"
      @keydown.enter="send"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
const emit = defineEmits(['sendMessage']);
const input = ref('');

function send() {
  if (input.value.trim() !== '') {
    emit('sendMessage', input.value.trim());
    input.value = '';
  }
}
</script>

<style scoped>
.chat-input-area {
  padding: 16px;
  border-top: 1px solid #36363a;
  background-color: #1f1f23;
}
.chat-input {
  width: 100%;
  background-color: #3a3a3d;
  border: 1px solid #46464a;
  border-radius: 6px;
  padding: 10px;
  color: #efeff1;
  font-size: 0.9rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.chat-input:focus {
  outline: none;
  border-color: #9147ff;
  box-shadow: 0 0 0 2px rgba(145, 71, 255, 0.5);
}
.chat-input::placeholder {
  color: #8d8d91;
}
</style>
