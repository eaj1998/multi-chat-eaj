<template>
  <div class="app-wrapper">
    <div class="chat-container">
      <div class="inputs">
        <input v-model="kickChannel" placeholder="Canal Kick" :disabled="(isKickConnected || isTwitchConnected)" />
        <input v-model="twitchChannel" placeholder="Canal Twitch" :disabled="(isKickConnected || isTwitchConnected)" />
        <button class="connect-btn" @click="connectSocket" :disabled="(isKickConnected || isTwitchConnected)"
          :title="(isKickConnected || isTwitchConnected) ? 'Desconecte antes para conectar outro canal' : ''">
          {{ isConnecting ? 'Conectando...' : 'Conectar' }}
        </button>

        <button class="connect-btn" @click="disconnectSocket"
          :disabled="isConnecting || (!isKickConnected && !isTwitchConnected)">
          Desconectar
        </button>
      </div>
      <div class="warning-wrapper">
        <small v-if="isKickConnected || isTwitchConnected" class="warning-text">
          ⚠ Para alterar o canal, desconecte primeiro
        </small>
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
import { onBeforeUnmount } from 'vue';

const apiUrl = import.meta.env.VITE_SOCKET_URL;

onBeforeUnmount(() => {
  disconnectSocket();
});

const kickChannel = ref('');
const twitchChannel = ref('');
const socket = ref(null);

const isKickConnected = ref(false);
const isTwitchConnected = ref(false);
const connectedKickChannel = ref('');
const connectedTwitchChannel = ref('');
const isConnecting = ref(false);

async function connectSocket() {
  if (socket.value) {
    socket.value.disconnect();
    socket.value = null;
  }

  isConnecting.value = true;

  socket.value = io(apiUrl, {
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

  socket.value.on('chat-message', (msg) => {
    window.dispatchEvent(new CustomEvent('chat-message', { detail: msg }));
  });
}

async function disconnectSocket() {
  try {
    await fetch(`${apiUrl}/disconnect-self?id=${socket.value.id}`, {
      method: 'POST'
    });

    if (socket.value) {
      socket.value.disconnect();
      socket.value = null;
    }
    isKickConnected.value = false;
    isTwitchConnected.value = false;
    connectedKickChannel.value = '';
    connectedTwitchChannel.value = '';
    kickChannel.value = '';
    twitchChannel.value = '';

  } catch (err) {
    console.error('Erro ao desconectar todas as conexões:', err);
  }
}


</script>

<style scoped>
.app-wrapper {
  min-height: 90dvh;
  display: flex;
  align-items: stretch;
  justify-content: flex-start;
  padding: 0;
  box-sizing: border-box;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  background-color: #18181b;

  padding: 12px;
  border-radius: 0;

  width: 850px;
  max-width: 100%;
  min-width: 280px;
  height: 90dvh;

}

.inputs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
  font-size: 16px;
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

.inputs input,
.inputs button {
  line-height: 1.2;
  flex: 1 1 auto;
  width: auto;
}

.inputs button:hover {
  background-color: #555;
}

.connect-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
  pointer-events: auto;
}

.warning-text {
  color: #ffcc00;
  font-size: 12px;
}

.warning-wrapper {
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
}


@media (max-width: 768px) {

  .chat-container {
    width: 100%;
    max-width: none;
    border-radius: 0;
    height: 100vh;
    padding: 8px;
  }

  .inputs {
    flex-direction: column;
  }

  .inputs button {
    width: 100%;
  }

  .inputs input {
    width: auto;
    height: 40px;
  }
}

@media (max-width: 480px) {
  .app-wrapper {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    min-height: 100dvh;
    min-width: 100%;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .chat-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    background-color: #18181b;
    border-radius: 0;
  }

  .inputs {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
  }

}
</style>
