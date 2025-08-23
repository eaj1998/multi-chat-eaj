<template>
  <div class="app-wrapper" :class="isDarkMode ? 'theme-dark' : 'theme-light'">
    <div class="chat-container">
      <div class="inputs-wrapper">
        <div class="inputs">
          <input v-model="kickChannel" placeholder="Canal Kick" :disabled="(isKickConnected || isTwitchConnected)" />
          <input v-model="twitchChannel" placeholder="Canal Twitch"
            :disabled="(isKickConnected || isTwitchConnected)" />
          <button class="connect-btn" @click="connectSocket" :disabled="(isKickConnected || isTwitchConnected)"
            :title="(isKickConnected || isTwitchConnected) ? 'Desconecte antes para conectar outro canal' : ''">
            {{ isConnecting ? 'Conectando...' : 'Conectar' }}
          </button>

          <button class="connect-btn" @click="disconnectSocket"
            :disabled="isConnecting || (!isKickConnected && !isTwitchConnected)">
            Desconectar
          </button>
          <button class="settings-btn" @click="isModalVisible = true" title="Configurações">
            ⚙️
          </button>
        </div>
      </div>

      <ChatStream title="" :messages="messages" :kickConnected="isKickConnected" :twitchConnected="isTwitchConnected"
        :kickUsername="connectedKickChannel" :twitchUsername="connectedTwitchChannel" :isDarkMode="isDarkMode"
        :channelBadges="channelBadges" />
    </div>

    <SettingsModal :show="isModalVisible" @close="isModalVisible = false">
      <div class="theme-switcher">
        <div class="theme-label">
          <span class="icon">🌙</span>
          <span>Tema escuro</span>
        </div>

        <label class="switch">
          <input type="checkbox" v-model="isDarkMode">
          <span class="slider"></span> </label>
      </div>
    </SettingsModal>
  </div>
</template>

<script setup>
import ChatStream from './components/ChatStream.vue';
import SettingsModal from './components/SettingsModal.vue';
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';
import { io } from 'socket.io-client';

const isModalVisible = ref(false);
const isDarkMode = ref(false);

const apiUrl = import.meta.env.VITE_SOCKET_URL;

const messages = ref([]);
const kickChannel = ref('');
const twitchChannel = ref('');
const socket = ref(null);
const isKickConnected = ref(false);
const isTwitchConnected = ref(false);
const connectedKickChannel = ref('');
const connectedTwitchChannel = ref('');
const isConnecting = ref(false);
const channelBadges = ref({});

onBeforeUnmount(() => {
  disconnectSocket();
});

onMounted(() => {
  const savedMode = localStorage.getItem('darkMode');
  if (savedMode !== null) {
    isDarkMode.value = JSON.parse(savedMode);
  }

  if (isDarkMode.value) {
    document.body.classList.add('theme-dark');
  } else {
    document.body.classList.remove('theme-dark');
  }
});

watch(isDarkMode, (newValue) => {
  localStorage.setItem('darkMode', newValue);

  if (newValue) {
    document.body.classList.add('theme-dark');
  } else {
    document.body.classList.remove('theme-dark');
  }
});

async function connectSocket() {
  if (socket.value) {
    socket.value.disconnect();
    socket.value = null;
  }
  messages.value = [];
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

  socket.value.on('channel-badges', (badges) => {
    console.log('✅ [App.vue] Badges recebidos do socket:', badges); 
    channelBadges.value = badges;
    console.log('✅ [App.vue] Badges recebidos do socket e atribuidos:', channelBadges); 
  });

  socket.value.on('chat-message', (msg) => {
    messages.value.push({
      id: msg.timestamp + msg.username,
      type: 'chat',
      data: msg,
    });
  });

  socket.value.on('alert-message', (msg) => {
    messages.value.push({
      id: msg.timestamp + (msg.username || 'alert'),
      type: 'alert',
      data: msg,
    });
  });
}

