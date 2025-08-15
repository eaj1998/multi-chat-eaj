<template>
  <div class="app-wrapper">
    <div class="chat-container">
      <h1>Multi CHAT by EAJ</h1>

      <div class="inputs">
        <input v-model="kickChannel" placeholder="Canal Kick" :disabled="isConnecting" />
        <input v-model="twitchChannel" placeholder="Canal Twitch" :disabled="isConnecting" />

        <button @click="connectSocket" :disabled="isConnecting || (isKickConnected || isTwitchConnected)">
          {{ isConnecting ? 'Conectando...' : 'Conectar' }}
        </button>

        <button @click="disconnectSocket" :disabled="isConnecting || (!isKickConnected && !isTwitchConnected)">
          Desconectar
        </button>
      </div>

      <ChatStream title="EAJOTA" :kickConnected="isKickConnected" :twitchConnected="isTwitchConnected"
        :kickUsername="connectedKickChannel" :twitchUsername="connectedTwitchChannel" />
    </div>
  </div>
</template>

<script setup>
import ChatStream from './components/ChatStream.vue';
import { ref } from 'vue';
import { io } from 'socket.io-client';

const kickChannel = ref('');
const twitchChannel = ref('');
const socket = ref(null);

const isKickConnected = ref(false);
const isTwitchConnected = ref(false);
const connectedKickChannel = ref('');
const connectedTwitchChannel = ref('');
const isConnecting = ref(false); 

async function connectSocket() {
  if (socket.value && socket.value.connected) return;

  isConnecting.value = true;

  socket.value = io('http://localhost:3000', {
    transports: ['websocket']
  });

  socket.value.on('connect', () => {
    console.log('✅ Conectado ao servidor');

    if (kickChannel.value) {
      socket.value.emit('join-kick', { username: kickChannel.value });
      isKickConnected.value = true;
      connectedKickChannel.value = kickChannel.value;
    }

    if (twitchChannel.value) {
      socket.value.emit('join-twitch', { username: twitchChannel.value });
      isTwitchConnected.value = true;
      connectedTwitchChannel.value = twitchChannel.value;
    }

    isConnecting.value = false;
  });

  socket.value.on('disconnect', () => {
    console.log('❌ Desconectado do servidor');
    isKickConnected.value = false;
    isTwitchConnected.value = false;
    connectedKickChannel.value = '';
    connectedTwitchChannel.value = '';
    isConnecting.value = false;
  });

  socket.value.off('chat-message');
  socket.value.on('chat-message', (msg) => {
    window.dispatchEvent(new CustomEvent('chat-message', { detail: msg }));
  });
}

function disconnectSocket() {
  if (socket.value) {
    socket.value.disconnect();
    socket.value = null;
    isKickConnected.value = false;
    isTwitchConnected.value = false;
    connectedKickChannel.value = '';
    connectedTwitchChannel.value = '';
  }
}
</script>


<style scoped>
.app-wrapper {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.chat-container {
  width: 700px;
  height: 90vh;
  display: flex;
  flex-direction: column;
  padding: 16px;
  box-sizing: border-box;
  background-color: #18181b;
  border-radius: 8px;
}

.inputs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.inputs input {
  flex: 1 1 0;
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid #36363a;
  background-color: #222;
  color: white;
}

.inputs button {
  padding: 6px 12px;
  background-color: #444;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.inputs button:hover {
  background-color: #555;
}
</style>