async function disconnectSocket() {
  try {
    if (socket.value && socket.value.id) {
      await fetch(`${apiUrl}/disconnect-self?id=${socket.value.id}`, {
        method: 'POST'
      });
    }

    if (socket.value) {
      socket.value.off('chat-message');
      socket.value.off('alert-message');
      socket.value.disconnect();
      socket.value = null;
    }

    messages.value = [];
    isKickConnected.value = false;
    isTwitchConnected.value = false;
    connectedKickChannel.value = '';
    connectedTwitchChannel.value = '';
    kickChannel.value = '';
    twitchChannel.value = '';
  } catch (err) {
    console.error('Erro ao desconectar:', err);
  }
}

</script>

<style scoped>
.theme-switcher {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 90%;
  padding: 8px 12px;
  background-color: var(--bg-color-primary);
  border-radius: 6px;
}

.theme-label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
}

.theme-label .icon {
  font-size: 1.2rem;
}

.switch {
  position: relative;
  display: inline-block;
  width: 52px;
  height: 28px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #3e3e42;
  border: 2px solid #5a5a5e;
  border-radius: 28px;
  transition: all 0.3s ease-in-out;
}

.slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 2px;
  bottom: 2px;
  background-color: #d1d1d6;
  border-radius: 50%;
  transition: all 0.3s ease-in-out;
}

.slider:after {
  content: '✓';
  color: white;
  position: absolute;
  font-size: 12px;
  font-weight: bold;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
}

input:checked+.slider {
  background-color: #9146ff;
  border-color: #a970ff;
}

input:checked+.slider:before {
  transform: translateX(24px);
  background-color: white;
}

input:checked+.slider:after {
  opacity: 1;
}

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
  padding: 12px;
  border-radius: 0;
  width: 850px;
  max-width: 100%;
  min-width: 280px;
  height: 90dvh;
}

.inputs-wrapper {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.inputs {
  flex-grow: 1;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 16px;
}

.inputs input {
  flex: 1 1 0;
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background-color: var(--input-bg-color);
  color: var(--text-color-primary);
}

.inputs button,
.settings-btn {
  padding: 6px 12px;
  background-color: var(--btn-bg-color);
  color: var(--text-color-primary);
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.inputs button:hover,
.settings-btn:hover {
  background-color: var(--btn-hover-bg-color);
}


.inputs input,
.inputs button {
  line-height: 1.2;
  flex: 1 1 auto;
  width: auto;
}

.settings-btn {
  font-size: 1.2rem;
  line-height: 1;
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
    height: 100dvh; 
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
    background-color: #FFF;
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

<style>
:root {
  --bg-color-primary: #f0f2f5;
  --bg-color-secondary: #ffffff;
  --text-color-primary: #1c1e21;
  --text-color-secondary: #65676b;
  --border-color: #ced0d4;
  --input-bg-color: #ffffff;
  --btn-bg-color: #e4e6eb;
  --btn-hover-bg-color: #d8dadf;
}

.theme-dark {
  --bg-color-primary: #18181b;
  --bg-color-secondary: #222222;
  --text-color-primary: #e4e6eb;
  --text-color-secondary: #b0b3b8;
  --border-color: #36363a;
  --input-bg-color: #222222;
  --btn-bg-color: #444444;
  --btn-hover-bg-color: #555555;
}

.app-wrapper {
  background-color: var(--bg-color-primary);
  color: var(--text-color-primary);
}

.chat-container {
  background-color: var(--bg-color-primary);
}

.inputs input {
  background-color: var(--input-bg-color);
  border: 1px solid var(--border-color);
  color: var(--text-color-primary);
}

.inputs button,
.settings-btn {
  background-color: var(--btn-bg-color);
  color: var(--text-color-primary);
  border: none;
}

.inputs button:hover,
.settings-btn:hover {
  background-color: var(--btn-hover-bg-color);
}

.chat-stream {
  background-color: var(--bg-color-secondary);
  border: 1px solid var(--border-color);
}

body {
  background-color: var(--bg-color-primary);
}
</style>
